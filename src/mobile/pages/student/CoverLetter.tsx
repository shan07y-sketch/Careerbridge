/**
 * Mobile AI Cover Letter Generator.
 * Generates real, profile-grounded cover letters via CoverLetterService
 * (Gemini). Supports generating from a saved job posting or a free-form
 * role/company, four tone presets, draft history, copy, and delete.
 * Fallback-generated drafts are labelled so a heuristic is never shown as
 * live AI output.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { CoverLetterService, JobService } from '../../../services';
import type { CoverLetter, CoverLetterTone } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Sheet, Card, SectionTitle, Chip, SkeletonList, EmptyState, ErrorState } from '../../components';

const TONES: { key: CoverLetterTone; label: string; hint: string }[] = [
  { key: 'PROFESSIONAL', label: 'Professional', hint: 'Measured and businesslike' },
  { key: 'ENTHUSIASTIC', label: 'Enthusiastic', hint: 'Warm and energetic' },
  { key: 'CONCISE', label: 'Concise', hint: 'Tight and direct' },
  { key: 'ACADEMIC', label: 'Academic', hint: 'Formal and precise' }
];

interface JobOption {
  id: string;
  title: string;
  company?: { name?: string } | null;
}

const MobileCoverLetter: React.FC = () => {
  const { showToast } = useToast();

  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [active, setActive] = useState<CoverLetter | null>(null);

  const [mode, setMode] = useState<'job' | 'custom'>('job');
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobId, setJobId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tone, setTone] = useState<CoverLetterTone>('PROFESSIONAL');

  const load = useCallback(async () => {
    try {
      setError(null);
      setLetters(await CoverLetterService.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your cover letters.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Saved jobs are the most likely generation target, so preload them for the
  // picker. Non-critical: failure just leaves the student on the custom tab.
  useEffect(() => {
    (async () => {
      try {
        const saved = await JobService.getSavedJobs();
        const opts = (saved as unknown as { job?: JobOption }[])
          .map(s => s.job)
          .filter((j): j is JobOption => Boolean(j?.id));
        setJobs(opts);
        if (opts.length) setJobId(opts[0].id);
        else setMode('custom');
      } catch {
        setMode('custom');
      }
    })();
  }, []);

  const generate = async () => {
    if (generating) return;
    if (mode === 'job' && !jobId) {
      showToast('Pick a job first.', 'error');
      return;
    }
    if (mode === 'custom' && (!targetRole.trim() || !companyName.trim())) {
      showToast('Enter both a role and a company.', 'error');
      return;
    }
    setGenerating(true);
    try {
      const letter = await CoverLetterService.generate(
        mode === 'job' ? { jobId, tone } : { targetRole: targetRole.trim(), companyName: companyName.trim(), tone }
      );
      setComposerOpen(false);
      setActive(letter);
      await load();
      showToast(
        letter.estimated
          ? 'Draft created offline — AI was unavailable.'
          : 'Cover letter generated.',
        letter.estimated ? 'info' : 'success'
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Generation failed.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard.', 'success');
    } catch {
      showToast('Could not copy.', 'error');
    }
  };

  const remove = async (id: string) => {
    try {
      await CoverLetterService.remove(id);
      setActive(null);
      setLetters(prev => prev.filter(l => l.id !== id));
      showToast('Cover letter deleted.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Delete failed.', 'error');
    }
  };

  const isEstimated = (l: CoverLetter) => l.modelVersion?.endsWith('-estimated');

  if (loading) return <MobileShell title="Cover Letters" back><SkeletonList count={3} /></MobileShell>;
  if (error) {
    return (
      <MobileShell title="Cover Letters" back>
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      </MobileShell>
    );
  }

  return (
    <MobileShell
      title="Cover Letters"
      subtitle="AI-written, grounded in your profile"
      back
      fab={
        <button
          onClick={() => setComposerOpen(true)}
          className="m-press h-14 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold shadow-lg"
        >
          Generate
        </button>
      }
    >
      {letters.length === 0 ? (
        <EmptyState
          icon="draft"
          title="No cover letters yet"
          hint="Generate a letter tailored to a saved job or any role you're targeting."
          action={
            <button
              onClick={() => setComposerOpen(true)}
              className="m-press h-11 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold"
            >
              Generate one
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          <SectionTitle>Your drafts</SectionTitle>
          {letters.map(l => (
            <Card key={l.id} onClick={() => setActive(l)} className="m-press">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{l.targetRole}</p>
                  <p className="text-sm opacity-70 truncate">{l.companyName}</p>
                </div>
                <Chip>{TONES.find(t => t.key === l.tone)?.label ?? l.tone}</Chip>
              </div>
              <p className="text-xs opacity-60 mt-2">
                {new Date(l.createdAt).toLocaleDateString()}
                {isEstimated(l) && ' · Offline draft'}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Composer */}
      <Sheet open={composerOpen} onClose={() => !generating && setComposerOpen(false)} title="Generate a cover letter">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              className={`m-press flex-1 py-2 rounded-xl text-sm ${mode === 'job' ? 'm-glass font-semibold' : 'opacity-60'}`}
              onClick={() => setMode('job')}
              disabled={jobs.length === 0}
            >
              Saved job
            </button>
            <button
              className={`m-press flex-1 py-2 rounded-xl text-sm ${mode === 'custom' ? 'm-glass font-semibold' : 'opacity-60'}`}
              onClick={() => setMode('custom')}
            >
              Custom role
            </button>
          </div>

          {mode === 'job' ? (
            jobs.length ? (
              <label className="block">
                <span className="text-sm opacity-70">Job</span>
                <select
                  className="w-full mt-1 p-3 rounded-xl m-glass bg-transparent"
                  value={jobId}
                  onChange={e => setJobId(e.target.value)}
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title}{j.company?.name ? ` — ${j.company.name}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-sm opacity-70">You have no saved jobs yet. Use a custom role instead.</p>
            )
          ) : (
            <>
              <label className="block">
                <span className="text-sm opacity-70">Target role</span>
                <input
                  className="w-full mt-1 p-3 rounded-xl m-glass bg-transparent"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  placeholder="Backend Engineer"
                />
              </label>
              <label className="block">
                <span className="text-sm opacity-70">Company</span>
                <input
                  className="w-full mt-1 p-3 rounded-xl m-glass bg-transparent"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Stripe"
                />
              </label>
            </>
          )}

          <div>
            <span className="text-sm opacity-70">Tone</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {TONES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTone(t.key)}
                  className={`m-press p-3 rounded-xl text-left ${tone === t.key ? 'm-glass' : 'opacity-60'}`}
                >
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="text-xs opacity-70">{t.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            className="m-press w-full py-3 rounded-xl m-glass font-semibold disabled:opacity-50"
            onClick={generate}
            disabled={generating}
          >
            {generating ? 'Writing your letter…' : 'Generate'}
          </button>
        </div>
      </Sheet>

      {/* Reader */}
      <Sheet open={Boolean(active)} onClose={() => setActive(null)} title={active?.targetRole ?? ''}>
        {active && (
          <div className="space-y-4">
            <div>
              <p className="text-sm opacity-70">{active.companyName}</p>
              {isEstimated(active) && (
                <p className="text-xs mt-1 opacity-70">
                  Written offline because AI was unavailable — review before sending.
                </p>
              )}
            </div>

            {active.highlights?.length ? (
              <div>
                <SectionTitle>What it leans on</SectionTitle>
                <ul className="mt-1 space-y-1">
                  {active.highlights.map((h, i) => (
                    <li key={i} className="text-sm opacity-80">• {h}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="whitespace-pre-wrap text-sm leading-relaxed m-glass p-4 rounded-xl">
              {active.content}
            </div>

            <div className="flex gap-2">
              <button className="m-press flex-1 py-3 rounded-xl m-glass font-semibold" onClick={() => copy(active.content)}>
                Copy
              </button>
              <button className="m-press px-4 py-3 rounded-xl m-glass" onClick={() => remove(active.id)}>
                Delete
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </MobileShell>
  );
};

export default MobileCoverLetter;
