/**
 * Native app entry (Capacitor only).
 *
 * The web app keeps its marketing Landing page at "/" - nothing there is
 * removed or changed. A packaged app, though, should never open on a
 * marketing page: it boots into a branded splash and resolves straight to the
 * signed-in portal, or to auth when there is no session.
 *
 * This component only ever renders on native (see the "/" route in App.tsx),
 * so web behaviour is untouched.
 */
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SplashScreen } from '@capacitor/splash-screen';
import { useAuth } from '../../contexts/AuthContext';

/** Portal home for a signed-in role. Mirrors goByRole in mobile Authentication. */
const homeForRole = (role: string | null): string => {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'employer': return '/employer/dashboard';
    case 'university': return '/university/dashboard';
    case 'student': return '/student/dashboard';
    default: return '/login';
  }
};

/** Minimum time the branded splash stays up, so it reads as intentional
 *  rather than a flash of colour on fast devices. */
const MIN_SPLASH_MS = 1400;

const AppEntry: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    // Hand off from the native launch image to this React splash without a
    // white flash: our splash is already painted by the time we hide it.
    SplashScreen.hide().catch(() => undefined);
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  const ready = minElapsed && !isLoading;

  if (ready) {
    return <Navigate to={isAuthenticated ? homeForRole(role) : '/login'} replace />;
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0f172a] text-white overflow-hidden">
      {/* Ambient depth - matches the mobile design system's aurora treatment. */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/25 blur-3xl m-float" aria-hidden="true" />
      <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl m-float" aria-hidden="true" />

      <div className="relative flex flex-col items-center gap-5 m-splash-rise">
        <div className="w-20 h-20 rounded-3xl m-glass flex items-center justify-center shadow-2xl">
          <span className="material-symbols-rounded text-4xl text-white">work_history</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">CareerBridge</h1>
          <p className="text-sm text-white/60 mt-1">Your career, intelligently connected</p>
        </div>
      </div>

      <div className="absolute bottom-14 flex gap-1.5" role="status" aria-label="Loading">
        <span className="m-dot" />
        <span className="m-dot" />
        <span className="m-dot" />
      </div>
    </div>
  );
};

export default AppEntry;
