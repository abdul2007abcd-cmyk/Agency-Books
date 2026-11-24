import React, { useRef, useState } from 'react';
import { Transaction, triggerHaptic } from '../lib/supabase';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AuthSession } from '../lib/auth';
import {
  X,
  User,
  Download,
  Upload,
  FileSpreadsheet,
  Smartphone,
  Sun,
  Moon,
  Info,
  Check,
  Share2,
  Users,
  ChevronRight,
  KeyRound,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface MenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  currentSession: AuthSession | null;
  onOpenNameModal: () => void;
  onOpenSecurityModal?: () => void;
  onLogout?: () => void;
  onOpenPartnerSplit?: () => void;
  transactions: Transaction[];
  onImportBackup: (rows: any[]) => Promise<void>;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isOnline: boolean;
}

export const MenuSheet: React.FC<MenuSheetProps> = ({
  isOpen,
  onClose,
  userName,
  currentSession,
  onOpenNameModal,
  onOpenSecurityModal,
  onLogout,
  onOpenPartnerSplit,
  transactions,
  onImportBackup,
  theme,
  onToggleTheme,
  isOnline,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

  if (!isOpen) return null;

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    triggerHaptic(10);
    const escapeCSV = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const headers = 'Date,Type,Client/Vendor,Category,Note,Amount,Status,Added By';
    const rows = transactions.map((t) =>
      [
        t.date,
        t.type,
        escapeCSV(t.party),
        escapeCSV(t.cat),
        escapeCSV(t.descr),
        t.amount,
        t.status,
        escapeCSV(t.by_name),
      ].join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const filename = `agency-books-${new Date().toISOString().slice(0, 10)}.csv`;

    // Try Web Share with file if supported
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const file = new File([csvContent], filename, { type: 'text/csv' });
        if (navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: 'Agency Books Export',
            text: 'Here is the exported CSV from Agency Books.',
          });
          return;
        }
      } catch (e) {
        // Fallback to download
      }
    }

    downloadFile(filename, csvContent, 'text/csv');
  };

  const exportBackupJSON = () => {
    triggerHaptic(10);
    const jsonContent = JSON.stringify(transactions, null, 2);
    const filename = `agency-books-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(filename, jsonContent, 'application/json');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Reading backup file...');
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('File does not contain a list of transactions.');

      await onImportBackup(parsed);
      setImportStatus(`Successfully imported ${parsed.length} entries!`);
      setTimeout(() => {
        setImportStatus('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setImportStatus(`Error: ${err?.message || 'Invalid backup JSON file'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#ffffff] dark:bg-[#1c1b18] rounded-t-3xl sm:rounded-3xl border border-[#e4e2da] dark:border-[#33322e] shadow-2xl p-5 sm:p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] transition-all space-y-4"
      >
        {/* Drag handle for mobile */}
        <div className="w-10 h-1.5 bg-[#d8d6ce] dark:bg-[#383733] rounded-full mx-auto mb-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
          <h2 id="menu-title" className="text-lg font-bold text-[#1b1b19] dark:text-[#efeee9]">
            Options & Tools
          </h2>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#f0eee6] dark:hover:bg-[#282723]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {importStatus && (
          <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
            {importStatus}
          </div>
        )}

        {/* Partner Identity Card */}
        <div className="p-4 bg-[#f7f6f2] dark:bg-[#242320] rounded-2xl border border-[#e4e2da] dark:border-[#33322e] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#0d234a] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {(currentSession?.name || userName || 'P').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-[#0d234a] dark:text-[#efeee9]">
                    {currentSession?.name || userName || 'Partner'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#149e3e]/15 text-[#149e3e] dark:text-[#5cc08a] font-semibold">
                    {currentSession?.role || 'Partner'}
                  </span>
                </div>
                <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] font-mono mt-0.5">
                  ID: @{currentSession?.username || 'user'}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  triggerHaptic(10);
                  onClose();
                  onLogout();
                }}
                title="Sign out of partner account"
                className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick buttons under partner card */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#e4e2da]/70 dark:border-[#383733]/70">
            {onOpenSecurityModal && (
              <button
                onClick={() => {
                  triggerHaptic(8);
                  onClose();
                  onOpenSecurityModal();
                }}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#383733] text-[11px] font-semibold text-[#0d234a] dark:text-[#efeee9] hover:border-[#0d234a] dark:hover:border-[#149e3e] flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#149e3e]" />
                <span>Partner Passwords</span>
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic(8);
                onOpenNameModal();
              }}
              className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#383733] text-[11px] font-semibold text-[#6c6b65] dark:text-[#9b998f] hover:text-[#1b1b19] flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-[#6c6b65]" />
              <span>Change Display</span>
            </button>
          </div>
        </div>

        {/* Partner Profit Split Action Button */}
        {onOpenPartnerSplit && (
          <button
            onClick={() => {
              triggerHaptic(8);
              onClose();
              onOpenPartnerSplit();
            }}
            className="w-full p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 border border-blue-200/70 dark:border-blue-800/40 text-left flex items-center justify-between text-xs font-semibold text-[#0d234a] dark:text-[#93c5fd] transition"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-[#0d234a] dark:text-[#60a5fa]" />
              <div>
                <div className="font-bold">Partner Profit Split & Equity</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-300 font-normal">
                  Live split shares, partner draws, and statements
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-500" />
          </button>
        )}

        {/* PWA Install Button Section */}
        {!isInstalled && (
          <div className="p-3.5 bg-[#f7f6f2] dark:bg-[#242320] rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#1f5f4a] dark:text-[#5cc0a0]" />
              <span className="text-xs font-bold text-[#1b1b19] dark:text-[#efeee9]">
                Mobile Web App
              </span>
            </div>
            <p className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
              Install on your phone home screen for full-screen offline access.
            </p>

            {isInstallable && (
              <button
                onClick={async () => {
                  triggerHaptic(10);
                  await install();
                }}
                className="w-full py-2.5 rounded-xl bg-[#1f5f4a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition"
              >
                <Download className="w-4 h-4" />
                Install Agency Books App
              </button>
            )}

            {isIOS && (
              <div>
                <button
                  onClick={() => setShowIOSInstructions(!showIOSInstructions)}
                  className="w-full py-2.5 rounded-xl bg-[#ffffff] dark:bg-[#1c1b18] border border-[#e4e2da] dark:border-[#383733] text-xs font-semibold text-[#1b1b19] dark:text-[#efeee9] flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-[#1f5f4a]" />
                  Add to iPhone Home Screen
                </button>
                {showIOSInstructions && (
                  <div className="mt-2 p-3 text-xs rounded-xl bg-white dark:bg-[#1c1b18] border border-[#e4e2da] dark:border-[#383733] text-[#6c6b65] dark:text-[#9b998f] space-y-1">
                    <p>1. In Safari, tap the <b>Share</b> button (square with arrow up).</p>
                    <p>2. Scroll down and tap <b>Add to Home Screen</b>.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Export & Backup Actions */}
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f] px-1">
            Data & Backup
          </span>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="w-full p-3.5 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] hover:bg-[#efece3] dark:hover:bg-[#2c2a26] text-left flex items-center justify-between text-xs font-semibold text-[#1b1b19] dark:text-[#efeee9] transition"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-[#1f5f4a] dark:text-[#5cc0a0]" />
              <span>Export CSV Spreadsheet</span>
            </div>
            <Download className="w-4 h-4 text-[#6c6b65]" />
          </button>

          {/* Save JSON Backup */}
          <button
            onClick={exportBackupJSON}
            className="w-full p-3.5 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] hover:bg-[#efece3] dark:hover:bg-[#2c2a26] text-left flex items-center justify-between text-xs font-semibold text-[#1b1b19] dark:text-[#efeee9] transition"
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-[#1f5f4a] dark:text-[#5cc0a0]" />
              <span>Download JSON Backup</span>
            </div>
            <span className="text-[10px] text-[#6c6b65]">.json</span>
          </button>

          {/* Restore JSON Backup */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3.5 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] hover:bg-[#efece3] dark:hover:bg-[#2c2a26] text-left flex items-center justify-between text-xs font-semibold text-[#1b1b19] dark:text-[#efeee9] transition"
          >
            <div className="flex items-center gap-2.5">
              <Upload className="w-4 h-4 text-[#1f5f4a] dark:text-[#5cc0a0]" />
              <span>Restore from Backup File</span>
            </div>
            <span className="text-[10px] text-[#6c6b65]">Upload</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Theme & Display */}
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#6c6b65] dark:text-[#9b998f] px-1">
            Display Theme
          </span>
          <div className="grid grid-cols-2 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-xl">
            <button
              onClick={() => {
                if (theme !== 'light') onToggleTheme();
              }}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                theme === 'light'
                  ? 'bg-[#ffffff] text-[#1b1b19] shadow-xs'
                  : 'text-[#6c6b65] dark:text-[#9b998f]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Light
            </button>
            <button
              onClick={() => {
                if (theme !== 'dark') onToggleTheme();
              }}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                theme === 'dark'
                  ? 'bg-[#1c1b18] text-[#efeee9] shadow-xs'
                  : 'text-[#6c6b65] dark:text-[#9b998f]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
          </div>
        </div>

        {/* App Footer Info */}
        <div className="pt-2 text-center text-[11px] text-[#6c6b65] dark:text-[#9b998f] space-y-0.5">
          <p>Agency Books · Multi-device Realtime Sync</p>
          <p>{transactions.length} entries stored in database</p>
        </div>
      </div>
    </div>
  );
};
