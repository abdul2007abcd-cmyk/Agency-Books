import React, { useState } from 'react';
import {
  AuthSession,
  loginWithCredentials,
  updatePartnerCredentials,
  getStoredAccounts,
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
  Check,
  Key,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Secure Password Change mode
  const [isChangingPass, setIsChangingPass] = useState<boolean>(false);
  const [changePartnerId, setChangePartnerId] = useState<'p1' | 'p2'>('p1');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

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
        setErrorMsg(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      triggerHaptic(10);
      const res = await updatePartnerCredentials(changePartnerId, {
        newPassword: newPassword.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update password.');
        return;
      }

      const partnerName = changePartnerId === 'p1' ? p1.name : p2.name;
      setSuccessMsg(`Password for ${partnerName} updated successfully! Please sign in.`);
      setIsChangingPass(false);
      setNewPassword('');
      setConfirmPassword('');
      setUsername(changePartnerId === 'p1' ? p1.username : p2.username);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] dark:bg-[#121312] text-[#1b1b19] dark:text-[#efeee9] flex flex-col justify-between p-4 sm:p-6 transition-colors font-sans">
      <div className="w-full max-w-sm mx-auto my-auto py-8 space-y-6">
        {/* Brand Header with Scale Magnet Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/scale-magnet-logo.png"
              alt="Scale Magnet"
              className="h-12 sm:h-14 w-auto object-contain drop-shadow-xs"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0d234a] dark:text-[#efeee9]">
              Agency Books
            </h1>
            <p className="text-xs text-[#6c6b65] dark:text-[#9b998f] mt-1">
              Authorized Business Partners Access
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3.5 text-xs rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900/40 animate-fade-in">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 text-xs rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900/40 animate-fade-in flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#ffffff] dark:bg-[#1a1917] border border-[#e4e2da] dark:border-[#33322e] rounded-3xl p-6 shadow-md space-y-5">
          {!isChangingPass ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#149e3e]" />
                  <span className="text-xs font-bold text-[#0d234a] dark:text-[#efeee9] uppercase tracking-wider">
                    Partner Sign In
                  </span>
                </div>
                <span className="text-[11px] text-[#6c6b65] dark:text-[#9b998f]">
                  Abdul & Punith
                </span>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1.5">
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
                    className="w-full pl-9 pr-3.5 py-3 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a] dark:focus:border-[#149e3e] transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setIsChangingPass(true);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-[#0d234a] dark:text-[#5cc08a] hover:underline font-medium"
                  >
                    Change Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#9b998f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter partner password"
                    className="w-full pl-9 pr-10 py-3 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a] dark:focus:border-[#149e3e] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b998f] hover:text-[#1b1b19] dark:hover:text-[#efeee9] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#0d234a] hover:bg-[#081732] active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Verifying...' : 'Sign In as Partner'}</span>
                <ArrowRight className="w-4 h-4 text-[#149e3e]" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#149e3e]" />
                  <span className="text-xs font-bold text-[#0d234a] dark:text-[#efeee9] uppercase tracking-wider">
                    Update Partner Password
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingPass(false)}
                  className="text-xs text-[#6c6b65] hover:text-[#0d234a]"
                >
                  Cancel
                </button>
              </div>

              {/* Select Partner */}
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1.5">
                  Select Partner
                </label>
                <div className="grid grid-cols-2 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setChangePartnerId('p1')}
                    className={`py-2 rounded-lg transition ${
                      changePartnerId === 'p1'
                        ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
                        : 'text-[#6c6b65] dark:text-[#9b998f]'
                    }`}
                  >
                    Abdul (Managing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangePartnerId('p2')}
                    className={`py-2 rounded-lg transition ${
                      changePartnerId === 'p2'
                        ? 'bg-white dark:bg-[#1a1917] text-[#0d234a] dark:text-[#efeee9] shadow-xs'
                        : 'text-[#6c6b65] dark:text-[#9b998f]'
                    }`}
                  >
                    Punith (Partner 2)
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1.5">
                  New Secret Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#0d234a]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#149e3e] hover:bg-[#0f7d31] text-white font-bold text-xs shadow-md transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isLoading ? 'Updating...' : 'Save Password'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Security Footer */}
      <div className="text-center text-[11px] text-[#6c6b65] dark:text-[#9b998f] flex items-center justify-center gap-1.5 pb-2">
        <ShieldCheck className="w-3.5 h-3.5 text-[#149e3e]" />
        <span>Scale Magnet Financial Vault · Multi-device Realtime Sync</span>
      </div>
    </div>
  );
};
