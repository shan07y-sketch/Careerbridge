import type { Job, Company, Application, Student, Recruiter, Mentor, Interview, Event, Thread, Message, Notification, CareerInsight, InterviewReport, AICareerInsight, CandidateEvaluation, CandidateComparisonResult, StudentPlacementInsight, DepartmentInsight, DriveRecommendationResult, PlacementReport, AdminInsightReport, FraudDetectionResult, PlatformInsightsResult, ModerationResult, SystemHealthResult, ExecutiveReportResult, PredictiveAnalyticsResult } from '../types';
// PostgreSQL is the single source of truth. No mock or seed data is imported
// here: every service below returns real API data, or throws so the UI can
// render an honest error/empty state -- never fabricated records.

// API origin comes from the environment in deployed builds (Render, etc.);
// localhost is only the local-development fallback. Set VITE_API_URL to the
// backend origin WITHOUT the /api/v1 suffix, e.g. https://api.example.com
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/+$/, '');
const API_BASE_URL = `${API_ORIGIN}/api/v1`;
export { API_ORIGIN };

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

/**
 * Fetch wrapper for every API call. PostgreSQL is the single source of truth:
 * there is NO mock/offline fallback. On failure the real error is thrown so
 * the UI shows an honest error/empty state instead of fabricated data.
 * Transparently rotates an expired access token via the httpOnly refresh
 * cookie and retries the request once.
 */
const fetchJson = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers
    });

    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      const hasToken = !!localStorage.getItem('accessToken');
      if (!hasToken) {
        throw new Error('Session expired or unauthorized');
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          if (refreshResponse.ok) {
            const refreshPayload = await refreshResponse.json();
            const newAccessToken = refreshPayload.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            isRefreshing = false;
            // Wake up any concurrent callers that queued while we refreshed...
            onRefreshed(newAccessToken);
            // ...and retry THIS request directly. (Previously the refresh
            // initiator subscribed AFTER onRefreshed had already flushed the
            // subscriber list, so its promise never settled and the original
            // request silently hung forever.)
            return fetchJson(endpoint, {
              ...options,
              headers: {
                ...headers,
                'Authorization': `Bearer ${newAccessToken}`
              }
            });
          } else {
            isRefreshing = false;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('isAuthenticated');
            onRefreshed('');
            throw new Error('Session expired. Please log in again.');
          }
        } catch (refreshErr) {
          isRefreshing = false;
          localStorage.removeItem('accessToken');
          localStorage.removeItem('isAuthenticated');
          onRefreshed('');
          throw refreshErr;
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            reject(new Error('Session expired. Please log in again.'));
            return;
          }
          const retriedOptions = {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${newToken}`
            }
          };
          resolve(fetchJson(endpoint, retriedOptions));
        });
      });
    }

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || 'API request failed');
    }
    return payload.data;
  } catch (err) {
    // No mock fallback: surface the real failure so the UI shows an actual
    // error/empty state instead of silently rendering fabricated data.
    console.error(`REST call to ${endpoint} failed.`, err);
    throw err;
  }
};

// Map a raw backend StudentProfile (+ User) onto the UI's Student shape.
// Real data only: when the student hasn't set a field yet, return an honest
// empty value ('' / 0 / [] / false) so the UI renders its own empty state --
// never a fabricated placeholder identity like the old "Alex Rivera" default.
const WORK_MODE_LABEL: Record<string, Student['workMode']> = {
  ON_SITE: 'On-site', HYBRID: 'Hybrid', REMOTE: 'Remote'
};
const mapProfileToStudent = (profile: any): Student => {
  if (!profile) {
    return {
      id: '', name: '', email: '', university: '', degree: '', gradYear: 0,
      profilePicture: '', careerGoal: '', workMode: 'On-site', preferredLocation: '',
      skills: [], resumeUrl: undefined, portfolioUrl: undefined, resumeScore: 0,
      readinessScore: 0, linkedInConnected: false, gitHubConnected: false,
      phoneVerified: false, emailVerified: false
    } as Student;
  }
  return {
    id: profile.id || '',
    name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
    email: profile.email || profile.user?.email || '',
    university: profile.universityName || profile.university?.name || '',
    degree: profile.degree || profile.educationHistory?.[0]?.degree || '',
    gradYear: profile.graduationYear || 0,
    profilePicture: profile.avatarUrl || '',
    careerGoal: profile.preferredRole || '',
    workMode: WORK_MODE_LABEL[profile.preferredWorkMode] || 'On-site',
    preferredLocation: (profile.preferredLocations || []).join('; '),
    skills: (profile.skills || []).map((s: any) => ({ name: s.skill?.name || s.name, level: s.level || 0 })),
    resumeUrl: profile.resumes?.[0]?.fileUrl || undefined,
    portfolioUrl: profile.portfolioUrl || undefined,
    // Resume score is the resume's own ATS analysis score, not the career
    // readiness score (that surfaces separately as readinessScore).
    resumeScore: profile.resumes?.[0]?.resumeAnalyses?.[0]?.score ?? 0,
    resumeScoreEstimated: profile.resumes?.[0]?.resumeAnalyses?.[0]?.modelVersion?.endsWith('-estimated') ?? false,
    readinessScore: profile.readinessScore || 0,
    linkedInConnected: !!profile.linkedInConnected,
    gitHubConnected: !!profile.gitHubConnected,
    phoneVerified: !!profile.phoneVerified,
    emailVerified: !!profile.emailVerified,
    careerPath: profile.careerPath ?? undefined,
    targetCompanies: profile.targetCompanies ?? undefined,
    targetSalaryRange: profile.targetSalaryRange ?? undefined,
    jobTypePreference: profile.jobTypePreference ?? undefined,
    preferredIndustries: profile.preferredIndustries ?? undefined,
    recommendationFrequency: profile.recommendationFrequency ?? undefined
  };
};

/**
 * Map the backend's authenticated user object (User + role-specific profile
 * includes, exactly as returned by POST /auth/login and GET /auth/me) into
 * the UI's Student shape, per role. No mock fallbacks: every field comes
 * from the API response.
 */
const mapAuthUserByRole = (user: any): Student => {
  const role = user?.role?.toLowerCase() || 'student';
  if (role === 'employer' || role === 'recruiter') {
    // A recruiter/employer account has no studentProfile -- mapping it
    // through mapProfileToStudent() used to silently fall back to the
    // hardcoded mock student ("Alex Rivera"), which is why the Employer
    // Portal topbar showed a fake name instead of the real recruiter.
    const rp = user?.recruiterProfile;
    return {
      id: rp?.id || user?.id,
      name: [rp?.firstName, rp?.lastName].filter(Boolean).join(' ') || user?.email || 'Recruiter',
      email: user?.email || '',
      university: rp?.company?.name || '',
      degree: rp?.title || '',
      gradYear: new Date().getFullYear(),
      profilePicture: rp?.company?.logoUrl || undefined,
    } as Student;
  }
  if (role === 'university') {
    const up = user?.universityProfile;
    return {
      id: up?.id || user?.id,
      name: up?.name || user?.email || 'University',
      email: user?.email || '',
      university: up?.name || '',
      degree: 'University Administration',
      gradYear: new Date().getFullYear(),
      profilePicture: up?.logoUrl || undefined,
    } as Student;
  }
  if (role === 'admin') {
    return {
      id: user?.id,
      name: user?.email?.split('@')[0] || 'Administrator',
      email: user?.email || '',
      university: 'CareerBridge Administration',
      degree: 'System Administrator',
      gradYear: new Date().getFullYear(),
    } as Student;
  }
  const student = mapProfileToStudent(user?.studentProfile);
  // The student's login identity (email) lives on User, not StudentProfile.
  return { ...student, email: user?.email || student.email } as Student;
};

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'employer' | 'university';
  // student
  universityName?: string;
  degree?: string;
  graduationYear?: number;
  // employer
  companyName?: string;
  industry?: string;
  // university
  location?: string;
}

export const AuthService = {
  login: async (email: string, password: string): Promise<Student> => {
    const data = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('isAuthenticated', 'true');
    const userRole = data.user?.role?.toLowerCase() || 'student';
    localStorage.setItem('role', userRole);
    return mapAuthUserByRole(data.user);
  },
  /**
   * Restore the current session from the httpOnly refresh cookie + stored
   * access token via GET /auth/me. Works for every role (the old approach
   * called /student/profile, which 403'd for employer/university/admin and
   * logged those users out on every page refresh).
   */
  me: async (): Promise<{ user: Student; role: string }> => {
    const data = await fetchJson('/auth/me');
    const role = data.user?.role?.toLowerCase() || 'student';
    localStorage.setItem('role', role);
    return { user: mapAuthUserByRole(data.user), role };
  },
  /**
   * Register with the EXACT contract enforced by the backend's
   * registerSchema (backend/src/modules/auth/auth.validation.ts):
   *   STUDENT    -> firstName + lastName          (+ optional universityName/degree/graduationYear)
   *   EMPLOYER   -> companyName + industry        (+ firstName/lastName for the recruiter profile)
   *   UNIVERSITY -> universityName + location
   */
  register: async (payload: RegisterPayload): Promise<any> => {
    const parts = payload.name.trim().split(/\s+/);
    const firstName = parts[0] || 'First';
    const lastName = parts.slice(1).join(' ') || 'Last';
    const body: any = {
      email: payload.email,
      password: payload.password,
      role: payload.role.toUpperCase(),
      firstName,
      lastName
    };
    if (payload.role === 'student') {
      if (payload.universityName) body.universityName = payload.universityName;
      if (payload.degree) body.degree = payload.degree;
      if (payload.graduationYear) body.graduationYear = payload.graduationYear;
    } else if (payload.role === 'employer') {
      body.companyName = payload.companyName;
      body.industry = payload.industry;
    } else if (payload.role === 'university') {
      body.universityName = payload.universityName;
      body.location = payload.location;
    }
    const data = await fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return data;
  },
  /**
   * Real POST /auth/logout: revokes the refresh token server-side and clears
   * the httpOnly cookie. Best-effort -- local session state is cleared by the
   * caller regardless, so a network failure can't trap the user logged in.
   */
  logout: async (): Promise<void> => {
    try {
      await fetchJson('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Server-side logout failed (local session cleared anyway).', err);
    }
  },
  // Real POST /auth/change-password -- no mock fallback, since a fake
  // success here would tell the user their password changed when it didn't.
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await fetchJson('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword })
    });
  }
};

/** Relative "3d ago" label from an ISO timestamp. */
const toPostedTime = (iso?: string): string => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const JOB_TYPE_LABELS: Record<string, Job['type']> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
  TEMPORARY: 'Contract'
};

const WORK_MODE_LABELS: Record<string, Job['workMode']> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ON_SITE: 'On-site'
};

/**
 * The API returns the raw Prisma Job (company relation, enum casing, salary
 * min/max); the UI's Job type expects display-ready fields. Derive them here
 * so every consumer (dashboard cards, jobs list, details) gets one shape.
 */
const mapApiJob = (raw: any): Job => {
  if (!raw) return raw;
  const salaryRange =
    raw.salaryRange ??
    (raw.salaryMin != null && raw.salaryMax != null
      ? `$${Math.round(raw.salaryMin / 1000)}k – $${Math.round(raw.salaryMax / 1000)}k`
      : '');
  return {
    ...raw,
    companyName: raw.companyName ?? raw.company?.name ?? '',
    companyLogo: raw.companyLogo ?? raw.company?.logoUrl ?? '',
    postedTime: raw.postedTime ?? toPostedTime(raw.createdAt),
    rating: raw.rating ?? raw.company?.rating ?? 0,
    salaryRange,
    type: JOB_TYPE_LABELS[raw.jobType] ?? raw.type ?? raw.jobType ?? '',
    workMode: WORK_MODE_LABELS[raw.workMode] ?? raw.workMode ?? '',
    matchRate: raw.matchRate ?? raw.score ?? 0,
    easyApply: raw.easyApply ?? false,
    requirements: Array.isArray(raw.requirements)
      ? raw.requirements
      : raw.requirements
        ? String(raw.requirements).split(/\r?\n|(?<=\.)\s+/).filter(Boolean)
        : [],
    responsibilities: Array.isArray(raw.responsibilities) ? raw.responsibilities : []
  };
};

export const JobService = {
  getJobs: async (): Promise<Job[]> => {
    const response = await fetchJson('/jobs');
    const list = Array.isArray(response) ? response : (response?.data ?? []);
    return list.map(mapApiJob);
  },
  getJobById: async (id: string): Promise<Job | undefined> => {
    const job = await fetchJson(`/jobs/${id}`);
    return job ? mapApiJob(job) : undefined;
  },
  getSavedJobs: async (): Promise<Job[]> => {
    const response = await fetchJson('/jobs/saved');
    const list = Array.isArray(response) ? response : (response?.data ?? []);
    return list.map(mapApiJob);
  },
  getJobsByCompanyId: async (companyId: string): Promise<Job[]> => {
    const response = await fetchJson(`/jobs?companyId=${companyId}`);
    const list = Array.isArray(response) ? response : (response?.data ?? []);
    return list.map(mapApiJob);
  },
  toggleSaveJob: async (jobId: string): Promise<boolean> => {
    const result = await fetchJson(`/jobs/${jobId}/save`, { method: 'POST' });
    return !!result?.saved;
  },
  isJobSaved: async (jobId: string): Promise<boolean> => {
    const result = await fetchJson(`/jobs/${jobId}`);
    return !!result?.isSaved;
  }
};

export const CompanyService = {
  getCompanies: async (): Promise<Company[]> => {
    return fetchJson('/companies');
  },
  getCompanyById: async (id: string): Promise<Company | undefined> => {
    return fetchJson(`/companies/${id}`);
  },
  getRecruiterById: async (id: string): Promise<Recruiter | undefined> => {
    return fetchJson(`/recruiters/${id}`);
  },
  getRecruiterByCompanyId: async (companyId: string): Promise<Recruiter | undefined> => {
    return fetchJson(`/recruiters/company/${companyId}`);
  },
  getMentorById: async (id: string): Promise<Mentor | undefined> => {
    return fetchJson(`/mentors/${id}`);
  },
  getMentors: async (): Promise<Mentor[]> => {
    return fetchJson('/mentors');
  }
};

/**
 * Maps a raw backend Application record (Prisma shape: uppercase status,
 * job/company relations, offer, interviews) onto the UI-shaped Application
 * type this page renders. Defensive: a record that is already UI-shaped
 * (lowercase status) passes through unchanged.
 */
const mapApplicationRecord = (raw: any): Application => {
  if (!raw || typeof raw.status !== 'string') return raw;
  if (raw.status === raw.status.toLowerCase()) return raw as Application; // already UI-shaped

  const statusMap: Record<string, Application['status']> = {
    APPLIED: 'applied',
    REVIEWING: 'applied',
    SHORTLISTED: 'applied',
    SCREENING: 'applied',
    INTERVIEWING: 'interviewing',
    OFFERED: 'offer',
    REJECTED: 'rejected',
    WITHDRAWN: 'rejected'
  };

  return {
    id: raw.id,
    jobId: raw.jobId,
    status: statusMap[raw.status] || 'applied',
    dateApplied: raw.createdAt,
    jobTitle: raw.job?.title || 'Untitled Role',
    companyName: raw.job?.company?.name || 'Company',
    companyLogo: raw.job?.company?.logoUrl || '',
    offer: raw.offer
      ? {
          id: raw.offer.id,
          title: raw.offer.title,
          salary: raw.offer.salary,
          currency: raw.offer.currency,
          startDate: raw.offer.startDate,
          status: raw.offer.status
        }
      : null,
    interviews: (raw.interviews || []).map((iv: any) => ({
      id: iv.id,
      title: iv.title,
      scheduledAt: iv.scheduledAt,
      duration: iv.duration,
      locationUrl: iv.locationUrl,
      status: iv.status
    }))
  };
};

export const ApplicationService = {
  getApplications: async (): Promise<Application[]> => {
    const data = await fetchJson('/applications');
    const rows = Array.isArray(data) ? data : (data?.data ?? []);
    return rows.map(mapApplicationRecord);
  },
  applyToJob: async (jobId: string): Promise<Application> => {
    const data = await fetchJson('/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId })
    });
    return mapApplicationRecord(data);
  },
  // No mock fallback for these three -- withdrawing or responding to a real
  // offer must reflect the real backend state, never a fabricated success.
  retractApplication: async (id: string): Promise<void> => {
    await fetchJson(`/applications/${id}`, { method: 'DELETE' });
  },
  acceptOffer: async (applicationId: string): Promise<void> => {
    await fetchJson(`/applications/${applicationId}/offer/accept`, { method: 'PATCH' });
  },
  declineOffer: async (applicationId: string): Promise<void> => {
    await fetchJson(`/applications/${applicationId}/offer/decline`, { method: 'PATCH' });
  }
};

export const ProfileService = {
  getStudentProfile: async (): Promise<Student> => {
    const data = await fetchJson('/student/profile');
    return mapProfileToStudent(data);
  },
  updateStudentProfile: async (updates: Partial<Student>): Promise<Student> => {
    const data = await fetchJson('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return mapProfileToStudent(data);
  }
};

export const CareerService = {
  getCareerInsight: async (): Promise<CareerInsight> => {
    return fetchJson('/career/insights');
  },
  getInterviewReports: async (): Promise<InterviewReport[]> => {
    return fetchJson('/career/mock-interviews');
  },
  /**
   * Real AI Career Intelligence (Phase 3). No mock fallback: this is a
   * data-integrity-sensitive AI generation call, not a display list, so a
   * failure should surface as an error rather than silently render fake data.
   */
  getLatestAICareerInsight: async (): Promise<AICareerInsight | null> => {
    return fetchJson('/career/insights', {});
  },
  generateAICareerInsight: async (targetRole: string): Promise<AICareerInsight> => {
    return fetchJson('/career/insight', {
      method: 'POST',
      body: JSON.stringify({ targetRole })
    });
  }
};

/* ── AI Career Coach chat ─────────────────────────────────────────── */

export interface CoachConversationSummary {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
  lastRole: string | null;
}
export interface CoachMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  estimated: boolean;
  createdAt: string;
}
export interface CoachConversation {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messages: CoachMessage[];
}
export interface CoachStreamHandlers {
  onMeta?: (m: { conversationId: string; title: string }) => void;
  onDelta?: (text: string) => void;
  onDone?: (r: { conversationId: string; messageId: string; estimated: boolean }) => void;
  onError?: (message: string) => void;
  signal?: AbortSignal;
}

export const CoachService = {
  listConversations: async (): Promise<CoachConversationSummary[]> => {
    return fetchJson('/coach/conversations');
  },
  createConversation: async (title?: string): Promise<CoachConversation> => {
    return fetchJson('/coach/conversations', { method: 'POST', body: JSON.stringify({ title }) });
  },
  getConversation: async (id: string): Promise<CoachConversation> => {
    return fetchJson(`/coach/conversations/${id}`);
  },
  updateConversation: async (id: string, data: { title?: string; pinned?: boolean }): Promise<void> => {
    await fetchJson(`/coach/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  deleteConversation: async (id: string): Promise<void> => {
    await fetchJson(`/coach/conversations/${id}`, { method: 'DELETE' });
  },
  /**
   * Streams an assistant reply over SSE. Uses fetch (not EventSource) so the
   * Bearer token travels in the Authorization header like every other call.
   */
  streamChat: async (
    params: { conversationId?: string; content: string },
    handlers: CoachStreamHandlers
  ): Promise<void> => {
    const resp = await fetch(`${API_BASE_URL}/coach/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify(params),
      signal: handlers.signal
    });
    if (!resp.ok || !resp.body) {
      let msg = 'The coach could not respond right now.';
      try { const j = await resp.json(); msg = j.error?.message || msg; } catch { /* non-JSON */ }
      handlers.onError?.(msg);
      return;
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const evMatch = block.match(/^event: (.*)$/m);
          const dataMatch = block.match(/^data: (.*)$/m);
          if (!evMatch || !dataMatch) continue;
          let data: any;
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }
          switch (evMatch[1]) {
            case 'meta': handlers.onMeta?.(data); break;
            case 'delta': handlers.onDelta?.(data.text); break;
            case 'done': handlers.onDone?.(data); break;
            case 'error': handlers.onError?.(data.message); break;
          }
        }
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        handlers.onError?.(err instanceof Error ? err.message : 'Stream interrupted');
      }
    }
  }
};

export const MessageService = {
  getThreads: async (): Promise<Thread[]> => {
    return fetchJson('/messages');
  },
  getMessagesByThreadId: async (threadId: string): Promise<Message[]> => {
    return fetchJson(`/messages/${threadId}`);
  },
  sendMessage: async (threadId: string, _senderId: string, content: string): Promise<Message> => {
    // Returns the real persisted message (with its DB id, timestamp and
    // sender) from the backend -- no locally fabricated echo message.
    return fetchJson(`/messages/${threadId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }
};

export const NotificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    return fetchJson('/notifications');
  },
  markAsRead: async (id: string): Promise<void> => {
    await fetchJson(`/notifications/${id}/read`, { method: 'PATCH' });
  },
  markAllAsRead: async (): Promise<void> => {
    await fetchJson('/notifications/read-all', { method: 'PATCH' });
  }
};

export const EventService = {
  getEvents: async (): Promise<Event[]> => {
    return fetchJson('/events');
  },
  getEventById: async (id: string): Promise<Event | undefined> => {
    return fetchJson(`/events/${id}`);
  },
  registerForEvent: async (id: string): Promise<Event | undefined> => {
    return fetchJson(`/events/${id}/register`, { method: 'POST' });
  }
};

export const InterviewService = {
  getInterviews: async (): Promise<Interview[]> => {
    return fetchJson('/interviews');
  },
  getInterviewById: async (id: string): Promise<Interview | undefined> => {
    return fetchJson(`/interviews/${id}`);
  }
};

export interface NetworkConnection {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  direction: 'incoming' | 'outgoing';
  updatedAt: string;
  counterpart: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role?: string | null;
  };
}

export interface ResumeVersion {
  id: string;
  fileName: string;
  fileUrl: string;
  status: 'PARSED' | 'PROCESSING' | 'FAILED';
  version: number;
  isActive: boolean;
  fileSizeBytes: number | null;
  mimeType: string | null;
  extractedSkills: string[];
  shareEnabled: boolean;
  shareExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  resumeAnalyses?: { summary: string; score: number; status: string }[];
}

export interface ShareLinkResult {
  shareUrl: string;
  shareExpiresAt: string;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Resume workflow calls that need multipart form-data or binary responses
 * can't go through fetchJson (JSON-only, with a dev mock fallback that would
 * be dishonest here -- there is no meaningful fake version of "your resume
 * file"). These helpers stay real-backend-only and surface actual errors.
 */
const uploadFile = async (endpoint: string, formData: FormData): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
    credentials: 'include'
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Upload failed.');
  }
  return payload.data;
};

const downloadBlob = async (endpoint: string, suggestedFileName: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
    headers: authHeaders(),
    credentials: 'include'
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Download failed.');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const ResumeService = {
  getHistory: async (): Promise<ResumeVersion[]> => {
    return fetchJson('/resume', {});
  },
  getDetail: async (id: string): Promise<ResumeVersion> => {
    return fetchJson(`/resume/${id}`, {});
  },
  upload: async (file: File): Promise<ResumeVersion> => {
    const formData = new FormData();
    formData.append('resume', file);
    return uploadFile('/resume/upload', formData);
  },
  deleteResume: async (id: string): Promise<void> => {
    await fetchJson(`/resume/${id}`, { method: 'DELETE' });
  },
  download: async (id: string, fileName: string): Promise<void> => {
    await downloadBlob(`/resume/${id}/download`, fileName);
  },
  createShareLink: async (id: string): Promise<ShareLinkResult> => {
    return fetchJson(`/resume/${id}/share`, { method: 'POST' });
  },
  revokeShareLink: async (id: string): Promise<void> => {
    await fetchJson(`/resume/${id}/share`, { method: 'DELETE' });
  }
};

// ==========================================
// MOCK INTERVIEW AI (production: personalized adaptive voice interview)
// ==========================================
// Named `MockInterviewAIService` (not `InterviewService`) because that name
// is already taken above by the employer-scheduled real-interview reads
// (/interviews) -- a completely different feature (recruiter-scheduled
// video calls vs. this AI practice tool).

export type MockInterviewType = 'HR' | 'TECHNICAL' | 'BEHAVIORAL' | 'APTITUDE' | 'MIXED';
export type MockInterviewDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface StartMockInterviewOptions {
  interviewType: MockInterviewType;
  difficulty: MockInterviewDifficulty;
  numQuestions: number;
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  targetRole?: string;
}

export interface StartMockInterviewResult {
  mockInterviewId: string;
  totalQuestions: number;
  interviewType: MockInterviewType;
  difficulty: MockInterviewDifficulty;
  jobTitle: string;
  companyName: string | null;
  planEstimated: boolean;
  questionIndex: number;
  question: string;
  questionType: string;
  questionDifficulty: string;
  expectedSkills: string[];
}

export interface MockInterviewAnswerEvaluation {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  relevanceScore: number;
  completenessScore: number;
  grammarScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestedBetterAnswer: string;
  /** True when the offline fallback produced this evaluation ("Estimated - AI unavailable"). */
  estimated: boolean;
}

export interface SubmitMockAnswerResult {
  questionIndex: number;
  transcript: string;
  wordsPerMinute: number | null;
  fillerWordCount: number;
  evaluation: MockInterviewAnswerEvaluation;
  isLastQuestion: boolean;
  nextQuestionIndex?: number;
  nextQuestion?: string;
  nextQuestionType?: string;
  nextQuestionDifficulty?: string;
  nextExpectedSkills?: string[];
}

export interface MockInterviewRoadmapStep {
  step: number;
  title: string;
  description: string;
  resources: string[];
}

export interface MockInterviewQuestionBreakdown {
  questionIndex: number;
  questionType: string;
  difficulty: string | null;
  questionText: string;
  expectedSkills: string[];
  answerTranscript: string | null;
  answerMethod: string | null;
  answerDurationSec: number | null;
  wordsPerMinute: number | null;
  fillerWordCount: number | null;
  technicalScore: number | null;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  relevanceScore: number | null;
  completenessScore: number | null;
  grammarScore: number | null;
  overallScore: number;
  feedback: string | null;
  strengths: string[];
  weaknesses: string[];
  suggestedBetterAnswer: string | null;
  evaluationEstimated: boolean;
}

export interface MockInterviewReportResult {
  id: string;
  mockInterviewId: string;
  summary: string;
  score: number;
  technicalScore: number | null;
  hrScore: number | null;
  behavioralScore: number | null;
  problemSolvingScore: number | null;
  communicationScore: number | null;
  confidenceScore: number | null;
  grammarScore: number | null;
  answerQualityScore: number | null;
  interviewReadiness: number | null;
  jobMatchPercent: number | null;
  skillMatchPercent: number | null;
  speakingSpeedWpm: number | null;
  fillerWordCount: number | null;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  improvementPlan: string[];
  learningRoadmap: MockInterviewRoadmapStep[];
  suggestedCourses: string[];
  recommendedProjects: string[];
  recommendedCertifications: string[];
  careerRecommendations: string[];
  suggestedQuestions: string[];
  aiSummary: string;
  questionBreakdown: MockInterviewQuestionBreakdown[];
  cameraSummary: { event: string; count: number }[] | null;
  /** True when any part of the report came from the offline fallback. */
  estimated: boolean;
  createdAt: string;
  modelVersion?: string;
}

export interface MockInterviewQuestionRecord {
  id: string;
  questionIndex: number;
  questionType: string;
  difficulty: string | null;
  questionText: string;
  expectedSkills: string[];
  answerTranscript: string | null;
  answerMethod: string | null;
  answerQualityScore: number | null;
  technicalAccuracy: number | null;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  relevanceScore: number | null;
  completenessScore: number | null;
  grammarScore: number | null;
  feedback: string | null;
  suggestedBetterAnswer: string | null;
  strengths: string[];
  weaknesses: string[];
  wordsPerMinute: number | null;
  fillerWordCount: number | null;
  evaluationEstimated: boolean;
}

export interface MockInterviewSessionDetail {
  id: string;
  jobTitle: string;
  companyName: string | null;
  targetRole: string | null;
  interviewType: MockInterviewType;
  difficulty: MockInterviewDifficulty;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  sharedWithEmployers: boolean;
  totalDurationSec: number | null;
  createdAt: string;
  completedAt: string | null;
  questions: MockInterviewQuestionRecord[];
  reports: MockInterviewReportResult[];
}

export interface MockInterviewHistoryEntry {
  id: string;
  jobTitle: string;
  companyName: string | null;
  interviewType: MockInterviewType;
  difficulty: MockInterviewDifficulty;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  sharedWithEmployers: boolean;
  createdAt: string;
  completedAt: string | null;
  reports: MockInterviewReportResult[];
}

/**
 * Submits an answer: the REAL transcript (from browser speech-to-text or the
 * typed fallback) plus timing, with the recorded audio/video clips attached
 * as evidence when available. Multipart because of the optional binary clips.
 */
const submitInterviewAnswer = async (
  mockInterviewId: string,
  questionIndex: number,
  payload: {
    transcript: string;
    answerMethod: 'voice' | 'text';
    durationSec?: number;
    audioBlob?: Blob | null;
    videoBlob?: Blob | null;
  }
): Promise<SubmitMockAnswerResult> => {
  const form = new FormData();
  form.append('questionIndex', String(questionIndex));
  form.append('transcript', payload.transcript);
  form.append('answerMethod', payload.answerMethod);
  if (payload.durationSec != null) form.append('durationSec', String(Math.round(payload.durationSec)));
  if (payload.audioBlob) form.append('audio', payload.audioBlob, 'answer.webm');
  if (payload.videoBlob) form.append('video', payload.videoBlob, 'answer-video.webm');

  const response = await fetch(`${API_BASE_URL}/interview/${mockInterviewId}/answer`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
    credentials: 'include'
  });
  const payloadJson = await response.json();
  if (!response.ok) {
    throw new Error(payloadJson.error?.message || 'Failed to submit your answer.');
  }
  return payloadJson.data;
};

export const MockInterviewAIService = {
  startInterview: async (options: StartMockInterviewOptions): Promise<StartMockInterviewResult> => {
    return fetchJson('/interview/start', { method: 'POST', body: JSON.stringify(options) });
  },
  submitAnswer: submitInterviewAnswer,
  /** Reports an observable participation event (face lost, window blur, ...). Fire-and-forget. */
  addObservation: async (mockInterviewId: string, type: string, detail?: string): Promise<void> => {
    await fetchJson(`/interview/${mockInterviewId}/observation`, {
      method: 'POST',
      body: JSON.stringify({ type, detail })
    }).catch(() => undefined);
  },
  endInterview: async (mockInterviewId: string): Promise<MockInterviewReportResult> => {
    return fetchJson(`/interview/${mockInterviewId}/end`, { method: 'POST' });
  },
  getHistory: async (): Promise<MockInterviewHistoryEntry[]> => {
    return fetchJson('/interview', {});
  },
  getSessionDetail: async (mockInterviewId: string): Promise<MockInterviewSessionDetail> => {
    return fetchJson(`/interview/${mockInterviewId}`, {});
  },
  setSharing: async (mockInterviewId: string, shared: boolean): Promise<{ sharedWithEmployers: boolean }> => {
    return fetchJson(`/interview/${mockInterviewId}/share`, { method: 'PATCH', body: JSON.stringify({ shared }) });
  },
  /** Downloads the stored report as a branded PDF (same values as every other surface). */
  downloadReportPdf: async (mockInterviewId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/interview/${mockInterviewId}/report/pdf`, {
      headers: authHeaders(),
      credentials: 'include'
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error?.message || 'Could not download the PDF report.');
    }
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename="([^"]+)"/.exec(disposition);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = match?.[1] ?? 'CareerBridge-Interview-Report.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
};

export const NetworkService = {
  getMentors: async (): Promise<Mentor[]> => {
    return fetchJson('/mentors');
  },
  getRecruiters: async (): Promise<Recruiter[]> => {
    return fetchJson('/recruiters');
  },
  getPeers: async (): Promise<Student[]> => {
    return fetchJson('/peers');
  },
  // Real, persisted networking workflow (backend: /modules/network). No mock
  // fallback is provided here on purpose -- there is no meaningful "fake"
  // version of a connection request that would be honest to show a user.
  getConnections: async (): Promise<NetworkConnection[]> => {
    return fetchJson('/network/connections', {});
  },
  requestConnection: async (targetStudentProfileId: string): Promise<NetworkConnection> => {
    return fetchJson('/network/connect', {
      method: 'POST',
      body: JSON.stringify({ targetStudentProfileId })
    });
  },
  acceptConnection: async (connectionId: string): Promise<NetworkConnection> => {
    return fetchJson(`/network/connections/${connectionId}/accept`, { method: 'PATCH' });
  },
  declineConnection: async (connectionId: string): Promise<NetworkConnection> => {
    return fetchJson(`/network/connections/${connectionId}/decline`, { method: 'PATCH' });
  }
};

// ==========================================
// HIRING PIPELINE (employer-side)
// ==========================================

export interface PipelineApplication {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  studentProfile: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    user: { id: string; email: string };
    resumes?: { id: string; fileName: string }[];
  };
  job: { id: string; title: string };
  offer?: PipelineOffer | null;
  interviews?: PipelineInterview[];
  tags?: { tag: CandidateTag }[];
}

export interface PipelineApplicationDetail extends PipelineApplication {
  stages: { id: string; stageName: string; status: string; notes?: string | null; createdAt: string }[];
  interviews: PipelineInterview[];
  notes: PipelineNote[];
  studentProfile: PipelineApplication['studentProfile'] & {
    skills?: { skill: { name: string }; level: number }[];
  };
}

export interface PipelineNote {
  id: string;
  content: string;
  createdAt: string;
  authorRecruiter: { user: { email: string } };
}

export interface PipelineInterview {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  locationUrl?: string | null;
  status: string;
  feedback?: string | null;
}

export interface PipelineOffer {
  id: string;
  title: string;
  salary: number;
  currency: string;
  startDate: string;
  status: string;
  notes?: string | null;
  extendedAt?: string | null;
  respondedAt?: string | null;
  withdrawnAt?: string | null;
}

export interface PipelinePerJobAnalytics {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  statusBreakdown: Record<string, number>;
}

export interface PipelineAnalytics {
  activeJobs: number;
  totalApplications: number;
  timeToHireDays: number | null;
  offerAcceptanceRate: number | null;
  statusBreakdown: Record<string, number>;
  openVsClosed: { open: number; closed: number };
  perJob: PipelinePerJobAnalytics[];
}

export interface JobCategory {
  id: string;
  name: string;
}

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';

export interface JobPostingInput {
  title: string;
  description: string;
  requirements: string;
  benefits?: string;
  location: string;
  jobType: string;
  workMode: string;
  categoryId: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  deadline?: string | null;
  skillIds?: string[];
  status?: JobStatus;
}

export interface EmployerJob {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string;
  benefits?: string | null;
  location: string;
  jobType: string;
  workMode: string;
  categoryId: string;
  category?: { id: string; name: string };
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency: string;
  deadline?: string | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  applications?: { id: string }[];
  skillsRequired?: { skillId: string; skill?: { id: string; name: string } }[];
}

export interface JobBulkActionResult {
  updated: string[];
  skipped: string[];
}

export interface BulkActionResult {
  updated: string[];
  skipped: string[];
}

/**
 * Real, backend-connected Hiring Pipeline workflow. Like Network and Resume,
 * this has no mock fallback -- a recruiter working with fabricated candidate
 * data would be actively harmful, not just unpolished.
 */
export interface SharedInterviewReportEntry {
  mockInterviewId: string;
  jobTitle: string;
  companyName: string | null;
  interviewType: MockInterviewType;
  difficulty: MockInterviewDifficulty;
  completedAt: string | null;
  totalDurationSec: number | null;
  report: MockInterviewReportResult | null;
}

export const HiringPipelineService = {
  getQueue: async (params: {
    search?: string;
    status?: string;
    jobId?: string;
    dateFrom?: string;
    dateTo?: string;
    tagIds?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; applications: PipelineApplication[] }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === '') return;
      if (Array.isArray(value)) {
        if (value.length > 0) query.set(key, value.join(','));
      } else {
        query.set(key, String(value));
      }
    });
    return fetchJson(`/employer/applications/queue?${query.toString()}`, {});
  },
  getDetail: async (applicationId: string): Promise<PipelineApplicationDetail> => {
    return fetchJson(`/employer/applications/${applicationId}`, {});
  },
  shortlist: async (applicationId: string) => {
    return fetchJson(`/employer/applications/${applicationId}/shortlist`, { method: 'PATCH' });
  },
  reject: async (applicationId: string, reason?: string) => {
    return fetchJson(`/employer/applications/${applicationId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  },
  getNotes: async (applicationId: string): Promise<PipelineNote[]> => {
    return fetchJson(`/employer/applications/${applicationId}/notes`, {});
  },
  /** Mock interview reports the candidate explicitly shared with employers. */
  getSharedInterviewReports: async (applicationId: string): Promise<SharedInterviewReportEntry[]> => {
    return fetchJson(`/employer/applications/${applicationId}/interview-reports`, {});
  },
  downloadSharedInterviewReportPdf: async (applicationId: string, mockInterviewId: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/employer/applications/${applicationId}/interview-reports/${mockInterviewId}/pdf`,
      { headers: authHeaders(), credentials: 'include' }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error?.message || 'Could not download the report PDF.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CareerBridge-Interview-Report.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
  addNote: async (applicationId: string, content: string): Promise<PipelineNote> => {
    return fetchJson(`/employer/applications/${applicationId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },
  scheduleInterview: async (
    applicationId: string,
    data: { title: string; scheduledAt: string; duration: number; locationUrl?: string }
  ): Promise<PipelineInterview> => {
    return fetchJson(`/employer/applications/${applicationId}/interviews`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateInterview: async (interviewId: string, data: Partial<PipelineInterview>): Promise<PipelineInterview> => {
    return fetchJson(`/employer/interviews/${interviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  createOffer: async (
    applicationId: string,
    data: { title: string; salary: number; currency?: string; startDate: string; notes?: string }
  ): Promise<PipelineOffer> => {
    return fetchJson(`/employer/applications/${applicationId}/offer`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  withdrawOffer: async (offerId: string): Promise<PipelineOffer> => {
    return fetchJson(`/employer/offers/${offerId}/withdraw`, { method: 'PATCH' });
  },
  getAnalytics: async (): Promise<PipelineAnalytics> => {
    return fetchJson('/employer/analytics', {});
  },
  /** Opens the resume in a new tab. Fetched as an authenticated blob rather than
   * a raw URL because the preview endpoint requires a Bearer token -- a plain
   * <a href> or window.open(url) would hit an unauthenticated 401. */
  previewResume: async (resumeId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/employer/resumes/${resumeId}/preview`, { 
      headers: authHeaders(),
      credentials: 'include'
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error?.message || 'Could not open resume preview.');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },
  downloadResume: async (resumeId: string, fileName: string): Promise<void> => {
    await downloadBlob(`/employer/resumes/${resumeId}/download`, fileName);
  },
  /** Bulk triage -- the core power-user action for a recruiter processing 100+ applications/month. */
  bulkShortlist: async (applicationIds: string[]): Promise<BulkActionResult> => {
    return fetchJson('/employer/applications/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ applicationIds, action: 'shortlist' })
    });
  },
  bulkReject: async (applicationIds: string[], reason?: string): Promise<BulkActionResult> => {
    return fetchJson('/employer/applications/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ applicationIds, action: 'reject', reason })
    });
  },
  /**
   * Employer AI (Phase 4): candidate evaluation & comparison, reusing the
   * same Resume Intelligence / Mock Interview AI signals from the student
   * side. No mock fallback -- same data-integrity-sensitive reasoning as
   * CareerService's AI generation calls.
   */
  evaluateCandidate: async (applicationId: string): Promise<CandidateEvaluation> => {
    return fetchJson(`/employer/applications/${applicationId}/ai-evaluate`, { method: 'POST' });
  },
  getLatestEvaluation: async (applicationId: string): Promise<CandidateEvaluation | null> => {
    return fetchJson(`/employer/applications/${applicationId}/ai-evaluation`, {});
  },
  compareCandidates: async (jobId: string, applicationIds: string[]): Promise<CandidateComparisonResult> => {
    return fetchJson('/employer/applications/ai-compare', {
      method: 'POST',
      body: JSON.stringify({ jobId, applicationIds })
    });
  }
};

// ==========================================
// CANDIDATE MANAGEMENT: tags, timeline, saved filters
// ==========================================

export interface CandidateTag {
  id: string;
  name: string;
  color?: string | null;
  companyId: string;
}

export interface TimelineEntry {
  type: 'STAGE_CHANGE' | 'NOTE_ADDED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_UPDATED' | 'OFFER_CREATED' | 'OFFER_EXTENDED' | 'OFFER_RESPONDED' | 'OFFER_WITHDRAWN';
  timestamp: string;
  summary: string;
  actorLabel: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt: string;
}

export const CandidateManagementService = {
  getTags: async (): Promise<CandidateTag[]> => {
    return fetchJson('/employer/tags', {});
  },
  createTag: async (name: string, color?: string): Promise<CandidateTag> => {
    return fetchJson('/employer/tags', { method: 'POST', body: JSON.stringify({ name, color }) });
  },
  deleteTag: async (tagId: string): Promise<void> => {
    await fetchJson(`/employer/tags/${tagId}`, { method: 'DELETE' });
  },
  attachTag: async (applicationId: string, tagId: string) => {
    return fetchJson(`/employer/applications/${applicationId}/tags`, { method: 'POST', body: JSON.stringify({ tagId }) });
  },
  detachTag: async (applicationId: string, tagId: string) => {
    return fetchJson(`/employer/applications/${applicationId}/tags/${tagId}`, { method: 'DELETE' });
  },
  bulkTag: async (applicationIds: string[], tagId: string): Promise<BulkActionResult> => {
    return fetchJson('/employer/applications/bulk/tags', { method: 'POST', body: JSON.stringify({ applicationIds, tagId }) });
  },
  getTimeline: async (applicationId: string): Promise<TimelineEntry[]> => {
    return fetchJson(`/employer/applications/${applicationId}/timeline`, {});
  },
  getSavedFilters: async (): Promise<SavedFilter[]> => {
    return fetchJson('/employer/saved-filters', {});
  },
  createSavedFilter: async (name: string, filters: Record<string, any>): Promise<SavedFilter> => {
    return fetchJson('/employer/saved-filters', { method: 'POST', body: JSON.stringify({ name, filters }) });
  },
  deleteSavedFilter: async (id: string): Promise<void> => {
    await fetchJson(`/employer/saved-filters/${id}`, { method: 'DELETE' });
  }
};

// ==========================================
// EMPLOYER OVERVIEW (dashboard header stats + interview list)
// ==========================================

export interface EmployerDashboardStats {
  activeJobsCount: number;
  totalApplications: number;
  recruiterCount: number;
  upcomingInterviewCount: number;
  activeOfferCount: number;
  jobsList: Array<{ id: string; title: string; status: string }>;
}

export interface EmployerInterview {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  locationUrl: string | null;
  status: string;
  feedback: string | null;
  application: {
    id: string;
    job: { id: string; title: string };
    studentProfile: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      user: { email: string };
    };
  };
  scheduledByRecruiter: { id: string; title: string; user: { email: string } } | null;
}

/** Real, backend-connected dashboard overview -- no mock fallback. */
export const EmployerOverviewService = {
  getDashboard: async (): Promise<EmployerDashboardStats> => {
    return fetchJson('/employer/dashboard', {});
  },
  getInterviews: async (): Promise<EmployerInterview[]> => {
    return fetchJson('/employer/interviews', {});
  }
};

export interface EmployerOfficeLocation {
  id: string;
  name: string;
  address: string;
  isHQ?: boolean;
}

/** Real Company row (GET/PUT /employer/company) plus this-month activity computed live from Applications/Interviews. */
export interface EmployerCompanyProfile {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  industry: string;
  description: string;
  size: number | null;
  headquarters: string | null;
  coverImageUrl: string | null;
  missionValues: string[];
  techStack: string[];
  galleryImages: string[];
  officeLocations: EmployerOfficeLocation[];
  screenedTarget: number;
  outreachTarget: number;
  isVerified: boolean;
  activity: { screened: number; outreach: number };
}

export type EmployerCompanyProfileInput = Partial<
  Pick<
    EmployerCompanyProfile,
    'logoUrl' | 'website' | 'industry' | 'description' | 'size' | 'headquarters' |
    'coverImageUrl' | 'missionValues' | 'techStack' | 'galleryImages' | 'officeLocations' |
    'screenedTarget' | 'outreachTarget'
  >
>;

/** Real, backend-connected Company Profile tab -- no mock fallback. */
export const EmployerCompanyService = {
  getProfile: async (): Promise<EmployerCompanyProfile> => {
    return fetchJson('/employer/company', {});
  },
  updateProfile: async (data: EmployerCompanyProfileInput): Promise<EmployerCompanyProfile> => {
    return fetchJson('/employer/company', { method: 'PUT', body: JSON.stringify(data) });
  }
};

/** Real Recruiter row for the Team tab -- counts are live aggregates, not stored numbers. */
export interface EmployerRecruiter {
  id: string;
  title: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  user: { id: string; email: string; lastLoginAt: string | null; createdAt: string };
  _count: { jobs: number; scheduledInterviews: number; offers: number };
}

/** Real, backend-connected Team/Recruiters tab -- no mock fallback. */
export const EmployerRecruiterService = {
  getRecruiters: async (): Promise<EmployerRecruiter[]> => {
    return fetchJson('/employer/recruiters', {});
  },
  inviteRecruiter: async (email: string): Promise<{ success: boolean; token: string }> => {
    return fetchJson('/employer/recruiters/invite', { method: 'POST', body: JSON.stringify({ email }) });
  }
};

/** A conversation participant is either a student candidate or a recruiter -- never both. */
export interface EmployerConversationParticipant {
  id: string;
  studentProfile: { id: string; firstName: string; lastName: string; avatarUrl: string | null; user: { email: string } } | null;
  recruiter: { id: string; firstName: string | null; lastName: string | null; user: { email: string } } | null;
}

export interface EmployerConversationMessage {
  id: string;
  conversationId: string;
  content: string;
  status: string;
  createdAt: string;
  senderId: string | null;
  senderRecruiterId: string | null;
  sender?: { id: string; firstName: string; lastName: string } | null;
  senderRecruiter?: { id: string; firstName: string | null; lastName: string | null } | null;
}

export interface EmployerConversation {
  id: string;
  updatedAt: string;
  participants: EmployerConversationParticipant[];
  messages: EmployerConversationMessage[];
}

/**
 * Real, backend-connected Messaging tab -- reuses the same Conversation/
 * Message tables as the student networking chat (see MessagesRepository).
 * A recruiter can only message candidates who applied to one of their
 * jobs; that's enforced server-side in EmployerService.startConversation.
 */
export const EmployerMessageService = {
  getConversations: async (): Promise<EmployerConversation[]> => {
    return fetchJson('/employer/messages', {});
  },
  getMessages: async (conversationId: string): Promise<EmployerConversationMessage[]> => {
    return fetchJson(`/employer/messages/${conversationId}`, {});
  },
  startConversation: async (studentProfileId: string): Promise<EmployerConversation> => {
    return fetchJson('/employer/messages/start', { method: 'POST', body: JSON.stringify({ studentProfileId }) });
  },
  sendMessage: async (conversationId: string, content: string): Promise<EmployerConversationMessage> => {
    return fetchJson(`/employer/messages/${conversationId}`, { method: 'POST', body: JSON.stringify({ content }) });
  }
};

// ==========================================
// EMPLOYER JOB POSTING (create/edit + categories)
// ==========================================

/** Real, backend-connected job posting workflow -- no mock fallback, same as HiringPipelineService. */
export const EmployerJobService = {
  getJobCategories: async (): Promise<JobCategory[]> => {
    return fetchJson('/employer/job-categories', {});
  },
  createJob: async (data: JobPostingInput): Promise<EmployerJob> => {
    return fetchJson('/employer/jobs', { method: 'POST', body: JSON.stringify(data) });
  },
  updateJob: async (jobId: string, data: Partial<JobPostingInput>): Promise<EmployerJob> => {
    return fetchJson(`/employer/jobs/${jobId}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  /** Lightweight partial-payload save used while a recruiter is mid-draft; never fails on incomplete fields. */
  autosaveJob: async (jobId: string, data: Partial<JobPostingInput>): Promise<EmployerJob> => {
    return fetchJson(`/employer/jobs/${jobId}/autosave`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  getJobs: async (): Promise<EmployerJob[]> => {
    return fetchJson('/employer/jobs', {});
  },
  duplicateJob: async (jobId: string): Promise<EmployerJob> => {
    return fetchJson(`/employer/jobs/${jobId}/duplicate`, { method: 'POST' });
  },
  archiveJob: async (jobId: string): Promise<EmployerJob> => {
    return fetchJson(`/employer/jobs/${jobId}/archive`, { method: 'PATCH' });
  },
  closeJob: async (jobId: string): Promise<EmployerJob> => {
    return fetchJson(`/employer/jobs/${jobId}/close`, { method: 'PATCH' });
  },
  reopenJob: async (jobId: string): Promise<EmployerJob> => {
    return fetchJson(`/employer/jobs/${jobId}/reopen`, { method: 'PATCH' });
  },
  deleteJob: async (jobId: string): Promise<{ hardDeleted?: boolean } | EmployerJob | null> => {
    return fetchJson(`/employer/jobs/${jobId}`, { method: 'DELETE' });
  },
  bulkArchive: async (jobIds: string[]): Promise<JobBulkActionResult> => {
    return fetchJson('/employer/jobs/bulk-archive', { method: 'PATCH', body: JSON.stringify({ jobIds }) });
  },
  bulkClose: async (jobIds: string[]): Promise<JobBulkActionResult> => {
    return fetchJson('/employer/jobs/bulk-close', { method: 'PATCH', body: JSON.stringify({ jobIds }) });
  }
};

// ==========================================
// UNIVERSITY PORTAL
// ==========================================

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'PLACEMENT_ELIGIBLE' | 'PLACEMENT_COMPLETED' | 'REJECTED';

export interface UniversityStudent {
  id: string;
  universityId: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string | null };
  department?: { id: string; name: string } | null;
  [key: string]: any;
}

export interface UniversityDashboard {
  placementRate: number;
  studentsPlaced: number;
  pendingVerificationsCount: number;
  totalStudents: number;
  upcomingDrives: PlacementDrive[];
}

export interface UniversityAnalytics {
  placementPercentage: number;
  totalStudents: number;
  studentsPlaced: number;
  averageSalary: number | null;
  highestPackage: number | null;
  hiringTrends: { year: string; placements: number }[];
  departmentBreakdown: { departmentId: string | null; departmentName: string; placed: number; total: number; placementPercentage: number }[];
  /** Mock interview readiness aggregates from the same stored reports students see. */
  interviewReadiness: {
    totalInterviews: number;
    averageScore: number | null;
    averageReadiness: number | null;
    byDepartment: {
      departmentId: string | null;
      departmentName: string;
      interviewsCompleted: number;
      averageScore: number | null;
      averageReadiness: number | null;
    }[];
  };
}

export interface PlacementDrive {
  id: string;
  universityId: string;
  title: string;
  description: string;
  location: string;
  scheduledAt: string;
  deadline: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlacementDriveInput {
  title: string;
  description: string;
  location: string;
  scheduledAt: string;
  deadline: string;
}

/** Real, backend-connected university placement workflow -- no mock fallback. */
export const UniversityService = {
  getDashboard: async (): Promise<UniversityDashboard> => {
    return fetchJson('/university/dashboard', {});
  },
  getAnalytics: async (): Promise<UniversityAnalytics> => {
    return fetchJson('/university/analytics', {});
  },
  getStudents: async (): Promise<UniversityStudent[]> => {
    return fetchJson('/university/students', {});
  },
  verifyStudent: async (studentProfileId: string, status: VerificationStatus): Promise<UniversityStudent> => {
    return fetchJson(`/university/students/${studentProfileId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },
  getDrives: async (): Promise<PlacementDrive[]> => {
    return fetchJson('/university/drives', {});
  },
  createDrive: async (data: PlacementDriveInput): Promise<PlacementDrive> => {
    return fetchJson('/university/drives', { method: 'POST', body: JSON.stringify(data) });
  },
  updateDrive: async (driveId: string, data: Partial<PlacementDriveInput>): Promise<PlacementDrive> => {
    return fetchJson(`/university/drives/${driveId}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteDrive: async (driveId: string): Promise<void> => {
    await fetchJson(`/university/drives/${driveId}`, { method: 'DELETE' });
  },
  getCompanies: async (): Promise<PartnerCompany[]> => {
    return fetchJson('/university/companies', {});
  },
  getSettings: async (): Promise<UniversitySettingsData> => {
    return fetchJson('/university/settings', {});
  },
  updateSettings: async (data: Partial<UniversitySettingsInput>): Promise<UniversitySettingsData> => {
    return fetchJson('/university/settings', { method: 'PUT', body: JSON.stringify(data) });
  },
  sendBroadcast: async (recipientUserIds: string[], title: string, content: string): Promise<BroadcastResult> => {
    return fetchJson('/university/messages/broadcast', { method: 'POST', body: JSON.stringify({ recipientUserIds, title, content }) });
  },
  getSentBroadcasts: async (): Promise<SentBroadcast[]> => {
    return fetchJson('/university/messages/sent', {});
  },
  submitSupportRequest: async (subject: string, message: string): Promise<{ submitted: boolean }> => {
    return fetchJson('/university/support', { method: 'POST', body: JSON.stringify({ subject, message }) });
  },
  getNotifications: async (): Promise<UniversityNotification[]> => {
    return fetchJson('/notifications', {});
  },
  markNotificationRead: async (id: string): Promise<void> => {
    await fetchJson(`/notifications/${id}/read`, { method: 'PATCH' });
  },
  markAllNotificationsRead: async (): Promise<void> => {
    await fetchJson('/notifications/read-all', { method: 'PATCH' });
  },
  deleteNotification: async (id: string): Promise<void> => {
    await fetchJson(`/notifications/${id}`, { method: 'DELETE' });
  },

  // ------------------------------------------------------------------
  // University AI (Phase 5): placement prediction, department insight,
  // campus drive recommendations, and executive placement reports.
  // ------------------------------------------------------------------

  assessStudentPlacement: async (studentProfileId: string): Promise<StudentPlacementInsight> => {
    return fetchJson(`/university/students/${studentProfileId}/ai-insight`, { method: 'POST' });
  },
  getLatestStudentInsight: async (studentProfileId: string): Promise<StudentPlacementInsight | null> => {
    return fetchJson(`/university/students/${studentProfileId}/ai-insight`, {});
  },
  generateDepartmentInsight: async (): Promise<DepartmentInsight> => {
    return fetchJson('/university/analytics/ai-insight', { method: 'POST' });
  },
  recommendCampusDrives: async (): Promise<DriveRecommendationResult> => {
    return fetchJson('/university/drives/ai-recommendations', { method: 'POST' });
  },
  generatePlacementReport: async (): Promise<PlacementReport> => {
    return fetchJson('/university/reports/ai-report', { method: 'POST' });
  }
};

export interface PartnerCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string;
  website: string | null;
  applications: number;
  hired: number;
  openJobs: number;
}

export interface UniversitySettingsData {
  id: string;
  name: string;
  logoUrl: string | null;
  location: string;
  placementCells: { id: string; directorName: string; contactEmail: string; phone: string | null }[];
}

export interface UniversitySettingsInput {
  name: string;
  logoUrl: string;
  location: string;
  directorName: string;
  contactEmail: string;
  phone: string;
}

export interface BroadcastResult {
  recipientCount: number;
  title: string;
  content: string;
  sentAt: string;
  skipped: number;
}

export interface SentBroadcast {
  title: string;
  content: string;
  sentAt: string;
  recipientCount: number;
}

export interface UniversityNotification {
  id: string;
  senderId?: string | null;
  recipientId: string;
  type: 'SYSTEM' | 'APPLICATION' | 'JOB' | 'MESSAGE' | 'INTERVIEW' | 'NETWORK' | 'AI' | 'EVENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  content: string;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}


// ---------------------------------------------------------------------------
// Admin Portal
// ---------------------------------------------------------------------------

export interface AdminGlobalStats {
  totalUsers: number;
  companiesCount: number;
  universitiesCount: number;
  jobsPublished: number;
  applicationsCount: number;
  newUsersToday: number;
  activeUsersToday: number;
  unverifiedCompanies: number;
  unverifiedUniversities: number;
  pendingStudentVerifications: number;
  suspendedUsers: number;
  usersByRole: { role: string; count: number }[];
  /** Platform-wide AI Mock Interview analytics (sessions, scores, AI vs fallback usage). */
  mockInterviews: {
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    abandonedSessions: number;
    sharedWithEmployers: number;
    totalReports: number;
    averageScore: number | null;
    averageReadiness: number | null;
    aiGeneratedReports: number;
    estimatedReports: number;
  };
}

export interface AdminSystemMonitoring {
  databaseStatus: string;
  databaseLatencyMs: number;
  processUptimeSeconds: number;
  nodeVersion: string;
  platform: string;
  loadAverage: number[];
  cpuCount: number;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    systemFreeMb: number;
    systemTotalMb: number;
  };
  aiUsageSampleSize: number;
  aiCacheHitRatePercent: number;
  aiAvgLatencyMs: number;
  recentErrorLogsLast24h: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  isDeleted: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  studentProfile?: { firstName: string; lastName: string } | null;
  recruiterProfile?: { firstName: string; lastName: string } | null;
  universityProfile?: { name: string } | null;
  company?: { name: string } | null;
}

export interface AdminPaginatedResult<T> {
  total: number;
  page: number;
  limit: number;
  [key: string]: T[] | number;
}

export interface AdminCompanyRow {
  id: string;
  name: string;
  industry: string;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  _count: { jobs: number; recruiters: number };
}

export interface AdminUniversityRow {
  id: string;
  name: string;
  location: string;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  _count: { students: number; placementDrives: number };
}

export interface AdminAuditLogRow {
  id: string;
  action: string;
  ipAddress: string | null;
  details: string | null;
  createdAt: string;
  user: { email: string; role: string } | null;
}

export interface AdminFeatureFlag {
  key: string;
  value: boolean;
  description?: string;
  updatedBy?: string | null;
  updatedAt?: string;
}

export interface AdminGlobalSearchResult {
  students: { id: string; firstName: string; lastName: string; user?: { email: string } }[];
  companies: { id: string; name: string }[];
  universities: { id: string; name: string }[];
  jobs: { id: string; title: string; company?: { name: string } }[];
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical';
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  creator: { email: string } | null;
}

export interface AdminSession {
  id: string;
  family: string;
  createdAt: string;
  expiresAt: string;
  user: { email: string; role: string };
}

export interface AdminSupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: string;
  requesterEmail: string;
  requesterRole: string;
  resolutionNote: string | null;
  assignedTo: { email: string } | null;
  createdAt: string;
}

export interface AdminNotificationRow {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  isRead: boolean;
}

/**
 * Thin client over the real /admin/* backend endpoints. Every method maps
 * 1:1 to a route in admin.routes.ts -- there is no mock fallback here by
 * design: the Admin Portal is exclusively for operating a real deployment,
 * so a failed request should surface as a real error rather than silently
 * substituting fabricated data.
 */
export const AdminService = {
  getStats: async (): Promise<AdminGlobalStats> => {
    const res = await fetchJson('/admin/stats', {});
    return res;
  },
  getMonitoring: async (): Promise<AdminSystemMonitoring> => {
    const res = await fetchJson('/admin/monitoring', {});
    return res;
  },
  getUsers: async (page = 1, limit = 20, search?: string, role?: string): Promise<{ users: AdminUserRow[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    const res = await fetchJson(`/admin/users?${params.toString()}`, {});
    return res;
  },
  suspendUser: async (id: string) => await fetchJson(`/admin/users/${id}/suspend`, { method: 'PATCH' }),
  activateUser: async (id: string) => await fetchJson(`/admin/users/${id}/activate`, { method: 'PATCH' }),
  verifyUser: async (id: string) => await fetchJson(`/admin/users/${id}/verify`, { method: 'PATCH' }),
  resetUserPassword: async (id: string, password: string) =>
    await fetchJson(`/admin/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  changeUserRole: async (id: string, role: string) =>
    await fetchJson(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  getCompanies: async (page = 1, limit = 20, search?: string): Promise<{ companies: AdminCompanyRow[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    const res = await fetchJson(`/admin/companies?${params.toString()}`, {});
    return res;
  },
  toggleCompany: async (id: string, deactivate: boolean) =>
    await fetchJson(`/admin/companies/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ deactivate }) }),
  verifyCompany: async (id: string, isVerified: boolean) =>
    await fetchJson(`/admin/companies/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ isVerified }) }),

  getUniversities: async (page = 1, limit = 20, search?: string): Promise<{ universities: AdminUniversityRow[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    const res = await fetchJson(`/admin/universities?${params.toString()}`, {});
    return res;
  },
  toggleUniversity: async (id: string, deactivate: boolean) =>
    await fetchJson(`/admin/universities/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ deactivate }) }),
  verifyUniversity: async (id: string, isVerified: boolean) =>
    await fetchJson(`/admin/universities/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ isVerified }) }),

  getAuditLogs: async (
    page = 1,
    limit = 20,
    filters: { userId?: string; action?: string; startDate?: string; endDate?: string } = {}
  ): Promise<{ logs: AdminAuditLogRow[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await fetchJson(`/admin/audit-logs?${params.toString()}`, {});
    return res;
  },

  getFeatureFlags: async (): Promise<AdminFeatureFlag[]> => {
    const res = await fetchJson('/admin/feature-flags', {});
    return res;
  },
  updateFeatureFlag: async (key: string, value: boolean): Promise<AdminFeatureFlag> => {
    const res = await fetchJson(`/admin/feature-flags/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) });
    return res;
  },

  globalSearch: async (query: string): Promise<AdminGlobalSearchResult> => {
    const res = await fetchJson(`/admin/search?q=${encodeURIComponent(query)}`, {});
    return res;
  },

  getAnnouncements: async (activeOnly = false): Promise<AdminAnnouncement[]> => {
    const res = await fetchJson(`/admin/announcements${activeOnly ? '?activeOnly=true' : ''}`, {});
    return res;
  },
  createAnnouncement: async (data: { title: string; content: string; severity: string; expiresAt?: string }): Promise<AdminAnnouncement> => {
    const res = await fetchJson('/admin/announcements', { method: 'POST', body: JSON.stringify(data) });
    return res;
  },
  setAnnouncementActive: async (id: string, isActive: boolean): Promise<AdminAnnouncement> => {
    const res = await fetchJson(`/admin/announcements/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
    return res;
  },
  deleteAnnouncement: async (id: string): Promise<void> => {
    await fetchJson(`/admin/announcements/${id}`, { method: 'DELETE' });
  },

  getSupportTickets: async (page = 1, limit = 20, status?: string): Promise<{ tickets: AdminSupportTicket[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    const res = await fetchJson(`/admin/support-tickets?${params.toString()}`, {});
    return res;
  },
  updateSupportTicket: async (id: string, data: { status?: string; priority?: string; resolutionNote?: string }): Promise<AdminSupportTicket> => {
    const res = await fetchJson(`/admin/support-tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    return res;
  },

  getActiveSessions: async (page = 1, limit = 20, search?: string): Promise<{ sessions: AdminSession[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    const res = await fetchJson(`/admin/sessions?${params.toString()}`, {});
    return res;
  },
  revokeSession: async (id: string): Promise<void> => {
    await fetchJson(`/admin/sessions/${id}`, { method: 'DELETE' });
  },
  revokeSessionFamily: async (family: string): Promise<void> => {
    await fetchJson(`/admin/sessions/family/${family}`, { method: 'DELETE' });
  },

  // Notifications: backed by the same real, platform-wide Notification
  // model/pipeline every portal uses (support tickets, maintenance mode
  // changes, etc. now create rows here targeted at admin users) via the
  // generic /notifications endpoints -- there is no admin-only duplicate.
  getMyNotifications: async (): Promise<AdminNotificationRow[]> => {
    const res = await fetchJson('/notifications', {});
    return res;
  },
  markNotificationRead: async (id: string): Promise<void> => {
    await fetchJson(`/notifications/${id}/read`, { method: 'PATCH' });
  },
  markAllNotificationsRead: async (): Promise<void> => {
    await fetchJson('/notifications/read-all', { method: 'PATCH' });
  },

  // ------------------------------------------------------------------
  // Admin AI (Phase 6): fraud detection, platform insights, moderation,
  // system health summaries, executive reports, predictive analytics.
  // Every "generate" call re-runs the report; every "getLatest" call reads
  // the last persisted result without re-running it.
  // ------------------------------------------------------------------

  generateFraudReport: async (): Promise<AdminInsightReport<FraudDetectionResult>> => {
    const res = await fetchJson('/admin/ai/fraud-detection', { method: 'POST' });
    return res;
  },
  getLatestFraudReport: async (): Promise<AdminInsightReport<FraudDetectionResult> | null> => {
    const res = await fetchJson('/admin/ai/fraud-detection', {});
    return res;
  },

  generatePlatformInsights: async (period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<AdminInsightReport<PlatformInsightsResult>> => {
    const res = await fetchJson(`/admin/ai/platform-insights?period=${period}`, { method: 'POST' });
    return res;
  },
  getLatestPlatformInsights: async (period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<AdminInsightReport<PlatformInsightsResult> | null> => {
    const res = await fetchJson(`/admin/ai/platform-insights?period=${period}`, {});
    return res;
  },

  generateModerationRecommendations: async (): Promise<AdminInsightReport<ModerationResult>> => {
    const res = await fetchJson('/admin/ai/moderation', { method: 'POST' });
    return res;
  },
  getLatestModerationReport: async (): Promise<AdminInsightReport<ModerationResult> | null> => {
    const res = await fetchJson('/admin/ai/moderation', {});
    return res;
  },

  generateSystemHealthSummary: async (): Promise<AdminInsightReport<SystemHealthResult>> => {
    const res = await fetchJson('/admin/ai/system-health', { method: 'POST' });
    return res;
  },
  getLatestSystemHealthReport: async (): Promise<AdminInsightReport<SystemHealthResult> | null> => {
    const res = await fetchJson('/admin/ai/system-health', {});
    return res;
  },

  generateExecutiveReport: async (reportType: string): Promise<AdminInsightReport<ExecutiveReportResult>> => {
    const res = await fetchJson('/admin/ai/executive-report', {
      method: 'POST',
      body: JSON.stringify({ reportType })
    });
    return res;
  },
  getLatestExecutiveReport: async (reportType: string): Promise<AdminInsightReport<ExecutiveReportResult> | null> => {
    const res = await fetchJson(`/admin/ai/executive-report/${reportType}`, {});
    return res;
  },

  generatePredictiveAnalytics: async (): Promise<AdminInsightReport<PredictiveAnalyticsResult>> => {
    const res = await fetchJson('/admin/ai/predictive-analytics', { method: 'POST' });
    return res;
  },
  getLatestPredictiveAnalytics: async (): Promise<AdminInsightReport<PredictiveAnalyticsResult> | null> => {
    const res = await fetchJson('/admin/ai/predictive-analytics', {});
    return res;
  }
};

// ---------------------------------------------------------------------------
// Ecosystem discovery services (Phase: connected-marketplace redesign).
// Every method hits a real, role-gated backend endpoint under /ecosystem.
// The backend returns the FULL real dataset from PostgreSQL; the deterministic
// ranking layer only orders it and attaches `score` + `reasons`. No fabrication.
// ---------------------------------------------------------------------------

export interface RankedReason { score: number; reasons: string[]; }

export const StudentEcosystemService = {
  /** Ranked jobs, companies, and mentors for the logged-in student. */
  getRecommendations: async (): Promise<{
    hasProfile: boolean;
    totals: { jobs: number; companies: number; mentors: number; recruiters: number; universities: number };
    recommendedJobs: Array<{ id: string; title: string; companyName: string; location: string; workMode: string; jobType: string; salaryMin?: number; salaryMax?: number } & RankedReason>;
    recommendedCompanies: Array<{ id: string; name: string; industry: string; logo: string; openJobsCount: number; rating: number } & RankedReason>;
    recommendedMentors: Array<{ id: string; name: string; avatar: string; role: string; companyName: string; expertise: string[]; rating: number } & RankedReason>;
    recruiters: Array<{ id: string; name: string; title: string; companyName: string }>;
    universities: Array<{ id: string; name: string; location: string; studentCount: number }>;
    events: Array<{ id: string; title: string; scheduledAt: string; location: string }>;
    internships: Array<{ id: string; title: string; companyName: string; location: string; workMode: string }>;
    peers: Array<{ id: string; name: string; avatar: string; university: string; gradYear: number | null; preferredRole: string; skills: { name: string; level: number }[] }>;
  }> => {
    return fetchJson('/ecosystem/student/recommendations');
  }
};

export const EmployerTalentService = {
  /** Paginated, searchable talent pool (public student fields only). */
  getTalentPool: async (params: { page?: number; pageSize?: number; skill?: string; university?: string; gradYear?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
    return fetchJson(`/ecosystem/employer/talent-pool${q.toString() ? `?${q}` : ''}`);
  },
  /** AI-ranked candidates for one of the employer's own jobs. */
  getCandidateMatches: async (jobId: string, limit = 20) => {
    return fetchJson(`/ecosystem/employer/candidate-matches?jobId=${encodeURIComponent(jobId)}&limit=${limit}`);
  },
  /** Universities, top skills, upcoming graduates, events. */
  getOverview: async () => {
    return fetchJson('/ecosystem/employer/overview');
  }
};

export const UniversityEcosystemService = {
  /** Recruiters, open jobs, employer activity, hiring trends. */
  getOverview: async () => {
    return fetchJson('/ecosystem/university/overview');
  }
};
