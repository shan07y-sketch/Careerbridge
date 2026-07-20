import React, { useCallback, useEffect, useState } from 'react';
import { AuthService, type TwoFactorSetup, type TwoFactorStatus } from '../../services';
import { useToast } from '../../contexts/ToastContext';

type Stage = 'loading' | 'idle' | 'scanning' | 'showing_codes';

/**
 * Manages two-step verification for the signed-in account: enrolment, recovery
 * codes and switching it back off.
 *
 * Shared between the desktop and mobile settings screens so the security
 * surface cannot drift between the two.
 */
export function TwoFactorSettings() {
  const { showToast } = useToast();
  const [stage, setStage] = useState<Stage>('loading');
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [showManualKey, setShowManualKey] = useState(false);

  /**
   * Re-reads status without touching `stage`.
   *
   * This must not force the panel back to 'idle': recovery codes are shown
   * exactly once, and refreshing after enrolment used to clobber that screen
   * before the user could copy them — permanently losing the only copy.
   * Only the initial load advances past 'loading'.
   */
  const refresh = useCallback(async () => {
    try {
      setStatus(await AuthService.twoFactor.status());
    } catch {
      // Swallowed: a status read failing must not block the flow. The next
      // action surfaces the real error.
    } finally {
      // Leaves any in-progress stage (scanning / showing_codes) untouched.
      setStage((current) => (current === 'loading' ? 'idle' : current));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fail = (err: unknown, fallback: string) =>
    showToast(err instanceof Error ? err.message : fallback, 'error');

  const beginSetup = async () => {
    setBusy(true);
    try {
      setSetup(await AuthService.twoFactor.beginSetup());
      setCode('');
      setStage('scanning');
    } catch (err) {
      fail(err, 'Could not start two-step verification setup.');
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { recoveryCodes: codes } = await AuthService.twoFactor.confirm(code);
      setRecoveryCodes(codes);
      setStage('showing_codes');
      await refresh();
      showToast('Two-step verification is now switched on.', 'success');
    } catch (err) {
      fail(err, 'That code was not accepted.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    // Deliberately prompts rather than disabling outright: turning off the
    // second factor is exactly the action an attacker on a hijacked session
    // would attempt, so it re-checks the password server-side.
    const password = window.prompt('Enter your account password to switch off two-step verification:');
    if (!password) return;

    setBusy(true);
    try {
      await AuthService.twoFactor.disable(password);
      setRecoveryCodes([]);
      await refresh();
      showToast('Two-step verification has been switched off.', 'success');
    } catch (err) {
      fail(err, 'Could not switch off two-step verification.');
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      const { recoveryCodes: codes } = await AuthService.twoFactor.regenerateRecoveryCodes();
      setRecoveryCodes(codes);
      setStage('showing_codes');
      await refresh();
    } catch (err) {
      fail(err, 'Could not generate new recovery codes.');
    } finally {
      setBusy(false);
    }
  };

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      showToast('Recovery codes copied.', 'success');
    } catch {
      showToast('Copy failed — please write the codes down instead.', 'error');
    }
  };

  if (stage === 'loading') {
    return <div className="h-24 rounded-2xl bg-surface-container/60 animate-pulse" aria-hidden />;
  }

  return (
    <section className="rounded-3xl border border-on-surface/8 bg-surface-container-lowest p-5 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-title-md font-bold text-on-surface">Two-step verification</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Require a code from your authenticator app in addition to your password.
          </p>
        </div>
        <span
          className={`shrink-0 px-3 py-1 rounded-full text-label-sm font-semibold ${
            status?.enabled
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          {status?.enabled ? 'On' : 'Off'}
        </span>
      </header>

      {/* ── Enrolment: scan the QR, then prove a code works ── */}
      {stage === 'scanning' && setup && (
        <form onSubmit={confirmSetup} className="space-y-4">
          <ol className="text-body-sm text-on-surface-variant space-y-1 list-decimal list-inside">
            <li>Open your authenticator app.</li>
            <li>Scan this QR code.</li>
            <li>Enter the 6-digit code it shows.</li>
          </ol>

          <div className="flex justify-center">
            <img
              src={setup.qrCodeDataUri}
              alt="QR code for setting up two-step verification"
              className="rounded-2xl border border-on-surface/10 bg-white p-2"
              width={200}
              height={200}
            />
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowManualKey((previous) => !previous)}
              className="text-body-sm text-primary font-semibold hover:underline"
            >
              {showManualKey ? 'Hide setup key' : "Can't scan? Enter a key instead"}
            </button>
            {showManualKey && (
              <p className="mt-2 font-mono text-body-sm tracking-wider break-all bg-surface-container rounded-xl p-3 text-on-surface">
                {setup.manualEntryKey}
              </p>
            )}
          </div>

          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            aria-label="Authentication code"
            className="w-full h-12 rounded-2xl bg-surface-container/70 border border-on-surface/10 px-4 text-center text-title-md tracking-[0.3em] font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="flex-1 h-11 rounded-2xl bg-primary text-on-primary font-semibold disabled:opacity-50"
            >
              {busy ? 'Verifying…' : 'Turn on'}
            </button>
            <button
              type="button"
              onClick={() => setStage('idle')}
              className="h-11 px-5 rounded-2xl border border-on-surface/12 text-on-surface font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Recovery codes, shown exactly once ── */}
      {stage === 'showing_codes' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-tertiary-container/50 border border-tertiary/30 p-3">
            <p className="text-body-sm text-on-surface font-semibold">
              Save these recovery codes now.
            </p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Each one can be used once to sign in if you lose your authenticator. They will not be
              shown again.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-2 font-mono text-body-sm">
            {recoveryCodes.map((recoveryCode) => (
              <li key={recoveryCode} className="bg-surface-container rounded-xl px-3 py-2 text-center text-on-surface">
                {recoveryCode}
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={copyCodes}
              className="flex-1 h-11 rounded-2xl border border-on-surface/12 text-on-surface font-semibold"
            >
              Copy codes
            </button>
            <button
              type="button"
              onClick={() => setStage('idle')}
              className="flex-1 h-11 rounded-2xl bg-primary text-on-primary font-semibold"
            >
              I've saved them
            </button>
          </div>
        </div>
      )}

      {/* ── Resting state ── */}
      {stage === 'idle' && (
        <div className="space-y-3">
          {status?.enabled && (
            <p className="text-body-sm text-on-surface-variant">
              {status.recoveryCodesRemaining} recovery{' '}
              {status.recoveryCodesRemaining === 1 ? 'code' : 'codes'} remaining.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {status?.enabled ? (
              <>
                <button
                  type="button"
                  onClick={regenerate}
                  disabled={busy}
                  className="h-11 px-5 rounded-2xl border border-on-surface/12 text-on-surface font-semibold disabled:opacity-50"
                >
                  New recovery codes
                </button>
                <button
                  type="button"
                  onClick={disable}
                  disabled={busy}
                  className="h-11 px-5 rounded-2xl border border-error/40 text-error font-semibold disabled:opacity-50"
                >
                  Turn off
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={beginSetup}
                disabled={busy}
                className="h-11 px-5 rounded-2xl bg-primary text-on-primary font-semibold disabled:opacity-50"
              >
                {busy ? 'Preparing…' : 'Turn on'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default TwoFactorSettings;
