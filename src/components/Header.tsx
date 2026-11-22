import React from 'react';
import { User, Sun, Moon, MoreHorizontal, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { triggerHaptic } from '../lib/supabase';

interface HeaderProps {
  userName: string;
  isOnline: boolean;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenNameModal: () => void;
  onOpenMenu: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  isOnline,
  isSyncing,
  theme,
  onToggleTheme,
  onOpenNameModal,
  onOpenMenu,
  onRefresh,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#f7f6f2]/90 dark:bg-[#121312]/90 backdrop-blur-md border-b border-[#e4e2da] dark:border-[#282724] pt-safe transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand wordmark + Scale Magnet Logo + connection status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/scale-magnet-logo.png"
            alt="Scale Magnet"
            className="h-7 max-w-[120px] sm:max-w-[140px] w-auto object-contain shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-[#1b1b19] dark:text-[#efeee9] truncate">
                Agency Books
              </h1>
              {/* Live sync pulse */}
              <button
                onClick={() => {
                  triggerHaptic(10);
                  onRefresh();
                }}
                title={isOnline ? (isSyncing ? "Syncing..." : "Live sync active") : "Offline"}
                aria-label="Sync status"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
              >
                {isSyncing ? (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                ) : isOnline ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
                <span className="hidden sm:inline">
                  {isSyncing ? 'Syncing' : isOnline ? 'Live' : 'Offline'}
                </span>
              </button>
            </div>
            <button
              onClick={onOpenNameModal}
              className="text-left text-xs text-[#6c6b65] dark:text-[#9b998f] truncate block hover:text-[#1f5f4a] dark:hover:text-[#5cc0a0] transition-colors"
            >
              {userName ? `Hi, ${userName}` : 'Tap to set name'}
            </button>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Refresh */}
          <button
            onClick={() => {
              triggerHaptic(10);
              onRefresh();
            }}
            aria-label="Refresh data"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#e9e7df] dark:hover:bg-[#201f1c] active:scale-95 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#1f5f4a]' : ''}`} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              triggerHaptic(10);
              onToggleTheme();
            }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#e9e7df] dark:hover:bg-[#201f1c] active:scale-95 transition"
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
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#e9e7df] dark:bg-[#22211e] text-[#1b1b19] dark:text-[#efeee9] hover:bg-[#dfddd4] dark:hover:bg-[#2c2a26] active:scale-95 transition font-semibold"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
