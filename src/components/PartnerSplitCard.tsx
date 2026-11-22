import React from 'react';
import { Transaction, formatCurrency, triggerHaptic } from '../lib/supabase';
import { PartnerConfig, calculatePartnerSplit } from '../lib/partnerSplit';
import { Users, ChevronRight, Share2, PlusCircle, ArrowUpRight } from 'lucide-react';

interface PartnerSplitCardProps {
  transactions: Transaction[];
  partnerConfig: PartnerConfig;
  onOpenSplitModal: () => void;
  onQuickRecordDraw: () => void;
}

export const PartnerSplitCard: React.FC<PartnerSplitCardProps> = ({
  transactions,
  partnerConfig,
  onOpenSplitModal,
  onQuickRecordDraw,
}) => {
  const summary = calculatePartnerSplit(transactions, partnerConfig, 'All Time');

  return (
    <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0d234a] dark:text-[#5cc0a0] flex items-center justify-center font-bold text-xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1b1b19] dark:text-[#efeee9] flex items-center gap-1.5">
              <span>Partner Profit Split</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0eee6] dark:bg-[#282724] text-[#6c6b65] dark:text-[#9b998f]">
                {summary.partner1Pct}% / {summary.partner2Pct}%
              </span>
            </h3>
            <p className="text-[11px] text-[#6c6b65] dark:text-[#9b998f]">
              {partnerConfig.agencyReservePct > 0
                ? `${partnerConfig.agencyReservePct}% reserve retained · Remaining split`
                : '100% net profit split'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic(8);
            onOpenSplitModal();
          }}
          className="text-xs font-semibold text-[#0d234a] dark:text-[#5cc0a0] hover:underline flex items-center gap-0.5"
        >
          <span>Statement</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2-Partner Live Split Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Partner 1 Box */}
        <div className="p-3 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#33322e] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0d234a] dark:text-[#efeee9] truncate">
              {summary.partner1Name}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {summary.partner1Pct}%
            </span>
          </div>
          <div className="text-lg font-extrabold text-[#149e3e] dark:text-[#5cc08a] tabular-nums">
            {formatCurrency(summary.partner1NetDue)}
          </div>
          <div className="text-[10px] text-[#6c6b65] dark:text-[#9b998f] flex justify-between">
            <span>Net Withdrawable</span>
            {summary.partner1Draws > 0 && (
              <span className="text-rose-500 font-medium">-{formatCurrency(summary.partner1Draws)}</span>
            )}
          </div>
        </div>

        {/* Partner 2 Box */}
        <div className="p-3 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#33322e] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0d234a] dark:text-[#efeee9] truncate">
              {summary.partner2Name}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {summary.partner2Pct}%
            </span>
          </div>
          <div className="text-lg font-extrabold text-[#149e3e] dark:text-[#5cc08a] tabular-nums">
            {formatCurrency(summary.partner2NetDue)}
          </div>
          <div className="text-[10px] text-[#6c6b65] dark:text-[#9b998f] flex justify-between">
            <span>Net Withdrawable</span>
            {summary.partner2Draws > 0 && (
              <span className="text-rose-500 font-medium">-{formatCurrency(summary.partner2Draws)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Split Ratio Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-[#f0eee6] dark:bg-[#2b2a26] rounded-full overflow-hidden flex">
          <div
            className="bg-[#0d234a] dark:bg-[#3b82f6] h-full transition-all"
            style={{ width: `${summary.partner1Pct}%` }}
          />
          <div
            className="bg-[#149e3e] dark:bg-[#10b981] h-full transition-all"
            style={{ width: `${summary.partner2Pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#6c6b65] dark:text-[#9b998f] font-medium px-0.5">
          <span>{summary.partner1Name}: {summary.partner1Pct}%</span>
          <span>{summary.partner2Name}: {summary.partner2Pct}%</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#f0eee6] dark:border-[#2b2a26]">
        <button
          onClick={() => {
            triggerHaptic(8);
            onQuickRecordDraw();
          }}
          className="py-2 px-2.5 rounded-xl bg-[#f0eee6] dark:bg-[#282724] text-[#1b1b19] dark:text-[#efeee9] hover:bg-[#e4e2da] dark:hover:bg-[#33322e] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#0d234a] dark:text-[#5cc0a0]" />
          <span>Record Draw</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(8);
            onOpenSplitModal();
          }}
          className="py-2 px-2.5 rounded-xl bg-[#0d234a] hover:bg-[#07152d] text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <Share2 className="w-3.5 h-3.5 text-[#149e3e]" />
          <span>Split Statement</span>
        </button>
      </div>
    </div>
  );
};
