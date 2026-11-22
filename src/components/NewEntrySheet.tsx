import React, { useState, useEffect } from 'react';
import { CATEGORIES, triggerHaptic } from '../lib/supabase';
import { X, Calendar, User, Tag, FileText, Check, Plus } from 'lucide-react';

interface NewEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: {
    type: 'income' | 'expense';
    amount: number;
    party: string;
    cat: string;
    date: string;
    status: 'paid' | 'unpaid';
    descr: string;
  }) => Promise<any>;
  recentParties: string[];
  userName: string;
  onRequireName: () => void;
  onOpenReceipt?: (tx: any) => void;
}

export const NewEntrySheet: React.FC<NewEntrySheetProps> = ({
  isOpen,
  onClose,
  onSave,
  recentParties,
  userName,
  onRequireName,
  onOpenReceipt,
}) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [party, setParty] = useState<string>('');
  const [cat, setCat] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'paid' | 'unpaid'>('paid');
  const [descr, setDescr] = useState<string>('');
  const [generateReceiptAfter, setGenerateReceiptAfter] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Update default category when type switches
  useEffect(() => {
    const list = CATEGORIES[type];
    if (list && list.length > 0) {
      setCat(list[0]);
    }
  }, [type]);

  if (!isOpen) return null;

  const handleQuickAddAmount = (addVal: number) => {
    triggerHaptic(8);
    const curr = parseFloat(amountStr) || 0;
    setAmountStr(String(curr + addVal));
  };

  const handleClearAmount = () => {
    triggerHaptic(8);
    setAmountStr('');
  };

  const setPresetDate = (daysAgo: number) => {
    triggerHaptic(8);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!userName.trim()) {
      onRequireName();
      return;
    }

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    if (!party.trim()) {
      setFormError(type === 'income' ? 'Please enter a client name.' : 'Please enter a vendor / payee name.');
      return;
    }

    if (!date) {
      setFormError('Please select a date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const savedTx = await onSave({
        type,
        amount: parsedAmount,
        party: party.trim(),
        cat: cat || CATEGORIES[type][0],
        date,
        status,
        descr: descr.trim(),
      });
      // Reset form
      setAmountStr('');
      setParty('');
      setDescr('');
      onClose();

      // If user selected paid and wants receipt, open receipt modal immediately
      if (status === 'paid' && generateReceiptAfter && onOpenReceipt && savedTx) {
        setTimeout(() => {
          onOpenReceipt(savedTx);
        }, 150);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Could not save entry. Check internet connection.');
    } finally {
      setIsSubmitting(false);
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
        aria-labelledby="new-entry-title"
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#ffffff] dark:bg-[#1c1b18] rounded-t-3xl border-t border-[#e4e2da] dark:border-[#33322e] shadow-2xl p-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] transition-transform"
      >
        {/* Drag handle */}
        <div className="w-10 h-1.5 bg-[#d8d6ce] dark:bg-[#383733] rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
          <h2 id="new-entry-title" className="text-lg font-bold text-[#1b1b19] dark:text-[#efeee9]">
            New Entry
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#f0eee6] dark:hover:bg-[#282723]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="mt-3 p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Segmented Control */}
          <div>
            <div className="grid grid-cols-2 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-xl">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setType('expense');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-[#ffffff] dark:bg-[#1c1b18] text-[#b43e28] dark:text-[#ec8a73] shadow-xs'
                    : 'text-[#6c6b65] dark:text-[#9b998f]'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setType('income');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-[#ffffff] dark:bg-[#1c1b18] text-[#1c7a4b] dark:text-[#5cc08a] shadow-xs'
                    : 'text-[#6c6b65] dark:text-[#9b998f]'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-[#6c6b65] dark:text-[#9b998f]">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3 text-2xl font-extrabold tabular-nums bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#1f5f4a] dark:focus:border-[#5cc0a0]"
              />
            </div>

            {/* Quick amount increment chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2">
              {[500, 1000, 5000, 25000, 100000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#f0eee6] dark:bg-[#282724] text-[#1b1b19] dark:text-[#efeee9] hover:bg-[#e4e2da] whitespace-nowrap active:scale-95 transition"
                >
                  +{val >= 100000 ? `${val / 100000}L` : val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
              {amountStr && (
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Party (Client / Vendor) */}
          <div>
            <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              {type === 'income' ? 'Client Name' : 'Vendor / Payee'}
            </label>
            <input
              type="text"
              required
              value={party}
              onChange={(e) => setParty(e.target.value)}
              placeholder={type === 'income' ? 'e.g. Acme Studio' : 'e.g. Google Ads, Freelancer, Rent'}
              className="w-full px-3.5 py-2.5 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#1f5f4a]"
            />

            {/* Recent Party Autocomplete Chips */}
            {recentParties.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-[#6c6b65] dark:text-[#9b998f] shrink-0">Recent:</span>
                {recentParties.slice(0, 6).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setParty(p);
                    }}
                    className="px-2 py-0.5 text-[11px] rounded-md bg-[#f0eee6] dark:bg-[#282724] text-[#6c6b65] dark:text-[#9b998f] hover:text-[#1b1b19] dark:hover:text-[#efeee9] whitespace-nowrap"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              Category
            </label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#1f5f4a]"
            >
              {CATEGORIES[type].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f]">
                Date
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPresetDate(0)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-[#f0eee6] dark:bg-[#282724] text-[#6c6b65] dark:text-[#9b998f]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(1)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-[#f0eee6] dark:bg-[#282724] text-[#6c6b65] dark:text-[#9b998f]"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#1f5f4a]"
            />
          </div>

          {/* Status Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              Payment Status
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-xl">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setStatus('paid');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  status === 'paid'
                    ? 'bg-[#ffffff] dark:bg-[#1c1b18] text-[#1c7a4b] dark:text-[#5cc08a] shadow-xs'
                    : 'text-[#6c6b65] dark:text-[#9b998f]'
                }`}
              >
                Paid (Settled)
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setStatus('unpaid');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  status === 'unpaid'
                    ? 'bg-[#ffffff] dark:bg-[#1c1b18] text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-[#6c6b65] dark:text-[#9b998f]'
                }`}
              >
                Unpaid (Pending)
              </button>
            </div>

            {status === 'paid' && (
              <label className="mt-2.5 flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#0d234a] dark:text-[#5cc0a0] bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 transition">
                <input
                  type="checkbox"
                  checked={generateReceiptAfter}
                  onChange={(e) => setGenerateReceiptAfter(e.target.checked)}
                  className="w-4 h-4 rounded text-[#149e3e] accent-[#149e3e]"
                />
                <span>Generate & share Scale Magnet receipt after saving</span>
              </label>
            )}
          </div>

          {/* Note (optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={descr}
              onChange={(e) => setDescr(e.target.value)}
              placeholder="e.g. Invoice #204, Q3 milestone, 50% advance"
              className="w-full px-3.5 py-2.5 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#1f5f4a]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#1f5f4a] hover:bg-[#184d3c] active:scale-[0.98] text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Saving to Database...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
