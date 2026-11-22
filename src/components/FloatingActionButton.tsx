import React from 'react';
import { Plus } from 'lucide-react';
import { triggerHaptic } from '../lib/supabase';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  label = 'Add',
}) => {
  return (
    <button
      onClick={() => {
        triggerHaptic(15);
        onClick();
      }}
      aria-label="Add new entry"
      className="fixed right-5 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-40 h-14 px-5 rounded-full bg-[#1f5f4a] text-white shadow-lg shadow-[#1f5f4a]/30 hover:bg-[#184d3c] active:scale-95 transition-all flex items-center justify-center gap-2 font-semibold text-sm group"
    >
      <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 group-active:scale-90" />
      <span className="tracking-wide">New Entry</span>
    </button>
  );
};
