import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UniversityService, type UniversityStudent, type VerificationStatus } from '../../services';
import { PageHeader } from '../ui/PageHeader';
import { StatCard } from '../ui/StatCard';
import { Toolbar, FilterChip } from '../ui/Toolbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';

interface StudentManagementProps {
  onSelectStudent?: (id: string) => void;
  initialSearch?: string;
  verificationOnly?: boolean;
}

const STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pending', VERIFIED: 'Verified', PLACEMENT_ELIGIBLE: 'Placement eligible', PLACEMENT_COMPLETED: 'Placed', REJECTED: 'Rejected',
};
type BadgeTone = React.ComponentProps<typeof Badge>['tone'];
const STATUS_TONE: Record<VerificationStatus, BadgeTone> = {
  PENDING: 'neutral', VERIFIED: 'info', PLACEMENT_ELIGIBLE: 'warning', PLACEMENT_COMPLETED: 'success', REJECTED: 'error',
};
const initialsOf = (first?: string, last?: string) => `${(first || '?')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

export const StudentManagement: React.FC<StudentManagementProps> = ({ onSelectStudent, initialSearch, verificationOnly }) => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<UniversityStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>(verificationOnly ? 'PENDING' : 'All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setStudents(await UniversityService.getStudents()); }
    catch (err: any) { setError(err?.message || 'Failed to load students.'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (initialSearch !== undefined) setSearchTerm(initialSearch); }, [initialSearch]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.department?.name) set.add(s.department.name); });
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = students.filter(student => {
    const fullName = `${student.user.firstName} ${student.user.lastName}`.toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(q) || student.user.email.toLowerCase().includes(q) || (student.department?.name || '').toLowerCase().includes(q);
    const matchesDept = deptFilter === 'All' || student.department?.name === deptFilter;
    const matchesStatus = statusFilter === 'All' || student.verificationStatus === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const counts = useMemo(() => ({
    total: students.length,
    placed: students.filter(s => s.verificationStatus === 'PLACEMENT_COMPLETED').length,
    eligible: students.filter(s => s.verificationStatus === 'PLACEMENT_ELIGIBLE').length,
    pending: students.filter(s => s.verificationStatus === 'PENDING').length,
    verified: students.filter(s => s.verificationStatus === 'VERIFIED').length,
  }), [students]);

  const handleVerify = async (id: string, status: VerificationStatus) => {
    setUpdatingId(id);
    const previous = students;
    setStudents(prev => prev.map(s => s.id === id ? { ...s, verificationStatus: status } : s));
    try { await UniversityService.verifyStudent(id, status); showToast(`Status updated to "${STATUS_LABELS[status]}".`, 'success'); }
    catch (err: any) { setStudents(previous); showToast(err?.message || 'Failed to update status.', 'error'); }
    finally { setUpdatingId(null); }
  };

  const handleBulkVerify = async () => {
    if (selectedIds.length === 0) return;
    const ids = [...selectedIds]; setSelectedIds([]);
    let succeeded = 0;
    for (const id of ids) {
      try { await UniversityService.verifyStudent(id, 'VERIFIED'); succeeded++; setStudents(prev => prev.map(s => s.id === id ? { ...s, verificationStatus: 'VERIFIED' } : s)); } catch { /* keep going */ }
    }
    showToast(`Verified ${succeeded} of ${ids.length} selected students.`, succeeded === ids.length ? 'success' : 'error');
  };

  const toggleOne = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.includes(s.id));
  const toggleAll = () => setSelectedIds(allSelected ? [] : filteredStudents.map(s => s.id));

  const STATUS_KEYS: string[] = ['All', ...Object.keys(STATUS_LABELS)];

  return (
    <>
      <PageHeader
        title={verificationOnly ? 'Student verification' : 'Student management'}
        description={verificationOnly
          ? 'Verify students so they become visible to recruiters and eligible for campus drives. Students who register with your institutional email domain appear here automatically.'
          : 'Search, verify and track placement status for every student at your university.'}
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
          <StatCard label="Total" value={counts.total} icon="groups" hint="registered" onClick={() => setStatusFilter('All')} />
          <StatCard label="Pending" value={counts.pending} icon="pending" hint="to verify" onClick={() => setStatusFilter('PENDING')} />
          <StatCard label="Verified" value={counts.verified} icon="verified_user" hint="approved" onClick={() => setStatusFilter('VERIFIED')} />
          <StatCard label="Eligible" value={counts.eligible} icon="check_circle" hint="for placement" onClick={() => setStatusFilter('PLACEMENT_ELIGIBLE')} />
          <StatCard label="Placed" value={counts.placed} icon="workspace_premium" hint="secured offers" onClick={() => setStatusFilter('PLACEMENT_COMPLETED')} />
        </div>

        <div>
          <Toolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name, email or department…"
            filters={
              <>
                {STATUS_KEYS.map(s => (
                  <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s === 'All' ? 'All' : STATUS_LABELS[s as VerificationStatus]}</FilterChip>
                ))}
                {departments.length > 0 && (
                  <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} aria-label="Department"
                    className="h-10 px-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-label-md font-semibold text-on-surface focus:border-primary/40 focus:ring-0 outline-none cursor-pointer">
                    <option value="All">All departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
              </>
            }
            selectedCount={selectedIds.length}
            bulkActions={<><Button size="sm" variant="primary" onClick={handleBulkVerify} leftIcon={<span className="material-symbols-outlined text-[18px]">verified</span>}>Verify</Button><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button></>}
          />

          {isLoading ? (
            <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
          ) : error ? (
            <EmptyState icon="cloud_off" title="Couldn't load students" description={error} actionLabel="Retry" onAction={load} />
          ) : filteredStudents.length === 0 ? (
            <EmptyState icon="school"
              title={students.length === 0 ? 'No students registered yet' : 'No students match your filters'}
              description={students.length === 0 ? 'Students who register with your verified institutional email domain will appear here automatically.' : 'Try a different status, department or search.'}
              actionLabel={students.length === 0 ? undefined : 'Show all'}
              onAction={students.length === 0 ? undefined : () => { setStatusFilter('All'); setDeptFilter('All'); setSearchTerm(''); }} />
          ) : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left text-body-md">
                <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant border-b border-outline-variant/60">
                  <tr>
                    <th className="p-4 w-10"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" className="accent-primary" /></th>
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Department</th>
                    <th className="p-4 font-semibold text-center">GPA</th>
                    <th className="p-4 font-semibold">Grad year</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="border-t border-outline-variant/60 hover:bg-surface-container/50 transition-colors">
                      <td className="p-4"><input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleOne(student.id)} aria-label={`Select ${student.user.firstName}`} className="accent-primary" /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0 bg-primary-container text-on-primary-container">{initialsOf(student.user.firstName, student.user.lastName)}</span>
                          <div className="min-w-0">
                            <button onClick={() => onSelectStudent?.(student.id)} className="font-semibold text-on-surface hover:text-primary transition-colors text-left">{student.user.firstName} {student.user.lastName}</button>
                            <div className="text-label-sm text-on-surface-variant truncate">{student.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant">{student.department?.name || '—'}</td>
                      <td className="p-4 text-center font-semibold text-on-surface">{student.currentGpa != null ? student.currentGpa.toFixed(1) : '—'}</td>
                      <td className="p-4 text-on-surface-variant">{student.graduationYear || '—'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge tone={STATUS_TONE[student.verificationStatus]}>{STATUS_LABELS[student.verificationStatus]}</Badge>
                          <select value={student.verificationStatus} disabled={updatingId === student.id} onChange={e => handleVerify(student.id, e.target.value as VerificationStatus)}
                            aria-label="Change status" className="h-8 px-2 rounded-lg border border-outline-variant/70 bg-surface-container-lowest text-label-sm text-on-surface focus:border-primary/40 focus:ring-0 outline-none cursor-pointer disabled:opacity-50">
                            {(Object.keys(STATUS_LABELS) as VerificationStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentManagement;
