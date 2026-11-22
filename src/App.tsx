import React, { useState, useEffect } from 'react';
import { useBooksData } from './hooks/useBooksData';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { FloatingActionButton } from './components/FloatingActionButton';
import { OverviewView } from './components/OverviewView';
import { EntriesView } from './components/EntriesView';
import { AnalyticsView } from './components/AnalyticsView';
import { ActivityView } from './components/ActivityView';
import { NewEntrySheet } from './components/NewEntrySheet';
import { EntryDetailSheet } from './components/EntryDetailSheet';
import { MenuSheet } from './components/MenuSheet';
import { NameModal } from './components/NameModal';
import { Transaction } from './lib/supabase';
import { WifiOff, AlertCircle } from 'lucide-react';

export default function App() {
  const {
    userName,
    setUserName,
    transactions,
    activeTransactions,
    activities,
    recentParties,
    isSyncing,
    isOnline,
    errorMessage,
    refreshData,
    addTransaction,
    updateStatus,
    deleteTransaction,
    restoreTransaction,
    importTransactions,
  } = useBooksData();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isNewEntryOpen, setIsNewEntryOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [entriesFilter, setEntriesFilter] = useState<'all' | 'income' | 'expense' | 'unpaid'>('all');

  // Theme management: light / dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('ab.theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('ab.theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Prompt for user name on first load if missing
  useEffect(() => {
    if (!userName) {
      const timer = setTimeout(() => {
        setIsNameModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userName]);

  // Count unpaid items
  const unpaidCount = activeTransactions.filter((t) => t.status === 'unpaid').length;

  const handleFilterUnpaidFromOverview = () => {
    setEntriesFilter('unpaid');
    setActiveTab('entries');
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] dark:bg-[#121312] text-[#1b1b19] dark:text-[#efeee9] flex flex-col font-sans transition-colors selection:bg-[#1f5f4a]/20">
      {/* Top Header */}
      <Header
        userName={userName}
        isOnline={isOnline}
        isSyncing={isSyncing}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenNameModal={() => setIsNameModalOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        onRefresh={refreshData}
      />

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 font-medium">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode — Viewing locally cached data</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4">
        {activeTab === 'overview' && (
          <OverviewView
            transactions={activeTransactions}
            onOpenNewEntry={() => setIsNewEntryOpen(true)}
            onFilterUnpaid={handleFilterUnpaidFromOverview}
          />
        )}

        {activeTab === 'entries' && (
          <EntriesView
            transactions={activeTransactions}
            onSelectTransaction={(t) => setSelectedTransaction(t)}
            initialFilter={entriesFilter}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView transactions={activeTransactions} />
        )}

        {activeTab === 'activity' && (
          <ActivityView
            activities={activities}
            transactions={transactions}
            onRestore={restoreTransaction}
          />
        )}
      </main>

      {/* Floating Action Button for Logging Transactions */}
      <FloatingActionButton onClick={() => setIsNewEntryOpen(true)} />

      {/* Fixed Bottom Navigation (Thumb Zone) */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'entries') setEntriesFilter('all');
        }}
        unpaidCount={unpaidCount}
      />

      {/* New Entry Modal Sheet */}
      <NewEntrySheet
        isOpen={isNewEntryOpen}
        onClose={() => setIsNewEntryOpen(false)}
        onSave={addTransaction}
        recentParties={recentParties}
        userName={userName}
        onRequireName={() => setIsNameModalOpen(true)}
      />

      {/* Transaction Detail & Actions Sheet */}
      <EntryDetailSheet
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onToggleStatus={updateStatus}
        onDelete={deleteTransaction}
        userName={userName}
        onRequireName={() => setIsNameModalOpen(true)}
      />

      {/* More Menu & Settings Sheet */}
      <MenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userName={userName}
        onOpenNameModal={() => {
          setIsMenuOpen(false);
          setIsNameModalOpen(true);
        }}
        transactions={activeTransactions}
        onImportBackup={importTransactions}
        theme={theme}
        onToggleTheme={toggleTheme}
        isOnline={isOnline}
      />

      {/* Name Setup Modal */}
      <NameModal
        isOpen={isNameModalOpen}
        currentName={userName}
        onSave={setUserName}
        onClose={() => setIsNameModalOpen(false)}
        canDismiss={!!userName}
      />
    </div>
  );
}
