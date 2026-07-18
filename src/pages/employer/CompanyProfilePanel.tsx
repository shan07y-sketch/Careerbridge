import React, { useEffect, useState } from 'react';
import { EmployerCompanyService } from '../../services';
import type { EmployerCompanyProfile, EmployerOfficeLocation } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Section } from '../../components/ui/Section';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/Progress';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

const inputClass = 'w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-0 outline-none transition-all';

export const CompanyProfilePanel: React.FC = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<EmployerCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<EmployerCompanyProfile | null>(null);
  const [editBasic, setEditBasic] = useState(false);
  const [editAbout, setEditAbout] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [newTech, setNewTech] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddr, setNewLocAddr] = useState('');

  const load = () => {
    setLoading(true); setError(null);
    EmployerCompanyService.getProfile()
      .then(p => { setProfile(p); setDraft(p); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load company profile.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (patch: Partial<EmployerCompanyProfile>) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next); setSaving(true);
    try {
      const updated = await EmployerCompanyService.updateProfile({
        logoUrl: next.logoUrl ?? undefined, website: next.website ?? undefined, industry: next.industry,
        description: next.description, size: next.size ?? undefined, headquarters: next.headquarters ?? undefined,
        coverImageUrl: next.coverImageUrl ?? undefined, missionValues: next.missionValues, techStack: next.techStack,
        galleryImages: next.galleryImages, officeLocations: next.officeLocations,
        screenedTarget: next.screenedTarget, outreachTarget: next.outreachTarget,
      });
      setProfile(updated); setDraft(updated);
      showToast('Company profile saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save changes.', 'error'); load();
    } finally { setSaving(false); }
  };

  const header = (
    <PageHeader title="Company profile"
      description="Your public identity, culture and recruitment branding — saved to your real company record."
      actions={saving ? <span className="text-label-md font-semibold text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Saving…</span> : undefined} />
  );

  if (loading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error || !profile || !draft) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load company profile" description={error || 'Please try again.'} actionLabel="Retry" onAction={load} /></>;

  const addValue = () => { if (!newValue.trim()) return; save({ missionValues: [...draft.missionValues, newValue.trim()] }); setNewValue(''); };
  const addTech = () => { if (!newTech.trim() || draft.techStack.includes(newTech.trim())) return; save({ techStack: [...draft.techStack, newTech.trim()] }); setNewTech(''); };
  const addLoc = () => { if (!newLocName.trim() || !newLocAddr.trim()) return; const loc: EmployerOfficeLocation = { id: `loc_${Date.now()}`, name: newLocName.trim(), address: newLocAddr.trim() }; save({ officeLocations: [...draft.officeLocations, loc] }); setNewLocName(''); setNewLocAddr(''); };

  const screenPct = Math.min(100, (profile.activity.screened / Math.max(1, draft.screenedTarget)) * 100);
  const outreachPct = Math.min(100, (profile.activity.outreach / Math.max(1, draft.outreachTarget)) * 100);

  return (
    <>
      {header}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card className="!p-0 overflow-hidden">
            <div className="h-32 bg-surface-container-high">{draft.coverImageUrl && <img className="w-full h-full object-cover" alt="" src={draft.coverImageUrl} />}</div>
            <div className="px-6 pb-6 -mt-10">
              <div className="flex items-end gap-4">
                <span className="w-20 h-20 rounded-2xl bg-surface-container-lowest border-4 border-surface-container-lowest shadow-card overflow-hidden flex items-center justify-center p-2 shrink-0">
                  {draft.logoUrl ? <img className="w-full h-full object-contain" alt="" src={draft.logoUrl} /> : <span className="material-symbols-outlined text-3xl text-on-surface-variant">apartment</span>}
                </span>
                <div className="pb-1 flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-title-lg font-semibold text-on-surface truncate">{draft.name}</h2>
                    {profile.isVerified && <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
                  </div>
                  <p className="text-label-md text-on-surface-variant mt-0.5">{draft.headquarters || 'No HQ set'} · {draft.industry}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditBasic(v => !v)}>{editBasic ? 'Close' : 'Edit'}</Button>
              </div>
              {editBasic && (
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  <input className={inputClass} placeholder="Logo URL" value={draft.logoUrl ?? ''} onChange={e => setDraft({ ...draft, logoUrl: e.target.value })} />
                  <input className={inputClass} placeholder="Cover image URL" value={draft.coverImageUrl ?? ''} onChange={e => setDraft({ ...draft, coverImageUrl: e.target.value })} />
                  <input className={inputClass} placeholder="Headquarters" value={draft.headquarters ?? ''} onChange={e => setDraft({ ...draft, headquarters: e.target.value })} />
                  <input className={inputClass} placeholder="Industry" value={draft.industry} onChange={e => setDraft({ ...draft, industry: e.target.value })} />
                  <input className={inputClass} placeholder="Website" value={draft.website ?? ''} onChange={e => setDraft({ ...draft, website: e.target.value })} />
                  <input type="number" className={inputClass} placeholder="Company size" value={draft.size ?? ''} onChange={e => setDraft({ ...draft, size: e.target.value ? parseInt(e.target.value) : null })} />
                  <div className="sm:col-span-2"><Button variant="primary" size="sm" onClick={() => { save({ logoUrl: draft.logoUrl, coverImageUrl: draft.coverImageUrl, headquarters: draft.headquarters, industry: draft.industry, website: draft.website, size: draft.size }); setEditBasic(false); }}>Save</Button></div>
                </div>
              )}
            </div>
          </Card>

          <Section title="About" action={<Button size="sm" variant="ghost" onClick={() => setEditAbout(v => !v)}>{editAbout ? 'Close' : 'Edit'}</Button>}>
            <Card>
              {editAbout ? (
                <div className="space-y-2">
                  <textarea rows={4} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} className="w-full p-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface outline-none focus:border-primary/40" />
                  <Button size="sm" variant="primary" onClick={() => { save({ description: draft.description }); setEditAbout(false); }}>Save</Button>
                </div>
              ) : (
                <p className="text-body-md text-on-surface-variant leading-relaxed">{draft.description || 'No description yet. Add one to tell candidates about your company.'}</p>
              )}
            </Card>
          </Section>

          <Section title="Mission & values">
            <Card>
              {draft.missionValues.length === 0 ? <p className="text-label-md text-on-surface-variant mb-3">No mission values yet.</p> : (
                <ul className="space-y-2 mb-4">{draft.missionValues.map((v, i) => (
                  <li key={i} className="flex items-center gap-2 text-body-md text-on-surface"><span className="material-symbols-outlined text-[18px] text-primary">check_circle</span><span className="flex-grow">{v}</span><button onClick={() => save({ missionValues: draft.missionValues.filter((_, idx) => idx !== i) })} className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">close</span></button></li>
                ))}</ul>
              )}
              <div className="flex gap-2 max-w-md"><input value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(); } }} placeholder="Add a value…" className={inputClass} /><Button variant="outline" onClick={addValue}>Add</Button></div>
            </Card>
          </Section>

          <Section title="Tech stack">
            <Card>
              <div className="flex flex-wrap gap-2 mb-4">
                {draft.techStack.length === 0 && <span className="text-label-md text-on-surface-variant">No technologies listed yet.</span>}
                {draft.techStack.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 h-8 rounded-full bg-primary-container text-on-primary-container text-label-sm font-semibold">{t}<button onClick={() => save({ techStack: draft.techStack.filter(x => x !== t) })} aria-label={`Remove ${t}`}><span className="material-symbols-outlined text-[16px]">close</span></button></span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md"><input value={newTech} onChange={e => setNewTech(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }} placeholder="Add a technology…" className={inputClass} /><Button variant="outline" onClick={addTech}>Add</Button></div>
            </Card>
          </Section>

          <Section title="Office locations" description={`${draft.officeLocations.length} ${draft.officeLocations.length === 1 ? 'location' : 'locations'}`}>
            <div className="space-y-4">
              {draft.officeLocations.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {draft.officeLocations.map(loc => (
                    <Card key={loc.id} className="!p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0"><p className="text-body-md font-semibold text-on-surface truncate">{loc.name}</p><p className="text-label-sm text-on-surface-variant mt-0.5">{loc.address}</p></div>
                        <button onClick={() => save({ officeLocations: draft.officeLocations.filter(l => l.id !== loc.id) })} className="text-on-surface-variant hover:text-error shrink-0"><span className="material-symbols-outlined text-[18px]">close</span></button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              <Card className="!p-4">
                <div className="flex flex-wrap gap-2">
                  <input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Location name" className={`${inputClass} flex-1 min-w-[140px]`} />
                  <input value={newLocAddr} onChange={e => setNewLocAddr(e.target.value)} placeholder="Address" className={`${inputClass} flex-1 min-w-[140px]`} />
                  <Button variant="outline" onClick={addLoc}>Add location</Button>
                </div>
              </Card>
            </div>
          </Section>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader icon="verified_user" title="Verification" />
            {profile.isVerified ? (
              <div className="flex items-center gap-2"><Badge tone="success" icon="verified">Verified organization</Badge></div>
            ) : (
              <>
                <Badge tone="warning" icon="hourglass_empty">Not yet verified</Badge>
                <p className="text-label-md text-on-surface-variant mt-3">Verified companies rank higher with candidates and universities. Verification uses your official domain and company details on file.</p>
              </>
            )}
          </Card>

          <Card>
            <CardHeader icon="insights" title="This month's activity" />
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-label-md mb-1.5"><span className="text-on-surface">Applications screened</span><span className="text-on-surface-variant">{profile.activity.screened}/{draft.screenedTarget}</span></div>
                <ProgressBar value={screenPct} />
              </div>
              <div>
                <div className="flex justify-between text-label-md mb-1.5"><span className="text-on-surface">Interviews scheduled</span><span className="text-on-surface-variant">{profile.activity.outreach}/{draft.outreachTarget}</span></div>
                <ProgressBar value={outreachPct} tone="bg-tertiary" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="block"><span className="text-label-sm font-semibold text-on-surface-variant">Screening target</span><input type="number" value={draft.screenedTarget} onChange={e => setDraft({ ...draft, screenedTarget: parseInt(e.target.value) || 0 })} onBlur={() => save({ screenedTarget: draft.screenedTarget })} className={`mt-1 ${inputClass}`} /></label>
                <label className="block"><span className="text-label-sm font-semibold text-on-surface-variant">Outreach target</span><input type="number" value={draft.outreachTarget} onChange={e => setDraft({ ...draft, outreachTarget: parseInt(e.target.value) || 0 })} onBlur={() => save({ outreachTarget: draft.outreachTarget })} className={`mt-1 ${inputClass}`} /></label>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CompanyProfilePanel;
