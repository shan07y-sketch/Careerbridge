import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../../components/layout/PageLayout';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showToastLocal, setShowToastLocal] = useState(false);

  // Profile Form States
  const [name, setName] = useState(user?.name || 'Alex Chen');
  const [university, setUniversity] = useState(user?.university || 'Stanford University');
  const [degree, setDegree] = useState(user?.degree || 'M.S. in Computer Science');
  const [gradYear, setGradYear] = useState(user?.gradYear?.toString() || '2025');
  const [careerGoal, setCareerGoal] = useState(user?.careerGoal || 'Software Engineer');
  const [workMode, setWorkMode] = useState<string>(user?.workMode || 'Hybrid');
  const [preferredLocation, setPreferredLocation] = useState(user?.preferredLocation || 'San Francisco, NYC, Austin');

  // Account & Security States
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(true);

  // AI Preferences States
  const [careerPath, setCareerPath] = useState('Individual Contributor');
  const [targetCompanies, setTargetCompanies] = useState('Google, Stripe, Tesla');
  const [targetSalary, setTargetSalary] = useState('$120k - $160k');
  const [workType, setWorkType] = useState<'Internship' | 'Full-Time'>('Internship');
  const [industries, setIndustries] = useState<string[]>(['FinTech', 'AI/ML']);
  const [newIndustry, setNewIndustry] = useState('');
  const [showAddIndustry, setShowAddIndustry] = useState(false);
  const [recFrequency, setRecFrequency] = useState<'Daily' | 'Weekly' | 'Off'>('Daily');

  // Notification Switches States
  const [emailApp, setEmailApp] = useState(true);
  const [pushApp, setPushApp] = useState(true);
  const [smsApp, setSmsApp] = useState(false);

  const [emailNet, setEmailNet] = useState(true);
  const [pushNet, setPushNet] = useState(true);
  const [smsNet, setSmsNet] = useState(true);

  const [emailAI, setEmailAI] = useState(true);
  const [pushAI, setPushAI] = useState(false);
  const [smsAI, setSmsAI] = useState(false);

  // Integrations Connection States
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState<boolean>(true);
  const [githubConnected, setGithubConnected] = useState<boolean>(user?.gitHubConnected ?? true);
  const [linkedinConnected, setLinkedinConnected] = useState<boolean>(user?.linkedInConnected ?? false);
  const [leetcodeConnected, setLeetcodeConnected] = useState<boolean>(true);

  // Appearance & Theme Options
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system' | 'compact'>('light');

  // Accessibility States
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  const triggerToast = () => {
    setShowToastLocal(true);
    setTimeout(() => {
      setShowToastLocal(false);
    }, 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        name,
        university,
        degree,
        gradYear: parseInt(gradYear) || 2025,
        careerGoal,
        workMode: workMode as 'Remote' | 'Hybrid' | 'On-site',
        preferredLocation,
      });
      triggerToast();
    } catch (err) {
      console.error(err);
      showToast('Failed to save profile changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      triggerToast();
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setIsSaving(false);
    }, 1000);
  };

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const addIndustryTag = () => {
    if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
      setIndustries([...industries, newIndustry.trim()]);
      setNewIndustry('');
      setShowAddIndustry(false);
      triggerToast();
    }
  };

  const removeIndustryTag = (tag: string) => {
    setIndustries(industries.filter(i => i !== tag));
    triggerToast();
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      profile: { name, university, degree, gradYear, careerGoal, workMode, preferredLocation },
      aiPreferences: { careerPath, targetCompanies, targetSalary, workType, industries, recFrequency },
      accessibility: { highContrast, reducedMotion, fontSize }
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "careerbridge_data_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON data export generated! Downloading file...', 'success');
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'account', label: 'Account & Security', icon: 'shield' },
    { id: 'ai-preferences', label: 'AI Preferences', icon: 'auto_awesome' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications_active' },
    { id: 'integrations', label: 'Integrations', icon: 'hub' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'accessibility', label: 'Accessibility', icon: 'accessibility_new' }
  ];

  return (
    <PageLayout fullWidth>
      <div className="flex flex-1 min-h-screen text-left">
        
        {/* Pane 2: Settings Sidebar */}
        <aside className="w-72 bg-surface-container-low border-r border-primary/5 h-screen sticky top-0 overflow-y-auto no-scrollbar pt-8 pb-12 flex flex-col shrink-0">
          <div className="px-6 mb-8">
            <h2 className="text-headline-md font-bold text-primary dark:text-primary-fixed-dim">Settings</h2>
            <p className="text-label-sm text-outline mt-1 leading-tight">Manage your professional bridge.</p>
          </div>
          
          <nav className="flex flex-col px-3 gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleTabClick(e, item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-white dark:bg-surface-container shadow-sm border border-primary/10 text-primary dark:text-primary-fixed font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {isActive && <div className="active-tab-indicator" />}
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="text-label-md">{item.label}</span>
                </a>
              );
            })}

            <div className="mt-4 pt-4 border-t border-primary/5">
              <a
                href="#danger"
                onClick={(e) => handleTabClick(e, 'danger')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                  activeTab === 'danger'
                    ? 'bg-error-container/20 border border-error/20 text-error font-semibold'
                    : 'text-error hover:bg-error-container/20'
                }`}
              >
                {activeTab === 'danger' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-error rounded-r" />}
                <span className="material-symbols-outlined text-[20px]">report</span>
                <span className="text-label-md">Danger Zone</span>
              </a>
            </div>
          </nav>
        </aside>

        {/* Pane 3: Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-margin-desktop py-12 flex flex-col xl:flex-row gap-8">
          
          {/* Main stacked sections */}
          <div className="flex-1 max-w-[800px] space-y-section-gap pb-24">
            
            {/* Profile Settings */}
            <section className="scroll-mt-12" id="profile">
              <div className="mb-stack-lg">
                <h3 className="text-headline-md font-bold text-primary dark:text-primary-fixed-dim">Profile Settings</h3>
                <p className="text-body-md text-on-surface-variant">Update your personal information and academic identity.</p>
              </div>

              <div className="glass-card rounded-xl p-8 space-y-stack-lg">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <img 
                      alt={name} 
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary-fixed ring-4 ring-background" 
                      src={user?.profilePicture || "https://lh3.googleusercontent.com/aida-public/AB6AXuAooeaKR0AI_Pj4jiksFauxBttFRYblf1bZZ7vrKE1KQHac20lHxjl3odxy2AoPj3ki7vzgmagPxoNTveOqi_m3l8P7W1hMlQ4FrL3wUAJIseJTv2809m81KQhp2BJ1y_uLeZn5jur2uJ33BNlxwIZfCSfzE_2CQlqlODKC29lZOV91Q4bWREOTumkVNTVzKiqZQ_2C6czp3XcxSnuDDrAbIQ-N7OIzeFmds7D4I22kg7GQNO_OUK5fbuxNFR1-1BhVyGowLCB1ZTM"}
                    />
                    <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full border-2 border-background shadow-lg hover:scale-110 transition-transform cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    </button>
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-primary dark:text-primary-fixed-dim">{name}</h4>
                        <p className="text-label-sm text-outline">{preferredLocation} • Student Candidate</p>
                      </div>
                      <div className="flex gap-2 justify-center sm:justify-end">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded font-bold uppercase">RESUME UPLOADED</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] rounded font-bold uppercase">PORTFOLIO PENDING</span>
                      </div>
                    </div>
                    <button className="mt-2 text-primary dark:text-primary-fixed-dim text-label-md font-semibold hover:underline cursor-pointer">Change profile picture</button>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Full Name</label>
                    <input 
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md focus:ring-primary focus:border-primary text-on-surface dark:text-white" 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">University</label>
                    <input 
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md focus:ring-primary focus:border-primary text-on-surface dark:text-white" 
                      type="text" 
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Degree</label>
                    <input 
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md focus:ring-primary focus:border-primary text-on-surface dark:text-white" 
                      type="text" 
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Graduation Year</label>
                    <input 
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md focus:ring-primary focus:border-primary text-on-surface dark:text-white" 
                      type="number" 
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Career Goal</label>
                    <select 
                      value={careerGoal}
                      onChange={(e) => setCareerGoal(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md text-on-surface dark:text-white"
                    >
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Data Scientist">Data Scientist</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Preferred Work Mode</label>
                    <select 
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md text-on-surface dark:text-white"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Preferred Location</label>
                    <input 
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md focus:ring-primary focus:border-primary text-on-surface dark:text-white" 
                      type="text" 
                      value={preferredLocation}
                      onChange={(e) => setPreferredLocation(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end pt-4">
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="bg-primary text-white dark:bg-primary-container px-6 py-2.5 rounded-lg font-semibold shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* Account & Security Section */}
            <section className="scroll-mt-12" id="account">
              <div className="mb-stack-lg">
                <h3 className="text-headline-md font-bold text-primary dark:text-primary-fixed-dim">Account &amp; Security</h3>
                <p className="text-body-md text-on-surface-variant">Protect your career data and manage access.</p>
              </div>

              <div className="glass-card rounded-xl p-8 space-y-8">
                <div className="grid grid-cols-1 divide-y divide-primary/5">
                  <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary dark:text-primary-fixed-dim">Password</p>
                        <p className="text-label-sm text-outline">Last changed 3 months ago</p>
                      </div>
                      <button 
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="text-primary dark:text-primary-fixed-dim font-semibold text-label-md cursor-pointer hover:underline"
                      >
                        {showPasswordForm ? 'Cancel Update' : 'Update Password'}
                      </button>
                    </div>

                    {showPasswordForm && (
                      <form onSubmit={handleChangePassword} className="space-y-4 bg-surface-container-low dark:bg-surface-container p-5 rounded-xl border border-primary/5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Current Password</label>
                            <input 
                              type="password" 
                              value={oldPassword} 
                              onChange={(e) => setOldPassword(e.target.value)}
                              className="w-full bg-white dark:bg-surface-container-lowest border rounded-lg p-2.5 text-xs text-on-surface dark:text-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">New Password</label>
                            <input 
                              type="password" 
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-white dark:bg-surface-container-lowest border rounded-lg p-2.5 text-xs text-on-surface dark:text-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Confirm New Password</label>
                            <input 
                              type="password" 
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-white dark:bg-surface-container-lowest border rounded-lg p-2.5 text-xs text-on-surface dark:text-white"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button type="submit" className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
                            Confirm Password Update
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-primary dark:text-primary-fixed-dim">Two-Factor Authentication (2FA)</p>
                      <p className="text-label-sm text-outline">Add an extra layer of security to your account.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={twoFactor}
                        onChange={(e) => setTwoFactor(e.target.checked)}
                        className="sr-only toggle-switch" 
                      />
                      <div className={`w-11 h-6 bg-surface-variant rounded-full transition-colors relative toggle-slider before:content-[''] before:absolute before:top-[2px] before:left-[2px] before:bg-white before:border-gray-300 before:border before:rounded-full before:h-5 before:w-5 before:transition-all ${
                        twoFactor ? 'bg-primary' : ''
                      }`}>
                        <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                          twoFactor ? 'translate-x-5' : 'translate-x-0'
                        } mt-[2px] ml-[2px]`} />
                      </div>
                    </label>
                  </div>

                  <div className="py-4 space-y-4">
                    <p className="font-bold text-primary dark:text-primary-fixed-dim">Active Devices</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-label-sm bg-surface-container-low dark:bg-surface-container p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim">laptop_mac</span>
                          <div>
                            <p className="font-bold text-primary dark:text-primary-fixed-dim">MacBook Pro 14"</p>
                            <p className="text-outline">Chrome • San Francisco, CA • Active Now</p>
                          </div>
                        </div>
                        <span className="text-green-600 font-bold uppercase">This Device</span>
                      </div>
                      <div className="flex items-center justify-between text-label-sm bg-surface-container-low dark:bg-surface-container p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-on-surface-variant">phone_iphone</span>
                          <div>
                            <p className="font-bold text-primary dark:text-primary-fixed-dim">iPhone 15 Pro</p>
                            <p className="text-outline">Safari • Boston, MA • 2 days ago</p>
                          </div>
                        </div>
                        <span className="text-outline font-semibold">Active Session</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* AI Preferences */}
            <section className="scroll-mt-12" id="ai-preferences">
              <div className="mb-stack-lg">
                <div className="flex items-center gap-2">
                  <h3 className="text-headline-md font-bold text-primary dark:text-primary-fixed-dim">AI Preferences</h3>
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] rounded uppercase font-bold tracking-widest">CareerBridge Core</span>
                </div>
                <p className="text-body-md text-on-surface-variant">Customize how our AI engine bridges the gap to your next role.</p>
              </div>

              <div className="glass-card rounded-xl p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Preferred Career Path</label>
                    <select 
                      value={careerPath} 
                      onChange={(e) => setCareerPath(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md text-on-surface dark:text-white"
                    >
                      <option>Management Track</option>
                      <option>Individual Contributor</option>
                      <option>Research &amp; Academia</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Target Companies</label>
                    <input 
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md text-on-surface dark:text-white" 
                      placeholder="e.g. Google, Stripe, Tesla"
                      value={targetCompanies}
                      onChange={(e) => setTargetCompanies(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Target Salary Range</label>
                    <select 
                      value={targetSalary} 
                      onChange={(e) => setTargetSalary(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-primary/10 rounded-lg p-3 text-body-md text-on-surface dark:text-white"
                    >
                      <option>$80k - $120k</option>
                      <option>$120k - $160k</option>
                      <option>$160k+</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant font-bold">Work Type</label>
                    <div className="flex bg-surface-container dark:bg-surface-container-low rounded-lg p-1">
                      <button 
                        type="button"
                        onClick={() => setWorkType('Internship')}
                        className={`flex-1 py-2 text-label-sm rounded-md font-bold transition-all cursor-pointer ${
                          workType === 'Internship' ? 'bg-white dark:bg-surface-container shadow-sm text-primary' : 'text-outline'
                        }`}
                      >
                        Internship
                      </button>
                      <button 
                        type="button"
                        onClick={() => setWorkType('Full-Time')}
                        className={`flex-1 py-2 text-label-sm rounded-md font-bold transition-all cursor-pointer ${
                          workType === 'Full-Time' ? 'bg-white dark:bg-surface-container shadow-sm text-primary' : 'text-outline'
                        }`}
                      >
                        Full-Time
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-label-md font-bold text-primary dark:text-primary-fixed-dim">Preferred Industries</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {industries.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant text-label-sm rounded-full flex items-center gap-2">
                        {tag} 
                        <button type="button" onClick={() => removeIndustryTag(tag)} className="material-symbols-outlined text-[14px] hover:text-error cursor-pointer">close</button>
                      </span>
                    ))}
                    
                    {showAddIndustry ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          placeholder="Industry" 
                          value={newIndustry} 
                          onChange={(e) => setNewIndustry(e.target.value)}
                          className="bg-surface-container border rounded px-2 py-1 text-xs w-24 text-on-surface dark:text-white"
                          onKeyDown={(e) => e.key === 'Enter' && addIndustryTag()}
                        />
                        <button type="button" onClick={addIndustryTag} className="material-symbols-outlined text-sm text-primary">check</button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setShowAddIndustry(true)}
                        className="px-3 py-1 border border-dashed border-outline text-outline text-label-sm rounded-full hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        + Add Industry
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-primary/5">
                  <div>
                    <p className="font-bold text-primary dark:text-primary-fixed-dim">Recommendation Frequency</p>
                    <p className="text-label-sm text-outline">Control how often you receive matches.</p>
                  </div>
                  <div className="flex bg-surface-container dark:bg-surface-container-low rounded-lg p-1">
                    {['Daily', 'Weekly', 'Off'].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setRecFrequency(freq as 'Daily' | 'Weekly' | 'Off')}
                        className={`px-4 py-1.5 text-label-sm rounded-md font-bold transition-all cursor-pointer ${
                          recFrequency === freq ? 'bg-white dark:bg-surface-container shadow-sm text-primary' : 'text-outline'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications Switchboard */}
            <section className="scroll-mt-12" id="notifications">
              <div className="mb-stack-lg">
                <h3 className="text-headline-md font-bold text-primary dark:text-primary-fixed-dim">Notification Center</h3>
                <p className="text-body-md text-on-surface-variant">Manage multi-channel updates.</p>
              </div>

              <div className="glass-card rounded-xl overflow-hidden divide-y divide-primary/5">
                {/* Group Header */}
                <div className="bg-surface-container-low dark:bg-surface-container px-6 py-3 flex items-center justify-between text-label-sm font-bold text-outline">
                  <span>CATEGORY</span>
                  <div className="flex gap-8 px-4">
                    <span className="w-12 text-center">EMAIL</span>
                    <span className="w-12 text-center">PUSH</span>
                    <span className="w-12 text-center">SMS</span>
                  </div>
                </div>
                
                {/* Group: Applications */}
                <div className="p-6 flex items-center justify-between hover:bg-surface-container-low/50">
                  <div>
                    <p className="font-semibold text-primary dark:text-primary-fixed-dim">Applications &amp; Interviews</p>
                    <p className="text-label-sm text-outline">Status changes and scheduling updates.</p>
                  </div>
                  <div className="flex gap-8 px-4">
                    <input type="checkbox" checked={emailApp} onChange={(e) => setEmailApp(e.target.checked)} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" />
                    <input type="checkbox" checked={pushApp} onChange={(e) => setPushApp(e.target.checked)} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" />
                    <input type="checkbox" checked={smsApp} onChange={(e) => setSmsApp(e.target.checked)} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" />
                  </div>
                </div>

                {/* Group: Networking */}
                <div className="p-6 flex items-center justify-between hover:bg-surface-container-low/50">
                  <div>
                    <p className="font-semibold text-primary dark:text-primary-fixed-dim">Networking &amp; Messages</p>
                    <p className="text-label-sm text-outline">New connection requests and peer messages.</p>
                  </div>
                  <div className="flex gap-8 px-4">
                    <input type="checkbox" checked={emailNet} onChange={(e) => setEmailNet(e.target.checked)} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" />
                    <input type="checkbox" checked={pushNet} onChange={(e) => setPushNet(e.target.checked)} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" />
                    <input type="checkbox" checked={smsNet} onChange={(e) => setSmsNet(e.target.checked)} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" />
                  </div>
                </div>

                {/* Group: AI Insights */}
                <div className="p-6 flex items-center justify-between hover:bg-surface-container-low/50">
                  <div>
                    <p className="font-semibold text-primary dark:text-primary-fixed-dim">AI Career Insights</p>
                    <p className="text-label-sm text-outline">New job matches and resume optimization tips.</p>
                  </div>
                  <div className="flex gap-8 px-4">
                    <input type="checkbox" checked={emailAI} onChange={(e) => setEmailAI(e.target.checked)} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" />
                    <input type="checkbox" checked={pushAI} onChange={(e) => setPushAI(e.target.checked)} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" />
                    <input type="checkbox" checked={smsAI} onChange={(e) => setSmsAI(e.target.checked)} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" />
                  </div>
                </div>
              </div>
            </section>

            {/* Connected Apps */}
            <section className="scroll-mt-12" id="integrations">
              <div className="mb-stack-lg">
                <h3 className="text-headline-md font-bold text-primary dark:text-primary-fixed-dim">Integrations Ecosystem</h3>
                <p className="text-body-md text-on-surface-variant">Sync with your technical and academic platforms.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Google Calendar */}
                <div className="glass-card p-6 rounded-xl flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                    <span className="material-symbols-outlined">calendar_month</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-primary dark:text-primary-fixed-dim truncate">Google Calendar</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        googleCalendarConnected ? 'text-green-600 bg-green-50' : 'text-outline bg-surface-container'
                      }`}>
                        {googleCalendarConnected ? 'CONNECTED' : 'NOT LINKED'}
                      </span>
                    </div>
                    <p className="text-[12px] text-outline">Last synced: 12m ago</p>
                    <button 
                      type="button"
                      onClick={() => {
                        setGoogleCalendarConnected(!googleCalendarConnected);
                        triggerToast();
                      }}
                      className="mt-4 text-label-sm font-bold text-primary dark:text-primary-fixed-dim hover:underline cursor-pointer"
                    >
                      {googleCalendarConnected ? 'Disconnect' : 'Connect Account'}
                    </button>
                  </div>
                </div>

                {/* GitHub */}
                <div className="glass-card p-6 rounded-xl flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-surface-container rounded-lg flex items-center justify-center text-primary dark:text-primary-fixed shrink-0">
                    <span className="material-symbols-outlined">terminal</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-primary dark:text-primary-fixed-dim truncate">GitHub</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        githubConnected ? 'text-green-600 bg-green-50' : 'text-outline bg-surface-container'
                      }`}>
                        {githubConnected ? 'CONNECTED' : 'NOT LINKED'}
                      </span>
                    </div>
                    <p className="text-[12px] text-outline">Last synced: 1h ago</p>
                    <button 
                      type="button"
                      onClick={() => {
                        setGithubConnected(!githubConnected);
                        triggerToast();
                      }}
                      className="mt-4 text-label-sm font-bold text-primary dark:text-primary-fixed-dim hover:underline cursor-pointer"
                    >
                      {githubConnected ? 'Disconnect' : 'Connect Account'}
                    </button>
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="glass-card p-6 rounded-xl flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-800 shrink-0">
                    <span className="material-symbols-outlined">link</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-primary dark:text-primary-fixed-dim truncate">LinkedIn</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        linkedinConnected ? 'text-green-600 bg-green-50' : 'text-outline bg-surface-container'
                      }`}>
                        {linkedinConnected ? 'CONNECTED' : 'NOT LINKED'}
                      </span>
                    </div>
                    <p className="text-[12px] text-outline">Sync professional profile</p>
                    <button 
                      type="button"
                      onClick={() => {
                        setLinkedinConnected(!linkedinConnected);
                        triggerToast();
                      }}
                      className="mt-4 text-label-sm font-bold text-primary dark:text-primary-fixed-dim hover:underline cursor-pointer"
                    >
                      {linkedinConnected ? 'Disconnect' : 'Connect Account'}
                    </button>
                  </div>
                </div>

                {/* LeetCode */}
                <div className="glass-card p-6 rounded-xl flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
                    <span className="material-symbols-outlined">code</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-primary dark:text-primary-fixed-dim truncate">LeetCode</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        leetcodeConnected ? 'text-green-600 bg-green-50' : 'text-outline bg-surface-container'
                      }`}>
                        {leetcodeConnected ? 'CONNECTED' : 'NOT LINKED'}
                      </span>
                    </div>
                    <p className="text-[12px] text-outline">Last synced: Yesterday</p>
                    <button 
                      type="button"
                      onClick={() => {
                        setLeetcodeConnected(!leetcodeConnected);
                        triggerToast();
                      }}
                      className="mt-4 text-label-sm font-bold text-primary dark:text-primary-fixed-dim hover:underline cursor-pointer"
                    >
                      {leetcodeConnected ? 'Disconnect' : 'Connect Account'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Appearance & Accessibility */}
            <section className="scroll-mt-12 space-y-section-gap" id="appearance">
              <div>
                <div className="mb-stack-lg">
                  <h3 className="text-headline-md font-bold text-primary dark:text-primary-fixed-dim">Appearance</h3>
                  <p className="text-body-md text-on-surface-variant">Customize your visual experience.</p>
                </div>
                
                <div className="glass-card rounded-xl p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: 'light', label: 'Light', icon: 'light_mode', class: 'bg-white' },
                    { id: 'dark', label: 'Dark', icon: 'dark_mode', class: 'bg-primary text-white' },
                    { id: 'system', label: 'System', icon: 'settings_brightness', class: 'bg-gradient-to-r from-background to-primary text-white' },
                    { id: 'compact', label: 'Compact', icon: 'compress', class: 'bg-surface-variant' }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setThemeMode(theme.id as any);
                        triggerToast();
                      }}
                      className={`p-4 rounded-lg border-2 text-center cursor-pointer transition-all ${
                        themeMode === theme.id ? 'border-primary' : 'border-transparent bg-surface-container-high'
                      }`}
                    >
                      <div className="w-full h-12 rounded mb-2 flex items-center justify-center bg-surface-container border">
                        <span className="material-symbols-outlined text-[20px]">{theme.icon}</span>
                      </div>
                      <p className="text-label-sm font-bold text-primary dark:text-primary-fixed">{theme.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessibility Settings */}
              <div id="accessibility">
                <div className="mb-stack-lg">
                  <h3 className="text-headline-md font-bold text-primary dark:text-primary-fixed-dim">Accessibility</h3>
                  <p className="text-body-md text-on-surface-variant">Tailor the interface to your needs.</p>
                </div>
                
                <div className="glass-card rounded-xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-primary dark:text-primary-fixed-dim">High Contrast Mode</p>
                      <p className="text-label-sm text-outline">Increases contrast for better readability.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={highContrast}
                        onChange={(e) => setHighContrast(e.target.checked)}
                        className="sr-only toggle-switch" 
                      />
                      <div className={`w-11 h-6 bg-surface-variant rounded-full transition-colors relative toggle-slider before:content-[''] before:absolute before:top-[2px] before:left-[2px] before:bg-white before:border-gray-300 before:border before:rounded-full before:h-5 before:w-5 before:transition-all ${
                        highContrast ? 'bg-primary' : ''
                      }`}>
                        <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                          highContrast ? 'translate-x-5' : 'translate-x-0'
                        } mt-[2px] ml-[2px]`} />
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-primary dark:text-primary-fixed-dim">Reduced Motion</p>
                      <p className="text-label-sm text-outline">Minimize animations throughout the platform.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={reducedMotion}
                        onChange={(e) => setReducedMotion(e.target.checked)}
                        className="sr-only toggle-switch" 
                      />
                      <div className={`w-11 h-6 bg-surface-variant rounded-full transition-colors relative toggle-slider before:content-[''] before:absolute before:top-[2px] before:left-[2px] before:bg-white before:border-gray-300 before:border before:rounded-full before:h-5 before:w-5 before:transition-all ${
                        reducedMotion ? 'bg-primary' : ''
                      }`}>
                        <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                          reducedMotion ? 'translate-x-5' : 'translate-x-0'
                        } mt-[2px] ml-[2px]`} />
                      </div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <p className="font-bold text-primary dark:text-primary-fixed-dim">Font Size</p>
                    <input 
                      className="w-full h-2 bg-surface-container dark:bg-surface-container-low rounded-lg appearance-none cursor-pointer accent-primary" 
                      max="24" 
                      min="12" 
                      step="2" 
                      type="range" 
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] font-bold text-outline">
                      <span>SMALL ({fontSize}px)</span>
                      <span>MEDIUM</span>
                      <span>LARGE</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="scroll-mt-12" id="danger">
              <div className="border border-error/20 bg-error-container/5 rounded-xl p-8 space-y-6">
                <div>
                  <h3 className="text-headline-md font-bold text-error">Danger Zone</h3>
                  <p className="text-body-md text-on-surface-variant">Actions here are permanent or impactful.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border border-error/10 bg-white dark:bg-surface-container rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-bold text-primary dark:text-primary-fixed-dim">Download My Data</p>
                      <p className="text-label-sm text-outline">Get a JSON export of all your career activity.</p>
                    </div>
                    <button 
                      onClick={handleExportData}
                      className="px-4 py-2 border border-outline text-on-surface-variant hover:bg-surface-container transition-colors font-semibold rounded-lg shrink-0 cursor-pointer"
                    >
                      Request Export
                    </button>
                  </div>

                  <div className="p-4 border border-error/10 bg-white dark:bg-surface-container rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-bold text-primary dark:text-primary-fixed-dim">Deactivate Account</p>
                      <p className="text-label-sm text-outline">Hide your profile from recruiter searches temporarily.</p>
                    </div>
                    <button 
                      onClick={() => {
                        showToast('Account deactivated. Recruiter listings hidden.', 'info');
                        triggerToast();
                      }}
                      className="px-4 py-2 border border-outline text-on-surface-variant hover:bg-surface-container transition-colors font-semibold rounded-lg shrink-0 cursor-pointer"
                    >
                      Deactivate
                    </button>
                  </div>

                  <div className="p-4 border border-error/10 bg-white dark:bg-surface-container rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-bold text-error">Delete Account</p>
                      <p className="text-label-sm text-outline">Permanently erase all your data from CareerBridge.</p>
                    </div>
                    <button 
                      onClick={() => {
                        showToast('Account deletion request initiated.', 'error');
                        triggerToast();
                      }}
                      className="px-4 py-2 bg-error text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Pane 4: Right Sidebar */}
          <aside className="w-80 space-y-6 sticky top-12 h-fit shrink-0">
            {/* Account Health */}
            <div className="glass-card rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-primary dark:text-primary-fixed-dim text-label-md mb-4">Account Health</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-label-sm">
                    <span className="text-outline">Profile Completion</span>
                    <span className="text-primary dark:text-primary-fixed-dim font-bold">85%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary progress-bar-fill" style={{ width: '85%' }} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-label-sm">
                    <span className="text-outline">Resume Quality</span>
                    <span className="text-primary dark:text-primary-fixed-dim font-bold">92%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary progress-bar-fill" style={{ width: '92%' }} />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-primary/5 space-y-2">
                  <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                    <span>LinkedIn Connected</span>
                  </div>
                  <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                    <span>GitHub Connected</span>
                  </div>
                  <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-orange-500 text-[18px]">pending</span> 
                    <span>Portfolio Added</span>
                  </div>
                  <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                    <span>Email Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                    <span>Phone Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="bg-primary text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <h4 className="font-bold text-label-md mb-1 opacity-80">Subscription Status</h4>
              <p className="text-headline-md font-bold mb-4">Student Pro</p>
              <p className="text-label-sm opacity-90 leading-tight mb-6">Renews on Oct 12, 2024 • $0.00/yr</p>
              <button className="w-full py-2 bg-white text-primary font-bold rounded-lg hover:bg-secondary-fixed transition-colors cursor-pointer">Manage Plan</button>
            </div>

            {/* Career Advisor Ready */}
            <div className="p-4 rounded-xl border-2 border-dashed border-outline/20 text-center">
              <h4 className="font-bold text-primary dark:text-primary-fixed-dim text-label-sm mb-1">Career Advisor Ready</h4>
              <p className="text-[11px] text-outline mb-4">Our AI has prepared 3 new insights based on your recent activity.</p>
              <button 
                type="button"
                onClick={() => navigate('/student/career-insights')}
                className="text-primary dark:text-primary-fixed-dim font-bold text-label-sm flex items-center gap-1 mx-auto hover:gap-2 transition-all cursor-pointer"
              >
                Go to Insights <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </aside>

        </div>

      </div>

      {/* Floating Save Toast Notification */}
      <div 
        id="save-toast"
        className={`fixed bottom-8 right-8 glass-card border-primary/20 p-4 rounded-xl shadow-xl flex items-center gap-4 transition-all duration-300 z-[100] ${
          showToastLocal ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
        </div>
        <div>
          <p className="font-bold text-primary text-label-md">Settings Saved</p>
          <p className="text-label-sm text-outline">Your preferences were updated successfully.</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
