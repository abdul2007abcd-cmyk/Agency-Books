import React, { useState, useMemo } from 'react';
import { Transaction, formatCurrency, triggerHaptic } from '../lib/supabase';
import { Search, X, ArrowUpRight, ArrowDownLeft, Clock, Filter, ArrowUpDown } from 'lucide-react';

interface EntriesViewProps {
  transactions: Transaction[];
  onSelectTransaction: (t: Transaction) => void;
  initialFilter?: 'all' | 'income' | 'expense' | 'unpaid';
}

type FilterChip = 'all' | 'income' | 'expense' | 'unpaid';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export const EntriesView: React.FC<EntriesViewProps> = ({
  transactions,
  onSelectTransaction,
  initialFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterChip>(initialFilter);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Filtered & sorted
  const displayed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = transactions.filter((t) => {
      // Type/status chip
      if (filter === 'income' && t.type !== 'income') return false;
      if (filter === 'expense' && t.type !== 'expense') return false;
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

  const filterOptions: { key: FilterChip; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expenses' },
    { key: 'unpaid', label: 'Unpaid' },
  ];

  return (
    <div className="space-y-3 pb-28 pt-2">
      {/* Mobile Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#6c6b65] dark:text-[#9b998f] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search client, vendor, category, note…"
          className="w-full pl-9 pr-10 py-3 text-sm bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-xl text-[#1b1b19] dark:text-[#efeee9] placeholder:text-[#6c6b65] dark:placeholder:text-[#9b998f] focus:outline-none focus:border-[#1f5f4a] dark:focus:border-[#5cc0a0] transition"
        />
        {searchQuery && (
          <button
            onClick={() => {
              triggerHaptic(8);
              setSearchQuery('');
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#e4e2da] dark:hover:bg-[#33322e]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Chips & Sort row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                triggerHaptic(8);
                setFilter(opt.key);
              }}
              className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                filter === opt.key
                  ? 'bg-[#1f5f4a] text-white shadow-xs'
                  : 'bg-[#ffffff] dark:bg-[#1e1d1b] text-[#6c6b65] dark:text-[#9b998f] border border-[#e4e2da] dark:border-[#33322e] hover:text-[#1b1b19]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <select
          value={sortBy}
          onChange={(e) => {
            triggerHaptic(8);
            setSortBy(e.target.value as SortOption);
          }}
          aria-label="Sort entries"
          className="min-h-[36px] text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-[#ffffff] dark:bg-[#1e1d1b] text-[#6c6b65] dark:text-[#9b998f] border border-[#e4e2da] dark:border-[#33322e] focus:outline-none shrink-0"
        >
          <option value="date-desc">Newest</option>
          <option value="date-asc">Oldest</option>
          <option value="amount-desc">High ₹</option>
          <option value="amount-asc">Low ₹</option>
        </select>
      </div>

      {/* Summary line */}
      <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] px-1 flex items-center justify-between">
        <span>Showing {displayed.length} {displayed.length === 1 ? 'entry' : 'entries'}</span>
        {filter !== 'all' && (
          <button
            onClick={() => {
              triggerHaptic(8);
              setFilter('all');
              setSearchQuery('');
            }}
            className="text-[#1f5f4a] dark:text-[#5cc0a0] font-semibold hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {displayed.length > 0 ? (
          displayed.map((t) => {
            const isIncome = t.type === 'income';
            const isPaid = t.status === 'paid';

            return (
              <div
                key={t.id}
                onClick={() => {
                  triggerHaptic(10);
                  onSelectTransaction(t);
                }}
                className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-3.5 flex items-center justify-between gap-3 active:scale-[0.98] transition cursor-pointer hover:border-[#1f5f4a]/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category / Type indicator circle */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-50 text-[#1c7a4b] dark:bg-emerald-950/60 dark:text-[#5cc08a]'
                        : 'bg-rose-50 text-[#b43e28] dark:bg-rose-950/60 dark:text-[#ec8a73]'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>

                  {/* Transaction metadata */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#1b1b19] dark:text-[#efeee9] truncate">
                        {t.party}
                      </span>
                      {/* Status indicator */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isPaid
                            ? 'bg-emerald-50 text-[#1c7a4b] dark:bg-emerald-950/60 dark:text-[#5cc08a]'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#6c6b65] dark:text-[#9b998f] flex items-center gap-1.5 mt-0.5 truncate">
                      <span>{t.cat}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t.date}</span>
                      {t.by_name && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{t.by_name}</span>
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

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm sm:text-base font-bold tabular-nums ${
                      isIncome
                        ? 'text-[#1c7a4b] dark:text-[#5cc08a]'
                        : 'text-[#b43e28] dark:text-[#ec8a73]'
                    }`}
                  >
                    {isIncome ? '+' : '−'}
                    {formatCurrency(t.amount)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-[#1b1b19] dark:text-[#efeee9]">
              No entries found
            </p>
            <p className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
              {searchQuery
                ? `No transactions matching "${searchQuery}"`
                : 'No transactions logged in this category.'}
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
