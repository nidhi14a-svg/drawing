import React from 'react';
import { Undo2, Redo2, Trash2, Download } from 'lucide-react';

export default function Toolbar({ onUndo, onRedo, onClear, onExport }) {
  const ActionButton = ({ icon: Icon, label, onClick, danger = false }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-xl transition-all group min-w-[70px] ${
        danger 
          ? 'hover:bg-red-500/20 text-slate-300 hover:text-red-400' 
          : 'bg-slate-700/50 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400'
      }`}
    >
      <Icon size={20} className="mb-1.5 transition-transform group-hover:-translate-y-0.5" />
      <span className="text-[10px] md:text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-3 h-full justify-center md:justify-start">
      <h3 className="hidden md:block text-sm font-semibold text-slate-300 uppercase tracking-wide">Actions</h3>
      <div className="grid grid-cols-4 md:grid-cols-2 gap-2 md:gap-3">
        <ActionButton icon={Undo2} label="Undo" onClick={onUndo} />
        <ActionButton icon={Redo2} label="Redo" onClick={onRedo} />
        <ActionButton icon={Download} label="Export" onClick={onExport} />
        <ActionButton icon={Trash2} label="Clear" onClick={onClear} danger />
      </div>
    </div>
  );
}
