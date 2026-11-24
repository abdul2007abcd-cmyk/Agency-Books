import React from 'react';
import { RefreshCw, Sun, Moon, MoreHorizontal, Shield, LogOut, KeyRound, Plus, LayoutDashboard, ReceiptText, BarChart3, History } from 'lucide-react';
import { triggerHaptic } from '../lib/supabase';
import { AuthSession } from '../lib/auth';
import { TabType } from './Navigation';

interface HeaderProps {
  userName: string;
  currentSession: AuthSession | null;
  isOnline: boolean;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenNameModal: () => void;
  onOpenSecurityModal?: () => void;
  onLogout?: () => void;
  onOpenMenu: () => void;
  onRefresh: () => void;
  activeTab?: TabType;
  onChangeTab?: (tab: TabType) => void;
  unpaidCount?: number;
  onOpenNewEntry?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  currentSession,
  isOnline,
  isSyncing,
  theme,
  onToggleTheme,
  onOpenNameModal,
  onOpenSecurityModal,
  onLogout,
  onOpenMenu,
  onRefresh,
  activeTab = 'overview',
  onChangeTab,
  unpaidCount = 0,
  onOpenNewEntry,
}) => {
  const displayName = currentSession?.name || userName || 'Partner';
  const roleLabel = currentSession?.role || 'Partner';

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'entries', label: 'Ledger', icon: ReceiptText, badge: unpaidCount },
    { id: 'analytics', label: 'Reports', icon: BarChart3 },
    { id: 'activity', label: 'Audit Log', icon: History },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#ffffff]/95 dark:bg-[#151513]/95 backdrop-blur-md border-b border-[#e4e2da] dark:border-[#282724] pt-safe transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand wordmark + Scale Magnet Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/scale-magnet-logo.png"
            alt="Scale Magnet"
            className="h-8 max-w-[130px] sm:max-w-[150px] w-auto object-contain shrink-0"
          />
          <div className="hidden sm:block border-l border-[#e4e2da] dark:border-[#2d2c28] pl-3">
            <h1 className="font-bold text-sm tracking-tight text-[#1b1b19] dark:text-[#efeee9] leading-tight">
              Agency Books
            </h1>
            <div className="text-[10px] text-[#6c6b65] dark:text-[#9b998f] tracking-wide font-medium">
              Scale Magnet Accounting
            </div>
          </div>
        </div>

        {/* Desktop Accounting Navigation Tabs (Centered for Desktop Windows Tabs) */}
        {onChangeTab && (
          <nav className="hidden md:flex items-center gap-1 bg-[#f0eee6] dark:bg-[#201f1c] p-1 rounded-2xl border border-[#e4e2da]/70 dark:border-[#2e2d29]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    triggerHaptic(8);
                    onChangeTab(item.id);
                  }}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-[#121312] text-[#0d234a] dark:text-[#5cc08a] shadow-xs'
                      : 'text-[#6c6b65] dark:text-[#9b998f] hover:text-[#1b1b19] dark:hover:text-[#efeee9]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0d234a] dark:text-[#5cc08a]' : ''}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop Primary Action: + New Entry */}
          {onOpenNewEntry && (
            <button
              onClick={() => {
                triggerHaptic(12);
                onOpenNewEntry();
              }}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#149e3e] hover:bg-[#118434] active:scale-95 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          )}

          {/* Active Partner Pill with Security Modal trigger */}
          <button
            onClick={() => {
              triggerHaptic(8);
              if (onOpenSecurityModal) onOpenSecurityModal();
              else onOpenNameModal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f0eee6] dark:bg-[#201f1c] hover:bg-[#e4e2da] dark:hover:bg-[#2c2b27] border border-[#e4e2da]/80 dark:border-[#33322e] text-xs font-semibold text-[#1b1b19] dark:text-[#efeee9] transition active:scale-95"
            title="Logged in partner. Click to change password or security settings."
          >
            <KeyRound className="w-3.5 h-3.5 text-[#0d234a] dark:text-[#5cc08a]" />
            <span className="font-bold text-xs">{displayName}</span>
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded-md bg-[#0d234a]/10 dark:bg-[#0d234a]/40 text-[#0d234a] dark:text-[#93c5fd] font-semibold">
              {roleLabel}
            </span>
          </button>

          {/* Live sync pulse */}
          <button
            onClick={() => {
              triggerHaptic(10);
              onRefresh();
            }}
            title={isOnline ? (isSyncing ? 'Syncing...' : 'Live sync active') : 'Offline'}
            aria-label="Sync status"
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 transition hover:bg-emerald-100"
          >
            {isSyncing ? (
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 dark:text-emerald-400" />
            ) : isOnline ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
            <span className="hidden lg:inline text-[11px] font-semibold">
              {isSyncing ? 'Syncing' : isOnline ? 'Live Cloud' : 'Offline'}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              triggerHaptic(10);
              onToggleTheme();
            }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#e9e7df] dark:hover:bg-[#201f1c] active:scale-95 transition"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Menu Trigger */}
          <button
            onClick={() => {
              triggerHaptic(10);
              onOpenMenu();
            }}
            aria-label="Open settings menu"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#e9e7df] dark:bg-[#22211e] text-[#1b1b19] dark:text-[#efeee9] hover:bg-[#dfddd4] dark:hover:bg-[#2c2a26] active:scale-95 transition font-semibold"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

