import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const ForgotPassword: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      showToast('Password reset link sent to your email!', 'success');
      setIsLoading(false);
      navigate('/auth/reset-password');
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
            <span className="material-symbols-outlined text-3xl">lock_reset</span>
          </div>
          
          <div>
            <h1 className="font-display text-headline-lg text-primary mb-2">Forgot Password?</h1>
            <p className="text-on-surface-variant text-sm">
              Enter your registered email and we'll send you instructions to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                placeholder="name@university.edu"
                type="email"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full py-3"
              isLoading={isLoading}
            >
              Send Reset Instructions
            </Button>
          </form>

          <p className="text-xs text-on-surface-variant">
            Remembered your password?{' '}
            <Link className="text-primary font-bold hover:underline" to="/auth">
              Sign In
            </Link>
          </p>
        </Card>
      </main>

      <footer className="py-6 text-center text-xs text-on-surface-variant/70 border-t border-outline-variant/20">
        © 2026 CareerBridge. All rights reserved.
      </footer>
    </div>
  );
};

export default ForgotPassword;
