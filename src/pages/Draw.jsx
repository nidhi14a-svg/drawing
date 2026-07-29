import React, { useEffect, useRef, useState } from 'react';
import CameraView from '@/components/CameraView';
import Toolbar from '@/components/ui/Toolbar';
import ColorPalette from '@/components/ui/ColorPalette';
import BrushControls from '@/components/ui/BrushControls';
import GestureIndicator from '@/components/ui/GestureIndicator';
import { canvasEngine } from '@/services/canvasEngine';
import { mediapipeService } from '@/services/mediapipeService';
import { gestureRecognitionEngine, GESTURES } from '@/services/gestureRecognitionService';
import { exportService } from '@/services/exportService';

export default function Draw() {
  const canvasContainerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const previousGesture = useRef(GESTURES.IDLE);
  
  // UI Reactive State
  const [currentGesture, setCurrentGesture] = useState(GESTURES.IDLE);
  const [activeColor, setActiveColor] = useState('#EC4899'); // Start with a vibrant color
  const [activeThickness, setActiveThickness] = useState(8);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [pointerPosition, setPointerPosition] = useState(null);

  useEffect(() => {
    // 1. Initialize Canvas Engine
    if (canvasRef.current) {
      canvasEngine.initialize(canvasRef.current);
    }

    // 2. Connect Data Flow: MediaPipe -> Gesture Engine
    const handleMediaPipeResults = (results) => {
      gestureRecognitionEngine.processResults(results);
    };
    mediapipeService.onResults(handleMediaPipeResults);

    // 3. Connect Data Flow: Gesture Engine -> Canvas Engine + UI State
    const handleGesture = (payload) => {
      const { gesture, pointer, imageWidth, imageHeight } = payload;
      
      // Sync React state for the Gesture Indicator UI
      setCurrentGesture(prev => prev !== gesture ? gesture : prev);
      setCameraAvailable(true);
      
      if (!pointer || !canvasContainerRef.current || !imageWidth || !imageHeight) {
        if (canvasEngine.isDrawing) canvasEngine.endStroke();
        previousGesture.current = GESTURES.IDLE;
        return;
      }

      const rect = canvasContainerRef.current.getBoundingClientRect();
      const videoRatio = imageWidth / imageHeight;
      const containerRatio = rect.width / rect.height;
      
      let renderWidth = rect.width;
      let renderHeight = rect.height;
      let offsetX = 0;
      let offsetY = 0;

      // With object-contain, the video fits entirely inside the container.
      if (videoRatio > containerRatio) {
        renderHeight = rect.width / videoRatio;
        offsetY = (rect.height - renderHeight) / 2;
      } else {
        renderWidth = rect.height * videoRatio;
        offsetX = (rect.width - renderWidth) / 2;
      }

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      // Map normalized coordinates into the visible video frame area.
      // CameraView CSS mirrors the video (scaleX(-1)), so invert X.
      const mappedX = clamp((1 - pointer.x) * renderWidth + offsetX, 0, rect.width);
      const mappedY = clamp(pointer.y * renderHeight + offsetY, 0, rect.height);

      if (gesture === GESTURES.DRAW) {
        setPointerPosition({ x: mappedX, y: mappedY });
        if (previousGesture.current !== GESTURES.DRAW) {
          canvasEngine.setBrush(null, null, false);
          canvasEngine.beginStroke(mappedX, mappedY);
        } else {
          canvasEngine.continueStroke(mappedX, mappedY);
        }
      } 
      else if (gesture === GESTURES.ERASE) {
        setPointerPosition({ x: mappedX, y: mappedY });
        if (previousGesture.current !== GESTURES.ERASE) {
          canvasEngine.setBrush(null, activeThickness * 4, true); 
          canvasEngine.beginStroke(mappedX, mappedY);
        } else {
          canvasEngine.continueStroke(mappedX, mappedY);
        }
      } 
      else {
        if (canvasEngine.isDrawing) {
          canvasEngine.endStroke();
        }
        setPointerPosition(null);
      }

      previousGesture.current = gesture;
    };

    gestureRecognitionEngine.onGesture(handleGesture);

    // 4. Teardown
    return () => {
      mediapipeService.removeCallback(handleMediaPipeResults);
      gestureRecognitionEngine.removeCallback(handleGesture);
      canvasEngine.dispose();
    };
  }, [activeThickness]); 
  // Dependency array includes activeThickness so the erase logic closure has the latest multiplier

  // Sync React UI settings instantly to the Canvas Engine
  useEffect(() => {
    canvasEngine.setBrush(activeColor, activeThickness, false);
  }, [activeColor, activeThickness]);

  // Toolbar Handlers
  const handleUndo = () => canvasEngine.undo();
  const handleRedo = () => canvasEngine.redo();
  const handleClear = () => canvasEngine.clear();
  const handleExport = () => {
    try {
      if (canvasRef.current) {
        exportService.exportCanvasAsPNG(
          canvasRef.current, 
          `gesture-drawing-${new Date().getTime()}.png`
        );
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-900 overflow-hidden font-sans text-slate-200">
      
      {/* Sidebar UI Components */}
      <aside className="w-full md:w-80 bg-slate-800 p-4 md:p-6 flex flex-row md:flex-col gap-6 md:gap-8 shadow-[10px_0_15px_-3px_rgba(0,0,0,0.5)] z-20 border-b md:border-b-0 md:border-r border-slate-700 overflow-x-auto md:overflow-y-auto shrink-0 items-center md:items-stretch">
        
        <div className="hidden md:block">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-6 flex items-center gap-2">
            <span className="text-indigo-500">❖</span> GestureDraw
          </h2>
        </div>

        <div className="shrink-0 w-48 md:w-auto">
          <GestureIndicator gesture={currentGesture} />
          {!cameraAvailable && (
            <p className="mt-2 text-xs text-amber-300">
              Camera blocked by browser. Drawing remains available manually.
            </p>
          )}
        </div>
        
        <div className="shrink-0">
          <ColorPalette 
            activeColor={activeColor} 
            onChange={setActiveColor} 
          />
        </div>
        
        <div className="shrink-0 w-48 md:w-auto md:px-2">
          <BrushControls 
            thickness={activeThickness} 
            onChange={setActiveThickness} 
          />
        </div>
        
        <div className="shrink-0 md:mt-auto md:pt-6 md:border-t border-slate-700/50">
          <Toolbar 
            onUndo={handleUndo} 
            onRedo={handleRedo} 
            onClear={handleClear} 
            onExport={handleExport} 
          />
        </div>
      </aside>

      {/* Main Drawing Area */}
      <main className="flex-1 relative flex items-center justify-center p-2 md:p-8 bg-slate-950/70">
        <div 
          ref={canvasContainerRef}
          className="w-full max-w-6xl aspect-video bg-black relative rounded-xl md:rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] ring-1 ring-slate-700/50 overflow-hidden"
        >
          {/* Background Layer: Camera Preview */}
          <div className="absolute inset-0 z-0">
            <CameraView />
          </div>
          
          {/* Foreground Layer: Drawing Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 w-full h-full touch-none pointer-events-none"
          />

          {pointerPosition && (
            <div
              className="absolute z-30 pointer-events-none"
              style={{
                left: pointerPosition.x,
                top: pointerPosition.y,
                transform: 'translate(-50%, -50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid rgba(248, 113, 113, 0.95)',
                boxShadow: '0 0 0 1px rgba(248, 113, 113, 0.4)',
                mixBlendMode: 'screen'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '50%',
                  width: 2,
                  height: 2,
                  marginLeft: -1,
                  marginTop: -1,
                  background: '#F87171',
                  borderRadius: '50%'
                }}
              />
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
