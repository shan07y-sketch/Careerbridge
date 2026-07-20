import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AuthService } from '../../services';
import { TwoFactorSettings } from '../../components/auth/TwoFactorSettings';

type TabId = 'account' | 'preferences' | 'security' | 'notifications' | 'connections' | 'appearance';
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'account', label: 'Account', icon: 'person' },
  { id: 'preferences', label: 'Career preferences', icon: 'auto_awesome' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications_active' },
  { id: 'connections', label: 'Connections', icon: 'hub' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
];

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block">
    <span className="text-label-md font-semibold text-on-surface">{label}</span>
    {hint && <span className="block text-label-sm text-on-surface-variant mt-0.5">{hint}</span>}
    <div className="mt-1.5">{children}</div>
  </label>
);

const inputClass = 'w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-0 focus:shadow-focus-brand outline-none transition-all';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <div className="min-w-0">
      <p className="text-label-md font-medium text-on-surface">{label}</p>
      {description && <p className="text-label-sm text-on-surface-variant mt-0.5">{description}</p>}
    </div>
    <button type="button" onClick={() => onChange(!checked)} role="switch" aria-checked={checked} aria-label={label}
      className={`w-11 h-6 rounded-full shrink-0 transition-colors relative ${checked ? 'bg-primary' : 'bg-surface-container-high'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  </div>
);

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [isSaving, setIsSaving] = useState(false);

  // Account
  const [name, setName] = useState(user?.name || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [degree, setDegree] = useState(user?.degree || '');
  const [gradYear, setGradYear] = useState(user?.gradYear?.toString() || '');
  const [careerGoal, setCareerGoal] = useState(user?.careerGoal || '');
  const [workMode, setWorkMode] = useState<string>(user?.workMode || 'Hybrid');
  const [preferredLocation, setPreferredLocation] = useState(user?.preferredLocation || '');

  // Security
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Career preferences
  const [careerPath, setCareerPath] = useState(user?.careerPath || '');
  const [targetCompanies, setTargetCompanies] = useState(user?.targetCompanies || '');
  const [targetSalary, setTargetSalary] = useState(user?.targetSalaryRange || '');
  const [workType, setWorkType] = useState<'Internship' | 'Full-Time'>(user?.jobTypePreference || 'Full-Time');
  const [industries, setIndustries] = useState<string[]>(user?.preferredIndustries || []);
  const [newIndustry, setNewIndustry] = useState('');
  const [recFrequency, setRecFrequency] = useState<'Daily' | 'Weekly' | 'Off'>(user?.recommendationFrequency || 'Daily');

  // Notifications (local preferences)
  const [emailApp, setEmailApp] = useState(true);
  const [pushApp, setPushApp] = useState(true);
  const [emailNet, setEmailNet] = useState(true);
  const [emailAI, setEmailAI] = useState(true);

  // Connections
  const [githubConnected, setGithubConnected] = useState<boolean>(user?.gitHubConnected ?? false);
  const [linkedinConnected, setLinkedinConnected] = useState<boolean>(user?.linkedInConnected ?? false);

  // Appearance (local)
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        name, university, degree,
        gradYear: parseInt(gradYear) || new Date().getFullYear(),
        careerGoal, workMode: workMode as 'Remote' | 'Hybrid' | 'On-site', preferredLocation,
      });
      showToast('Account details saved.', 'success');
    } catch {
      showToast('Failed to save account details.', 'error');
    } finally { setIsSaving(false); }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        careerPath, targetCompanies, targetSalaryRange: targetSalary,
        jobTypePreference: workType, preferredIndustries: industries, recommendationFrequency: recFrequency,
      });
      showToast('Career preferences saved.', 'success');
    } catch {
      showToast('Failed to save preferences.', 'error');
    } finally { setIsSaving(false); }
  };

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

  const addIndustry = () => {
    const tag = newIndustry.trim();
    if (tag && !industries.includes(tag)) { setIndustries(prev => [...prev, tag]); setNewIndustry(''); }
  };

  const toggleConnection = async (which: 'github' | 'linkedin') => {
    try {
      if (which === 'github') { const next = !githubConnected; setGithubConnected(next); await updateUser({ gitHubConnected: next }); showToast(next ? 'GitHub connected.' : 'GitHub disconnected.', 'success'); }
      else { const next = !linkedinConnected; setLinkedinConnected(next); await updateUser({ linkedInConnected: next }); showToast(next ? 'LinkedIn connected.' : 'LinkedIn disconnected.', 'success'); }
    } catch { showToast('Could not update connection.', 'error'); }
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      profile: { name, university, degree, gradYear, careerGoal, workMode, preferredLocation },
      preferences: { careerPath, targetCompanies, targetSalary, workType, industries, recFrequency },
    }, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'careerbridge_data_export.json');
    document.body.appendChild(a); a.click(); a.remove();
    showToast('Your data export is downloading.', 'success');
  };

  return (
    <PageLayout searchPlaceholder="Search settings…">
      <PageHeader title="Settings" description="Manage your account, preferences, security and how CareerBridge works for you." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <nav className="lg:col-span-1">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-24">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 px-3.5 h-11 rounded-xl text-label-md font-semibold whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                <span className="material-symbols-outlined text-[20px]">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount}>
              <Card>
                <CardHeader icon="person" title="Account details" subtitle="Your core profile information" />
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Full name"><input className={inputClass} value={name} onChange={e => setName(e.target.value)} /></Field>
                  <Field label="Email"><input className={inputClass} value={user?.email || ''} disabled /></Field>
                  <Field label="University"><input className={inputClass} value={university} onChange={e => setUniversity(e.target.value)} /></Field>
                  <Field label="Degree"><input className={inputClass} value={degree} onChange={e => setDegree(e.target.value)} /></Field>
                  <Field label="Graduation year"><input className={inputClass} type="number" value={gradYear} onChange={e => setGradYear(e.target.value)} /></Field>
                  <Field label="Preferred location"><input className={inputClass} value={preferredLocation} onChange={e => setPreferredLocation(e.target.value)} placeholder="e.g. London, Remote" /></Field>
                  <Field label="Career goal"><input className={inputClass} value={careerGoal} onChange={e => setCareerGoal(e.target.value)} placeholder="e.g. Frontend Engineer" /></Field>
                  <Field label="Work mode">
                    <select className={inputClass} value={workMode} onChange={e => setWorkMode(e.target.value)}>
                      <option>Remote</option><option>Hybrid</option><option>On-site</option>
                    </select>
                  </Field>
                </div>
                <div className="flex justify-end mt-6"><Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</Button></div>
              </Card>
            </form>
          )}

          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences}>
              <Card>
                <CardHeader icon="auto_awesome" title="Career preferences" subtitle="Tune the roles and recommendations you see" />
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Target role / path"><input className={inputClass} value={careerPath} onChange={e => setCareerPath(e.target.value)} placeholder="e.g. Product Engineer" /></Field>
                  <Field label="Target companies"><input className={inputClass} value={targetCompanies} onChange={e => setTargetCompanies(e.target.value)} placeholder="e.g. Stripe, Figma" /></Field>
                  <Field label="Target salary range"><input className={inputClass} value={targetSalary} onChange={e => setTargetSalary(e.target.value)} placeholder="e.g. £60k–£80k" /></Field>
                  <Field label="Job type">
                    <select className={inputClass} value={workType} onChange={e => setWorkType(e.target.value as 'Internship' | 'Full-Time')}>
                      <option value="Full-Time">Full-Time</option><option value="Internship">Internship</option>
                    </select>
                  </Field>
                  <Field label="Recommendation frequency">
                    <select className={inputClass} value={recFrequency} onChange={e => setRecFrequency(e.target.value as 'Daily' | 'Weekly' | 'Off')}>
                      <option>Daily</option><option>Weekly</option><option>Off</option>
                    </select>
                  </Field>
                </div>
                <div className="mt-5">
                  <p className="text-label-md font-semibold text-on-surface mb-2">Preferred industries</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {industries.length === 0 && <span className="text-label-sm text-on-surface-variant">None yet — add a few below.</span>}
                    {industries.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-3 h-8 rounded-full bg-primary-container text-on-primary-container text-label-sm font-semibold">
                        {tag}
                        <button type="button" onClick={() => setIndustries(prev => prev.filter(i => i !== tag))} aria-label={`Remove ${tag}`}><span className="material-symbols-outlined text-[16px]">close</span></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input className={inputClass} value={newIndustry} onChange={e => setNewIndustry(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIndustry(); } }} placeholder="Add an industry" />
                    <Button type="button" variant="outline" onClick={addIndustry}>Add</Button>
                  </div>
                </div>
                <div className="flex justify-end mt-6"><Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save preferences'}</Button></div>
              </Card>
            </form>
          )}

          {activeTab === 'security' && (
            <>
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
              {/* Replaces a toggle that only flipped local state and showed a
                  toast — it never enrolled anything, so an account that looked
                  protected was still password-only. */}
              <TwoFactorSettings />
              <Card>
                <CardHeader icon="download" title="Your data" subtitle="Export a copy of your CareerBridge data" />
                <Button variant="outline" onClick={handleExportData} leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>Export my data (JSON)</Button>
              </Card>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader icon="notifications_active" title="Notifications" subtitle="Choose what reaches you and how" />
              <div className="divide-y divide-outline-variant/60">
                <Toggle checked={emailApp} onChange={setEmailApp} label="Application updates by email" description="Status changes, interview invites and offers." />
                <Toggle checked={pushApp} onChange={setPushApp} label="Application updates by push" description="Real-time alerts in your browser or app." />
                <Toggle checked={emailNet} onChange={setEmailNet} label="Network activity by email" description="Connection requests and recruiter messages." />
                <Toggle checked={emailAI} onChange={setEmailAI} label="AI recommendations by email" description="New matched roles and skill suggestions." />
              </div>
              <p className="text-label-sm text-on-surface-variant mt-4">Delivery preferences are saved to this device.</p>
            </Card>
          )}

          {activeTab === 'connections' && (
            <Card>
              <CardHeader icon="hub" title="Connected accounts" subtitle="Link accounts to enrich your profile" />
              <div className="divide-y divide-outline-variant/60">
                <div className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-on-surface-variant">code</span>
                    <div><p className="text-label-md font-semibold text-on-surface">GitHub</p><p className="text-label-sm text-on-surface-variant">Showcase your repositories and contributions.</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    {githubConnected && <Badge tone="success" icon="check">Connected</Badge>}
                    <Button size="sm" variant={githubConnected ? 'outline' : 'primary'} onClick={() => toggleConnection('github')}>{githubConnected ? 'Disconnect' : 'Connect'}</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-on-surface-variant">work</span>
                    <div><p className="text-label-md font-semibold text-on-surface">LinkedIn</p><p className="text-label-sm text-on-surface-variant">Import your experience and grow your network.</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    {linkedinConnected && <Badge tone="success" icon="check">Connected</Badge>}
                    <Button size="sm" variant={linkedinConnected ? 'outline' : 'primary'} onClick={() => toggleConnection('linkedin')}>{linkedinConnected ? 'Disconnect' : 'Connect'}</Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader icon="palette" title="Appearance & accessibility" subtitle="Make CareerBridge comfortable to use" />
              <div className="divide-y divide-outline-variant/60">
                <Toggle checked={reducedMotion} onChange={setReducedMotion} label="Reduce motion" description="Minimise animations and transitions." />
                <div className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-label-md font-medium text-on-surface">Text size</p>
                    <span className="text-label-sm text-on-surface-variant">{fontSize}px</span>
                  </div>
                  <input type="range" min={14} max={20} value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full accent-primary" />
                </div>
              </div>
              <p className="text-label-sm text-on-surface-variant mt-4">Appearance settings are saved to this device.</p>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
