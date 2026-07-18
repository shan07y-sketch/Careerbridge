import React, { useCallback, useEffect, useState } from 'react';
import { AdminService, type AdminAnnouncement } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Section } from '../../../components/ui/Section';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/Skeleton';
import { Dialog } from '../../../components/ui/Dialog';

const inputClass = 'w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-0 outline-none transition-all';
type BadgeTone = React.ComponentProps<typeof Badge>['tone'];
const SEV_TONE: Record<string, BadgeTone> = { info: 'info', warning: 'warning', critical: 'error' };

export const AdminAnnouncementsView: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminAnnouncement | null>(null);

  const load = useCallback(() => { setLoading(true); setError(null); AdminService.getAnnouncements(false).then(setItems).catch(e => setError(e?.message || 'Failed to load announcements.')).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!title.trim() || !content.trim()) { showToast('Title and content are required.', 'info'); return; }
    setCreating(true);
    try { await AdminService.createAnnouncement({ title: title.trim(), content: content.trim(), severity }); showToast('Announcement published.', 'success'); setTitle(''); setContent(''); setSeverity('info'); load(); }
    catch (e: any) { showToast(e?.message || 'Failed to create announcement.', 'error'); }
    finally { setCreating(false); }
  };
  const toggleActive = async (a: AdminAnnouncement) => {
    try { await AdminService.setAnnouncementActive(a.id, !a.isActive); setItems(prev => prev.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x)); }
    catch (e: any) { showToast(e?.message || 'Failed to update.', 'error'); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await AdminService.deleteAnnouncement(deleteTarget.id); setItems(prev => prev.filter(x => x.id !== deleteTarget.id)); showToast('Announcement deleted.', 'success'); }
    catch (e: any) { showToast(e?.message || 'Failed to delete.', 'error'); }
    finally { setDeleteTarget(null); }
  };

  return (
    <>
      <PageHeader title="Announcements" description="Broadcast platform-wide notices. Active announcements are shown to all users." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <Section title="Published announcements">
            {loading ? (
              <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
            ) : error ? (
              <EmptyState icon="cloud_off" title="Couldn't load announcements" description={error} actionLabel="Retry" onAction={load} />
            ) : items.length === 0 ? (
              <EmptyState icon="campaign" title="No announcements yet" description="Create one to broadcast a notice to everyone on the platform." />
            ) : (
              <div className="space-y-3">
                {items.map(a => (
                  <Card key={a.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><p className="text-body-md font-semibold text-on-surface truncate">{a.title}</p><Badge tone={SEV_TONE[a.severity] || 'neutral'}>{a.severity}</Badge>{a.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}</div>
                        <p className="text-label-md text-on-surface-variant mt-1">{a.content}</p>
                        <p className="text-label-sm text-on-surface-variant/80 mt-2">{new Date(a.createdAt).toLocaleDateString()}{a.creator ? ` · ${a.creator.email}` : ''}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(a)}>{a.isActive ? 'Deactivate' : 'Activate'}</Button>
                        <Button size="sm" variant="ghost" className="!text-error" onClick={() => setDeleteTarget(a)}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </div>
        <div>
          <Card>
            <CardHeader icon="add_alert" title="New announcement" />
            <div className="space-y-3">
              <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
              <textarea className={`${inputClass} h-auto py-3 resize-none`} rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="Content" />
              <select className={inputClass} value={severity} onChange={e => setSeverity(e.target.value as any)}>
                <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
              </select>
              <Button variant="primary" className="w-full" onClick={create} isLoading={creating} leftIcon={<span className="material-symbols-outlined text-[19px]">campaign</span>}>Publish</Button>
            </div>
          </Card>
        </div>
      </div>
      <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete this announcement?" description={deleteTarget ? `"${deleteTarget.title}" will be removed for everyone.` : ''} confirmLabel="Delete" confirmVariant="error" onConfirm={confirmDelete} />
    </>
  );
};

export default AdminAnnouncementsView;
