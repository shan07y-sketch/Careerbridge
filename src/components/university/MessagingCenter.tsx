import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UniversityService, type UniversityStudent, type SentBroadcast } from '../../services';
import { PageHeader } from '../ui/PageHeader';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

const inputClass = 'w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-0 outline-none transition-all';

export const MessagingCenter: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<UniversityStudent[]>([]);
  const [sentBroadcasts, setSentBroadcasts] = useState<SentBroadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const [s, b] = await Promise.all([UniversityService.getStudents(), UniversityService.getSentBroadcasts()]);
      setStudents(s); setSentBroadcasts(b);
    } catch (err: any) { setError(err?.message || 'Failed to load messaging data.'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.department?.name) set.add(s.department.name); });
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = students.filter(s => {
    const fullName = `${s.user.firstName} ${s.user.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || s.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || s.department?.name === deptFilter;
    return matchesSearch && matchesDept;
  });

  const toggleSelect = (userId: string) => setSelectedIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  const selectAllFiltered = () => setSelectedIds(filteredStudents.map(s => s.user.id));

  const handleSend = async () => {
    if (selectedIds.length === 0) { showToast('Select at least one recipient.', 'info'); return; }
    if (!subject.trim() || !body.trim()) { showToast('Subject and message are required.', 'info'); return; }
    setIsSending(true);
    try {
      const result = await UniversityService.sendBroadcast(selectedIds, subject.trim(), body.trim());
      showToast(`Message sent to ${result.recipientCount} student${result.recipientCount === 1 ? '' : 's'}.`, 'success');
      setSubject(''); setBody(''); setSelectedIds([]);
      setSentBroadcasts(await UniversityService.getSentBroadcasts());
    } catch (err: any) { showToast(err?.message || 'Failed to send message.', 'error'); }
    finally { setIsSending(false); }
  };

  return (
    <>
      <PageHeader title="Messaging" description="Send announcements to students. Every message is delivered as a real notification." />
      {error ? (
        <EmptyState icon="cloud_off" title="Couldn't load messaging" description={error} actionLabel="Retry" onAction={load} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          <div className="xl:col-span-2 space-y-8">
            <Section title="Recipients" description={`${selectedIds.length} selected`}>
              <Card>
                <div className="flex flex-wrap gap-2 mb-4">
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search students…" className={`${inputClass} flex-grow min-w-[200px]`} />
                  <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-label-md font-semibold text-on-surface focus:border-primary/40 focus:ring-0 outline-none cursor-pointer">
                    <option value="All">All departments</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Button variant="outline" onClick={selectAllFiltered}>Select all ({filteredStudents.length})</Button>
                </div>
                {isLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-surface-container rounded-lg animate-pulse" />)}</div>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-label-md text-on-surface-variant">No students match this filter.</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto border border-outline-variant/60 rounded-xl divide-y divide-outline-variant/60">
                    {filteredStudents.map(s => (
                      <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container cursor-pointer">
                        <input type="checkbox" checked={selectedIds.includes(s.user.id)} onChange={() => toggleSelect(s.user.id)} className="accent-primary" />
                        <span className="text-label-md font-semibold text-on-surface">{s.user.firstName} {s.user.lastName}</span>
                        <span className="text-label-sm text-on-surface-variant ml-auto">{s.department?.name || '—'}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Card>
            </Section>

            <Section title="Compose">
              <Card>
                <div className="space-y-3">
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className={inputClass} />
                  <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Message content…" className={`${inputClass} h-auto py-3 resize-none`} />
                  <div className="flex justify-end"><Button variant="primary" onClick={handleSend} isLoading={isSending} leftIcon={<span className="material-symbols-outlined text-[19px]">send</span>}>Send to {selectedIds.length} student{selectedIds.length === 1 ? '' : 's'}</Button></div>
                </div>
              </Card>
            </Section>
          </div>

          <div>
            <Section title="Sent messages">
              {isLoading ? (
                <Card><div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />)}</div></Card>
              ) : sentBroadcasts.length === 0 ? (
                <Card><p className="text-label-md text-on-surface-variant">No messages sent yet.</p></Card>
              ) : (
                <div className="space-y-3">
                  {sentBroadcasts.map((b, i) => (
                    <Card key={i} className="!p-4">
                      <div className="flex justify-between items-start gap-2"><p className="text-body-md font-semibold text-on-surface">{b.title}</p><Badge tone="neutral">{b.recipientCount}</Badge></div>
                      <p className="text-label-md text-on-surface-variant mt-1 line-clamp-2">{b.content}</p>
                      <p className="text-label-sm text-on-surface-variant/80 mt-2">{new Date(b.sentAt).toLocaleString()}</p>
                    </Card>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagingCenter;
