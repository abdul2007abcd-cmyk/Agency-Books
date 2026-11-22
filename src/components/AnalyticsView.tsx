import React, { useMemo } from 'react';
import { Transaction, formatCurrency } from '../lib/supabase';
import { TrendingUp, BarChart3, PieChart, ShieldAlert, Award, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions }) => {
  // Monthly trends (last 6 months)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    for (const t of transactions) {
      if (t.status !== 'paid') continue;
      const month = t.date.slice(0, 7); // YYYY-MM
      if (!map.has(month)) {
        map.set(month, { income: 0, expense: 0 });
      }
      const item = map.get(month)!;
      if (t.type === 'income') item.income += t.amount;
      else item.expense += t.amount;
    }

    const sortedMonths = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);

    return sortedMonths.map(([m, data]) => {
      const [year, monthNum] = m.split('-');
      const dateObj = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
      const label = dateObj.toLocaleString('en-IN', { month: 'short' });
      return {
        monthKey: m,
        label,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      };
    });
  }, [transactions]);

  const maxMonthValue = useMemo(() => {
    let max = 1;
    for (const m of monthlyData) {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    }
    return max;
  }, [monthlyData]);

  // Overall metrics
  const totalIncomePaid = useMemo(
    () => transactions.filter((t) => t.type === 'income' && t.status === 'paid').reduce((a, b) => a + b.amount, 0),
    [transactions]
  );

  const totalExpensePaid = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && t.status === 'paid').reduce((a, b) => a + b.amount, 0),
    [transactions]
  );

  const totalIncomeUnpaid = useMemo(
    () => transactions.filter((t) => t.type === 'income' && t.status === 'unpaid').reduce((a, b) => a + b.amount, 0),
    [transactions]
  );

  const totalExpenseUnpaid = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && t.status === 'unpaid').reduce((a, b) => a + b.amount, 0),
    [transactions]
  );

  const allIncomeTotal = totalIncomePaid + totalIncomeUnpaid;
  const collectionRate = allIncomeTotal > 0 ? Math.round((totalIncomePaid / allIncomeTotal) * 100) : 100;

  const avgTxAmount = useMemo(() => {
    const paidTxs = transactions.filter((t) => t.status === 'paid');
    if (!paidTxs.length) return 0;
    const sum = paidTxs.reduce((a, b) => a + b.amount, 0);
    return Math.round(sum / paidTxs.length);
  }, [transactions]);

  // Top clients
  const topClients = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'income' && t.status === 'paid') {
        map.set(t.party, (map.get(t.party) || 0) + t.amount);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-4 pb-28 pt-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-[#1b1b19] dark:text-[#efeee9]">
          Financial Analytics
        </h2>
        <span className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
          Agency Health
        </span>
      </div>

      {/* Monthly Trends Bar Visual */}
      <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6c6b65] dark:text-[#9b998f]">
              Monthly Cashflow (Settled)
            </h3>
            <p className="text-sm font-bold text-[#1b1b19] dark:text-[#efeee9] mt-0.5">
              Income vs Expenses
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#1c7a4b] dark:text-[#5cc08a] font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1c7a4b] dark:bg-[#5cc08a]" />
              In
            </span>
            <span className="flex items-center gap-1.5 text-[#b43e28] dark:text-[#ec8a73] font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#b43e28] dark:bg-[#ec8a73]" />
              Out
            </span>
          </div>
        </div>

        {monthlyData.length > 0 ? (
          <div className="pt-2">
            <div className="h-40 flex items-end justify-between gap-2 border-b border-[#e4e2da] dark:border-[#33322e] pb-2">
              {monthlyData.map((m) => {
                const inHeightPct = Math.max(6, (m.income / maxMonthValue) * 100);
                const exHeightPct = Math.max(6, (m.expense / maxMonthValue) * 100);

                return (
                  <div key={m.monthKey} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-32">
                      {/* Income Bar */}
                      <div
                        className="w-3 sm:w-4 bg-[#1c7a4b] dark:bg-[#5cc08a] rounded-t-sm transition-all"
                        style={{ height: `${inHeightPct}%` }}
                        title={`Income: ${formatCurrency(m.income)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-3 sm:w-4 bg-[#b43e28] dark:bg-[#ec8a73] rounded-t-sm transition-all"
                        style={{ height: `${exHeightPct}%` }}
                        title={`Expense: ${formatCurrency(m.expense)}`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-[#6c6b65] dark:text-[#9b998f] mt-2">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#6c6b65] dark:text-[#9b998f] pt-2">
              <span>Historical trend based on settled transactions</span>
              <span className="font-semibold text-[#1f5f4a] dark:text-[#5cc08a]">
                Net: {formatCurrency(totalIncomePaid - totalExpensePaid)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-[#6c6b65] dark:text-[#9b998f]">
            Log paid transactions to see monthly comparison bars.
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Collection Efficiency */}
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
            Collection Rate
          </span>
          <div className="text-2xl font-extrabold text-[#1f5f4a] dark:text-[#5cc0a0] mt-1 tabular-nums">
            {collectionRate}%
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
            {formatCurrency(totalIncomeUnpaid)} uncollected
          </div>
        </div>

        {/* Avg Transaction Size */}
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
            Avg Ticket
          </span>
          <div className="text-2xl font-extrabold text-[#1b1b19] dark:text-[#efeee9] mt-1 tabular-nums">
            {formatCurrency(avgTxAmount)}
          </div>
          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
            Per transaction
          </div>
        </div>
      </div>

      {/* Unpaid Aging / Receivables Alert */}
      {(totalIncomeUnpaid > 0 || totalExpenseUnpaid > 0) && (
        <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Cashflow In Flight
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <div className="text-[#6c6b65] dark:text-[#9b998f]">Pending Collection:</div>
              <div className="font-bold text-amber-700 dark:text-amber-300 text-sm tabular-nums">
                {formatCurrency(totalIncomeUnpaid)}
              </div>
            </div>
            <div>
              <div className="text-[#6c6b65] dark:text-[#9b998f]">Pending Outflow:</div>
              <div className="font-bold text-amber-700 dark:text-amber-300 text-sm tabular-nums">
                {formatCurrency(totalExpenseUnpaid)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Client Ranking */}
      <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6c6b65] dark:text-[#9b998f]">
            Top Revenue Drivers
          </span>
          <Award className="w-4 h-4 text-amber-500" />
        </div>
        {topClients.length > 0 ? (
          <div className="space-y-2.5">
            {topClients.map(([name, amount], index) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-5 h-5 rounded-full bg-[#f0eee6] dark:bg-[#2c2a26] text-xs font-bold flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] shrink-0">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-[#1b1b19] dark:text-[#efeee9] truncate">
                    {name}
                  </span>
                </div>
                <span className="font-bold text-[#1c7a4b] dark:text-[#5cc08a] tabular-nums shrink-0">
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-[#6c6b65] dark:text-[#9b998f]">
            No client data recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
