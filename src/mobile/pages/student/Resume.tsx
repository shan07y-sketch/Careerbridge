/**
 * Mobile Resume — premium resume workspace.
 * ATS readiness, AI analysis summary, extracted skills, version history with
 * download / share-link / revoke / delete. All operations hit ResumeService
 * (real API) — no fabricated data or actions.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { ResumeService } from '../../../services';
import type { ResumeVersion } from '../../../services';
import { MobileShell, Card, Chip, SectionTitle, SkeletonList, EmptyState, ErrorState, Button, ScoreRing, Sheet } from '../../components';

const fmtSize = (bytes: number | null): string =>
  bytes == null ? '' : bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

const STATUS_TONE: Record<ResumeVersion['status'], 'info' | 'success' | 'error'> = {
  PROCESSING: 'info',
  PARSED: 'success',
  FAILED: 'error',
};

/** Curated sub-scores to surface from the ATS analysis, in display order. */
const METRIC_LABELS: [string, string][] = [
  ['technical_skills_coverage', 'Technical skills'],
  ['keyword_density', 'Keyword match'],
  ['quantified_impact_score', 'Quantified impact'],
  ['formatting_quality', 'Formatting'],
  ['readability', 'Readability'],
  ['project_quality', 'Projects'],
];

/**
 * The analysis `summary` is either a human sentence (Gemini) or a JSON scoring
 * blob (offline fallback). Parse it so we can render structured signals instead
 * of dumping raw JSON at the user.
 */
function parseAnalysis(summary?: string): {
  text: string | null;
  metrics: { label: string; value: number }[];
  missingKeywords: string[];
} {
  if (!summary) return { text: null, metrics: [], missingKeywords: [] };
  const trimmed = summary.trim();
  if (!trimmed.startsWith('{')) return { text: trimmed, metrics: [], missingKeywords: [] };
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    const metrics = METRIC_LABELS
      .filter(([k]) => typeof obj[k] === 'number')
      .map(([k, label]) => ({ label, value: Math.max(0, Math.min(100, Math.round(obj[k] as number))) }));
    const missingKeywords = Array.isArray(obj.missing_keywords)
      ? (obj.missing_keywords as unknown[]).filter((k): k is string => typeof k === 'string')
      : [];
    return { text: null, metrics, missingKeywords };
  } catch {
    return { text: null, metrics: [], missingKeywords: [] };
  }
}

const scoreCopy = (s: number): string =>
  s >= 75 ? 'Strong — your resume clears most ATS filters.' :
  s >= 50 ? 'Solid start. A few tweaks will push you past more filters.' :
  s > 0 ? 'Needs work to pass ATS screening — see the breakdown below.' :
  'Analysis pending.';

const MobileResume: React.FC = () => {
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ResumeVersion | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setResumes(await ResumeService.getHistory());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await ResumeService.upload(file);
      showToast('Resume uploaded — analysis in progress');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const download = async (r: ResumeVersion) => {
    try {
      await ResumeService.download(r.id, r.fileName);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  };

  const share = async (r: ResumeVersion) => {
    try {
      const { shareUrl } = await ResumeService.createShareLink(r.id);
      await navigator.clipboard.writeText(shareUrl);
      showToast('Share link copied to clipboard');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create link', 'error');
    }
  };

  const revoke = async (r: ResumeVersion) => {
    try {
      await ResumeService.revokeShareLink(r.id);
      showToast('Sharing stopped');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not revoke link', 'error');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await ResumeService.deleteResume(confirmDelete.id);
      showToast('Resume deleted');
      setConfirmDelete(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const active = resumes.find(r => r.isActive) ?? resumes[0];
  const analysis = active?.resumeAnalyses?.[0];
  const atsScore = analysis?.score ?? 0;
  const { text: summaryText, metrics, missingKeywords } = parseAnalysis(analysis?.summary);

  if (loading) {
    return <MobileShell title="Resume" back><SkeletonList count={4} /></MobileShell>;
  }
  if (error) {
    return <MobileShell title="Resume" back><ErrorState message={error} onRetry={() => { setLoading(true); load(); }} /></MobileShell>;
  }

  const uploadInput = (
    <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" onChange={onUpload} className="hidden" aria-hidden="true" />
  );

  return (
    <MobileShell bare>
      {/* ---- Aurora hero ---- */}
      <section className="m-hero m-safe-top px-5 pt-4 pb-6 rounded-b-[28px]">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} aria-label="Go back" className="m-press -ml-2 w-9 h-9 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>
          <h1 className="text-lg font-extrabold">Resume</h1>
        </div>

        {active ? (
          <div className="mt-3 flex items-center gap-4 rounded-3xl m-glass p-4">
            <ScoreRing score={atsScore} size={78} label="ATS" />
            <div className="min-w-0">
              <p className="text-sm font-bold">ATS readiness</p>
              <p className="text-[13px] text-white/75 leading-snug line-clamp-3">
                {active.status === 'PROCESSING' ? 'Analyzing your resume…' : (summaryText || scoreCopy(atsScore))}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-white/75">Upload a resume to unlock your ATS score and AI feedback.</p>
        )}
      </section>

      <div className="px-4">
        {uploadInput}

        {resumes.length === 0 ? (
          <EmptyState
            icon="upload_file"
            title="No resume yet"
            hint="Upload a PDF or Word document to get an instant ATS score and tailored feedback."
            action={
              <button onClick={() => fileInput.current?.click()} disabled={uploading} className="m-press h-11 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold disabled:opacity-40">
                {uploading ? 'Uploading…' : 'Upload resume'}
              </button>
            }
          />
        ) : (
          <>
            {/* ATS breakdown — real per-category scores from the analysis */}
            {metrics.length > 0 && (
              <>
                <SectionTitle>ATS breakdown</SectionTitle>
                <Card>
                  <div className="space-y-3">
                    {metrics.map(m => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-on-surface">{m.label}</span>
                          <span className="text-on-surface-variant">{m.value}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-on-surface/8 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${m.value >= 70 ? 'bg-success' : m.value >= 45 ? 'bg-warning' : 'bg-error'}`}
                            style={{ width: `${m.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {/* Missing keywords — actionable, from the real analysis */}
            {missingKeywords.length > 0 && (
              <>
                <SectionTitle>Add these keywords</SectionTitle>
                <Card>
                  <p className="text-xs text-on-surface-variant mb-2.5">Roles you're targeting frequently mention these — weave in the ones that fit.</p>
                  <div className="flex flex-wrap gap-2">
                    {missingKeywords.slice(0, 12).map(k => <Chip key={k} tone="warning">{k}</Chip>)}
                  </div>
                </Card>
              </>
            )}

            {/* Extracted skills from the active resume */}
            {active && active.extractedSkills.length > 0 && (
              <>
                <SectionTitle>Detected skills</SectionTitle>
                <Card>
                  <div className="flex flex-wrap gap-2">
                    {active.extractedSkills.slice(0, 16).map(s => <Chip key={s}>{s}</Chip>)}
                  </div>
                </Card>
              </>
            )}

            <div className="pt-4">
              <Button full variant="tonal" icon="upload_file" disabled={uploading} onClick={() => fileInput.current?.click()}>
                {uploading ? 'Uploading…' : 'Upload new version'}
              </Button>
            </div>

            {/* Version history */}
            <SectionTitle>Version history</SectionTitle>
            <div className="space-y-2.5">
              {resumes.map(r => (
                <Card key={r.id}>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-primary">description</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.fileName}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        v{r.version} · {fmtSize(r.fileSizeBytes)} · {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {r.isActive && <Chip tone="success">Active</Chip>}
                      {!r.isActive && r.status !== 'PARSED' && <Chip tone={STATUS_TONE[r.status]}>{r.status.toLowerCase()}</Chip>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-on-surface/5">
                    <button onClick={() => download(r)} className="m-press flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">download</span>Download
                    </button>
                    {r.shareEnabled ? (
                      <button onClick={() => revoke(r)} className="m-press flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold text-warning">
                        <span className="material-symbols-outlined text-[18px]">link_off</span>Stop sharing
                      </button>
                    ) : (
                      <button onClick={() => share(r)} className="m-press flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
                        <span className="material-symbols-outlined text-[18px]">link</span>Share
                      </button>
                    )}
                    <button onClick={() => setConfirmDelete(r)} aria-label={`Delete ${r.fileName}`} className="m-press w-9 h-9 rounded-full flex items-center justify-center text-error">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="h-4" />
      </div>

      {/* Delete confirmation */}
      <Sheet open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete resume?">
        {confirmDelete && (
          <div className="pb-4 space-y-4">
            <p className="text-sm text-on-surface-variant px-1">
              Permanently delete <span className="font-semibold text-on-surface">{confirmDelete.fileName}</span> (v{confirmDelete.version})? This can't be undone.
            </p>
            <div className="flex gap-2">
              <Button full variant="outline" disabled={busy} onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button full variant="danger" disabled={busy} onClick={doDelete}>Delete</Button>
            </div>
          </div>
        )}
      </Sheet>
    </MobileShell>
  );
};

export default MobileResume;
