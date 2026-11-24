import React, { useState, useMemo } from 'react';
import { Transaction, formatCurrency, triggerHaptic } from '../lib/supabase';
import { isPartnerDraw, isOperatingExpense, calculateAccountingSummary } from '../lib/accounting';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Users,
  Wallet,
  Briefcase,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { PartnerSplitCard } from './PartnerSplitCard';
import { PartnerConfig } from '../lib/partnerSplit';

interface OverviewViewProps {
  transactions: Transaction[];
  onOpenNewEntry: () => void;
  onFilterUnpaid: () => void;
  partnerConfig: PartnerConfig;
  onOpenSplitModal: () => void;
  onQuickRecordDraw: () => void;
}

type Period = 'all' | 'this' | 'last' | 'quarter';

export const OverviewView: React.FC<OverviewViewProps> = ({
  transactions,
  onOpenNewEntry,
  onFilterUnpaid,
  partnerConfig,
  onOpenSplitModal,
  onQuickRecordDraw,
}) => {
  const [period, setPeriod] = useState<Period>('this');

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const currentQuarter = Math.floor(now.getMonth() / 3);
  const quarterStartMonth = currentQuarter * 3 + 1;

  // Filter transactions by period
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (t.deleted_at) return false;
      if (period === 'all') return true;
      if (period === 'this') return t.date.startsWith(currentMonthStr);
      if (period === 'last') return t.date.startsWith(lastMonthStr);
      if (period === 'quarter') {
        const txMonth = parseInt(t.date.slice(5, 7), 10);
        return txMonth >= quarterStartMonth && txMonth < quarterStartMonth + 3;
      }
      return true;
    });
  }, [transactions, period, currentMonthStr, lastMonthStr, quarterStartMonth]);

  // Complete Standard Accounting Calculations
  const summary = useMemo(() => calculateAccountingSummary(filtered), [filtered]);

  const periodOptions: { key: Period; label: string }[] = [
    { key: 'this', label: 'This month' },
    { key: 'last', label: 'Last month' },
    { key: 'quarter', label: 'This quarter' },
    { key: 'all', label: 'All time' },
  ];

  return (
    <div className="space-y-4 pb-28 md:pb-12 pt-2">
      {/* Period selection chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {periodOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => {
              triggerHaptic(8);
              setPeriod(opt.key);
            }}
            className={`min-h-[38px] px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
              period === opt.key
                ? 'bg-[#0d234a] text-white shadow-sm'
                : 'bg-[#ffffff] dark:bg-[#1e1d1b] text-[#6c6b65] dark:text-[#9b998f] border border-[#e4e2da] dark:border-[#33322e] hover:text-[#1b1b19]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Net Operating Profit Hero Card (Operating Income minus OpEx) */}
      <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              Net Operating Profit (Agency EBITDA)
            </span>
            <p className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-0.5">
              Gross Revenue minus Operating Costs (Excludes partner distributions)
            </p>
          </div>
          {summary.grossRevenue > 0 && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                summary.netOperatingProfit >= 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50'
              }`}
            >
              {summary.operatingMarginPct.toFixed(1)}% margin
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 pt-1">
          <span
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${
              summary.netOperatingProfit >= 0
                ? 'text-[#149e3e] dark:text-[#5cc08a]'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summary.netOperatingProfit)}
          </span>
        </div>

        {/* Operating Ratio Visual */}
        {(summary.grossRevenue > 0 || summary.operatingExpenses > 0) && (
          <div className="pt-3 border-t border-[#f0eee6] dark:border-[#2b2a26]">
            <div className="flex justify-between text-xs text-[#6c6b65] dark:text-[#9b998f] mb-1.5 font-medium">
              <span>Gross Inflow: {formatCurrency(summary.grossRevenue)}</span>
              <span>Business OpEx: {formatCurrency(summary.operatingExpenses)}</span>
            </div>
            <div className="w-full h-2.5 bg-[#f0eee6] dark:bg-[#2c2b27] rounded-full overflow-hidden flex">
              <div
                className="bg-[#149e3e] h-full transition-all"
                style={{
                  width: `${
                    summary.grossRevenue + summary.operatingExpenses > 0
                      ? (summary.grossRevenue / (summary.grossRevenue + summary.operatingExpenses)) * 100
                      : 50
                  }%`,
                }}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{
                  width: `${
                    summary.grossRevenue + summary.operatingExpenses > 0
                      ? (summary.operatingExpenses / (summary.grossRevenue + summary.operatingExpenses)) * 100
                      : 50
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4 Financial Accounting Pillars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Gross Revenue Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              Gross Revenue
            </span>
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(summary.grossRevenue)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
            Settled client billings
          </div>
        </div>

        {/* 2. Operating Expenses (OpEx) Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              Operating OpEx
            </span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(summary.operatingExpenses)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
            Editors, tools & ads
          </div>
        </div>

        {/* 3. Partner Draws (Owner Equity Distributions) Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#0d234a] dark:text-[#93c5fd] mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              Partner Draws
            </span>
            <Users className="w-4 h-4 text-[#149e3e]" />
          </div>
          <div className="text-xl font-bold tracking-tight text-[#0d234a] dark:text-[#93c5fd] tabular-nums">
            {formatCurrency(summary.totalPartnerDraws)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
            Abdul & Punith equity draws
          </div>
        </div>

        {/* 4. Retained Cash / Bank Balance Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#149e3e] dark:text-[#5cc08a] mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              Available Cash
            </span>
            <Wallet className="w-4 h-4 text-[#149e3e]" />
          </div>
          <div className="text-xl font-bold tracking-tight text-[#149e3e] dark:text-[#5cc08a] tabular-nums">
            {formatCurrency(summary.liquidAgencyCash)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
            Liquid cash in bank
          </div>
        </div>
      </div>

      {/* Accounts Receivable & Payable (Working Capital Strip) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Receivables: To Receive from Clients */}
        <button
          onClick={() => {
            triggerHaptic(8);
            onFilterUnpaid();
          }}
          className="text-left bg-[#ffffff] dark:bg-[#1e1d1b] border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Accounts Receivable
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {formatCurrency(summary.accountsReceivable)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1 flex items-center justify-between">
            <span>Pending client invoices</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Payables: To Pay to Vendors/Editors */}
        <button
          onClick={() => {
            triggerHaptic(8);
            onFilterUnpaid();
          }}
          className="text-left bg-[#ffffff] dark:bg-[#1e1d1b] border border-orange-200/80 dark:border-orange-900/40 rounded-2xl p-4 hover:border-orange-400 transition"
        >
          <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Accounts Payable
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold tracking-tight text-orange-600 dark:text-orange-400 tabular-nums">
            {formatCurrency(summary.accountsPayable)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1 flex items-center justify-between">
            <span>Bills due to editors</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Partner Equity & Profit Split Card (Abdul & Punith) */}
      <PartnerSplitCard
        transactions={filtered}
        partnerConfig={partnerConfig}
        onOpenSplitModal={onOpenSplitModal}
        onQuickRecordDraw={onQuickRecordDraw}
      />

      {/* Desktop 2-Column Grid: Revenue by Client & Operating Expenses Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Client Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f] px-1">
            Client Revenue Breakdown
          </h3>
          <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 divide-y divide-[#f0eee6] dark:divide-[#2b2a26]">
            {summary.revenueByClient.length > 0 ? (
              summary.revenueByClient.map((item) => (
                <div key={item.client} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-[#1b1b19] dark:text-[#efeee9] truncate pr-2">
                      {item.client}
                    </span>
                    <span className="font-bold text-[#149e3e] dark:text-[#5cc08a] tabular-nums shrink-0">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-[#f0eee6] dark:bg-[#2b2a26] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#149e3e] h-full rounded-full transition-all"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-0.5 text-right">
                    {item.pct}% of revenue
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-[#6c6b65] dark:text-[#9b998f]">
                No paid client income recorded for this period.
              </div>
            )}
          </div>
        </div>

        {/* Operating Expenses by Category Section (Partner draws excluded) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              Operating Expenses Breakdown
            </h3>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              Excludes Partner Draws
            </span>
          </div>
          <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 divide-y divide-[#f0eee6] dark:divide-[#2b2a26]">
            {summary.expensesByCategory.length > 0 ? (
              summary.expensesByCategory.map((item) => (
                <div key={item.category} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-[#1b1b19] dark:text-[#efeee9] truncate pr-2">
                      {item.category}
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-[#f0eee6] dark:bg-[#2b2a26] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-0.5 text-right">
                    {item.pct}% of OpEx
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-[#6c6b65] dark:text-[#9b998f]">
                No operating expenses recorded for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State Banner if 0 transactions */}
      {transactions.length === 0 && (
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-dashed border-[#e4e2da] dark:border-[#33322e] rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#149e3e] flex items-center justify-center mx-auto text-xl">
            ✨
          </div>
          <h4 className="font-bold text-base text-[#1b1b19] dark:text-[#efeee9]">
            Scale Magnet Financial Books
          </h4>
          <p className="text-xs text-[#6c6b65] dark:text-[#9b998f] max-w-xs mx-auto">
            Log client income, video editing expenses, and partner profit draws with live multi-device sync between Abdul and Punith.
          </p>
          <button
            onClick={onOpenNewEntry}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0d234a] text-white text-xs font-bold shadow-sm hover:bg-[#081732] active:scale-95 transition"
          >
            Record First Transaction
          </button>
        </div>
      )}
    </div>
  );
};
