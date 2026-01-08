
import React from 'react';
import { Info, X } from 'lucide-react';

interface ErrorToastProps {
  error: string | null;
  onClose: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose }) => {
  if (!error) return null;
  
  return (
    <div className="fixed bottom-10 right-10 z-[100] max-w-sm p-6 glass-panel border-rose-500/20 rounded-[32px] flex items-start gap-4 shadow-2xl animate-in slide-in-from-right-10">
      <div className="w-10 h-10 bg-rose-500/10 rounded-2xl flex items-center justify-center shrink-0">
        <Info className="w-5 h-5 text-rose-500" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">System Alert</p>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">{error}</p>
      </div>
      <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
    </div>
  );
};
