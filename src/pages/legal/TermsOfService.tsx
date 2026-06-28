import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col justify-between text-left">
      <nav className="bg-surface shadow-[0_4px_20px_rgba(2,54,41,0.04)] py-4 px-margin-desktop sticky top-0 z-50">
        <div className="max-w-container-max mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-headline-md text-primary">CareerBridge Legal</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </nav>

      <main className="flex-grow max-w-3xl mx-auto p-8 md:p-12 space-y-6 bg-white dark:bg-surface-container-lowest my-8 rounded-2xl shadow-sm border border-primary/5">
        <h1 className="font-display text-headline-lg text-primary border-b pb-4">Terms of Service</h1>
        <p className="text-xs text-on-surface-variant/70">Last Updated: October 1, 2026</p>

        <section className="space-y-3">
          <h3 className="font-bold text-body-lg text-primary">1. Acceptable Use</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            By utilizing the CareerBridge career intelligence suite, you agree to submit only accurate, verified credentials, transcripts, and portfolios. Impersonation of other candidates or entities is strictly prohibited.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-body-lg text-primary">2. Simulated AI Services</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            AI career coaching, resume parsers, and mock interview scores are generated via algorithmic assessments and are intended solely as preparatory advice. CareerBridge does not guarantee specific placement outcomes.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-body-lg text-primary">3. Intellectual Property</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            All code, styling systems, visual design languages, assets, and branding logos are copyrighted properties of CareerBridge.
          </p>
        </section>
      </main>

      <footer className="py-6 text-center text-xs text-on-surface-variant/70 border-t border-outline-variant/20">
        © 2026 CareerBridge. All rights reserved.
      </footer>
    </div>
  );
};
export default TermsOfService;
