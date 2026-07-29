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
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
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

        // We rely on MediaPipe's native lazy initialization during the first send() call
        // instead of forcing it here, which prevents the strict mode CDN load failure.
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
    if (!this.isInitialized || !this.hands) return;
    console.log("📹 Sending frame to MediaPipe");
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
