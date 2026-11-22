import React, { useState } from 'react';
import { triggerHaptic } from '../lib/supabase';
import { User, Check, X } from 'lucide-react';

interface NameModalProps {
  isOpen: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
  canDismiss?: boolean;
}

export const NameModal: React.FC<NameModalProps> = ({
  isOpen,
  currentName,
  onSave,
  onClose,
  canDismiss = true,
}) => {
  const [val, setVal] = useState(currentName);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) {
      setError('Please enter your name.');
      return;
    }
    triggerHaptic(10);
    onSave(val.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (canDismiss && currentName) onClose();
        }}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-modal-title"
        className="relative w-full max-w-sm bg-[#ffffff] dark:bg-[#1c1b18] rounded-3xl border border-[#e4e2da] dark:border-[#33322e] shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#1f5f4a] dark:text-[#5cc0a0] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          {canDismiss && currentName && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#f0eee6] dark:hover:bg-[#282723]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div>
          <h2 id="name-modal-title" className="text-lg font-bold text-[#1b1b19] dark:text-[#efeee9]">
            What is your name?
          </h2>
          <p className="text-xs text-[#6c6b65] dark:text-[#9b998f] mt-1">
            This name will be shown on activity logs and next to transactions you add, edit, or delete.
          </p>
        </div>

        {error && (
          <div className="p-2.5 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            autoFocus
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              setError('');
            }}
            placeholder="e.g. Priya, Rahul, Alex"
            autoComplete="given-name"
            className="w-full px-3.5 py-3 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#1f5f4a] dark:focus:border-[#5cc0a0]"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#1f5f4a] text-white font-bold text-sm shadow-md hover:bg-[#184d3c] active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};
