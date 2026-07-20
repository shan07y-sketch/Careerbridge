import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { TwoFactorChallenge } from '../../components/auth/TwoFactorChallenge';
import type { AuthResult } from '../../contexts/AuthContext';

export const AdminLogin: React.FC = () => {
  const { login, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  // Set when the password step succeeds but the account requires a second factor.
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  /**
   * Admission check applied once a session actually exists. Shared by the
   * password-only and two-factor paths so a 2FA admin login enforces exactly
   * the same role gate.
   */
  const admitAdmin = async ({ role }: AuthResult) => {
    if (role === 'admin') {
      showToast('System Admin session established.', 'success');
      navigate('/admin/dashboard');
      return;
    }
    // Authenticated but not an admin!
    await logout(); // Securely clean session
    setChallengeToken(null);
    setAccessDenied(true);
    showToast('Permission Denied', 'error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter credentials', 'error');
      return;
    }

    setIsLoading(true);
    setAccessDenied(false);

    try {
      // Real API login -- the backend authenticates against PostgreSQL and
      // returns the account's actual role. (The old `forceAdmin` flag
      // fabricated a mock admin session with a fake token; every subsequent
      // API call then failed with 401.)
      const result = await login(email, password);

      // Admins are the likeliest accounts to have 2FA switched on, so the
      // challenge must be handled here too — not just on the student form.
      if (result.twoFactorRequired) {
        setChallengeToken(result.challengeToken);
        return;
      }

      await admitAdmin(result);
    } catch {
      showToast('Authentication failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('Admin password recovery is restricted to recovery keys. Contact Infrastructure Ops.', 'error');
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-6 text-left antialiased font-sans">
        <div className="w-full max-w-md bg-white border border-error/20 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-error"></div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-error-container text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">gpp_bad</span>
            </div>
            <div>
              <h1 className="text-headline-md font-bold text-error">Access Denied</h1>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mt-0.5">Security Exception 403</p>
            </div>
          </div>

          <div className="bg-error/5 p-4 rounded-2xl border border-error/10 mb-8">
            <p className="text-sm font-semibold text-error leading-relaxed">
              You do not have permission to access this resource. Only accounts with verified system administrator roles are permitted access.
            </p>
          </div>

          <button
            onClick={() => setAccessDenied(false)}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Return to Login</span>
          </button>
        </div>
      </div>
    );
  }

  if (challengeToken) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-6 antialiased font-sans">
        <div className="w-full max-w-md bg-surface border border-outline-variant/20 shadow-2xl rounded-3xl p-8">
          <TwoFactorChallenge
            challengeToken={challengeToken}
            onVerified={admitAdmin}
            onCancel={() => setChallengeToken(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-6 text-left antialiased font-sans">
      <div className="w-full max-w-md bg-white border border-outline-variant/10 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
        {/* Top styling band */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-container rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-headline-md font-bold text-primary">CareerBridge</h1>
              <p className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-widest">Administration Portal</p>
            </div>
          </div>

          <h2 className="text-headline-lg font-bold text-primary leading-tight">CareerBridge Administration</h2>
          <div className="flex items-center gap-1.5 mt-2 text-error font-bold text-xs uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
            <span>Restricted Access</span>
          </div>
          <p className="text-on-surface-variant font-medium text-xs mt-2 leading-relaxed">
            Only authorized system administrators may access this portal. All administrative access is strictly monitored and logged.
          </p>
        </div>

        {/* Security Warning banner */}
        <div className="mb-6 p-3.5 bg-primary-container/20 rounded-2xl border border-primary-fixed-dim/20 flex gap-3 text-xs leading-relaxed text-primary font-semibold">
          <span className="material-symbols-outlined text-primary shrink-0 text-xl">security</span>
          <span>This session will expire automatically after 15 minutes of inactivity. Secure audit logging is active.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-on-surface-variant font-bold text-xs block">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">mail</span>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl pl-11 pr-4 py-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="admin@careerbridge.com"
                type="email"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-on-surface-variant font-bold text-xs">Security Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">lock</span>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl pl-11 pr-4 py-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••••••"
                type="password"
                required
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2.5 py-1">
            <input
              id="remember_me"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              type="checkbox"
              className="w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
            <label htmlFor="remember_me" className="text-xs font-semibold text-on-surface-variant cursor-pointer select-none">
              Remember my device for secure MFA bypass
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">sync</span>
                <span>Authenticating System...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>Secure Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
            Enterprise SaaS Shield © 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
