/**
 * Mobile Job Details — full role view with apply, save and native share.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Share } from '@capacitor/share';
import type { Job } from '../../../types';
import { JobService, ApplicationService } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Card, Chip, Button, Skeleton, ErrorState, SectionTitle, Avatar } from '../../components';

const MobileJobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [detail, isSaved] = await Promise.all([
        JobService.getJobById(id),
        JobService.isJobSaved(id).catch(() => false),
      ]);
      setJob(detail ?? null);
      setSaved(isSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleSave = async () => {
    if (!id) return;
    try {
      const nowSaved = await JobService.toggleSaveJob(id);
      setSaved(nowSaved);
      showToast(nowSaved ? 'Job saved' : 'Removed from saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save job', 'error');
    }
  };

  const share = async () => {
    if (!job) return;
    const text = `${job.title} at ${job.companyName} — via CareerBridge`;
    try {
      if (await Share.canShare().then(r => r.value).catch(() => false)) {
        await Share.share({ title: job.title, text, url: window.location.href });
      } else if (navigator.share) {
        await navigator.share({ title: job.title, text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        showToast('Link copied to clipboard');
      }
    } catch {
      /* user cancelled the share sheet */
    }
  };

  const apply = async () => {
    if (!id) return;
    setApplying(true);
    try {
      await ApplicationService.applyToJob(id);
      showToast('Application submitted');
      navigate('/student/applications');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not apply', 'error');
    } finally {
      setApplying(false);
    }
  };

  return (
    <MobileShell
      title={job?.title || 'Job details'}
      back
      hideTabs
      actions={
        <div className="flex">
          <button onClick={share} aria-label="Share job" className="m-press w-10 h-10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">share</span>
          </button>
          <button onClick={toggleSave} aria-label={saved ? 'Unsave job' : 'Save job'} className="m-press w-10 h-10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]" style={saved ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              bookmark
            </span>
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="px-4 pt-4 space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : error || !job ? (
        <ErrorState message={error || 'Job not found'} onRetry={() => { setLoading(true); load(); }} />
      ) : (
        <div className="px-4 pt-4 pb-28">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar src={job.companyLogo} name={job.companyName} size={48} />
              <div className="min-w-0">
                <p className="text-base font-bold leading-snug">{job.title}</p>
                <p className="text-sm text-on-surface-variant">{job.companyName}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {job.location && <Chip>{job.location}</Chip>}
              {job.workMode && <Chip>{job.workMode}</Chip>}
              {job.type && <Chip>{job.type}</Chip>}
              {job.salaryRange && <Chip tone="success">{job.salaryRange}</Chip>}
              {job.matchRate > 0 && <Chip tone="info">{Math.round(job.matchRate)}% match</Chip>}
            </div>
          </Card>

          {job.description && (
            <>
              <SectionTitle>About the role</SectionTitle>
              <Card>
                <p className="text-sm text-on-surface whitespace-pre-line leading-relaxed">{job.description}</p>
              </Card>
            </>
          )}

          {job.requirements.length > 0 && (
            <>
              <SectionTitle>Requirements</SectionTitle>
              <Card>
                <ul className="space-y-2">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">check_circle</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}

          {job.responsibilities.length > 0 && (
            <>
              <SectionTitle>Responsibilities</SectionTitle>
              <Card>
                <ul className="space-y-2">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="material-symbols-outlined text-[18px] text-tertiary shrink-0" aria-hidden="true">arrow_right</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}

          {/* Sticky apply bar */}
          <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest border-t border-on-surface/10 px-4 py-3 m-safe-bottom">
            <Button full onClick={apply} disabled={applying} icon={applying ? undefined : 'send'}>
              {applying ? 'Submitting…' : 'Apply now'}
            </Button>
          </div>
        </div>
      )}
    </MobileShell>
  );
};

export default MobileJobDetails;
