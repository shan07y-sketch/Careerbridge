import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface dark:bg-surface-container-low border-t border-primary/10 w-full py-stack-lg mt-auto">
      <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-stack-md">
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          © 2026 CareerBridge. All rights reserved.
        </span>
        <div className="flex gap-8">
          <Link
            to="/legal/privacy"
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200 opacity-80 hover:opacity-100"
          >
            Privacy Policy
          </Link>
          <Link
            to="/legal/terms"
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200 opacity-80 hover:opacity-100"
          >
            Terms of Service
          </Link>
          <a
            href="mailto:support@careerbridge.ai"
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200 opacity-80 hover:opacity-100"
          >
            Support
          </a>
          <Link
            to="/legal/terms"
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200 opacity-80 hover:opacity-100"
          >
            Legal
          </Link>
        </div>
      </div>
    </footer>
  );
};
