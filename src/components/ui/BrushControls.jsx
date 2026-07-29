import React from 'react';

export default function BrushControls({ thickness, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs md:text-sm font-semibold text-slate-300 uppercase tracking-wide">Brush Size</h3>
        <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-slate-300">{thickness}px</span>
      </div>
      <input
        type="range"
        min="1"
        max="50"
        value={thickness}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
      />
    </div>
  );
}
