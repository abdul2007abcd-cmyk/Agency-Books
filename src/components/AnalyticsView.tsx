import React, { useMemo, useState } from 'react';
import { Transaction, formatCurrency, triggerHaptic } from '../lib/supabase';
import { isPartnerDraw, calculateAccountingSummary } from '../lib/accounting';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  ShieldAlert,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Wallet,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Receipt,
  FileText,
} from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions }) => {
  const [reportTab, setReportTab] = useState<'overview' | 'pnl' | 'editors'>('overview');

  // Overall Accounting Summary
  const summary = useMemo(() => calculateAccountingSummary(transactions), [transactions]);

  // Monthly trends (last 6 months) separating OpEx from Partner Draws
  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      { income: number; opex: number; draws: number }
    >();

    for (const t of transactions) {
      if (t.status !== 'paid' || t.deleted_at) continue;
      const month = t.date.slice(0, 7); // YYYY-MM
      if (!map.has(month)) {
        map.set(month, { income: 0, opex: 0, draws: 0 });
      }
      const item = map.get(month)!;
      if (t.type === 'income') {
        item.income += t.amount;
      } else if (isPartnerDraw(t)) {
        item.draws += t.amount;
      } else {
        item.opex += t.amount;
      }
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
        opex: data.opex,
        draws: data.draws,
        operatingProfit: data.income - data.opex,
        retainedCash: data.income - data.opex - data.draws,
      };
    });
  }, [transactions]);

  const maxMonthValue = useMemo(() => {
    let max = 1;
    for (const m of monthlyData) {
      if (m.income > max) max = m.income;
      if (m.opex > max) max = m.opex;
    }
    return max;
  }, [monthlyData]);

  const allIncomeTotal = summary.grossRevenue + summary.accountsReceivable;
  const collectionRate =
    allIncomeTotal > 0 ? Math.round((summary.grossRevenue / allIncomeTotal) * 100) : 100;

  const exportFinancialReport = () => {
    triggerHaptic(10);
    const headers = [
      'Scale Magnet - Financial Profit & Loss Statement',
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      'Metric,Amount',
      `Gross Client Inflow (Revenue),${summary.grossRevenue}`,
      `Agency Operating Expenses (OpEx),${summary.operatingExpenses}`,
      `Net Operating Profit (EBITDA),${summary.netOperatingProfit}`,
      `Operating Margin %,${summary.operatingMarginPct.toFixed(2)}%`,
      `Partner Distributions (Abdul),${summary.abdulDraws}`,
      `Partner Distributions (Punith),${summary.punithDraws}`,
      `Total Partner Withdrawals,${summary.totalPartnerDraws}`,
      `Retained Agency Reserves,${summary.retainedEarnings}`,
      `Accounts Receivable (Pending Invoices),${summary.accountsReceivable}`,
      `Accounts Payable (Pending Bills),${summary.accountsPayable}`,
    ].join('\n');

    const blob = new Blob([headers], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scale-magnet-pnl-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-28 md:pb-12 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold text-[#1b1b19] dark:text-[#efeee9]">
            Financial Accounting & Reports
          </h2>
          <p className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
            Scale Magnet Official Books
          </p>
        </div>

        <button
          onClick={exportFinancialReport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#383733] text-xs font-semibold text-[#0d234a] dark:text-[#efeee9] hover:bg-[#f7f6f2] active:scale-95 transition"
        >
          <Download className="w-3.5 h-3.5 text-[#149e3e]" />
          <span>Export P&L</span>
        </button>
      </div>

      {/* Report View Switcher */}
      <div className="grid grid-cols-3 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-2xl text-xs font-bold">
        <button
          onClick={() => {
            triggerHaptic(8);
            setReportTab('overview');
          }}
          className={`py-2 rounded-xl transition ${
            reportTab === 'overview'
              ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
              : 'text-[#6c6b65] dark:text-[#9b998f]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => {
            triggerHaptic(8);
            setReportTab('pnl');
          }}
          className={`py-2 rounded-xl transition ${
            reportTab === 'pnl'
              ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
              : 'text-[#6c6b65] dark:text-[#9b998f]'
          }`}
        >
          P&L Statement
        </button>
        <button
          onClick={() => {
            triggerHaptic(8);
            setReportTab('editors');
          }}
          className={`py-2 rounded-xl transition ${
            reportTab === 'editors'
              ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
              : 'text-[#6c6b65] dark:text-[#9b998f]'
          }`}
        >
          Vendors & Editors
        </button>
      </div>

      {reportTab === 'overview' && (
        <div className="space-y-4">
          {/* Monthly Trends Bar Visual */}
          <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6c6b65] dark:text-[#9b998f]">
                  Monthly Operating Performance
                </h3>
                <p className="text-sm font-bold text-[#1b1b19] dark:text-[#efeee9] mt-0.5">
                  Revenue vs Operating Costs
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#149e3e] dark:text-[#5cc08a] font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#149e3e]" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  OpEx
                </span>
              </div>
            </div>

            {monthlyData.length > 0 ? (
              <div className="pt-2">
                <div className="h-40 flex items-end justify-between gap-2 border-b border-[#f0eee6] dark:border-[#2b2a26] pb-2">
                  {monthlyData.map((m) => {
                    const inHeightPct = Math.max(6, (m.income / maxMonthValue) * 100);
                    const exHeightPct = Math.max(6, (m.opex / maxMonthValue) * 100);

                    return (
                      <div
                        key={m.monthKey}
                        className="flex-1 flex flex-col items-center h-full justify-end group"
                      >
                        <div className="w-full flex items-end justify-center gap-1.5 h-32">
                          {/* Income Bar */}
                          <div
                            className="w-3.5 sm:w-4 bg-[#149e3e] rounded-t-sm transition-all"
                            style={{ height: `${inHeightPct}%` }}
                            title={`Revenue: ${formatCurrency(m.income)}`}
                          />
                          {/* OpEx Bar */}
                          <div
                            className="w-3.5 sm:w-4 bg-rose-500 rounded-t-sm transition-all"
                            style={{ height: `${exHeightPct}%` }}
                            title={`OpEx: ${formatCurrency(m.opex)}`}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[#6c6b65] dark:text-[#9b998f] mt-2">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#6c6b65] dark:text-[#9b998f] pt-2">
                  <span>OpEx excludes partner draws</span>
                  <span className="font-bold text-[#149e3e] dark:text-[#5cc08a]">
                    Total Profit: {formatCurrency(summary.netOperatingProfit)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#6c6b65] dark:text-[#9b998f]">
                Log paid transactions to see monthly comparison bars.
              </div>
            )}
          </div>

          {/* Key Accounting Health Indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Collection Efficiency */}
            <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
                Billing Collection
              </span>
              <div className="text-2xl font-extrabold text-[#149e3e] dark:text-[#5cc08a] mt-1 tabular-nums">
                {collectionRate}%
              </div>
              <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
                {formatCurrency(summary.accountsReceivable)} pending
              </div>
            </div>

            {/* Operating Profit Margin */}
            <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
                Profit Margin
              </span>
              <div className="text-2xl font-extrabold text-[#0d234a] dark:text-[#efeee9] mt-1 tabular-nums">
                {summary.operatingMarginPct.toFixed(1)}%
              </div>
              <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
                Agency EBITDA margin
              </div>
            </div>

            {/* Retained Reserves */}
            <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
                Retained Reserves
              </span>
              <div className="text-2xl font-extrabold text-[#0d234a] dark:text-[#93c5fd] mt-1 tabular-nums">
                {formatCurrency(summary.retainedEarnings)}
              </div>
              <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
                Agency capital reserve
              </div>
            </div>

            {/* Total Distributions */}
            <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f]">
                Partner Draws
              </span>
              <div className="text-2xl font-extrabold text-[#149e3e] dark:text-[#5cc08a] mt-1 tabular-nums">
                {formatCurrency(summary.totalPartnerDraws)}
              </div>
              <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mt-1">
                Abdul & Punith payouts
              </div>
            </div>
          </div>

          {/* Desktop 2-Column: Working Capital Pipeline & Top Revenue Drivers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cashflow In Flight (Receivables & Payables) */}
            <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Working Capital Pipeline
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <div className="text-[#6c6b65] dark:text-[#9b998f]">Accounts Receivable:</div>
                  <div className="font-bold text-amber-700 dark:text-amber-300 text-sm tabular-nums">
                    {formatCurrency(summary.accountsReceivable)}
                  </div>
                  <div className="text-[10px] text-[#6c6b65]">Uncollected client invoices</div>
                </div>
                <div>
                  <div className="text-[#6c6b65] dark:text-[#9b998f]">Accounts Payable:</div>
                  <div className="font-bold text-orange-700 dark:text-orange-300 text-sm tabular-nums">
                    {formatCurrency(summary.accountsPayable)}
                  </div>
                  <div className="text-[10px] text-[#6c6b65]">Bills owed to editors/vendors</div>
                </div>
              </div>
            </div>

            {/* Top Client Ranking */}
            <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6c6b65] dark:text-[#9b998f]">
                  Top Revenue Drivers
                </span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              {summary.revenueByClient.length > 0 ? (
                <div className="space-y-2.5">
                  {summary.revenueByClient.slice(0, 5).map((item, index) => (
                    <div key={item.client} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-5 h-5 rounded-full bg-[#f0eee6] dark:bg-[#2c2a26] text-xs font-bold flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-[#1b1b19] dark:text-[#efeee9] truncate">
                          {item.client}
                        </span>
                      </div>
                      <span className="font-bold text-[#149e3e] dark:text-[#5cc08a] tabular-nums shrink-0">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-[#6c6b65] dark:text-[#9b998f]">
                  No client revenue recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* P&L Statement Tab */}
      {reportTab === 'pnl' && (
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
            <div>
              <h3 className="font-bold text-base text-[#0d234a] dark:text-[#efeee9]">
                Income & Profit Statement
              </h3>
              <p className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
                Scale Magnet Agency Formal Financial Ledger
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
              GAAP Principles
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Revenue Row */}
            <div className="flex items-center justify-between py-2 border-b border-[#f0eee6] dark:border-[#282724]">
              <span className="font-bold text-[#1b1b19] dark:text-[#efeee9]">
                1. Gross Revenue (Settled Client Billing)
              </span>
              <span className="font-extrabold text-[#149e3e] text-sm tabular-nums">
                +{formatCurrency(summary.grossRevenue)}
              </span>
            </div>

            {/* OpEx Row */}
            <div className="flex items-center justify-between py-2 border-b border-[#f0eee6] dark:border-[#282724]">
              <div>
                <span className="font-bold text-[#1b1b19] dark:text-[#efeee9]">
                  2. Operating Expenses (OpEx)
                </span>
                <p className="text-[11px] text-[#6c6b65] dark:text-[#9b998f]">
                  Editing, freelancers, software, tools, ad spend
                </p>
              </div>
              <span className="font-extrabold text-rose-600 text-sm tabular-nums">
                -{formatCurrency(summary.operatingExpenses)}
              </span>
            </div>

            {/* Net Operating Profit Row */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-[#149e3e] text-sm">
                  Net Operating Profit (EBITDA)
                </span>
                <p className="text-[11px] text-[#149e3e]/80">
                  Business profit margin: {summary.operatingMarginPct.toFixed(1)}%
                </p>
              </div>
              <span className="font-extrabold text-[#149e3e] text-base tabular-nums">
                {formatCurrency(summary.netOperatingProfit)}
              </span>
            </div>

            {/* Below the Line Header */}
            <div className="pt-2 text-[11px] font-bold uppercase tracking-wider text-[#6c6b65] dark:text-[#9b998f]">
              Below the Line: Partner Equity Distributions
            </div>

            {/* Abdul Draw */}
            <div className="flex items-center justify-between py-1.5 pl-3 border-l-2 border-[#0d234a]">
              <span className="text-[#6c6b65] dark:text-[#cbd5e1]">
                Abdul Profit Draw (Managing Partner)
              </span>
              <span className="font-bold text-[#0d234a] dark:text-[#93c5fd] tabular-nums">
                -{formatCurrency(summary.abdulDraws)}
              </span>
            </div>

            {/* Punith Draw */}
            <div className="flex items-center justify-between py-1.5 pl-3 border-l-2 border-[#149e3e]">
              <span className="text-[#6c6b65] dark:text-[#cbd5e1]">
                Punith Profit Draw (Partner 2)
              </span>
              <span className="font-bold text-[#149e3e] dark:text-[#6ee7b7] tabular-nums">
                -{formatCurrency(summary.punithDraws)}
              </span>
            </div>

            {/* Retained Earnings Box */}
            <div className="p-3.5 rounded-2xl bg-[#0d234a] text-white flex items-center justify-between shadow-md">
              <div>
                <span className="font-bold text-sm">
                  Retained Earnings in Agency Reserve
                </span>
                <p className="text-[11px] text-white/70">
                  Unallocated profit staying in agency vault
                </p>
              </div>
              <span className="font-extrabold text-base text-[#5cc08a] tabular-nums">
                {formatCurrency(summary.retainedEarnings)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Vendors & Editors Tab */}
      {reportTab === 'editors' && (
        <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
            <div>
              <h3 className="font-bold text-base text-[#0d234a] dark:text-[#efeee9]">
                Video Editors & Freelancers
              </h3>
              <p className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
                Production & Creative Contractor Payouts
              </p>
            </div>
            <Users className="w-5 h-5 text-[#149e3e]" />
          </div>

          {summary.topEditorsPay.length > 0 ? (
            <div className="space-y-3">
              {summary.topEditorsPay.map((item, index) => (
                <div
                  key={item.editor}
                  className="p-3 rounded-2xl bg-[#f7f6f2] dark:bg-[#242320] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#1a1917] flex items-center justify-center font-bold text-[#0d234a] dark:text-[#efeee9] shadow-2xs">
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#1b1b19] dark:text-[#efeee9]">
                        {item.editor}
                      </span>
                      <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f]">
                        Creative Contractor
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#6c6b65] dark:text-[#9b998f]">
              No editor or freelancer payouts recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
