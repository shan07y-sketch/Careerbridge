import type { Job, Company, Application, Student, Recruiter, Mentor, Interview, Event, Thread, Message, Notification, CareerInsight, InterviewReport } from '../types';
import {
  mockJobs,
  mockCompanies,
  mockApplications,
  mockStudent,
  mockRecruiters,
  mockMentors,
  mockInterviews,
  mockEvents,
  mockThreads,
  mockMessages,
  mockNotifications,
  mockCareerInsight,
  mockInterviewReport
} from '../mock/data';

// Stateful mock variables for offline development fallback
let jobsDb = [...mockJobs];
let companiesDb = [...mockCompanies];
let applicationsDb = [...mockApplications];
let studentDb = { ...mockStudent };
let recruitersDb = [...mockRecruiters];
let mentorsDb = [...mockMentors];
let interviewsDb = [...mockInterviews];
let eventsDb = [...mockEvents];
let threadsDb = [...mockThreads];
let messagesDb = [...mockMessages];
let notificationsDb = [...mockNotifications];
let careerInsightDb = { ...mockCareerInsight };
let interviewReportsDb = [mockInterviewReport];
let savedJobIds: string[] = ['job_google_frontend'];

const API_BASE_URL = 'http://localhost:5000/api/v1';

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
 * Enterprise standard fetch wrapper with local mock fallback mechanisms and 401 refresh retries
 */
const fetchJson = async (endpoint: string, options: RequestInit = {}, fallbackData?: any): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
            headers: { 'Content-Type': 'application/json' }
          });
          if (refreshResponse.ok) {
            const refreshPayload = await refreshResponse.json();
            const newAccessToken = refreshPayload.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            isRefreshing = false;
            onRefreshed(newAccessToken);
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
            if (fallbackData !== undefined) {
              resolve(fallbackData);
            } else {
              reject(new Error('Session expired'));
            }
            return;
          }
          const retriedOptions = {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${newToken}`
            }
          };
          resolve(fetchJson(endpoint, retriedOptions, fallbackData));
        });
      });
    }

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || 'API request failed');
    }
    return payload.data;
  } catch (err) {
    console.warn(`REST call to ${endpoint} failed. Falling back to local mock data...`, err);
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
};

const mapProfileToStudent = (profile: any): Student => {
  if (!profile) return studentDb;
  return {
    id: profile.id,
    name: `${profile.firstName || 'Alex'} ${profile.lastName || 'Rivera'}`,
    email: profile.email || studentDb.email,
    university: profile.universityName || studentDb.university,
    degree: profile.degree || studentDb.degree,
    gradYear: profile.graduationYear || studentDb.gradYear,
    profilePicture: profile.avatarUrl || studentDb.profilePicture,
    careerGoal: profile.preferredRole || studentDb.careerGoal,
    workMode: profile.preferredWorkMode || studentDb.workMode,
    preferredLocation: (profile.preferredLocations || []).join('; ') || studentDb.preferredLocation,
    skills: (profile.skills || []).map((s: any) => ({ name: s.skill?.name || s.name, level: s.level || 50 })),
    resumeUrl: profile.resumes?.[0]?.fileUrl || studentDb.resumeUrl,
    portfolioUrl: studentDb.portfolioUrl,
    resumeScore: profile.careerInsights?.[0]?.score || studentDb.resumeScore,
    readinessScore: studentDb.readinessScore,
    linkedInConnected: studentDb.linkedInConnected,
    gitHubConnected: studentDb.gitHubConnected,
    phoneVerified: studentDb.phoneVerified,
    emailVerified: studentDb.emailVerified
  };
};

export const AuthService = {
  login: async (email: string, password: string): Promise<Student> => {
    const data = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('isAuthenticated', 'true');
    const userRole = data.user?.role?.toLowerCase() || localStorage.getItem('role') || 'student';
    localStorage.setItem('role', userRole);
    return mapProfileToStudent(data.user?.studentProfile);
  },
  register: async (
    name: string,
    email: string,
    university?: string,
    degree?: string,
    gradYear?: number,
    role: string = 'student',
    companyName?: string
  ): Promise<any> => {
    const parts = name.split(' ');
    const firstName = parts[0] || 'First';
    const lastName = parts.slice(1).join(' ') || 'Last';
    const body: any = {
      email,
      password: 'Password123!',
      role: role.toUpperCase(),
      firstName,
      lastName
    };
    if (role === 'student') {
      body.universityName = university;
      body.degree = degree;
      body.graduationYear = gradYear;
    } else if (role === 'employer') {
      body.companyName = companyName || 'Lumina Systems';
    }
    const data = await fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return data;
  }
};

export const JobService = {
  getJobs: async (): Promise<Job[]> => {
    const response = await fetchJson('/jobs', {}, { data: jobsDb });
    return Array.isArray(response) ? response : response.data || jobsDb;
  },
  getJobById: async (id: string): Promise<Job | undefined> => {
    return fetchJson(`/jobs/${id}`, {}, jobsDb.find(j => j.id === id));
  },
  getSavedJobs: async (): Promise<Job[]> => {
    return fetchJson('/jobs/saved', {}, jobsDb.filter(j => savedJobIds.includes(j.id)));
  },
  getJobsByCompanyId: async (companyId: string): Promise<Job[]> => {
    return fetchJson(`/jobs?companyId=${companyId}`, {}, jobsDb.filter(j => j.companyId === companyId));
  },
  toggleSaveJob: async (jobId: string): Promise<boolean> => {
    const result = await fetchJson(`/jobs/${jobId}/save`, { method: 'POST' }, { saved: !savedJobIds.includes(jobId) });
    return result.saved;
  },
  isJobSaved: async (jobId: string): Promise<boolean> => {
    const result = await fetchJson(`/jobs/${jobId}`, {}, { isSaved: savedJobIds.includes(jobId) });
    return result.isSaved;
  }
};

export const CompanyService = {
  getCompanies: async (): Promise<Company[]> => {
    return fetchJson('/companies', {}, companiesDb);
  },
  getCompanyById: async (id: string): Promise<Company | undefined> => {
    return fetchJson(`/companies/${id}`, {}, companiesDb.find(c => c.id === id));
  },
  getRecruiterById: async (id: string): Promise<Recruiter | undefined> => {
    return fetchJson(`/recruiters/${id}`, {}, recruitersDb.find(r => r.id === id));
  },
  getRecruiterByCompanyId: async (companyId: string): Promise<Recruiter | undefined> => {
    return fetchJson(`/recruiters/company/${companyId}`, {}, recruitersDb.find(r => r.companyId === companyId));
  },
  getMentorById: async (id: string): Promise<Mentor | undefined> => {
    return fetchJson(`/mentors/${id}`, {}, mentorsDb.find(m => m.id === id));
  },
  getMentors: async (): Promise<Mentor[]> => {
    return fetchJson('/mentors', {}, mentorsDb);
  }
};

export const ApplicationService = {
  getApplications: async (): Promise<Application[]> => {
    return fetchJson('/applications', {}, applicationsDb);
  },
  applyToJob: async (jobId: string): Promise<Application> => {
    return fetchJson('/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId })
    }, applicationsDb[0]);
  }
};

export const ProfileService = {
  getStudentProfile: async (): Promise<Student> => {
    const data = await fetchJson('/student/profile', {}, null);
    return mapProfileToStudent(data);
  },
  updateStudentProfile: async (updates: Partial<Student>): Promise<Student> => {
    const data = await fetchJson('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, studentDb);
    return mapProfileToStudent(data);
  }
};

export const CareerService = {
  getCareerInsight: async (): Promise<CareerInsight> => {
    return fetchJson('/career/insights', {}, careerInsightDb);
  },
  getInterviewReports: async (): Promise<InterviewReport[]> => {
    return fetchJson('/career/mock-interviews', {}, interviewReportsDb);
  },
  getInterviewReportById: async (id: string): Promise<InterviewReport | undefined> => {
    return fetchJson(`/career/mock-interviews/${id}`, {}, interviewReportsDb.find(r => r.id === id));
  }
};

export const MessageService = {
  getThreads: async (): Promise<Thread[]> => {
    return fetchJson('/messages', {}, threadsDb);
  },
  getMessagesByThreadId: async (threadId: string): Promise<Message[]> => {
    return fetchJson(`/messages/${threadId}`, {}, messagesDb.filter(m => m.threadId === threadId));
  },
  sendMessage: async (threadId: string, senderId: string, content: string): Promise<Message> => {
    return fetchJson(`/messages/${threadId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }, {
      id: `msg_${Date.now()}`,
      senderId,
      senderName: 'Alex Rivera',
      senderAvatar: studentDb.profilePicture,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      threadId,
      isRead: true
    });
  }
};

export const NotificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    return fetchJson('/notifications', {}, notificationsDb);
  },
  markAsRead: async (id: string): Promise<void> => {
    await fetchJson(`/notifications/${id}/read`, { method: 'PATCH' }, {});
  },
  markAllAsRead: async (): Promise<void> => {
    await fetchJson('/notifications/read-all', { method: 'PATCH' }, {});
  }
};

export const EventService = {
  getEvents: async (): Promise<Event[]> => {
    return fetchJson('/events', {}, eventsDb);
  },
  getEventById: async (id: string): Promise<Event | undefined> => {
    return fetchJson(`/events/${id}`, {}, eventsDb.find(e => e.id === id));
  },
  registerForEvent: async (id: string): Promise<Event | undefined> => {
    return fetchJson(`/events/${id}/register`, { method: 'POST' }, eventsDb.find(e => e.id === id));
  }
};

export const InterviewService = {
  getInterviews: async (): Promise<Interview[]> => {
    return fetchJson('/interviews', {}, interviewsDb);
  },
  getInterviewById: async (id: string): Promise<Interview | undefined> => {
    return fetchJson(`/interviews/${id}`, {}, interviewsDb.find(i => i.id === id));
  }
};

export const NetworkService = {
  getMentors: async (): Promise<Mentor[]> => {
    return fetchJson('/mentors', {}, mentorsDb);
  },
  getRecruiters: async (): Promise<Recruiter[]> => {
    return fetchJson('/recruiters', {}, recruitersDb);
  },
  getPeers: async (): Promise<Student[]> => {
    return fetchJson('/peers', {}, [studentDb]);
  }
};
