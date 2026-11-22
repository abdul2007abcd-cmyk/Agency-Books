import React, { useState } from 'react';
import {
  AuthSession,
  loginWithCredentials,
  getStoredAccounts,
  updatePartnerCredentials,
  resetAccountsToDefault,
} from '../lib/auth';
import { triggerHaptic } from '../lib/supabase';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Copy,
  Check,
  UserPlus,
  RotateCcw,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeMode, setActiveMode] = useState<'signin' | 'create'>('signin');

  // Sign in state
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Create / customize credentials state
  const [createPartnerId, setCreatePartnerId] = useState<'p1' | 'p2'>('p1');
  const [newDisplayName, setNewDisplayName] = useState<string>('Abdul');
  const [newCustomUsername, setNewCustomUsername] = useState<string>('abdul');
  const [newCustomPassword, setNewCustomPassword] = useState<string>('abdul123');

  const accounts = getStoredAccounts();
  const p1 = accounts.find((a) => a.id === 'p1') || accounts[0];
  const p2 = accounts.find((a) => a.id === 'p2') || accounts[1];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    try {
      setIsLoading(true);
      triggerHaptic(10);
      const res = await loginWithCredentials(username, password);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOneTapSignIn = async (targetUser: string, targetPass: string) => {
    triggerHaptic(12);
    setUsername(targetUser);
    setPassword(targetPass);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      setIsLoading(true);
      const res = await loginWithCredentials(targetUser, targetPass);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMsg(res.error || 'Login failed.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login error.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    triggerHaptic(8);
    const nav = typeof window !== 'undefined' ? window.navigator : null;
    if (nav?.clipboard) {
      nav.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const handleSwitchCreatePartner = (id: 'p1' | 'p2') => {
    triggerHaptic(8);
    setCreatePartnerId(id);
    const target = accounts.find((a) => a.id === id);
    if (target) {
      setNewDisplayName(target.name);
      setNewCustomUsername(target.username);
      setNewCustomPassword(id === 'p1' ? 'abdul123' : 'punith123');
    }
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSaveAndSignInNewCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newCustomUsername.trim() || !newDisplayName.trim() || !newCustomPassword.trim()) {
      setErrorMsg('Please fill out all fields.');
      return;
    }

    try {
      setIsLoading(true);
      triggerHaptic(10);
      const res = await updatePartnerCredentials(createPartnerId, {
        username: newCustomUsername.trim(),
        name: newDisplayName.trim(),
        newPassword: newCustomPassword.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update credentials.');
        return;
      }

      setSuccessMsg(`Credentials for ${newDisplayName.trim()} saved! Logging in...`);

      // Immediately log in with new credentials
      const loginRes = await loginWithCredentials(newCustomUsername, newCustomPassword);
      if (loginRes.success && loginRes.session) {
        onLoginSuccess(loginRes.session);
      } else {
        setActiveMode('signin');
        setUsername(newCustomUsername);
        setPassword(newCustomPassword);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error updating credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDefaults = () => {
    triggerHaptic(10);
    resetAccountsToDefault();
    setSuccessMsg('Reset to default accounts: abdul / abdul123 and punith / punith123');
    setUsername('abdul');
    setPassword('abdul123');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] dark:bg-[#121312] text-[#1b1b19] dark:text-[#efeee9] flex flex-col justify-between p-4 sm:p-6 transition-colors font-sans">
      <div className="w-full max-w-sm mx-auto my-auto py-6 space-y-5">
        {/* Brand Header with Scale Magnet Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <img
              src="/scale-magnet-logo.png"
              alt="Scale Magnet"
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0d234a] dark:text-[#efeee9]">
              Agency Books
            </h1>
            <p className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
              Dedicated Login for Business Partners
            </p>
          </div>
        </div>

        {/* Separate Credentials Display Banner */}
        <div className="bg-[#ffffff] dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-3.5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#0d234a] dark:text-[#efeee9] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#149e3e]" />
              <span>Partner Credentials</span>
            </span>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[11px] text-[#6c6b65] hover:text-[#0d234a] dark:hover:text-[#5cc08a] flex items-center gap-1 transition"
              title="Reset accounts to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Partner 1 Card (Abdul - Managing Partner) */}
            <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0d234a] dark:text-blue-300 truncate">
                  Abdul
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-semibold">
                  Managing
                </span>
              </div>
              <div className="text-[11px] space-y-0.5 font-mono text-[#334155] dark:text-[#cbd5e1]">
                <div className="truncate">
                  ID: <span className="font-bold text-[#0d234a] dark:text-[#93c5fd]">{p1.username}</span>
                </div>
                <div className="truncate">
                  Pass: <span className="font-bold text-[#0d234a] dark:text-[#93c5fd]">abdul123</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOneTapSignIn(p1.username, 'abdul123')}
                className="w-full py-1.5 rounded-lg bg-[#0d234a] hover:bg-[#071735] text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition"
              >
                <span>1-Tap Login</span>
                <ArrowRight className="w-3 h-3 text-[#149e3e]" />
              </button>
            </div>

            {/* Partner 2 Card (Punith) */}
            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#149e3e] dark:text-emerald-300 truncate">
                  Punith
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-semibold">
                  Partner 2
                </span>
              </div>
              <div className="text-[11px] space-y-0.5 font-mono text-[#334155] dark:text-[#cbd5e1]">
                <div className="truncate">
                  ID: <span className="font-bold text-[#149e3e] dark:text-[#6ee7b7]">{p2.username}</span>
                </div>
                <div className="truncate">
                  Pass: <span className="font-bold text-[#149e3e] dark:text-[#6ee7b7]">punith123</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOneTapSignIn(p2.username, 'punith123')}
                className="w-full py-1.5 rounded-lg bg-[#149e3e] hover:bg-[#0f7d31] text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition"
              >
                <span>1-Tap Login</span>
                <ArrowRight className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900/40">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900/40">
            {successMsg}
          </div>
        )}

        {/* Tab switcher: Sign In vs Create / Set Credentials */}
        <div className="grid grid-cols-2 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setActiveMode('signin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 rounded-xl transition ${
              activeMode === 'signin'
                ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
                : 'text-[#6c6b65] dark:text-[#9b998f]'
            }`}
          >
            Sign In with ID
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setActiveMode('create');
              setErrorMsg('');
              setSuccessMsg('');
              handleSwitchCreatePartner('p1');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeMode === 'create'
                ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
                : 'text-[#6c6b65] dark:text-[#9b998f]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#149e3e]" />
            <span>Create / Set Pass</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="bg-[#ffffff] dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          {activeMode === 'signin' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#f0eee6] dark:border-[#2b2a26]">
                <Lock className="w-4 h-4 text-[#149e3e]" />
                <span className="text-xs font-bold text-[#0d234a] dark:text-[#efeee9] uppercase tracking-wider">
                  Partner Sign In
                </span>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                  Partner ID / Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9b998f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. abdul or punith"
                    className="w-full pl-9 pr-3.5 py-3 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a] dark:focus:border-[#149e3e]"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#9b998f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. abdul123 or punith123"
                    className="w-full pl-9 pr-10 py-3 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a] dark:focus:border-[#149e3e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b998f] hover:text-[#1b1b19] dark:hover:text-[#efeee9]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#0d234a] hover:bg-[#081732] active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying...' : 'Sign In as Partner'}</span>
                <ArrowRight className="w-4 h-4 text-[#149e3e]" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSaveAndSignInNewCredentials} className="space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#f0eee6] dark:border-[#2b2a26]">
                <UserPlus className="w-4 h-4 text-[#149e3e]" />
                <span className="text-xs font-bold text-[#0d234a] dark:text-[#efeee9] uppercase tracking-wider">
                  Create / Customize Partner Login
                </span>
              </div>

              {/* Partner Select */}
              <div className="grid grid-cols-2 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleSwitchCreatePartner('p1')}
                  className={`py-1.5 rounded-lg transition ${
                    createPartnerId === 'p1'
                      ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
                      : 'text-[#6c6b65] dark:text-[#9b998f]'
                  }`}
                >
                  Partner 1 (Abdul)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchCreatePartner('p2')}
                  className={`py-1.5 rounded-lg transition ${
                    createPartnerId === 'p2'
                      ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
                      : 'text-[#6c6b65] dark:text-[#9b998f]'
                  }`}
                >
                  Partner 2 (Punith)
                </button>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                  Partner Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Abdul or Punith"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
                />
              </div>

              {/* Custom Username */}
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                  New Username / ID
                </label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  value={newCustomUsername}
                  onChange={(e) => setNewCustomUsername(e.target.value)}
                  placeholder="e.g. abdul or punith"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a] font-mono"
                />
              </div>

              {/* Custom Password */}
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  value={newCustomPassword}
                  onChange={(e) => setNewCustomPassword(e.target.value)}
                  placeholder="Enter secret password"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
                />
              </div>

              {/* Action */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#149e3e] hover:bg-[#0f7d31] text-white font-bold text-xs shadow-md transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save & Login Now'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Security Footer */}
      <div className="text-center text-[11px] text-[#6c6b65] dark:text-[#9b998f] flex items-center justify-center gap-1.5 pb-2">
        <ShieldCheck className="w-3.5 h-3.5 text-[#149e3e]" />
        <span>Scale Magnet Secure Financial Vault</span>
      </div>
    </div>
  );
};
