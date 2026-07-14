import React from 'react';
import { useToast } from '../../contexts/ToastContext';

interface StudentProfileProps {
  studentId: string;
  onBack: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ studentId, onBack }) => {
  const { showToast } = useToast();

  // Mock details for Arjun Sharma (matching studentId === '1')
  const arjunDetails = {
    name: 'Arjun Sharma',
    regNo: '2021CS045',
    course: 'B.Tech Computer Science',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASvjcBejTYOqC4t97fA3u2JZ8c8RRkCHJGsbz-lPjvG1IXdVMELGmc9IdbR70myDSiRrhrSGsI5zl3OD4dMXViLajRJWe-wtX70Dc0WOAR1ThxY2kKBcvQLVI5MJPePIhrpTO1VNGMBXpRTTijg_32qWVL6y3IidtjKYcn3WFhyXxbrhVd8L394V9wf47DMyxt1d_FYY5b3b2S4CIt6smAG_Zqh3VAFcQbX3I4V0Upzz95LkUbwap-',
    status: 'Placed',
    cgpa: '9.2',
    aiReadiness: '88%',
    resumeScore: '94%',
    attendance: '95%',
    profileHealth: '100%',
    gradYear: '2025',
    skills: ['DS & ALGO', 'PYTHON', 'AWS']
  };

  const handleDownloadResume = () => {
    showToast(`Downloading ${arjunDetails.name}'s resume...`, 'success');
  };

  const handleContactStudent = () => {
    showToast(`Opening contact portal for ${arjunDetails.name}...`, 'info');
  };

  const handleExploreRoadmap = () => {
    showToast(`Generating custom AI engineering roadmap...`, 'success');
  };

  return (
    <div className="w-full text-left">
      {/* Back Button Action Bar */}
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-white hover:bg-surface-container-low border border-primary/10 rounded-lg text-primary text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Students Registry
        </button>
      </div>

      {/* Profile Header Section */}
      <section className="bento-card p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden bg-white rounded-2xl border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[120px] text-primary">school</span>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg shrink-0">
              <img 
                className="w-full h-full object-cover" 
                alt={arjunDetails.name} 
                src={arjunDetails.avatarUrl}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-lg shadow-md">
              <div className="bg-primary text-on-primary px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Placed
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="font-display text-headline-lg font-bold text-primary mb-1">{arjunDetails.name}</h2>
            <div className="flex flex-wrap gap-4 items-center text-xs font-semibold">
              <span className="text-outline">Reg No: <span className="text-on-surface font-extrabold">{arjunDetails.regNo} (ID: {studentId})</span></span>
              <div className="w-1 h-1 bg-outline-variant rounded-full"></div>
              <span className="text-outline">Course: <span className="text-on-surface font-extrabold">{arjunDetails.course}</span></span>
            </div>
            
            <div className="flex gap-3 mt-5 text-xs font-semibold">
              <button 
                onClick={handleDownloadResume}
                className="bg-primary text-on-primary px-4 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-95 transition-transform active:scale-95 border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download Resume
              </button>
              
              <button 
                onClick={handleContactStudent}
                className="bg-secondary-fixed text-on-secondary-container px-4 py-2.5 rounded-lg flex items-center gap-2 border border-primary/10 transition-transform active:scale-95 cursor-pointer bg-white"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                Contact Student
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto relative z-10 text-center">
          <div className="bg-surface-container-low p-4 rounded-xl min-w-[120px] border border-primary/5">
            <p className="text-[10px] font-bold text-outline mb-1 uppercase tracking-wider">CGPA</p>
            <p className="font-display text-2xl font-bold text-primary">{arjunDetails.cgpa}</p>
          </div>
          <div className="bg-primary-container p-4 rounded-xl min-w-[120px] border border-primary/20">
            <p className="text-[10px] font-bold text-primary-fixed mb-1 uppercase tracking-wider">AI Readiness</p>
            <p className="font-display text-2xl font-bold text-white">{arjunDetails.aiReadiness}</p>
          </div>
        </div>
      </section>

      {/* Main Layout: Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left & Center: Core Content */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* KPI Dashboard Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm border-l-4 border-l-primary">
              <p className="text-[10px] font-bold text-outline mb-1 uppercase tracking-wider">Resume Score</p>
              <div className="flex items-end justify-between mt-1">
                <h4 className="text-xl font-extrabold text-primary">{arjunDetails.resumeScore}</h4>
                <span className="text-primary text-lg material-symbols-outlined">trending_up</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm border-l-4 border-l-primary">
              <p className="text-[10px] font-bold text-outline mb-1 uppercase tracking-wider">Attendance</p>
              <div className="flex items-end justify-between mt-1">
                <h4 className="text-xl font-extrabold text-primary">{arjunDetails.attendance}</h4>
                <span className="text-primary text-lg material-symbols-outlined">event_available</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm border-l-4 border-l-secondary">
              <p className="text-[10px] font-bold text-outline mb-1 uppercase tracking-wider">Profile Health</p>
              <div className="flex items-end justify-between mt-1">
                <h4 className="text-xl font-extrabold text-primary">{arjunDetails.profileHealth}</h4>
                <span className="text-primary text-lg material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm border-l-4 border-l-secondary">
              <p className="text-[10px] font-bold text-outline mb-1 uppercase tracking-wider">Graduation</p>
              <div className="flex items-end justify-between mt-1">
                <h4 className="text-xl font-extrabold text-primary">{arjunDetails.gradYear}</h4>
                <span className="text-primary text-lg material-symbols-outlined">auto_stories</span>
              </div>
            </div>
          </div>

          {/* Academic & Readiness Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Academic Performance Graph */}
            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-primary">Academic Progress</h3>
                <span className="material-symbols-outlined text-outline text-lg">bar_chart</span>
              </div>
              
              <div className="h-48 w-full flex items-end justify-between gap-2 px-2">
                <div className="flex-grow bg-primary-container/10 rounded-t-lg relative group transition-all hover:bg-primary-container/20 cursor-pointer" style={{ height: '70%' }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-primary">8.4</div>
                </div>
                <div className="flex-grow bg-primary-container/20 rounded-t-lg relative group transition-all hover:bg-primary-container/30 cursor-pointer" style={{ height: '75%' }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-primary">8.7</div>
                </div>
                <div className="flex-grow bg-primary-container/40 rounded-t-lg relative group transition-all hover:bg-primary-container/50 cursor-pointer" style={{ height: '82%' }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-primary">9.0</div>
                </div>
                <div className="flex-grow bg-primary-container/60 rounded-t-lg relative group transition-all hover:bg-primary-container/70 cursor-pointer" style={{ height: '85%' }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-primary">9.1</div>
                </div>
                <div className="flex-grow bg-primary rounded-t-lg relative group transition-all cursor-pointer" style={{ height: '92%' }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-primary font-black">9.2</div>
                </div>
              </div>
              
              <div className="flex justify-between mt-4 text-[10px] font-bold text-outline px-1">
                <span>Semester 1</span><span>Semester 2</span><span>Semester 3</span><span>Semester 4</span><span>Semester 5</span>
              </div>
            </div>

            {/* Skills Radar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-primary">Skill Distribution</h3>
                <span className="material-symbols-outlined text-outline text-lg">radar</span>
              </div>
              
              <div className="relative h-48 w-full flex items-center justify-center">
                <div className="absolute inset-0 border border-outline-variant/20 rounded-full scale-100"></div>
                <div className="absolute inset-0 border border-outline-variant/20 rounded-full scale-75"></div>
                <div className="absolute inset-0 border border-outline-variant/20 rounded-full scale-50"></div>
                <div className="absolute w-full h-full flex items-center justify-center">
                  <svg className="w-32 h-32 text-primary" viewBox="0 0 100 100">
                    <polygon fill="currentColor" fillOpacity="0.15" points="50,10 90,40 75,90 25,90 10,40" stroke="currentColor" strokeWidth="1.5"></polygon>
                  </svg>
                </div>
                <div className="absolute top-1 text-[10px] font-extrabold text-outline">Logic</div>
                <div className="absolute bottom-1 text-[10px] font-extrabold text-outline">Cloud</div>
                <div className="absolute left-1 text-[10px] font-extrabold text-outline">Coding</div>
                <div className="absolute right-1 text-[10px] font-extrabold text-outline">Databases</div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 mt-4 text-[9px] font-bold text-on-secondary-container">
                {arjunDetails.skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 bg-secondary-container/40 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Career Timeline */}
          <div className="bg-white p-8 rounded-2xl border border-primary/5 shadow-sm text-left">
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-primary mb-8">Placement Journey</h3>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-outline-variant/30"></div>
              
              <div className="space-y-10 text-xs font-semibold">
                <div className="relative flex items-center gap-8 group">
                  <div className="absolute left-4 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/15 shrink-0 z-10"></div>
                  <div className="ml-10">
                    <span className="text-[10px] text-outline font-bold">Aug 2021</span>
                    <h5 className="font-bold text-primary mt-0.5">Registered at CareerBridge Portal</h5>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Computer Science Department (Roll No. 2021CS045)</p>
                  </div>
                </div>

                <div className="relative flex items-center gap-8">
                  <div className="absolute left-4 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/15 shrink-0 z-10"></div>
                  <div className="ml-10">
                    <span className="text-[10px] text-outline font-bold">Jan 2023</span>
                    <h5 className="font-bold text-primary mt-0.5">Industry Certification - AWS Cloud Practitioner</h5>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Scored 920/1000 in first attempt.</p>
                  </div>
                </div>

                <div className="relative flex items-center gap-8">
                  <div className="absolute left-4 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/15 shrink-0 z-10"></div>
                  <div className="ml-10">
                    <span className="text-[10px] text-outline font-bold">Jun 2024</span>
                    <h5 className="font-bold text-primary mt-0.5">Google SWE Internship</h5>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Remote 3-month internship in the Cloud infra team.</p>
                  </div>
                </div>

                <div className="relative flex items-center gap-8">
                  <div className="absolute left-4 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/15 shrink-0 z-10"></div>
                  <div className="ml-10">
                    <span className="text-[10px] text-outline font-bold">Nov 2024</span>
                    <h5 className="font-bold text-primary mt-0.5">Placement Secured at Microsoft</h5>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Final Offer Letter accepted (SDE-1 Role).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects & Achievements */}
          <div className="space-y-4 text-left">
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-primary px-2">Featured Projects &amp; Experience</h3>
            
            <div 
              onClick={() => showToast('Opening AI recruitment pipeline project details...', 'info')}
              className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary-container flex items-center justify-center rounded-xl shrink-0 text-primary">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary">AI-Driven Recruitment Pipeline</h4>
                  <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Automated resume parsing &amp; sentiment analysis for interview scoring.</p>
                  <div className="flex gap-2 mt-3 text-[9px] font-bold text-outline">
                    <span className="px-2 py-0.5 bg-surface-container rounded-full">Python</span>
                    <span className="px-2 py-0.5 bg-surface-container rounded-full">TensorFlow</span>
                    <span className="px-2 py-0.5 bg-surface-container rounded-full">React</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline">chevron_right</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary-container flex items-center justify-center rounded-xl shrink-0 text-primary">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary">Smart India Hackathon 2023 - Winner</h4>
                  <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Developed a blockchain-based land registry system for rural governance.</p>
                </div>
              </div>
              <button 
                onClick={() => showToast('Viewing Smart India hackathon certificate...', 'info')}
                className="text-primary text-[10px] font-bold underline cursor-pointer bg-transparent border-none shrink-0"
              >
                View Certificate
              </button>
            </div>
          </div>

          {/* Interview History Table */}
          <div className="bg-white rounded-2xl border border-primary/5 shadow-sm overflow-hidden text-left">
            <div className="p-6 border-b border-outline-variant/35 flex justify-between items-center text-xs font-bold">
              <h3 className="text-primary uppercase tracking-wider">Interview History</h3>
              <button 
                onClick={() => showToast('Loading full interview historical timeline...', 'info')}
                className="text-primary text-[10px] underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                Full History <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            </div>
            
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-surface-container-low text-on-surface-variant font-bold">
                <tr>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Round</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                <tr className="hover:bg-surface-container-low/20 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3 font-bold text-primary">
                    <div className="w-8 h-8 rounded bg-on-surface-variant/5 flex items-center justify-center font-black">G</div>
                    <span>Google</span>
                  </td>
                  <td className="px-6 py-4">Technical Round IV</td>
                  <td className="px-6 py-4 text-on-surface-variant">Oct 12, 2024</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-0.5 bg-secondary-container/40 text-on-secondary-container rounded-full text-[9px] font-black uppercase">COMPLETED</span>
                  </td>
                </tr>
                
                <tr className="hover:bg-surface-container-low/20 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3 font-bold text-primary">
                    <div className="w-8 h-8 rounded bg-on-surface-variant/5 flex items-center justify-center font-black">A</div>
                    <span>Amazon</span>
                  </td>
                  <td className="px-6 py-4">Managerial</td>
                  <td className="px-6 py-4 text-on-surface-variant">Sep 28, 2024</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-0.5 bg-secondary-container/40 text-on-secondary-container rounded-full text-[9px] font-black uppercase">COMPLETED</span>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-low/20 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3 font-bold text-primary">
                    <div className="w-8 h-8 rounded bg-on-surface-variant/5 flex items-center justify-center font-black">M</div>
                    <span>Microsoft</span>
                  </td>
                  <td className="px-6 py-4">Final HR Session</td>
                  <td className="px-6 py-4 text-on-surface-variant">Nov 02, 2024</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase">SELECTED</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-8 text-left text-xs font-semibold">
          {/* AI Insights Card */}
          <div className="bg-primary-container text-white rounded-2xl p-6 shadow-lg border border-primary/20 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-on-primary-container/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h3 className="font-bold text-primary-fixed uppercase tracking-wider text-[10px]">AI Career Advisor</h3>
              </div>
              <p className="leading-relaxed text-surface-container mb-4 text-xs font-medium">
                Based on Arjun's performance, he is in the top 2% for Backend Engineering. Next milestone recommendation:
              </p>
              <div className="bg-white/10 p-4 rounded-lg mb-6 border border-white/10 text-left">
                <p className="font-bold text-white text-xs">Advanced Distributed Systems</p>
                <p className="text-[9px] opacity-70 mt-0.5">Recommended Certification</p>
              </div>
              <button 
                onClick={handleExploreRoadmap}
                className="w-full bg-primary-fixed text-primary px-4 py-2.5 rounded-lg hover:bg-white transition-colors cursor-pointer border-none font-bold"
              >
                Explore Roadmap
              </button>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm text-left">
            <h3 className="font-bold text-primary mb-6 uppercase tracking-wider">Action Items</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 shrink-0 bg-surface-container-low rounded-lg flex flex-col items-center justify-center border border-outline-variant/30 text-center font-bold font-sans">
                  <span className="text-[9px] text-outline uppercase">DEC</span>
                  <span className="text-lg text-primary font-extrabold leading-none mt-0.5">05</span>
                </div>
                <div>
                  <h5 className="font-bold text-primary leading-normal">Final HR Session</h5>
                  <p className="text-[10px] text-outline font-medium mt-0.5">Direct Offer Clarification</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded uppercase">MANDATORY</span>
                </div>
              </div>

              <div className="flex gap-4 opacity-60">
                <div className="w-12 h-12 shrink-0 bg-surface-container-low rounded-lg flex flex-col items-center justify-center border border-outline-variant/30 text-center font-bold font-sans">
                  <span className="text-[9px] text-outline uppercase">DEC</span>
                  <span className="text-lg text-primary font-extrabold leading-none mt-0.5">08</span>
                </div>
                <div>
                  <h5 className="font-bold text-primary leading-normal">Alumni Meetup</h5>
                  <p className="text-[10px] text-outline font-medium mt-0.5">Optional Career Talk</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm text-left">
            <h3 className="font-bold text-primary mb-6 uppercase tracking-wider">Recent Activity</h3>
            <div className="space-y-6 text-xs font-semibold">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0"></div>
                <div>
                  <p className="text-primary font-bold">Resume updated</p>
                  <p className="text-[10px] text-outline font-medium">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0"></div>
                <div>
                  <p className="text-primary font-bold">Placement verified</p>
                  <p className="text-[10px] text-outline font-medium">Yesterday</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-outline-variant shrink-0"></div>
                <div>
                  <p className="text-primary font-bold">Skill badge: Python</p>
                  <p className="text-[10px] text-outline font-medium">3 days ago</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => showToast('Opening complete historical student profile logs...', 'info')}
              className="w-full mt-6 py-2 border border-outline-variant/30 rounded-lg text-outline hover:bg-surface-container-low transition-all cursor-pointer bg-transparent text-xs font-bold"
            >
              View All Activity
            </button>
          </div>

          {/* Documentation Quick Access */}
          <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm text-left">
            <h3 className="font-bold text-primary mb-4 uppercase tracking-wider">Quick Documents</h3>
            
            <div className="space-y-2">
              <div 
                onClick={handleDownloadResume}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline group-hover:text-primary">picture_as_pdf</span>
                  <span className="text-xs font-bold text-primary">Resume_Final_V2.pdf</span>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">visibility</span>
              </div>

              <div 
                onClick={() => showToast('Previewing Degree certificate...', 'info')}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline group-hover:text-primary">verified_user</span>
                  <span className="text-xs font-bold text-primary">Degree_Prov.pdf</span>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">visibility</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
