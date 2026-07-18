import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UniversityService, type PlacementDrive, type PlacementDriveInput } from '../../services';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';

interface PostCampusDriveProps { onCancel: () => void; onPublish: (drive: PlacementDrive) => void; editingDrive?: PlacementDrive | null; }
const toLocalInputValue = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const PostCampusDrive: React.FC<PostCampusDriveProps> = ({ onCancel, onPublish, editingDrive }) => {
  const { showToast } = useToast();
  const isEditing = !!editingDrive;
  const [title, setTitle] = useState(editingDrive?.title || '');
  const [description, setDescription] = useState(editingDrive?.description || '');
  const [location, setLocation] = useState(editingDrive?.location || '');
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(editingDrive?.scheduledAt));
  const [deadline, setDeadline] = useState(toLocalInputValue(editingDrive?.deadline));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 2) next.title = 'Title is required (min. 2 characters).';
    if (!description.trim() || description.trim().length < 10) next.description = 'Description must be at least 10 characters.';
    if (!location.trim()) next.location = 'Location is required.';
    if (!scheduledAt) next.scheduledAt = 'Drive date/time is required.';
    if (!deadline) next.deadline = 'Registration deadline is required.';
    if (scheduledAt && deadline && new Date(deadline).getTime() > new Date(scheduledAt).getTime()) next.deadline = 'Deadline must be on or before the drive date.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePublish = async () => {
    if (!validate()) { showToast('Please fix the highlighted fields.', 'error'); return; }
    setIsSaving(true);
    try {
      const payload: PlacementDriveInput = { title: title.trim(), description: description.trim(), location: location.trim(), scheduledAt: new Date(scheduledAt).toISOString(), deadline: new Date(deadline).toISOString() };
      const saved = isEditing && editingDrive ? await UniversityService.updateDrive(editingDrive.id, payload) : await UniversityService.createDrive(payload);
      onPublish(saved);
      showToast(isEditing ? 'Campus drive updated.' : 'Campus drive published and visible to eligible students.', 'success');
    } catch (err: any) { showToast(err?.message || 'Failed to save campus drive.', 'error'); }
    finally { setIsSaving(false); }
  };

  const fieldClass = (key: string) =>
    `w-full h-11 px-3.5 rounded-xl border bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 outline-none transition-all focus:ring-0 focus:shadow-focus-brand ${errors[key] ? 'border-error' : 'border-outline-variant/70 focus:border-primary/40'}`;
  const Err = ({ k }: { k: string }) => errors[k] ? <p className="text-error text-label-sm font-semibold mt-1">{errors[k]}</p> : null;
  const Label = ({ children }: { children: React.ReactNode }) => <span className="block text-label-md font-semibold text-on-surface mb-1">{children}</span>;

  return (
    <>
      <PageHeader
        title={isEditing ? 'Edit campus drive' : 'New campus drive'}
        breadcrumbs={[{ label: 'Campus drives', onClick: onCancel }, { label: isEditing ? 'Edit' : 'New' }]}
        description="Publish a drive to connect eligible students with a hiring employer."
        actions={<><Button variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button><Button variant="primary" onClick={handlePublish} isLoading={isSaving} leftIcon={<span className="material-symbols-outlined text-[19px]">send</span>}>{isEditing ? 'Save changes' : 'Publish drive'}</Button></>}
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader icon="work" title="Drive details" />
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2"><Label>Drive title</Label><input value={title} onChange={e => setTitle(e.target.value)} className={fieldClass('title')} placeholder="e.g. Google Cloud — Software Engineer Campus Hire" /><Err k="title" /></div>
              <div><Label>Location</Label><input value={location} onChange={e => setLocation(e.target.value)} className={fieldClass('location')} placeholder="Campus auditorium / Virtual / Office" /><Err k="location" /></div>
              <div className="hidden sm:block" />
              <div><Label>Drive date &amp; time</Label><input value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={fieldClass('scheduledAt')} type="datetime-local" /><Err k="scheduledAt" /></div>
              <div><Label>Registration deadline</Label><input value={deadline} onChange={e => setDeadline(e.target.value)} className={fieldClass('deadline')} type="datetime-local" /><Err k="deadline" /></div>
              <div className="sm:col-span-2"><Label>Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={7} className={`${fieldClass('description')} h-auto py-3 resize-none`} placeholder="Role details, eligibility criteria, package, recruitment process…" /><Err k="description" /><p className="text-label-sm text-on-surface-variant mt-1">Include eligibility, package and process — students see this in full.</p></div>
            </div>
          </Card>
        </div>
        <div className="xl:sticky xl:top-24">
          <Card>
            <CardHeader icon="summarize" title="Preview" />
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-surface-container"><p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Title</p><p className="text-body-md text-on-surface break-words mt-0.5">{title || 'Untitled drive'}</p></div>
              <div className="p-3 rounded-xl bg-surface-container"><p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Location</p><p className="text-body-md text-on-surface break-words mt-0.5">{location || '—'}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-surface-container"><p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Date</p><p className="text-label-md text-on-surface mt-0.5">{scheduledAt ? new Date(scheduledAt).toLocaleString() : '—'}</p></div>
                <div className="p-3 rounded-xl bg-surface-container"><p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Deadline</p><p className="text-label-md text-on-surface mt-0.5">{deadline ? new Date(deadline).toLocaleString() : '—'}</p></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PostCampusDrive;
