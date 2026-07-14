import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface PlacementDrive {
  id: string;
  companyName: string;
  role: string;
  type: string;
  logo: string;
  logoColor: string;
  dept: string[];
  eligibleCount: number;
  appliedCount: number;
  packageAmt: string;
  mode: 'HYBRID' | 'ONLINE' | 'OFFLINE';
  dateStr: string;
  deadlineStr: string;
  status: 'Scheduled' | 'Reg. Open' | 'Screening' | 'Interviewing';
}

interface CampusDrivesProps {
  onCreateDrive?: () => void;
}

export const CampusDrives: React.FC<CampusDrivesProps> = ({ onCreateDrive }) => {
  const toast = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deptFilter, setDeptFilter] = useState('Department');

  // Mock Placement Drives Data
  const [drives] = useState<PlacementDrive[]>([
    {
      id: '1',
      companyName: 'Google',
      role: 'SDE I',
      type: 'Engineering Campus Hire',
      logo: 'G',
      logoColor: 'text-blue-600 bg-blue-50',
      dept: ['CSE'],
      eligibleCount: 1240,
      appliedCount: 3000,
      packageAmt: '$145k',
      mode: 'HYBRID',
      dateStr: 'Oct 12, 2024',
      deadlineStr: 'Interview Day',
      status: 'Scheduled'
    },
    {
      id: '2',
      companyName: 'Microsoft',
      role: 'Software Eng.',
      type: 'Cloud & AI Division',
      logo: 'M',
      logoColor: 'text-red-500 bg-red-50',
      dept: ['CSE', 'IT'],
      eligibleCount: 850,
      appliedCount: 2100,
      packageAmt: '$160k',
      mode: 'OFFLINE',
      dateStr: 'Nov 02, 2024',
      deadlineStr: 'Deadline: Oct 25',
      status: 'Reg. Open'
    },
    {
      id: '3',
      companyName: 'Amazon',
      role: 'Systems Analyst',
      type: 'Operations & Supply',
      logo: 'A',
      logoColor: 'text-amber-600 bg-amber-50',
      dept: ['Mechanical', 'EE'],
      eligibleCount: 450,
      appliedCount: 800,
      packageAmt: '$95k',
      mode: 'ONLINE',
      dateStr: 'Oct 15, 2024',
      deadlineStr: 'Round 1 OA',
      status: 'Screening'
    },
    {
      id: '4',
      companyName: 'Salesforce',
      role: 'MTS Intern',
      type: 'Product Delivery',
      logo: 'SF',
      logoColor: 'text-sky-500 bg-sky-50',
      dept: ['CSE', 'IT', 'ECE'],
      eligibleCount: 620,
      appliedCount: 1540,
      packageAmt: '$85k',
      mode: 'ONLINE',
      dateStr: 'Oct 22, 2024',
      deadlineStr: 'Shortlist pending',
      status: 'Reg. Open'
    },
    {
      id: '5',
      companyName: 'Goldman Sachs',
      role: 'Analyst',
      type: 'Fintech Solutions',
      logo: 'GS',
      logoColor: 'text-yellow-600 bg-yellow-50',
      dept: ['CSE', 'Finance'],
      eligibleCount: 380,
      appliedCount: 950,
      packageAmt: '$110k',
      mode: 'HYBRID',
      dateStr: 'Oct 09, 2024',
      deadlineStr: 'Completed',
      status: 'Interviewing'
    }
  ]);

  // Handle Action buttons
  const handleExport = () => {
    toast.showToast('Downloading campus recruitment spreadsheet...', 'success');
  };

  const handleGenerateAIReport = () => {
    toast.showToast('Generating AI Placement forecasting analytics...', 'success');
  };

  const handleCreateDrive = () => {
    if (onCreateDrive) {
      onCreateDrive();
    } else {
      toast.showToast('Opening drive scheduler dialog wizard...', 'info');
    }
  };

  // Filter Logic
  const filteredDrives = drives.filter(drive => {
    const matchesSearch = 
      drive.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drive.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drive.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' || drive.status === statusFilter;
    
    const matchesDept = 
      deptFilter === 'Department' || 
      drive.dept.some(d => d.toUpperCase() === deptFilter.toUpperCase());

    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="w-full text-left">
      {/* Page Header & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Campus Drives</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Create, schedule, monitor, and manage all campus recruitment drives.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-outline/20 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            Export
          </button>
          
          <button 
            onClick={handleGenerateAIReport}
            className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg active:scale-95 transition-transform cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-[18px]">auto_graph</span>
            Generate AI Report
          </button>
          
          <button 
            onClick={handleCreateDrive}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg active:scale-95 transition-transform shadow-lg shadow-primary/10 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Create Campus Drive
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md mb-stack-lg">
        {/* KPI 1 */}
        <div className="bg-white rounded-xl p-5 border border-primary/5 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Active Drives</span>
            <span className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[10px] font-bold">+12%</span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <h2 className="text-[28px] font-extrabold text-primary">24</h2>
            <div className="w-16 h-8 bg-primary/10 rounded overflow-hidden relative">
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-primary/20"></div>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-xl p-5 border border-primary/5 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Upcoming</span>
            <span className="bg-secondary/5 text-secondary px-2 py-0.5 rounded text-[10px] font-bold">8 Scheduled</span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <h2 className="text-[28px] font-extrabold text-primary">12</h2>
            <div className="w-16 h-8 border-b-2 border-primary/20 flex items-end gap-1">
              <div className="w-3 bg-primary/30 h-[40%] rounded-t-sm"></div>
              <div className="w-3 bg-primary/30 h-[80%] rounded-t-sm"></div>
              <div className="w-3 bg-primary/30 h-[60%] rounded-t-sm"></div>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-xl p-5 border border-primary/5 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Avg Package</span>
            <span className="text-primary font-bold text-[10px] uppercase">LPA</span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <h2 className="text-[28px] font-extrabold text-primary">$12.4k</h2>
            <span className="material-symbols-outlined text-primary text-[28px] opacity-20">payments</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-xl p-5 border border-primary/5 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Success Rate</span>
            <span className="text-primary font-bold text-[10px]">94.2%</span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <h2 className="text-[28px] font-extrabold text-primary">94.2%</h2>
            <div className="w-8 h-8 rounded-full border-4 border-primary/15 border-t-primary rotate-45"></div>
          </div>
        </div>
      </div>

      {/* Row 2 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-stack-md mb-stack-lg">
        <div className="bg-white rounded-xl p-4 border border-primary/5 shadow-sm text-left">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1">Participating Companies</span>
          <h2 className="text-2xl font-black text-primary">156</h2>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary/5 shadow-sm text-left">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1">Registered Students</span>
          <h2 className="text-2xl font-black text-primary">4,820</h2>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary/5 shadow-sm text-left">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1">Students Selected</span>
          <h2 className="text-2xl font-black text-primary">1,142</h2>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary/5 shadow-sm text-left">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1">Pending Shortlists</span>
          <h2 className="text-2xl font-black text-primary">82</h2>
        </div>
      </div>

      {/* Dashboard Grid Layout (Main Content + Sidebar) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-left">
        {/* Center Column: Search, Filter & Table */}
        <div className="xl:col-span-9 flex flex-col gap-8">
          
          {/* Advanced Filters */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-grow min-w-[300px] relative text-xs">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surface rounded-xl border border-outline/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold" 
                  placeholder="Search by company, role, or department..." 
                  type="text"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-surface border border-outline/10 rounded-xl px-4 py-3 text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                >
                  <option>All Status</option>
                  <option value="Reg. Open">Registration Open</option>
                  <option value="Screening">Screening</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
                
                <select 
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-surface border border-outline/10 rounded-xl px-4 py-3 text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                >
                  <option>Department</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="ECE">ECE</option>
                </select>
                
                <button 
                  onClick={() => toast.showToast('Filtering options loaded.', 'info')}
                  className="flex items-center gap-2 px-6 py-3 bg-surface rounded-xl border border-outline/10 hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">filter_list</span> 
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Campus Drive Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-primary/5 flex justify-between items-center bg-surface-container-lowest text-xs font-bold">
              <h3 className="text-primary uppercase tracking-wider">Active Placement Drives</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => toast.showToast('More action triggers loaded.', 'info')}
                  className="p-2 rounded-lg hover:bg-surface transition-colors cursor-pointer bg-transparent border-none"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-surface/50 border-b border-primary/5 text-on-surface-variant font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Company &amp; Role</th>
                    <th className="px-6 py-4">Target Dept</th>
                    <th className="px-6 py-4">Stats</th>
                    <th className="px-6 py-4">Package &amp; Mode</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredDrives.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center italic text-on-surface-variant font-semibold">
                        No drives match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDrives.map((drive) => (
                      <tr key={drive.id} className="hover:bg-surface transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg border border-outline/10 flex items-center justify-center font-bold text-primary bg-surface-container-low shrink-0 text-sm">
                              {drive.logo}
                            </div>
                            <div>
                              <p className="font-bold text-primary text-xs">{drive.companyName} {drive.role}</p>
                              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{drive.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-1">
                            {drive.dept.map(d => (
                              <span key={d} className="px-2 py-0.5 bg-secondary-container/30 text-on-secondary-container rounded text-[10px] font-bold">
                                {d}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-[11px]">
                            <p><span className="font-bold text-primary">{drive.eligibleCount}</span> Eligible</p>
                            <p className="text-on-surface-variant"><span className="font-bold">{drive.appliedCount}</span> Applied</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-bold text-primary">{drive.packageAmt}</p>
                            <p className="text-[9px] text-on-surface-variant font-black mt-0.5">{drive.mode}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">{drive.dateStr}</span>
                            <span className="text-[10px] text-on-surface-variant mt-0.5">{drive.deadlineStr}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                            drive.status === 'Scheduled'
                              ? 'bg-primary text-on-primary'
                              : drive.status === 'Reg. Open'
                                ? 'border border-primary text-primary'
                                : 'bg-secondary-container text-on-secondary-container'
                          }`}>
                            {drive.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights Bento Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
            <div className="md:col-span-1 bg-primary-container rounded-2xl p-6 text-on-primary-container text-left flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary-fixed">psychology</span>
                  <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">AI Drive Forecast</h4>
                </div>
                <p className="text-xs opacity-90 leading-relaxed text-surface-container-low font-medium">
                  Registration patterns suggest a 22% surge in applications for Google compared to last year.
                </p>
              </div>
              <div className="mt-4">
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                  <div className="bg-primary-fixed w-[85%] h-full rounded-full"></div>
                </div>
                <span className="text-[9px] font-black uppercase opacity-70">Accuracy Confidence: 85%</span>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-primary/5 flex flex-col md:flex-row gap-6 justify-between items-center text-left">
              <div className="flex-1">
                <h4 className="font-bold text-primary uppercase tracking-wider text-xs mb-2">Skill Gap Analysis</h4>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed mb-4">
                  Current batch shows high proficiency in Cloud (89%) but needs improvement in Distributed Systems (42%) for Tier-1 companies.
                </p>
                <button 
                  onClick={() => toast.showToast('Loading full skill competency audit report...', 'info')}
                  className="text-primary font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none"
                >
                  View Detailed Report <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              
              <div className="w-full md:w-32 flex items-center justify-center shrink-0">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#edeeeb" strokeWidth="3"></path>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#001f16" strokeDasharray="75, 100" strokeWidth="3"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-primary text-base">75%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Widgets */}
        <aside className="xl:col-span-3 flex flex-col gap-8 text-xs font-semibold">
          {/* Placement Calendar Widget */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5 text-left">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-primary uppercase tracking-wider text-xs">Placement Calendar</h4>
              <span className="text-[10px] font-bold text-on-surface-variant">Oct 2024</span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-outline mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-sans font-bold">
              <div className="p-2 text-xs opacity-20 font-medium">28</div>
              <div className="p-2 text-xs opacity-20 font-medium">29</div>
              <div className="p-2 text-xs font-medium">1</div>
              <div className="p-2 text-xs font-medium">2</div>
              <div className="p-2 text-xs font-medium">3</div>
              <div className="p-2 text-xs font-medium">4</div>
              <div className="p-2 text-xs font-medium">5</div>
              <div className="p-2 text-xs font-medium">6</div>
              <div className="p-2 text-xs font-medium">7</div>
              <div className="p-2 text-xs font-medium">8</div>
              <div className="p-2 text-xs font-medium">9</div>
              <div className="p-2 text-xs font-medium">10</div>
              <div className="p-2 text-xs font-medium">11</div>
              
              <div className="p-2 text-xs bg-primary text-on-primary rounded-lg font-black ring-4 ring-primary/10">12</div>
              
              <div className="p-2 text-xs font-medium">13</div>
              <div className="p-2 text-xs font-medium">14</div>
              
              <div className="p-2 text-xs bg-secondary-container text-on-secondary-container rounded-lg font-black">15</div>
              
              <div className="p-2 text-xs font-medium">16</div>
              <div className="p-2 text-xs font-medium">17</div>
              <div className="p-2 text-xs font-medium">18</div>
              <div className="p-2 text-xs font-medium">19</div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-ping"></div>
                <p className="text-xs font-bold text-primary leading-normal">Google Campus Interview Day</p>
              </div>
            </div>
          </div>

          {/* Today's Interviews */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5 text-left">
            <h4 className="font-bold text-primary mb-4 uppercase tracking-wider">Today's Interviews</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-surface rounded-xl border-l-4 border-primary">
                <div className="text-center min-w-[40px] font-sans font-bold">
                  <p className="text-xs font-bold text-primary">09:00</p>
                  <p className="text-[9px] text-on-surface-variant font-medium">AM</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-primary leading-normal">Goldman Sachs</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Technical Round 1</p>
                </div>
                <span className="material-symbols-outlined text-primary text-lg">videocam</span>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-surface rounded-xl border-l-4 border-secondary-container">
                <div className="text-center min-w-[40px] font-sans font-bold">
                  <p className="text-xs font-bold text-primary">02:30</p>
                  <p className="text-[9px] text-on-surface-variant font-medium">PM</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-primary leading-normal">Salesforce</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Cultural Fit Round</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-lg">meeting_room</span>
              </div>
            </div>
            
            <button 
              onClick={() => toast.showToast('Loading interview scheduler list...', 'info')}
              className="w-full mt-6 py-2 border border-outline/10 rounded-lg text-xs font-bold text-primary hover:bg-surface transition-colors cursor-pointer bg-transparent"
            >
              View All Interviews
            </button>
          </div>

          {/* Urgent Tasks */}
          <div className="bg-surface-container-high rounded-2xl p-6 border border-primary/5 text-left">
            <h4 className="font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              Urgent Tasks
            </h4>
            
            <ul className="space-y-4 text-xs font-semibold">
              <li 
                onClick={() => toast.showToast('Amazon shortlist verified!', 'success')}
                className="flex items-start gap-3 cursor-pointer"
              >
                <div className="mt-0.5 w-4 h-4 rounded border border-outline bg-white flex items-center justify-center shrink-0"></div>
                <div>
                  <p className="text-xs font-bold text-primary leading-normal">Verify Shortlist for Amazon</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Deadline in 2 hours</p>
                </div>
              </li>
              
              <li className="flex items-start gap-3 opacity-60">
                <div className="mt-0.5 w-4 h-4 rounded border border-primary bg-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[12px] text-white">check</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary line-through leading-normal">Invite Adobe for 2025</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Completed</p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CampusDrives;
