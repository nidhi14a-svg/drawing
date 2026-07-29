import React from 'react';

const COLORS = [
  '#FFFFFF', '#000000', '#EF4444', '#F97316', '#F59E0B',
  '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'
];

export default function ColorPalette({ activeColor, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs md:text-sm font-semibold text-slate-300 uppercase tracking-wide">Palette</h3>
      <div className="grid grid-cols-5 gap-2 md:gap-3">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-transform hover:scale-110 active:scale-95 ${
              activeColor === c ? 'ring-4 ring-offset-2 ring-offset-slate-800 ring-indigo-500' : 'ring-1 ring-white/20'
            }`}
            style={{ backgroundColor: c }}
            title={c}
            aria-label={`Select color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
