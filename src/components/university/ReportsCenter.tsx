import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface Report {
  id: string;
  name: string;
  category: 'Placement' | 'Department' | 'Company' | 'Accreditation' | 'Student';
  generatedBy: string;
  lastGenerated: string;
  format: string;
  status: 'Ready' | 'Processing' | 'Scheduled';
}

export const ReportsCenter: React.FC = () => {
  const { showToast } = useToast();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  
  // Reports Database
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      name: 'Q1 Placement Summary 2024',
      category: 'Placement',
      generatedBy: 'System',
      lastGenerated: 'Oct 24, 2024',
      format: 'PDF, XLS',
      status: 'Ready'
    },
    {
      id: '2',
      name: 'CS Dept - Final Year Audit',
      category: 'Department',
      generatedBy: 'Dr. Jenkins',
      lastGenerated: 'Oct 23, 2024',
      format: 'PDF',
      status: 'Processing'
    },
    {
      id: '3',
      name: 'Annual Recruiter Feedback',
      category: 'Company',
      generatedBy: 'Scheduled Task',
      lastGenerated: 'Next: Nov 01',
      format: 'CSV',
      status: 'Scheduled'
    },
    {
      id: '4',
      name: 'NAAC Accreditation Assessment',
      category: 'Accreditation',
      generatedBy: 'Director of Placements',
      lastGenerated: 'Oct 15, 2024',
      format: 'PDF, DOCX',
      status: 'Ready'
    },
    {
      id: '5',
      name: 'AI Readiness Student Cohort 2025',
      category: 'Student',
      generatedBy: 'Bridge AI Agent',
      lastGenerated: 'Oct 20, 2024',
      format: 'XLSX',
      status: 'Ready'
    }
  ]);

  // Actions
  const handleSchedule = () => {
    showToast('Opening report scheduling configurations...', 'info');
  };

  const handleExportAll = () => {
    showToast('Downloading complete zip archive of generated reports...', 'success');
  };

  const handleGenerateCustom = () => {
    showToast('Opening custom report query builder...', 'info');
  };

  const handleGenerateCategory = (categoryName: string) => {
    const newReportName = `${categoryName} Assessment Report - ${new Date().toLocaleDateString()}`;
    const newReport: Report = {
      id: String(Date.now()),
      name: newReportName,
      category: categoryName as any,
      generatedBy: 'Dr. Sarah Jenkins',
      lastGenerated: 'Just now',
      format: 'PDF, XLSX',
      status: 'Ready'
    };

    setReports(prev => [newReport, ...prev]);
    showToast(`Successfully generated ${categoryName} report! Added to library.`, 'success');
  };

  const handleDownload = (name: string) => {
    showToast(`Downloading report file: ${name}`, 'success');
  };

  // Filter logic
  const filteredReports = reports.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="w-full text-left">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-stack-lg gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Reports Center</h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Generate, schedule, analyze, and export placement, academic, company, and accreditation reports.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
          <button 
            onClick={handleSchedule}
            className="px-4 py-2.5 rounded-lg border border-primary/10 bg-white font-bold text-primary hover:bg-surface-container-low transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            Schedule
          </button>
          
          <button 
            onClick={handleExportAll}
            className="px-4 py-2.5 rounded-lg border border-primary/10 bg-white font-bold text-primary hover:bg-surface-container-low transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export All
          </button>
          
          <button 
            onClick={handleGenerateCustom}
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold hover:opacity-90 transition-all flex items-center gap-2 border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-gutter mb-section-gap text-xs font-semibold">
        {/* Left Content Col */}
        <div className="xl:col-span-3 space-y-gutter">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md text-left">
            <div className="bg-white p-5 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
              <div className="flex justify-between items-start mb-2">
                <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Total Reports</span>
                <span className="material-symbols-outlined text-primary/40 text-lg">description</span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-primary">1,240</p>
                <span className="text-primary font-bold flex items-center mb-1 text-[10px]">
                  <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span> 12%
                </span>
              </div>
              <div className="mt-4 h-6 w-full flex items-end gap-1 opacity-20">
                <div className="flex-1 bg-primary h-2 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-4 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-3 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-6 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-5 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-8 rounded-t-sm"></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
              <div className="flex justify-between items-start mb-2">
                <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Scheduled</span>
                <span className="material-symbols-outlined text-primary/40 text-lg">event_repeat</span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-primary">184</p>
                <span className="text-on-surface-variant font-bold mb-1 text-[10px]">Active tasks</span>
              </div>
              <div className="mt-4 h-6 w-full flex items-end gap-1 opacity-20">
                <div className="flex-1 bg-primary h-4 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-6 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-2 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-4 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-7 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-5 rounded-t-sm"></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
              <div className="flex justify-between items-start mb-2">
                <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Generated (Mo)</span>
                <span className="material-symbols-outlined text-primary/40 text-lg">auto_awesome</span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-primary">42</p>
                <span className="text-red-600 font-bold flex items-center mb-1 text-[10px]">
                  <span className="material-symbols-outlined text-[12px] mr-0.5">trending_down</span> 4%
                </span>
              </div>
              <div className="mt-4 h-6 w-full flex items-end gap-1 opacity-20">
                <div className="flex-1 bg-primary h-6 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-4 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-5 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-3 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-2 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-4 rounded-t-sm"></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
              <div className="flex justify-between items-start mb-2">
                <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Downloads</span>
                <span className="material-symbols-outlined text-primary/40 text-lg">download_done</span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-primary">5.2k</p>
                <span className="text-primary font-bold flex items-center mb-1 text-[10px]">
                  <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span> 28%
                </span>
              </div>
              <div className="mt-4 h-6 w-full flex items-end gap-1 opacity-20">
                <div className="flex-1 bg-primary h-2 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-4 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-5 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-6 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-7 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-8 rounded-t-sm"></div>
              </div>
            </div>
          </div>

          {/* AI Executive Summary */}
          <section className="bg-white rounded-2xl border border-primary/10 overflow-hidden relative shadow-sm text-left">
            <div className="p-6 relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h3 className="font-bold text-primary text-base">Bridge AI: Executive Summary</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 leading-relaxed">
                <div className="space-y-2">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span> 
                    Placement Forecast
                  </h4>
                  <p className="text-on-surface-variant font-medium">
                    Based on current drive participation of 150+ companies, we anticipate a 14% increase in high-tier placements for Q4 2024 compared to last year.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span> 
                    Skill Gap Analysis
                  </h4>
                  <p className="text-on-surface-variant font-medium">
                    Top recruiters emphasize advanced Python and Cloud Infrastructure. 32% of 10,000 students currently meet these specific criteria.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span> 
                    Recommendation
                  </h4>
                  <p className="text-on-surface-variant font-bold leading-normal">
                    Schedule an accreditation readiness audit for the Computer Science department before the upcoming NAAC visit.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
                <button 
                  onClick={() => showToast('Synthesizing executive insight report files...', 'success')}
                  className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/15 transition-colors border-none cursor-pointer"
                >
                  Generate Full Insight Report
                </button>
                <button 
                  onClick={() => showToast('Opening system analytics datasources index...', 'info')}
                  className="px-4 py-2 rounded-lg text-primary font-bold hover:bg-surface-container-low transition-colors border-none cursor-pointer bg-transparent"
                >
                  View Data Sources
                </button>
              </div>
            </div>
          </section>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3 py-4 border-b border-primary/5 text-xs font-semibold">
            <div className="relative flex-1 min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-primary/10 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary outline-none" 
                placeholder="Filter by report title or keyword..." 
                type="text"
              />
            </div>
            
            <select className="bg-white border border-primary/10 rounded-lg px-4 py-2 text-xs text-on-surface-variant focus:ring-1 focus:ring-primary cursor-pointer outline-none">
              <option>Academic Year: 2023-24</option>
              <option>2022-23</option>
            </select>
            
            <select 
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                showToast(`Filtering by department: ${e.target.value}`, 'info');
              }}
              className="bg-white border border-primary/10 rounded-lg px-4 py-2 text-xs text-on-surface-variant focus:ring-1 focus:ring-primary cursor-pointer outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Management">Management</option>
            </select>
            
            <button 
              onClick={() => showToast('Advanced reports filtering matrices loaded.', 'info')}
              className="flex items-center gap-2 px-4 py-2 text-primary border border-primary/10 rounded-lg hover:bg-white transition-all cursor-pointer bg-transparent"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              More Filters
            </button>
          </div>

          {/* Report Categories Grid */}
          <div className="text-left">
            <h3 className="text-base font-bold text-primary mb-stack-md uppercase tracking-wider">Report Categories</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-stack-md font-bold text-xs">
              {/* Category Card 1 */}
              <div className="bg-white p-5 rounded-xl border border-primary/5 hover:border-primary/20 transition-all group flex flex-col justify-between text-left shadow-sm h-48">
                <div>
                  <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform shrink-0">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <h4 className="font-bold text-primary leading-tight">Placement</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">24 Templates</p>
                </div>
                <button 
                  onClick={() => handleGenerateCategory('Placement')}
                  className="w-full py-2 mt-4 rounded-lg bg-surface-container-low text-primary font-bold hover:bg-primary hover:text-white transition-all cursor-pointer border-none"
                >
                  Generate
                </button>
              </div>

              {/* Category Card 2 */}
              <div className="bg-white p-5 rounded-xl border border-primary/5 hover:border-primary/20 transition-all group flex flex-col justify-between text-left shadow-sm h-48">
                <div>
                  <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform shrink-0">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <h4 className="font-bold text-primary leading-tight">Student performance</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">12 Templates</p>
                </div>
                <button 
                  onClick={() => handleGenerateCategory('Student')}
                  className="w-full py-2 mt-4 rounded-lg bg-surface-container-low text-primary font-bold hover:bg-primary hover:text-white transition-all cursor-pointer border-none"
                >
                  Generate
                </button>
              </div>

              {/* Category Card 3 */}
              <div className="bg-white p-5 rounded-xl border border-primary/5 hover:border-primary/20 transition-all group flex flex-col justify-between text-left shadow-sm h-48">
                <div>
                  <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform shrink-0">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <h4 className="font-bold text-primary leading-tight">Accreditation (NAAC)</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">8 Templates</p>
                </div>
                <button 
                  onClick={() => handleGenerateCategory('Accreditation')}
                  className="w-full py-2 mt-4 rounded-lg bg-surface-container-low text-primary font-bold hover:bg-primary hover:text-white transition-all cursor-pointer border-none"
                >
                  Generate
                </button>
              </div>

              {/* Category Card 4 */}
              <div className="bg-white p-5 rounded-xl border border-primary/5 hover:border-primary/20 transition-all group flex flex-col justify-between text-left shadow-sm h-48">
                <div>
                  <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform shrink-0">
                    <span className="material-symbols-outlined">business</span>
                  </div>
                  <h4 className="font-bold text-primary leading-tight">Company Insights</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">15 Templates</p>
                </div>
                <button 
                  onClick={() => handleGenerateCategory('Company')}
                  className="w-full py-2 mt-4 rounded-lg bg-surface-container-low text-primary font-bold hover:bg-primary hover:text-white transition-all cursor-pointer border-none"
                >
                  Generate
                </button>
              </div>

              {/* Category Card 5 */}
              <div className="bg-white p-5 rounded-xl border border-primary/5 hover:border-primary/20 transition-all group flex flex-col justify-between text-left shadow-sm h-48">
                <div>
                  <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform shrink-0">
                    <span className="material-symbols-outlined">hub</span>
                  </div>
                  <h4 className="font-bold text-primary leading-tight">Department Hub</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">32 Templates</p>
                </div>
                <button 
                  onClick={() => handleGenerateCategory('Department')}
                  className="w-full py-2 mt-4 rounded-lg bg-surface-container-low text-primary font-bold hover:bg-primary hover:text-white transition-all cursor-pointer border-none"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Report Library Table */}
          <div className="bg-white rounded-2xl border border-primary/5 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-primary/5 flex items-center justify-between font-bold text-xs">
              <h3 className="text-primary text-base">Report Library</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => showToast('Sorting list...', 'info')} className="p-2 hover:bg-surface-container-low rounded cursor-pointer bg-transparent border-none text-primary flex"><span className="material-symbols-outlined text-[18px]">sort</span></button>
                <button onClick={() => showToast('More settings...', 'info')} className="p-2 hover:bg-surface-container-low rounded cursor-pointer bg-transparent border-none text-primary flex"><span className="material-symbols-outlined text-[18px]">more_vert</span></button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-surface-container-low/50 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-primary/5">
                    <th className="p-4">Report Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Last Generated</th>
                    <th className="p-4">Format</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-primary">{r.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Generated by {r.generatedBy}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-[9px] font-extrabold uppercase">
                          {r.category}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{r.lastGenerated}</td>
                      <td className="p-4 text-primary font-bold">{r.format}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 font-bold text-[10px] ${
                          r.status === 'Ready' 
                            ? 'text-primary' 
                            : r.status === 'Processing'
                              ? 'text-yellow-600'
                              : 'text-on-surface-variant'
                        }`}>
                          {r.status === 'Ready' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>}
                          {r.status === 'Processing' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></span>}
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {r.status === 'Ready' ? (
                          <button 
                            onClick={() => handleDownload(r.name)}
                            className="text-primary hover:underline font-bold bg-transparent border-none cursor-pointer text-xs"
                          >
                            Download
                          </button>
                        ) : r.status === 'Processing' ? (
                          <button className="text-primary/40 cursor-not-allowed font-bold bg-transparent border-none text-xs">
                            Pending
                          </button>
                        ) : (
                          <button 
                            onClick={() => showToast('Editing scheduled reports criteria...', 'info')}
                            className="text-primary hover:underline font-bold bg-transparent border-none cursor-pointer text-xs"
                          >
                            Edit Task
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-primary/5 flex items-center justify-between bg-surface-container-low/30 font-bold text-xs text-on-surface-variant">
              <span>Showing {filteredReports.length} of {reports.length} reports</span>
              <div className="flex gap-2">
                <button onClick={() => showToast('Previous Page', 'info')} className="w-8 h-8 flex items-center justify-center rounded border border-primary/10 bg-white hover:bg-surface-container-low cursor-pointer"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white text-xs cursor-pointer border-none font-bold">1</button>
                <button onClick={() => showToast('Page 2', 'info')} className="w-8 h-8 flex items-center justify-center rounded border border-primary/10 bg-white hover:bg-surface-container-low text-xs cursor-pointer font-bold">2</button>
                <button onClick={() => showToast('Next Page', 'info')} className="w-8 h-8 flex items-center justify-center rounded border border-primary/10 bg-white hover:bg-surface-container-low cursor-pointer"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Content */}
        <div className="space-y-gutter flex flex-col gap-1">
          {/* Recent Reports */}
          <div className="bg-white rounded-2xl p-5 border border-primary/5 shadow-sm text-left">
            <div className="flex items-center justify-between mb-4 text-xs font-bold">
              <h4 className="text-primary uppercase tracking-wider">Recent Reports</h4>
              <span className="material-symbols-outlined text-primary/40 text-[20px]">history</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                  <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-primary truncate">NAAC_Self_Study_v2.pdf</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">2 mins ago • 4.2 MB</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                  <span className="material-symbols-outlined text-xl">table_view</span>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-primary truncate">Placement_Tracker_24.xls</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">1 hour ago • 1.8 MB</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => showToast('Opening historical report logs...', 'info')}
              className="w-full mt-6 py-2 border border-primary/10 rounded-lg text-xs font-bold text-primary hover:bg-surface-container-low transition-all cursor-pointer bg-white"
            >
              View Full History
            </button>
          </div>

          {/* Storage Usage */}
          <div className="bg-white rounded-2xl p-5 border border-primary/5 shadow-sm text-left">
            <h4 className="font-bold text-primary uppercase tracking-wider text-xs mb-4">Storage Usage</h4>
            <div className="flex justify-between items-end mb-2">
              <p className="text-lg font-black text-primary">64.2 <span className="text-xs font-normal text-on-surface-variant">GB used</span></p>
              <p className="text-[10px] text-on-surface-variant font-bold">of 100 GB</p>
            </div>
            
            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[64%]"></div>
            </div>
            
            <div className="mt-4 flex gap-4 text-[10px] font-bold text-on-surface-variant">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span> Reports</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary-container"></span> Media</div>
            </div>
          </div>

          {/* Pinned Favorites */}
          <div className="bg-white rounded-2xl p-5 border border-primary/5 shadow-sm text-left">
            <div className="flex items-center justify-between mb-4 text-xs font-bold">
              <h4 className="text-primary uppercase tracking-wider">Pinned Reports</h4>
              <span className="material-symbols-outlined text-yellow-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            
            <div className="space-y-2">
              <div 
                onClick={() => showToast('Opening NBA Compliance Matrix...', 'info')}
                className="p-3 rounded-lg border border-primary/5 hover:bg-primary hover:text-white transition-all group cursor-pointer text-left"
              >
                <p className="font-bold text-primary group-hover:text-white">NBA Compliance Matrix</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 group-hover:text-white/80">Updated Weekly</p>
              </div>

              <div 
                onClick={() => showToast('Opening Top 20 Salary Stats...', 'info')}
                className="p-3 rounded-lg border border-primary/5 hover:bg-primary hover:text-white transition-all group cursor-pointer text-left"
              >
                <p className="font-bold text-primary group-hover:text-white">Top 20 Salary Stats</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 group-hover:text-white/80">Real-time Data</p>
              </div>

              <div 
                onClick={() => showToast('Opening Alumni Tracking...', 'info')}
                className="p-3 rounded-lg border border-primary/5 hover:bg-primary hover:text-white transition-all group cursor-pointer text-left"
              >
                <p className="font-bold text-primary group-hover:text-white">Alumni Tracking - 2023</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 group-hover:text-white/80">Monthly Refresh</p>
              </div>
            </div>
          </div>

          {/* Quick Support */}
          <div className="bg-primary text-white rounded-2xl p-5 shadow-lg relative overflow-hidden text-left">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[100px] text-white">support_agent</span>
            </div>
            
            <h4 className="font-bold text-white text-xs mb-2 relative z-10">Need help with audits?</h4>
            <p className="text-[11px] text-white/80 mb-4 leading-relaxed font-medium relative z-10">Connect with our data specialist for NAAC/NBA documentation.</p>
            
            <button 
              onClick={() => showToast('Booking assistance with data specialist...', 'success')}
              className="w-full py-2 bg-white text-primary rounded-lg font-bold hover:bg-primary-fixed transition-colors border-none cursor-pointer relative z-10 text-xs shadow-sm"
            >
              Book Assistance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsCenter;
