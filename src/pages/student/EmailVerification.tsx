import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const EmailVerification: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 4) {
      showToast('Please enter a valid 4-digit code', 'error');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      showToast('Email verified successfully!', 'success');
      setIsLoading(false);
      navigate('/student/onboarding');
    }, 1000);
  };

  const handleResend = () => {
    showToast('A new verification code has been sent!', 'success');
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
            <span className="material-symbols-outlined text-3xl">mark_email_read</span>
          </div>
          
          <div>
            <h1 className="font-display text-headline-lg text-primary mb-2">Verify Your Email</h1>
            <p className="text-on-surface-variant text-sm">
              We've sent a 4-digit verification code to your academic email. Enter it below to activate your profile.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">4-Digit Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 4))}
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-[1em] outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                placeholder="0000"
                type="text"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full py-3"
              isLoading={isLoading}
            >
              Verify Code
            </Button>
          </form>

          <p className="text-xs text-on-surface-variant">
            Didn't receive the code?{' '}
            <button onClick={handleResend} className="text-primary font-bold hover:underline">
              Resend Code
            </button>
          </p>
        </Card>
      </main>

      <footer className="py-6 text-center text-xs text-on-surface-variant/70 border-t border-outline-variant/20">
        © 2026 CareerBridge. All rights reserved.
      </footer>
    </div>
  );
};

export default EmailVerification;
