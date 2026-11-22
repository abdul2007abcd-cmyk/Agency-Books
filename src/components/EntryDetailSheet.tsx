import React, { useState } from 'react';
import { Transaction, formatCurrency, triggerHaptic } from '../lib/supabase';
import { X, Check, Clock, Trash2, Share2, Copy, AlertTriangle } from 'lucide-react';

interface EntryDetailSheetProps {
  transaction: Transaction | null;
  onClose: () => void;
  onToggleStatus: (id: string, newStatus: 'paid' | 'unpaid') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userName: string;
  onRequireName: () => void;
}

export const EntryDetailSheet: React.FC<EntryDetailSheetProps> = ({
  transaction,
  onClose,
  onToggleStatus,
  onDelete,
  userName,
  onRequireName,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const isPaid = transaction.status === 'paid';

  const handleToggle = async () => {
    triggerHaptic(10);
    if (!userName.trim()) {
      onRequireName();
      return;
    }
    const newStatus = isPaid ? 'unpaid' : 'paid';
    await onToggleStatus(transaction.id, newStatus);
    onClose();
  };

  const handleDelete = async () => {
    triggerHaptic(15);
    if (!userName.trim()) {
      onRequireName();
      return;
    }
    await onDelete(transaction.id);
    onClose();
  };

  const handleShare = async () => {
    triggerHaptic(8);
    const text = `${transaction.party}: ${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)} (${transaction.cat}) on ${transaction.date}. Status: ${transaction.status.toUpperCase()}${transaction.descr ? ` - "${transaction.descr}"` : ''}`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `Agency Books: ${transaction.party}`,
          text,
        });
        return;
      } catch (e) {
        // User cancelled or share not supported
      }
    }

    // Fallback: clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-detail-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#ffffff] dark:bg-[#1c1b18] rounded-t-3xl border-t border-[#e4e2da] dark:border-[#33322e] shadow-2xl p-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] transition-transform"
      >
        {/* Drag handle */}
        <div className="w-10 h-1.5 bg-[#d8d6ce] dark:bg-[#383733] rounded-full mx-auto mb-4" />

        {/* Top bar */}
        <div className="flex items-start justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
          <div className="min-w-0 pr-2">
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 ${
                isIncome
                  ? 'bg-emerald-50 text-[#1c7a4b] dark:bg-emerald-950/60 dark:text-[#5cc08a]'
                  : 'bg-rose-50 text-[#b43e28] dark:bg-rose-950/60 dark:text-[#ec8a73]'
              }`}
            >
              {transaction.type}
            </span>
            <h2 id="entry-detail-title" className="text-xl font-extrabold text-[#1b1b19] dark:text-[#efeee9] truncate">
              {transaction.party}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#f0eee6] dark:hover:bg-[#282723]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount display */}
        <div className="py-4 text-center">
          <div className="text-xs uppercase font-semibold tracking-wider text-[#6c6b65] dark:text-[#9b998f]">
            Amount
          </div>
          <div
            className={`text-3xl sm:text-4xl font-extrabold tabular-nums mt-1 ${
              isIncome
                ? 'text-[#1c7a4b] dark:text-[#5cc08a]'
                : 'text-[#b43e28] dark:text-[#ec8a73]'
            }`}
          >
            {isIncome ? '+' : '−'}
            {formatCurrency(transaction.amount)}
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                isPaid
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {isPaid ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isPaid ? 'Paid & Settled' : 'Unpaid (Pending)'}
            </span>
          </div>
        </div>

        {/* Details list */}
        <div className="bg-[#f7f6f2] dark:bg-[#242320] rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-[#e4e2da] dark:border-[#33322e]">
            <span className="text-[#6c6b65] dark:text-[#9b998f]">Category</span>
            <span className="font-semibold text-[#1b1b19] dark:text-[#efeee9]">
              {transaction.cat}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#e4e2da] dark:border-[#33322e]">
            <span className="text-[#6c6b65] dark:text-[#9b998f]">Date</span>
            <span className="font-semibold text-[#1b1b19] dark:text-[#efeee9]">
              {transaction.date}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#e4e2da] dark:border-[#33322e]">
            <span className="text-[#6c6b65] dark:text-[#9b998f]">Logged by</span>
            <span className="font-semibold text-[#1b1b19] dark:text-[#efeee9]">
              {transaction.by_name || 'Anonymous'}
            </span>
          </div>

          {transaction.descr && (
            <div className="py-1">
              <span className="text-[#6c6b65] dark:text-[#9b998f] block mb-1">Note</span>
              <p className="font-medium text-[#1b1b19] dark:text-[#efeee9] italic bg-white dark:bg-[#1c1b18] p-2.5 rounded-xl border border-[#e4e2da] dark:border-[#33322e]">
                "{transaction.descr}"
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!confirmDelete ? (
          <div className="mt-5 space-y-2">
            {/* Toggle Status Button */}
            <button
              onClick={handleToggle}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                isPaid
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 hover:bg-amber-200'
                  : 'bg-[#1f5f4a] text-white hover:bg-[#184d3c]'
              }`}
            >
              <Check className="w-4 h-4" />
              Mark as {isPaid ? 'Unpaid' : 'Paid'}
            </button>

            {/* Share / Copy Button */}
            <button
              onClick={handleShare}
              className="w-full py-3 rounded-xl bg-[#f0eee6] dark:bg-[#282724] text-[#1b1b19] dark:text-[#efeee9] font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#e4e2da] dark:hover:bg-[#33322e] active:scale-[0.98] transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Share Entry Details'}
            </button>

            {/* Delete Trigger */}
            <button
              onClick={() => {
                triggerHaptic(10);
                setConfirmDelete(true);
              }}
              className="w-full py-2.5 text-xs text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Entry…
            </button>
          </div>
        ) : (
          /* Confirmation State */
          <div className="mt-4 p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Delete this entry?
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              This will record as deleted by <b>{userName || 'you'}</b>. It can be safely restored anytime from the Activity tab.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setConfirmDelete(false)}
                className="py-2.5 rounded-xl bg-white dark:bg-[#1e1d1b] text-xs font-semibold text-[#1b1b19] dark:text-[#efeee9] border border-[#e4e2da] dark:border-[#33322e]"
              >
                Keep Entry
              </button>
              <button
                onClick={handleDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-[0.98] transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
