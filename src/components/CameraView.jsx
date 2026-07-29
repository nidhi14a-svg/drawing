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
  const animationFrameId = useRef(null);
  const lastVideoTime = useRef(-1);
  const isRunning = useRef(false);

  const processVideo = async () => {
    if (!isRunning.current) return;
    
    try {
      if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        // Explicitly set HTML properties to prevent 0x0 tensor bug in MediaPipe
        if (!videoRef.current.width) {
          videoRef.current.width = videoRef.current.videoWidth;
          videoRef.current.height = videoRef.current.videoHeight;
        }

        if (videoRef.current.currentTime !== lastVideoTime.current) {
          lastVideoTime.current = videoRef.current.currentTime;
          await mediapipeService.processFrame(videoRef.current);
        }
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

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Initialize MediaPipe
      await mediapipeService.initialize();

      // 2. Start Camera
      await cameraService.startCamera(videoRef.current);
      
      setIsActive(true);
      isRunning.current = true;

      // 3. Start processing loop
      processVideo();
    } catch (err) {
      setError(err.message);
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    isRunning.current = false;
    cameraService.stopCamera();
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setIsActive(false);
    
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
    
    // Auto-start on mount
    handleStart();
    
    return () => {
      isRunning.current = false;
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
