/**
 * Mobile Authentication — premium sign in / sign up.
 * Uses the real AuthContext methods (login / registerStudent). Validation
 * mirrors the backend registerSchema exactly. No mock logic.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import type { AuthResult } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { isStudentOnboarded } from '../../../utils/onboarding';

type Role = 'student' | 'employer' | 'university';
type Tab = 'signin' | 'signup';

const roleMeta: Record<Role, { label: string; icon: string }> = {
  student: { label: 'Student', icon: 'school' },
  employer: { label: 'Employer', icon: 'business_center' },
  university: { label: 'University', icon: 'account_balance' },
};

const MobileAuthentication: React.FC = () => {
  const { login, registerStudent, selectRole, role: ctxRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const initialRole = (params.get('role') as Role) || (ctxRole as Role) || 'student';
  const [tab, setTab] = useState<Tab>('signin');
  const [role, setRole] = useState<Role>(initialRole);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { selectRole(role); }, [role, selectRole]);

  // fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [gradYear, setGradYear] = useState('2026');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [uniLocation, setUniLocation] = useState('');
  const [agree, setAgree] = useState(false);

  // validation — mirror backend registerSchema
  const checks = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
  }), [password]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwStrong = checks.length && checks.upper && checks.lower && checks.number;

  const goByRole = ({ role: r, user: profile }: AuthResult, firstRun = false) => {
    if (r === 'admin') navigate('/admin/dashboard');
    else if (r === 'employer') navigate('/employer/dashboard');
    else if (r === 'university') navigate('/university/dashboard');
    // A fresh registration always gets the one-time wizard (firstRun defeats
    // the onboarding guard); returning students with a saved profile skip it.
    else if (firstRun) navigate('/student/onboarding', { state: { firstRun: true } });
    else navigate(isStudentOnboarded(profile) ? '/student/dashboard' : '/student/onboarding');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return showToast('Enter a valid email address.', 'error');
    if (!password) return showToast('Enter your password.', 'error');
    setLoading(true);
    try {
      const resolved = await login(email, password);
      showToast('Welcome back!', 'success');
      goByRole(resolved);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sign in failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !emailValid) return showToast('Enter your name and a valid email.', 'error');
    if (!pwStrong) return showToast('Password needs 8+ chars with upper, lower & a number.', 'error');
    if (role === 'student' && (!university || !degree)) return showToast('Add your university and degree.', 'error');
    if (role === 'employer' && (!companyName || !industry)) return showToast('Add your company and industry.', 'error');
    if (role === 'university' && (!university || !uniLocation)) return showToast('Add the university name and location.', 'error');
    if (!agree) return showToast('Please accept the Terms to continue.', 'error');
    setLoading(true);
    try {
      const resolved = await registerStudent({
        name, email, password, role,
        universityName: role !== 'employer' ? university : undefined,
        degree: role === 'student' ? degree : undefined,
        graduationYear: role === 'student' ? parseInt(gradYear) : undefined,
        companyName: role === 'employer' ? companyName : undefined,
        industry: role === 'employer' ? industry : undefined,
        location: role === 'university' ? uniLocation : undefined,
      });
      showToast('Account created!', 'success');
      goByRole(resolved, true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sign up failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full h-12 rounded-2xl bg-surface-container/70 border border-on-surface/8 px-4 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition';

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Brand hero */}
      <div className="m-hero m-safe-top px-6 pt-10 pb-14 rounded-b-[32px]">
        <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[30px] text-white">hub</span>
        </div>
        <h1 className="text-[26px] font-extrabold leading-tight">CareerBridge</h1>
        <p className="text-white/75 text-[15px] mt-1">Your AI-powered career, all in one place.</p>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 -mt-8">
        <div className="rounded-3xl bg-surface shadow-xl border border-on-surface/5 p-5 m-rise m-rise-1">
          {/* Tabs */}
          <div className="flex p-1 rounded-2xl bg-surface-container/70 mb-5">
            {(['signin', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 h-10 rounded-xl text-sm font-bold transition ${tab === t ? 'bg-surface shadow text-primary' : 'text-on-surface-variant'}`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {tab === 'signup' && (
            <div className="flex gap-2 mb-4">
              {(Object.keys(roleMeta) as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl border transition ${role === r ? 'border-primary bg-primary-container/60 text-on-primary-container' : 'border-on-surface/8 text-on-surface-variant'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{roleMeta[r].icon}</span>
                  <span className="text-[11px] font-semibold">{roleMeta[r].label}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
            {tab === 'signup' && (
              <input className={input} placeholder={role === 'student' ? 'Full name' : 'Contact name'} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
            )}
            <input className={input} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />

            <div className="relative">
              <input className={input + ' pr-12'} type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={tab === 'signin' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-label={showPw ? 'Hide password' : 'Show password'}>
                <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>

            {tab === 'signup' && password.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {([['8+ chars', checks.length], ['Uppercase', checks.upper], ['Lowercase', checks.lower], ['Number', checks.number]] as [string, boolean][]).map(([l, ok]) => (
                  <span key={l} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ok ? 'bg-success/15 text-success' : 'bg-on-surface/8 text-on-surface-variant'}`}>
                    {ok ? '✓ ' : ''}{l}
                  </span>
                ))}
              </div>
            )}

            {tab === 'signup' && role === 'student' && (
              <>
                <input className={input} placeholder="University" value={university} onChange={e => setUniversity(e.target.value)} />
                <div className="flex gap-3">
                  <input className={input} placeholder="Degree" value={degree} onChange={e => setDegree(e.target.value)} />
                  <input className={input + ' w-28'} placeholder="Grad year" inputMode="numeric" value={gradYear} onChange={e => setGradYear(e.target.value)} />
                </div>
              </>
            )}
            {tab === 'signup' && role === 'employer' && (
              <>
                <input className={input} placeholder="Company name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                <input className={input} placeholder="Industry" value={industry} onChange={e => setIndustry(e.target.value)} />
              </>
            )}
            {tab === 'signup' && role === 'university' && (
              <>
                <input className={input} placeholder="University name" value={university} onChange={e => setUniversity(e.target.value)} />
                <input className={input} placeholder="Location" value={uniLocation} onChange={e => setUniLocation(e.target.value)} />
              </>
            )}

            {tab === 'signup' && (
              <label className="flex items-center gap-2 text-[13px] text-on-surface-variant pt-1">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="w-4 h-4 accent-primary" />
                I agree to the Terms & Privacy Policy
              </label>
            )}

            {tab === 'signin' && (
              <div className="text-right">
                <button type="button" onClick={() => navigate('/auth/forgot-password')} className="text-[13px] font-semibold text-primary">Forgot password?</button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="m-press w-full h-13 min-h-[52px] rounded-2xl bg-primary text-on-primary font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : (tab === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="text-center text-[13px] text-on-surface-variant mt-4">
            {tab === 'signin' ? "New to CareerBridge? " : 'Already have an account? '}
            <button onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')} className="font-bold text-primary">
              {tab === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-[11px] text-on-surface-variant mt-5 pb-8 px-4">
          By continuing you agree to CareerBridge processing your data to power AI career features.
        </p>
      </div>
    </div>
  );
};

export default MobileAuthentication;
