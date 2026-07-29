export const GESTURES = {
  IDLE: 'IDLE',
  DRAW: 'DRAW',
  ERASE: 'ERASE',
  COLOR_SELECTION: 'COLOR_SELECTION',
  BRUSH_SIZE: 'BRUSH_SIZE'
};

class GestureRecognitionEngine {
  constructor() {
    this.gestureHistory = [];
    this.historyLength = 5; // Shorter buffer for faster feedback
    
    // Smoothing properties (Exponential Moving Average)
    this.smoothedPointer = null;
    this.lastPointer = null;
    this.smoothingFactor = 0.22; // Lower latency for quicker drawing response
    this.pointerThreshold = 0.006; // Ignore micro-movements

    this.currentGesture = GESTURES.IDLE;
    this.callbacks = [];
  }

  /**
   * Calculates the 3D Euclidean distance between two points.
   */
  getDistance(p1, p2) {
    return Math.hypot(
      p1.x - p2.x,
      p1.y - p2.y,
      (p1.z || 0) - (p2.z || 0)
    );
  }

  /**
   * Determines if a finger is extended relative to its MCP and PIP joints.
   */
  isFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx, threshold = 1.08) {
    const tipPoint = landmarks[tipIdx];
    const pipPoint = landmarks[pipIdx];
    const mcpPoint = landmarks[mcpIdx];

    if (!tipPoint || !pipPoint || !mcpPoint) return false;

    const tipPipDist = this.getDistance(tipPoint, pipPoint);
    const pipMcpDist = this.getDistance(pipPoint, mcpPoint);
    return tipPipDist > pipMcpDist * threshold;
  }

  /**
   * Specifically handles thumb extension logic.
   */
  isThumbExtended(landmarks) {
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const indexMcp = landmarks[5];

    if (!thumbTip || !thumbBase || !indexMcp) return false;

    const tipToBase = this.getDistance(thumbTip, thumbBase);
    const baseToIndex = this.getDistance(thumbBase, indexMcp);
    return tipToBase > baseToIndex * 0.85;
  }

  /**
   * Analyzes raw landmarks to classify the current frame's gesture based on new requirements.
   */
  detectRawGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return GESTURES.IDLE;
    }

    const indexTip = landmarks[8];
    const indexPip = landmarks[6];
    const middleTip = landmarks[12];
    const middlePip = landmarks[10];
    const ringTip = landmarks[16];
    const ringPip = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyPip = landmarks[18];
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const wrist = landmarks[0];

    const indexOpen = this.isFingerExtended(landmarks, 8, 6, 5, 1.1);
    const middleOpen = this.isFingerExtended(landmarks, 12, 10, 9, 1.1);
    const ringOpen = this.isFingerExtended(landmarks, 16, 14, 13, 1.1);
    const pinkyOpen = this.isFingerExtended(landmarks, 20, 18, 17, 1.1);
    const thumbOpen = this.isThumbExtended(landmarks);

    const onlyIndexExtended = indexOpen && !middleOpen && !ringOpen && !pinkyOpen;
    const mostlyIndexExtended = indexOpen && !middleOpen && !ringOpen && !pinkyOpen;
    const allFingersClosed = !thumbOpen && !indexOpen && !middleOpen && !ringOpen && !pinkyOpen;
    const openPalm = thumbOpen && indexOpen && middleOpen && ringOpen && pinkyOpen;

    if (onlyIndexExtended || mostlyIndexExtended) {
      return GESTURES.DRAW;
    }

    if (allFingersClosed) {
      return GESTURES.ERASE;
    }

    if (openPalm) {
      return GESTURES.IDLE;
    }

    return GESTURES.IDLE;
  }

  /**
   * Processes the raw results from MediaPipe.
   * Expected to be called on every frame.
   */
  processResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.resetState();
      return;
    }

    // For primary gestures, focus on the first detected hand
    const primaryHandLandmarks = results.multiHandLandmarks[0];
    
    // 1. Detect raw gesture
    const rawGesture = this.detectRawGesture(primaryHandLandmarks);
    
    // 2. Stabilize gesture detection
    this.gestureHistory.push(rawGesture);
    if (this.gestureHistory.length > this.historyLength) {
      this.gestureHistory.shift();
    }
    const stabilizedGesture = this.getDominantGesture(this.gestureHistory);
    
    // 3. Smooth coordinates (Index finger tip is the primary pointer: landmark 8)
    const rawPointer = primaryHandLandmarks[8];
    if (!rawPointer) {
      this.resetState();
      return;
    }

    if (!this.smoothedPointer) {
      this.smoothedPointer = { ...rawPointer };
    } else {
      this.smoothedPointer.x += this.smoothingFactor * (rawPointer.x - this.smoothedPointer.x);
      this.smoothedPointer.y += this.smoothingFactor * (rawPointer.y - this.smoothedPointer.y);
      this.smoothedPointer.z += this.smoothingFactor * ((rawPointer.z || 0) - (this.smoothedPointer.z || 0));
    }

    if (!this.lastPointer || this.getDistance(this.smoothedPointer, this.lastPointer) > this.pointerThreshold) {
      this.lastPointer = { ...this.smoothedPointer };
    }

    // 4. Update state and broadcast
    this.currentGesture = stabilizedGesture;
    this.broadcast(this.lastPointer, rawPointer, results.image?.width || 640, results.image?.height || 480);
  }

  /**
   * Finds the most frequent gesture in the recent history buffer.
   */
  getDominantGesture(history) {
    const counts = {};
    let dominant = GESTURES.IDLE;
    let maxCount = 0;
    
    for (const g of history) {
      counts[g] = (counts[g] || 0) + 1;
      if (counts[g] > maxCount) {
        maxCount = counts[g];
        dominant = g;
      }
    }
    
    // Require a strong majority to transition to a new state
    if (maxCount >= Math.floor(this.historyLength / 2) + 1) {
      return dominant;
    }
    return this.currentGesture;
  }

  resetState() {
    this.gestureHistory = [];
    this.smoothedPointer = null;
    this.broadcast(this.smoothedPointer, null, 0, 0);
  }

  broadcast(smoothedPointer, rawPointer, imageWidth = 0, imageHeight = 0) {
    const payload = {
      gesture: this.currentGesture,
      pointer: smoothedPointer ? { ...smoothedPointer } : null,
      rawPointer: rawPointer ? { ...rawPointer } : null,
      imageWidth,
      imageHeight
    };

    this.callbacks.forEach(cb => cb(payload));
  }

  /**
   * Subscribe to gesture events.
   */
  onGesture(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Remove subscription.
   */
  removeCallback(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }
}

export const gestureRecognitionEngine = new GestureRecognitionEngine();
