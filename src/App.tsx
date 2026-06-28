import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';

// Pages - Lazy Loaded for dynamic code splitting
const Landing = lazy(() => import('./pages/student/Landing'));
const RoleSelection = lazy(() => import('./pages/student/RoleSelection'));
const Authentication = lazy(() => import('./pages/student/Authentication'));
const ForgotPassword = lazy(() => import('./pages/student/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/student/ResetPassword'));
const EmailVerification = lazy(() => import('./pages/student/EmailVerification'));
const Onboarding = lazy(() => import('./pages/student/Onboarding'));
const Dashboard = lazy(() => import('./pages/student/Dashboard'));
const Jobs = lazy(() => import('./pages/student/Jobs'));
const JobDetails = lazy(() => import('./pages/student/JobDetails'));
const SavedJobs = lazy(() => import('./pages/student/SavedJobs'));
const Applications = lazy(() => import('./pages/student/Applications'));
const Profile = lazy(() => import('./pages/student/Profile'));
const MockInterview = lazy(() => import('./pages/student/MockInterview'));
const MockInterviewReport = lazy(() => import('./pages/student/MockInterviewReport'));
const AICareerReport = lazy(() => import('./pages/student/AICareerReport'));
const Messages = lazy(() => import('./pages/student/Messages'));
const Network = lazy(() => import('./pages/student/Network'));
const Settings = lazy(() => import('./pages/student/Settings'));
const Notifications = lazy(() => import('./pages/student/Notifications'));
const CompanyProfile = lazy(() => import('./pages/student/CompanyProfile'));
const InterviewDetails = lazy(() => import('./pages/student/InterviewDetails'));

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
    PushNotificationService.initialize();

    const stateListener = NativeApp.addListener('appStateChange', (state) => {
      console.log('[LIFECYCLE] Native App State Changed:', state.isActive ? 'ACTIVE' : 'BACKGROUND');
    });

    return () => {
      stateListener.then(l => l.remove());
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
                    <Route path="/role-selection" element={<RoleSelection />} />
                    <Route path="/auth" element={<Authentication />} />
                    <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/verify-email" element={<EmailVerification />} />

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
                      path="/student/interview-report/rep_1" 
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
                      path="/student/search-results" 
                      element={
                        <ProtectedRoute>
                          <SearchResults />
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
