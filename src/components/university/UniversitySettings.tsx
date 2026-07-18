import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UniversityService, type UniversitySettingsData } from '../../services';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';

const inputClass = (err?: boolean) => `w-full h-11 px-3.5 rounded-xl border bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 outline-none transition-all focus:ring-0 focus:shadow-focus-brand ${err ? 'border-error' : 'border-outline-variant/70 focus:border-primary/40'}`;

export const UniversitySettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<UniversitySettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [location, setLocation] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await UniversityService.getSettings();
      setSettings(data); setName(data.name || ''); setLogoUrl(data.logoUrl || ''); setLocation(data.location || '');
      const cell = data.placementCells?.[0];
      setDirectorName(cell?.directorName || ''); setContactEmail(cell?.contactEmail || ''); setPhone(cell?.phone || '');
    } catch (err: any) { setError(err?.message || 'Failed to load university settings.'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) next.name = 'University name is required.';
    if (!location.trim()) next.location = 'Location is required.';
    if (directorName.trim() && !contactEmail.trim()) next.contactEmail = 'Contact email is required when a director is set.';
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) next.contactEmail = 'Contact email is invalid.';
    setErrors(next); return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { showToast('Please fix the highlighted fields.', 'error'); return; }
    setIsSaving(true);
    try {
      const updated = await UniversityService.updateSettings({ name: name.trim(), logoUrl: logoUrl.trim(), location: location.trim(), directorName: directorName.trim(), contactEmail: contactEmail.trim(), phone: phone.trim() });
      setSettings(updated); showToast('University settings saved.', 'success');
    } catch (err: any) { showToast(err?.message || 'Failed to save settings.', 'error'); }
    finally { setIsSaving(false); }
  };

  const header = <PageHeader title="University settings" description="Your university's public profile and placement office contact details." actions={<Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={isLoading}>Save changes</Button>} />;
  const Label = ({ children }: { children: React.ReactNode }) => <span className="block text-label-md font-semibold text-on-surface mb-1">{children}</span>;
  const Err = ({ k }: { k: string }) => errors[k] ? <p className="text-error text-label-sm font-semibold mt-1">{errors[k]}</p> : null;

  if (isLoading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error || !settings) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load settings" description={error || 'Please try again.'} actionLabel="Retry" onAction={load} /></>;

  return (
    <>
      {header}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 space-y-8">
          <Card>
            <CardHeader icon="school" title="University profile" />
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2"><Label>University name</Label><input value={name} onChange={e => setName(e.target.value)} className={inputClass(!!errors.name)} /><Err k="name" /></div>
              <div><Label>Location</Label><input value={location} onChange={e => setLocation(e.target.value)} className={inputClass(!!errors.location)} /><Err k="location" /></div>
              <div><Label>Logo URL</Label><input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className={inputClass()} placeholder="https://…" type="url" /></div>
            </div>
          </Card>
          <Card>
            <CardHeader icon="contact_page" title="Placement cell contact" />
            <div className="grid sm:grid-cols-2 gap-5">
              <div><Label>Director name</Label><input value={directorName} onChange={e => setDirectorName(e.target.value)} className={inputClass()} /></div>
              <div><Label>Contact email</Label><input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className={inputClass(!!errors.contactEmail)} type="email" /><Err k="contactEmail" /></div>
              <div><Label>Phone</Label><input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass()} type="tel" /></div>
            </div>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader icon="visibility" title="Preview" />
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-semibold text-title-lg overflow-hidden shrink-0">{logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : (name[0] || 'U')}</span>
              <div className="min-w-0"><p className="text-body-md font-semibold text-on-surface truncate">{name || 'University name'}</p><p className="text-label-md text-on-surface-variant truncate">{location || 'Location not set'}</p></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UniversitySettings;
