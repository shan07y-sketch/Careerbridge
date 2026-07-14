import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface PartnerCompany {
  id: string;
  name: string;
  tier: string;
  industry: string;
  recruitersCount: number;
  dept: string[];
  offersCount: number;
  avgPkg: string;
  lastVisit: string;
  status: 'Recruiting' | 'Active Partner' | 'Inactive';
}

export const CompaniesManagement: React.FC = () => {
  const { showToast } = useToast();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedPkg, setSelectedPkg] = useState('All');

  // Partner Companies Database
  const [companies] = useState<PartnerCompany[]>([
    {
      id: '1',
      name: 'Nexus Systems',
      tier: 'Super Dream',
      industry: 'Software / AI',
      recruitersCount: 5,
      dept: ['CS', 'ECE'],
      offersCount: 142,
      avgPkg: '24.5L',
      lastVisit: 'Aug 14, 2024',
      status: 'Recruiting'
    },
    {
      id: '2',
      name: 'Sterling Capital',
      tier: 'Dream',
      industry: 'FinTech',
      recruitersCount: 2,
      dept: ['Finance', 'Stats'],
      offersCount: 86,
      avgPkg: '18.2L',
      lastVisit: 'Jul 28, 2024',
      status: 'Active Partner'
    },
    {
      id: '3',
      name: 'Quantum Systems',
      tier: 'Super Dream',
      industry: 'Hardware / Robotics',
      recruitersCount: 3,
      dept: ['ECE', 'MECH'],
      offersCount: 45,
      avgPkg: '21.0L',
      lastVisit: 'Sep 02, 2024',
      status: 'Recruiting'
    },
    {
      id: '4',
      name: 'Cognitive Web',
      tier: 'Dream',
      industry: 'Software / AI',
      recruitersCount: 4,
      dept: ['CS', 'IT'],
      offersCount: 94,
      avgPkg: '16.8L',
      lastVisit: 'Aug 29, 2024',
      status: 'Active Partner'
    },
    {
      id: '5',
      name: 'Innova Health',
      tier: 'Dream',
      industry: 'BioTech',
      recruitersCount: 2,
      dept: ['Bio', 'CS'],
      offersCount: 38,
      avgPkg: '14.2L',
      lastVisit: 'Jun 15, 2024',
      status: 'Inactive'
    }
  ]);

  // Actions
  const handleAddCompany = () => {
    showToast('Opening partner onboarding registration form...', 'info');
  };

  const handleInviteRecruiter = () => {
    showToast('Sending CareerBridge recruiter portal invitations...', 'success');
  };

  const handleExport = () => {
    showToast('Downloading partner company registry index...', 'success');
  };

  const handleGenerateAIReport = () => {
    showToast('Synthesizing recruiter yield performance charts...', 'success');
  };

  // Filter Logic
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.tier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndustry = selectedIndustry === 'All' || company.industry.includes(selectedIndustry);
    const matchesTier = selectedTier === 'All' || company.tier === selectedTier;
    const matchesPkg = selectedPkg === 'All' || parseFloat(company.avgPkg) >= 15.0;

    return matchesSearch && matchesIndustry && matchesTier && matchesPkg;
  });

  return (
    <div className="w-full text-left">
      {/* Page Header & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Companies</h2>
          <p className="text-body-md text-sm text-on-surface-variant max-w-2xl mt-1">
            Manage university recruitment partners, campus relationships, hiring statistics, and upcoming recruitment opportunities.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
          <button 
            onClick={handleAddCompany}
            className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg font-bold hover:opacity-90 transition-opacity border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add Company
          </button>
          <button 
            onClick={handleInviteRecruiter}
            className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-bold hover:opacity-90 transition-opacity border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span> Invite Recruiter
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold mb-stack-lg">
        <button 
          onClick={handleExport}
          className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 text-on-surface-variant cursor-pointer bg-white"
        >
          <span className="material-symbols-outlined text-[18px]">download</span> Export Companies
        </button>
        <button 
          onClick={handleGenerateAIReport}
          className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 text-on-surface-variant cursor-pointer bg-white"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span> Generate AI Report
        </button>
        <button 
          onClick={() => showToast('Bulk operations loader triggered.', 'info')}
          className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 text-on-surface-variant cursor-pointer bg-white"
        >
          <span className="material-symbols-outlined text-[18px]">layers</span> Bulk Actions
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-stack-lg">
        {/* KPI Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Partner Companies</p>
            <span className="material-symbols-outlined text-primary/40 text-lg">business</span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black text-primary">150</h3>
              <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[10px]">trending_up</span> +5%
              </p>
            </div>
            <svg className="h-8 w-16 stroke-primary stroke-2 fill-none"><polyline points="0,20 10,15 20,25 30,10 40,18 50,5 60,12"></polyline></svg>
          </div>
        </div>

        {/* KPI Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Active Recruiters</p>
            <span className="material-symbols-outlined text-primary/40 text-lg">group</span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black text-primary">542</h3>
              <p className="text-[10px] text-on-surface-variant font-bold mt-1">Steady growth</p>
            </div>
            <svg className="h-8 w-16 stroke-primary stroke-2 fill-none"><polyline points="0,25 10,22 20,20 30,22 40,15 50,18 60,10"></polyline></svg>
          </div>
        </div>

        {/* KPI Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Visits this Sem</p>
            <span className="material-symbols-outlined text-primary/40 text-lg">event</span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black text-primary">42</h3>
              <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[10px]">trending_up</span> +12%
              </p>
            </div>
            <svg className="h-8 w-16 stroke-primary stroke-2 fill-none"><polyline points="0,25 10,20 20,15 30,18 40,10 50,8 60,5"></polyline></svg>
          </div>
        </div>

        {/* KPI Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Open Drives</p>
            <span className="material-symbols-outlined text-primary/40 text-lg">bolt</span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black text-primary">18</h3>
              <p className="text-[10px] text-primary font-bold mt-1">4 Urgent</p>
            </div>
            <svg className="h-8 w-16 stroke-primary stroke-2 fill-none"><polyline points="0,15 10,25 20,10 30,15 40,5 50,12 60,8"></polyline></svg>
          </div>
        </div>

        {/* KPI Card 5 */}
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between h-24 hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Total Offers</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-primary">1,240</h3>
            <svg className="h-8 w-16 stroke-primary stroke-2 fill-none"><polyline points="0,25 10,22 20,18 30,12 40,15 50,10 60,5"></polyline></svg>
          </div>
        </div>

        {/* KPI Card 6 */}
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between h-24 hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Highest Package</p>
          <div className="flex items-end justify-between mt-2 text-left">
            <h3 className="text-2xl font-black text-primary">45 LPA</h3>
            <p className="text-[10px] text-primary font-bold">New High</p>
          </div>
        </div>

        {/* KPI Card 7 */}
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between h-24 hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Average Package</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-primary">12.4 LPA</h3>
            <svg className="h-8 w-16 stroke-primary stroke-2 fill-none"><polyline points="0,20 10,18 20,15 30,16 40,12 50,10 60,8"></polyline></svg>
          </div>
        </div>

        {/* KPI Card 8 */}
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between h-24 hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Returning Rate</p>
          <div className="flex items-end justify-between mt-2 text-left">
            <h3 className="text-2xl font-black text-primary">88%</h3>
            <p className="text-[10px] text-primary font-bold">Excellent Retention</p>
          </div>
        </div>
      </div>

      {/* Main layout Content & Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-left">
        {/* Left Primary Column */}
        <div className="xl:col-span-9 space-y-8">
          
          {/* Company Intelligence Bento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
            {/* AI Insights Card */}
            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h4 className="font-bold text-primary uppercase tracking-wider">AI Company Insights</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Hiring Forecast</p>
                    <p className="text-xs font-bold text-primary mt-0.5">Strong Growth in Q3</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-on-surface-variant uppercase font-black">Confidence</p>
                    <p className="text-xs font-extrabold text-primary">94%</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-outline-variant">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Top Dept</p>
                    <p className="text-xs font-bold text-primary mt-0.5">CS &amp; Data Science</p>
                  </div>
                  <div className="p-3 rounded-xl border border-outline-variant">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Skill Gap</p>
                    <p className="text-xs font-bold text-primary mt-0.5">Cloud Architecture</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            </div>

            {/* Package Analytics Card */}
            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-primary uppercase tracking-wider">Package Analytics</h4>
                <select className="text-[10px] font-bold bg-transparent border-none text-on-surface-variant focus:ring-0 cursor-pointer outline-none">
                  <option>Last 5 Years</option>
                  <option>Last 3 Years</option>
                </select>
              </div>
              
              <div className="h-32 flex items-end gap-2 px-2">
                <div className="flex-grow bg-primary/10 rounded-t-sm h-[40%] cursor-pointer hover:bg-primary/20 transition-all" title="2020: 8.2LPA"></div>
                <div className="flex-grow bg-primary/20 rounded-t-sm h-[55%] cursor-pointer hover:bg-primary/30 transition-all" title="2021: 9.1LPA"></div>
                <div className="flex-grow bg-primary/40 rounded-t-sm h-[65%] cursor-pointer hover:bg-primary/50 transition-all" title="2022: 10.4LPA"></div>
                <div className="flex-grow bg-primary/60 rounded-t-sm h-[80%] cursor-pointer hover:bg-primary/70 transition-all" title="2023: 11.8LPA"></div>
                <div className="flex-grow bg-primary rounded-t-sm h-[100%] cursor-pointer hover:opacity-90 transition-all" title="2024: 12.4LPA"></div>
              </div>
              
              <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant px-1 font-bold">
                <span>2020</span>
                <span>2021</span>
                <span>2022</span>
                <span>2023</span>
                <span>2024</span>
              </div>
            </div>
          </div>

          {/* Company Management Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
            <div className="p-6 border-b border-primary/5 space-y-4 text-xs font-semibold">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-primary/20 focus:border-primary outline-none font-semibold" 
                  placeholder="Search companies by name, industry, recruiter..." 
                  type="text"
                />
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <div 
                  onClick={() => setSelectedIndustry(prev => prev === 'Tech' ? 'All' : 'Tech')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                    selectedIndustry === 'Tech' 
                      ? 'bg-primary text-on-primary font-bold' 
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-outline-variant'
                  }`}
                >
                  Industry: Tech
                </div>
                
                <div 
                  onClick={() => setSelectedTier(prev => prev === 'Super Dream' ? 'All' : 'Super Dream')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                    selectedTier === 'Super Dream' 
                      ? 'bg-primary text-on-primary font-bold' 
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-outline-variant'
                  }`}
                >
                  Tier: Super Dream
                </div>
                
                <div 
                  onClick={() => setSelectedPkg(prev => prev === '15L+' ? 'All' : '15L+')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                    selectedPkg === '15L+' 
                      ? 'bg-primary text-on-primary font-bold' 
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-outline-variant'
                  }`}
                >
                  Package: 15L+
                </div>
                <div className="px-3 py-1 bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer hover:bg-outline-variant transition-colors">Status: Recruiting</div>
                
                <button 
                  onClick={() => showToast('Advanced filtering logic loaded.', 'info')}
                  className="ml-auto text-primary text-xs font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none"
                >
                  <span className="material-symbols-outlined text-sm">filter_list</span> Advanced Filters
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-surface-container-low/50 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-primary/5">
                    <th className="px-6 py-4">Company</th>
                    <th className="px-4 py-4">Industry</th>
                    <th className="px-4 py-4">Recruiters</th>
                    <th className="px-4 py-4">Depts</th>
                    <th className="px-4 py-4 text-center">Offers</th>
                    <th className="px-4 py-4 text-center">Avg Pkg</th>
                    <th className="px-4 py-4">Last Visit</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center italic text-on-surface-variant font-semibold">
                        No companies found matching current filter queries.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-primary/5 p-1 bg-surface shrink-0 font-bold text-primary text-xs">
                              {company.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-primary text-xs">{company.name}</p>
                              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Tier: {company.tier}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-on-surface-variant">{company.industry}</td>
                        <td className="px-4 py-4">
                          <div className="flex -space-x-2">
                            <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-bold border-2 border-white shrink-0">HR</div>
                            <div className="w-7 h-7 rounded-full bg-secondary-container text-[10px] flex items-center justify-center text-on-secondary-container font-bold border-2 border-white shrink-0">+{company.recruitersCount}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            {company.dept.map(d => (
                              <span key={d} className="px-2 py-0.5 bg-tertiary-fixed text-[9px] font-bold rounded">
                                {d}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-primary">{company.offersCount}</td>
                        <td className="px-4 py-4 text-center font-bold">{company.avgPkg}</td>
                        <td className="px-4 py-4 text-[11px] text-on-surface-variant font-medium">{company.lastVisit}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            company.status === 'Recruiting' 
                              ? 'bg-primary/10 text-primary' 
                              : company.status === 'Active Partner'
                                ? 'bg-surface-container-high text-on-surface-variant'
                                : 'bg-red-50 text-red-600'
                          }`}>
                            {company.status === 'Recruiting' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>}
                            {company.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-primary/5 flex justify-between items-center bg-surface-container-low/30 text-xs font-bold text-on-surface-variant">
              <p>Showing {filteredCompanies.length} of {companies.length} companies</p>
              <div className="flex gap-2">
                <button onClick={() => showToast('Previous Page', 'info')} className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors cursor-pointer bg-white"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                <button onClick={() => showToast('Next Page', 'info')} className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors cursor-pointer bg-white"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="xl:col-span-3 flex flex-col gap-8 text-xs font-semibold">
          {/* Companies Visiting This Week */}
          <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm text-left">
            <h5 className="font-bold text-primary mb-4 flex items-center justify-between uppercase tracking-wider text-xs">
              Visiting This Week
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] rounded-full normal-case font-bold">4 scheduled</span>
            </h5>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer border border-transparent hover:border-primary/10">
                <div className="w-10 h-10 rounded bg-surface-container-low border border-primary/5 flex items-center justify-center font-bold text-primary text-xs shrink-0">IBM</div>
                <div className="flex-1">
                  <p className="font-bold text-primary text-xs">IBM Research</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Tomorrow, 10:00 AM</p>
                  <div className="mt-2 flex gap-1 font-bold text-[8px] uppercase">
                    <span className="bg-secondary-container px-2 py-0.5 rounded text-on-secondary-container">PPT</span>
                    <span className="bg-secondary-container px-2 py-0.5 rounded text-on-secondary-container">Interviews</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer border border-transparent hover:border-primary/10">
                <div className="w-10 h-10 rounded bg-surface-container-low border border-primary/5 flex items-center justify-center font-bold text-primary text-xs shrink-0">ADBE</div>
                <div className="flex-1">
                  <p className="font-bold text-primary text-xs">Adobe Systems</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Thursday, 02:00 PM</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => showToast('Opening complete corporate visit schedule logs...', 'info')}
              className="w-full mt-4 text-center py-2 text-primary font-bold hover:underline transition-all cursor-pointer bg-transparent border-none text-xs"
            >
              View All Engagements
            </button>
          </div>

          {/* Top Recruiters */}
          <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm text-left">
            <h5 className="font-bold text-primary mb-4 uppercase tracking-wider text-xs">Top Hiring Partners</h5>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">SC</div>
                <div>
                  <p className="font-bold text-primary">Sarah Chen</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Nexus Systems (14 hires)</p>
                </div>
                <button 
                  onClick={() => showToast('Opening direct chat with Sarah Chen...', 'success')}
                  className="ml-auto text-primary p-1.5 hover:bg-primary/5 rounded cursor-pointer bg-transparent border-none flex"
                >
                  <span className="material-symbols-outlined text-base">chat_bubble</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">MT</div>
                <div>
                  <p className="font-bold text-primary">Marcus Thorne</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Sterling Cap (12 hires)</p>
                </div>
                <button 
                  onClick={() => showToast('Opening direct chat with Marcus Thorne...', 'success')}
                  className="ml-auto text-primary p-1.5 hover:bg-primary/5 rounded cursor-pointer bg-transparent border-none flex"
                >
                  <span className="material-symbols-outlined text-base">chat_bubble</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pending Company Requests */}
          <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm border-l-4 border-l-error text-left">
            <h5 className="font-bold text-primary mb-4 flex items-center justify-between uppercase tracking-wider text-xs">
              Pending Approvals
              <span className="w-5 h-5 bg-error text-on-error flex items-center justify-center text-[10px] font-bold rounded-full font-sans">3</span>
            </h5>
            
            <div className="space-y-3">
              <div className="p-3 bg-error-container rounded-xl border border-error/20">
                <p className="font-bold text-on-error-container text-xs">Quantum Leap Robotics</p>
                <p className="text-[10px] text-on-error-container opacity-80 mt-0.5">New Partner Registration</p>
                <div className="mt-3 flex gap-2 text-[10px]">
                  <button 
                    onClick={() => {
                      showToast('Quantum Leap Robotics registration APPROVED.', 'success');
                    }}
                    className="flex-1 bg-on-error-container text-white py-1 rounded-md font-bold cursor-pointer border-none"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => {
                      showToast('Quantum Leap Robotics registration declined.', 'info');
                    }}
                    className="flex-grow border border-on-error-container text-on-error-container py-1 rounded-md font-bold cursor-pointer bg-transparent"
                  >
                    Decline
                  </button>
                </div>
              </div>
              
              <div className="p-3 bg-surface-container-high rounded-xl border border-outline-variant">
                <p className="font-bold text-on-surface text-xs">DataGenix Inc.</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Slot Change Request</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="p-6 bg-primary-container text-white rounded-2xl text-left">
            <h5 className="text-xs font-bold uppercase tracking-wider mb-4 text-primary-fixed">Semester Summary</h5>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] mb-1 font-bold text-surface-container">
                  <span>Hiring Goal (1500)</span>
                  <span>82%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="bg-primary-fixed h-full" style={{ width: '82%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1 font-bold text-surface-container">
                  <span>Campus Outreach</span>
                  <span>65%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="bg-primary-fixed h-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesManagement;
