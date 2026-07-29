import React, { useEffect, useRef, useState } from 'react';
import { cameraService } from '@/services/cameraService';
import { mediapipeService } from '@/services/mediapipeService';
import * as MPDrawing from '@mediapipe/drawing_utils';
import * as MPHands from '@mediapipe/hands';

const drawConnectors = MPDrawing.drawConnectors || MPDrawing.default?.drawConnectors || window.drawConnectors;
const drawLandmarks = MPDrawing.drawLandmarks || MPDrawing.default?.drawLandmarks || window.drawLandmarks;
const HAND_CONNECTIONS = MPHands.HAND_CONNECTIONS || MPHands.default?.HAND_CONNECTIONS || window.HAND_CONNECTIONS;

export default function CameraView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const animationFrameId = useRef(null);
  const demoTimerRef = useRef(null);
  const demoPhaseRef = useRef(0);
  const isRunning = useRef(false);

  const processVideo = async () => {
    if (!isRunning.current) return;

    try {
      const videoElement = videoRef.current;
      if (videoElement && videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        if (!videoElement.width) {
          videoElement.width = videoElement.videoWidth;
          videoElement.height = videoElement.videoHeight;
        }

        await mediapipeService.processFrame(videoElement);
      }

      if (isRunning.current) {
        animationFrameId.current = requestAnimationFrame(processVideo);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      handleStop();
    }
  };

  const createDemoLandmarks = (phase) => {
    const landmarks = Array.from({ length: 21 }, (_, index) => ({
      x: 0.5 + (index % 4 - 1.5) * 0.02,
      y: 0.5 + Math.floor(index / 4) * 0.02,
      z: 0
    }));

    landmarks[0] = { x: 0.48, y: 0.54, z: 0 };
    landmarks[2] = { x: 0.50, y: 0.48, z: 0 };
    landmarks[4] = { x: 0.44, y: 0.44, z: 0 };
    landmarks[5] = { x: 0.53, y: 0.44, z: 0 };
    landmarks[6] = { x: 0.58, y: 0.40, z: 0 };
    landmarks[7] = { x: 0.62, y: 0.36, z: 0 };
    landmarks[8] = { x: 0.70, y: 0.30, z: 0 };
    landmarks[9] = { x: 0.55, y: 0.44, z: 0 };
    landmarks[10] = { x: 0.56, y: 0.46, z: 0 };
    landmarks[11] = { x: 0.56, y: 0.50, z: 0 };
    landmarks[12] = { x: 0.56, y: 0.54, z: 0 };
    landmarks[13] = { x: 0.54, y: 0.43, z: 0 };
    landmarks[14] = { x: 0.52, y: 0.47, z: 0 };
    landmarks[15] = { x: 0.50, y: 0.50, z: 0 };
    landmarks[16] = { x: 0.48, y: 0.54, z: 0 };
    landmarks[17] = { x: 0.50, y: 0.42, z: 0 };
    landmarks[18] = { x: 0.48, y: 0.46, z: 0 };
    landmarks[19] = { x: 0.46, y: 0.50, z: 0 };
    landmarks[20] = { x: 0.44, y: 0.54, z: 0 };

    if (phase === 'erase') {
      landmarks[4] = { x: 0.42, y: 0.48, z: 0 };
      landmarks[8] = { x: 0.50, y: 0.50, z: 0 };
      landmarks[12] = { x: 0.50, y: 0.50, z: 0 };
      landmarks[16] = { x: 0.50, y: 0.50, z: 0 };
      landmarks[20] = { x: 0.50, y: 0.50, z: 0 };
    }

    if (phase === 'idle') {
      landmarks[8] = { x: 0.66, y: 0.40, z: 0 };
      landmarks[12] = { x: 0.60, y: 0.44, z: 0 };
      landmarks[16] = { x: 0.56, y: 0.48, z: 0 };
      landmarks[20] = { x: 0.52, y: 0.52, z: 0 };
    }

    return landmarks;
  };

  const startDemoMode = (message) => {
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
    }

    setIsDemoMode(true);
    setIsActive(true);
    setError(null);
    setStatusMessage(message || 'Camera unavailable. Demo hand tracking is running.');
    isRunning.current = true;
    demoPhaseRef.current = 0;

    demoTimerRef.current = window.setInterval(() => {
      const phase = demoPhaseRef.current % 3 === 0 ? 'draw' : demoPhaseRef.current % 3 === 1 ? 'erase' : 'idle';
      const landmarks = createDemoLandmarks(phase);
      mediapipeService.emitResults({
        multiHandLandmarks: [landmarks],
        image: { width: 640, height: 480 }
      });
      demoPhaseRef.current += 1;
    }, 220);
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('');
    try {
      if (!videoRef.current) {
        throw new Error('Video element is not ready yet.');
      }

      await mediapipeService.initialize();
      await cameraService.startCamera(videoRef.current);

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (videoRef.current && videoRef.current.srcObject) {
        setIsDemoMode(false);
        setIsActive(true);
        isRunning.current = true;
        processVideo();
      } else {
        throw new Error('Camera stream did not attach to the video element.');
      }
    } catch (err) {
      const message = err.message || 'Unable to start camera tracking.';
      setError(null);
      setStatusMessage(`${message}. Falling back to demo hand tracking.`);
      startDemoMode(`${message}. Falling back to demo hand tracking.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    isRunning.current = false;
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    cameraService.stopCamera();
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setIsActive(false);
    setIsDemoMode(false);
    setStatusMessage('');
    
    // Clear canvas
    const canvasCtx = canvasRef.current?.getContext('2d');
    if (canvasCtx && canvasRef.current) {
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  useEffect(() => {
    // MediaPipe Results Callback for Debug Drawing
    const onResults = (results) => {
      const canvasCtx = canvasRef.current?.getContext('2d');
      const canvasElement = canvasRef.current;
      const videoElement = videoRef.current;
      
      if (!canvasCtx || !canvasElement || !videoElement) return;

      // Sync canvas resolution to video intrinsic resolution
      if (canvasElement.width !== videoElement.videoWidth) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
      }

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Mirror the canvas context to match the CSS mirrored video
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1);

      try {
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            if (drawConnectors && HAND_CONNECTIONS) {
              drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 3
              });
            }
            if (drawLandmarks) {
              drawLandmarks(canvasCtx, landmarks, {
                color: '#FF0000',
                lineWidth: 1,
                radius: 4
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to draw landmarks:", err);
      }
      canvasCtx.restore();
    };

    mediapipeService.onResults(onResults);

    return () => {
      isRunning.current = false;
      if (demoTimerRef.current) {
        clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
      }
      mediapipeService.removeCallback(onResults);
      mediapipeService.dispose();
      cameraService.stopCamera();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 relative rounded-lg overflow-hidden shadow-lg border border-gray-800">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-contain ${!isActive ? 'opacity-0' : 'opacity-100'}`}
        style={{ transform: 'scaleX(-1)' }}
      />

      {!isActive && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
            Camera is waiting for permission and stream initialization.
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-full border border-indigo-500/30 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 shadow-lg">
          {statusMessage}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${!isActive ? 'opacity-0' : 'opacity-100'}`}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-10">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Initializing AI tracking...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10 p-6 text-center">
          <div className="bg-red-500/10 border border-red-500 rounded p-4 max-w-md">
            <p className="text-red-400 font-bold mb-2">Error</p>
            <p className="mb-4 text-sm">{error}</p>
            <button 
              onClick={handleStart}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded transition text-sm font-medium"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
        {isActive && (
          <button 
            onClick={handleStop}
            className="px-4 py-2 bg-red-600/90 hover:bg-red-700 text-white rounded-full shadow backdrop-blur-sm transition text-sm font-medium"
          >
            Stop Camera
          </button>
        )}
        {!isActive && !isLoading && !error && (
          <button 
            onClick={handleStart}
            className="px-4 py-2 bg-green-600/90 hover:bg-green-700 text-white rounded-full shadow backdrop-blur-sm transition text-sm font-medium"
          >
            Start Camera
          </button>
        )}
      </div>
    </div>
  );
}
