import React, { useState } from 'react';
import {
  PartnerAccount,
  getStoredAccounts,
  updatePartnerCredentials,
  resetAccountsToDefault,
  AuthSession,
} from '../lib/auth';
import { triggerHaptic } from '../lib/supabase';
import { X, KeyRound, Shield, Check, Lock, User, RefreshCw, RotateCcw } from 'lucide-react';

interface PartnerSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: AuthSession | null;
  onSessionUpdated: (session: AuthSession) => void;
}

export const PartnerSecurityModal: React.FC<PartnerSecurityModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onSessionUpdated,
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<'p1' | 'p2'>(
    currentSession?.partnerId || 'p1'
  );

  const accounts = getStoredAccounts();
  const currentAcc = accounts.find((a) => a.id === selectedPartnerId) || accounts[0];

  const [username, setUsername] = useState(currentAcc.username);
  const [name, setName] = useState(currentAcc.name);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSelectPartner = (id: 'p1' | 'p2') => {
    triggerHaptic(8);
    setSelectedPartnerId(id);
    const acc = accounts.find((a) => a.id === id);
    if (acc) {
      setUsername(acc.username);
      setName(acc.name);
    }
    setNewPassword('');
    setConfirmPassword('');
    setMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!username.trim() || !name.trim()) {
      setMsg({ text: 'Username and display name cannot be blank.', isError: true });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }

    try {
      setIsSaving(true);
      triggerHaptic(10);
      const res = await updatePartnerCredentials(selectedPartnerId, {
        username: username.trim(),
        name: name.trim(),
        newPassword: newPassword.trim() || undefined,
      });

      if (!res.success) {
        setMsg({ text: res.error || 'Failed to update credentials.', isError: true });
        return;
      }

      setMsg({ text: `Credentials for ${name.trim()} updated successfully!`, isError: false });
      setNewPassword('');
      setConfirmPassword('');

      // Refresh current session if matching
      if (currentSession && currentSession.partnerId === selectedPartnerId) {
        onSessionUpdated({
          ...currentSession,
          username: username.trim(),
          name: name.trim(),
        });
      }

      setTimeout(() => {
        setMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setMsg({ text: err?.message || 'Error updating credentials.', isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-modal-title"
        className="relative w-full max-w-md bg-[#ffffff] dark:bg-[#1a1917] rounded-t-3xl sm:rounded-3xl border border-[#e4e2da] dark:border-[#33322e] shadow-2xl p-5 sm:p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] space-y-4"
      >
        {/* Mobile handle */}
        <div className="w-10 h-1.5 bg-[#d8d6ce] dark:bg-[#383733] rounded-full mx-auto mb-2 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0d234a] text-white flex items-center justify-center font-bold text-xs">
              <KeyRound className="w-4 h-4 text-[#149e3e]" />
            </div>
            <div>
              <h2 id="security-modal-title" className="text-base font-bold text-[#1b1b19] dark:text-[#efeee9]">
                Partner IDs & Passwords
              </h2>
              <p className="text-[11px] text-[#6c6b65] dark:text-[#9b998f]">
                Manage credentials for both business partners
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#f0eee6] dark:hover:bg-[#282723]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {msg && (
          <div
            className={`p-3 text-xs rounded-xl font-semibold flex items-center gap-2 ${
              msg.isError
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {msg.isError ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Partner Selector */}
        <div className="grid grid-cols-2 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSelectPartner('p1')}
            className={`py-2 rounded-lg transition ${
              selectedPartnerId === 'p1'
                ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
                : 'text-[#6c6b65] dark:text-[#9b998f]'
            }`}
          >
            Partner 1 (Abdul)
          </button>
          <button
            type="button"
            onClick={() => handleSelectPartner('p2')}
            className={`py-2 rounded-lg transition ${
              selectedPartnerId === 'p2'
                ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
                : 'text-[#6c6b65] dark:text-[#9b998f]'
            }`}
          >
            Partner 2 (Punith)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Display Name */}
          <div>
            <label className="block font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              Partner Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Abdul or Punith"
              className="w-full px-3.5 py-2.5 bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
            />
          </div>

          {/* Username / ID */}
          <div>
            <label className="block font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              Username / Login ID
            </label>
            <input
              type="text"
              required
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. abdul or punith"
              className="w-full px-3.5 py-2.5 bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a] font-mono"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3.5 py-2.5 bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
            />
          </div>

          {/* Confirm Password */}
          {newPassword && (
            <div>
              <label className="block font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-[#0d234a] hover:bg-[#07152d] text-white font-bold text-xs shadow-md transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Partner Credentials'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              const defs = resetAccountsToDefault();
              const def = defs.find((a) => a.id === selectedPartnerId);
              if (def) {
                setUsername(def.username);
                setName(def.name);
              }
              setNewPassword('');
              setConfirmPassword('');
              setMsg({
                text: 'Accounts reset to defaults (abdul / abdul123, punith / punith123)',
                isError: false,
              });
              setTimeout(() => setMsg(null), 2500);
            }}
            className="w-full py-2.5 rounded-xl border border-[#e4e2da] dark:border-[#383733] text-[#6c6b65] dark:text-[#9b998f] hover:text-[#0d234a] dark:hover:text-[#efeee9] text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Accounts to Defaults</span>
          </button>
        </form>
      </div>
    </div>
  );
};
