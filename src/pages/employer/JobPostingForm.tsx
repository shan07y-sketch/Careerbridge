import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { EmployerJobService } from '../../services';
import type { JobCategory, JobPostingInput, JobStatus } from '../../services';

interface JobRecord {
  id: string; title: string; description: string; requirements: string; benefits?: string | null;
  location: string; jobType: string; workMode: string; categoryId?: string;
  salaryMin?: number | null; salaryMax?: number | null; currency?: string; deadline?: string | null;
  status?: JobStatus; skillsRequired?: { skill: { id: string; name: string } }[];
}
interface JobPostingFormProps { isOpen: boolean; onClose: () => void; onSaved: () => void; job?: JobRecord | null; }

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'TEMPORARY'];
const WORK_MODES = ['ON_SITE', 'HYBRID', 'REMOTE'];
const STATUSES: JobStatus[] = ['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED'];
const STATUS_LABELS: Record<JobStatus, string> = { DRAFT: 'Draft', PUBLISHED: 'Published', PAUSED: 'Paused', CLOSED: 'Closed', ARCHIVED: 'Archived' };
const AUTOSAVE_DEBOUNCE_MS = 2000;

const emptyForm = { title: '', description: '', requirements: '', benefits: '', location: '', jobType: 'FULL_TIME', workMode: 'ON_SITE', categoryId: '', salaryMin: '', salaryMax: '', currency: 'USD', deadline: '', status: 'DRAFT' as JobStatus };

const SectionLabel: React.FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center gap-2 pt-2">
    <span className="material-symbols-outlined text-[19px] text-primary">{icon}</span>
    <h4 className="text-label-md font-semibold text-on-surface">{children}</h4>
  </div>
);
const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-label-sm font-semibold text-on-surface-variant mb-1">{children}</label>
);

export const JobPostingForm: React.FC<JobPostingFormProps> = ({ isOpen, onClose, onSaved, job }) => {
  const isEdit = !!job;
  const [form, setForm] = useState({ ...emptyForm });
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autosaveTimer = useRef<number | null>(null);
  const isHydrating = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({}); setSubmitError(null); setAutosaveState('idle'); setLoadingCategories(true);
    EmployerJobService.getJobCategories().then(setCategories).catch(() => setCategories([])).finally(() => setLoadingCategories(false));
    isHydrating.current = true;
    if (job) {
      setForm({
        title: job.title || '', description: job.description || '', requirements: job.requirements || '', benefits: job.benefits || '',
        location: job.location || '', jobType: job.jobType || 'FULL_TIME', workMode: job.workMode || 'ON_SITE', categoryId: job.categoryId || '',
        salaryMin: job.salaryMin != null ? String(job.salaryMin) : '', salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
        currency: job.currency || 'USD', deadline: job.deadline ? job.deadline.slice(0, 10) : '', status: job.status || 'DRAFT',
      });
    } else setForm({ ...emptyForm });
    window.setTimeout(() => { isHydrating.current = false; }, 0);
  }, [isOpen, job]);

  useEffect(() => {
    if (!isOpen || !isEdit || !job || isHydrating.current) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(async () => {
      setAutosaveState('saving');
      try {
        await EmployerJobService.autosaveJob(job.id, {
          title: form.title || undefined, description: form.description || undefined, requirements: form.requirements || undefined,
          benefits: form.benefits || undefined, location: form.location || undefined, jobType: form.jobType, workMode: form.workMode,
          categoryId: form.categoryId || undefined, salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null, currency: form.currency || 'USD', deadline: form.deadline || null,
        });
        setAutosaveState('saved');
      } catch { setAutosaveState('error'); }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isOpen, isEdit, job]);

  const setField = (field: string, value: string) => { setForm(prev => ({ ...prev, [field]: value })); setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev)); };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim() || form.title.trim().length < 2) next.title = 'Job title is required.';
    if (!form.description.trim() || form.description.trim().length < 10) next.description = 'Description must be at least 10 characters.';
    if (!form.requirements.trim() || form.requirements.trim().length < 10) next.requirements = 'Requirements must be at least 10 characters.';
    if (!form.location.trim()) next.location = 'Location is required.';
    if (!form.categoryId) next.categoryId = 'Please select a job category.';
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) next.salaryMin = 'Minimum salary cannot be greater than maximum salary.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true); setSubmitError(null);
    try {
      const payload: JobPostingInput = {
        title: form.title.trim(), description: form.description.trim(), requirements: form.requirements.trim(),
        benefits: form.benefits.trim() || undefined, location: form.location.trim(), jobType: form.jobType, workMode: form.workMode,
        categoryId: form.categoryId, salaryMin: form.salaryMin ? Number(form.salaryMin) : null, salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        currency: form.currency || 'USD', deadline: form.deadline || null, status: form.status,
      };
      if (isEdit && job) await EmployerJobService.updateJob(job.id, payload);
      else await EmployerJobService.createJob(payload);
      onSaved(); onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not save this job posting. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  const inputClass = (field: string) =>
    `w-full h-11 px-3.5 rounded-xl border bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-0 focus:shadow-focus-brand transition-all ${errors[field] ? 'border-error' : 'border-outline-variant/70 focus:border-primary/40'}`;
  const areaClass = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-0 focus:shadow-focus-brand transition-all ${errors[field] ? 'border-error' : 'border-outline-variant/70 focus:border-primary/40'}`;
  const FieldError = ({ field }: { field: string }) => errors[field] ? (
    <p role="alert" className="text-error text-label-sm font-semibold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors[field]}</p>
  ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit job posting' : 'Post a new job'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 text-left" noValidate>
        {submitError && (
          <div role="alert" className="bg-error-container/40 border border-error/30 text-error text-body-md font-semibold rounded-xl px-4 py-3 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">warning</span>{submitError}</div>
        )}

        <SectionLabel icon="badge">Basics</SectionLabel>
        <div>
          <Label htmlFor="job-title">Job title *</Label>
          <input id="job-title" autoFocus className={inputClass('title')} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
          <FieldError field="title" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label htmlFor="job-type">Job type *</Label><select id="job-type" className={inputClass('jobType')} value={form.jobType} onChange={e => setField('jobType', e.target.value)}>{JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
          <div><Label htmlFor="work-mode">Work mode *</Label><select id="work-mode" className={inputClass('workMode')} value={form.workMode} onChange={e => setField('workMode', e.target.value)}>{WORK_MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label htmlFor="job-location">Location *</Label><input id="job-location" className={inputClass('location')} value={form.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. Remote, San Francisco CA" /><FieldError field="location" /></div>
          <div><Label htmlFor="job-category">Category *</Label><select id="job-category" className={inputClass('categoryId')} value={form.categoryId} onChange={e => setField('categoryId', e.target.value)} disabled={loadingCategories}><option value="">{loadingCategories ? 'Loading categories…' : 'Select a category'}</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><FieldError field="categoryId" /></div>
        </div>

        <div className="border-t border-outline-variant/60 pt-1" />
        <SectionLabel icon="description">Description & requirements</SectionLabel>
        <div><Label htmlFor="job-description">Description *</Label><textarea id="job-description" rows={4} className={areaClass('description')} value={form.description} onChange={e => setField('description', e.target.value)} /><FieldError field="description" /></div>
        <div><Label htmlFor="job-requirements">Requirements *</Label><textarea id="job-requirements" rows={3} className={areaClass('requirements')} value={form.requirements} onChange={e => setField('requirements', e.target.value)} /><FieldError field="requirements" /></div>
        <div><Label htmlFor="job-benefits">Benefits</Label><textarea id="job-benefits" rows={2} className={areaClass('benefits')} value={form.benefits} onChange={e => setField('benefits', e.target.value)} /></div>

        <div className="border-t border-outline-variant/60 pt-1" />
        <SectionLabel icon="payments">Compensation</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><Label htmlFor="salary-min">Salary min</Label><input id="salary-min" type="number" min={0} className={inputClass('salaryMin')} value={form.salaryMin} onChange={e => setField('salaryMin', e.target.value)} /></div>
          <div><Label htmlFor="salary-max">Salary max</Label><input id="salary-max" type="number" min={0} className={inputClass('salaryMax')} value={form.salaryMax} onChange={e => setField('salaryMax', e.target.value)} /></div>
          <div><Label htmlFor="currency">Currency</Label><input id="currency" maxLength={3} className={inputClass('currency')} value={form.currency} onChange={e => setField('currency', e.target.value.toUpperCase())} /></div>
          <div><Label htmlFor="deadline">Deadline</Label><input id="deadline" type="date" className={inputClass('deadline')} value={form.deadline} onChange={e => setField('deadline', e.target.value)} /></div>
        </div>
        <FieldError field="salaryMin" />

        <div className="border-t border-outline-variant/60 pt-1" />
        <SectionLabel icon="publish">Publishing</SectionLabel>
        <div><Label htmlFor="job-status">Status</Label><select id="job-status" className={inputClass('status')} value={form.status} onChange={e => setField('status', e.target.value)}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/60">
          <div className="text-label-sm font-semibold text-on-surface-variant min-h-[1rem]" aria-live="polite">
            {isEdit && autosaveState === 'saving' && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> Saving…</span>}
            {isEdit && autosaveState === 'saved' && <span className="flex items-center gap-1 text-success"><span className="material-symbols-outlined text-[14px]">check_circle</span> Draft saved</span>}
            {isEdit && autosaveState === 'error' && <span className="flex items-center gap-1 text-error"><span className="material-symbols-outlined text-[14px]">error</span> Autosave failed — save manually</span>}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>{isEdit ? 'Save changes' : 'Post job'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default JobPostingForm;
