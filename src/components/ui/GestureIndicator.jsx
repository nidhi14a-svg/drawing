import React from 'react';
import { GESTURES } from '@/services/gestureRecognitionService';
import { Hand, Pencil, Eraser, MousePointer2, Move } from 'lucide-react';

export default function GestureIndicator({ gesture }) {
  const getGestureInfo = () => {
    switch(gesture) {
      case GESTURES.DRAW: return { icon: Pencil, text: 'Drawing', color: 'text-green-400' };
      case GESTURES.ERASE: return { icon: Eraser, text: 'Erasing', color: 'text-red-400' };
      case GESTURES.COLOR_SELECTION: return { icon: MousePointer2, text: 'Selecting Color', color: 'text-blue-400' };
      case GESTURES.BRUSH_SIZE: return { icon: Move, text: 'Adjusting Brush', color: 'text-yellow-400' };
      default: return { icon: Hand, text: 'Idle', color: 'text-gray-400' };
    }
  };

  const { icon: Icon, text, color } = getGestureInfo();

  return (
    <div className="bg-slate-700/50 rounded-xl p-3 md:p-4 flex items-center gap-4 border border-slate-600 backdrop-blur-sm w-full transition-colors duration-300">
      <div className={`p-2.5 md:p-3 rounded-lg bg-slate-800 shadow-inner ${color}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Active Status</p>
        <p className={`font-bold tracking-wide text-sm md:text-base ${color}`}>{text}</p>
      </div>
    </div>
  );
}
