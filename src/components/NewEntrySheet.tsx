import React, { useState, useEffect } from 'react';
import { CATEGORIES, triggerHaptic } from '../lib/supabase';
import {
  X,
  Calendar,
  User,
  Tag,
  FileText,
  Check,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Info,
} from 'lucide-react';

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

type EntryMode = 'income' | 'expense' | 'draw';

export const NewEntrySheet: React.FC<NewEntrySheetProps> = ({
  isOpen,
  onClose,
  onSave,
  recentParties,
  userName,
  onRequireName,
  onOpenReceipt,
}) => {
  const [entryMode, setEntryMode] = useState<EntryMode>('income');
  const [amountStr, setAmountStr] = useState<string>('');
  const [party, setParty] = useState<string>('');
  const [cat, setCat] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'paid' | 'unpaid'>('paid');
  const [descr, setDescr] = useState<string>('');
  const [generateReceiptAfter, setGenerateReceiptAfter] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Switch categories based on entryMode
  useEffect(() => {
    if (entryMode === 'draw') {
      setCat('Partner Draw / Profit Share');
      // Default to current logged-in partner if Abdul or Punith
      if (userName && (userName.toLowerCase().includes('abdul') || userName.toLowerCase().includes('punith'))) {
        setParty(userName);
      } else {
        setParty('Abdul');
      }
    } else if (entryMode === 'income') {
      setCat(CATEGORIES.income[0]);
      if (party === 'Abdul' || party === 'Punith') setParty('');
    } else {
      setCat(CATEGORIES.expense[0]);
      if (party === 'Abdul' || party === 'Punith') setParty('');
    }
  }, [entryMode]);

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
      setFormError(
        entryMode === 'income'
          ? 'Please enter a client name.'
          : entryMode === 'draw'
          ? 'Please choose a partner (Abdul or Punith).'
          : 'Please enter a payee / vendor name.'
      );
      return;
    }

    if (!date) {
      setFormError('Please select a date.');
      return;
    }

    // In the database: income is 'income', expense and draw are stored as 'expense'
    const dbType: 'income' | 'expense' = entryMode === 'income' ? 'income' : 'expense';
    const finalCat =
      entryMode === 'draw'
        ? cat || 'Partner Draw / Profit Share'
        : cat || (entryMode === 'income' ? CATEGORIES.income[0] : CATEGORIES.expense[0]);

    try {
      setIsSubmitting(true);
      const savedTx = await onSave({
        type: dbType,
        amount: parsedAmount,
        party: party.trim(),
        cat: finalCat,
        date,
        status,
        descr: descr.trim(),
      });

      // Reset form
      setAmountStr('');
      setParty('');
      setDescr('');
      onClose();

      // Open receipt/voucher modal if requested
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-entry-title"
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#ffffff] dark:bg-[#1c1b18] rounded-t-3xl sm:rounded-3xl border border-[#e4e2da] dark:border-[#33322e] shadow-2xl p-5 sm:p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] transition-all"
      >
        {/* Drag handle for mobile */}
        <div className="w-10 h-1.5 bg-[#d8d6ce] dark:bg-[#383733] rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
          <div>
            <h2 id="new-entry-title" className="text-lg font-bold text-[#1b1b19] dark:text-[#efeee9]">
              New Accounting Entry
            </h2>
            <p className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
              Fast double-entry agency bookkeeping
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#f0eee6] dark:hover:bg-[#282723]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="mt-3 p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 3-Way Mode Segmented Control: Client Income vs Operating Expense vs Partner Draw */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6c6b65] dark:text-[#9b998f] mb-1.5">
              Financial Entry Classification
            </label>
            <div className="grid grid-cols-3 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-2xl text-xs font-bold gap-1">
              {/* Income */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setEntryMode('income');
                }}
                className={`py-2 rounded-xl transition flex flex-col items-center justify-center gap-0.5 ${
                  entryMode === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[#6c6b65] dark:text-[#9b998f] hover:text-[#1b1b19]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Income</span>
                </div>
                <span className="text-[9px] opacity-85 font-normal">Client Billing</span>
              </button>

              {/* Operating Expense */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setEntryMode('expense');
                }}
                className={`py-2 rounded-xl transition flex flex-col items-center justify-center gap-0.5 ${
                  entryMode === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-[#6c6b65] dark:text-[#9b998f] hover:text-[#1b1b19]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Expense</span>
                </div>
                <span className="text-[9px] opacity-85 font-normal">Business OpEx</span>
              </button>

              {/* Partner Draw */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setEntryMode('draw');
                }}
                className={`py-2 rounded-xl transition flex flex-col items-center justify-center gap-0.5 ${
                  entryMode === 'draw'
                    ? 'bg-[#0d234a] text-white shadow-sm'
                    : 'text-[#6c6b65] dark:text-[#9b998f] hover:text-[#1b1b19]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#149e3e]" />
                  <span>Partner Draw</span>
                </div>
                <span className="text-[9px] opacity-85 font-normal">Profit Share</span>
              </button>
            </div>
          </div>

          {/* Partner Draw Accounting Notice */}
          {entryMode === 'draw' && (
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2 animate-fade-in">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Equity Accounting: </span>
                <span>
                  Partner profit shares are treated as equity withdrawals, <b>not business operating expenses</b>. It will not reduce your agency's operating profit margin.
                </span>
              </div>
            </div>
          )}

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
                className="w-full pl-9 pr-4 py-3 text-2xl font-extrabold tabular-nums bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a] dark:focus:border-[#149e3e]"
              />
            </div>

            {/* Quick amount increment chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
              {[500, 1000, 2000, 5000, 10000, 25000, 50000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#f0eee6] dark:bg-[#282724] text-[#1b1b19] dark:text-[#efeee9] hover:bg-[#e4e2da] dark:hover:bg-[#33322e] transition shrink-0 active:scale-95"
                >
                  +{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
              {amountStr && (
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Party Input (Client / Vendor / Partner) */}
          <div>
            <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              {entryMode === 'income'
                ? 'Client / Customer Name'
                : entryMode === 'draw'
                ? 'Withdrawing Partner'
                : 'Vendor / Payee Name (Editor, Tool, etc.)'}
            </label>

            {entryMode === 'draw' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setParty('Abdul');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      party === 'Abdul'
                        ? 'bg-[#0d234a] text-white border-[#0d234a] shadow-xs'
                        : 'bg-[#f7f6f2] dark:bg-[#242320] border-[#e4e2da] dark:border-[#383733] text-[#1b1b19] dark:text-[#efeee9]'
                    }`}
                  >
                    <span>Abdul (Managing)</span>
                    {party === 'Abdul' && <Check className="w-3.5 h-3.5 text-[#149e3e]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setParty('Punith');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      party === 'Punith'
                        ? 'bg-[#149e3e] text-white border-[#149e3e] shadow-xs'
                        : 'bg-[#f7f6f2] dark:bg-[#242320] border-[#e4e2da] dark:border-[#383733] text-[#1b1b19] dark:text-[#efeee9]'
                    }`}
                  >
                    <span>Punith (Partner 2)</span>
                    {party === 'Punith' && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9b998f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={party}
                    onChange={(e) => setParty(e.target.value)}
                    placeholder={
                      entryMode === 'income'
                        ? 'e.g. Acme Corp, Brand Name'
                        : 'e.g. Editor Name, Adobe, Meta Ads'
                    }
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
                  />
                </div>

                {/* Recent parties chips */}
                {recentParties && recentParties.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-[10px] text-[#9b998f] uppercase font-semibold shrink-0">
                      Recent:
                    </span>
                    {recentParties.slice(0, 5).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          triggerHaptic(8);
                          setParty(p);
                        }}
                        className="px-2.5 py-0.5 text-xs rounded-lg bg-[#f0eee6] dark:bg-[#282724] text-[#6c6b65] dark:text-[#9b998f] hover:text-[#1b1b19] shrink-0"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Input */}
          <div>
            <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              Accounting Category
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-[#9b998f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a] appearance-none"
              >
                {entryMode === 'income' &&
                  CATEGORIES.income.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {entryMode === 'expense' &&
                  CATEGORIES.expense.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {entryMode === 'draw' &&
                  CATEGORIES.draw.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#9b998f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 text-xs bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
                />
              </div>
            </div>

            {/* Status (Paid / Unpaid) */}
            <div>
              <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                Payment Status
              </label>
              <div className="grid grid-cols-2 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`py-1.5 rounded-lg transition ${
                    status === 'paid'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[#6c6b65] dark:text-[#9b998f]'
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('unpaid')}
                  className={`py-1.5 rounded-lg transition ${
                    status === 'unpaid'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-[#6c6b65] dark:text-[#9b998f]'
                  }`}
                >
                  Unpaid
                </button>
              </div>
            </div>
          </div>

          {/* Quick date presets */}
          <div className="flex items-center gap-1.5 -mt-2">
            <button
              type="button"
              onClick={() => setPresetDate(0)}
              className="text-[11px] font-medium text-[#6c6b65] hover:text-[#0d234a] dark:text-[#9b998f]"
            >
              Today
            </button>
            <span className="text-[#9b998f]">·</span>
            <button
              type="button"
              onClick={() => setPresetDate(1)}
              className="text-[11px] font-medium text-[#6c6b65] hover:text-[#0d234a] dark:text-[#9b998f]"
            >
              Yesterday
            </button>
          </div>

          {/* Note / Memo */}
          <div>
            <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              Description / Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#9b998f] absolute left-3.5 top-3" />
              <input
                type="text"
                value={descr}
                onChange={(e) => setDescr(e.target.value)}
                placeholder={
                  entryMode === 'draw'
                    ? 'e.g. Monthly Profit Distribution'
                    : 'e.g. Invoice #1042 / Video editing for YouTube batch'
                }
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
              />
            </div>
          </div>

          {/* Receipt / Invoice Checkbox */}
          {status === 'paid' && (
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#33322e] cursor-pointer">
              <input
                type="checkbox"
                checked={generateReceiptAfter}
                onChange={(e) => setGenerateReceiptAfter(e.target.checked)}
                className="w-4 h-4 rounded text-[#149e3e] focus:ring-0"
              />
              <span className="text-xs font-medium text-[#1b1b19] dark:text-[#efeee9]">
                {entryMode === 'income'
                  ? 'Generate Client Invoice / Receipt after saving'
                  : entryMode === 'draw'
                  ? 'Generate Partner Draw Voucher after saving'
                  : 'Generate Expense Voucher / Receipt after saving'}
              </span>
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] ${
              entryMode === 'income'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : entryMode === 'draw'
                ? 'bg-[#0d234a] hover:bg-[#071735]'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Recording...'
                : entryMode === 'income'
                ? 'Record Client Income'
                : entryMode === 'draw'
                ? 'Record Partner Profit Draw'
                : 'Record Operating Expense'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
