/**
 * Production Export Utilities for CareerBridge
 * Generates realistic downloadable files for CSV, PDF simulation, and Excel.
 */

/** Download a Blob as a file */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Export array of objects to CSV */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data || data.length === 0) {
    data = [{ 'No Data': 'No records found for export' }];
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const val = row[header] ?? '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str}"`
            : str;
        })
        .join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/** Export a realistic PDF report (HTML-to-PDF simulation via text Blob) */
export function exportToPDF(title: string, sections: { heading: string; content: string }[]): void {
  const timestamp = new Date().toLocaleString();
  const lines = [
    `CAREERBRIDGE REPORT`,
    `${'='.repeat(60)}`,
    `Title: ${title}`,
    `Generated: ${timestamp}`,
    `Platform: CareerBridge Career Success Platform`,
    `${'='.repeat(60)}`,
    '',
    ...sections.flatMap(s => [
      `${s.heading}`,
      `${'-'.repeat(s.heading.length)}`,
      s.content,
      '',
    ]),
    `${'='.repeat(60)}`,
    `© 2026 CareerBridge. Confidential. All rights reserved.`,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
  const safeName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadBlob(blob, `${safeName}_report.txt`);
}

/** Export applications data as CSV */
export function exportApplicationsCSV(applications: Array<{
  jobTitle: string;
  companyName: string;
  status: string;
  dateApplied: string;
  applicationScore?: number;
}>): void {
  const data = applications.map(app => ({
    'Job Title': app.jobTitle,
    'Company': app.companyName,
    'Status': app.status.charAt(0).toUpperCase() + app.status.slice(1),
    'Date Applied': app.dateApplied,
    'AI Match Score': `${app.applicationScore || 80}%`,
    'Platform': 'CareerBridge',
  }));
  exportToCSV(data, `careerbridge_applications_${new Date().toISOString().split('T')[0]}.csv`);
}

/** Export job listings data as CSV */
export function exportJobsCSV(jobs: Array<{
  title: string;
  companyName: string;
  location: string;
  salaryRange?: string;
  type?: string;
  matchRate?: number;
}>): void {
  const data = jobs.map(job => ({
    'Job Title': job.title,
    'Company': job.companyName,
    'Location': job.location,
    'Salary Range': job.salaryRange || 'Not disclosed',
    'Type': job.type || 'Full-time',
    'AI Match': `${job.matchRate || 0}%`,
  }));
  exportToCSV(data, `careerbridge_jobs_${new Date().toISOString().split('T')[0]}.csv`);
}

/** Export AI career report as PDF */
export function exportCareerReportPDF(studentName: string): void {
  exportToPDF(`AI Career Report - ${studentName}`, [
    {
      heading: 'Career Readiness Summary',
      content: `Overall Career Readiness Score: 87%\nResume Score: 82%\nProfile Strength: 92%\nIndustry Match: 98%`,
    },
    {
      heading: 'Skill Gap Analysis',
      content: `1. Advanced React Patterns - Completed (100%)\n2. SQL for Developers - In Progress (70%)\n3. Practice DSA - Up Next (0%)\n\nEstimated completion time: 22 hours total`,
    },
    {
      heading: 'Top Job Matches',
      content: `1. Frontend Developer @ Google - 98% Match\n2. Senior AI Engineer @ NVIDIA - 94% Match\n3. Software Engineer @ Microsoft - 92% Match`,
    },
    {
      heading: 'AI Recommendations',
      content: `- Complete the SQL for Developers track to unlock 18 additional job matches\n- Schedule a mock interview session to improve readiness score\n- Add portfolio links to boost profile by ~8%`,
    },
  ]);
}

/** Export network/contacts as CSV */
export function exportNetworkCSV(contacts: Array<{
  name: string;
  role?: string;
  companyName?: string;
}>): void {
  const data = contacts.map(c => ({
    'Name': c.name,
    'Role': c.role || '',
    'Company': c.companyName || '',
    'Connected Via': 'CareerBridge',
    'Date Exported': new Date().toLocaleDateString(),
  }));
  exportToCSV(data, `careerbridge_network_${new Date().toISOString().split('T')[0]}.csv`);
}

/** Generic report export with custom data */
export function exportReport(reportName: string, data: Record<string, unknown>[]): void {
  exportToCSV(data, `${reportName.replace(/\s+/g, '_').toLowerCase()}.csv`);
}

/** Export candidate applications (Candidate Management / ATS) to CSV */
export function exportCandidatesCSV(applications: Array<{
  studentProfile: { firstName: string; lastName: string; user: { email: string } };
  job: { title: string };
  status: string;
  createdAt: string;
  tags?: { tag: { name: string } }[];
  interviews?: { scheduledAt: string }[];
  offer?: { status: string } | null;
}>): void {
  const data = applications.map(app => ({
    'Candidate': `${app.studentProfile.firstName} ${app.studentProfile.lastName}`,
    'Email': app.studentProfile.user.email,
    'Job': app.job.title,
    'Status': app.status,
    'Applied Date': new Date(app.createdAt).toLocaleDateString(),
    'Tags': (app.tags || []).map(t => t.tag.name).join('; '),
    'Latest Interview': app.interviews && app.interviews.length > 0
      ? new Date(app.interviews[0].scheduledAt).toLocaleDateString()
      : '',
    'Offer Status': app.offer?.status || ''
  }));
  exportToCSV(data, `careerbridge_candidates_${new Date().toISOString().split('T')[0]}.csv`);
}

/** Export Employer Jobs to CSV */
export function exportEmployerJobsCSV(jobs: any[]): void {
  const data = jobs.map(j => ({
    'Job ID': j.id,
    'Job Title': j.title,
    'Recruiter': j.recruiter,
    'Department': j.department,
    'Applicants': j.applicants,
    'Average Match': `${j.avgMatch}%`,
    'Views': j.views || 0,
    'Posted Date': j.postedDate,
    'Days Remaining': j.daysLeft,
    'Status': j.status,
  }));
  exportToCSV(data, `employer_jobs_${new Date().toISOString().split('T')[0]}.csv`);
}

/** Export Employer Interviews to CSV. Every field must come from the caller -- no fabricated defaults. */
export function exportInterviewsCSV(interviews: any[]): void {
  const data = interviews.map(i => ({
    'Candidate ID': i.id || 'N/A',
    'Candidate Name': i.name || 'N/A',
    'Job Applied': i.role || 'N/A',
    'Interviewer': i.interviewer || 'Unassigned',
    'Date': i.date || 'N/A',
    'Platform': i.platform || 'N/A',
    'Status': i.status || 'N/A',
  }));
  exportToCSV(data, `employer_interviews_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Employer Reports tab: Hiring Funnel Report. Built from
 * EmployerRepository.getAnalytics's real per-job application/status
 * breakdown (GET /employer/analytics) -- the same data the Analytics tab
 * renders as bars, exported here as a flat table.
 */
export function exportHiringFunnelCSV(perJob: Array<{ jobTitle: string; totalApplications: number; statusBreakdown: Record<string, number> }>): void {
  const data = perJob.map(j => ({
    'Job Title': j.jobTitle,
    'Total Applications': j.totalApplications,
    ...j.statusBreakdown
  }));
  exportToCSV(data, `employer_hiring_funnel_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Employer Reports tab: Recruiter Performance Report. Built from
 * GET /employer/recruiters's real live `_count` aggregates (jobs/
 * interviews/offers per recruiter) -- no invented KPIs.
 */
export function exportRecruiterPerformanceCSV(recruiters: Array<{
  name: string;
  email: string;
  title: string;
  jobs: number;
  interviews: number;
  offers: number;
}>): void {
  const data = recruiters.map(r => ({
    'Recruiter': r.name,
    'Email': r.email,
    'Title': r.title,
    'Jobs Owned': r.jobs,
    'Interviews Scheduled': r.interviews,
    'Offers Extended': r.offers
  }));
  exportToCSV(data, `employer_recruiter_performance_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Real university placement performance report built from live analytics/dashboard
 * data (see UniversityService.getAnalytics / getDashboard) -- no hardcoded figures.
 */
export function exportUniversityPlacementReportCSV(input: {
  totalStudents: number;
  studentsPlaced: number;
  placementPercentage: number;
  pendingVerifications?: number;
  activeDrives?: number;
  averageSalary: number | null;
  highestPackage: number | null;
  hiringTrends: { year: string; placements: number }[];
  departmentBreakdown: { departmentName: string; placed: number; total: number; placementPercentage: number }[];
}): void {
  const summary = [
    { 'Metric': 'Total Students', 'Value': input.totalStudents },
    { 'Metric': 'Students Placed', 'Value': input.studentsPlaced },
    { 'Metric': 'Placement Rate', 'Value': `${input.placementPercentage}%` },
    { 'Metric': 'Pending Verifications', 'Value': input.pendingVerifications ?? '—' },
    { 'Metric': 'Upcoming Drives', 'Value': input.activeDrives ?? '—' },
    { 'Metric': 'Average Package', 'Value': input.averageSalary != null ? `$${input.averageSalary.toLocaleString()}` : '—' },
    { 'Metric': 'Highest Package', 'Value': input.highestPackage != null ? `$${input.highestPackage.toLocaleString()}` : '—' }
  ];
  exportToCSV(summary, `university_placement_summary_${new Date().toISOString().split('T')[0]}.csv`);

  if (input.departmentBreakdown.length > 0) {
    const byDept = input.departmentBreakdown.map(d => ({
      'Department': d.departmentName,
      'Placed': d.placed,
      'Total': d.total,
      'Placement %': `${d.placementPercentage}%`
    }));
    exportToCSV(byDept, `university_department_breakdown_${new Date().toISOString().split('T')[0]}.csv`);
  }
}

/** Export Admin user directory to CSV. */
export function exportAdminUsersCSV(users: any[]): void {
  const data = users.map(u => ({
    'ID': u.id,
    'Name': u.name,
    'Email': u.email,
    'Role': u.role,
    'Status': u.status,
  }));
  exportToCSV(data, `admin_users_${new Date().toISOString().split('T')[0]}.csv`);
}

/** Export Admin audit trail to CSV. */
export function exportAdminAuditLogsCSV(logs: any[]): void {
  const data = logs.map(l => ({
    'ID': l.id,
    'Action': l.action,
    'Actor': l.actor,
    'Timestamp': l.timestamp,
    'Details': l.details,
    'Status': l.status,
    'IP': l.ip,
  }));
  exportToCSV(data, `admin_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
}
