/**
 * Mobile Profile — identity, skills and full resume workflow
 * (upload, versions, ATS score, download, share link).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { ResumeService, ProfileService } from '../../../services';
import type { ResumeVersion } from '../../../services';
import type { Student } from '../../../types';
import { MobileShell, Card, Chip, SectionTitle, SkeletonList, Button, Progress, Avatar } from '../../components';

const fmtSize = (bytes: number | null): string =>
  bytes == null ? '' : bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

const MobileProfile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Student | null>(null);
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const [p, r] = await Promise.allSettled([ProfileService.getStudentProfile(), ResumeService.getHistory()]);
    if (p.status === 'fulfilled') setProfile(p.value);
    if (r.status === 'fulfilled') setResumes(r.value);
    setLoading(false);
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

  const shareLink = async (r: ResumeVersion) => {
    try {
      const { shareUrl } = await ResumeService.createShareLink(r.id);
      await navigator.clipboard.writeText(shareUrl);
      showToast('Share link copied to clipboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create link', 'error');
    }
  };

  const displayed = profile ?? user;
  const activeResume = resumes.find(r => r.isActive) ?? resumes[0];
  const atsScore = activeResume?.resumeAnalyses?.[0]?.score ?? displayed?.resumeScore ?? 0;

  if (loading) {
    return <MobileShell title="Profile"><SkeletonList count={4} /></MobileShell>;
  }

  return (
    <MobileShell title="Profile" subtitle={displayed?.email}>
      <div className="px-4 pt-4 space-y-2.5">
        {/* Identity */}
        <Card>
          <div className="flex items-center gap-4">
            <Avatar src={displayed?.profilePicture} name={displayed?.name || 'Student'} size={56} />
            <div className="min-w-0">
              <p className="text-base font-bold">{displayed?.name || 'Complete your profile'}</p>
              <p className="text-xs text-on-surface-variant">{displayed?.degree}{displayed?.gradYear ? ` · Class of ${displayed.gradYear}` : ''}</p>
              <p className="text-xs text-on-surface-variant truncate">{displayed?.university}</p>
            </div>
          </div>
          {displayed?.careerGoal && (
            <p className="text-sm mt-3 text-on-surface-variant">
              <span className="font-semibold text-on-surface">Goal:</span> {displayed.careerGoal}
            </p>
          )}
        </Card>

        {/* Skills */}
        {displayed && displayed.skills.length > 0 && (
          <>
            <SectionTitle>Skills</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {displayed.skills.map(s => <Chip key={s.name}>{s.name}</Chip>)}
            </div>
          </>
        )}

        {/* Resume score */}
        <SectionTitle>Resume</SectionTitle>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold">ATS score</p>
            <p className="text-sm font-extrabold text-primary">{atsScore ? `${Math.round(atsScore)}/100` : '—'}</p>
          </div>
          <Progress value={atsScore} tone={atsScore >= 70 ? 'success' : atsScore >= 45 ? 'warning' : 'error'} />
          {profile?.resumeScoreEstimated && (
            <p className="text-[11px] text-on-surface-variant mt-2">Estimated — AI analysis unavailable</p>
          )}
        </Card>

        {/* Upload */}
        <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" onChange={onUpload} className="hidden" aria-hidden="true" />
        <Button full variant="tonal" icon="upload_file" disabled={uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? 'Uploading…' : 'Upload new resume'}
        </Button>

        {/* Versions */}
        {resumes.length > 0 && (
          <>
            <SectionTitle>Versions</SectionTitle>
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
                        {r.isActive ? ' · Active' : ''}
                      </p>
                    </div>
                    <button onClick={() => download(r)} aria-label={`Download ${r.fileName}`} className="m-press w-9 h-9 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">download</span>
                    </button>
                    <button onClick={() => shareLink(r)} aria-label={`Share ${r.fileName}`} className="m-press w-9 h-9 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">link</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </MobileShell>
  );
};

export default MobileProfile;
