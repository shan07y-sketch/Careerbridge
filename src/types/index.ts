export interface Student {
  id: string;
  name: string;
  email: string;
  university: string;
  degree: string;
  gradYear: number;
  profilePicture: string;
  careerGoal: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  preferredLocation: string;
  skills: { name: string; level: number }[];
  resumeUrl?: string;
  portfolioUrl?: string;
  resumeScore: number;
  /** true when the resume ATS analysis came from the offline fallback, not Gemini. */
  resumeScoreEstimated?: boolean;
  readinessScore: number;
  linkedInConnected: boolean;
  gitHubConnected: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  // AI Preferences (Settings tab) -- real fields, persisted to StudentProfile.
  careerPath?: string;
  targetCompanies?: string;
  targetSalaryRange?: string;
  jobTypePreference?: 'Internship' | 'Full-Time';
  preferredIndustries?: string[];
  recommendationFrequency?: 'Daily' | 'Weekly' | 'Off';
}

export interface Job {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  location: string;
  postedTime: string;
  rating: number;
  salaryRange: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  matchRate: number;
  easyApply: boolean;
  description: string;
  requirements: string[];
  responsibilities: string[];
  urgency?: 'high' | 'medium' | 'low';
  experienceRequired?: string;
  benefits?: string[];
  applicantsCount?: number;
  aiMatchExplanation?: string;
  skillsMatchSummary?: string[];
  preferredSkills?: string[];
  technologies?: string[];
  reportingManager?: string;
  teamInfo?: string;
  hiringStages?: string[];
  companyOverview?: string;
  officeLocations?: string[];
  recruiterName?: string;
  recruiterAvatar?: string;
  deadline?: string;
}

export interface ApplicationOffer {
  id: string;
  title: string;
  salary: number;
  currency: string;
  startDate: string;
  status: 'DRAFT' | 'EXTENDED' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'EXPIRED';
}

export interface ApplicationInterview {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  locationUrl?: string | null;
  status: string;
}

export interface Application {
  id: string;
  jobId: string;
  status: 'applied' | 'interviewing' | 'offer' | 'rejected';
  dateApplied: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  timeline?: { stage: string; date: string; description: string; active?: boolean }[];
  recruiterName?: string;
  recruiterAvatar?: string;
  expectedResponseDate?: string;
  applicationScore?: number;
  requiredAction?: string;
  missingDocuments?: string[];
  activityLog?: { action: string; time: string }[];
  /** Real, backend-connected offer/interview data for the Hiring Pipeline workflow. */
  offer?: ApplicationOffer | null;
  interviews?: ApplicationInterview[];
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  banner: string;
  employeeCount: string;
  location: string;
  industry: string;
  description: string;
  culturePhotos: string[];
  openJobsCount: number;
  rating: number;
  website: string;
}

export interface Recruiter {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  avatar: string;
  bio: string;
  activeJobs: string[];
  email: string;
  phone: string;
}

export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  role: string;
  companyName: string;
  expertise: string[];
  bio: string;
  rating: number;
  reviewsCount: number;
  availabilitySlots: string[];
}

export interface Interview {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  type: 'Technical' | 'HR' | 'System Design' | 'Cultural';
  dateTime: string;
  status: 'scheduled' | 'pending' | 'completed';
  readinessScore: number;
  roomLink?: string;
}

export interface Event {
  id: string;
  title: string;
  banner: string;
  organizer: string;
  date: string;
  location: string;
  deadline: string;
  description: string;
  speakers: { name: string; role: string; avatar: string }[];
  remainingSeats: number;
  totalSeats: number;
  registered: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  threadId: string;
  isRead: boolean;
}

export interface Thread {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: 'interview' | 'ai' | 'resume' | 'network' | 'message';
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  isImportant?: boolean;
  isCompleted?: boolean;
  isArchived?: boolean;
  action?: {
    label: string;
    link: string;
  };
  priority?: 'low' | 'medium' | 'high';
  category?: 'interview' | 'network' | 'system' | 'general';
}

export interface CareerInsight {
  profileStrength: number;
  careerReadiness: number;
  resumeScore: number;
  industryMatchPercent: number;
  skillGaps: { skill: string; difficulty: string; estTime: string; status: 'Completed' | 'In Progress' | 'Up Next'; progress: number }[];
}

export interface InterviewReport {
  id: string;
  date: string;
  roleTitle: string;
  companyName: string;
  overallScore: number;
  metrics: {
    grammar: number;
    pacing: number;
    sentiment: number;
    keywords: number;
  };
  transcript: { speaker: 'AI' | 'Student'; text: string; time: string }[];
  suggestions: string[];
}

/**
 * AICareerInsight: the real, AI-Engine-generated Career Intelligence report
 * (Phase 3). Distinct from the legacy `CareerInsight` mock shape above --
 * this mirrors the actual `CareerInsight` Prisma model / AI Engine response
 * so the UI never has to fabricate data that isn't backed by a real record.
 */
export interface AICareerInsightRoadmapStep {
  title: string;
  description: string;
}

export interface AICareerInsight {
  id: string;
  targetRole: string;
  readinessPercent: number;
  summary: string;
  whyThisScore: string;
  matchedSkills: string[];
  missingSkills: string[];
  recommendedProjects: string[];
  recommendedCourses: string[];
  recommendedInterviewTopics: string[];
  roadmap: AICareerInsightRoadmapStep[];
  createdAt: string;
  /** Persisted engine version; a '-estimated' suffix marks an offline fallback result. */
  modelVersion?: string;
}

/**
 * Employer AI (Phase 4): reuses the same Resume Intelligence and Mock
 * Interview AI signals from the student side, read through the lens of a
 * specific job a recruiter is hiring for.
 */
export interface CandidateEvaluation {
  id: string;
  applicationId: string;
  fitScore: number;
  recommendation: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  skillsMatch: string[];
  skillsGap: string[];
  interviewSignal: string | null;
  modelVersion: string;
  createdAt: string;
}

export interface CandidateRanking {
  candidateId: string;
  rank: number;
  fitScore: number;
  summary: string;
}

export interface CandidateComparisonResult {
  rankings: CandidateRanking[];
  overallRecommendation: string;
}

/**
 * University AI (Phase 5): reuses the same Resume Intelligence and Mock
 * Interview AI signals from the student side, plus the university's own
 * deterministic placement analytics, to predict placement outlook, explain
 * department performance, recommend campus drives, and summarize university-
 * wide placement performance for leadership.
 */
export interface StudentPlacementInsight {
  id: string;
  studentProfileId: string;
  placementProbability: number;
  riskLevel: string;
  summary: string;
  riskFactors: string[];
  strengths: string[];
  suggestedActions: string[];
  modelVersion: string;
  createdAt: string;
}

export interface DepartmentInsight {
  insights: string[];
  recommendations: string[];
  outlookSummary: string;
}

export interface RecommendedDrive {
  targetRole: string;
  reason: string;
  priority: string;
}

export interface DriveRecommendationResult {
  recommendedDrives: RecommendedDrive[];
  summary: string;
}

export interface PlacementReport {
  executiveSummary: string;
  keyFindings: string[];
  recommendations: string[];
}

/**
 * Admin AI (Phase 6): operates and secures the platform by explaining and
 * prioritizing real, already-computed signals (fraud heuristics, growth
 * metrics, audit log stats, historical trends) rather than acting as a
 * chatbot. Every report is persisted as a generic `PlatformInsightReport`
 * row on the backend, discriminated by `reportType`.
 */
export interface AdminInsightReport<T> {
  id: string;
  reportType: string;
  payload: T;
  modelVersion: string;
  createdAt: string;
}

export interface FlaggedItem {
  category: string;
  severity: string;
  description: string;
  relatedIds: string[];
  recommendedAction: string;
}

export interface FraudDetectionResult {
  flaggedItems: FlaggedItem[];
  summary: string;
}

export interface PlatformInsightsResult {
  insights: string[];
  growthSummary: string;
  engagementSummary: string;
}

export interface RecommendedReview {
  target: string;
  reason: string;
  priority: string;
}

export interface ModerationResult {
  recommendedReviews: RecommendedReview[];
  summary: string;
}

export interface SystemHealthResult {
  healthStatus: string;
  issues: string[];
  recurringPatterns: string[];
  summary: string;
}

export interface ExecutiveReportResult {
  reportType: string;
  summary: string;
  keyMetrics: { label: string; value: string }[];
  highlights: string[];
  risks: string[];
  recommendations: string[];
}

export interface PredictiveAnalyticsResult {
  summary: string;
  growthForecast: string;
  hiringDemandForecast: string;
  interviewVolumeForecast: string;
  decliningDepartments: string[];
}
