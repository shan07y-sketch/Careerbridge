import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Section } from '../../components/ui/Section';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar, ProgressRing } from '../../components/ui/Progress';
import { EmptyState } from '../../components/ui/EmptyState';
import { AttentionCard } from '../../components/ui/AttentionCard';
import { RowSkeleton } from '../../components/ui/Skeleton';
import { UploadModal } from '../../components/ui/UploadModal';
import { exportCareerReportPDF } from '../../utils/exportUtils';
import { ResumeService } from '../../services';
import type { ResumeVersion } from '../../services';

const formatBytes = (n: number | null): string => {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'resume' | 'certificate' | 'portfolio'>('resume');
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [showAllVersions, setShowAllVersions] = useState(false);

  const loadResumes = useCallback(async () => {
    try {
      setResumesLoading(true);
      const data = await ResumeService.getHistory();
      setResumes(data);
    } catch (err) {
      console.error('Failed to load resumes', err);
    } finally {
      setResumesLoading(false);
    }
  }, []);

  useEffect(() => { loadResumes(); }, [loadResumes]);

  const activeResume = resumes.find(r => r.isActive) || resumes[0];

  const completionChecks = [
    { label: 'Basic details', icon: 'badge', done: !!(user?.name && user?.university && user?.degree) },
    { label: 'Career goal', icon: 'flag', done: !!user?.careerGoal },
    { label: 'Skills added', icon: 'psychology', done: (user?.skills?.length ?? 0) > 0 },
    { label: 'Resume uploaded', icon: 'description', done: !!activeResume },
    { label: 'Portfolio or GitHub linked', icon: 'link', done: !!user?.portfolioUrl || !!user?.gitHubConnected },
    { label: 'Preferred location set', icon: 'location_on', done: !!user?.preferredLocation },
  ];
  const doneCount = completionChecks.filter(c => c.done).length;
  const completion = Math.round((doneCount / completionChecks.length) * 100);
  const missing = completionChecks.filter(c => !c.done);

  const verifications = [
    { label: 'Email', icon: 'mail', done: !!user?.emailVerified },
    { label: 'Phone', icon: 'phone', done: !!user?.phoneVerified },
    { label: 'LinkedIn', icon: 'work', done: !!user?.linkedInConnected },
    { label: 'GitHub', icon: 'code', done: !!user?.gitHubConnected },
  ];
  const verifiedCount = verifications.filter(v => v.done).length;

  const handleResumeUpload = async (file: File) => {
    await ResumeService.upload(file);
    await loadResumes();
  };

  const handleUploadSuccess = (fileName: string) => {
    if (uploadType === 'resume') showToast('Resume uploaded. Your previous version is kept in history.', 'success', fileName);
    else showToast(`${uploadType === 'certificate' ? 'Certificate' : 'Portfolio'} uploaded successfully.`, 'success', fileName);
    setIsUploadModalOpen(false);
  };

  const openUpload = (type: 'resume' | 'certificate' | 'portfolio') => { setUploadType(type); setIsUploadModalOpen(true); };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/student/profile?ref=${user?.id || ''}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast('Profile link copied to clipboard.', 'success', profileUrl);
    } catch {
      showToast('Profile link: ' + profileUrl, 'info');
    }
  };

  const handleDownload = async (resume: ResumeVersion) => {
    try { await ResumeService.download(resume.id, resume.fileName); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Download failed.', 'error'); }
  };

  const handleDelete = async (resume: ResumeVersion) => {
    try { await ResumeService.deleteResume(resume.id); showToast('Resume deleted.', 'success'); await loadResumes(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Delete failed.', 'error'); }
  };

  const handleShareResume = async (resume: ResumeVersion) => {
    try {
      if (resume.shareEnabled) {
        await ResumeService.revokeShareLink(resume.id);
        showToast('Share link revoked.', 'success');
      } else {
        const result = await ResumeService.createShareLink(resume.id);
        await navigator.clipboard.writeText(result.shareUrl).catch(() => {});
        showToast('Secure share link created and copied. Expires in 7 days.', 'success', result.shareUrl);
      }
      await loadResumes();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update the share link.', 'error');
    }
  };

  const initials = (user?.name || 'U').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const visibleResumes = showAllVersions ? resumes : resumes.slice(0, 3);

  const detail = (label: string, value?: React.ReactNode, icon?: string) => (
    <div className="flex items-start gap-3">
      {icon && <span className="material-symbols-outlined text-[20px] text-on-surface-variant mt-0.5">{icon}</span>}
      <div className="min-w-0">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">{label}</p>
        <p className="text-body-md text-on-surface mt-0.5 break-words">{value || <span className="text-on-surface-variant/70">Not set</span>}</p>
      </div>
    </div>
  );

  return (
    <PageLayout searchPlaceholder="Search…">
      <PageHeader
        title="My profile"
        description="How recruiters see you. Keep it complete and verified to stand out."
        actions={
          <>
            <Button variant="outline" onClick={handleShareProfile} leftIcon={<span className="material-symbols-outlined text-[19px]">share</span>}>Share</Button>
            <Button variant="outline" onClick={() => user && exportCareerReportPDF(user as any)} leftIcon={<span className="material-symbols-outlined text-[19px]">download</span>}>Career report</Button>
            <Button variant="primary" onClick={() => navigate('/student/settings')} leftIcon={<span className="material-symbols-outlined text-[19px]">edit</span>}>Edit profile</Button>
          </>
        }
      />

      <div className="space-y-8">
        <Card className="!p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {user?.profilePicture
              ? <img src={user.profilePicture} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              : <div className="w-20 h-20 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center text-headline-md font-semibold">{initials}</div>}
            <div className="min-w-0 flex-grow">
              <h2 className="text-headline-sm font-semibold text-on-surface">{user?.name || 'Your name'}</h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                {user?.careerGoal || 'Add a career goal'}{user?.university ? ` · ${user.university}` : ''}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {user?.emailVerified && <Badge tone="success" icon="verified">Email verified</Badge>}
                {user?.workMode && <Badge tone="neutral" icon="work">{user.workMode}</Badge>}
                {user?.preferredLocation && <Badge tone="neutral" icon="location_on">{user.preferredLocation}</Badge>}
              </div>
            </div>
            <div className="shrink-0"><ProgressRing value={completion} size={72} /></div>
          </div>
        </Card>

        {completion < 100 && (
          <AttentionCard icon="rocket_launch" tone="brand"
            title={`Your profile is ${completion}% complete`}
            description={`Finish ${missing.length} more ${missing.length === 1 ? 'item' : 'items'} — complete profiles get up to 3× more recruiter views.`}
            actionLabel="Complete profile" onAction={() => navigate('/student/settings')} />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Profile completion" value={`${completion}%`} icon="donut_large" hint={`${doneCount}/${completionChecks.length} done`} />
          <StatCard label="Career readiness" value={`${user?.readinessScore ?? 0}%`} icon="trending_up" hint="from report" onClick={() => navigate('/student/career-report')} />
          <StatCard label="Resume score" value={activeResume ? `${user?.resumeScore ?? 0}%` : '—'} icon="description" hint={activeResume ? (user?.resumeScoreEstimated ? 'estimated · AI unavailable' : 'active resume') : 'upload to score'} />
          <StatCard label="Verifications" value={`${verifiedCount}/4`} icon="verified" hint="build trust" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Section title="About" action={<Button size="sm" variant="ghost" onClick={() => navigate('/student/settings')}>Edit</Button>}>
              <Card>
                <div className="grid sm:grid-cols-2 gap-5">
                  {detail('University', user?.university, 'school')}
                  {detail('Degree', user?.degree, 'menu_book')}
                  {detail('Graduation year', user?.gradYear, 'calendar_month')}
                  {detail('Career goal', user?.careerGoal, 'flag')}
                  {detail('Work mode', user?.workMode, 'work')}
                  {detail('Preferred location', user?.preferredLocation, 'location_on')}
                  {detail('Email', user?.email, 'mail')}
                  {detail('Portfolio', user?.portfolioUrl
                    ? <a href={user.portfolioUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{user.portfolioUrl}</a>
                    : undefined, 'link')}
                </div>
              </Card>
            </Section>

            <Section title="Skills" description={user?.skills?.length ? `${user.skills.length} skills on your profile` : undefined}
              action={<Button size="sm" variant="ghost" onClick={() => navigate('/student/settings')}>Manage</Button>}>
              {user?.skills?.length ? (
                <Card>
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                    {user.skills.map(s => (
                      <div key={s.name}>
                        <div className="flex justify-between text-label-md mb-1.5">
                          <span className="font-semibold text-on-surface">{s.name}</span>
                          <span className="text-on-surface-variant">{s.level}%</span>
                        </div>
                        <ProgressBar value={s.level} />
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <EmptyState icon="psychology" title="No skills added yet"
                  description="Add the skills you want to be hired for so we can match you to the right roles and highlight gaps."
                  actionLabel="Add skills" onAction={() => navigate('/student/settings')} />
              )}
            </Section>

            <Section title="Documents" description="Resume versions are kept so you never lose an older copy."
              action={<Button size="sm" variant="primary" onClick={() => openUpload('resume')} leftIcon={<span className="material-symbols-outlined text-[18px]">upload_file</span>}>Upload resume</Button>}>
              {resumesLoading ? (
                <Card><RowSkeleton /><RowSkeleton /></Card>
              ) : resumes.length === 0 ? (
                <EmptyState icon="upload_file" title="No resume uploaded"
                  description="Upload your resume to unlock AI matching, an ATS score, and one-click applications."
                  actionLabel="Upload resume" onAction={() => openUpload('resume')} />
              ) : (
                <Card className="!p-0 overflow-hidden">
                  <ul className="divide-y divide-outline-variant/60">
                    {visibleResumes.map(r => (
                      <li key={r.id} className="flex items-center gap-4 p-4">
                        <span className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-on-surface-variant">description</span>
                        </span>
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="text-body-md font-medium text-on-surface truncate">{r.fileName}</p>
                            {r.isActive && <Badge tone="success">Active</Badge>}
                            {r.shareEnabled && <Badge tone="info" icon="link">Shared</Badge>}
                          </div>
                          <p className="text-label-sm text-on-surface-variant mt-0.5">
                            v{r.version} · {r.status.toLowerCase()}{r.fileSizeBytes ? ` · ${formatBytes(r.fileSizeBytes)}` : ''} · {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => handleDownload(r)} aria-label="Download"><span className="material-symbols-outlined text-[18px]">download</span></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleShareResume(r)} aria-label="Share">{r.shareEnabled ? <span className="material-symbols-outlined text-[18px]">link_off</span> : <span className="material-symbols-outlined text-[18px]">share</span>}</Button>
                          <Button size="sm" variant="ghost" className="!text-error" onClick={() => handleDelete(r)} aria-label="Delete"><span className="material-symbols-outlined text-[18px]">delete</span></Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {resumes.length > 3 && (
                    <button onClick={() => setShowAllVersions(v => !v)} className="w-full py-3 text-label-md font-semibold text-primary hover:bg-surface-container/50 transition-colors border-t border-outline-variant/60">
                      {showAllVersions ? 'Show fewer versions' : `Show all ${resumes.length} versions`}
                    </button>
                  )}
                </Card>
              )}
            </Section>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader icon="checklist" title="Complete your profile" subtitle={`${doneCount} of ${completionChecks.length} done`} />
              <ul className="space-y-2.5">
                {completionChecks.map(c => (
                  <li key={c.label} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${c.done ? 'bg-success-container text-on-success-container' : 'bg-surface-container text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-[15px]">{c.done ? 'check' : c.icon}</span>
                    </span>
                    <span className={`text-label-md ${c.done ? 'text-on-surface-variant line-through' : 'text-on-surface font-medium'}`}>{c.label}</span>
                  </li>
                ))}
              </ul>
              {completion < 100 && <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/settings')}>Finish setup</Button>}
            </Card>

            <Card>
              <CardHeader icon="verified_user" title="Verifications" subtitle={`${verifiedCount} of 4 verified`} />
              <ul className="space-y-2.5">
                {verifications.map(v => (
                  <li key={v.label} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3 text-label-md text-on-surface">
                      <span className="material-symbols-outlined text-[19px] text-on-surface-variant">{v.icon}</span>{v.label}
                    </span>
                    {v.done
                      ? <Badge tone="success" icon="check">Verified</Badge>
                      : <Button size="sm" variant="ghost" onClick={() => navigate('/student/settings')}>Verify</Button>}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader icon="upload" title="Add documents" subtitle="Certificates & portfolio" />
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="!justify-between" onClick={() => openUpload('certificate')}>Upload a certificate<span className="material-symbols-outlined text-[18px]">add</span></Button>
                <Button variant="ghost" className="!justify-between" onClick={() => openUpload('portfolio')}>Upload portfolio<span className="material-symbols-outlined text-[18px]">add</span></Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={uploadType === 'resume' ? 'Upload resume' : uploadType === 'certificate' ? 'Upload certificate' : 'Upload portfolio'}
        acceptedTypes={uploadType === 'resume' ? '.pdf,.doc,.docx' : uploadType === 'certificate' ? '.pdf,.jpg,.png' : '.pdf,.zip,.jpg,.png'}
        description={uploadType === 'resume' ? 'Upload your resume in PDF, DOC, or DOCX format. Max 5MB.' : uploadType === 'certificate' ? 'Upload your certificate or credential document.' : 'Upload your portfolio archive or preview image.'}
        onUploadSuccess={handleUploadSuccess}
        onUpload={uploadType === 'resume' ? handleResumeUpload : undefined}
      />
    </PageLayout>
  );
};

export default Profile;
