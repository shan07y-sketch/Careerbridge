import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const PrivacyPolicy: React.FC = () => {
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
        <h1 className="font-display text-headline-lg text-primary border-b pb-4">Privacy Policy</h1>
        <p className="text-xs text-on-surface-variant/70">Last Updated: October 1, 2026</p>

        <section className="space-y-3">
          <h3 className="font-bold text-body-lg text-primary">1. Data Collection</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            We store student names, universities, resumes, mock transcripts, and communication histories to generate personalized match opportunities and readiness insights.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-body-lg text-primary">2. Information Security</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            CareerBridge employs industry-grade encryption models (AES-256) to protect credentials, CV uploads, and interview feedback records.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-body-lg text-primary">3. Sharing Consent</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your data is only shared with recruiters and hiring committees upon your explicit application request for listed job opportunities.
          </p>
        </section>
      </main>

      <footer className="py-6 text-center text-xs text-on-surface-variant/70 border-t border-outline-variant/20">
        © 2026 CareerBridge. All rights reserved.
      </footer>
    </div>
  );
};
export default PrivacyPolicy;
