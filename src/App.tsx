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
import { ReceiptModal } from './components/ReceiptModal';
import { PartnerSplitModal } from './components/PartnerSplitModal';
import { PartnerConfig, DEFAULT_PARTNER_CONFIG } from './lib/partnerSplit';
import { MenuSheet } from './components/MenuSheet';
import { NameModal } from './components/NameModal';
import { LoginScreen } from './components/LoginScreen';
import { PartnerSecurityModal } from './components/PartnerSecurityModal';
import {
  AuthSession,
  getStoredSession,
  saveStoredSession,
  getStoredAccounts,
} from './lib/auth';
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

  // Authentication session for the 2 business partners
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isNewEntryOpen, setIsNewEntryOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [isPartnerSplitOpen, setIsPartnerSplitOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [entriesFilter, setEntriesFilter] = useState<'all' | 'income' | 'expense' | 'draw' | 'unpaid'>('all');

  // Synchronize authenticated partner name with transaction author
  useEffect(() => {
    if (session?.name && session.name !== userName) {
      setUserName(session.name);
    }
  }, [session, userName, setUserName]);

  // Partner Split Configuration synced with partner accounts
  const [partnerConfig, setPartnerConfig] = useState<PartnerConfig>(() => {
    try {
      const saved = localStorage.getItem('ab.partner_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.partner1Name === 'Rahman' || parsed.partner1Name === 'Partner 1') {
          parsed.partner1Name = 'Abdul';
        }
        if (parsed.partner2Name === 'Partner 2') {
          parsed.partner2Name = 'Punith';
        }
        return parsed;
      }
    } catch {}
    const accounts = getStoredAccounts();
    const p1 = accounts.find((a) => a.id === 'p1');
    const p2 = accounts.find((a) => a.id === 'p2');
    return {
      partner1Name: p1?.name || 'Abdul',
      partner2Name: p2?.name || 'Punith',
      partner1SharePct: 50,
      partner2SharePct: 50,
      agencyReservePct: 0,
    };
  });

  const updatePartnerConfig = (cfg: PartnerConfig) => {
    setPartnerConfig(cfg);
    try {
      localStorage.setItem('ab.partner_config', JSON.stringify(cfg));
    } catch {}
  };

  const handleLogout = () => {
    saveStoredSession(null);
    setSession(null);
  };

  const handleRecordPartnerDraw = async (entry: {
    partnerName: string;
    amount: number;
    date: string;
    descr: string;
  }) => {
    await addTransaction({
      type: 'expense',
      amount: entry.amount,
      party: entry.partnerName,
      cat: 'Partner Draw / Profit Share',
      date: entry.date,
      status: 'paid',
      descr: entry.descr,
    });
  };

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

  // If not logged in, render the dedicated Partner Login Screen
  if (!session) {
    return (
      <LoginScreen
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          setUserName(newSession.name);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] dark:bg-[#121312] text-[#1b1b19] dark:text-[#efeee9] flex flex-col font-sans transition-colors selection:bg-[#1f5f4a]/20">
      {/* Top Header with desktop accounting navigation tabs and controls */}
      <Header
        userName={userName}
        currentSession={session}
        isOnline={isOnline}
        isSyncing={isSyncing}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenNameModal={() => setIsNameModalOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onLogout={handleLogout}
        onOpenMenu={() => setIsMenuOpen(true)}
        onRefresh={refreshData}
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'entries') setEntriesFilter('all');
        }}
        unpaidCount={unpaidCount}
        onOpenNewEntry={() => setIsNewEntryOpen(true)}
      />

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 font-medium">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode — Viewing locally cached data</span>
        </div>
      )}

      {/* Main Content Area: Responsive accounting canvas (max-w-7xl for desktop Windows tabs) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        {activeTab === 'overview' && (
          <OverviewView
            transactions={activeTransactions}
            onOpenNewEntry={() => setIsNewEntryOpen(true)}
            onFilterUnpaid={handleFilterUnpaidFromOverview}
            partnerConfig={partnerConfig}
            onOpenSplitModal={() => setIsPartnerSplitOpen(true)}
            onQuickRecordDraw={() => setIsPartnerSplitOpen(true)}
          />
        )}

        {activeTab === 'entries' && (
          <EntriesView
            transactions={activeTransactions}
            onSelectTransaction={(t) => setSelectedTransaction(t)}
            onOpenReceipt={(t) => setReceiptTransaction(t)}
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
        onOpenReceipt={(t) => setReceiptTransaction(t)}
      />

      {/* Transaction Detail & Actions Sheet */}
      <EntryDetailSheet
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onToggleStatus={updateStatus}
        onDelete={deleteTransaction}
        onOpenReceipt={(t) => {
          setSelectedTransaction(null);
          setReceiptTransaction(t);
        }}
        userName={userName}
        onRequireName={() => setIsNameModalOpen(true)}
      />

      {/* Scale Magnet Official Receipt & Invoice Modal */}
      <ReceiptModal
        transaction={receiptTransaction}
        isOpen={!!receiptTransaction}
        onClose={() => setReceiptTransaction(null)}
        userName={userName}
      />

      {/* More Menu & Settings Sheet */}
      <MenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userName={userName}
        currentSession={session}
        onOpenNameModal={() => {
          setIsMenuOpen(false);
          setIsNameModalOpen(true);
        }}
        onOpenSecurityModal={() => {
          setIsMenuOpen(false);
          setIsSecurityModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenPartnerSplit={() => setIsPartnerSplitOpen(true)}
        transactions={activeTransactions}
        onImportBackup={importTransactions}
        theme={theme}
        onToggleTheme={toggleTheme}
        isOnline={isOnline}
      />

      {/* Partner Profit Split & Draws Modal */}
      <PartnerSplitModal
        isOpen={isPartnerSplitOpen}
        onClose={() => setIsPartnerSplitOpen(false)}
        transactions={activeTransactions}
        partnerConfig={partnerConfig}
        onUpdatePartnerConfig={updatePartnerConfig}
        onRecordDraw={handleRecordPartnerDraw}
        userName={userName}
      />

      {/* Partner Credentials & Passwords Management Modal */}
      <PartnerSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        currentSession={session}
        onSessionUpdated={(updated) => {
          setSession(updated);
          setUserName(updated.name);
        }}
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
