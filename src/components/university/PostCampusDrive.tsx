import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface PostCampusDriveProps {
  onCancel: () => void;
  onPublish: (driveData: any) => void;
}

export const PostCampusDrive: React.FC<PostCampusDriveProps> = ({ onCancel, onPublish }) => {
  const { showToast } = useToast();

  // Form field state synced with summary preview
  const [companyName, setCompanyName] = useState('Google Cloud');
  const [jobTitle, setJobTitle] = useState('Software Development Engineer Intern');
  const [minSalary, setMinSalary] = useState('18');
  const [maxSalary, setMaxSalary] = useState('24');
  const [openings, setOpenings] = useState('50');
  const [minCgpa, setMinCgpa] = useState(7.5);
  const [industry, setIndustry] = useState('Technology');
  const [website, setWebsite] = useState('https://cloud.google.com');
  const [location, setLocation] = useState('Mountain View, CA');
  const [recruiterName, setRecruiterName] = useState('Sarah Jenkins');
  const [recruiterEmail, setRecruiterEmail] = useState('sarah.jenkins@google.com');
  const [jobDescription, setJobDescription] = useState('');

  // Department Chips list
  const [depts, setDepts] = useState<string[]>(['CS', 'IT', 'ECE']);
  // Skills list
  const [skills, setSkills] = useState<string[]>(['Java', 'Data Structures', 'Algorithms']);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Recruitment Stages
  const [stages, setStages] = useState([
    { id: '1', title: 'Resume Screening', desc: 'Initial automated filter based on eligibility' },
    { id: '2', title: 'Online Assessment', desc: 'Aptitude, Verbal, and Logic reasoning' },
    { id: '3', title: 'Coding Test', desc: '2 Coding problems (Easy-Medium)' }
  ]);

  // Temporary additions helpers
  const handleAddDept = () => {
    const newDept = window.prompt("Enter department code (e.g. MECH, EE, BT):");
    if (newDept && newDept.trim()) {
      const code = newDept.trim().toUpperCase();
      if (!depts.includes(code)) {
        setDepts(prev => [...prev, code]);
        showToast(`Department ${code} added to eligible list.`, 'success');
      }
    }
  };

  const handleRemoveDept = (deptCode: string) => {
    setDepts(prev => prev.filter(d => d !== deptCode));
    showToast(`Removed department ${deptCode}`, 'info');
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newSkillInput.trim()) {
        const skill = newSkillInput.trim();
        if (!skills.includes(skill)) {
          setSkills(prev => [...prev, skill]);
          setNewSkillInput('');
          showToast(`Skill '${skill}' added.`, 'success');
        }
      }
    }
  };

  const handleAddStage = () => {
    const title = window.prompt("Enter stage name:");
    const desc = window.prompt("Enter brief description of this evaluation round:");
    if (title && title.trim()) {
      const newStage = {
        id: String(Date.now()),
        title: title.trim(),
        desc: (desc && desc.trim()) || 'Evaluation criteria round'
      };
      setStages(prev => [...prev, newStage]);
      showToast(`Recruitment Stage '${title}' appended.`, 'success');
    }
  };

  const handleRemoveStage = (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id));
    showToast('Recruitment stage removed.', 'info');
  };

  // Submit Publish trigger
  const handlePublish = () => {
    // Validate
    if (!companyName.trim()) {
      showToast('Validation Error: Company Name is required.', 'error');
      return;
    }
    if (!jobTitle.trim()) {
      showToast('Validation Error: Job Title is required.', 'error');
      return;
    }

    const driveData = {
      id: String(Date.now()),
      company: companyName,
      logo: companyName[0],
      tier: 'Tier 1 Partner',
      role: jobTitle,
      depts: depts.join(', '),
      registered: `0 / ${openings}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      package: `$${minSalary}k - $${maxSalary}k`,
      status: 'Open',
      statusColor: 'bg-yellow-100 text-yellow-700'
    };

    onPublish(driveData);
    showToast('Campus recruitment drive successfully published and announced to eligible students!', 'success');
  };

  return (
    <div className="w-full text-left">
      {/* Navigation Breadcrumb & Title */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-stack-lg">
        <div>
          <nav className="flex items-center gap-2 text-xs font-bold text-on-surface-variant mb-2 font-sans uppercase tracking-wider">
            <span className="cursor-pointer hover:text-primary" onClick={onCancel}>Campus Drives</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-black">New Post</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Post New Campus Drive</h2>
          <p className="text-body-md text-sm text-on-surface-variant mt-1">Create and publish a new campus recruitment drive for students.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold shrink-0">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container transition-colors font-bold cursor-pointer bg-white"
          >
            Cancel
          </button>
          
          <button 
            onClick={() => showToast('Draft saved successfully.', 'success')}
            className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container transition-colors font-bold cursor-pointer bg-white"
          >
            Save Draft
          </button>
          
          <button 
            onClick={() => showToast('Scheduled drive configuration for late post publication.', 'success')}
            className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container transition-colors font-bold flex items-center gap-2 cursor-pointer bg-white"
          >
            <span className="material-symbols-outlined text-sm">schedule</span>
            Schedule
          </button>
          
          <button 
            onClick={handlePublish}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:opacity-90 transition-all font-black shadow-sm flex items-center gap-2 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            Publish Drive
          </button>
        </div>
      </div>

      {/* Form Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start text-xs font-semibold text-left">
        
        {/* Left Column: Form Fields */}
        <div className="xl:col-span-8 space-y-stack-lg">
          
          {/* Section 1: Company Information */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                <span className="material-symbols-outlined text-lg">business</span>
              </div>
              <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Company Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 leading-relaxed">
              <div 
                onClick={() => showToast('Uploading custom company banner assets...', 'info')}
                className="md:col-span-2 flex items-center gap-5 p-4 border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-outline-variant/20 shrink-0 font-bold text-primary text-xs">
                  LOGO
                </div>
                <div>
                  <p className="font-bold text-primary text-xs">Company Logo</p>
                  <p className="text-[10px] text-outline mt-0.5">Click to upload or drag and drop. SVG, PNG, JPG (max. 800x400px)</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Company Name</label>
                <input 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  type="text" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Industry</label>
                <select 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer outline-none"
                >
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Manufacturing</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Website</label>
                <input 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  placeholder="https://cloud.google.com" 
                  type="url" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Location</label>
                <input 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  type="text" 
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-on-surface-variant font-bold">Company Description</label>
                <textarea 
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-3 text-xs font-semibold resize-none outline-none" 
                  placeholder="Enter a brief overview of the company culture, mission and values..." 
                  rows={4}
                />
              </div>
              
              <div className="h-[1px] bg-outline-variant/20 md:col-span-2 my-1"></div>
              
              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Recruiter Name</label>
                <input 
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  type="text" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Recruiter Email</label>
                <input 
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  placeholder="sarah.jenkins@google.com" 
                  type="email" 
                />
              </div>
            </div>
          </section>

          {/* Section 2: Job Details */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-lg">work</span>
              </div>
              <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Job Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 leading-relaxed">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-on-surface-variant font-bold">Job Title</label>
                <input 
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  type="text" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Employment Type</label>
                <select className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer outline-none">
                  <option>Internship + PPO</option>
                  <option>Full Time</option>
                  <option>Internship Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Work Mode</label>
                <select className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer outline-none">
                  <option>Hybrid</option>
                  <option>On-site</option>
                  <option>Remote</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Number of Openings</label>
                <input 
                  value={openings}
                  onChange={(e) => setOpenings(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  type="number" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Office Location</label>
                <input 
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  type="text" 
                  defaultValue="Bangalore/Hyderabad"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Salary CTC range min (k)</label>
                <input 
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  type="number" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-bold">Salary CTC range max (k)</label>
                <input 
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-semibold" 
                  type="number" 
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-on-surface-variant font-bold">Job Description</label>
                <div className="border border-outline-variant/40 rounded-xl overflow-hidden font-bold">
                  <div className="bg-surface-container px-4 py-2 flex items-center gap-2 border-b border-outline-variant/20">
                    <button type="button" onClick={() => showToast('Text Bold', 'info')} className="p-1 hover:bg-surface-container-highest rounded bg-transparent border-none cursor-pointer flex text-primary"><span className="material-symbols-outlined text-base">format_bold</span></button>
                    <button type="button" onClick={() => showToast('Text Italic', 'info')} className="p-1 hover:bg-surface-container-highest rounded bg-transparent border-none cursor-pointer flex text-primary"><span className="material-symbols-outlined text-base">format_italic</span></button>
                    <button type="button" onClick={() => showToast('Bullet List', 'info')} className="p-1 hover:bg-surface-container-highest rounded bg-transparent border-none cursor-pointer flex text-primary"><span className="material-symbols-outlined text-base">format_list_bulleted</span></button>
                  </div>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full bg-surface-bright border-none p-4 text-xs font-semibold resize-none outline-none" 
                    placeholder="Outline responsibilities, daily tasks, and role expectations..." 
                    rows={6}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Eligibility */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">
                <span className="material-symbols-outlined text-lg">fact_check</span>
              </div>
              <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Eligibility &amp; Requirements</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 leading-relaxed">
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-on-surface-variant font-bold">Eligible Departments</label>
                  <div className="flex flex-wrap gap-1.5 mt-1 font-bold">
                    {depts.map((d) => (
                      <span key={d} className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] border border-secondary-container flex items-center gap-1.5 uppercase font-black">
                        {d}
                        <button type="button" onClick={() => handleRemoveDept(d)} className="bg-transparent border-none cursor-pointer flex p-0 shrink-0">
                          <span className="material-symbols-outlined text-xs hover:text-red-600">close</span>
                        </button>
                      </span>
                    ))}
                    
                    <button 
                      type="button" 
                      onClick={handleAddDept}
                      className="px-3 py-1 border border-primary text-primary rounded-full text-[10px] flex items-center gap-1 hover:bg-primary-fixed/20 transition-colors cursor-pointer bg-white"
                    >
                      + Add Dept
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-on-surface-variant font-bold">Programs</label>
                    <div className="flex flex-col gap-2 font-bold text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input defaultChecked className="rounded text-primary focus:ring-primary w-4 h-4 shrink-0" type="checkbox" />
                        <span>B.Tech</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input defaultChecked className="rounded text-primary focus:ring-primary w-4 h-4 shrink-0" type="checkbox" />
                        <span>M.Tech</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-on-surface-variant font-bold">Target Batch</label>
                    <select className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer outline-none">
                      <option>2024</option>
                      <option>2025</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cut-off criteria */}
              <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 space-y-4">
                <p className="font-bold text-primary">Academic Cut-off</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-[10px] text-on-surface-variant font-bold">Min. CGPA</label>
                      <span className="font-bold text-primary">{minCgpa}</span>
                    </div>
                    <input 
                      value={minCgpa}
                      onChange={(e) => {
                        setMinCgpa(Number(e.target.value));
                        showToast(`Min CGPA requirement set to: ${e.target.value}`, 'info');
                      }}
                      className="w-full h-1.5 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary" 
                      max="10" 
                      min="0" 
                      step="0.1" 
                      type="range" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-on-surface-variant font-bold">Max Backlogs</label>
                      <input className="w-full bg-surface-bright border border-outline-variant/40 rounded-lg px-3 py-1.5 font-bold" type="number" defaultValue={0} />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-on-surface-variant font-bold">Min. Attendance</label>
                      <input className="w-full bg-surface-bright border border-outline-variant/40 rounded-lg px-3 py-1.5 font-bold" type="text" defaultValue="75%" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              <div className="md:col-span-3 space-y-2">
                <label className="text-on-surface-variant font-bold">Required Skills</label>
                <div className="flex flex-wrap gap-1.5 font-bold">
                  {skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="px-4 py-1.5 bg-primary-fixed/30 text-primary-container rounded-lg border border-primary/10 flex items-center gap-1.5"
                    >
                      {skill}
                      <button 
                        type="button" 
                        onClick={() => {
                          setSkills(prev => prev.filter(s => s !== skill));
                          showToast(`Skill '${skill}' removed.`, 'info');
                        }}
                        className="bg-transparent border-none cursor-pointer flex p-0"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  ))}
                  
                  <input 
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    className="border-none bg-transparent p-1 focus:ring-0 w-24 text-xs font-semibold outline-none" 
                    placeholder="+ Add Skill" 
                    type="text" 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Recruitment Process */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-primary/5">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined text-lg">account_tree</span>
                </div>
                <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Recruitment Process</h3>
              </div>
              
              <button 
                type="button"
                onClick={handleAddStage}
                className="px-4 py-2 text-primary border border-primary/20 rounded-xl font-bold hover:bg-primary-fixed/10 flex items-center gap-2 cursor-pointer bg-white"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add Stage
              </button>
            </div>

            <div className="space-y-3 font-semibold text-xs text-left">
              {stages.map((stage, index) => (
                <div 
                  key={stage.id}
                  className="flex items-center gap-4 p-4 bg-white border border-outline-variant/30 rounded-xl group hover:border-primary/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-outline-variant cursor-grab">drag_indicator</span>
                  
                  <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center font-black text-xs text-on-surface-variant shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-primary leading-normal">{stage.title}</p>
                    <p className="text-[10px] text-outline font-medium mt-0.5 leading-normal truncate">{stage.desc}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const newTitle = window.prompt("Modify Stage title:", stage.title);
                      if (newTitle && newTitle.trim()) {
                        setStages(prev => prev.map(s => s.id === stage.id ? { ...s, title: newTitle.trim() } : s));
                        showToast('Stage description updated.', 'success');
                      }
                    }}
                    className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer flex"
                  >
                    <span className="material-symbols-outlined text-sm text-outline">edit</span>
                  </button>
                  
                  <button 
                    onClick={() => handleRemoveStage(stage.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-error bg-transparent border-none cursor-pointer flex"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: AI Assistant Panel */}
          <section className="bg-primary text-white rounded-2xl p-8 shadow-sm relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform pointer-events-none">
              <span className="material-symbols-outlined text-8xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            
            <div className="relative z-10 text-xs">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-secondary-fixed">auto_awesome</span>
                <h3 className="font-bold text-secondary-fixed text-sm uppercase tracking-wider">CareerBridge Intelligence</h3>
                <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-primary-fixed text-primary px-2 py-0.5 rounded-full">AI Analysis</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-bold text-xs">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5 text-left">
                  <p className="text-[10px] opacity-80 mb-1 font-bold">Eligible Students</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-xl font-black">~1,250</span>
                    <span className="text-[10px] text-green-300 flex items-center gap-0.5 font-bold mb-0.5">
                      <span className="material-symbols-outlined text-xs">trending_up</span>+12%
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5 text-left">
                  <p className="text-[10px] opacity-80 mb-1 font-bold">Expected Registrations</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-xl font-black">~800</span>
                    <span className="text-[9px] opacity-60 font-bold mb-0.5">Est. Conversion 64%</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5 text-left">
                  <p className="text-[10px] opacity-80 mb-1 font-bold">AI Confidence Score</p>
                  <div className="flex items-end gap-2 mt-1 w-full justify-between">
                    <span className="text-xl font-black shrink-0">94%</span>
                    <div className="w-16 h-1 bg-white/20 rounded-full mb-1 overflow-hidden shrink-0">
                      <div className="h-full bg-green-400 w-[94%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 font-bold">
                <p className="mb-4 flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-sm">insights</span> Department Readiness &amp; Skill Gap</p>
                
                <div className="space-y-3 font-bold text-[10px]">
                  <div className="flex items-center gap-4">
                    <span className="w-8 shrink-0 text-left">CS</span>
                    <div className="flex-grow h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-primary-fixed w-[88%]"></div>
                    </div>
                    <span className="w-10 shrink-0 text-right">88% (High)</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="w-8 shrink-0 text-left">IT</span>
                    <div className="flex-grow h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-primary-fixed w-[72%]"></div>
                    </div>
                    <span className="w-10 shrink-0 text-right">72% (Med)</span>
                  </div>
                </div>
                
                <p className="mt-6 text-xs opacity-90 leading-relaxed italic border-l-2 border-primary-fixed pl-4 font-medium text-surface-container">
                  "The proposed package (${minSalary}k - ${maxSalary}k) is in the top 5th percentile for 2024 graduates. Expected high competition for the {openings} slots."
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar: Summary Preview & Checks */}
        <div className="xl:col-span-4 space-y-6 text-xs font-semibold text-left lg:sticky lg:top-24">
          
          {/* Drive Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5 text-left">
            <h4 className="font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
              <span className="material-symbols-outlined text-xl">summarize</span>
              Drive Summary
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-primary border border-outline-variant/10 text-xs shrink-0">
                  {companyName[0] || 'C'}
                </div>
                <div>
                  <p className="text-[10px] text-outline font-bold">Company</p>
                  <p className="font-bold text-primary text-xs leading-normal">{companyName || 'Google Cloud'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <div className="p-3 bg-surface-bright rounded-xl border border-outline-variant/10 min-w-0">
                  <p className="text-[9px] uppercase text-outline font-bold mb-1">Role</p>
                  <p className="text-primary truncate text-xs leading-normal">{jobTitle || 'SDE Intern'}</p>
                </div>
                
                <div className="p-3 bg-surface-bright rounded-xl border border-outline-variant/10 min-w-0">
                  <p className="text-[9px] uppercase text-outline font-bold mb-1">CTC Range</p>
                  <p className="text-primary truncate text-xs leading-normal">${minSalary}k - ${maxSalary}k</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 font-bold text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Eligible Students</span>
                  <span className="font-bold text-primary">~1,250</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Selection Stages</span>
                  <span className="font-bold text-primary">{stages.length} Stages</span>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5 text-left text-xs font-semibold">
            <h4 className="font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
              <span className="material-symbols-outlined text-xl">task_alt</span>
              Validation &amp; Checklist
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 font-bold leading-relaxed">
                <span className="material-symbols-outlined text-lg shrink-0 text-red-600">error</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase">Missing Required Fields</p>
                  <p className="text-[10px] font-medium mt-0.5">Registration Close Date must be set before publishing.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-secondary bg-secondary-container/10 p-3 rounded-lg border border-secondary-container/20 font-bold leading-relaxed">
                <span className="material-symbols-outlined text-lg shrink-0 text-secondary">warning</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase text-secondary">Schedule Conflict</p>
                  <p className="text-[10px] font-medium text-outline mt-0.5">Oct 12th has 2 other drives scheduled concurrently.</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 font-bold text-xs text-on-surface-variant">
                <p className="text-[10px] font-black uppercase text-outline mb-2">Documents Required</p>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border border-outline-variant flex items-center justify-center group-hover:border-primary transition-colors bg-white">
                    <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                  <span>JD PDF Uploaded</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border border-outline-variant flex items-center justify-center group-hover:border-primary transition-colors bg-white"></div>
                  <span>Company PPT (Optional)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border border-outline-variant flex items-center justify-center group-hover:border-primary transition-colors bg-white"></div>
                  <span>Eligibility Sheet (Mandatory)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Timeline Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5 text-left text-xs font-semibold">
            <h4 className="font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
              <span className="material-symbols-outlined text-xl">calendar_month</span>
              Timeline Preview
            </h4>
            
            <div className="space-y-6 relative pl-3 font-bold text-xs">
              <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-outline-variant/20"></div>
              
              <div className="relative flex gap-4">
                <div className="z-10 w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-4 ring-primary/10">
                  <span className="material-symbols-outlined text-[10px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <div>
                  <p className="font-bold text-primary leading-none text-xs">Registration Opens</p>
                  <p className="text-[10px] text-outline font-medium mt-1 font-sans">Oct 01, 2026 • 09:00 AM</p>
                </div>
              </div>

              <div className="relative flex gap-4">
                <div className="z-10 w-5 h-5 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                </div>
                <div>
                  <p className="font-bold text-primary leading-none text-xs">Registration Closes</p>
                  <p className="text-[10px] text-outline font-medium mt-1 font-sans">Oct 10, 2026 • 11:59 PM</p>
                </div>
              </div>

              <div className="relative flex gap-4 opacity-50">
                <div className="z-10 w-5 h-5 rounded-full bg-surface-container-highest border border-outline-variant/30"></div>
                <div>
                  <p className="font-bold text-on-surface leading-none text-xs">Drive Commencement</p>
                  <p className="text-[10px] text-outline font-medium mt-1 font-sans">Oct 12, 2026</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => showToast('Redirecting to full drives calendar schedules...', 'info')}
              className="w-full mt-6 py-2.5 text-primary border border-primary/10 bg-primary/5 rounded-xl font-bold hover:bg-primary/10 transition-all cursor-pointer"
            >
              Full Calendar View
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PostCampusDrive;
