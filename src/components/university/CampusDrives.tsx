import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UniversityService, type PlacementDrive } from '../../services';
import type { DriveRecommendationResult } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { StatCard } from '../ui/StatCard';
import { Section } from '../ui/Section';
import { Toolbar, FilterChip } from '../ui/Toolbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';
import { Dialog } from '../ui/Dialog';

interface CampusDrivesProps { onCreateDrive?: () => void; onEditDrive?: (drive: PlacementDrive) => void; }
const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' });
type BadgeTone = React.ComponentProps<typeof Badge>['tone'];
const deriveStatus = (d: PlacementDrive): { label: string; tone: BadgeTone } => {
  const now = Date.now();
  if (new Date(d.scheduledAt).getTime() < now) return { label: 'Completed', tone: 'neutral' };
  if (new Date(d.deadline).getTime() < now) return { label: 'Registration closed', tone: 'warning' };
  return { label: 'Registration open', tone: 'success' };
};

export const CampusDrives: React.FC<CampusDrivesProps> = ({ onCreateDrive, onEditDrive }) => {
  const { showToast } = useToast();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlacementDrive | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [recommendations, setRecommendations] = useState<DriveRecommendationResult | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);

  const loadDrives = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setDrives(await UniversityService.getDrives()); }
    catch (err: any) { setError(err?.message || 'Failed to load campus drives.'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { loadDrives(); }, [loadDrives]);

  const handleRecommend = async () => {
    setIsRecommending(true);
    try { setRecommendations(await UniversityService.recommendCampusDrives()); }
    catch (err: any) { showToast(err?.message || 'Failed to generate recommendations.', 'error'); }
    finally { setIsRecommending(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await UniversityService.deleteDrive(deleteTarget.id);
      setDrives(prev => prev.filter(d => d.id !== deleteTarget.id));
      showToast('Campus drive deleted.', 'success');
    } catch (err: any) { showToast(err?.message || 'Failed to delete drive.', 'error'); }
    finally { setDeletingId(null); setDeleteTarget(null); }
  };

  const now = Date.now();
  const upcomingCount = drives.filter(d => new Date(d.scheduledAt).getTime() >= now && !d.isDeleted).length;
  const openCount = drives.filter(d => new Date(d.deadline).getTime() >= now && !d.isDeleted).length;

  const filtered = drives.filter(d => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = d.title.toLowerCase().includes(q) || d.location.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || deriveStatus(d).label === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const STATUSES = ['All', 'Registration open', 'Registration closed', 'Completed'];

  return (
    <>
      <PageHeader
        title="Campus drives"
        description="Schedule recruitment drives that connect your eligible students with hiring employers and recruiters."
        actions={<Button variant="primary" onClick={() => onCreateDrive?.()} leftIcon={<span className="material-symbols-outlined text-[19px]">add</span>}>Create drive</Button>}
      />
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="Total drives" value={isLoading ? '—' : drives.length} icon="event_available" hint="all time" />
          <StatCard label="Upcoming" value={isLoading ? '—' : upcomingCount} icon="upcoming" hint="scheduled ahead" />
          <StatCard label="Open for registration" value={isLoading ? '—' : openCount} icon="how_to_reg" hint="students can join" />
        </div>

        <Section title="AI drive recommendations" description="Suggested drive types from your students' real skill mix and platform hiring trends"
          action={<Button size="sm" variant="outline" onClick={handleRecommend} disabled={isRecommending} leftIcon={<span className="material-symbols-outlined text-[18px]">auto_awesome</span>}>{isRecommending ? 'Generating…' : recommendations ? 'Regenerate' : 'Generate'}</Button>}>
          <Card>
            {!recommendations ? (
              <p className="text-label-md text-on-surface-variant">Generate AI-recommended drive types based on your student body's real skill distribution and live hiring demand.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-body-md text-on-surface-variant">{recommendations.summary}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.recommendedDrives.map((d, i) => (
                    <div key={i} className="rounded-xl border border-outline-variant/60 p-4">
                      <div className="flex items-center justify-between mb-1.5"><p className="font-semibold text-on-surface">{d.targetRole}</p><Badge tone={d.priority === 'High' ? 'error' : d.priority === 'Medium' ? 'warning' : 'neutral'}>{d.priority}</Badge></div>
                      <p className="text-label-md text-on-surface-variant">{d.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Section>

        <div>
          <Toolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by title, location or description…"
            filters={STATUSES.map(s => <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s}</FilterChip>)}
          />
          {isLoading ? (
            <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
          ) : error ? (
            <EmptyState icon="cloud_off" title="Couldn't load drives" description={error} actionLabel="Retry" onAction={loadDrives} />
          ) : filtered.length === 0 ? (
            <EmptyState icon="event_busy"
              title={drives.length === 0 ? 'No campus drives yet' : 'No drives match your filters'}
              description={drives.length === 0 ? 'Create your first drive to bring employers on campus and connect them with eligible students.' : 'Try a different status or search.'}
              actionLabel={drives.length === 0 ? 'Create a drive' : 'Show all'}
              onAction={drives.length === 0 ? () => onCreateDrive?.() : () => { setStatusFilter('All'); setSearchTerm(''); }} />
          ) : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left text-body-md">
                <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant border-b border-outline-variant/60">
                  <tr><th className="px-5 py-3 font-semibold">Drive</th><th className="px-5 py-3 font-semibold">Location</th><th className="px-5 py-3 font-semibold">Timeline</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(drive => {
                    const status = deriveStatus(drive);
                    return (
                      <tr key={drive.id} className="border-t border-outline-variant/60 hover:bg-surface-container/50 transition-colors">
                        <td className="px-5 py-4"><p className="font-semibold text-on-surface">{drive.title}</p><p className="text-label-sm text-on-surface-variant line-clamp-2 max-w-md">{drive.description}</p></td>
                        <td className="px-5 py-4 text-on-surface-variant">{drive.location}</td>
                        <td className="px-5 py-4"><p className="text-on-surface">{fmt(drive.scheduledAt)}</p><p className="text-label-sm text-on-surface-variant">Deadline {fmt(drive.deadline)}</p></td>
                        <td className="px-5 py-4"><Badge tone={status.tone}>{status.label}</Badge></td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => onEditDrive?.(drive)} className="p-2 rounded-lg hover:bg-surface-container" aria-label={`Edit ${drive.title}`}><span className="material-symbols-outlined text-on-surface-variant text-[20px]">edit</span></button>
                            <button onClick={() => setDeleteTarget(drive)} disabled={deletingId === drive.id} className="p-2 rounded-lg hover:bg-error-container/40 disabled:opacity-50" aria-label={`Delete ${drive.title}`}><span className="material-symbols-outlined text-error text-[20px]">delete</span></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>

      <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete this campus drive?"
        description={deleteTarget ? `"${deleteTarget.title}" will be removed. This cannot be undone.` : ''}
        confirmLabel="Delete" confirmVariant="error" isLoading={!!deletingId} onConfirm={confirmDelete} />
    </>
  );
};

export default CampusDrives;
