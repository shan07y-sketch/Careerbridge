import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface Student {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  regNo: string;
  dept: string;
  year: string;
  cgpa: number;
  aiReadiness: number;
  status: 'Placed' | 'Shortlisted' | 'Applied' | 'Pending Action';
  verification: 'verified' | 'pending' | 'error';
  company: string;
}

interface StudentManagementProps {
  onSelectStudent?: (id: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ onSelectStudent }) => {
  const { showToast } = useToast();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [yearFilter, setYearFilter] = useState('All Years');
  const [cgpaFilter, setCgpaFilter] = useState(7.5);
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Selected students for checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mock Students Database
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Arjun Sharma', initials: 'AS', avatarColor: 'bg-primary/10 text-primary', regNo: '2021CS045', dept: 'CSE', year: '2025', cgpa: 9.2, aiReadiness: 88, status: 'Placed', verification: 'verified', company: 'Google' },
    { id: '2', name: 'Priya Verma', initials: 'PV', avatarColor: 'bg-secondary-container text-on-secondary-container', regNo: '2021IT122', dept: 'IT', year: '2025', cgpa: 8.7, aiReadiness: 72, status: 'Shortlisted', verification: 'verified', company: 'Interviewing...' },
    { id: '3', name: 'Rohan Kumar', initials: 'RK', avatarColor: 'bg-surface-container-high text-on-surface-variant', regNo: '2021ME098', dept: 'Mechanical', year: '2026', cgpa: 7.8, aiReadiness: 45, status: 'Applied', verification: 'pending', company: '-' },
    { id: '4', name: 'Sneha Lakshmi', initials: 'SL', avatarColor: 'bg-primary-fixed text-primary', regNo: '2021EC012', dept: 'ECE', year: '2025', cgpa: 9.5, aiReadiness: 94, status: 'Placed', verification: 'verified', company: 'Amazon' },
    { id: '5', name: 'Anil Kapoor', initials: 'AK', avatarColor: 'bg-surface-container-highest text-on-surface', regNo: '2021CS089', dept: 'CSE', year: '2026', cgpa: 8.1, aiReadiness: 65, status: 'Applied', verification: 'verified', company: '-' },
    { id: '6', name: 'Devika J.', initials: 'DJ', avatarColor: 'bg-primary/10 text-primary', regNo: '2021IT055', dept: 'IT', year: '2025', cgpa: 8.9, aiReadiness: 81, status: 'Shortlisted', verification: 'verified', company: 'Zomato' },
    { id: '7', name: 'Manoj S.', initials: 'MS', avatarColor: 'bg-secondary-container text-on-secondary-container', regNo: '2021ME041', dept: 'Mechanical', year: '2026', cgpa: 7.2, aiReadiness: 32, status: 'Pending Action', verification: 'error', company: '-' },
    { id: '8', name: 'Sunita Rao', initials: 'SR', avatarColor: 'bg-primary-fixed text-primary', regNo: '2021EC044', dept: 'ECE', year: '2024', cgpa: 8.4, aiReadiness: 76, status: 'Applied', verification: 'verified', company: '-' },
    { id: '9', name: 'Vikram Singh', initials: 'VS', avatarColor: 'bg-surface-container-high text-on-surface-variant', regNo: '2021CS102', dept: 'CSE', year: '2024', cgpa: 7.6, aiReadiness: 58, status: 'Applied', verification: 'pending', company: '-' },
    { id: '10', name: 'Neha Gupta', initials: 'NG', avatarColor: 'bg-surface-container-highest text-on-surface', regNo: '2021IT072', dept: 'IT', year: '2026', cgpa: 9.0, aiReadiness: 85, status: 'Placed', verification: 'verified', company: 'Microsoft' }
  ]);

  // Handle global key shortcut ⌘ + K or Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('student-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter Logic
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'All Departments' || student.dept === deptFilter;
    const matchesYear = yearFilter === 'All Years' || student.year === yearFilter;
    const matchesCgpa = student.cgpa >= cgpaFilter;
    const matchesStatus = statusFilter === 'All Status' || student.status === statusFilter;

    return matchesSearch && matchesDept && matchesYear && matchesCgpa && matchesStatus;
  });

  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkVerify = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one student to verify.', 'info');
      return;
    }
    // Update verification status in local mock state
    setStudents(prev => 
      prev.map(s => selectedIds.includes(s.id) ? { ...s, verification: 'verified' } : s)
    );
    showToast(`Successfully verified documents for ${selectedIds.length} students!`, 'success');
    setSelectedIds([]);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDeptFilter('All Departments');
    setYearFilter('All Years');
    setCgpaFilter(7.5);
    setStatusFilter('All Status');
    showToast('Filters cleared.', 'info');
  };

  const handleCreateStudent = () => {
    showToast('Opening "Create Student" profile editor wizard...', 'info');
  };

  const handleBulkImport = () => {
    showToast('Initializing Excel / CSV bulk data uploader...', 'info');
  };

  const handleExport = () => {
    showToast('Downloading placement readiness spreadsheets...', 'success');
  };

  return (
    <div className="w-full">
      {/* Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-gutter mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Student Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Search, verify, monitor, and manage student placement readiness across the university.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
          <button 
            onClick={handleBulkImport}
            className="px-4 py-2 border border-outline text-primary rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer bg-white"
          >
            <span className="material-symbols-outlined text-[18px]">file_upload</span>
            Bulk Import
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2 border border-outline text-primary rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer bg-white"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Students
          </button>
          <button 
            onClick={handleBulkVerify}
            className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Bulk Verify
          </button>
          <button 
            onClick={handleCreateStudent}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Create Student
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg text-left">
        {/* KPI Card 1 */}
        <div className="bg-white rounded-xl p-stack-md shadow-sm border border-outline-variant/30 bento-card flex flex-col justify-between h-32 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Total Students</p>
              <h3 className="text-[28px] font-extrabold text-primary mt-1">12,504</h3>
            </div>
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg">groups</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
            <span className="material-symbols-outlined text-xs">trending_up</span> +2.4% <span className="text-on-surface-variant font-normal italic">vs last year</span>
          </div>
        </div>

        {/* KPI Card 2 */}
        <div className="bg-white rounded-xl p-stack-md shadow-sm border border-outline-variant/30 bento-card flex flex-col justify-between h-32 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Placement Eligible</p>
              <h3 className="text-[28px] font-extrabold text-primary mt-1">8,920</h3>
            </div>
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
            </div>
          </div>
          <div className="w-full h-8 flex items-end gap-0.5">
            <div className="w-full bg-primary/20 h-1/2 rounded-t-sm"></div>
            <div className="w-full bg-primary/20 h-3/4 rounded-t-sm"></div>
            <div className="w-full bg-primary/20 h-2/3 rounded-t-sm"></div>
            <div className="w-full bg-primary/40 h-full rounded-t-sm"></div>
            <div className="w-full bg-primary/20 h-1/2 rounded-t-sm"></div>
          </div>
        </div>

        {/* KPI Card 3 */}
        <div className="bg-white rounded-xl p-stack-md shadow-sm border border-outline-variant/30 bento-card flex flex-col justify-between h-32 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Placement Verified</p>
              <h3 className="text-[28px] font-extrabold text-primary mt-1">7,402</h3>
            </div>
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant font-semibold">83% of eligible verified</p>
        </div>

        {/* KPI Card 4 */}
        <div className="bg-white rounded-xl p-stack-md shadow-sm border border-outline-variant/30 bento-card flex flex-col justify-between h-32 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Students Placed</p>
              <h3 className="text-[28px] font-extrabold text-primary mt-1">3,210</h3>
            </div>
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg">work_history</span>
            </div>
          </div>
          <div className="h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[36%]"></div>
          </div>
        </div>

        {/* KPI Card 5 */}
        <div className="bg-white rounded-xl p-stack-md shadow-sm border border-outline-variant/30 bento-card flex flex-col justify-between h-32 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Internship Completed</p>
              <h3 className="text-[28px] font-extrabold text-primary mt-1">4,150</h3>
            </div>
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg">badge</span>
            </div>
          </div>
          <p className="text-xs text-green-600 font-bold">On Track (Q4 Goal)</p>
        </div>

        {/* KPI Card 6 */}
        <div className="bg-white rounded-xl p-stack-md shadow-sm border border-outline-variant/30 bento-card flex flex-col justify-between h-32 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Resume Approved</p>
              <h3 className="text-[28px] font-extrabold text-primary mt-1">6,890</h3>
            </div>
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg">article</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold">
            <span className="material-symbols-outlined text-xs">pending_actions</span> 1,202 Pending Review
          </div>
        </div>

        {/* KPI Card 7 */}
        <div className="bg-white rounded-xl p-stack-md shadow-sm border border-outline-variant/30 bento-card flex flex-col justify-between h-32 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Average AI Readiness</p>
              <h3 className="text-[28px] font-extrabold text-primary mt-1">78.5%</h3>
            </div>
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg">psychology</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
            <span className="material-symbols-outlined text-xs">trending_up</span> +5.2% this month
          </div>
        </div>

        {/* KPI Card 8 */}
        <div className="bg-white rounded-xl p-stack-md shadow-sm border border-outline-variant/30 bento-card flex flex-col justify-between h-32 border-l-4 border-l-error hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Requiring Attention</p>
              <h3 className="text-[28px] font-extrabold text-error mt-1">425</h3>
            </div>
            <div className="p-2 bg-error/5 rounded-lg">
              <span className="material-symbols-outlined text-error text-lg">warning</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant font-semibold">Incomplete profiles or low CGPA</p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-gutter text-left">
        {/* Table Section */}
        <div className="col-span-12 xl:col-span-9 space-y-gutter">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md">
            <div className="flex flex-col gap-4">
              {/* Large Global Search */}
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[24px]">search</span>
                <input 
                  id="student-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-12 pr-4 py-4 text-xs font-semibold focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                  placeholder="Search by name, register number, department, or company..." 
                  type="text"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <span className="text-[10px] text-on-surface-variant font-bold bg-white px-2 py-1 rounded border border-outline-variant/20">⌘ + K</span>
                </div>
              </div>
              
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/10 text-on-surface-variant">
                  <span>Department:</span>
                  <select 
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="bg-transparent border-none p-0 focus:ring-0 font-bold text-primary text-xs outline-none cursor-pointer"
                  >
                    <option>All Departments</option>
                    <option value="CSE">Computer Science</option>
                    <option value="IT">IT</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/10 text-on-surface-variant">
                  <span>Year:</span>
                  <select 
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="bg-transparent border-none p-0 focus:ring-0 font-bold text-primary text-xs outline-none cursor-pointer"
                  >
                    <option>All Years</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/10 text-on-surface-variant">
                  <span>Min CGPA:</span>
                  <input 
                    value={cgpaFilter}
                    onChange={(e) => setCgpaFilter(parseFloat(e.target.value) || 0)}
                    className="w-12 bg-transparent border-none p-0 focus:ring-0 font-bold text-primary text-xs outline-none" 
                    step="0.1" 
                    max="10"
                    min="0"
                    type="number" 
                  />
                </div>
                
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/10 text-on-surface-variant">
                  <span>Status:</span>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none p-0 focus:ring-0 font-bold text-primary text-xs outline-none cursor-pointer"
                  >
                    <option>All Status</option>
                    <option value="Placed">Placed</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Applied">Applied</option>
                    <option value="Pending Action">Pending Action</option>
                  </select>
                </div>
                
                <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>
                
                <button 
                  onClick={() => showToast('Advanced Filtering drawer loaded.', 'info')}
                  className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
                >
                  <span className="material-symbols-outlined text-[20px]">filter_list</span> 
                  Advanced Filters
                </button>
                
                <button 
                  onClick={handleClearFilters}
                  className="ml-auto text-primary font-bold hover:underline cursor-pointer bg-transparent border-none"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-stack-md border-b border-outline-variant/20 flex justify-between items-center text-xs font-bold">
              <h3 className="text-primary flex items-center gap-2">
                Student List 
                <span className="bg-surface-container-high px-2 py-0.5 rounded text-[10px] font-normal text-on-surface-variant">
                  Showing {filteredStudents.length} of {students.length} records
                </span>
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => showToast('Table column visibility settings opened.', 'info')}
                  className="p-2 hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant/10 cursor-pointer bg-transparent"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">view_column</span>
                </button>
                <button 
                  onClick={() => {
                    showToast('Student registry refreshed successfully.', 'success');
                  }}
                  className="p-2 hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant/10 cursor-pointer bg-transparent"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">refresh</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead className="bg-surface-container-low/50 text-on-surface-variant uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-4 border-b border-outline-variant/20">
                      <input 
                        checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                        onChange={handleSelectAll}
                        className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" 
                        type="checkbox"
                      />
                    </th>
                    <th className="p-4 border-b border-outline-variant/20">Student Name</th>
                    <th className="p-4 border-b border-outline-variant/20">Reg. No</th>
                    <th className="p-4 border-b border-outline-variant/20">Dept</th>
                    <th className="p-4 border-b border-outline-variant/20 text-center">CGPA</th>
                    <th className="p-4 border-b border-outline-variant/20 text-center">AI Readiness</th>
                    <th className="p-4 border-b border-outline-variant/20">Status</th>
                    <th className="p-4 border-b border-outline-variant/20 text-center">Verification</th>
                    <th className="p-4 border-b border-outline-variant/20">Current Co.</th>
                    <th className="p-4 border-b border-outline-variant/20 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-on-surface-variant italic font-semibold">
                        No students found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-surface-container-low/30 transition-colors group">
                        <td className="p-4">
                          <input 
                            checked={selectedIds.includes(student.id)}
                            onChange={() => handleCheckboxChange(student.id)}
                            className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" 
                            type="checkbox"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${student.avatarColor}`}>
                              {student.initials}
                            </div>
                            <div>
                              <div className="font-bold text-on-surface group-hover:text-primary transition-colors">
                                <button
                                  onClick={() => onSelectStudent && onSelectStudent(student.id)}
                                  className="font-bold text-on-surface hover:text-primary transition-colors cursor-pointer bg-transparent border-none text-left p-0 outline-none"
                                >
                                  {student.name}
                                </button>
                              </div>
                              <div className="text-[10px] text-on-surface-variant font-medium">Final Year, {student.dept}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-on-surface-variant">{student.regNo}</td>
                        <td className="p-4">{student.dept}</td>
                        <td className="p-4 text-center font-extrabold text-primary">{student.cgpa.toFixed(1)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-surface-container-low rounded-full overflow-hidden shrink-0">
                              <div 
                                className={`h-full rounded-full ${
                                  student.aiReadiness >= 80 
                                    ? 'bg-green-500' 
                                    : student.aiReadiness >= 60 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                }`} 
                                style={{ width: `${student.aiReadiness}%` }}
                              ></div>
                            </div>
                            <span className={`text-[10px] font-bold shrink-0 ${
                              student.aiReadiness >= 80 
                                ? 'text-green-600' 
                                : student.aiReadiness >= 60 
                                  ? 'text-amber-600' 
                                  : 'text-red-600'
                            }`}>
                              {student.aiReadiness}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase flex items-center w-fit gap-1 ${
                            student.status === 'Placed' 
                              ? 'bg-green-100 text-green-700' 
                              : student.status === 'Shortlisted' 
                                ? 'bg-blue-100 text-blue-700' 
                                : student.status === 'Applied' 
                                  ? 'bg-surface-container-high text-on-surface-variant' 
                                  : 'bg-error-container text-on-error-container'
                          }`}>
                            {student.status === 'Placed' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
                            {student.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {student.verification === 'verified' ? (
                            <span className="material-symbols-outlined text-primary text-[18px] filled-icon">verified</span>
                          ) : student.verification === 'error' ? (
                            <span className="material-symbols-outlined text-error text-[18px]">error</span>
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">pending</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-primary">{student.company}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => showToast(`Actions dialog for ${student.name} opened.`, 'info')}
                            className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer bg-transparent border-none p-1"
                          >
                            more_vert
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-outline-variant/20 flex justify-between items-center bg-surface-container-low/30 text-xs font-bold text-on-surface-variant">
              <span>Showing {filteredStudents.length} of {students.length} records</span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => showToast('Previous Page', 'info')} className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/20 bg-white text-on-surface-variant hover:bg-primary-fixed transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-bold text-xs border-none cursor-pointer">1</button>
                <button onClick={() => showToast('Page 2', 'info')} className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/20 bg-white text-on-surface-variant hover:bg-primary-fixed transition-colors font-bold text-xs cursor-pointer">2</button>
                <button onClick={() => showToast('Page 3', 'info')} className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/20 bg-white text-on-surface-variant hover:bg-primary-fixed transition-colors font-bold text-xs cursor-pointer font-sans">...</button>
                <button onClick={() => showToast('Next Page', 'info')} className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/20 bg-white text-on-surface-variant hover:bg-primary-fixed transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-gutter text-xs font-semibold">
          {/* AI Student Insights Panel */}
          <div className="bg-primary-container text-white rounded-xl p-stack-md shadow-lg border border-primary/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined filled-icon text-primary-fixed">auto_awesome</span>
                <h3 className="font-bold text-[10px] uppercase tracking-wider text-primary-fixed">AI Insights Hub</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-primary/20 rounded-lg p-3 border border-primary/10 text-left">
                  <p className="text-[10px] text-primary-fixed/80 uppercase font-bold mb-1">Placement Readiness</p>
                  <div className="flex justify-between items-end">
                    <span className="text-[20px] font-extrabold text-white">82.4</span>
                    <span className="text-[9px] text-primary-fixed font-bold bg-primary/40 px-1.5 py-0.5 rounded">High Probability</span>
                  </div>
                  <div className="w-full h-1 bg-primary/40 rounded-full mt-2 overflow-hidden">
                    <div className="bg-primary-fixed h-full w-[82.4%] rounded-full shadow-[0_0_8px_rgba(188,237,217,0.4)]"></div>
                  </div>
                </div>
                
                <div className="bg-primary/20 rounded-lg p-3 border border-primary/10 text-left">
                  <p className="text-[10px] text-primary-fixed/80 uppercase font-bold mb-2">Top Skill Gaps (CSE Dept)</p>
                  <div className="flex flex-wrap gap-2 text-[9px]">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white">Cloud Arch.</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white">Unit Testing</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white">SDLC</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => showToast('AI readiness report generation triggered...', 'success')}
                  className="w-full bg-primary-fixed text-primary font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-white transition-all cursor-pointer border-none shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">analytics</span> 
                  Generate Full AI Report
                </button>
              </div>
            </div>
          </div>

          {/* Placement Pipeline */}
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md text-left">
            <h3 className="font-bold text-primary text-xs mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[20px]">account_tree</span> 
              Placement Pipeline
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">1</div>
                  <div className="w-[2px] h-full bg-primary/25 min-h-[20px]"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary leading-normal">Registered</p>
                  <p className="text-[10px] text-on-surface-variant">12,504 Students</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">2</div>
                  <div className="w-[2px] h-full bg-primary/25 min-h-[20px]"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary leading-normal">Verified</p>
                  <p className="text-[10px] text-on-surface-variant">7,402 Students</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-[10px] text-on-secondary-container font-bold">3</div>
                  <div className="w-[2px] h-full bg-primary/25 min-h-[20px]"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary leading-normal">Shortlisted</p>
                  <p className="text-[10px] text-on-surface-variant">4,120 Students</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] text-on-surface-variant font-bold">4</div>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant leading-normal">Offer / Placed</p>
                  <p className="text-[10px] text-on-surface-variant">3,210 Students</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md text-left">
            <h3 className="font-bold text-primary text-xs mb-4 uppercase tracking-wider">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-green-600 text-[18px]">description</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface font-semibold leading-normal">Resume Verified: <span className="font-extrabold text-primary">Arjun Sharma</span></p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">2 mins ago • Admin ID: #882</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">mail</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface font-semibold leading-normal">Broadcast Sent: <span className="font-extrabold text-primary">Mock Interviews</span></p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">45 mins ago • Global</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface font-semibold leading-normal">Low Readiness Flag: <span className="font-extrabold text-primary">MECH Dept</span></p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">2 hours ago • System AI</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => showToast('Opening complete verification and activity audit logs...', 'info')}
              className="w-full mt-4 py-2 border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer bg-transparent"
            >
              View All Logs
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md text-left">
            <h3 className="font-bold text-primary text-xs mb-4 uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
              <button 
                onClick={handleBulkVerify}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-outline-variant/10 hover:bg-primary/5 hover:border-primary/20 transition-all gap-1 cursor-pointer bg-transparent text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">verified</span>
                <span>Verify Docs</span>
              </button>
              
              <button 
                onClick={() => showToast('Opening bulk resume approval queue...', 'info')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-outline-variant/10 hover:bg-primary/5 hover:border-primary/20 transition-all gap-1 cursor-pointer bg-transparent text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">assignment</span>
                <span>Review Resumes</span>
              </button>
              
              <button 
                onClick={() => showToast('Drafting mock interviews email/push broadcast...', 'info')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-outline-variant/10 hover:bg-primary/5 hover:border-primary/20 transition-all gap-1 cursor-pointer bg-transparent text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">campaign</span>
                <span>Broadcast</span>
              </button>
              
              <button 
                onClick={() => showToast('Opening training program auto-assigner...', 'info')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-outline-variant/10 hover:bg-primary/5 hover:border-primary/20 transition-all gap-1 cursor-pointer bg-transparent text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">school</span>
                <span>Assign Training</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
