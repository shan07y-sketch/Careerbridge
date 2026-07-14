import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface AcademicDept {
  name: string;
  hod: string;
  placed: string;
  readiness: number;
}

interface TeamMember {
  name: string;
  role: string;
  active: boolean;
}

export const UniversitySettings: React.FC = () => {
  const { showToast } = useToast();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'placement' | 'users' | 'ai' | 'integrations' | 'branding' | 'security' | 'compliance'>('general');

  // Input states
  const [resumeSensitivity, setResumeSensitivity] = useState(70);
  const [autoScreening, setAutoScreening] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#023629');
  const [secondaryColor, setSecondaryColor] = useState('#E9DFC8');

  // Integrations states
  const [googleConnected, setGoogleConnected] = useState(true);
  const [linkedinConnected, setLinkedinConnected] = useState(true);

  // Mock Academic Departments
  const depts: AcademicDept[] = [
    { name: "Computer Science & Eng", hod: "Dr. Arvind Swami", placed: "92%", readiness: 88 },
    { name: "Artificial Intelligence", hod: "Dr. Elena Gilbert", placed: "98%", readiness: 95 },
    { name: "Mechanical Eng", hod: "Prof. Robert Thorne", placed: "64%", readiness: 72 },
    { name: "Electrical Eng", hod: "Dr. Sarah Paulson", placed: "78%", readiness: 81 },
    { name: "Information Tech", hod: "Prof. Mike Ross", placed: "85%", readiness: 84 },
    { name: "Civil Engineering", hod: "Dr. James Wilson", placed: "52%", readiness: 60 },
    { name: "Electronics & Comm", hod: "Prof. Linda G", placed: "81%", readiness: 79 },
    { name: "Data Science", hod: "Dr. Kevin Flynn", placed: "95%", readiness: 98 },
    { name: "Biotechnology", hod: "Dr. Juliet Burke", placed: "71%", readiness: 68 },
    { name: "Aerospace Eng", hod: "Prof. Neil Armstrong", placed: "89%", readiness: 92 }
  ];

  // Placement team members
  const team: TeamMember[] = [
    { name: "Marcus Wright", role: "Sr. Placement Officer", active: true },
    { name: "Aditi Sharma", role: "Corporate Relations", active: true },
    { name: "Julian Voss", role: "Internship Manager", active: false },
    { name: "Sarah Connor", role: "Career Coach", active: true },
    { name: "Kenji Tanaka", role: "Data Analyst", active: true },
    { name: "Maria Garcia", role: "Public Relations", active: true },
    { name: "Tom Hardy", role: "Alumni Coordinator", active: true }
  ];

  // Save changes action
  const handleSaveChanges = () => {
    showToast('University configuration and branding updates saved successfully!', 'success');
  };

  const handleDiscardChanges = () => {
    setResumeSensitivity(70);
    setAutoScreening(true);
    setPrimaryColor('#023629');
    setSecondaryColor('#E9DFC8');
    showToast('Changes discarded. Restored default values.', 'info');
  };

  const handleExportImport = () => {
    showToast('Exporting current university backup policy rules JSON...', 'success');
  };

  const handleRunCompliance = () => {
    showToast('Initiating cryptographic NAAC compliance audit scan...', 'success');
  };

  return (
    <div className="w-full text-left">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-stack-lg gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">University Settings</h2>
          <p className="font-body-md text-sm text-on-surface-variant mt-1 max-w-2xl">
            Manage university configuration, placement policies, departments, users, security, AI services, integrations, and institutional preferences.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
          <button 
            onClick={handleExportImport}
            className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-primary font-bold rounded-lg flex items-center hover:bg-surface-container-high transition-all bg-white cursor-pointer"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">cloud_download</span> Export/Import
          </button>
          
          <button 
            onClick={handleDiscardChanges}
            className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-primary font-bold rounded-lg flex items-center hover:bg-surface-container-high transition-all bg-white cursor-pointer"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">history</span> Discard
          </button>
          
          <button 
            onClick={handleSaveChanges}
            className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg flex items-center shadow-sm hover:opacity-90 transition-all border-none cursor-pointer"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">save</span> Save Changes
          </button>
        </div>
      </div>

      {/* Horizontal Nav Tabs */}
      <div className="flex items-center space-x-6 overflow-x-auto pb-3 mb-stack-lg border-b border-outline-variant/10 text-xs font-bold text-on-surface-variant shrink-0">
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-2 whitespace-nowrap cursor-pointer border-none bg-transparent font-bold ${activeTab === 'general' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
        >
          General
        </button>
        <button 
          onClick={() => { setActiveTab('departments'); showToast('Loaded Academic Departments settings.', 'info'); }}
          className={`pb-2 whitespace-nowrap cursor-pointer border-none bg-transparent font-bold ${activeTab === 'departments' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
        >
          Departments
        </button>
        <button 
          onClick={() => { setActiveTab('placement'); showToast('Loaded Placement Cell directory.', 'info'); }}
          className={`pb-2 whitespace-nowrap cursor-pointer border-none bg-transparent font-bold ${activeTab === 'placement' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
        >
          Placement Cell
        </button>
        <button 
          onClick={() => { setActiveTab('users'); showToast('Loaded Users and Roles matrices.', 'info'); }}
          className={`pb-2 whitespace-nowrap cursor-pointer border-none bg-transparent font-bold ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
        >
          Users &amp; Roles
        </button>
        <button 
          onClick={() => { setActiveTab('ai'); showToast('Loaded Gemini AI rules settings.', 'info'); }}
          className={`pb-2 whitespace-nowrap cursor-pointer border-none bg-transparent font-bold ${activeTab === 'ai' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
        >
          AI Configuration
        </button>
        <button 
          onClick={() => { setActiveTab('integrations'); showToast('Loaded Integration configs.', 'info'); }}
          className={`pb-2 whitespace-nowrap cursor-pointer border-none bg-transparent font-bold ${activeTab === 'integrations' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
        >
          Integrations
        </button>
        <button 
          onClick={() => { setActiveTab('branding'); showToast('Loaded Institutional Branding logo files.', 'info'); }}
          className={`pb-2 whitespace-nowrap cursor-pointer border-none bg-transparent font-bold ${activeTab === 'branding' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
        >
          Branding
        </button>
        <button 
          onClick={() => { setActiveTab('security'); showToast('Loaded SSO and 2FA credentials panel.', 'info'); }}
          className={`pb-2 whitespace-nowrap cursor-pointer border-none bg-transparent font-bold ${activeTab === 'security' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
        >
          Security
        </button>
        <button 
          onClick={() => { setActiveTab('compliance'); showToast('Loaded NAAC Regulatory compliance tracker logs.', 'info'); }}
          className={`pb-2 whitespace-nowrap cursor-pointer border-none bg-transparent font-bold ${activeTab === 'compliance' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
        >
          Compliance
        </button>
      </div>

      {/* Main Settings Panel Content */}
      <div className="space-y-stack-lg">
        {/* Health & Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter text-xs font-semibold text-left">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">University Health</p>
                <h3 className="text-3xl font-black text-primary mt-1">94%</h3>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-primary">health_metrics</span>
              </div>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '94%' }}></div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-3 flex items-center font-bold">
              <span className="material-symbols-outlined text-green-600 text-sm mr-1">trending_up</span> 
              +2.4% from last audit
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Security Score</p>
                <h3 className="text-3xl font-black text-primary mt-1">A+</h3>
              </div>
              <div className="p-3 bg-secondary-container/30 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-secondary">security</span>
              </div>
            </div>
            <p className="text-on-surface-variant leading-relaxed mb-4 text-xs font-medium">SSO, 2FA, and Audit Logging enabled for all administrative roles.</p>
            <button 
              onClick={handleRunCompliance}
              className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none text-xs p-0"
            >
              Run Compliance Scan
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">AI Operations</p>
                <h3 className="text-3xl font-black text-primary mt-1">12.8k<span className="text-xs font-semibold text-on-surface-variant">/50k</span></h3>
              </div>
              <div className="p-3 bg-tertiary-container/10 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-on-tertiary-container">auto_awesome</span>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant mb-2 font-bold">Gemini Credits Used (Monthly)</p>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '25%' }}></div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-3 font-bold">Resetting in 12 days</p>
          </div>
        </div>

        {/* Bento Grid: Department & User High Density Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter text-xs font-semibold">
          {/* Academic Departments */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-primary/5 shadow-sm overflow-hidden text-left flex flex-col justify-between">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/30">
              <div>
                <h4 className="font-bold text-primary text-sm uppercase tracking-wider">Academic Departments</h4>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Managing 20 departments &amp; placement coordinators</p>
              </div>
              
              <button 
                onClick={() => showToast('Filtering departments list...', 'info')}
                className="p-1.5 hover:bg-surface-container rounded-full transition-all cursor-pointer bg-transparent border-none flex"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-base">filter_list</span>
              </button>
            </div>
            
            <div className="overflow-x-auto h-[320px] custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white shadow-sm z-10 font-bold uppercase text-[9px] tracking-wider text-on-surface-variant border-b border-outline-variant/10">
                  <tr>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Head (HOD)</th>
                    <th className="px-6 py-3 text-center">Placed</th>
                    <th className="px-6 py-3">Readiness</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 font-semibold text-xs">
                  {depts.map((dept, index) => (
                    <tr key={index} className="hover:bg-primary-container/5 transition-colors">
                      <td className="px-6 py-2.5 font-bold text-primary">{dept.name}</td>
                      <td className="px-6 py-2.5 text-on-surface-variant">{dept.hod}</td>
                      <td className="px-6 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-black uppercase">
                          {dept.placed}
                        </span>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-surface-container rounded-full h-1 overflow-hidden shrink-0">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${dept.readiness}%` }}></div>
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-bold">{dept.readiness}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-2.5 text-right">
                        <button 
                          onClick={() => showToast(`Modifying ${dept.name} parameters...`, 'info')}
                          className="text-on-surface-variant hover:text-primary transition-all cursor-pointer bg-transparent border-none flex"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Placement Team Sidebar */}
          <div className="bg-white rounded-xl border border-primary/5 shadow-sm flex flex-col overflow-hidden text-left h-[400px]">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <h4 className="font-bold text-primary text-sm uppercase tracking-wider">Placement Team</h4>
              
              <button 
                onClick={() => showToast('Opening add new member interface...', 'info')}
                className="text-primary hover:bg-primary-container/10 p-1.5 rounded-full transition-all cursor-pointer bg-transparent border-none flex"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
              </button>
            </div>
            
            <div className="p-4 space-y-3 flex-grow overflow-y-auto custom-scrollbar">
              {team.map((person, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0 font-semibold text-xs text-left">
                      <p className="font-bold text-on-surface truncate leading-tight">{person.name}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">{person.role}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${person.active ? 'bg-green-500' : 'bg-outline-variant'}`}></div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => showToast('Opening administrative users checklist...', 'info')}
              className="mt-auto p-4 w-full text-xs font-bold text-primary bg-primary-container/5 hover:bg-primary-container/10 border-t border-outline-variant/10 cursor-pointer border-none"
            >
              Manage All 25 Roles
            </button>
          </div>
        </div>

        {/* AI Configuration Section */}
        <div className="bg-white rounded-xl border border-primary/5 shadow-sm overflow-hidden text-left text-xs font-semibold">
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-tertiary p-2 bg-tertiary-container/10 rounded-lg">auto_awesome</span>
                <h4 className="font-bold text-tertiary text-sm uppercase tracking-wider">Gemini AI Configuration</h4>
              </div>
              
              <p className="text-on-surface-variant leading-relaxed mb-6 font-medium">
                Fine-tune the intelligence driving your placement portal. Adjust parameters for resume scoring, AI-powered interview feedback, and automated student readiness benchmarks.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                  <div>
                    <p className="font-bold">Resume Analysis Sensitivity ({resumeSensitivity}%)</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Higher values prioritize industry keywords</p>
                  </div>
                  
                  <input 
                    value={resumeSensitivity}
                    onChange={(e) => {
                      setResumeSensitivity(Number(e.target.value));
                      showToast(`Sensitivity set to: ${e.target.value}%`, 'info');
                    }}
                    className="accent-primary w-32 cursor-pointer" 
                    type="range"
                    min="10"
                    max="100"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                  <div>
                    <p className="font-bold">Auto-Eligibility Screening</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Automatically reject profiles below 60% match</p>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      checked={autoScreening}
                      onChange={(e) => {
                        setAutoScreening(e.target.checked);
                        showToast(`Screening checks ${e.target.checked ? 'ENABLED' : 'disabled'}.`, 'info');
                      }}
                      className="sr-only peer" 
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="relative h-56 rounded-2xl overflow-hidden bg-primary text-white flex items-center justify-center p-6 shadow-md">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg height="100%" width="100%"><pattern height="20" id="ai-grid" patternUnits="userSpaceOnUse" width="20"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"></path></pattern><rect fill="url(#ai-grid)" height="100%" width="100%"></rect></svg>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="text-2xl font-black text-primary-fixed mb-1">Operational</div>
                <p className="text-primary-fixed-dim text-[10px] font-bold">Global AI latency: 142ms</p>
                
                <div className="mt-6 flex justify-center gap-4 text-xs font-semibold">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center min-w-24">
                    <div className="text-lg font-black text-white">4.2M</div>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider font-extrabold mt-0.5">Tokens/day</div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center min-w-24">
                    <div className="text-lg font-black text-white">99.8%</div>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider font-extrabold mt-0.5">Success</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Integrations */}
        <div className="space-y-6 text-left text-xs font-semibold">
          <h4 className="font-bold text-primary text-sm uppercase tracking-wider">Connected Integrations</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter font-bold text-xs">
            {/* Integration 1 */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center shadow-sm">
              <div className="w-12 h-12 mb-4 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#4285F4] text-2xl">event_available</span>
              </div>
              <h5 className="font-bold text-primary text-xs">Google Workspace</h5>
              <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-normal">Synced with Calendar</p>
              
              <button 
                onClick={() => {
                  setGoogleConnected(prev => !prev);
                  showToast(`Google Workspace ${!googleConnected ? 'CONNECTED' : 'DISCONNECTED'}`, 'info');
                }}
                className={`mt-4 px-3 py-1 rounded text-[9px] font-black uppercase border-none cursor-pointer transition-colors ${
                  googleConnected ? 'bg-green-100 text-green-700' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {googleConnected ? 'Connected' : 'Connect'}
              </button>
            </div>

            {/* Integration 2 */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center shadow-sm">
              <div className="w-12 h-12 mb-4 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#0077B5] text-2xl">account_circle</span>
              </div>
              <h5 className="font-bold text-primary text-xs">LinkedIn Talent</h5>
              <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-normal">Profile Auto-fill active</p>
              
              <button 
                onClick={() => {
                  setLinkedinConnected(prev => !prev);
                  showToast(`LinkedIn Talent API ${!linkedinConnected ? 'CONNECTED' : 'DISCONNECTED'}`, 'info');
                }}
                className={`mt-4 px-3 py-1 rounded text-[9px] font-black uppercase border-none cursor-pointer transition-colors ${
                  linkedinConnected ? 'bg-green-100 text-green-700' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {linkedinConnected ? 'Connected' : 'Connect'}
              </button>
            </div>

            {/* Integration 3 */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center shadow-sm group hover:border-primary transition-all">
              <div className="w-12 h-12 mb-4 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-2xl">hub</span>
              </div>
              <h5 className="font-bold text-primary text-xs">Enterprise ERP</h5>
              <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-normal">Student academic sync</p>
              
              <button 
                onClick={() => showToast('Opening ERP endpoints configurator...', 'info')}
                className="mt-4 px-3 py-1 rounded bg-surface-container text-on-surface-variant text-[9px] font-black uppercase border-none cursor-pointer hover:bg-outline-variant transition-colors"
              >
                Configure
              </button>
            </div>

            {/* Integration 4 */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center shadow-sm group hover:border-primary transition-all">
              <div className="w-12 h-12 mb-4 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-2xl">video_camera_front</span>
              </div>
              <h5 className="font-bold text-primary text-xs">Microsoft Teams</h5>
              <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-normal">Interview scheduling</p>
              
              <button 
                onClick={() => showToast('Opening MS Teams OAuth setup dialog...', 'info')}
                className="mt-4 px-3 py-1 rounded bg-surface-container text-on-surface-variant text-[9px] font-black uppercase border-none cursor-pointer hover:bg-outline-variant transition-colors"
              >
                Setup
              </button>
            </div>
          </div>
        </div>

        {/* Activity Log & Branding */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter text-xs font-semibold text-left">
          {/* Activity Log */}
          <div className="bg-white p-8 rounded-xl border border-primary/5 shadow-sm text-left">
            <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-6">Recent System Activity</h4>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0 ring-4 ring-primary/10"></div>
                <div>
                  <p className="font-bold text-on-surface">Dr. Sarah Jenkins updated <strong>Placement Policy v4.2</strong></p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">2 hours ago • Security Audit: Passed</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-outline-variant shrink-0"></div>
                <div>
                  <p className="font-bold text-on-surface">System automated backup completed successfully</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">5 hours ago • Cloud Storage: AWS East</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0 ring-4 ring-primary/10"></div>
                <div>
                  <p className="font-bold text-on-surface">New Department added: <strong>Data Science &amp; ML</strong></p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Yesterday • Created by Admin</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-red-600 shrink-0 ring-4 ring-red-100"></div>
                <div>
                  <p className="font-bold text-on-surface">Failed Login Attempt: <strong>IP 192.168.1.1</strong></p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">2 days ago • Triggered security lockout</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => showToast('Opening compliance audit trails database...', 'info')}
              className="mt-8 text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0"
            >
              View Full Audit Log
            </button>
          </div>

          {/* Institutional Branding */}
          <div className="bg-white p-8 rounded-xl border border-primary/5 shadow-sm text-left font-semibold text-xs">
            <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-6">Institutional Branding</h4>
            
            <div className="space-y-6">
              <div>
                <p className="font-bold mb-3">University Logo</p>
                <div className="flex items-center gap-6">
                  <div 
                    onClick={() => showToast('Choose custom PNG logo file to upload...', 'info')}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-low cursor-pointer hover:border-primary transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined mb-1.5 text-base">upload</span>
                    <span className="text-[9px] uppercase font-black tracking-wider">Upload</span>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-outline-variant/10">
                    <div className="h-10 w-24 bg-primary text-white flex items-center justify-center font-black rounded text-[10px] shadow-inner font-sans uppercase">
                      CareerBridge
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold mb-2">Primary Color</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-md shrink-0" style={{ backgroundColor: primaryColor }}></div>
                    <input 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="bg-surface-container-low border-none rounded-lg font-mono text-[10px] w-full px-2 py-1.5 outline-none font-bold" 
                      type="text"
                    />
                  </div>
                </div>
                
                <div>
                  <p className="font-bold mb-2">Secondary Color</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-md shrink-0" style={{ backgroundColor: secondaryColor }}></div>
                    <input 
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="bg-surface-container-low border-none rounded-lg font-mono text-[10px] w-full px-2 py-1.5 outline-none font-bold" 
                      type="text"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/10 text-xs">
                <p className="font-bold mb-3">Document Templates</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => showToast('Opening offer letter template editor...', 'info')}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface-variant flex items-center justify-center hover:bg-surface-container transition-all cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined mr-2 text-[18px]">description</span> Offer Letters
                  </button>
                  <button 
                    onClick={() => showToast('Opening certificate layout tools...', 'info')}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface-variant flex items-center justify-center hover:bg-surface-container transition-all cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined mr-2 text-[18px]">verified</span> Certificates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Compliance */}
        <div className="bg-primary text-white p-8 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden text-left text-xs font-semibold">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            <h4 className="text-lg font-black mb-2">Regulatory Compliance &amp; Tracking</h4>
            <p className="text-primary-fixed-dim leading-relaxed max-w-xl font-medium">
              Your institutional data is NAAC/NBA ready. All placement statistics and departmental audit trails are cryptographically signed and archived for the 2024-25 cycle.
            </p>
          </div>
          
          <div className="flex gap-6 shrink-0 relative z-10 text-center font-bold">
            <div>
              <div className="text-xl font-black">NAAC</div>
              <div className="text-[9px] uppercase tracking-widest text-primary-fixed mt-1">Status: A++</div>
            </div>
            
            <div className="w-[1px] h-10 bg-white/20"></div>
            
            <div>
              <div className="text-xl font-black">NBA</div>
              <div className="text-[9px] uppercase tracking-widest text-primary-fixed mt-1">Accredited</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversitySettings;
