import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { isStudentOnboarded } from '../../utils/onboarding';

export const Authentication: React.FC = () => {
  const { login, registerStudent, selectRole, role: contextRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') as 'student' | 'employer' | 'university') || contextRole || 'student';

  useEffect(() => {
    selectRole(role);
  }, [role, selectRole]);

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [gradYear, setGradYear] = useState('2026');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [uniLocation, setUniLocation] = useState('');
  const [agree, setAgree] = useState(false);

  // Strength checks -- mirror the backend registerSchema EXACTLY
  // (min 8 chars, an uppercase letter, a lowercase letter, and a digit),
  // so a password that passes here can never be rejected server-side.
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const passwordsMatch = password === confirmPassword;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }
    if (!isEmailValid) {
      showToast('Please enter a valid email format', 'error');
      return;
    }
    setIsLoading(true);
    try {
      // login() resolves the REAL role from the backend response -- the
      // account's role in PostgreSQL wins over whatever tab the user was on.
      const { role: resolvedRole, user: profile } = await login(email, password);
      showToast('Signed in successfully!', 'success');
      if (resolvedRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (resolvedRole === 'employer') {
        navigate('/employer/dashboard');
      } else if (resolvedRole === 'university') {
        navigate('/university/dashboard');
      } else {
        // Returning students with a saved profile go straight to their
        // dashboard; only genuinely fresh profiles see the onboarding wizard.
        navigate(isStudentOnboarded(profile) ? '/student/dashboard' : '/student/onboarding');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Invalid credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'student' && (!name || !email || !university || !degree)) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    if (role === 'employer' && (!name || !email || !companyName || !industry)) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    if (role === 'university' && (!name || !email || !university || !uniLocation)) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    if (!isEmailValid) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (!hasMinLength || !hasNumber || !hasUppercase || !hasLowercase) {
      showToast('Password must satisfy security criteria', 'error');
      return;
    }
    if (!passwordsMatch) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (!agree) {
      showToast('You must agree to the Terms and Privacy Policy', 'error');
      return;
    }
    setIsLoading(true);
    try {
      // Send the EXACT payload the backend's registerSchema requires for the
      // selected role (student: universityName/degree/graduationYear;
      // employer: companyName+industry; university: universityName+location).
      const { role: resolvedRole } = await registerStudent({
        name,
        email,
        password,
        role,
        universityName: role !== 'employer' ? university : undefined,
        degree: role === 'student' ? degree : undefined,
        graduationYear: role === 'student' ? parseInt(gradYear) : undefined,
        companyName: role === 'employer' ? companyName : undefined,
        industry: role === 'employer' ? industry : undefined,
        location: role === 'university' ? uniLocation : undefined
      });
      showToast('Account created successfully!', 'success');
      // The account is registered AND logged in against the real backend at
      // this point -- route straight into the correct portal by role.
      if (resolvedRole === 'employer') {
        navigate('/employer/dashboard');
      } else if (resolvedRole === 'university') {
        navigate('/university/dashboard');
      } else {
        // firstRun marks this as the intentional post-registration wizard --
        // without it the onboarding guard would bounce the new account to the
        // dashboard because registration already saved degree/grad year.
        navigate('/student/onboarding', { state: { firstRun: true } });
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col justify-between">
      {/* TopNavBar */}
      <header className="bg-white dark:bg-surface-container shadow-[0_4px_20px_rgba(2,54,41,0.04)] w-full top-0 z-50">
        <div className="flex justify-between items-center px-margin-desktop py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {role === 'employer' ? 'corporate_fare' : 'school'}
            </span>
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">CareerBridge</span>
          </div>
          <div className="flex items-center gap-stack-md">
            <button 
              className="text-on-surface-variant font-medium font-body-md hover:text-primary dark:hover:text-primary-fixed transition-colors duration-200" 
              onClick={() => setActiveTab('signin')}
            >
              Sign In
            </button>
            <Button 
              size="sm"
              onClick={() => setActiveTab('signup')}
            >
              Create Account
            </Button>
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-grow flex items-center justify-center py-stack-lg px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="max-w-container-max w-full mx-auto flex flex-col lg:flex-row gap-12 items-start justify-center">
          
          {/* Authentication Card */}
          <div className="bg-white dark:bg-surface-container-lowest w-full max-w-[540px] p-8 md:p-10 rounded-[16px] shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 transition-all duration-500">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-2xl">
                  {role === 'employer' ? 'corporate_fare' : 'school'}
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary dark:text-primary-fixed mb-2 font-bold text-center">
                {activeTab === 'signin' 
                  ? `Welcome ${role.charAt(0).toUpperCase() + role.slice(1)}` 
                  : `Create ${role.charAt(0).toUpperCase() + role.slice(1)} Account`}
              </h1>
              <p className="text-on-surface-variant font-body-md max-w-[360px]">
                Sign in or create your CareerBridge account to unlock your career potential.
              </p>
            </div>

            {/* Tabs */}
            <div className="relative flex border-b border-surface-container-highest mb-8">
              <button 
                className={`flex-1 py-4 font-label-md text-label-md transition-colors ${activeTab === 'signin' ? 'text-primary dark:text-primary-fixed font-bold' : 'text-on-surface-variant'}`}
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </button>
              <button 
                className={`flex-1 py-4 font-label-md text-label-md transition-colors ${activeTab === 'signup' ? 'text-primary dark:text-primary-fixed font-bold' : 'text-on-surface-variant'}`}
                onClick={() => setActiveTab('signup')}
              >
                Create Account
              </button>
              {/* Indicator bar */}
              <div 
                className="absolute bottom-0 h-[3px] bg-primary dark:bg-primary-fixed rounded-t-full transition-all duration-300"
                style={{
                  width: '50%',
                  left: activeTab === 'signin' ? '0%' : '50%'
                }}
              />
            </div>

            {/* Sign In Form */}
            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5 ml-1">Email</label>
                    <input 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-3 outline-none focus:border-primary text-on-surface dark:text-white"
                      placeholder="name@university.edu" 
                      type="email"
                      required
                    />
                    {email && !isEmailValid && (
                      <p className="text-xs text-error font-medium mt-1 ml-1">Please enter a valid email format (e.g. name@uni.edu)</p>
                    )}
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5 ml-1">Password</label>
                    <input 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-3 outline-none focus:border-primary text-on-surface dark:text-white"
                      placeholder="••••••••" 
                      type="password"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input className="w-4 h-4 rounded border-secondary-container text-primary focus:ring-primary" type="checkbox" />
                    <span className="text-label-md font-label-md text-on-surface-variant group-hover:text-primary dark:group-hover:text-primary-fixed transition-colors">Remember Me</span>
                  </label>
                  <Link className="text-label-md font-label-md text-primary dark:text-primary-fixed hover:underline" to="/auth/forgot-password">
                    Forgot Password?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-4 rounded-[12px]"
                  isLoading={isLoading}
                  disabled={email !== '' && !isEmailValid}
                >
                  Sign In
                </Button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-surface-container-highest"></div>
                  <span className="flex-shrink mx-4 text-on-surface-variant font-label-sm text-label-sm">OR</span>
                  <div className="flex-grow border-t border-surface-container-highest"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => { setEmail('alex.rivera@mit.edu'); setPassword('password'); }}
                    className="flex items-center justify-center gap-2 border border-secondary-container dark:border-outline-variant rounded-[12px] py-3 font-label-md text-label-md text-on-surface dark:text-white hover:bg-surface-container-high dark:hover:bg-surface-container transition-colors"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 object-contain" />
                    Google
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setEmail('alex.rivera@mit.edu'); setPassword('password'); }}
                    className="flex items-center justify-center gap-2 border border-secondary-container dark:border-outline-variant rounded-[12px] py-3 font-label-md text-label-md text-on-surface dark:text-white hover:bg-surface-container-high dark:hover:bg-surface-container transition-colors"
                  >
                    <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" className="w-5 h-5 object-contain" />
                    Microsoft
                  </button>
                </div>
              </form>
            ) : (
              /* Create Account Form */
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Full Name</label>
                    <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                      placeholder="Alex Rivera" 
                      type="text"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Email</label>
                    <input 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                      placeholder="alex@uni.edu" 
                      type="email"
                      required
                    />
                    {email && !isEmailValid && (
                      <p className="text-xs text-error font-medium mt-1 ml-1">Enter a valid email format</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Password</label>
                    <input 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                      placeholder="••••••••" 
                      type="password"
                      required
                    />
                    {password && (
                      <div className="mt-2 text-xs space-y-1 text-on-surface-variant bg-surface-container p-3 rounded-lg border border-primary/5">
                        <p className="font-bold mb-1">Security checks:</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[14px] ${hasMinLength ? 'text-primary' : 'text-error'}`}>
                            {hasMinLength ? 'check_circle' : 'cancel'}
                          </span>
                          <span className={hasMinLength ? 'text-primary font-medium' : ''}>Min 8 characters</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[14px] ${hasNumber ? 'text-primary' : 'text-error'}`}>
                            {hasNumber ? 'check_circle' : 'cancel'}
                          </span>
                          <span className={hasNumber ? 'text-primary font-medium' : ''}>Contains a digit (0-9)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[14px] ${hasUppercase ? 'text-primary' : 'text-error'}`}>
                            {hasUppercase ? 'check_circle' : 'cancel'}
                          </span>
                          <span className={hasUppercase ? 'text-primary font-medium' : ''}>Contains an uppercase letter (A-Z)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[14px] ${hasLowercase ? 'text-primary' : 'text-error'}`}>
                            {hasLowercase ? 'check_circle' : 'cancel'}
                          </span>
                          <span className={hasLowercase ? 'text-primary font-medium' : ''}>Contains a lowercase letter (a-z)</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Confirm Password</label>
                    <input 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                      placeholder="••••••••" 
                      type="password"
                      required
                    />
                    {confirmPassword && (
                      <div className="mt-1.5 text-xs flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-[14px] ${passwordsMatch ? 'text-primary' : 'text-error'}`}>
                          {passwordsMatch ? 'check_circle' : 'cancel'}
                        </span>
                        <span className={passwordsMatch ? 'text-primary font-medium' : 'text-error font-medium'}>
                          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {role === 'student' ? (
                  <>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">University Name</label>
                      <input 
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                        placeholder="Massachusetts Institute of Technology" 
                        type="text"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Degree/Program</label>
                        <input 
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                          placeholder="B.S. Computer Science" 
                          type="text"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Graduation Year</label>
                        <select 
                          value={gradYear}
                          onChange={(e) => setGradYear(e.target.value)}
                          className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:ring-primary focus:border-primary text-on-surface dark:text-white"
                        >
                          <option value="2024">2024</option>
                          <option value="2025">2025</option>
                          <option value="2026">2026</option>
                          <option value="2027">2027</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : role === 'employer' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Company Name</label>
                      <input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                        placeholder="Lumina Systems"
                        type="text"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Industry</label>
                      <input
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                        placeholder="Technology"
                        type="text"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">University Name</label>
                      <input
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                        placeholder="Massachusetts Institute of Technology"
                        type="text"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Location</label>
                      <input
                        value={uniLocation}
                        onChange={(e) => setUniLocation(e.target.value)}
                        className="w-full bg-surface-container-low dark:bg-surface-container border border-secondary-container dark:border-outline-variant rounded-[12px] px-4 py-2.5 outline-none focus:border-primary text-on-surface dark:text-white"
                        placeholder="Cambridge, MA"
                        type="text"
                        required
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer mt-4">
                  <input 
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-secondary-container text-primary focus:ring-primary" 
                    type="checkbox" 
                  />
                  <span className="text-label-sm font-label-sm text-on-surface-variant leading-tight">
                    I agree to the{' '}
                    <Link className="text-primary dark:text-primary-fixed font-bold hover:underline" to="/legal/terms">Terms of Service</Link>
                    {' '}and{' '}
                    <Link className="text-primary dark:text-primary-fixed font-bold hover:underline" to="/legal/privacy">Privacy Policy</Link>
                    {' '}of CareerBridge.
                  </span>
                </label>

                <Button 
                  type="submit" 
                  className="w-full py-4 rounded-[12px] mt-2"
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              </form>
            )}
          </div>

          {/* Desktop Benefit Panel */}
          <div className="hidden lg:flex flex-col w-[320px] gap-6">
            {[
              { icon: 'psychology', title: 'AI Career Guidance', desc: 'Personalized roadmap based on your unique skills and academic background.' },
              { icon: 'description', title: 'Resume Analysis', desc: 'Instant feedback to optimize your resume for applicant tracking systems.' },
              { icon: 'forum', title: 'Mock Interviews', desc: 'Real-time practice sessions with AI to polish your communication skills.' },
              { icon: 'work', title: 'Exclusive Jobs', desc: 'Access to hand-picked internships and full-time roles from top-tier partners.' }
            ].map((benefit) => (
              <div 
                key={benefit.title}
                className="bg-white dark:bg-surface-container p-6 rounded-[16px] border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgba(2,54,41,0.06)] transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-secondary-container/40 rounded-lg flex items-center justify-center mb-4 text-primary group-hover:bg-secondary-container transition-colors">
                  <span className="material-symbols-outlined">{benefit.icon}</span>
                </div>
                <h3 className="font-label-md text-label-md text-primary dark:text-primary-fixed mb-1">{benefit.title}</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug">{benefit.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface dark:bg-surface-container border-t border-primary/10 w-full py-stack-lg">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-stack-md">
          <span className="font-label-sm text-label-sm text-on-surface-variant">© 2026 CareerBridge. All rights reserved.</span>
          <div className="flex gap-8">
            <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" to="/legal/privacy">Privacy Policy</Link>
            <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" to="/legal/terms">Terms of Service</Link>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="mailto:support@careerbridge.ai">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default Authentication;
