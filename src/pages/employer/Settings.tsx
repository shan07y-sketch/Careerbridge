import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { AuthService } from '../../services';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type TabId = 'account' | 'security';
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'account', label: 'Account', icon: 'person' },
  { id: 'security', label: 'Security', icon: 'shield' },
];

const inputClass = 'w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-0 focus:shadow-focus-brand outline-none transition-all';
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block"><span className="text-label-md font-semibold text-on-surface">{label}</span><div className="mt-1.5">{children}</div></label>
);

/**
 * Honest employer settings. Company branding, recruiters and verification live
 * in their own dedicated panels (Company Profile / Recruiters). This screen
 * covers the individual recruiter's own account + security only — no fabricated
 * org data.
 */
export const EmployerSettings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [isSaving, setIsSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) { showToast('Please fill in all password fields.', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('New passwords do not match.', 'error'); return; }
    setIsSaving(true);
    try {
      await AuthService.changePassword(oldPassword, newPassword);
      showToast('Password changed.', 'success');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to change password.', 'error');
    } finally { setIsSaving(false); }
  };

  return (
    <>
      <PageHeader title="Settings" description="Your account and security. Company branding and team management live in Company Profile and Recruiters." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <nav className="lg:col-span-1">
          <div className="flex lg:flex-col gap-1 lg:sticky lg:top-24">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 px-3.5 h-11 rounded-xl text-label-md font-semibold transition-colors ${activeTab === t.id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                <span className="material-symbols-outlined text-[20px]">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'account' && (
            <Card>
              <CardHeader icon="person" title="Account" subtitle="Your profile on CareerBridge" />
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Name"><input className={inputClass} value={user?.name || ''} disabled /></Field>
                <Field label="Email"><input className={inputClass} value={user?.email || ''} disabled /></Field>
              </div>
              <p className="text-label-md text-on-surface-variant mt-4">To update your company's public details, open <span className="font-semibold text-on-surface">Company Profile</span>. To manage teammates, open <span className="font-semibold text-on-surface">Recruiters</span>.</p>
            </Card>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword}>
              <Card>
                <CardHeader icon="password" title="Change password" subtitle="Use a strong, unique password" />
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Current password"><input className={inputClass} type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} /></Field>
                  <div className="hidden sm:block" />
                  <Field label="New password"><input className={inputClass} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></Field>
                  <Field label="Confirm new password"><input className={inputClass} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></Field>
                </div>
                <div className="flex justify-end mt-6"><Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Updating…' : 'Update password'}</Button></div>
              </Card>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployerSettings;
