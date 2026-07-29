import * as MP from '@mediapipe/hands';

class MediaPipeService {
  constructor() {
    this.hands = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.callbacks = [];
  }

  /**
   * Initializes the MediaPipe Hands model asynchronously.
   */
  async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Handle Vite ESM/CJS interop for MediaPipe
        const HandsConstructor = MP.Hands || MP.default?.Hands || window.Hands;
        const MPVersion = MP.VERSION || MP.default?.VERSION || '0.4.1675469240';

        if (!HandsConstructor) {
          throw new Error("Hands constructor not found in @mediapipe/hands package.");
        }

        this.hands = new HandsConstructor({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MPVersion}/${file}`;
          }
        });

        this.hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.2,
          minTrackingConfidence: 0.2,
          selfieMode: true,
          refineLandmarks: true,
          runningMode: 'VIDEO'
        });

        this.hands.onResults((results) => {
          console.log("MediaPipe callback fired");
          console.log(results.multiHandLandmarks);
          this.callbacks.forEach(cb => {
            try {
              cb(results);
            } catch (err) {
              console.error("Error in MediaPipe onResults callback:", err);
            }
          });
        });

        // Explicitly initialize the AI model before allowing frames to be processed.
        // This prevents the WebGL context from initializing concurrently with the first frame,
        // which can permanently corrupt the tensor dimensions.
        await this.hands.initialize();
        this.isInitialized = true;
      } catch (error) {
        console.error("Failed to initialize MediaPipe Hands:", error);
        throw new Error(`Failed to initialize hand tracking AI. Reason: ${error.message}`);
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Sends a video frame to MediaPipe for processing.
   * @param {HTMLVideoElement} videoElement
   */
  async processFrame(videoElement) {
    if (!this.isInitialized || !this.hands || !videoElement) return;
    if (!videoElement.videoWidth || !videoElement.videoHeight) return;
    if (videoElement.readyState < 2) return;

    try {
      await this.hands.send({ image: videoElement });
    } catch (error) {
      console.error("Error processing frame through MediaPipe:", error);
      throw new Error(`MediaPipe processing failed: ${error.message}`);
    }
  }

  /**
   * Subscribes to the processed hand landmark results.
   * @param {Function} callback 
   */
  onResults(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Emits a synthetic or fallback result set to subscribers.
   * @param {Object} results
   */
  emitResults(results) {
    this.callbacks.forEach(cb => {
      try {
        cb(results);
      } catch (err) {
        console.error('Error in emitted MediaPipe results callback:', err);
      }
    });
  }

  /**
   * Removes a subscription.
   * @param {Function} callback 
   */
  removeCallback(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Disposes the MediaPipe instance and cleans up memory.
   */
  dispose() {
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
    this.isInitialized = false;
    this.callbacks = [];
  }
}

export const mediapipeService = new MediaPipeService();
