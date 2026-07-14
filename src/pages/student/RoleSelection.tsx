import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export const RoleSelection: React.FC = () => {
  const { selectRole } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<'student' | 'employer' | 'university'>('student');

  const handleContinue = () => {
    selectRole(selected);
    navigate(`/auth?role=${selected}`);
  };

  return (
    <div 
      className="text-on-surface min-h-screen flex flex-col justify-between"
      style={{
        backgroundImage: 'radial-gradient(circle at 36.6406% 99.108%, rgba(161, 209, 190, 0.05) 0%, transparent 50%)',
        backgroundColor: '#f9faf7'
      }}
    >
      {/* Top Bar */}
      <nav className="bg-surface sticky top-0 z-50 shadow-[0_4px_20px_rgba(2,54,41,0.04)]">
        <div className="flex justify-between items-center px-margin-desktop py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-headline-md font-headline-md font-bold text-primary">CareerBridge</span>
          </div>
          <div className="flex items-center gap-stack-lg">
            <Link to="/auth" className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors py-1">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center py-section-gap px-margin-mobile md:px-0">
        <div className="w-full max-w-4xl bg-white dark:bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] p-stack-lg md:p-16 text-center border border-primary/5">
          <header className="mb-12">
            <h1 className="font-display text-headline-lg md:text-display text-primary mb-4">Choose Your Journey</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
              Select how you'd like to experience CareerBridge.
            </p>
          </header>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Student */}
            <button
              onClick={() => setSelected('student')}
              className={`flex flex-col items-center p-8 rounded-xl bg-white text-left h-full transition-all duration-300 border ${
                selected === 'student'
                  ? 'border-primary ring-2 ring-primary/10 bg-primary/5 shadow-lg -translate-y-0.5'
                  : 'border-primary/10 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md'
              }`}
              type="button"
            >
              <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-4xl">school</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-3">Student</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Discover internships, jobs, and AI-powered career guidance.
              </p>
            </button>

            {/* Employer */}
            <button
              onClick={() => setSelected('employer')}
              className={`flex flex-col items-center p-8 rounded-xl bg-white text-left h-full transition-all duration-300 border ${
                selected === 'employer'
                  ? 'border-primary ring-2 ring-primary/10 bg-primary/5 shadow-lg -translate-y-0.5'
                  : 'border-primary/10 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md'
              }`}
              type="button"
            >
              <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-4xl">corporate_fare</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-3">Employer</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Recruit top student talent and streamline your hiring process.
              </p>
            </button>

            {/* University */}
            <button
              onClick={() => setSelected('university')}
              className={`flex flex-col items-center p-8 rounded-xl bg-white text-left h-full transition-all duration-300 border ${
                selected === 'university'
                  ? 'border-primary ring-2 ring-primary/10 bg-primary/5 shadow-lg -translate-y-0.5'
                  : 'border-primary/10 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md'
              }`}
              type="button"
            >
              <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-4xl">account_balance</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-3">University</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Manage placements and build strategic industry partnerships.
              </p>
            </button>
          </div>

          {/* Action */}
          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={handleContinue}
              className="px-12 py-4 rounded-full"
            >
              Continue
            </Button>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Already have an account?{' '}
              <Link className="text-primary font-bold hover:underline" to="/auth">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop py-stack-lg max-w-container-max mx-auto gap-4">
          <div className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
            © 2026 CareerBridge
          </div>
          <div className="flex gap-stack-lg">
            <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-70 hover:opacity-100" to="/legal/privacy">
              Privacy Policy
            </Link>
            <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-70 hover:opacity-100" to="/legal/terms">
              Terms of Service
            </Link>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-70 hover:opacity-100" href="mailto:support@careerbridge.ai">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default RoleSelection;
