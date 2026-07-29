class CameraService {
  constructor() {
    this.stream = null;
    this.videoElement = null;
  }

  /**
   * Requests camera permission and starts the video stream.
   * @param {HTMLVideoElement} videoElement - The video element to attach the stream to.
   * @param {MediaStreamConstraints} constraints - Optional constraints for the camera.
   * @returns {Promise<MediaStream>} The requested media stream.
   */
  async startCamera(videoElement, constraints = { video: true, audio: false }) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API is not supported in this browser. Please use a modern browser.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement = videoElement;
      
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        
        // Wait for the video to be ready
        return new Promise((resolve) => {
          this.videoElement.onloadedmetadata = () => {
            this.videoElement.play().catch(e => console.error('Error playing video:', e));
            resolve(this.stream);
          };
        });
      }
      
      return this.stream;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No camera hardware found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another application.');
      }
      throw err;
    }
  }

  /**
   * Stops the camera and releases the hardware resources.
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Retrieves the current active video stream reference.
   * @returns {MediaStream | null}
   */
  getVideoStream() {
    return this.stream;
  }
}

// Export as a singleton for app-wide use
export const cameraService = new CameraService();
