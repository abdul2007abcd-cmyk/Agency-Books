import React, { useState, useMemo } from 'react';
import { Transaction, formatCurrency, triggerHaptic } from '../lib/supabase';
import { isPartnerDraw } from '../lib/accounting';
import {
  Search,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Filter,
  FileText,
  Users,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface EntriesViewProps {
  transactions: Transaction[];
  onSelectTransaction: (t: Transaction) => void;
  onOpenReceipt?: (t: Transaction) => void;
  initialFilter?: 'all' | 'income' | 'expense' | 'draw' | 'unpaid';
}

export type FilterChip = 'all' | 'income' | 'expense' | 'draw' | 'unpaid';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export const EntriesView: React.FC<EntriesViewProps> = ({
  transactions,
  onSelectTransaction,
  onOpenReceipt,
  initialFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterChip>(initialFilter);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Filtered & sorted entries
  const displayed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = transactions.filter((t) => {
      if (t.deleted_at) return false;

      // Type/status chip
      if (filter === 'income' && t.type !== 'income') return false;
      if (filter === 'expense' && (t.type !== 'expense' || isPartnerDraw(t))) return false;
      if (filter === 'draw' && !isPartnerDraw(t)) return false;
      if (filter === 'unpaid' && t.status !== 'unpaid') return false;

      // Search term
      if (q) {
        const matchParty = t.party.toLowerCase().includes(q);
        const matchCat = t.cat.toLowerCase().includes(q);
        const matchDesc = t.descr.toLowerCase().includes(q);
        const matchBy = t.by_name.toLowerCase().includes(q);
        const matchAmount = String(t.amount).includes(q);
        if (!matchParty && !matchCat && !matchDesc && !matchBy && !matchAmount) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date) || b.created - a.created;
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date) || a.created - b.created;
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, searchQuery, filter, sortBy]);

  // Totals for the current filtered view
  const totals = useMemo(() => {
    let creditTotal = 0; // Income
    let debitOpEx = 0;   // Business expenses
    let debitDraws = 0;  // Partner draws
    let unpaidTotal = 0;

    for (const t of displayed) {
      if (t.status === 'unpaid') {
        unpaidTotal += t.amount;
      }
      if (t.type === 'income') {
        creditTotal += t.amount;
      } else if (isPartnerDraw(t)) {
        debitDraws += t.amount;
      } else {
        debitOpEx += t.amount;
      }
    }

    return {
      creditTotal,
      debitOpEx,
      debitDraws,
      totalDebit: debitOpEx + debitDraws,
      unpaidTotal,
    };
  }, [displayed]);

  const filterOptions: { key: FilterChip; label: string }[] = [
    { key: 'all', label: 'All Books' },
    { key: 'income', label: 'Client Income' },
    { key: 'expense', label: 'Business OpEx' },
    { key: 'draw', label: 'Partner Draws' },
    { key: 'unpaid', label: 'Pending Unpaid' },
  ];

  const handleExportCSV = () => {
    triggerHaptic(10);
    const headers = [
      'Date,Voucher ID,Type,Party/Account,Category,Memo/Description,Logged By,Status,Debit Outflow (INR),Credit Inflow (INR)',
    ];

    const rows = displayed.map((t) => {
      const isIncome = t.type === 'income';
      const isDraw = isPartnerDraw(t);
      const typeLabel = isIncome ? 'Income' : isDraw ? 'Partner Draw' : 'Operating Expense';
      const debit = !isIncome ? t.amount : '';
      const credit = isIncome ? t.amount : '';
      const voucher = `SM-${t.date.replace(/-/g, '')}-${t.id.slice(-4).toUpperCase()}`;
      const safeParty = `"${t.party.replace(/"/g, '""')}"`;
      const safeCat = `"${t.cat.replace(/"/g, '""')}"`;
      const safeDescr = `"${(t.descr || '').replace(/"/g, '""')}"`;
      const safeBy = `"${(t.by_name || '').replace(/"/g, '""')}"`;

      return `${t.date},${voucher},${typeLabel},${safeParty},${safeCat},${safeDescr},${safeBy},${t.status},${debit},${credit}`;
    });

    const csvContent = [
      '# Scale Magnet Accounting Ledger',
      `# Filter: ${filter} | Exported: ${new Date().toLocaleString('en-IN')}`,
      '',
      headers[0],
      ...rows,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scale-magnet-ledger-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-28 md:pb-12 pt-2">
      {/* Top Ledger Toolbar */}
      <div className="bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Row 1: Search & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6c6b65] dark:text-[#9b998f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, payee, category, memo, or amount…"
              className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-[#f7f6f2] dark:bg-[#22211e] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] placeholder:text-[#6c6b65] dark:placeholder:text-[#9b998f] focus:outline-none focus:border-[#0d234a] dark:focus:border-[#149e3e] transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  triggerHaptic(8);
                  setSearchQuery('');
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#e4e2da] dark:hover:bg-[#33322e]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Tools: Sort & Export */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => {
                triggerHaptic(8);
                setSortBy(e.target.value as SortOption);
              }}
              aria-label="Sort entries"
              className="h-10 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#f7f6f2] dark:bg-[#22211e] text-[#1b1b19] dark:text-[#efeee9] border border-[#e4e2da] dark:border-[#383733] focus:outline-none shrink-0"
            >
              <option value="date-desc">Newest Date</option>
              <option value="date-asc">Oldest Date</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>

            <button
              onClick={handleExportCSV}
              title="Download CSV Spreadsheet for QuickBooks, Tally, or Excel"
              className="h-10 px-3.5 rounded-xl bg-[#f7f6f2] dark:bg-[#22211e] hover:bg-[#eae8df] dark:hover:bg-[#2a2926] border border-[#e4e2da] dark:border-[#383733] text-xs font-bold text-[#0d234a] dark:text-[#efeee9] transition flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#149e3e]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter Tabs & Active Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f0eee6] dark:border-[#282724]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  triggerHaptic(8);
                  setFilter(opt.key);
                }}
                className={`min-h-[34px] px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  filter === opt.key
                    ? 'bg-[#0d234a] text-white shadow-xs'
                    : 'bg-[#f7f6f2] dark:bg-[#22211e] text-[#6c6b65] dark:text-[#9b998f] border border-[#e4e2da] dark:border-[#383733] hover:text-[#1b1b19] dark:hover:text-[#efeee9]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] flex items-center gap-2">
            <span>
              <b>{displayed.length}</b> {displayed.length === 1 ? 'entry' : 'entries'}
            </span>
            {(filter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  triggerHaptic(8);
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="text-[#0d234a] dark:text-[#5cc08a] font-bold hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary Ribbon for Current Ledger View (Desktop & Tablet) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-[#6c6b65] dark:text-[#9b998f] tracking-wider block">
            Filtered Revenue Inflow
          </span>
          <div className="text-base sm:text-lg font-extrabold text-[#149e3e] dark:text-[#5cc08a] tabular-nums mt-0.5">
            +{formatCurrency(totals.creditTotal)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-[#6c6b65] dark:text-[#9b998f] tracking-wider block">
            Filtered Operating OpEx
          </span>
          <div className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
            -{formatCurrency(totals.debitOpEx)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-[#6c6b65] dark:text-[#9b998f] tracking-wider block">
            Partner Profit Draws
          </span>
          <div className="text-base sm:text-lg font-extrabold text-[#0d234a] dark:text-[#93c5fd] tabular-nums mt-0.5">
            -{formatCurrency(totals.debitDraws)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-[#6c6b65] dark:text-[#9b998f] tracking-wider block">
            Pending Due (Receivable/Payable)
          </span>
          <div className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
            {formatCurrency(totals.unpaidTotal)}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP ACCOUNTING SPREADSHEET TABLE (hidden on mobile, visible on md+)  */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f7f6f2] dark:bg-[#201f1c] text-[#6c6b65] dark:text-[#9b998f] font-bold uppercase tracking-wider text-[10px] border-b border-[#e4e2da] dark:border-[#33322e]">
                <th className="py-3 px-3.5 w-24">Date</th>
                <th className="py-3 px-3 w-28">Voucher Ref</th>
                <th className="py-3 px-3 w-28">Type</th>
                <th className="py-3 px-4">Account / Entity</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">Memo / Description</th>
                <th className="py-3 px-3 w-24">Status</th>
                <th className="py-3 px-3.5 text-right w-28">Debit Outflow</th>
                <th className="py-3 px-3.5 text-right w-28">Credit Inflow</th>
                <th className="py-3 px-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eee6] dark:divide-[#282724]">
              {displayed.length > 0 ? (
                displayed.map((t) => {
                  const isIncome = t.type === 'income';
                  const isDraw = isPartnerDraw(t);
                  const isPaid = t.status === 'paid';
                  const voucherRef = `SM-${t.date.replace(/-/g, '').slice(2)}-${t.id.slice(-4).toUpperCase()}`;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => {
                        triggerHaptic(8);
                        onSelectTransaction(t);
                      }}
                      className="group hover:bg-[#f9f8f5] dark:hover:bg-[#22211e] transition-colors cursor-pointer"
                    >
                      {/* Date */}
                      <td className="py-3 px-3.5 font-mono text-[#6c6b65] dark:text-[#9b998f] whitespace-nowrap">
                        {t.date}
                      </td>

                      {/* Voucher Ref */}
                      <td className="py-3 px-3 font-mono text-[11px] text-[#0d234a] dark:text-[#93c5fd] font-semibold whitespace-nowrap">
                        {voucherRef}
                      </td>

                      {/* Classification Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isIncome ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#149e3e] dark:bg-emerald-950/60 dark:text-[#5cc08a]">
                            <ArrowDownLeft className="w-3 h-3" />
                            Income
                          </span>
                        ) : isDraw ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0d234a] dark:bg-blue-950/60 dark:text-[#93c5fd]">
                            <Users className="w-3 h-3 text-[#149e3e]" />
                            Partner Draw
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                            <ArrowUpRight className="w-3 h-3" />
                            OpEx
                          </span>
                        )}
                      </td>

                      {/* Account / Party */}
                      <td className="py-3 px-4 font-bold text-[#1b1b19] dark:text-[#efeee9] max-w-[180px] truncate">
                        <div className="truncate" title={t.party}>
                          {t.party}
                        </div>
                        {t.by_name && (
                          <div className="text-[10px] text-[#6c6b65] dark:text-[#9b998f] font-normal truncate">
                            by {t.by_name}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-[#6c6b65] dark:text-[#9b998f] max-w-[140px] truncate" title={t.cat}>
                        {t.cat}
                      </td>

                      {/* Memo */}
                      <td className="py-3 px-4 text-[#8c8a82] dark:text-[#88867f] max-w-[220px] truncate" title={t.descr || '-'}>
                        {t.descr ? `"${t.descr}"` : <span className="text-[#c4c2ba] dark:text-[#454440]">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-50 text-[#149e3e] dark:bg-emerald-950/60 dark:text-[#5cc08a]'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {t.status}
                        </span>
                      </td>

                      {/* Debit Outflow (Expenses & Draws) */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        {!isIncome ? (
                          <span className={isDraw ? 'text-[#0d234a] dark:text-[#93c5fd]' : 'text-rose-600 dark:text-rose-400'}>
                            -{formatCurrency(t.amount)}
                          </span>
                        ) : (
                          <span className="text-[#c4c2ba] dark:text-[#454440]">—</span>
                        )}
                      </td>

                      {/* Credit Inflow (Client Revenue) */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold tabular-nums text-[#149e3e] dark:text-[#5cc08a] whitespace-nowrap">
                        {isIncome ? (
                          `+${formatCurrency(t.amount)}`
                        ) : (
                          <span className="text-[#c4c2ba] dark:text-[#454440]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onOpenReceipt && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic(8);
                                onOpenReceipt(t);
                              }}
                              title="Generate Official Scale Magnet Receipt / Invoice"
                              className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#f0eee6] dark:bg-[#282724] text-[#0d234a] dark:text-[#5cc0a0] hover:bg-[#0d234a] hover:text-white dark:hover:bg-[#149e3e] dark:hover:text-white transition"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic(8);
                              onSelectTransaction(t);
                            }}
                            title="View Voucher Details & Audit"
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#f0eee6] dark:bg-[#282724] text-[#6c6b65] dark:text-[#9b998f] hover:text-[#1b1b19] dark:hover:text-[#efeee9] transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#6c6b65] dark:text-[#9b998f]">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-bold text-[#1b1b19] dark:text-[#efeee9]">No ledger records found</p>
                      <p>
                        {searchQuery
                          ? `No entries match "${searchQuery}". Try clearing your search.`
                          : 'No accounting transactions match the selected filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Footer Totals */}
            {displayed.length > 0 && (
              <tfoot>
                <tr className="bg-[#f7f6f2] dark:bg-[#201f1c] font-bold text-xs border-t-2 border-[#e4e2da] dark:border-[#33322e]">
                  <td colSpan={7} className="py-3 px-4 text-[#1b1b19] dark:text-[#efeee9] uppercase text-[11px] tracking-wider">
                    Total for Filtered Ledger ({displayed.length} records):
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                    -{formatCurrency(totals.totalDebit)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-extrabold text-[#149e3e] dark:text-[#5cc08a] tabular-nums">
                    +{formatCurrency(totals.creditTotal)}
                  </td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE LEDGER CARD LIST (visible on mobile < md, hidden on desktop md+)  */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-2.5">
        {displayed.length > 0 ? (
          displayed.map((t) => {
            const isIncome = t.type === 'income';
            const isDraw = isPartnerDraw(t);
            const isPaid = t.status === 'paid';

            return (
              <div
                key={t.id}
                onClick={() => {
                  triggerHaptic(10);
                  onSelectTransaction(t);
                }}
                className="bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-3.5 flex items-center justify-between gap-3 active:scale-[0.98] transition cursor-pointer hover:border-[#0d234a]/40 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category / Type indicator circle */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-50 text-[#149e3e] dark:bg-emerald-950/60 dark:text-[#5cc08a]'
                        : isDraw
                        ? 'bg-blue-50 text-[#0d234a] dark:bg-blue-950/60 dark:text-[#93c5fd]'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : isDraw ? (
                      <Users className="w-5 h-5 text-[#0d234a] dark:text-[#60a5fa]" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  {/* Transaction metadata */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1b1b19] dark:text-[#efeee9] truncate">
                        {t.party}
                      </span>
                      {isDraw ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-900/60 text-[#0d234a] dark:text-blue-200 uppercase tracking-wider shrink-0">
                          Partner Draw
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            isPaid
                              ? 'bg-emerald-50 text-[#149e3e] dark:bg-emerald-950/60 dark:text-[#5cc08a]'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#6c6b65] dark:text-[#9b998f] flex items-center gap-1.5 mt-0.5 truncate">
                      <span>{t.cat}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t.date}</span>
                      {t.by_name && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">by {t.by_name}</span>
                        </>
                      )}
                    </div>

                    {t.descr && (
                      <div className="text-xs text-[#8c8a82] dark:text-[#88867f] italic truncate mt-0.5">
                        "{t.descr}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount & Quick Receipt Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-extrabold tabular-nums ${
                        isIncome
                          ? 'text-[#149e3e] dark:text-[#5cc08a]'
                          : isDraw
                          ? 'text-[#0d234a] dark:text-[#93c5fd]'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatCurrency(t.amount)}
                    </div>
                  </div>

                  {onOpenReceipt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(8);
                        onOpenReceipt(t);
                      }}
                      title="View & Share Scale Magnet Receipt / Invoice"
                      aria-label="View and share receipt"
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#f0eee6] dark:bg-[#282724] text-[#0d234a] dark:text-[#5cc0a0] hover:bg-[#0d234a] hover:text-white dark:hover:bg-[#149e3e] dark:hover:text-white transition active:scale-95"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-[#1b1b19] dark:text-[#efeee9]">
              No entries found
            </p>
            <p className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
              {searchQuery
                ? `No transactions matching "${searchQuery}"`
                : 'No transactions found for the selected filter.'}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button
                onClick={() => {
                  triggerHaptic(8);
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#e4e2da] dark:bg-[#33322e] text-[#1b1b19] dark:text-[#efeee9]"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
