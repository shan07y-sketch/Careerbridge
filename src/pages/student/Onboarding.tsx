import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { isStudentOnboarded } from '../../utils/onboarding';

const OnboardingSuccess: React.FC<{ navigate: (path: string) => void; showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }> = ({ navigate, showToast }) => {
  const confettiContainerRef = useRef<HTMLDivElement>(null);

  const createConfetti = () => {
    const container = confettiContainerRef.current;
    if (!container) return;
    const colors = ['#023629', '#a1d1be', '#bcedd9', '#cfc6b0', '#655e4c'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-slow absolute';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-5vh';
      confetti.style.width = '8px';
      confetti.style.height = '8px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%';
      confetti.style.animationDelay = (Math.random() * 3) + 's';
      confetti.style.opacity = '0.7';
      container.appendChild(confetti);

      // Remove after animation
      setTimeout(() => confetti.remove(), 5000);
    }
  };

  useEffect(() => {
    createConfetti();
  }, []);

  return (
    <div className="bg-[#f9faf7] text-on-background min-h-screen flex flex-col justify-between text-left">
      <style>{`
        .confetti-slow {
            animation: confettiFall 4s linear infinite;
        }
        @keyframes confettiFall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        .fade-in {
            animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* TopNavBar */}
      <header className="bg-white dark:bg-surface-container shadow-[0_4px_20px_rgba(2,54,41,0.04)] sticky top-0 z-50">
        <nav className="flex justify-between items-center px-margin-desktop py-4 max-w-container-max mx-auto">
          <div className="text-headline-md font-headline-md font-bold text-primary dark:text-primary-fixed">
            CareerBridge
          </div>
          <div className="flex items-center gap-stack-md">
            <button 
              onClick={() => navigate('/auth')}
              className="font-label-md text-label-md px-4 py-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
            >
              Sign In
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center relative overflow-hidden px-margin-mobile md:px-0">
        <div className="fade-in max-w-2xl w-full text-center z-10 py-12">
          <div 
            onMouseEnter={createConfetti}
            className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:scale-110 transition-transform cursor-pointer"
          >
            <span className="text-6xl select-none">🎉</span>
          </div>
          
          <h1 className="font-display text-4xl font-bold text-primary mb-4">Welcome to CareerBridge!</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-lg mx-auto leading-relaxed">
            Your AI career profile is ready. We'll now personalize your dashboard using your academic profile, skills and career goals.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => navigate('/student/dashboard')}
              className="w-full md:w-auto bg-primary text-white px-8 py-4 rounded-xl font-bold text-xs hover:opacity-90 transform active:scale-95 transition-all duration-200 shadow-lg cursor-pointer border-none"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => navigate('/student/profile')}
              className="w-full md:w-auto bg-transparent border border-outline text-primary px-8 py-4 rounded-xl font-bold text-xs hover:bg-surface-container-low transition-colors duration-200 cursor-pointer"
            >
              Edit Profile
            </button>
          </div>

          {/* Profile Summary Preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm">
              <span className="material-symbols-outlined text-primary mb-2">school</span>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Academic</p>
              <p className="font-bold text-xs text-on-surface">Verified Profile</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm">
              <span className="material-symbols-outlined text-primary mb-2">bolt</span>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Skills</p>
              <p className="font-bold text-xs text-on-surface">12 Skills Mapped</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm">
              <span className="material-symbols-outlined text-primary mb-2">tour</span>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Goals</p>
              <p className="font-bold text-xs text-on-surface">Career Path Set</p>
            </div>
          </div>
        </div>

        {/* Decorative Confetti Layer */}
        <div ref={confettiContainerRef} className="absolute inset-0 pointer-events-none" id="confetti-container" />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-surface-container border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop py-6 max-w-container-max mx-auto text-xs text-on-surface-variant">
          <div className="mb-4 md:mb-0">
            © 2024 CareerBridge. All rights reserved.
          </div>
          <div className="flex gap-6">
            <span className="hover:text-primary cursor-pointer animate-none" onClick={() => navigate('/privacy')}>Privacy Policy</span>
            <span className="hover:text-primary cursor-pointer animate-none" onClick={() => navigate('/terms')}>Terms of Service</span>
            <span className="hover:text-primary cursor-pointer animate-none" onClick={() => showToast('Help center opened.', 'info')}>Help Center</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const Onboarding: React.FC = () => {
  const { updateUser, user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Already-onboarded students (saved degree/grad year/goal/skills in the
  // database) never see this wizard again — deep links, stale bookmarks and
  // the login redirect all land on the dashboard instead. Two exceptions:
  //  - a just-registered account arrives with { firstRun: true } navigation
  //    state (registration pre-fills degree/grad year, but interests, skills
  //    and career goal are still worth collecting once);
  //  - the guard only runs while the wizard is untouched (step 1) so finishing
  //    the flow isn't interrupted mid-way.
  const firstRun = (location.state as { firstRun?: boolean } | null)?.firstRun === true;
  useEffect(() => {
    if (!authLoading && !firstRun && step === 1 && isStudentOnboarded(user)) {
      navigate('/student/dashboard', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Step 1: Academic
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [major, setMajor] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [gradYear, setGradYear] = useState('');

  // Step 2: Interests
  const [interests, setInterests] = useState<string[]>([]);
  const availableInterests = [
    { label: 'Software Engineering', icon: 'code' },
    { label: 'Artificial Intelligence', icon: 'auto_awesome' },
    { label: 'UI/UX Design', icon: 'palette' },
    { label: 'Data Science', icon: 'bar_chart' },
    { label: 'Product Management', icon: 'shopping_cart' },
    { label: 'Cybersecurity', icon: 'security' },
    { label: 'BioTech', icon: 'biotech' },
    { label: 'FinTech', icon: 'account_balance' },
    { label: 'Marketing', icon: 'campaign' },
  ];

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  // Step 3: Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const suggestedSkills = ['React', 'TypeScript', 'Python', 'Java', 'SQL', 'AWS', 'Docker', 'Git'];

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  // Step 4: Career Goal
  const [goal, setGoal] = useState('Full-Time Job');
  const goals = [
    { id: 'Internship', title: 'Internship', desc: 'Gain practical experience during your studies.', icon: 'work' },
    { id: 'Full-Time Job', title: 'Full-Time Job', desc: 'Start your professional career post-graduation.', icon: 'business_center' },
    { id: 'Higher Studies', title: 'Higher Studies', desc: 'Pursue a Masters, MBA, or PhD.', icon: 'school' },
    { id: 'Research', title: 'Research', desc: 'Contribute to academic or industrial innovation.', icon: 'science' },
    { id: 'Startup', title: 'Startup', desc: 'Build or join an early-stage venture.', icon: 'rocket_launch' },
    { id: 'Freelancing', title: 'Freelancing', desc: 'Work independently on diverse projects.', icon: 'laptop_mac' },
  ];

  // Step 5: Resume Upload
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const processFile = (file: File) => {
    // Validate file type
    const validExtensions = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = validExtensions.includes(file.type) || ['pdf', 'docx', 'doc'].includes(fileExtension || '');
    
    if (!isValidType) {
      showToast('Invalid file format. Please upload PDF or DOCX.', 'error');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds the 5MB limit.', 'error');
      return;
    }

    // Trigger AI Scan Simulation
    setIsScanning(true);
    setScanProgress(0);
    setResumeName(file.name);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            showToast('AI analysis complete! Profile pre-filled.', 'success');
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save data back to context
      await updateUser({
        university,
        degree: `${degree} in ${major}`,
        gradYear: gradYear ? parseInt(gradYear, 10) : new Date().getFullYear(),
        careerGoal: goal,
        // Onboarding doesn't collect a self-rated proficiency yet, so every
        // skill starts at a neutral baseline the student can adjust later
        // from their Profile page (no confident-but-fake score).
        skills: skills.map(name => ({ name, level: 50 }))
      });
      setStep(6); // Step 6 = Success page
      showToast('Profile completed successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save profile updates', 'error');
    }
  };

  if (step === 6) {
    return <OnboardingSuccess navigate={navigate} showToast={showToast} />;
  }

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col justify-between">
      {/* Top Branding Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 bg-surface dark:bg-surface-container nav-blur shadow-[0_4px_20px_rgba(2,54,41,0.04)] border-b border-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-primary-fixed text-[20px]">badge</span>
          </div>
          <span className="font-display text-headline-md text-primary dark:text-primary-fixed">CareerBridge</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden md:block font-body-md text-body-md text-on-surface-variant">Onboarding Session</span>
          <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Onboarding Wizard */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-margin-mobile md:px-margin-desktop">
        <div className="w-full max-w-[1100px] flex gap-10 items-start">
          
          <div className="flex-grow max-w-[750px] bg-white dark:bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 p-8 md:p-12 relative overflow-hidden">
            {step <= totalSteps ? (
              <>
                {/* Progress Header */}
                <div className="mb-10">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h1 className="font-headline-lg text-headline-lg text-primary dark:text-primary-fixed mb-1">Complete Your Profile</h1>
                      <p className="text-on-surface-variant text-body-md max-w-md">Help us personalize your career journey and match you with opportunities.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-label-sm font-label-md text-on-surface-variant mr-2">{Math.round((step / totalSteps) * 100)}% Complete</span>
                      <span className="text-label-md font-label-md text-primary dark:text-primary-fixed uppercase tracking-wider">Step {step} of {totalSteps}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high dark:bg-surface-container rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary dark:bg-primary-fixed transition-all duration-500 ease-in-out" 
                      style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Step 1: Academic Info */}
                {step === 1 && (
                  <div className="step-transition active-step">
                    <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-surface-container-high dark:bg-surface-container border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors group relative overflow-hidden">
                          <span className="material-symbols-outlined text-[32px] text-outline group-hover:text-primary">add_a_photo</span>
                          <span className="text-[10px] font-label-sm mt-1 text-outline group-hover:text-primary">Add Photo</span>
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary"></div>
                        </div>
                      </div>

                      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div className="md:col-span-2">
                          <label className="block text-label-md font-label-md text-on-surface-variant mb-2">University</label>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">school</span>
                            <input 
                              value={university}
                              onChange={(e) => setUniversity(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant dark:border-outline bg-transparent text-on-surface dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                              placeholder="e.g. Stanford University" 
                              type="text"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-label-md font-label-md text-on-surface-variant mb-2">Degree</label>
                          <select 
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-outline-variant dark:border-outline bg-transparent text-on-surface dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                          >
                            <option value="Bachelors of Science">Bachelors of Science</option>
                            <option value="Bachelors of Arts">Bachelors of Arts</option>
                            <option value="Masters of Science">Masters of Science</option>
                            <option value="MBA">MBA</option>
                            <option value="PhD">PhD</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-label-md font-label-md text-on-surface-variant mb-2">Major</label>
                          <input 
                            value={major}
                            onChange={(e) => setMajor(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-outline-variant dark:border-outline bg-transparent text-on-surface dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                            placeholder="e.g. Computer Science" 
                            type="text"
                          />
                        </div>
                        <div>
                          <label className="block text-label-md font-label-md text-on-surface-variant mb-2">Current Year</label>
                          <select 
                            value={currentYear}
                            onChange={(e) => setCurrentYear(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-outline-variant dark:border-outline bg-transparent text-on-surface dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                          >
                            <option value="Freshman">Freshman</option>
                            <option value="Sophomore">Sophomore</option>
                            <option value="Junior">Junior</option>
                            <option value="Senior">Senior</option>
                            <option value="Graduate">Graduate</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-label-md font-label-md text-on-surface-variant mb-2">Graduation Year</label>
                          <input 
                            value={gradYear}
                            onChange={(e) => setGradYear(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-outline-variant dark:border-outline bg-transparent text-on-surface dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                            placeholder="2026" 
                            type="number"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Interests */}
                {step === 2 && (
                  <div className="step-transition active-step">
                    <h3 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed mb-6">What fields interest you?</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableInterests.map((interest) => {
                        const isActive = interests.includes(interest.label);
                        return (
                          <button
                            key={interest.label}
                            onClick={() => toggleInterest(interest.label)}
                            className={`flex items-center gap-2 p-4 rounded-xl border transition-all text-left group ${
                              isActive
                                ? 'bg-primary text-white border-primary shadow-md'
                                : 'border-outline-variant dark:border-outline bg-surface dark:bg-surface-container hover:border-primary'
                            }`}
                            type="button"
                          >
                            <span className={`material-symbols-outlined transition-colors ${isActive ? 'text-white' : 'text-on-surface-variant group-hover:text-primary'}`}>
                              {interest.icon}
                            </span>
                            <span className="text-label-md font-label-md">{interest.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Skills */}
                {step === 3 && (
                  <div className="step-transition active-step">
                    <h3 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed mb-2">Showcase your skills</h3>
                    <p className="text-on-surface-variant text-body-md mb-6">Type to add skills that define your professional capabilities.</p>
                    
                    <div className="relative mb-6">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
                      <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSkill(skillInput)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-outline-variant dark:border-outline bg-transparent text-on-surface dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        placeholder="Search skills (press Enter to add)..."
                        type="text"
                      />
                    </div>

                    {/* Skill Chips */}
                    <div className="flex flex-wrap gap-2 mb-6 min-h-10">
                      {skills.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center gap-1 bg-secondary-container/40 dark:bg-primary-container/20 text-primary dark:text-primary-fixed px-3 py-1.5 rounded-full border border-primary/5 text-label-md font-label-md"
                        >
                          {skill}{' '}
                          <span
                            className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error"
                            onClick={() => removeSkill(skill)}
                          >
                            close
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Suggestions */}
                    <div className="bg-surface-container-low dark:bg-surface-container p-4 rounded-xl">
                      <h4 className="text-label-sm font-label-md text-outline uppercase mb-3 tracking-widest">Suggested Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestedSkills.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => addSkill(skill)}
                            className="px-3 py-1 rounded-full border border-outline-variant hover:border-primary hover:bg-white dark:hover:bg-surface-container-low transition-all text-label-md text-on-surface dark:text-white"
                            type="button"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Career Goals */}
                {step === 4 && (
                  <div className="step-transition active-step">
                    <h3 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed mb-6">What is your primary goal?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {goals.map((g) => {
                        const isActive = goal === g.id;
                        return (
                          <label
                            key={g.id}
                            className={`flex items-center justify-between p-5 rounded-xl border bg-surface dark:bg-surface-container transition-all cursor-pointer group ${
                              isActive
                                ? 'border-primary ring-2 ring-primary/10 bg-primary/5'
                                : 'border-outline-variant dark:border-outline hover:border-primary'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-primary text-white' : 'bg-secondary-container/30 text-primary'} group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined">{g.icon}</span>
                              </div>
                              <div className="text-left">
                                <p className="font-headline-md text-[18px] text-primary dark:text-primary-fixed">{g.title}</p>
                                <p className="text-body-md text-on-surface-variant leading-tight">{g.desc}</p>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="goal"
                              checked={isActive}
                              onChange={() => setGoal(g.id)}
                              className="w-5 h-5 text-primary focus:ring-primary border-outline-variant"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 5: Resume Upload */}
                {step === 5 && (
                  <div className="step-transition active-step">
                    <h3 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed mb-2">Upload your resume</h3>
                    <p className="text-on-surface-variant text-body-md mb-8">Our AI will scan your resume to pre-fill your profile and suggest tailored roles.</p>
                    
                    {isScanning ? (
                      <div className="border-2 border-primary rounded-2xl p-16 flex flex-col items-center justify-center bg-primary/5 text-center space-y-6">
                        <div className="w-16 h-16 bg-white dark:bg-surface-container rounded-full flex items-center justify-center shadow-md relative">
                          <span className="material-symbols-outlined text-[32px] text-primary animate-spin">sync</span>
                        </div>
                        <div className="space-y-2 w-full max-w-xs">
                          <h4 className="font-headline-md text-headline-md text-primary font-bold">AI Parsing in Progress...</h4>
                          <p className="text-xs text-on-surface-variant">Extracting academic credentials, project keywords and skills.</p>
                          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-3">
                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-primary mt-1 block">{scanProgress}% completed</span>
                        </div>
                      </div>
                    ) : (
                      <label 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer group text-center ${
                          isDragging 
                            ? 'border-primary bg-primary/10 scale-[1.02]' 
                            : 'border-outline-variant dark:border-outline bg-surface-container-low dark:bg-surface-container hover:bg-surface-container-high hover:border-primary'
                        }`}
                      >
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.docx,.doc" 
                          onChange={handleResumeChange}
                        />
                        <div className="w-20 h-20 bg-white dark:bg-surface-container rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-[40px] text-primary">upload_file</span>
                        </div>
                        <h4 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed mb-1 font-bold">
                          {resumeName || 'Drag and drop here'}
                        </h4>
                        <p className="text-on-surface-variant text-body-md mb-6">Supports PDF, DOCX (Max 5MB)</p>
                        <span className="bg-primary text-white px-8 py-3 rounded-full font-label-md hover:shadow-lg transition-transform active:scale-95 inline-block">
                          Select File
                        </span>
                      </label>
                    )}

                    <div className="mt-8 p-4 bg-secondary-container/20 rounded-xl flex items-center gap-4 text-left">
                      <span className="material-symbols-outlined text-primary">verified_user</span>
                      <p className="text-label-md text-on-secondary-fixed-variant">Your data is encrypted and used only for career matching purposes.</p>
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div className="mt-12 pt-8 border-t border-outline-variant dark:border-outline flex justify-between items-center">
                  <button
                    onClick={handleBack}
                    className={`px-6 py-3 rounded-full text-on-surface-variant font-label-md hover:text-primary transition-colors ${
                      step === 1 ? 'opacity-0 pointer-events-none' : ''
                    }`}
                  >
                    Back
                  </button>
                  <Button
                    onClick={handleNext}
                    rightIcon={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                  >
                    {step === totalSteps ? 'Finish Profile' : 'Continue'}
                  </Button>
                </div>
              </>
            ) : (
              /* Success Screen (Step 6) */
              <div className="step-transition active-step text-center py-8">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 bg-primary-container opacity-10 rounded-full animate-pulse"></div>
                  <div className="absolute inset-4 bg-primary-container rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[48px]">check_circle</span>
                  </div>
                </div>
                <h3 className="font-display text-headline-lg text-primary dark:text-primary-fixed mb-2">Welcome to CareerBridge!</h3>
                <p className="text-on-surface-variant text-body-lg max-w-sm mx-auto mb-10">Your profile is 100% complete. We've already found 12 job matches for you.</p>
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <Button variant="secondary" onClick={() => navigate('/student/profile')}>
                    View Profile
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Slim Sidebar (Desktop Only) */}
          <aside className="hidden lg:flex flex-col gap-6 w-72 pt-12 text-left">
            <div className="bg-white dark:bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">psychology</span>
                <h4 className="font-label-md text-primary dark:text-primary-fixed uppercase tracking-wider">AI Features</h4>
              </div>
              <div className="space-y-6">
                {[
                  { title: 'AI Resume Analysis', desc: 'Instant feedback on keywords and formatting.', icon: 'description' },
                  { title: 'Readiness Score', desc: 'Measure your profile strength against top roles.', icon: 'trending_up' },
                  { title: 'Smart Matches', desc: 'Jobs that align perfectly with your skills.', icon: 'handshake' }
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary-container/40 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                    </div>
                    <div>
                      <p className="text-label-md font-label-md text-primary dark:text-primary-fixed">{f.title}</p>
                      <p className="text-[12px] text-on-surface-variant leading-tight">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl h-48 group">
              <div className="absolute inset-0 bg-primary/10"></div>
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDQwapqQu1N5G60aH9uSJJUCW2SFFQr9VkDVSIfUTVvQvLBQKDqucUlhXFadHKobG2p-UTsDHwUufZYySQda2wZFFKZL6-XI2RpAAwccJ_9XqIskQShQDOpIk0CP1pm8CxryU4X6-YZeXL3BySohsA724GY1zPkfpsbMpaC1xAhwB7Nd8FCcpP92Lc9uj6tK0umK6b6CCrRLmXbKDKlrPc02xP66GKSCQoHCTLMHiKMwZvro7q7ZetAfzwB_iejihJPOKdnvgglMew")' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent p-6 flex flex-col justify-end text-left">
                <p className="text-white text-label-sm uppercase tracking-widest font-label-md mb-2">What You'll Unlock</p>
                <ul className="text-white space-y-1">
                  {['AI Resume Analysis', 'Career Readiness Score', 'Personalized Job Recommendations', 'AI Mock Interviews'].map(text => (
                    <li key={text} className="flex items-center gap-2 text-[12px]">
                      <span className="material-symbols-outlined text-[14px]">check</span> {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-on-surface-variant text-label-sm border-t border-outline-variant/30">
        <p>© 2026 CareerBridge. Institutional Grade Career Development Platform.</p>
      </footer>
    </div>
  );
};
export default Onboarding;
