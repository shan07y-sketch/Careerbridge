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
  readinessScore: number;
  linkedInConnected: boolean;
  gitHubConnected: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
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
