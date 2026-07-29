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
    this.historyLength = 7; // Frames required for stabilization to reduce flickering
    
    // Smoothing properties (Exponential Moving Average)
    this.smoothedPointer = null;
    this.smoothingFactor = 0.35; // 0.0 to 1.0 (lower = smoother but higher latency)

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
   * Determines if a standard finger is extended.
   * Compares the distance of the tip to the wrist vs the PIP joint to the wrist.
   */
  isFingerExtended(landmarks, tipIdx, pipIdx) {
    const distTip = this.getDistance(landmarks[0], landmarks[tipIdx]);
    const distPip = this.getDistance(landmarks[0], landmarks[pipIdx]);
    return distTip > distPip;
  }

  /**
   * Specifically handles thumb extension logic.
   */
  isThumbExtended(landmarks) {
    const tipToPinkyBase = this.getDistance(landmarks[4], landmarks[17]);
    const mcpToPinkyBase = this.getDistance(landmarks[2], landmarks[17]);
    return tipToPinkyBase > mcpToPinkyBase;
  }

  /**
   * Analyzes raw landmarks to classify the current frame's gesture based on new requirements.
   */
  detectRawGesture(landmarks) {
    const thumbOpen = this.isThumbExtended(landmarks);
    const indexOpen = this.isFingerExtended(landmarks, 8, 6);
    const middleOpen = this.isFingerExtended(landmarks, 12, 10);
    const ringOpen = this.isFingerExtended(landmarks, 16, 14);
    const pinkyOpen = this.isFingerExtended(landmarks, 20, 18);

    // Calculate pinch distances
    const thumbIndexPinchDist = this.getDistance(landmarks[4], landmarks[8]);
    
    // Normalize distance by palm size to make it scale-invariant
    const palmSize = this.getDistance(landmarks[0], landmarks[9]);
    const isThumbIndexPinching = (thumbIndexPinchDist / palmSize) < 0.15;

    // Highest priority: Brush Size (Thumb + Index Pinch)
    // Ensure other fingers are mostly closed to prevent accidental triggers while grasping
    if (isThumbIndexPinching && !middleOpen && !ringOpen && !pinkyOpen) {
      return GESTURES.BRUSH_SIZE;
    }

    // Colour Selection: Index + Middle extended, others closed
    if (indexOpen && middleOpen && !ringOpen && !pinkyOpen && !thumbOpen) {
      return GESTURES.COLOR_SELECTION;
    }

    // Draw: Index finger only extended
    if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen && !thumbOpen) {
      return GESTURES.DRAW;
    }

    // Erase: Closed fist (all fingers closed)
    if (!thumbOpen && !indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
      return GESTURES.ERASE;
    }

    // Idle: Open palm (all fingers extended)
    if (thumbOpen && indexOpen && middleOpen && ringOpen && pinkyOpen) {
      return GESTURES.IDLE;
    }

    // Fallback to idle for unrecognized poses
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
    
    if (!this.smoothedPointer) {
      this.smoothedPointer = { ...rawPointer };
    } else {
      this.smoothedPointer.x += this.smoothingFactor * (rawPointer.x - this.smoothedPointer.x);
      this.smoothedPointer.y += this.smoothingFactor * (rawPointer.y - this.smoothedPointer.y);
      this.smoothedPointer.z += this.smoothingFactor * ((rawPointer.z || 0) - (this.smoothedPointer.z || 0));
    }

    // 4. Update state and broadcast
    this.currentGesture = stabilizedGesture;
    this.broadcast(this.smoothedPointer, rawPointer, results.image?.width, results.image?.height);
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
    if (this.currentGesture !== GESTURES.IDLE) {
      this.currentGesture = GESTURES.IDLE;
      this.broadcast(null, null, 0, 0);
    }
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
