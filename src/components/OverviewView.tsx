import React, { useState, useMemo } from 'react';
import { Transaction, formatCurrency, triggerHaptic } from '../lib/supabase';
import { ArrowUpRight, ArrowDownLeft, Clock, TrendingUp, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
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

  // Calculations
  const incomePaid = useMemo(
    () => filtered.filter((t) => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0),
    [filtered]
  );

  const expensePaid = useMemo(
    () => filtered.filter((t) => t.type === 'expense' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0),
    [filtered]
  );

  const netProfit = incomePaid - expensePaid;
  const profitMargin = incomePaid > 0 ? ((netProfit / incomePaid) * 100).toFixed(1) : '0';

  const toReceive = useMemo(
    () => filtered.filter((t) => t.type === 'income' && t.status === 'unpaid').reduce((acc, t) => acc + t.amount, 0),
    [filtered]
  );

  const toPay = useMemo(
    () => filtered.filter((t) => t.type === 'expense' && t.status === 'unpaid').reduce((acc, t) => acc + t.amount, 0),
    [filtered]
  );

  const clientIncome = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filtered) {
      if (t.type === 'income' && t.status === 'paid') {
        map.set(t.party, (map.get(t.party) || 0) + t.amount);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const expenseCategories = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filtered) {
      if (t.type === 'expense' && t.status === 'paid') {
        map.set(t.cat, (map.get(t.cat) || 0) + t.amount);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const periodOptions: { key: Period; label: string }[] = [
    { key: 'this', label: 'This month' },
    { key: 'last', label: 'Last month' },
    { key: 'quarter', label: 'This quarter' },
    { key: 'all', label: 'All time' },
  ];

  return (
    <div className="space-y-4 pb-28 pt-2">
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
                ? 'bg-[#1f5f4a] text-white shadow-sm'
                : 'bg-[#ffffff] dark:bg-[#1e1d1b] text-[#6c6b65] dark:text-[#9b998f] border border-[#e4e2da] dark:border-[#33322e] hover:text-[#1b1b19]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Net profit hero card */}
      <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
            Net Profit
          </span>
          {incomePaid > 0 && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                netProfit >= 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
              }`}
            >
              {profitMargin}% margin
            </span>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${
              netProfit >= 0
                ? 'text-[#1c7a4b] dark:text-[#5cc08a]'
                : 'text-[#b43e28] dark:text-[#ec8a73]'
            }`}
          >
            {formatCurrency(netProfit)}
          </span>
        </div>

        {/* Ratio bar */}
        {(incomePaid > 0 || expensePaid > 0) && (
          <div className="mt-4 pt-4 border-t border-[#f0eee6] dark:border-[#2b2a26]">
            <div className="flex justify-between text-xs text-[#6c6b65] dark:text-[#9b998f] mb-1.5 font-medium">
              <span>Income: {formatCurrency(incomePaid)}</span>
              <span>Expenses: {formatCurrency(expensePaid)}</span>
            </div>
            <div className="w-full h-2.5 bg-[#f0eee6] dark:bg-[#2c2b27] rounded-full overflow-hidden flex">
              <div
                className="bg-[#1c7a4b] dark:bg-[#5cc08a] h-full transition-all"
                style={{
                  width: `${
                    incomePaid + expensePaid > 0
                      ? (incomePaid / (incomePaid + expensePaid)) * 100
                      : 50
                  }%`,
                }}
              />
              <div
                className="bg-[#b43e28] dark:bg-[#ec8a73] h-full transition-all"
                style={{
                  width: `${
                    incomePaid + expensePaid > 0
                      ? (expensePaid / (incomePaid + expensePaid)) * 100
                      : 50
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2x2 Metric Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#1c7a4b] dark:text-[#5cc08a] mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              Income
            </span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold tracking-tight text-[#1c7a4b] dark:text-[#5cc08a] tabular-nums">
            {formatCurrency(incomePaid)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
            Paid & settled
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#b43e28] dark:text-[#ec8a73] mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              Expenses
            </span>
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold tracking-tight text-[#b43e28] dark:text-[#ec8a73] tabular-nums">
            {formatCurrency(expensePaid)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
            Spent to date
          </div>
        </div>

        {/* To Receive Card (Clickable to jump to unpaid) */}
        <button
          onClick={() => {
            triggerHaptic(8);
            onFilterUnpaid();
          }}
          className="text-left bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              To Receive
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {formatCurrency(toReceive)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1 flex items-center justify-between">
            <span>Pending collection</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* To Pay Card (Clickable to jump to unpaid) */}
        <button
          onClick={() => {
            triggerHaptic(8);
            onFilterUnpaid();
          }}
          className="text-left bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
              To Pay
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {formatCurrency(toPay)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1 flex items-center justify-between">
            <span>Outstanding bills</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Partner Profit Split Card */}
      <PartnerSplitCard
        transactions={transactions}
        partnerConfig={partnerConfig}
        onOpenSplitModal={onOpenSplitModal}
        onQuickRecordDraw={onQuickRecordDraw}
      />

      {/* Income by Client Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f] px-1">
          Income by Client
        </h3>
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 divide-y divide-[#f0eee6] dark:divide-[#2b2a26]">
          {clientIncome.length > 0 ? (
            clientIncome.map(([party, amount]) => {
              const pct = incomePaid > 0 ? Math.round((amount / incomePaid) * 100) : 0;
              return (
                <div key={party} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-[#1b1b19] dark:text-[#efeee9] truncate pr-2">
                      {party}
                    </span>
                    <span className="font-bold text-[#1c7a4b] dark:text-[#5cc08a] tabular-nums shrink-0">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="w-full bg-[#f0eee6] dark:bg-[#2b2a26] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1f5f4a] dark:bg-[#5cc0a0] h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-0.5 text-right">
                    {pct}% of revenue
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-[#6c6b65] dark:text-[#9b998f]">
              No paid income recorded for this period.
            </div>
          )}
        </div>
      </div>

      {/* Expenses by Category Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f] px-1">
          Expenses by Category
        </h3>
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 divide-y divide-[#f0eee6] dark:divide-[#2b2a26]">
          {expenseCategories.length > 0 ? (
            expenseCategories.map(([cat, amount]) => {
              const pct = expensePaid > 0 ? Math.round((amount / expensePaid) * 100) : 0;
              return (
                <div key={cat} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-[#1b1b19] dark:text-[#efeee9] truncate pr-2">
                      {cat}
                    </span>
                    <span className="font-bold text-[#b43e28] dark:text-[#ec8a73] tabular-nums shrink-0">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="w-full bg-[#f0eee6] dark:bg-[#2b2a26] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#b43e28] dark:bg-[#ec8a73] h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-0.5 text-right">
                    {pct}% of expenses
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-[#6c6b65] dark:text-[#9b998f]">
              No expenses recorded for this period.
            </div>
          )}
        </div>
      </div>

      {/* Empty State Banner if 0 transactions */}
      {transactions.length === 0 && (
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-dashed border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#1f5f4a] dark:text-[#5cc0a0] flex items-center justify-center mx-auto text-xl">
            ✨
          </div>
          <h4 className="font-bold text-base text-[#1b1b19] dark:text-[#efeee9]">
            Welcome to Agency Books
          </h4>
          <p className="text-xs text-[#6c6b65] dark:text-[#9b998f] max-w-xs mx-auto">
            Keep track of client retainers, ad spends, payroll, and invoices. Everything syncs live across your team.
          </p>
          <button
            onClick={onOpenNewEntry}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#1f5f4a] text-white text-xs font-semibold shadow-sm hover:bg-[#184d3c] active:scale-95 transition"
          >
            Log First Transaction
          </button>
        </div>
      )}
    </div>
  );
};
