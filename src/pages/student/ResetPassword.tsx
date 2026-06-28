import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const ResetPassword: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      showToast('Password reset successfully! Please sign in.', 'success');
      setIsLoading(false);
      navigate('/auth');
    }, 1200);
  };

  return (
    <div 
      className="text-on-surface min-h-screen flex flex-col justify-between"
      style={{ backgroundColor: '#f9faf7' }}
    >
      <nav className="bg-surface shadow-[0_4px_20px_rgba(2,54,41,0.04)] py-4 px-margin-desktop sticky top-0 z-50">
        <div className="max-w-container-max mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-headline-md font-bold text-primary">CareerBridge</span>
          </div>
          <Link to="/auth" className="text-label-md font-label-md text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center p-6">
        <Card className="w-full max-w-[480px] p-8 space-y-6 text-center">
          <div className="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center mx-auto text-primary">
            <span className="material-symbols-outlined text-3xl">vpn_key</span>
          </div>
          
          <div>
            <h1 className="font-display text-headline-lg text-primary mb-2">Reset Password</h1>
            <p className="text-on-surface-variant text-sm">
              Enter your new credentials below to update your password secure access keys.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">New Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                placeholder="••••••••"
                type="password"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Confirm New Password</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                placeholder="••••••••"
                type="password"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full py-3"
              isLoading={isLoading}
            >
              Reset and Sign In
            </Button>
          </form>
        </Card>
      </main>

      <footer className="py-6 text-center text-xs text-on-surface-variant/70 border-t border-outline-variant/20">
        © 2026 CareerBridge. All rights reserved.
      </footer>
    </div>
  );
};

export default ResetPassword;
