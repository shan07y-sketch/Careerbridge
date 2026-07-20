/**
 * Mobile Settings — premium account, career preferences, connections,
 * appearance, security and sign-out. Editable fields persist through
 * updateUser -> ProfileService.updateStudentProfile (real API).
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToast } from '../../../contexts/ToastContext';
import { AuthService } from '../../../services';
import { TwoFactorSettings } from '../../../components/auth/TwoFactorSettings';
import { MobileShell, Card, SectionTitle, Button, Sheet, Segmented, Avatar } from '../../components';

const inputCls = 'w-full h-11 px-4 rounded-xl bg-surface-container text-sm outline-none focus:ring-2 focus:ring-primary/30';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

const MobileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  // Account details
  const [name, setName] = useState(user?.name || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [degree, setDegree] = useState(user?.degree || '');
  const [gradYear, setGradYear] = useState(String(user?.gradYear || ''));
  const [careerGoal, setCareerGoal] = useState(user?.careerGoal || '');
  const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site'>(user?.workMode || 'Remote');
  const [preferredLocation, setPreferredLocation] = useState(user?.preferredLocation || '');

  // Career preferences
  const [careerPath, setCareerPath] = useState(user?.careerPath || '');
  const [targetCompanies, setTargetCompanies] = useState(user?.targetCompanies || '');
  const [targetSalary, setTargetSalary] = useState(user?.targetSalaryRange || '');
  const [jobType, setJobType] = useState<'Internship' | 'Full-Time'>(user?.jobTypePreference || 'Full-Time');
  const [recFrequency, setRecFrequency] = useState<'Daily' | 'Weekly' | 'Off'>(user?.recommendationFrequency || 'Daily');
  const [industries, setIndustries] = useState<string[]>(user?.preferredIndustries || []);
  const [industryDraft, setIndustryDraft] = useState('');

  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [connecting, setConnecting] = useState<'github' | 'linkedin' | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [busy, setBusy] = useState(false);

  const saveAccount = async () => {
    setSavingAccount(true);
    try {
      await updateUser({
        name, university, degree,
        gradYear: parseInt(gradYear) || new Date().getFullYear(),
        careerGoal, workMode, preferredLocation,
      });
      showToast('Account details saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally { setSavingAccount(false); }
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      await updateUser({
        careerPath, targetCompanies, targetSalaryRange: targetSalary,
        jobTypePreference: jobType, preferredIndustries: industries, recommendationFrequency: recFrequency,
      });
      showToast('Career preferences saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally { setSavingPrefs(false); }
  };

  const toggleConnection = async (which: 'github' | 'linkedin') => {
    setConnecting(which);
    try {
      if (which === 'github') {
        const next = !user?.gitHubConnected;
        await updateUser({ gitHubConnected: next });
        showToast(next ? 'GitHub connected' : 'GitHub disconnected');
      } else {
        const next = !user?.linkedInConnected;
        await updateUser({ linkedInConnected: next });
        showToast(next ? 'LinkedIn connected' : 'LinkedIn disconnected');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update', 'error');
    } finally { setConnecting(null); }
  };

  const addIndustry = () => {
    const v = industryDraft.trim();
    if (v && !industries.includes(v)) setIndustries(prev => [...prev, v]);
    setIndustryDraft('');
  };

  const changePassword = async () => {
    if (newPw.length < 8) { showToast('New password must be at least 8 characters', 'error'); return; }
    setBusy(true);
    try {
      await AuthService.changePassword(oldPw, newPw);
      showToast('Password updated');
      setPwOpen(false);
      setOldPw(''); setNewPw('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not change password', 'error');
    } finally { setBusy(false); }
  };

  const Row: React.FC<{ icon: string; label: string; value?: string; onClick?: () => void; danger?: boolean }> =
    ({ icon, label, value, onClick, danger }) => (
      <button onClick={onClick} disabled={!onClick} className="m-press w-full flex items-center gap-3 px-4 py-3.5 text-left disabled:opacity-100">
        <span className={`material-symbols-outlined text-[22px] ${danger ? 'text-error' : 'text-on-surface-variant'}`}>{icon}</span>
        <span className={`flex-1 text-sm font-semibold ${danger ? 'text-error' : 'text-on-surface'}`}>{label}</span>
        {value && <span className="text-xs text-on-surface-variant">{value}</span>}
        {onClick && !danger && <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>}
      </button>
    );

  const ConnRow: React.FC<{ which: 'github' | 'linkedin'; icon: string; label: string; on: boolean }> = ({ which, icon, label, on }) => (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="material-symbols-outlined text-[22px] text-on-surface-variant">{icon}</span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <button
        onClick={() => toggleConnection(which)}
        disabled={connecting === which}
        className={`m-press h-8 px-4 rounded-full text-xs font-bold disabled:opacity-50 ${on ? 'bg-success/15 text-success' : 'bg-primary text-on-primary'}`}
      >
        {connecting === which ? '…' : on ? 'Connected' : 'Connect'}
      </button>
    </div>
  );

  return (
    <MobileShell bare>
      {/* ---- Aurora hero ---- */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-6 rounded-b-[28px]">
        <p className="text-[13px] text-white/70 leading-none">Settings</p>
        <div className="mt-3 flex items-center gap-4">
          <Avatar src={user?.profilePicture} name={user?.name || 'User'} size={56} />
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-tight truncate">{user?.name}</p>
            <p className="text-[13px] text-white/70 truncate">{user?.email}</p>
            <p className="text-[11px] text-white/60 capitalize mt-0.5">{role} account</p>
          </div>
        </div>
      </section>

      <div className="px-4">
        {/* ---- Account details ---- */}
        <SectionTitle>Account details</SectionTitle>
        <Card>
          <div className="space-y-3">
            <Field label="Full name"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Degree"><input className={inputCls} value={degree} onChange={e => setDegree(e.target.value)} placeholder="e.g. B.Tech CSE" /></Field>
              <Field label="Grad year"><input className={inputCls} inputMode="numeric" value={gradYear} onChange={e => setGradYear(e.target.value)} placeholder="2026" /></Field>
            </div>
            <Field label="University"><input className={inputCls} value={university} onChange={e => setUniversity(e.target.value)} /></Field>
            <Field label="Career goal"><input className={inputCls} value={careerGoal} onChange={e => setCareerGoal(e.target.value)} placeholder="e.g. Cloud Engineer" /></Field>
            <Field label="Preferred work mode">
              <Segmented<'Remote' | 'Hybrid' | 'On-site'>
                value={workMode}
                onChange={setWorkMode}
                options={[{ value: 'Remote', label: 'Remote' }, { value: 'Hybrid', label: 'Hybrid' }, { value: 'On-site', label: 'On-site' }]}
              />
            </Field>
            <Field label="Preferred location"><input className={inputCls} value={preferredLocation} onChange={e => setPreferredLocation(e.target.value)} placeholder="e.g. Bangalore" /></Field>
            <Button full disabled={savingAccount} onClick={saveAccount}>{savingAccount ? 'Saving…' : 'Save account details'}</Button>
          </div>
        </Card>

        {/* ---- Career preferences ---- */}
        <SectionTitle>Career preferences</SectionTitle>
        <Card>
          <div className="space-y-3">
            <Field label="Target role / path"><input className={inputCls} value={careerPath} onChange={e => setCareerPath(e.target.value)} placeholder="e.g. Product Engineer" /></Field>
            <Field label="Target companies"><input className={inputCls} value={targetCompanies} onChange={e => setTargetCompanies(e.target.value)} placeholder="e.g. Stripe, Figma" /></Field>
            <Field label="Target salary"><input className={inputCls} value={targetSalary} onChange={e => setTargetSalary(e.target.value)} placeholder="e.g. $120k" /></Field>
            <Field label="Looking for">
              <Segmented<'Internship' | 'Full-Time'>
                value={jobType}
                onChange={setJobType}
                options={[{ value: 'Full-Time', label: 'Full-Time' }, { value: 'Internship', label: 'Internship' }]}
              />
            </Field>
            <Field label="Recommendation frequency">
              <Segmented<'Daily' | 'Weekly' | 'Off'>
                value={recFrequency}
                onChange={setRecFrequency}
                options={[{ value: 'Daily', label: 'Daily' }, { value: 'Weekly', label: 'Weekly' }, { value: 'Off', label: 'Off' }]}
              />
            </Field>
            <Field label="Preferred industries">
              <div className="flex flex-wrap gap-2 mb-2">
                {industries.map(ind => (
                  <button key={ind} onClick={() => setIndustries(prev => prev.filter(x => x !== ind))} className="m-press">
                    <span className="inline-flex items-center gap-1 px-3 h-8 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold">
                      {ind}<span className="material-symbols-outlined text-[16px]">close</span>
                    </span>
                  </button>
                ))}
                {industries.length === 0 && <span className="text-xs text-on-surface-variant">None added yet.</span>}
              </div>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={industryDraft}
                  onChange={e => setIndustryDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIndustry(); } }}
                  placeholder="Add an industry"
                />
                <button onClick={addIndustry} className="m-press h-11 px-4 rounded-xl bg-surface-container text-sm font-semibold shrink-0">Add</button>
              </div>
            </Field>
            <Button full disabled={savingPrefs} onClick={savePrefs}>{savingPrefs ? 'Saving…' : 'Save preferences'}</Button>
          </div>
        </Card>

        {/* ---- Connections ---- */}
        <SectionTitle>Connections</SectionTitle>
        <div className="m-card divide-y divide-on-surface/5 overflow-hidden">
          <ConnRow which="linkedin" icon="hub" label="LinkedIn" on={!!user?.linkedInConnected} />
          <ConnRow which="github" icon="code" label="GitHub" on={!!user?.gitHubConnected} />
        </div>

        {/* ---- Preferences ---- */}
        <SectionTitle>App</SectionTitle>
        <div className="m-card divide-y divide-on-surface/5 overflow-hidden">
          <Row icon={theme === 'dark' ? 'dark_mode' : 'light_mode'} label="Appearance" value={theme === 'dark' ? 'Dark' : 'Light'} onClick={toggleTheme} />
          <Row icon="notifications" label="Notifications" onClick={() => navigate('/student/notifications')} />
          <Row icon="lock_reset" label="Change password" onClick={() => setPwOpen(true)} />
        </div>

        {/* ---- Security ---- */}
        <SectionTitle>Security</SectionTitle>
        <TwoFactorSettings />

        {/* ---- Legal ---- */}
        <SectionTitle>Legal</SectionTitle>
        <div className="m-card divide-y divide-on-surface/5 overflow-hidden">
          <Row icon="gavel" label="Terms of service" onClick={() => navigate('/legal/terms')} />
          <Row icon="shield_person" label="Privacy policy" onClick={() => navigate('/legal/privacy')} />
        </div>

        <div className="m-card overflow-hidden mt-2.5">
          <Row icon="logout" label="Sign out" danger onClick={async () => { await logout(); navigate('/'); }} />
        </div>

        <p className="text-center text-[11px] text-on-surface-variant py-4">CareerBridge · v1.0.0</p>
      </div>

      <Sheet open={pwOpen} onClose={() => setPwOpen(false)} title="Change password">
        <div className="space-y-3 pb-4">
          <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Current password" aria-label="Current password" className="w-full h-12 px-4 rounded-xl bg-surface-container text-sm outline-none" />
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 8 characters)" aria-label="New password" className="w-full h-12 px-4 rounded-xl bg-surface-container text-sm outline-none" />
          <Button full disabled={busy || !oldPw || !newPw} onClick={changePassword}>{busy ? 'Updating…' : 'Update password'}</Button>
        </div>
      </Sheet>
    </MobileShell>
  );
};

export default MobileSettings;
