/**
 * Mobile Settings — account, appearance, security, sign-out.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToast } from '../../../contexts/ToastContext';
import { AuthService } from '../../../services';
import { MobileShell, Card, SectionTitle, Button, Sheet, Avatar } from '../../components';

const MobileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [busy, setBusy] = useState(false);

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
    } finally {
      setBusy(false);
    }
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

  return (
    <MobileShell title="Settings" subtitle={user?.email}>
      <div className="px-4 pt-4 space-y-2.5">
        <Card>
          <div className="flex items-center gap-4">
            <Avatar src={user?.profilePicture} name={user?.name || 'User'} size={48} />
            <div className="min-w-0">
              <p className="text-sm font-bold">{user?.name}</p>
              <p className="text-xs text-on-surface-variant capitalize">{role} account</p>
            </div>
          </div>
        </Card>

        <SectionTitle>Preferences</SectionTitle>
        <div className="m-card divide-y divide-on-surface/5 overflow-hidden">
          <Row icon="dark_mode" label="Appearance" value={theme === 'dark' ? 'Dark' : 'Light'} onClick={toggleTheme} />
          <Row icon="person" label="Edit profile" onClick={() => navigate('/student/profile')} />
          <Row icon="notifications" label="Notifications" onClick={() => navigate('/student/notifications')} />
        </div>

        <SectionTitle>Security</SectionTitle>
        <div className="m-card divide-y divide-on-surface/5 overflow-hidden">
          <Row icon="lock_reset" label="Change password" onClick={() => setPwOpen(true)} />
        </div>

        <SectionTitle>Legal</SectionTitle>
        <div className="m-card divide-y divide-on-surface/5 overflow-hidden">
          <Row icon="gavel" label="Terms of service" onClick={() => navigate('/legal/terms')} />
          <Row icon="shield_person" label="Privacy policy" onClick={() => navigate('/legal/privacy')} />
        </div>

        <div className="m-card overflow-hidden mt-2">
          <Row icon="logout" label="Sign out" danger onClick={async () => { await logout(); navigate('/'); }} />
        </div>

        <p className="text-center text-[11px] text-on-surface-variant py-4">CareerBridge · v1.0.0</p>
      </div>

      <Sheet open={pwOpen} onClose={() => setPwOpen(false)} title="Change password">
        <div className="space-y-3 pb-4">
          <input
            type="password"
            value={oldPw}
            onChange={e => setOldPw(e.target.value)}
            placeholder="Current password"
            aria-label="Current password"
            className="w-full h-12 px-4 rounded-xl bg-surface-container text-sm outline-none"
          />
          <input
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="New password (min 8 characters)"
            aria-label="New password"
            className="w-full h-12 px-4 rounded-xl bg-surface-container text-sm outline-none"
          />
          <Button full disabled={busy || !oldPw || !newPw} onClick={changePassword}>
            {busy ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </Sheet>
    </MobileShell>
  );
};

export default MobileSettings;
