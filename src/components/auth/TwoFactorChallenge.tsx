import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthResult } from '../../contexts/AuthContext';

interface TwoFactorChallengeProps {
  /** Short-lived token returned by the password step. */
  challengeToken: string;
  /** Called once the second factor verifies and a session exists. */
  onVerified: (result: AuthResult) => void;
  /** Abandons the challenge and returns to the password form. */
  onCancel: () => void;
}

/**
 * The second step of signing in: collects a TOTP code, or a recovery code when
 * the user no longer has their authenticator.
 *
 * Shared by every sign-in surface so the second factor behaves identically on
 * desktop, mobile and the admin portal.
 */
export function TwoFactorChallenge({ challengeToken, onVerified, onCancel }: TwoFactorChallengeProps) {
  const { verifyTwoFactor } = useAuth();
  const [code, setCode] = useState('');
  const [usingRecoveryCode, setUsingRecoveryCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [usingRecoveryCode]);

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (isSubmitting || !code.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      onVerified(await verifyTwoFactor(challengeToken, code.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code was not accepted.');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (value: string) => {
    setError(null);
    if (usingRecoveryCode) {
      setCode(value.toUpperCase());
      return;
    }

    // Authenticator codes are always 6 digits; stripping anything else lets a
    // pasted "123 456" work without the user having to clean it up.
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      // Auto-submit on the last digit — the code is about to expire anyway,
      // and it saves a deliberate tap on mobile.
      setTimeout(() => submit(), 0);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-title-lg font-bold text-on-surface">Two-step verification</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">
          {usingRecoveryCode
            ? 'Enter one of the recovery codes you saved when you switched on two-step verification.'
            : 'Enter the 6-digit code from your authenticator app to finish signing in.'}
        </p>
      </div>

      <div>
        <label htmlFor="two-factor-code" className="sr-only">
          {usingRecoveryCode ? 'Recovery code' : 'Authentication code'}
        </label>
        <input
          id="two-factor-code"
          ref={inputRef}
          value={code}
          onChange={(event) => handleChange(event.target.value)}
          disabled={isSubmitting}
          autoComplete="one-time-code"
          // `numeric` brings up the digit keypad on mobile for TOTP codes,
          // but recovery codes contain letters.
          inputMode={usingRecoveryCode ? 'text' : 'numeric'}
          placeholder={usingRecoveryCode ? 'XXXXX-XXXXX' : '000000'}
          aria-invalid={!!error}
          aria-describedby={error ? 'two-factor-error' : undefined}
          className={`w-full h-14 rounded-2xl bg-surface-container/70 border px-4 text-center text-title-md tracking-[0.3em] font-semibold outline-none transition focus:ring-2 focus:ring-primary/20 ${
            error ? 'border-error focus:border-error' : 'border-on-surface/10 focus:border-primary'
          }`}
        />
        {error && (
          <p id="two-factor-error" role="alert" className="text-body-sm text-error mt-2">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !code.trim()}
        className="w-full h-12 rounded-2xl bg-primary text-on-primary font-semibold disabled:opacity-50 transition"
      >
        {isSubmitting ? 'Verifying…' : 'Verify and sign in'}
      </button>

      <div className="flex items-center justify-between text-body-sm">
        <button
          type="button"
          onClick={() => {
            setUsingRecoveryCode((previous) => !previous);
            setCode('');
            setError(null);
          }}
          className="text-primary font-semibold hover:underline"
        >
          {usingRecoveryCode ? 'Use authenticator app' : 'Use a recovery code'}
        </button>
        <button type="button" onClick={onCancel} className="text-on-surface-variant hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default TwoFactorChallenge;
