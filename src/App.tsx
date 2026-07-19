import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';

// Pages - Lazy Loaded for dynamic code splitting.
// adaptive(desktop, mobile) keeps ONE route per URL and picks the
// presentation at render time (Capacitor/touch/viewport detection);
// the unused variant's chunk is never downloaded.
import { adaptive } from './mobile/adaptive';

const Landing = lazy(() => import('./pages/student/Landing'));
const RoleSelection = lazy(() => import('./pages/student/RoleSelection'));
const Authentication = adaptive(() => import('./pages/student/Authentication'), () => import('./mobile/pages/student/Authentication'));
const ForgotPassword = lazy(() => import('./pages/student/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/student/ResetPassword'));
const EmailVerification = lazy(() => import('./pages/student/EmailVerification'));
const Onboarding = lazy(() => import('./pages/student/Onboarding'));
const Dashboard = adaptive(() => import('./pages/student/Dashboard'), () => import('./mobile/pages/student/Dashboard'));
const Jobs = adaptive(() => import('./pages/student/Jobs'), () => import('./mobile/pages/student/Jobs'));
const JobDetails = adaptive(() => import('./pages/student/JobDetails'), () => import('./mobile/pages/student/JobDetails'));
const SavedJobs = adaptive(() => import('./pages/student/SavedJobs'), () => import('./mobile/pages/student/SavedJobs'));
const Applications = adaptive(() => import('./pages/student/Applications'), () => import('./mobile/pages/student/Applications'));
const Profile = adaptive(() => import('./pages/student/Profile'), () => import('./mobile/pages/student/Profile'));
const MockInterview = adaptive(() => import('./pages/student/MockInterview'), () => import('./mobile/pages/student/MockInterview'));
const MockInterviewReport = adaptive(() => import('./pages/student/MockInterviewReport'), () => import('./mobile/pages/student/MockInterviewReport'));
const AICareerReport = adaptive(() => import('./pages/student/AICareerReport'), () => import('./mobile/pages/student/CareerCoach'));
const Messages = adaptive(() => import('./pages/student/Messages'), () => import('./mobile/pages/student/Messages'));
const Network = adaptive(() => import('./pages/student/Network'), () => import('./mobile/pages/student/Network'));
const Settings = adaptive(() => import('./pages/student/Settings'), () => import('./mobile/pages/student/Settings'));
const Notifications = adaptive(() => import('./pages/student/Notifications'), () => import('./mobile/pages/student/Notifications'));
const CompanyProfile = lazy(() => import('./pages/student/CompanyProfile'));
const InterviewDetails = lazy(() => import('./pages/student/InterviewDetails'));
const EventDetails = lazy(() => import('./pages/student/EventDetails'));
const MentorProfile = lazy(() => import('./pages/student/MentorProfile'));
const EmployerDashboard = adaptive(() => import('./pages/employer/Dashboard'), () => import('./mobile/pages/employer/EmployerPortal'));
const UniversityDashboard = adaptive(() => import('./pages/university/Dashboard'), () => import('./mobile/pages/university/UniversityPortal'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminPortal = adaptive(() => import('./pages/admin/AdminPortal'), () => import('./mobile/pages/admin/AdminPortal'));

// Legal
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));

// Search & Errors
const SearchResults = lazy(() => import('./pages/student/SearchResults'));
const Forbidden = lazy(() => import('./pages/student/Forbidden'));
const ServerError = lazy(() => import('./pages/student/ServerError'));
const ErrorBoundary = lazy(() => import('./pages/student/ErrorBoundary'));

import { ProtectedRoute } from './components/ProtectedRoute';
import { App as NativeApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { OfflineQueueProvider } from './contexts/OfflineQueueContext';
import { PushNotificationService } from './services/push-notification.service';

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 bg-white dark:bg-surface-container rounded-full flex items-center justify-center shadow-md relative">
      <span className="material-symbols-outlined text-[32px] text-primary animate-spin">sync</span>
    </div>
    <p className="text-sm font-bold text-primary dark:text-primary-fixed">Loading CareerBridge Page...</p>
  </div>
);

export const App: React.FC = () => {
  React.useEffect(() => {
    PushNotificationService.initialize().catch(() => undefined);

    const stateListener = NativeApp.addListener('appStateChange', (state) => {
      console.log('[LIFECYCLE] Native App State Changed:', state.isActive ? 'ACTIVE' : 'BACKGROUND');
    });

    // Android hardware back button: navigate back through the SPA history,
    // and only exit the app from a history root (e.g. the landing page).
    const backListener = NativeApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        NativeApp.exitApp();
      }
    });

    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
      StatusBar.setBackgroundColor({ color: '#0f172a' }).catch(() => undefined);
    }

    return () => {
      stateListener.then(l => l.remove());
      backListener.then(l => l.remove());
    };
  }, []);

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <OfflineQueueProvider>
                <NotificationProvider>
                  <MessageProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                    {/* Public Pathways */}
                     <Route path="/" element={<Landing />} />
                     <Route path="/login" element={<Authentication />} />
                     <Route path="/role-selection" element={<RoleSelection />} />
                     <Route path="/auth" element={<Authentication />} />
                     <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                     <Route path="/auth/reset-password" element={<ResetPassword />} />
                     <Route path="/auth/verify-email" element={<EmailVerification />} />

                     {/* Dedicated Admin Login */}
                     <Route path="/admin/login" element={<AdminLogin />} />

                     {/* Protected Admin Routes -- single portal shell handles all sub-views internally */}
                     <Route
                       path="/admin/*"
                       element={
                         <ProtectedRoute allowedRoles={['admin']}>
                           <AdminPortal />
                         </ProtectedRoute>
                       }
                     />

                    {/* Protected Student Pathways */}
                    <Route 
                      path="/student/onboarding" 
                      element={
                        <ProtectedRoute>
                          <Onboarding />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/jobs" 
                      element={
                        <ProtectedRoute>
                          <Jobs />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/jobs/:id" 
                      element={
                        <ProtectedRoute>
                          <JobDetails />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/saved" 
                      element={
                        <ProtectedRoute>
                          <SavedJobs />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/applications" 
                      element={
                        <ProtectedRoute>
                          <Applications />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/profile" 
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/mock-interview" 
                      element={
                        <ProtectedRoute>
                          <MockInterview />
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/student/interview-report/:id"
                      element={
                        <ProtectedRoute>
                          <MockInterviewReport />
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/student/career-report" 
                      element={
                        <ProtectedRoute>
                          <AICareerReport />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/messages" 
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/network" 
                      element={
                        <ProtectedRoute>
                          <Network />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/settings" 
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/notifications" 
                      element={
                        <ProtectedRoute>
                          <Notifications />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/company/:id" 
                      element={
                        <ProtectedRoute>
                          <CompanyProfile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/interview/:id" 
                      element={
                        <ProtectedRoute>
                          <InterviewDetails />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/event/:id" 
                      element={
                        <ProtectedRoute>
                          <EventDetails />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/mentor/:id" 
                      element={
                        <ProtectedRoute>
                          <MentorProfile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/search-results" 
                      element={
                        <ProtectedRoute>
                          <SearchResults />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Protected Employer Pathways */}
                    <Route 
                      path="/employer/dashboard" 
                      element={
                        <ProtectedRoute allowedRoles={['employer']}>
                          <EmployerDashboard />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Protected University Pathways */}
                    <Route 
                      path="/university/dashboard" 
                      element={
                        <ProtectedRoute allowedRoles={['university']}>
                          <UniversityDashboard />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Legal */}
                    <Route path="/legal/terms" element={<TermsOfService />} />
                    <Route path="/legal/privacy" element={<PrivacyPolicy />} />

                    {/* Security Error Screens */}
                    <Route path="/403" element={<Forbidden />} />
                    <Route path="/500" element={<ServerError />} />

                    {/* Fallback Error Boundary (404) */}
                    <Route path="*" element={<ErrorBoundary />} />
                  </Routes>
                </Suspense>
              </MessageProvider>
            </NotificationProvider>
          </OfflineQueueProvider>
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  </ThemeProvider>
    </Router>
  );
};

export default App;
