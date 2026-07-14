import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { EmployerNotifications } from './Notifications';
import { EmployerHelpCenter } from './HelpCenter';
import { EmployerSettings } from './Settings';
import {
  EmployerLayout,
  EmployerSidebar,
  EmployerHeader,
  ContentContainer,
  SectionHeader,
  DashboardGrid,
  BentoGrid,
  DashboardCard,
  MetricCard,
  AIInsightCard,
  CandidateCard,
  DataTable,
  PrimaryButton,
  SecondaryButton,
  FilterBar,
  StatusBadge,
  Modal,
  Drawer,
  LineChart,
  BarChart
} from '../../components/employer';

// Types for the dashboard
interface EmployerJob {
  id: string;
  title: string;
  recruiter: string;
  department: 'Design' | 'Engineering' | 'Product' | 'Marketing';
  applicants: number;
  avgMatch: number;
  views?: number;
  postedDate: string;
  daysLeft: number;
  status: 'Published' | 'Draft' | 'Closed' | 'Paused';
  newApplicants?: number;
  location?: string;
  salaryRange?: string;
  workModel?: string;
  timeline?: Array<{ step: number; name: string; status: string }>;
  recentApplicants?: Array<{ initials: string; name: string; time: string; match: number; color: string }>;
}

interface EmployerCandidate {
  id: string;
  name: string;
  university: string;
  location: string;
  matchRate: number;
  avatar: string;
  salary: string;
  score: number;
  skills: string[];
  status: 'Immediate' | '2 Weeks' | 'Flexible';
  appliedDate: string;
}

interface OfficeLocation {
  id: string;
  name: string;
  type: string;
  description: string;
  employees: number;
  image: string;
}

export const EmployerDashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Active Tab State
  // 'dashboard' | 'jobs' | 'candidates' | 'interviews' | 'messaging' | 'company' | 'analytics' | 'settings' | 'notifications'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modals / Action States
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isJoinMeetOpen, setIsJoinMeetOpen] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<EmployerCandidate | null>(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'me' | 'candidate'; text: string; time: string }>>([]);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);
  const [selectedDrawerJob, setSelectedDrawerJob] = useState<EmployerJob | null>(null);
  const [selectedDetailedCandidate, setSelectedDetailedCandidate] = useState<any>(null);
  const [newNoteInput, setNewNoteInput] = useState('');

  // Interview Management states
  const [interviewViewMode, setInterviewViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All Statuses');
  const [spotlitCandidate, setSpotlitCandidate] = useState<any>({
    name: 'Jameson Burke',
    role: 'Lead Data Scientist',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJjoZAPYzi8aZbdzE7gAWuT7WsDlWcK3Cb7CxgMJ3aqnzYspfglTeNJW98h_C9WOrd3R3QTxTCVp2wQcASMktPO8C4tH1Ulp54KikgojEuyxFB9h5Ug0ukVqmlql456dtTSFB1TYal1UKrWwmtw0-ntUUDHrrboHh46w_SZPoiZtszOqAJYEI9H0iLH8F83wW7JOsGaYrCsn0tHkJFzl9oUL3J2n4qmZNK0eSdzGtdz7kQFLTGeSgr7nUgNtquNCqRRgw0YZhBSJk',
    summary: '12+ years experience in large-scale machine learning. Previously Lead at Google Brain. Expert in PyTorch, Distributed Systems, and Predictive Modeling.',
    agenda: [
      'Technical System Design (30m)',
      'Behavioral & Culture Fit (15m)',
      'Q&A (15m)'
    ]
  });

  // Analytics State
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'today' | '7d' | '30d' | 'quarter' | 'year'>('30d');

  // Recruiter Management State
  const [recruiterViewMode, setRecruiterViewMode] = useState<'card' | 'table'>('card');

  // Reports Center States
  const [selectedReportCategory, setSelectedReportCategory] = useState<string>('All Categories');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');

  // Messaging Center States
  const [selectedChatId, setSelectedChatId] = useState<string>('sarah-chen');
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [activeChatCategory, setActiveChatCategory] = useState<'all' | 'candidates' | 'recruiters' | 'starred' | 'archived'>('all');
  const [messagingInput, setMessagingInput] = useState<string>('');
  const [conversationsList, setConversationsList] = useState<any[]>([
    {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      role: 'Senior Software Engineer',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5HQc9xGAxdK2wqfvZB9eTkq61osIz14jkaDuXMdHx447P2vgp4oTs28o7M-MCUTsfn59kUnQVFCUaFk54jnYnfHe9OR5JYx-dl00zzwUMeG3MZLJygjsPIZvXkQ77f4GDzrlZme5YAdJznSxOuVVwyXgpaXnGUO8S-c_Fq2J-dKKOkVdTUWoDEYkv8EOq3vE0gkG_ppRouUeRWUxei3slT6VU_T0jOAHPMvEQrPR9KY_WM0biQ8zhT5mewmT49Ft687j32Nuy6EA',
      lastTime: '10:42 AM',
      matchRate: 94,
      score: 92,
      stage: 'Tech Review',
      isTyping: true,
      starred: true,
      category: 'candidates',
      messages: [
        { sender: 'candidate', text: "Hi Sarah, thanks for joining the call earlier. I've shared the technical assessment details with the team.", time: '10:45 AM', isRead: true },
        { sender: 'me', text: "That sounds great! I'm looking forward to the next steps. Here is my updated resume for the team.", time: '10:50 AM', isRead: true, attachment: { name: 'Sarah_Chen_Resume_2024.pdf', size: '2.4 MB', type: 'PDF' } }
      ],
      aiInsights: 'Strong alignment with React/Node.js stack and leadership requirements.',
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
      expectedSalary: '$165k - $180k',
      noticePeriod: '2 Weeks'
    },
    {
      id: 'marcus-thorne',
      name: 'Marcus Thorne',
      role: 'Product Lead',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9xXjO9a6-VuiypbwLD49NVO66jKlZL6MUZrqDBFWgdYqacfThRqJyJxJu2nmZ2gp8lWUk1h4_qt6AV-SA3xDGPNqf_LPMpXR1p0xjpZwj7dAGy84cTX8GfW4EsQE1YNnqzUtsR_FP1dW5e5ipGrSmdPDGbPnmgtD8GA_MAEQRkKBMJ1fF84YJh4t9Ti82bc7CWAhRj-NuMwLfGWgfaDpnPW6LQciDmrG71VYtiKDz5N0n4eU22L3s',
      lastTime: '9:15 AM',
      matchRate: 88,
      score: 85,
      stage: 'Offer Stage',
      isTyping: false,
      starred: false,
      category: 'candidates',
      unreadCount: 2,
      messages: [
        { sender: 'candidate', text: "I've reviewed the offer details and will get back with comments soon.", time: '9:15 AM', isRead: false }
      ],
      aiInsights: 'Candidate has competing offers, but prefers our culture and mission alignment.',
      skills: ['Product Strategy', 'Roadmapping', 'Agile', 'SQL'],
      expectedSalary: '$175k - $190k',
      noticePeriod: 'Immediate'
    },
    {
      id: 'elena-rodriguez-candidate',
      name: 'Elena Rodriguez',
      role: 'Lead UI/UX Designer',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACOyVl3JQUuDUnknNmik_KjCqTId8jwh33GN-aUNddL-V5mJLp8AIbMAG1QkNinvO12-Ecn0W4rFPVLZIeudde-dcboic6IbzKF5cWd7JRJIwXbZ9i8Uzs7_CL98eutRKehimmmOR44J-JsCm2SuT5j-ccHFsGeu9xv30xoTo-OStQHGm8IUiBj-ikaqVciazgJim31bbikj_8nb9xUCyEdWTj0thUgM6s5HxfSLT1WNXl30_s5bZ4',
      lastTime: 'Yesterday',
      matchRate: 91,
      score: 90,
      stage: 'Portfolio Review',
      isTyping: false,
      starred: true,
      category: 'candidates',
      messages: [
        { sender: 'candidate', text: 'Attached is my updated portfolio.', time: 'Yesterday', isRead: true }
      ],
      aiInsights: 'Excellent portfolio displaying high-fidelity mobile systems and Figma components.',
      skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping'],
      expectedSalary: '$150k - $165k',
      noticePeriod: '1 Month'
    }
  ]);

  // Filter States for Recruitment Funnel
  const [funnelFilter, setFunnelFilter] = useState<'all' | 'engineering' | 'design'>('all');

  // --- Company Profile State ---
  const [companyCover, setCompanyCover] = useState('https://lh3.googleusercontent.com/aida/AP1WRLv7eFnRc97bgvubOaE4Xvm6RIcUyqA4aBM78H8yko8vnwyV1ONdvtrYoO23Jtq7EtoGdSR2az8tVe4ke_hb8c1S4IqDzvZuL05FBV5cnwCE2e2i3avZBDi-Vg1MinKC6fPqHyEo0uzChlpXHK_P5EipgFuFvzyqMZKDmo91df0r0JZEzGKnR1njg0K5i2nDSZ-CMBpbuMk_NtVb5ugfgbfSLWtI6BCT8V9WiA2pX__moOejskbLfO3CGA');
  const [companyLogo, setCompanyLogo] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuAqBACLQvzLr1gEoZ4_VFbGihhixQEC8hKR093OXXq04Gw59RzxAwDxpqxsN_RxHGSeU-O9fzu811lUvb1oRP4lQKGvGR9meR7ayAy1izENKMZSH4yE1PmY-tbSZe_AImDzrFlrY6mQo5BOrJAoD1Qff2iHvPC8ETtvjGjB12lhRsgmD5cteQ9VCd3bvCHziiBpKgW2co0uZSk6ygTNW2SIYlrK2S_XIgsO6s_TIyt1tPH7mLSg1Pulz_-_ubRptM7GaGgfvJadgSM');
  const [companyName, setCompanyNameText] = useState('Lumina Systems');
  const [companyLocation, setCompanyLocation] = useState('San Francisco, CA');
  const [companyIndustry, setCompanyIndustry] = useState('Software & AI');
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  
  const [aboutUsText, setAboutUsText] = useState('Lumina Systems is a pioneer in generative infrastructure for Fortune 500 companies. Founded in 2018, we bridge the gap between cutting-edge AI research and practical enterprise application.');
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  const [missionValues, setMissionValues] = useState([
    'Prioritize integrity in every algorithm.',
    'Foster radical transparency within teams.',
    'Design for human flourishing.'
  ]);
  const [isEditingValues, setIsEditingValues] = useState(false);
  const [newValuesInput, setNewValuesInput] = useState('');

  const [techStack, setTechStack] = useState(['React', 'Node.js', 'TypeScript', 'AWS', 'Kubernetes', 'Python']);
  const [isAddingTech, setIsAddingTech] = useState(false);
  const [newTechInput, setNewTechInput] = useState('');

  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([
    {
      id: 'loc_1',
      name: 'San Francisco',
      type: 'HQ',
      description: 'Market Street Tech Corridor',
      employees: 450,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDS7qIDD0zO9y9ijqKg-Jp3OtJfREsDw69os23pCxObvicfOODClc9i7MlMp8DAmzHpLZ3fopnnG6oexadMQI0VhyRuGBihd9BdZcB9znVtLFkav_VLCbMaxnIn7Q0C_wlHZmUSmdL-25PM6BAYGosaGEAQWyFjikXsOIk9yeZ-EXInR6iEymJegDjtp6WwqnAjISwclUooOr8D75T_t_l6n9Yw9BTArlbv5USgv63ObBxRhamG-TCj0EA6y6-g-vhGtVmaDQRo1Y'
    },
    {
      id: 'loc_2',
      name: 'London',
      type: '',
      description: "King's Cross Innovation Quarter",
      employees: 200,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6wts_SMN5zhEezggmRpIMnaHHTnW4gWu3rfYb80XsCSdodvl0pTUCamtRLgdfelbLW7o4FMcqq53F2JO5ffFQBAtny7A_uRd63D1jmjhsrVNpnFmZH_ZwV2mPFLTUAE8FQAmH2P4CKLRF9XoRRFqH3fNH0wwH7bhUtvojrJL7BfmB_zYWe0DwqG7xHPvklyPkHXoL6xS8A5UUdcdhxS-c6r9UjCY6xmQeNQgyF16xNab3pyOXbmUgQAx1OtBrfCrk01P5Vcr5_0g'
    },
    {
      id: 'loc_3',
      name: 'Bangalore',
      type: '',
      description: 'Outer Ring Road Tech Hub',
      employees: 200,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZTkDXc18gXSyk2LKK0eqs2mxADhI97TmbrhOfJC6j1PMAGwhMp6jsGMgw0X4afdYef7_WIx8Mdri-R7FQBag5MisP0jzdOjhasPySZoyWsQ2eF018cv6JkGupdt39kZjnKZ_tMgZ1Fo22oAXkt4GU3BS3JOIWGQ9du9toT7D6yTcRah0b33mFBGKU58BW5XQ_HbhsEHZE3glM_GI-_tsTA-fABXI4nWJLuPvtu_bctv_gi9d1RNnrfeU_AnIt4tRNNd9OFfut8Hs'
    }
  ]);
  const [selectedLocation, setSelectedLocation] = useState<OfficeLocation | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const [galleryImages, setGalleryImages] = useState([
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCAcLhR59XTRWje3NoRQTEDSW8O2IoZ2LPdkzXMnsfSG8Il9WZtCHR0MhKdwSyD30mnq4__Im1RDEqidLY8QHXzTy6xMkoPjSkYuzEPChhqTlsYvb-gVD6k2AokhQyu1y1GOW51VescKwlFrs7wZo_GnvwHod-KGUKELg9UyeWr8gzVhMyKYLtY-w2LgyHZGOp6ApdmnI9cc1Jb3KePk6D-TcatLoFP9Z5wjH_PHuqX_riBKuiFkol2pGkN8wTtG6rVhK0KXDIRko0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAv_Xm-hQz1afQHmVOE4ay0pzCmz3sadO6mj1aaURI5eflPlShHllOK0zxWzFNeTOUADPAU1Dvp8kUeQ-fNV_w8CsTYMnpU3hL5i9stXgsZONbxoJ5UKA5JOffvDq5pmA4pG_vrbYCtJjTT7B9xQN4hw8np10IPb28wmIvx8R7wrJn9gDbPdnje6_nBXbDf8fU8nsjz-NjU36qqgvzBSlgb-_5f0G1ztgcGuMd2l3h7q0Y3iqPGd8rTXY4ckLRaUosSEMr-zt-8UFo',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC7_A2vP1RNjSMTIUB8Ncm7JNaLddUZJApyCnp51poIxB8AnuszLGBsLELe0y35HX6ygQzzLCQadBY_GXW7VgyCA76zsYJYqe84yOWS5lCROtxTpzhYRG3gIi2K2KStN0-xA8FJXjZ5O-TGexZGXfc_53ehQVtu4uHK8p0x2iNfZk1i_Tg0gb31jdcUtEjVUd51iESgauFU-5sUeWNIFvTeYoAeZTazhQ_CN_8_uuPIukAPg6-gsIx5n8E4Hp04VEfqF_im3W6dTGY',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBwO7XfXkpUwJMUwzDG56gXnHQiZgkiH1z2Umc8nFNbB9V8QBMEqTm5EuXEp3IRmOGb7DsyTy9vZXCVzNh-wLHakdxIeqVdNYfyKj7ah_AVZEjETAE4hrqKC715xXktyWBOYsHrdG0r-VqiX6t7MiHlDpXwidxdf6MaFPt4LTktUoplHb71gzsVu8UEbJFPTHoyp36Gj2WjbDTXkQbWjLYLpTURKKUtTV1FJ8wqbNE9c2Fid09NRzE5QEz6p1oDVPtkBpUHTNm_tgM'
  ]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');

  const [monthlyGoals, setMonthlyGoals] = useState({
    screened: 42,
    screenedTarget: 50,
    outreach: 8,
    outreachTarget: 12
  });
  const [isAdjustingGoals, setIsAdjustingGoals] = useState(false);

  const [isCoverEditOpen, setIsCoverEditOpen] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [isLogoEditOpen, setIsLogoEditOpen] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Dynamic DB lists (React State)
  const [jobs, setJobs] = useState<EmployerJob[]>([
    {
      id: 'job_1',
      title: 'Senior UX Designer',
      recruiter: 'Sarah Jenkins',
      department: 'Design',
      applicants: 42,
      newApplicants: 8,
      avgMatch: 94,
      views: 1840,
      postedDate: 'Oct 20, 2024',
      daysLeft: 12,
      status: 'Published',
      location: 'San Francisco, CA',
      salaryRange: '$140k - $185k',
      workModel: 'Hybrid (3 days/wk)',
      timeline: [
        { step: 1, name: 'Initial Screen', status: 'Completed • 42 Candidates' },
        { step: 2, name: 'Portfolio Review', status: 'In Progress • 12 Candidates' }
      ],
      recentApplicants: [
        { initials: 'AJ', name: 'Alex Johnson', time: 'Applied 2h ago', match: 94, color: 'bg-primary-fixed text-primary' },
        { initials: 'ML', name: 'Maya Lin', time: 'Applied 5h ago', match: 82, color: 'bg-secondary-fixed text-secondary' }
      ]
    },
    {
      id: 'job_2',
      title: 'Frontend Lead',
      recruiter: 'Mike Chang',
      department: 'Engineering',
      applicants: 128,
      newApplicants: 14,
      avgMatch: 88,
      views: 4520,
      postedDate: 'Oct 15, 2024',
      daysLeft: 24,
      status: 'Published',
      location: 'Remote',
      salaryRange: '$135k - $165k',
      workModel: 'Remote',
      timeline: [
        { step: 1, name: 'Initial Screen', status: 'Completed • 128 Candidates' },
        { step: 2, name: 'Coding Challenge', status: 'In Progress • 45 Candidates' }
      ],
      recentApplicants: [
        { initials: 'ML', name: 'Maya Lin', time: 'Applied 5h ago', match: 82, color: 'bg-secondary-fixed text-secondary' }
      ]
    },
    {
      id: 'job_3',
      title: 'Growth Marketing Lead',
      recruiter: 'Jane Doe',
      department: 'Marketing',
      applicants: 12,
      newApplicants: 0,
      avgMatch: 92,
      views: 240,
      postedDate: 'Oct 22, 2024',
      daysLeft: 30,
      status: 'Draft',
      location: 'London, UK',
      salaryRange: '$90k - $115k',
      workModel: 'On-site',
      timeline: [
        { step: 1, name: 'Initial Review', status: 'Drafting Process' }
      ],
      recentApplicants: []
    }
  ]);

  const [candidates, setCandidates] = useState<any[]>([
    {
      id: 'cand_1',
      name: 'Alexander Pierce',
      university: 'Stanford University',
      location: 'Berlin',
      matchRate: 94,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnIcZpXeMxA6rxwmTR9aoZ1r1mcu88cvB4A3D5WcqHgQJ-cqPOUDNzpMKdWrUQ5rScFjT1uV4z29ctxoJU5wGUwrye4XrsSrYne8FXMwdTaQ4lAzEHgpNqI6VTp4EuBFZ1uC41R3iLvefgFQtei5fidVufefZQpNEL8uwswGs7k7Yjg4UDw0ILTwAgPKAAkrmWk5WqrgniESnrxxtaMtp7DJAgthlpyU4-vqL4Q30scjxDgckusBIiu-yMeALFAJs_CmAE7GaNUFk',
      salary: '$140k - $160k',
      score: 9.4,
      skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Node.js', 'CI/CD', 'AWS S3'],
      status: '2 Weeks Notice',
      appliedDate: 'Oct 12, 2023',
      title: 'Senior Frontend Engineer at TechFlow Systems',
      experience: '8 Yrs',
      summary: 'Alexander is a seasoned Frontend Architect with nearly a decade of experience building scalable design systems and high-performance React applications. He has a track record of improving site performance by up to 40% and leading cross-functional teams in agile environments. His expertise lies in bridging the gap between pixel-perfect design and robust engineering.',
      strengths: ['React/Next.js Mastery', 'Scalable CSS Systems', 'Web Vitals Expert'],
      growthAreas: ['Backend Exposure (Node.js)', 'Mobile Development'],
      history: [
        { role: 'Senior Frontend Engineer', company: 'TechFlow Systems • Full-time', date: 'Jan 2021 – Present (2.8 yrs)', desc: 'Leading the UI transition from legacy systems to a unified React-based design system. Managed a team of 4 junior developers.' },
        { role: 'UI Developer', company: 'CreativeCore Agency', date: 'Aug 2017 – Dec 2020 (3.4 yrs)', desc: 'Developed interactive web experiences for Fortune 500 clients using modern JavaScript and advanced CSS animations.' },
        { role: 'B.Sc. in Computer Science', company: 'University of Engineering', date: 'Graduated 2016', desc: '' }
      ],
      feedback: { technical: 4.8, communication: 4.4, culture: 4.5 },
      nextAction: { title: 'Technical Interview', time: 'Oct 24, 2023 • 2:00 PM' },
      source: 'LinkedIn InMail',
      recruiter: 'Sarah Jenkins',
      notes: [
        { author: 'Marcus Thorne', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIjmKXVwHPGzSrC0uFxLwFnUnRHnRLh37G0t-grSuU6SQy8Ot2_DZ4zhU5gyOpsKDBaUoJMsmbBMCUgcpsok_uNjYfF3aLnkfKskH-AuCFFj8x9AUEg3zatPKSN8f-OTR5tR0Gzq-Bv1jU_TM6GyrBl8C6b5EVtsRM4pWvi22kZvEF4QDPguy2ClD-YDGTWa3nCbFd3Ph4YBpMKvT1FGKjmQaWiCkJYnxy19_FD3oCDXfIstE3GWyb1Uy-lxTBJGVJZ2EU3ie5zHA', time: '2 hours ago', text: 'Great technical screen. Alex has a deep understanding of the DOM and React reconciliation. @Sarah Jenkins, we should prioritize his architectural round.' },
        { author: 'Sarah Jenkins', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbkO4BhOCsLkZf0ERNsj-6rt0xZU0f2NOOEXsF8QrtmkSaYnvlQTzC4qNG2n8beTs24Ugs9YEwcAmp0D_eGPOF76Tq4_gya0h0p-NADHedwyksQer8-eNXYBgEbfG_2ZwS74u-MTNfQw4Rv7vbm9uJaQFVLjIQ3sa0jbQYmM1pBdx9aZyXIJErMXZ0vn7YoYFQG37I_oTh58WJ_VXM5WBNbUzh4gyF5Kqfgo_CmXO_6yhPIv5lcZUmXXACuMe2LFCQlVI6V0JzKrM', time: '1 hour ago', text: "Agreed. I've noted his preference for remote work. He mentioned being open to hybrid for the right role." }
      ]
    },
    {
      id: 'cand_2',
      name: 'Elena Rodriguez',
      university: 'MIT',
      location: 'Boston, MA',
      matchRate: 88,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn0IcqSF1n4MUz7I3WEpVUWdGfRqPsX_4_oT4aMj2w83Z2U7jay1CR45xL6JDx2ka5oMGkU5v2TiTzXvAc7RfDxnK_e-1dVxTVeUvMFNKcZ8tMir8cea-kzIq9AqtgEtKNPYr9INjKjU9WSYUKpe8Q56o7TD3S5ZVAfgZsFzHEyvaA6DpJPDwu7NZLS-dYAlqovO7Qp9x2dfllcsD3dQqfGx-yRp-D0wHYZpBc-VIqUGbLUirQRbf1bmDP0qXNnY-cUt_6D8puDq8',
      salary: '$155k',
      score: 8.8,
      skills: ['AWS (Expert)', 'Python (Expert)', 'Docker', 'Kubernetes'],
      status: 'Immediate',
      appliedDate: 'Oct 18, 2024',
      title: 'Cloud Architect at MIT Research Labs',
      experience: '5 Yrs',
      summary: 'Elena is a Cloud Infrastructure Engineer with a passion for designing automated DevOps pipelines and high-availability compute modules.',
      strengths: ['AWS Orchestration', 'Infrastructure as Code', 'Dockerization'],
      growthAreas: ['Frontend UI', 'Figma Prototyping'],
      history: [
        { role: 'Cloud Lead', company: 'MIT Research Labs', date: '2022 - Present', desc: 'Maintained cloud compute modules and automated terraform deployments.' }
      ],
      feedback: { technical: 4.7, communication: 4.5, culture: 4.2 },
      nextAction: { title: 'Technical Interview', time: 'Oct 26, 2024 • 10:00 AM' },
      source: 'Direct Application',
      recruiter: 'Sarah Jenkins',
      notes: []
    },
    {
      id: 'cand_3',
      name: 'Jordan Smith',
      university: 'UC Berkeley',
      location: 'SF, CA',
      matchRate: 82,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX8pjGV1kUQ8LMrlnpu4juu26fdxmTW7n-0YYDBdOeEY6gkYTUu3ELgaocIBybfAsfbCAAN0VvwQcsgqTMOgw7L1ejgvqckBvxTOfPXixUYGJfUohdI5tc0QxV-PJdvFAhvYcLfxlay46bWRfrxFQkgoyDPzLsNSoEuF7KmKbeBfIadTm3poXc2nXLX-QYqYYNtnTMagh3QhJqYAd_NKe2ceVnUcjOJAqoqS6l0Cd5FOcz1uaDurIae9pkCZXLL5EQVWD2fMTN5B0',
      salary: '$120k',
      score: 8.2,
      skills: ['Figma', 'Webflow', 'Prototyping', 'User Research'],
      status: 'Flexible',
      appliedDate: 'Oct 21, 2024',
      title: 'Product Designer at Berkeley Lab',
      experience: '3 Yrs',
      summary: 'Jordan is a Product Designer specializing in user research, wireframing, and interactive high-fidelity prototype animations.',
      strengths: ['User Research', 'Interactive Prototyping', 'Figma Master'],
      growthAreas: ['Production CSS', 'Data Analytics'],
      history: [
        { role: 'Designer Intern', company: 'Berkeley Lab', date: '2023 - 2024', desc: 'Conducted user interviews and updated design patterns in Figma.' }
      ],
      feedback: { technical: 4.2, communication: 4.8, culture: 4.5 },
      nextAction: { title: 'Portfolio Review', time: 'Oct 28, 2024 • 11:30 AM' },
      source: 'Campus Outreach',
      recruiter: 'Sarah Jenkins',
      notes: []
    }
  ]);

  // Funnel Data depending on filter
  const getFunnelData = () => {
    switch (funnelFilter) {
      case 'engineering':
        return { applied: 850, screening: 310, shortlisted: 80, interview: 28, offer: 5 };
      case 'design':
        return { applied: 390, screening: 140, shortlisted: 40, interview: 20, offer: 3 };
      default:
        return { applied: 1240, screening: 450, shortlisted: 120, interview: 48, offer: 8 };
    }
  };

  const funnel = getFunnelData();

  // Post Job form state
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState<'Design' | 'Engineering' | 'Product' | 'Marketing'>('Engineering');
  const [newJobRecruiter, setNewJobRecruiter] = useState('Sarah Jenkins');

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) {
      showToast('Please enter a job title.', 'error');
      return;
    }
    const newJob: EmployerJob = {
      id: `job_${Date.now()}`,
      title: newJobTitle,
      recruiter: newJobRecruiter,
      department: newJobDept,
      applicants: 0,
      avgMatch: 100,
      postedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysLeft: 30,
      status: 'Published',
    };
    setJobs([newJob, ...jobs]);
    setIsPostJobOpen(false);
    setNewJobTitle('');
    showToast('Job listing published successfully!', 'success');
  };

  const handleOpenResume = (candidate: EmployerCandidate) => {
    setSelectedCandidate(candidate);
    setIsResumeOpen(true);
  };

  const handleOpenMessage = (candidate: EmployerCandidate) => {
    setSelectedCandidate(candidate);
    setChatHistory([
      { sender: 'candidate', text: `Hi there, thanks for checking my profile! I'm very interested in the ${candidate.skills.includes('React') ? 'Frontend Lead' : 'Senior UX Designer'} position.`, time: '10:00 AM' }
    ]);
    setIsMessageOpen(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'me' as const, text: messageText, time };
    setChatHistory(prev => [...prev, userMsg]);
    setMessageText('');

    // Simulate response
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'candidate' as const,
          text: `Thank you for reaching out! Tuesday at 2:00 PM works perfectly for a brief initial screen. I look forward to it.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim() || !selectedDetailedCandidate) return;
    const newNote = {
      author: 'Sarah Jenkins',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsbxgnau_hkgmbHKzxKXRW04KbG8QYlsD_7ixe8yvrH-KSb2nHV_9NevnXfNaS_xHFuqz41bQzlRPrb3T9yJ7WZSV7bN7E8e658XBidTATd2nJJyc9Cs-qSGzDKl_8QgEI1RVpEsSnMdKrw0qkHulK_QX1EsMgBXXHL8Z3mu5amtA1XJpASv64u38-f-2QcAY-GB4g6iAyoQjYxLxoDJO-UX5kAQgOI5sntIV6kE0GMSj-aqdjxPsnKyoHMSYqqknL72KDMg9rK7M',
      time: 'Just now',
      text: newNoteInput.trim()
    };
    
    const updatedCandidates = candidates.map(c => {
      if (c.id === selectedDetailedCandidate.id) {
        return {
          ...c,
          notes: [...(c.notes || []), newNote]
        };
      }
      return c;
    });
    setCandidates(updatedCandidates);
    setSelectedDetailedCandidate({
      ...selectedDetailedCandidate,
      notes: [...(selectedDetailedCandidate.notes || []), newNote]
    });
    setNewNoteInput('');
    showToast('Note added successfully!', 'success');
  };

  const triggerAudit = () => {
    setIsAuditOpen(true);
    setAuditProgress(5);
    const interval = setInterval(() => {
      setAuditProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          showToast('Talent audit report generated successfully.', 'success');
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 300);
  };

  const handleLogout = async () => {
    await logout();
    showToast('Signed out successfully.', 'info');
    navigate('/');
  };

  // --- Company Profile Action Handlers ---
  const handleSaveCompanyProfile = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      showToast('Company profile changes saved successfully!', 'success');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 1000);
  };

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechInput.trim()) return;
    if (techStack.includes(newTechInput.trim())) {
      showToast('Technology already exists.', 'error');
      return;
    }
    setTechStack([...techStack, newTechInput.trim()]);
    setNewTechInput('');
    setIsAddingTech(false);
    showToast('Technology added.', 'success');
  };

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrlInput.trim()) return;
    setGalleryImages([mediaUrlInput.trim(), ...galleryImages]);
    setMediaUrlInput('');
    setIsUploadingMedia(false);
    showToast('Media file uploaded successfully.', 'success');
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    setOfficeLocations(officeLocations.map(loc => loc.id === selectedLocation.id ? selectedLocation : loc));
    setIsEditingLocation(false);
    setSelectedLocation(null);
    showToast('Office location details updated.', 'success');
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdjustingGoals(false);
    showToast('Recruitment targets updated.', 'success');
  };

  // Filtered lists for searches
  const filteredJobs = jobs.filter(j => j.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCandidates = candidates.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.skills.join(' ').toLowerCase().includes(searchQuery.toLowerCase()));

  // Render layouts
  const sidebar = (
    <EmployerSidebar
      activeTab={activeTab}
      setActiveTab={(tab) => {
        setActiveTab(tab);
        setSearchQuery('');
      }}
      jobsCount={jobs.length}
      onPostJobClick={() => setIsPostJobOpen(true)}
      onLogoutClick={handleLogout}
    />
  );

  const header = (
    <EmployerHeader
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      showSuggestions={showSuggestions}
      setShowSuggestions={setShowSuggestions}
      placeholder={activeTab === 'company' ? "Search office locations, tech stack, or departments..." : "Search candidates, jobs, or reports..."}
      onNotificationClick={() => setActiveTab('notifications')}
      onHelpClick={() => setActiveTab('help')}
      userName="Sarah Jenkins"
      userRole="Lumina Talent Admin"
      userAvatar="https://lh3.googleusercontent.com/aida-public/AB6AXuD8fmbPNnHwpWMvZM-T2CWemc-SutIEbVz9atkohzfjK2mywkEapmyc5xnvkFpItib9oV27Rk8xuwjHZM8weXGjQPyCsMU4n60Xl3h05YztHTsBr1-xOFJ2H1ZebRjN6biLoVtI4aTL6CD-fScV-GmkG4Wn4wKiGDuZocI-tHndOkhT53rvl6askVESS4fD3T8tFgWbaGihWr1G5nIIz-KoAkc-s1nl6e-vby-Wj-pF2RSBHwT2Xv1ADmLS8WKWF6sek7hIR6jsvWg"
      suggestions={
        <>
          <div className="p-2 border-b border-surface-container bg-surface-container-low/50 font-bold text-[10px] text-on-surface-variant uppercase tracking-wider px-4 py-2">Quick Matches</div>
          <div className="p-1 text-left">
            {filteredCandidates.slice(0, 2).map(cand => (
              <button
                key={cand.id}
                onMouseDown={() => handleOpenResume(cand)}
                className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high rounded-lg group text-on-background cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-lg">person</span>
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-xs text-on-background">{cand.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{cand.university} · {cand.matchRate}% Match</p>
                </div>
              </button>
            ))}
            {filteredJobs.slice(0, 2).map(job => (
              <button
                key={job.id}
                onMouseDown={() => { setActiveTab('jobs'); setSearchQuery(''); }}
                className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high rounded-lg text-on-background cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-lg">work</span>
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-xs text-on-background">{job.title}</p>
                  <p className="text-[10px] text-on-surface-variant">{job.department} Department · {job.applicants} Applicants</p>
                </div>
              </button>
            ))}
          </div>
        </>
      }
    />
  );

  return (
    <EmployerLayout sidebar={sidebar} header={header}>
      <ContentContainer>
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome & Dashboard Header */}
            <SectionHeader
              title="Good Morning, Sarah"
              subtitle={
                <span>
                  You currently have <span className="font-bold text-primary">12 Active Jobs</span>,{' '}
                  <span className="font-bold text-primary">1,240 Applications</span>,{' '}
                  <span className="font-bold text-primary">48 Interviews</span>, and{' '}
                  <span className="font-bold text-primary">15 Offers</span>.
                  <span className="block mt-1 font-semibold text-primary/85">
                    Priority for today: Review 8 new applicants for the Senior UX Designer role.
                  </span>
                </span>
              }
              actions={
                <div className="bg-white p-3 rounded-2xl border border-primary/5 shadow-sm flex items-center justify-between gap-1 w-full lg:w-auto">
                  {[
                    { label: 'Post Job', icon: 'add_box', action: () => setIsPostJobOpen(true) },
                    { label: 'Invite', icon: 'person_add', action: () => showToast('Team invitation modal triggered.', 'info') },
                    { label: 'Schedule', icon: 'event', action: () => showToast('Calendar scheduler triggered.', 'info') },
                    { label: 'Export', icon: 'file_export', action: () => showToast('Exporting data as CSV...', 'success') }
                  ].map(btn => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      className="flex flex-col items-center gap-1 p-2 hover:bg-surface-container-high rounded-xl transition-all flex-grow text-on-surface-variant hover:text-primary cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">{btn.icon}</span>
                      <span className="text-[9px] font-bold uppercase tracking-tight">{btn.label}</span>
                    </button>
                  ))}
                </div>
              }
            />

            {/* KPI Rows */}
            <DashboardGrid>
              <MetricCard
                icon="work"
                title="Active Jobs"
                value="12"
                trendText="▲ 18% vs last month"
                subtext="+2 new since last month"
              >
                <div className="h-10 w-full">
                  <LineChart lines={[{ id: 'activeJobs', points: "M0 35 L 10 30 L 20 32 L 30 25 L 40 28 L 50 15 L 60 20 L 70 10 L 80 15 L 90 5 L 100 8", color: "currentColor", dots: [] }]} />
                </div>
              </MetricCard>

              <MetricCard
                icon="group"
                title="Total Applicants"
                value="1,240"
                trendText="▲ 14% vs last month"
                subtext="Comparing Oct vs Sept data"
              >
                <BarChart data={[50, 75, 65, 100]} />
              </MetricCard>

              <MetricCard
                icon="event_available"
                title="Interviews"
                value="48"
                trendText="▲ 8% vs last month"
                subtext="Average 12 sessions per week"
              >
                <div className="h-10 w-full">
                  <LineChart lines={[{ id: 'interviews', points: "M0 35 Q 25 35, 40 20 T 70 10 T 100 30", color: "currentColor", dots: [] }]} />
                </div>
              </MetricCard>

              <MetricCard
                icon="assignment_turned_in"
                title="Offers Sent"
                value="15"
                trendText="▲ 5% vs last month"
                subtext="Success rate improved by 5%"
              >
                <div className="mt-5 flex items-center justify-between text-[10px] font-extrabold text-on-surface-variant uppercase tracking-tight">
                  <span>Success Rate</span>
                  <span className="text-primary">80%</span>
                </div>
                <div className="mt-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[80%] rounded-full"></div>
                </div>
              </MetricCard>
            </DashboardGrid>

            {/* Bento Grid */}
            <BentoGrid>
              {/* Recruitment Funnel */}
              <DashboardCard className="col-span-12 lg:col-span-8 text-left" hoverable={false}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-primary">Recruitment Funnel</h3>
                    <p className="text-xs text-on-surface-variant">Overall conversion stages across all active roles</p>
                  </div>
                  <FilterBar
                    options={[
                      { id: 'all', label: 'All Roles' },
                      { id: 'engineering', label: 'Engineering' },
                      { id: 'design', label: 'Design' }
                    ]}
                    selectedId={funnelFilter}
                    onSelect={(id) => setFunnelFilter(id as any)}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="funnel-connector group">
                    <div className="h-14 flex items-center rounded-xl bg-primary text-white px-6 justify-between shadow-sm cursor-help" title="Total applicants entered the system">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center font-bold text-xs">01</span>
                        <span className="text-sm font-semibold">Applied</span>
                      </div>
                      <span className="text-lg font-bold">{funnel.applied}</span>
                    </div>
                    <div className="flex justify-center -mb-2 mt-1 relative z-10">
                      <span className="bg-surface px-3 py-0.5 rounded-full border border-outline-variant/40 text-[9px] font-extrabold text-on-surface-variant">
                        Applied → Screening: 36% conversion
                      </span>
                    </div>
                  </div>

                  <div className="funnel-connector group">
                    <div className="h-14 flex items-center rounded-xl bg-primary/80 text-white px-6 justify-between shadow-sm cursor-help" style={{ width: '70%' }} title="Candidates identified for initial screen">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center font-bold text-xs">02</span>
                        <span className="text-sm font-semibold">Screening</span>
                      </div>
                      <span className="text-lg font-bold">{funnel.screening}</span>
                    </div>
                    <div className="flex justify-center -mb-2 mt-1 relative z-10" style={{ width: '70%' }}>
                      <span className="bg-surface px-3 py-0.5 rounded-full border border-outline-variant/40 text-[9px] font-extrabold text-on-surface-variant">
                        Screening → Shortlisted: 27% conversion
                      </span>
                    </div>
                  </div>

                  <div className="funnel-connector group">
                    <div className="h-14 flex items-center rounded-xl bg-primary/65 text-white px-6 justify-between shadow-sm cursor-help" style={{ width: '45%' }} title="Top candidates for technical interviews">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center font-bold text-xs">03</span>
                        <span className="text-sm font-semibold">Shortlisted</span>
                      </div>
                      <span className="text-lg font-bold">{funnel.shortlisted}</span>
                    </div>
                    <div className="flex justify-center -mb-2 mt-1 relative z-10" style={{ width: '45%' }}>
                      <span className="bg-surface px-3 py-0.5 rounded-full border border-outline-variant/40 text-[9px] font-extrabold text-on-surface-variant">
                        Shortlisted → Interview: 40% conversion
                      </span>
                    </div>
                  </div>

                  <div className="funnel-connector group">
                    <div className="h-14 flex items-center rounded-xl bg-primary/45 text-white px-6 justify-between shadow-sm cursor-help" style={{ width: '25%' }} title="Active interview process">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center font-bold text-xs">04</span>
                        <span className="text-sm font-semibold">Interview</span>
                      </div>
                      <span className="text-lg font-bold">{funnel.interview}</span>
                    </div>
                    <div className="flex justify-center -mb-2 mt-1 relative z-10" style={{ width: '25%' }}>
                      <span className="bg-surface px-3 py-0.5 rounded-full border border-outline-variant/40 text-[9px] font-extrabold text-on-surface-variant">
                        Interview → Offer: 16% conversion
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="h-14 flex items-center rounded-xl bg-primary/20 text-primary px-6 justify-between shadow-sm cursor-help" style={{ width: '10%' }} title="Final employment offers sent">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs">05</span>
                        <span className="text-sm font-semibold">Offer</span>
                      </div>
                      <span className="text-lg font-bold">{funnel.offer}</span>
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* Upcoming Interviews */}
              <DashboardCard className="col-span-12 lg:col-span-4 flex flex-col text-left" hoverable={false}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-primary">Upcoming Today</h3>
                  <StatusBadge label="Live Now" type="error" variant="pill" className="animate-pulse" />
                </div>
                <div className="space-y-6 flex-grow">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <img
                        alt="Alex Chen"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/10"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQfLF8bCNOX8-bdfGA25V0Gp3uXrhge3ZXUfAUF0ML01iNy4MMrbJZ85wvacWM1RmAq_tsFg6CcMPDqYx4pJc5wadGGz9te4-3GUjFClIKe1vuMREcfaQe1MspepJOtwTlVxDibYH5XU1506AbDZzKbMXGPng5_kI6-e9W18GrvJddUlW1Iev4qDwhrwnbtQnwcTKA1BydRcE0NViO318jmkeQ2btxk_nxuy_5Fe88X9NEXaMFtW8s2qzAW3slblPUNdlqAVA4Iuk"
                      />
                      <div className="w-0.5 flex-grow bg-outline-variant/30 my-2"></div>
                    </div>
                    <div className="flex-grow pb-4">
                      <p className="text-[10px] font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">videocam</span>
                        10:00 AM <span className="text-on-surface-variant font-normal opacity-60">· Starts in 15m</span>
                      </p>
                      <h4 className="font-bold text-xs text-on-background mt-0.5">Technical Interview</h4>
                      <p className="text-[11px] text-on-surface-variant">Alex Chen · Software Engineer</p>
                      <div className="flex gap-2 mt-3">
                        <PrimaryButton onClick={() => setIsJoinMeetOpen(true)} className="flex-grow text-[10px] py-2 px-3">
                          Join Meet
                        </PrimaryButton>
                        <SecondaryButton onClick={() => showToast('Rescheduled. E-mails dispatched.', 'success')} className="text-[10px] py-2 px-2.5">
                          Reschedule
                        </SecondaryButton>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-left">
                    <img
                      alt="Maria G"
                      className="w-10 h-10 rounded-full object-cover grayscale opacity-70 ring-2 ring-primary/10 shrink-0"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4UlrLeW0xcrLEgDEO8WsJgcX1ly8rqhqb-ZabSv8868V8QInnVRwv2M9FRMG56qIGyGBvcfGGQZ9XIzV6BTpaWkgbg1_P76cOD_wkthXg1xTOfL-H-yt284swYYSVb5xEpYzBdjsnYa4_vPqqGwjg_BgLCZowp7ET6piOtZTVAYwSEL2glqSaHtKe99sRbH9MJEOcLVroB7__bTVUVRVbS7_qhDNy2HIBo_wZwbfGs26AjOR9UJLtHJ-i8xYOkpGjMQUXXN6Oqk"></img>
                    <div className="flex-grow">
                      <p className="text-[10px] font-bold text-on-surface-variant opacity-60">02:30 PM · In 4 hours</p>
                      <h4 className="font-bold text-xs text-on-background mt-0.5">Cultural Fit Interview</h4>
                      <p className="text-[11px] text-on-surface-variant">Maria G · Senior UX Designer</p>
                      <div className="flex gap-2 mt-3">
                        <button disabled className="flex-grow py-2 bg-surface-container-low text-on-surface-variant/40 rounded-lg text-[10px] font-bold cursor-not-allowed border border-outline-variant/10">
                          Join Later
                        </button>
                        <SecondaryButton onClick={() => showToast('Interview cancelled.', 'info')} className="hover:bg-error/10 hover:border-error/20 hover:text-error text-[10px] py-2 px-2.5">
                          Cancel
                        </SecondaryButton>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab('interviews'); }}
                  className="w-full mt-4 py-3 border border-dashed border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-center cursor-pointer"
                >
                  View Full Calendar
                </button>
              </DashboardCard>
            </BentoGrid>

            {/* Active Jobs Table */}
            <DataTable
              title="Active Job Postings"
              subtitle="Track and manage your published roles"
              columns={[
                { key: 'title', label: 'Job Title & Recruiter' },
                { key: 'department', label: 'Department' },
                { key: 'applicants', label: 'Applicants', align: 'center' },
                { key: 'avgMatch', label: 'Avg. Match', align: 'center' },
                { key: 'views', label: 'Views', align: 'center' },
                { key: 'posted', label: 'Posted / Remaining' },
                { key: 'status', label: 'Status' },
                { key: 'actions', label: 'Actions', align: 'right' }
              ]}
              headerActions={
                <>
                  <div className="bg-surface-container rounded-lg p-1 flex">
                    <button className="px-3 py-1 text-xs font-bold bg-white text-primary rounded-md shadow-sm cursor-pointer">Active ({jobs.filter(j => j.status === 'Published').length})</button>
                    <button className="px-3 py-1 text-xs font-bold text-on-surface-variant hover:text-primary cursor-pointer" onClick={() => showToast('Archived list is offline in preview.', 'info')}>Archived (12)</button>
                  </div>
                  <button
                    onClick={() => { setActiveTab('jobs'); }}
                    className="text-primary text-xs font-bold flex items-center gap-1.5 hover:bg-primary/5 px-4 py-2 rounded-full transition-all cursor-pointer"
                  >
                    View all {jobs.length} jobs <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </>
              }
            >
              {jobs.filter(j => j.status === 'Published').map(job => (
                <tr key={job.id} className="hover:bg-surface-container-low/25 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {job.recruiter === 'Sarah Jenkins' ? (
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8fmbPNnHwpWMvZM-T2CWemc-SutIEbVz9atkohzfjK2mywkEapmyc5xnvkFpItib9oV27Rk8xuwjHZM8weXGjQPyCsMU4n60Xl3h05YztHTsBr1-xOFJ2H1ZebRjN6biLoVtI4aTL6CD-fScV-GmkG4Wn4wKiGDuZocI-tHndOkhT53rvl6askVESS4fD3T8tFgWbaGihWr1G5nIIz-KoAkc-s1nl6e-vby-Wj-pF2RSBHwT2Xv1ADmLS8WKWF6sek7hIR6jsvWg" className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/10" alt="SJ" />
                      ) : job.recruiter === 'Mike Chang' ? (
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQfLF8bCNOX8-bdfGA25V0Gp3uXrhge3ZXUfAUF0ML01iNy4MMrbJZ85wvacWM1RmAq_tsFg6CcMPDqYx4pJc5wadGGz9te4-3GUjFClIKe1vuMREcfaQe1MspepJOtwTlVxDibYH5XU1506AbDZzKbMXGPng5_kI6-e9W18GrvJddUlW1Iev4qDwhrwnbtQnwcTKA1BydRcE0NViO318jmkeQ2btxk_nxuy_5Fe88X9NEXaMFtW8s2qzAW3slblPUNdlqAVA4Iuk" className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/10" alt="MC" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                          {job.recruiter.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-primary group-hover:translate-x-1 transition-transform">{job.title}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">Lead: <span className="text-primary/70">{job.recruiter}</span></p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="px-3 py-1 bg-secondary-container/40 text-on-secondary-container rounded-lg text-xs font-bold">{job.department}</span>
                  </td>
                  <td className="px-4 py-5 text-center font-bold text-xs text-on-background">{job.applicants}</td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-primary font-extrabold text-xs">{job.avgMatch}%</span>
                      <div className="w-16 h-1 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${job.avgMatch}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center text-on-surface-variant font-medium text-xs">{job.views || 1840}</td>
                  <td className="px-4 py-5">
                    <p className="text-xs font-bold text-on-background">{job.postedDate}</p>
                    <p className="text-[10px] text-error font-bold italic">{job.daysLeft} days left</p>
                  </td>
                  <td className="px-4 py-5">
                    <span className="flex items-center gap-1.5 text-[11px] text-primary font-bold bg-primary/5 px-3 py-1 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Published
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-white rounded-lg transition-all cursor-pointer" title="View Pipeline" onClick={() => { setSelectedDetailedCandidate(candidates[0]); setActiveTab('candidates'); }}><span className="material-symbols-outlined text-lg">visibility</span></button>
                      <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-white rounded-lg transition-all cursor-pointer" title="Edit Job" onClick={() => showToast('Editing is disabled in preview mode.', 'info')}><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-white rounded-lg transition-all cursor-pointer" title="Duplicate" onClick={() => showToast(`Duplicating listing: ${job.title}`, 'success')}><span className="material-symbols-outlined text-lg">content_copy</span></button>
                      <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-all cursor-pointer" title="Pause" onClick={() => showToast(`Listing paused.`, 'info')}><span className="material-symbols-outlined text-lg">pause_circle</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>

            {/* Bottom Row */}
            <BentoGrid>
              {/* Top Matched Candidates */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-primary text-left">Top Matched Candidates</h3>
                  <button
                    onClick={() => setActiveTab('candidates')}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    View Pipeline
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {candidates.map(cand => (
                    <CandidateCard
                      key={cand.id}
                      candidate={cand}
                      onClick={() => { setSelectedDetailedCandidate(cand); setActiveTab('candidate-details'); }}
                      onMessageClick={() => handleOpenMessage(cand)}
                      onResumeClick={() => handleOpenResume(cand)}
                    />
                  ))}
                </div>
              </div>

              {/* AI Insights & Talent Audit */}
              <div className="col-span-12 lg:col-span-4 bg-primary text-white p-6 rounded-3xl relative overflow-hidden group shadow-sm flex flex-col text-left">
                <div className="absolute -top-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                </div>
                <div className="relative z-10 flex flex-col h-full flex-grow">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="material-symbols-outlined text-primary-fixed">auto_awesome</span>
                    <h3 className="text-lg font-bold">Talent Insights</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {[
                      { label: 'AI Confidence', val: '94%' },
                      { label: 'Alignment', val: 'High' }
                    ].map(stat => (
                      <div key={stat.label} className="px-3 py-1 bg-white/10 rounded-lg border border-white/10 flex-1 min-w-[70px] text-center">
                        <p className="text-[8px] uppercase tracking-wider opacity-70">{stat.label}</p>
                        <p className="text-xs font-bold">{stat.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4 flex-grow">
                    <AIInsightCard
                      priority="High"
                      confidence="96%"
                      title="Hiring Match"
                      reason="Stanford design candidates show 45% higher retention in similar roles. Sourcing here is highly recommended."
                      buttonText="Adjust Sourcing Strategy"
                      onButtonClick={() => showToast('Sourcing strategy targets aligned.', 'success')}
                    />
                    <AIInsightCard
                      priority="Medium"
                      confidence="88%"
                      title="AWS Skill Gap"
                      reason="Current applicant pool for Frontend Lead is missing AWS infrastructure expertise. Consider listing this as a requirement."
                      buttonText="Update Job Profile"
                      onButtonClick={() => showToast('Skill requirements updated.', 'success')}
                    />
                  </div>
                  <PrimaryButton
                    leftIcon={<span className="material-symbols-outlined text-base">description</span>}
                    onClick={triggerAudit}
                    className="mt-6 w-full py-3 bg-white text-primary hover:bg-white/95"
                  >
                    Generate Talent Audit
                  </PrimaryButton>
                </div>
              </div>
            </BentoGrid>

            {/* Third Row: Charts & Distribution */}
            <BentoGrid>
              {/* Applications per Week Line Chart */}
              <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-3xl border border-primary/5 shadow-sm text-left">
                <div className="flex justify-between items-start mb-8 text-left">
                  <div>
                    <h3 className="text-sm font-bold text-primary">Applications per Week</h3>
                    <p className="text-[11px] text-on-surface-variant font-medium">Weekly volume for primary departments</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                      <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                      <span className="text-[11px] font-bold text-on-surface-variant">Engineering</span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                      <span className="w-2.5 h-2.5 rounded-sm bg-secondary"></span>
                      <span className="text-[11px] font-bold text-on-surface-variant">Design</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-64 flex flex-col relative group/chart">
                  {/* Y-Axis Labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-bold text-on-surface-variant/40 -translate-x-full pr-4 pb-8">
                    <span className="">500</span>
                    <span className="">250</span>
                    <span className="">0</span>
                  </div>
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
                    <div className="border-t border-surface-container border-dashed w-full h-0"></div>
                    <div className="border-t border-surface-container border-dashed w-full h-0"></div>
                    <div className="border-t border-outline-variant w-full h-0"></div>
                  </div>
                  
                  {/* Line Chart Rendering */}
                  <div className="flex-1 relative mb-8">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                      {/* Engineering Line */}
                      <path className="transition-all duration-1000" d="M0 80 L 100 60 L 200 70 L 300 20 L 400 30" fill="none" stroke="#023629" strokeLinecap="round" strokeWidth="3"></path>
                      <circle className="hover:r-6 cursor-crosshair transition-all" cx="0" cy="80" fill="#023629" r="4"></circle>
                      <circle className="hover:r-6 cursor-crosshair transition-all" cx="100" cy="60" fill="#023629" r="4"></circle>
                      <circle className="hover:r-6 cursor-crosshair transition-all" cx="200" cy="70" fill="#023629" r="4"></circle>
                      <circle className="hover:r-6 cursor-crosshair transition-all" cx="300" cy="20" fill="#023629" r="4"></circle>
                      <circle className="hover:r-6 cursor-crosshair transition-all" cx="400" cy="30" fill="#023629" r="4"></circle>
                      
                      {/* Design Line */}
                      <path className="opacity-60 transition-all duration-1000" d="M0 90 L 100 80 L 200 75 L 300 50 L 400 60" fill="none" stroke="#655e4c" strokeDasharray="4" strokeLinecap="round" strokeWidth="2"></path>
                      <circle className="opacity-60 hover:r-5 cursor-crosshair transition-all" cx="0" cy="90" fill="#655e4c" r="3"></circle>
                      <circle className="opacity-60 hover:r-5 cursor-crosshair transition-all" cx="100" cy="80" fill="#655e4c" r="3"></circle>
                      <circle className="opacity-60 hover:r-5 cursor-crosshair transition-all" cx="200" cy="75" fill="#655e4c" r="3"></circle>
                      <circle className="opacity-60 hover:r-5 cursor-crosshair transition-all" cx="300" cy="50" fill="#655e4c" r="3"></circle>
                      <circle className="opacity-60 hover:r-5 cursor-crosshair transition-all" cx="400" cy="60" fill="#655e4c" r="3"></circle>
                    </svg>
                    
                    {/* Tooltip Mock */}
                    <div className="absolute top-2 left-[300px] bg-primary text-on-primary px-2.5 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover/chart:opacity-100 transition-opacity">
                      Week 4: 480 Apps
                    </div>
                  </div>
                  
                  {/* X-Axis Labels */}
                  <div className="flex justify-between px-2 text-[10px] font-extrabold uppercase tracking-wider text-on-surface">
                    <span className="">Week 1</span>
                    <span className="">Week 2</span>
                    <span className="">Week 3</span>
                    <span className="">Week 4</span>
                    <span className="">Week 5</span>
                  </div>
                </div>
              </div>

              {/* University Distribution Donut Chart */}
              <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-3xl border border-primary/5 shadow-sm flex flex-col text-left">
                <h3 className="text-sm font-bold text-primary mb-1">University Distribution</h3>
                <p className="text-[11px] text-on-surface-variant font-medium mb-6">Top candidate source locations</p>
                
                <div className="flex-grow flex flex-col justify-center">
                  <div className="flex items-center justify-center relative py-4 group/donut">
                    <svg className="w-44 h-44 transform -rotate-90">
                      <circle cx="88" cy="88" fill="transparent" r="66" stroke="#f3f4f1" strokeWidth="16"></circle>
                      <circle className="hover:stroke-[20px] transition-all cursor-pointer" cx="88" cy="88" fill="transparent" r="66" stroke="#023629" strokeDasharray="200 415" strokeLinecap="round" strokeWidth="18"></circle>
                      <circle className="hover:stroke-[20px] transition-all cursor-pointer" cx="88" cy="88" fill="transparent" r="66" stroke="#655e4c" strokeDasharray="100 415" strokeDashoffset="-205" strokeLinecap="round" strokeWidth="18"></circle>
                      <circle className="hover:stroke-[20px] transition-all cursor-pointer" cx="88" cy="88" fill="transparent" r="66" stroke="#a1d1be" strokeDasharray="65 415" strokeDashoffset="-310" strokeLinecap="round" strokeWidth="18"></circle>
                    </svg>
                    <div className="absolute flex flex-col items-center group-hover/donut:scale-110 transition-transform">
                      <span className="text-xl font-extrabold text-primary">1,240</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant">Total Applicants</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2 text-xs font-semibold text-on-surface">
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container transition-all group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                        <span>Stanford University</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-primary block">45%</span>
                        <span className="text-[9px] text-on-surface-variant font-medium">558 Students</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container transition-all group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-sm bg-secondary"></span>
                        <span>MIT</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-primary block">25%</span>
                        <span className="text-[9px] text-on-surface-variant font-medium">310 Students</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container transition-all group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#a1d1be]"></span>
                        <span>UC Berkeley</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-primary block">15%</span>
                        <span className="text-[9px] text-on-surface-variant font-medium">186 Students</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </BentoGrid>

            {/* Fourth Row: Team Activity Feed */}
            <div className="bg-white p-6 rounded-3xl border border-primary/5 shadow-sm text-left">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-primary">Team Activity Feed</h3>
                  <p className="text-[11px] text-on-surface-variant font-medium">Recent events from your recruitment workspace</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => showToast('Activity Feed is offline in preview.', 'info')} 
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5 px-4 py-2 rounded-full transition-all cursor-pointer border border-primary/10"
                >
                  View All Activity
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Activity 1 */}
                <div className="flex gap-3 hover:bg-surface-container-low p-2 rounded-2xl transition-all cursor-pointer group">
                  <img 
                    alt="SJ" 
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/10 shrink-0" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8fmbPNnHwpWMvZM-T2CWemc-SutIEbVz9atkohzfjK2mywkEapmyc5xnvkFpItib9oV27Rk8xuwjHZM8weXGjQPyCsMU4n60Xl3h05YztHTsBr1-xOFJ2H1ZebRjN6biLoVtI4aTL6CD-fScV-GmkG4Wn4wKiGDuZocI-tHndOkhT53rvl6askVESS4fD3T8tFgWbaGihWr1G5nIIz-KoAkc-s1nl6e-vby-Wj-pF2RSBHwT2Xv1ADmLS8WKWF6sek7hIR6jsvWg" 
                  />
                  <div className="text-xs">
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> 10 mins ago
                    </p>
                    <p className="text-primary font-bold leading-snug">Sarah Jenkins <span className="font-normal text-on-surface-variant">reviewed</span> Elena Rodriguez</p>
                    <p className="text-[9px] text-primary font-bold mt-1 bg-primary/5 px-2 py-0.5 rounded-md w-fit uppercase tracking-wider border border-primary/10">Shortlisted Candidate</p>
                  </div>
                </div>
                
                {/* Activity 2 */}
                <div className="flex gap-3 hover:bg-surface-container-low p-2 rounded-2xl transition-all cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0 border border-secondary/10">
                    <span className="material-symbols-outlined text-base">event_available</span>
                  </div>
                  <div className="text-xs">
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">2 hours ago</p>
                    <p className="text-primary font-bold leading-snug">System <span className="font-normal text-on-surface-variant">scheduled interview with</span> Alex Chen</p>
                    <p className="text-[9px] text-secondary font-bold mt-1 uppercase tracking-wider">Technical Round • 10:00 AM</p>
                  </div>
                </div>

                {/* Activity 3 */}
                <div className="flex gap-3 hover:bg-surface-container-low p-2 rounded-2xl transition-all cursor-pointer group">
                  <img 
                    alt="MC" 
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/10 shrink-0" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQfLF8bCNOX8-bdfGA25V0Gp3uXrhge3ZXUfAUF0ML01iNy4MMrbJZ85wvacWM1RmAq_tsFg6CcMPDqYx4pJc5wadGGz9te4-3GUjFClIKe1vuMREcfaQe1MspepJOtwTlVxDibYH5XU1506AbDZzKbMXGPng5_kI6-e9W18GrvJddUlW1Iev4qDwhrwnbtQnwcTKA1BydRcE0NViO318jmkeQ2btxk_nxuy_5Fe88X9NEXaMFtW8s2qzAW3slblPUNdlqAVA4Iuk" 
                  />
                  <div className="text-xs">
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">4 hours ago</p>
                    <p className="text-primary font-bold leading-snug">Mike Chang <span className="font-normal text-on-surface-variant">updated job status for</span> Frontend Lead</p>
                    <p className="text-[9px] text-on-surface-variant font-bold mt-1 uppercase tracking-wider">Status: Active Sourcing</p>
                  </div>
                </div>

                {/* Activity 4 */}
                <div className="flex gap-3 hover:bg-surface-container-low p-2 rounded-2xl transition-all cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center text-error shrink-0 border border-error/10">
                    <span className="material-symbols-outlined text-base">mail</span>
                  </div>
                  <div className="text-xs">
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">6 hours ago</p>
                    <p className="text-primary font-bold leading-snug">Job Offer <span className="font-normal text-on-surface-variant">sent to</span> Jordan Smith</p>
                    <p className="text-[9px] text-error font-bold mt-1 uppercase tracking-wider">Awaiting candidate e-sign</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6 text-left animate-slide-up">
            {/* Page Title & Header Actions */}
            <SectionHeader
              title="Jobs Management"
              subtitle="Manage, monitor, publish, and optimize all job postings across your organization."
              actions={
                <div className="flex flex-wrap gap-2.5">
                  <SecondaryButton
                    leftIcon={<span className="material-symbols-outlined text-sm">file_upload</span>}
                    onClick={() => showToast('Import feature is offline in preview.', 'info')}
                  >
                    Import Jobs
                  </SecondaryButton>
                  <SecondaryButton
                    leftIcon={<span className="material-symbols-outlined text-sm">file_download</span>}
                    onClick={() => showToast('Export feature is offline in preview.', 'info')}
                  >
                    Export Jobs
                  </SecondaryButton>
                  <PrimaryButton
                    leftIcon={<span className="material-symbols-outlined text-sm">layers</span>}
                    onClick={() => showToast('Select items to perform bulk actions.', 'info')}
                    className="bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90"
                  >
                    Bulk Actions
                  </PrimaryButton>
                </div>
              }
            />

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
              {[
                { label: 'Total Jobs', value: '42', change: '+4%', isPositive: true },
                { label: 'Published', value: '28', hasProgress: true, progressPercent: 65 },
                { label: 'Draft', value: '06', change: '—', isNeutral: true },
                { label: 'Closed', value: '08', change: '-12%', isPositive: false },
                { label: 'Archived', value: '112', change: '—', isNeutral: true },
                { label: 'Applicants', value: '1.2k', change: '+22%', isPositive: true },
                { label: 'AI Match', value: '82%', hasIcon: true, icon: 'auto_awesome' },
                { label: 'Avg Time', value: '14d', change: '-2d', isPositive: true }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm bento-card flex flex-col justify-between">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">{kpi.label}</p>
                  <div className="flex items-end justify-between">
                    <h4 className="text-xl font-extrabold text-primary">{kpi.value}</h4>
                    {kpi.hasProgress && (
                      <div className="w-12 h-3.5 bg-primary/10 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-primary" style={{ width: `${kpi.progressPercent}%` }}></div>
                      </div>
                    )}
                    {kpi.change && (
                      <span className={`text-[10px] font-extrabold ${
                        kpi.isNeutral ? 'text-on-surface-variant/40' : kpi.isPositive ? 'text-primary' : 'text-error'
                      }`}>
                        {kpi.change}
                      </span>
                    )}
                    {kpi.hasIcon && (
                      <span className="material-symbols-outlined text-secondary text-sm mb-0.5">{kpi.icon}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <BentoGrid>
              {/* Left Column (4 columns) - Insights */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-primary/5 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-6">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Applications Trend</h5>
                    <button type="button" className="text-[10px] text-on-surface-variant flex items-center gap-1 font-bold">
                      Last 30 Days <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </button>
                  </div>
                  <div className="h-44 flex items-end gap-2 px-2">
                    <div className="flex-1 bg-primary/5 rounded-t-lg h-[30%] hover:bg-primary/20 transition-all cursor-pointer"></div>
                    <div className="flex-1 bg-primary/5 rounded-t-lg h-[45%] hover:bg-primary/20 transition-all cursor-pointer"></div>
                    <div className="flex-1 bg-primary/10 rounded-t-lg h-[60%] hover:bg-primary/20 transition-all cursor-pointer"></div>
                    <div className="flex-1 bg-primary/20 rounded-t-lg h-[55%] hover:bg-primary/20 transition-all cursor-pointer"></div>
                    <div className="flex-1 bg-primary/40 rounded-t-lg h-[80%] hover:bg-primary/20 transition-all cursor-pointer"></div>
                    <div className="flex-1 bg-primary rounded-t-lg h-[95%] hover:bg-primary/80 transition-all cursor-pointer"></div>
                    <div className="flex-1 bg-primary/60 rounded-t-lg h-[70%] hover:bg-primary/20 transition-all cursor-pointer"></div>
                  </div>
                  <div className="flex justify-between mt-4 px-2 text-[9px] text-on-surface-variant/50 uppercase font-extrabold tracking-widest">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2 text-primary">
                    <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest">AI Recruitment Insights</h5>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-secondary/10 relative overflow-hidden group shadow-sm text-left">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-secondary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 pointer-events-none"></div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-on-surface-variant mb-2">Suggested Salary Range</p>
                    <p className="text-lg font-extrabold text-primary">$145k - $170k</p>
                    <p className="text-[10px] text-on-surface-variant/70 mt-2 font-medium">Based on 14 competitors in the San Francisco area.</p>
                  </div>
                  <div className="bg-tertiary-fixed p-6 rounded-3xl border border-primary/5 relative overflow-hidden shadow-sm text-left text-on-tertiary-fixed">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-on-tertiary-fixed mb-2">Market Competition</p>
                    <div className="flex items-center gap-4">
                      <h4 className="text-lg font-extrabold text-on-tertiary-fixed">High</h4>
                      <div className="flex-1 h-2 bg-on-tertiary-fixed/10 rounded-full overflow-hidden">
                        <div className="h-full bg-on-tertiary-fixed rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <p className="text-[10px] text-on-tertiary-fixed-variant mt-2 font-semibold">Active roles for 'Product Designer' increased by 18%.</p>
                  </div>
                </div>
              </div>

              {/* Right Column (8 columns) - Job List Table */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-primary/5 shadow-sm flex flex-wrap items-center gap-3">
                  <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface-variant font-bold cursor-pointer">
                    Department: All <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                  <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface-variant font-bold cursor-pointer">
                    Location: Remote <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                  <div className="h-6 w-[1px] bg-outline-variant/30 mx-2"></div>
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold cursor-pointer uppercase tracking-wider">Published</span>
                    <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold cursor-pointer hover:bg-surface-container-highest transition-colors uppercase tracking-wider">Draft</span>
                    <span className="px-4 py-1.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold cursor-pointer hover:bg-error/10 transition-colors uppercase tracking-wider">Urgent</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-primary/5 overflow-hidden shadow-sm">
                  <DataTable
                    columns={[
                      { key: 'title', label: 'Title & Dept' },
                      { key: 'recruiter', label: 'Recruiter' },
                      { key: 'applicants', label: 'Applicants' },
                      { key: 'score', label: 'AI Match' },
                      { key: 'status', label: 'Status' },
                      { key: 'actions', label: '' }
                    ]}
                  >
                    {jobs.map(job => (
                      <tr 
                        key={job.id} 
                        onClick={() => { setSelectedDrawerJob(job); setIsJobDrawerOpen(true); }}
                        className="hover:bg-surface-container-low/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-5">
                          <div className="font-bold text-primary text-sm">{job.title}</div>
                          <div className="text-[11px] text-on-surface-variant font-semibold opacity-75">{job.department} • {job.location || 'Remote'}</div>
                        </td>
                        <td className="px-4 py-5 text-xs font-semibold text-on-surface-variant">{job.recruiter}</td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary text-sm">{job.applicants}</span>
                            {job.newApplicants !== undefined && job.newApplicants > 0 && (
                              <span className="text-[9px] text-on-surface-variant/60 uppercase font-extrabold">{job.newApplicants} New</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-1 text-primary">
                            <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            <span className="font-extrabold text-xs">{job.avgMatch}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <StatusBadge label={job.status} variant="pill" />
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); showToast(`More actions for ${job.title}`, 'info'); }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-container-high cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-on-surface-variant text-base">more_vert</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>

                  <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant border-t border-primary/5">
                    <p>Showing 1-{jobs.length} of {jobs.length} jobs</p>
                    <div className="flex gap-2">
                      <button type="button" className="px-4 py-1.5 rounded-lg border border-outline-variant/40 bg-white disabled:opacity-50 hover:bg-surface-container transition-all cursor-pointer">Previous</button>
                      <button type="button" className="px-4 py-1.5 rounded-lg border border-outline-variant/40 bg-white hover:bg-surface-container transition-all cursor-pointer">Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </BentoGrid>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="space-y-6 text-left animate-slide-up">
            <SectionHeader
              title="Applicants Pipeline"
              subtitle="Review score, schedule screens, or text candidates directly"
            />

            <DataTable
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'university', label: 'University & Location' },
                { key: 'skills', label: 'Skills Highlight' },
                { key: 'score', label: 'ATS Rating', align: 'center' },
                { key: 'status', label: 'Status' },
                { key: 'actions', label: 'Actions', align: 'right' }
              ]}
              headerActions={
                <input
                  type="text"
                  placeholder="Search candidate pipeline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none max-w-sm w-full text-on-background bg-white"
                />
              }
            >
              {filteredCandidates.map(cand => (
                <tr 
                  key={cand.id} 
                  onClick={() => { setSelectedDetailedCandidate(cand); setActiveTab('candidate-details'); }}
                  className="hover:bg-surface-container-low/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-5 flex items-center gap-3">
                    <img alt={cand.name} className="w-10 h-10 rounded-full object-cover" src={cand.avatar} />
                    <div>
                      <p className="font-bold text-sm text-primary">{cand.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-semibold">Applied: {cand.appliedDate}</p>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-xs font-bold text-on-background">{cand.university}</p>
                    <p className="text-[10px] text-on-surface-variant">{cand.location}</p>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {cand.skills.map((skill: string) => (
                        <StatusBadge key={skill} label={skill} variant="default" />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center font-bold text-xs text-primary">{cand.score}/10</td>
                  <td className="px-4 py-5">
                    <StatusBadge label={cand.status} variant="pill" />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <PrimaryButton
                        onClick={(e) => { e.stopPropagation(); handleOpenMessage(cand); }}
                        className="py-1.5 px-3"
                      >
                        Message
                      </PrimaryButton>
                      <SecondaryButton
                        onClick={(e) => { e.stopPropagation(); handleOpenResume(cand); }}
                        className="py-1.5 px-3"
                      >
                        Resume
                      </SecondaryButton>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="space-y-6 text-left animate-slide-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-primary">Interview Management</h2>
                <p className="font-body-md text-on-surface-variant mt-1">Schedule, manage, evaluate, and track every interview across your recruitment pipeline.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => showToast('Exporting interview schedule...', 'success')}
                  className="px-4 py-2.5 border border-outline-variant/30 text-primary font-label-md rounded-xl flex items-center gap-2 bg-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">file_download</span>
                  Export Schedule
                </button>
                <button 
                  onClick={() => showToast('Bulk actions are offline in preview.', 'info')}
                  className="px-4 py-2.5 border border-outline-variant/30 text-primary font-label-md rounded-xl flex items-center gap-2 bg-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">layers</span>
                  Bulk Actions
                </button>
                <button 
                  onClick={() => { setIsJoinMeetOpen(true); showToast('Opening scheduling dialog...', 'info'); }}
                  className="px-6 py-2.5 bg-primary text-white font-label-md rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  Schedule Interview
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
              {/* KPI 1: Total Interviews */}
              <div className="bg-surface p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 text-left">
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[10px]">Total Interviews</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-headline-md text-headline-md text-primary font-extrabold">1,284</span>
                  <span className="text-[12px] text-green-600 font-bold">+12%</span>
                </div>
                <div className="h-12 w-full mt-4 flex items-end gap-1">
                  <div className="flex-1 bg-primary/10 h-[40%] rounded-sm"></div>
                  <div className="flex-1 bg-primary/10 h-[60%] rounded-sm"></div>
                  <div className="flex-1 bg-primary/10 h-[50%] rounded-sm"></div>
                  <div className="flex-1 bg-primary/10 h-[90%] rounded-sm"></div>
                  <div className="flex-1 bg-primary h-[80%] rounded-sm"></div>
                </div>
              </div>

              {/* KPI 2: Today's Schedule */}
              <div className="bg-surface p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 text-left">
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[10px]">Today's Schedule</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-headline-md text-headline-md text-primary font-extrabold">18</span>
                  <span className="text-[12px] text-on-surface-variant font-medium">8 remaining</span>
                </div>
                <div className="mt-6 flex -space-x-2">
                  <img className="w-8 h-8 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTStjOAyWjYjq-Opi1jjeBlC2KWKIRfeIOi1aImuxrb24LffGdzmkCeqTP2hoV2U7b8DxHjW4xqOa8RHIKi9yAAyUI_qAJHBkswbxoypJ5flHel7ImyvkfW0lUvFRpzkbP8RPI3IGpAQH4LAikFQFTfPeY5LMZJMc2uuoULbGgwXBFOILeEwayWNaunxEP3CV1dOKxoIqbtgakus9hqqU6tsYnhdOebRWDcH2KRHle1vm8EcqJwxN5HGPWBSKbujMSSXXPegB0ylY" alt="Sophia" />
                  <img className="w-8 h-8 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoYhd5YniuqYMLwIc5TCxBWW-1RaX2sFXceTkay8ME8086DmK4GYN3Wc3Y_WYvmsChb1AK-q5EeCvo75zDLnnF0gyZqCyZNanVSwUhCF1ZGeQbNYU03S-2fnq4xN7J1b0KbV3RfKznvnIGJn_7sThbe0j1xbGDDo-nW3gQjeN_-UqROp9raBiFRIbWfggX1rxPX2iBms2UFepcRSr6E13Mc0OI6HOhm8btBJ4FMFzpIB3rUnrbp9Gp2LZKUJ9kKsAVMgieE8bl-Yw" alt="Elena" />
                  <img className="w-8 h-8 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxXLiynP_BrrBQHNayCqVK7wwXCDS3gma78Zyvdo4ym3alubFmSsSrH-l4z6LtdyVn4X1vb40Xej5OkTvMAlN1FPyJZ_O34TrJp0q-nxHXqvWAcoN6rFfnbf3mtq22Ig5Mmqwi2PvI3tT8Vvild-AeLjAFEKxJ3Dp3-x2AevCVtpJJyx3RBsmK3IRZLs8SrpY_npNK-nwnAkatVuo8s4pmmFuClG8sa1jPUdI5tem_mGI4z67CzmJM6h4M1By3rAmRDHo0PYZgY9M" alt="David" />
                  <div className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center bg-primary text-[10px] text-white font-extrabold">+15</div>
                </div>
              </div>

              {/* KPI 3: Upcoming (7d) */}
              <div className="bg-surface p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 text-left">
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[10px]">Upcoming (7d)</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-headline-md text-headline-md text-primary font-extrabold">142</span>
                </div>
                <div className="mt-6 w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[64%]"></div>
                </div>
                <p className="text-[11px] mt-2 text-on-surface-variant font-semibold">64% slot utilization</p>
              </div>

              {/* KPI 4: Avg. Candidate Score */}
              <div className="bg-surface p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 text-left">
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[10px]">Avg. Candidate Score</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-headline-md text-headline-md text-primary font-extrabold">4.2</span>
                  <span className="text-primary flex items-center"><span className="material-symbols-outlined text-[16px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span></span>
                </div>
                <div className="flex gap-1.5 mt-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-outline-variant/30"></div>
                </div>
              </div>

              {/* KPI 5: Offer Conversion */}
              <div className="bg-surface p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 text-left">
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[10px]">Offer Conversion</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-headline-md text-headline-md text-primary font-extrabold">28%</span>
                  <span className="text-[12px] text-error font-bold">-2.4%</span>
                </div>
                <svg className="w-full h-8 mt-5 overflow-visible" viewBox="0 0 100 20">
                  <path d="M0,15 L20,12 L40,18 L60,10 L80,14 L100,8" fill="none" stroke="#ba1a1a" strokeWidth="2"></path>
                </svg>
              </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Left Column */}
              <div className="col-span-12 xl:col-span-8 space-y-8">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-outline-variant/20 gap-4 text-left">
                    <div className="flex bg-surface-container-low p-1 rounded-xl">
                      <button 
                        onClick={() => setInterviewViewMode('table')}
                        className={`px-6 py-2.5 rounded-lg font-label-md transition-all cursor-pointer ${interviewViewMode === 'table' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-primary'}`}
                      >
                        Table View
                      </button>
                      <button 
                        onClick={() => setInterviewViewMode('calendar')}
                        className={`px-6 py-2.5 rounded-lg font-label-md transition-all cursor-pointer ${interviewViewMode === 'calendar' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-primary'}`}
                      >
                        Calendar
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <select 
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="bg-transparent border-none font-label-md text-on-surface-variant focus:ring-0 cursor-pointer pr-8 font-bold"
                      >
                        <option value="All Statuses">All Statuses</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button 
                        onClick={() => showToast('Filters reset.', 'info')}
                        className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer"
                      >
                        filter_list
                      </button>
                    </div>
                  </div>

                  {interviewViewMode === 'table' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container-lowest/50 border-b border-outline-variant/10">
                          <tr>
                            <th className="px-6 py-4 font-label-md text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">Candidate</th>
                            <th className="px-6 py-4 font-label-md text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">Applied Job</th>
                            <th className="px-6 py-4 font-label-md text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">Interviewer</th>
                            <th className="px-6 py-4 font-label-md text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">Date/Time</th>
                            <th className="px-6 py-4 font-label-md text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">Platform</th>
                            <th className="px-6 py-4 font-label-md text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 font-label-md text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {/* Row 1: Sophia Martinez */}
                          {(selectedStatusFilter === 'All Statuses' || selectedStatusFilter === 'Scheduled') && (
                            <tr 
                              onClick={() => setSpotlitCandidate({
                                name: 'Sophia Martinez',
                                role: 'Senior UX Designer',
                                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTStjOAyWjYjq-Opi1jjeBlC2KWKIRfeIOi1aImuxrb24LffGdzmkCeqTP2hoV2U7b8DxHjW4xqOa8RHIKi9yAAyUI_qAJHBkswbxoypJ5flHel7ImyvkfW0lUvFRpzkbP8RPI3IGpAQH4LAikFQFTfPeY5LMZJMc2uuoULbGgwXBFOILeEwayWNaunxEP3CV1dOKxoIqbtgakus9hqqU6tsYnhdOebRWDcH2KRHle1vm8EcqJwxN5HGPWBSKbujMSSXXPegB0ylY',
                                summary: '10+ years designing intuitive consumer products. Specialized in mobile applications, interactive patterns, and unified cross-platform design systems.',
                                agenda: ['Technical Design Review (30m)', 'Behavioral Alignment (15m)', 'Q&A & Next Steps (15m)']
                              })}
                              className="hover:bg-surface-container-low/30 transition-colors cursor-pointer group"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <img className="h-9 w-9 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTStjOAyWjYjq-Opi1jjeBlC2KWKIRfeIOi1aImuxrb24LffGdzmkCeqTP2hoV2U7b8DxHjW4xqOa8RHIKi9yAAyUI_qAJHBkswbxoypJ5flHel7ImyvkfW0lUvFRpzkbP8RPI3IGpAQH4LAikFQFTfPeY5LMZJMc2uuoULbGgwXBFOILeEwayWNaunxEP3CV1dOKxoIqbtgakus9hqqU6tsYnhdOebRWDcH2KRHle1vm8EcqJwxN5HGPWBSKbujMSSXXPegB0ylY" alt="Sophia Martinez" />
                                  <div>
                                    <p className="font-label-md text-on-surface font-bold">Sophia Martinez</p>
                                    <p className="text-[11px] text-on-surface-variant font-medium">#INT-2941</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-body-md text-on-surface font-semibold text-xs">Senior UX Designer</p>
                                <p className="text-[11px] text-on-surface-variant font-medium">Product Team</p>
                              </td>
                              <td className="px-6 py-4 text-on-surface-variant font-body-md text-xs font-semibold">Marcus Chen</td>
                              <td className="px-6 py-4">
                                <p className="font-body-md text-on-surface font-semibold text-xs">Oct 24, 2023</p>
                                <p className="text-[11px] text-primary font-bold">10:00 AM - 11:00 AM</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="flex items-center gap-1.5 font-label-md text-on-surface-variant text-xs font-bold">
                                  <span className="w-2 h-2 rounded-full bg-[#4285F4]"></span> Google Meet
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-[10px] font-bold uppercase tracking-wider">Scheduled</span>
                              </td>
                              <td className="px-6 py-4">
                                <button onClick={(e) => { e.stopPropagation(); showToast('Menu options expanded.', 'info'); }} className="material-symbols-outlined text-on-surface-variant group-hover:text-primary cursor-pointer">more_vert</button>
                              </td>
                            </tr>
                          )}

                          {/* Row 2: David Wilson */}
                          {(selectedStatusFilter === 'All Statuses' || selectedStatusFilter === 'Completed') && (
                            <tr 
                              onClick={() => setSpotlitCandidate({
                                name: 'David Wilson',
                                role: 'Lead Data Engineer',
                                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxXLiynP_BrrBQHNayCqVK7wwXCDS3gma78Zyvdo4ym3alubFmSsSrH-l4z6LtdyVn4X1vb40Xej5OkTvMAlN1FPyJZ_O34TrJp0q-nxHXqvWAcoN6rFfnbf3mtq22Ig5Mmqwi2PvI3tT8Vvild-AeLjAFEKxJ3Dp3-x2AevCVtpJJyx3RBsmK3IRZLs8SrpY_npNK-nwnAkatVuo8s4pmmFuClG8sa1jPUdI5tem_mGI4z67CzmJM6h4M1By3rAmRDHo0PYZgY9M',
                                summary: 'Senior Infrastructure specialist with 8 years of experience. Expert in real-time pipelines, Big Data ecosystems, Apache Kafka, and PySpark.',
                                agenda: ['Kafka Pipeline Design (30m)', 'Behavioral Assessment (15m)', 'Q&A (15m)']
                              })}
                              className="hover:bg-surface-container-low/30 transition-colors cursor-pointer group"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <img className="h-9 w-9 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxXLiynP_BrrBQHNayCqVK7wwXCDS3gma78Zyvdo4ym3alubFmSsSrH-l4z6LtdyVn4X1vb40Xej5OkTvMAlN1FPyJZ_O34TrJp0q-nxHXqvWAcoN6rFfnbf3mtq22Ig5Mmqwi2PvI3tT8Vvild-AeLjAFEKxJ3Dp3-x2AevCVtpJJyx3RBsmK3IRZLs8SrpY_npNK-nwnAkatVuo8s4pmmFuClG8sa1jPUdI5tem_mGI4z67CzmJM6h4M1By3rAmRDHo0PYZgY9M" alt="David Wilson" />
                                  <div>
                                    <p className="font-label-md text-on-surface font-bold">David Wilson</p>
                                    <p className="text-[11px] text-on-surface-variant font-medium">#INT-2940</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-body-md text-on-surface font-semibold text-xs">Lead Data Engineer</p>
                                <p className="text-[11px] text-on-surface-variant font-medium">Infrastructure</p>
                              </td>
                              <td className="px-6 py-4 text-on-surface-variant font-body-md text-xs font-semibold">Sarah Jenkins</td>
                              <td className="px-6 py-4">
                                <p className="font-body-md text-on-surface font-semibold text-xs">Oct 23, 2023</p>
                                <p className="text-[11px] text-on-surface-variant font-bold">Yesterday</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="flex items-center gap-1.5 font-label-md text-on-surface-variant text-xs font-bold">
                                  <span className="w-2 h-2 rounded-full bg-[#2D8CFF]"></span> Zoom
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant rounded-full text-[10px] font-bold uppercase tracking-wider">Completed</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1 font-bold text-xs text-primary">
                                  <span>4.8</span>
                                  <span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Row 3: Elena Rodriguez */}
                          {(selectedStatusFilter === 'All Statuses' || selectedStatusFilter === 'Scheduled') && (
                            <tr 
                              onClick={() => setSpotlitCandidate({
                                name: 'Elena Rodriguez',
                                role: 'Full Stack Developer',
                                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoYhd5YniuqYMLwIc5TCxBWW-1RaX2sFXceTkay8ME8086DmK4GYN3Wc3Y_WYvmsChb1AK-q5EeCvo75zDLnnF0gyZqCyZNanVSwUhCF1ZGeQbNYU03S-2fnq4xN7J1b0KbV3RfKznvnIGJn_7sThbe0j1xbGDDo-nW3gQjeN_-UqROp9raBiFRIbWfggX1rxPX2iBms2UFepcRSr6E13Mc0OI6HOhm8btBJ4FMFzpIB3rUnrbp9Gp2LZKUJ9kKsAVMgieE8bl-Yw',
                                summary: '6+ years experience in full-stack development. Strong experience with Node.js, React, and scalable cloud architectures. Led frontend migrations at previous startups.',
                                agenda: ['System Architecture (30m)', 'Live Coding Exercise (15m)', 'Q&A (15m)']
                              })}
                              className="hover:bg-surface-container-low/30 transition-colors cursor-pointer group"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <img className="h-9 w-9 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoYhd5YniuqYMLwIc5TCxBWW-1RaX2sFXceTkay8ME8086DmK4GYN3Wc3Y_WYvmsChb1AK-q5EeCvo75zDLnnF0gyZqCyZNanVSwUhCF1ZGeQbNYU03S-2fnq4xN7J1b0KbV3RfKznvnIGJn_7sThbe0j1xbGDDo-nW3gQjeN_-UqROp9raBiFRIbWfggX1rxPX2iBms2UFepcRSr6E13Mc0OI6HOhm8btBJ4FMFzpIB3rUnrbp9Gp2LZKUJ9kKsAVMgieE8bl-Yw" alt="Elena Rodriguez" />
                                  <div>
                                    <p className="font-label-md text-on-surface font-bold">Elena Rodriguez</p>
                                    <p className="text-[11px] text-on-surface-variant font-medium">#INT-2939</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-body-md text-on-surface font-semibold text-xs">Full Stack Developer</p>
                                <p className="text-[11px] text-on-surface-variant font-medium">Core Product</p>
                              </td>
                              <td className="px-6 py-4 text-on-surface-variant font-body-md text-xs font-semibold">Tom Walters</td>
                              <td className="px-6 py-4">
                                <p className="font-body-md text-on-surface font-semibold text-xs">Oct 24, 2023</p>
                                <p className="text-[11px] text-primary font-bold">2:30 PM - 3:30 PM</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="flex items-center gap-1.5 font-label-md text-on-surface-variant text-xs font-bold">
                                  <span className="w-2 h-2 rounded-full bg-[#655e4c]"></span> In-Person
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-[10px] font-bold uppercase tracking-wider">Scheduled</span>
                              </td>
                              <td className="px-6 py-4">
                                <button onClick={(e) => { e.stopPropagation(); showToast('Menu options expanded.', 'info'); }} className="material-symbols-outlined text-on-surface-variant group-hover:text-primary cursor-pointer">more_vert</button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Calendar Grid View Mode */
                    <div className="p-8 text-center text-on-surface-variant">
                      <div className="max-w-4xl mx-auto bg-surface-container-low/40 rounded-2xl border border-primary/5 p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-headline-sm text-primary font-bold text-sm">October 2023</h4>
                          <div className="flex gap-2">
                            <button onClick={() => showToast('Previous month loaded.', 'info')} className="p-1 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                            <button onClick={() => showToast('Next month loaded.', 'info')} className="p-1 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold uppercase text-on-surface-variant/70 border-b border-primary/5 pb-2 mb-2">
                          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                        </div>
                        <div className="grid grid-cols-7 gap-2 h-80">
                          {Array.from({ length: 31 }).map((_, i) => {
                            const day = i + 1;
                            const hasInterview = day === 23 || day === 24;
                            return (
                              <div 
                                key={i} 
                                onClick={() => hasInterview && showToast(`You have interviews scheduled on Oct ${day}.`, 'info')}
                                className={`p-2 rounded-xl border border-primary/5 flex flex-col justify-between items-start transition-all relative ${hasInterview ? 'bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10' : 'bg-surface-container-lowest'}`}
                              >
                                <span className={`text-[10px] font-bold ${hasInterview ? 'text-primary' : 'text-on-surface-variant'}`}>{day}</span>
                                {hasInterview && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary self-center mb-1"></span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagination Footer */}
                  <div className="p-6 border-t border-outline-variant/10 flex justify-between items-center text-xs font-semibold text-on-surface-variant">
                    <p>Showing 1-3 of 152 interviews</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => showToast('Already on first page.', 'info')} className="p-2 border border-outline-variant/20 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50" disabled>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                      </button>
                      <button type="button" onClick={() => showToast('Pagination is simulated.', 'info')} className="p-2 border border-outline-variant/20 rounded-lg hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Insights & Questions Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  <div className="bg-surface rounded-2xl p-6 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary-fixed-dim/30">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <h3 className="font-headline-sm text-primary font-bold text-sm uppercase tracking-wider">AI Interview Insights</h3>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2 text-xs font-bold">
                          <p className="text-on-surface-variant">Candidate Readiness</p>
                          <p className="text-primary">88% High</p>
                        </div>
                        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full w-[88%]"></div>
                        </div>
                      </div>
                      <div>
                        <p className="font-label-sm text-on-surface-variant uppercase mb-3">Predicted Performance Score</p>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary shrink-0 flex items-center justify-center">
                            <span className="font-headline-md text-primary font-extrabold">9.2</span>
                          </div>
                          <p className="text-on-surface-variant text-xs font-semibold leading-relaxed">Based on skills matching, previous career trajectory, and automated screening analysis.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface rounded-2xl p-6 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary-fixed-dim/30">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-label-sm text-on-surface font-extrabold uppercase tracking-wider">Suggested Questions</h3>
                      <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded text-[9px] font-bold uppercase tracking-wider">Smart Generated</span>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-surface-container-low/60 rounded-xl border-l-4 border-primary">
                        <p className="text-xs text-on-surface font-semibold italic">"How would you handle a pivot in product strategy halfway through a sprint?"</p>
                        <div className="flex justify-between mt-3 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant/80">
                          <span>Focus: Adaptability</span>
                          <span className="text-primary font-bold">95% Relevance</span>
                        </div>
                      </div>
                      <div className="p-4 bg-surface-container-low/60 rounded-xl border-l-4 border-primary">
                        <p className="text-xs text-on-surface font-semibold italic">"Describe your experience scaling design systems for multi-platform apps."</p>
                        <div className="flex justify-between mt-3 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant/80">
                          <span>Focus: Technical Scope</span>
                          <span className="text-primary font-bold">92% Relevance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-12 xl:col-span-4 space-y-8 text-left">
                {/* Upcoming list */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/20">
                  <h3 className="font-headline-sm text-primary font-bold text-sm uppercase tracking-wider mb-6">Upcoming Interviews</h3>
                  <div className="space-y-6">
                    {/* Item 1 */}
                    <div className="relative pl-4 border-l-4 border-primary py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-label-md text-on-surface font-bold">Sophia Martinez</p>
                          <p className="text-[11px] text-on-surface-variant font-semibold">UX Designer • 10:00 AM</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-extrabold text-primary tracking-wider uppercase">Starting in</p>
                          <p className="font-label-sm text-on-surface font-bold">14m 20s</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setIsJoinMeetOpen(true); showToast('Connecting to simulated call room...', 'success'); }}
                        className="mt-4 w-full py-2.5 bg-primary text-white rounded-xl font-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-xs"
                      >
                        <span className="material-symbols-outlined text-[18px]">videocam</span> Join Meeting
                      </button>
                    </div>

                    {/* Item 2 */}
                    <div className="relative pl-4 border-l-4 border-outline-variant py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-label-md text-on-surface font-bold">Elena Rodriguez</p>
                          <p className="text-[11px] text-on-surface-variant font-semibold">Full Stack Dev • 2:30 PM</p>
                        </div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Today</p>
                      </div>
                      <button 
                        onClick={() => setSpotlitCandidate({
                          name: 'Elena Rodriguez',
                          role: 'Full Stack Developer',
                          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoYhd5YniuqYMLwIc5TCxBWW-1RaX2sFXceTkay8ME8086DmK4GYN3Wc3Y_WYvmsChb1AK-q5EeCvo75zDLnnF0gyZqCyZNanVSwUhCF1ZGeQbNYU03S-2fnq4xN7J1b0KbV3RfKznvnIGJn_7sThbe0j1xbGDDo-nW3gQjeN_-UqROp9raBiFRIbWfggX1rxPX2iBms2UFepcRSr6E13Mc0OI6HOhm8btBJ4FMFzpIB3rUnrbp9Gp2LZKUJ9kKsAVMgieE8bl-Yw',
                          summary: '6+ years experience in full-stack development. Strong experience with Node.js, React, and scalable cloud architectures. Led frontend migrations at previous startups.',
                          agenda: ['System Architecture (30m)', 'Live Coding Exercise (15m)', 'Q&A (15m)']
                        })}
                        className="mt-4 w-full py-2.5 border border-outline-variant/30 text-on-surface-variant rounded-xl font-label-md flex items-center justify-center gap-2 hover:bg-surface-container transition-colors cursor-pointer text-xs"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span> View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Candidate Spotlight */}
                <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-label-sm text-on-surface font-extrabold uppercase tracking-wider">Candidate Spotlight</h3>
                    <button 
                      onClick={() => showToast('Spotlight full-screen is offline in preview.', 'info')}
                      className="text-on-surface-variant hover:text-primary cursor-pointer flex items-center"
                    >
                      <span className="material-symbols-outlined text-lg">open_in_full</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <img className="w-16 h-16 rounded-xl object-cover shadow-sm" src={spotlitCandidate.avatar} alt={spotlitCandidate.name} />
                    <div>
                      <h4 className="font-headline-sm text-primary font-bold text-sm">{spotlitCandidate.name}</h4>
                      <p className="text-on-surface-variant text-xs font-semibold">{spotlitCandidate.role}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Resume Summary</p>
                      <p className="text-xs font-semibold text-on-surface leading-relaxed">{spotlitCandidate.summary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Agenda</p>
                      <ul className="space-y-2.5">
                        {spotlitCandidate.agenda.map((ag: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {ag}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-4 border-t border-outline-variant/20">
                      <button 
                        onClick={() => showToast(`Feedback evaluation form opened for ${spotlitCandidate.name}.`, 'success')}
                        className="w-full py-3 bg-primary text-white rounded-xl font-label-md shadow-sm hover:opacity-90 transition-all cursor-pointer text-xs"
                      >
                        Submit Evaluation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messaging' && (
          <div className="space-y-6 text-left animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Messaging Center</h2>
                <p className="text-xs text-on-surface-variant font-semibold">Enterprise recruitment workspace for candidates and hiring teams.</p>
              </div>
            </div>

            {/* Workspace Container */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex overflow-hidden h-[680px] text-left">
              
              {/* Column 1: Conversation Manager */}
              <aside className="w-[340px] border-r border-outline/5 flex flex-col bg-surface-container-low shrink-0 h-full">
                <div className="p-4 border-b border-outline/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-primary">Conversations</h3>
                    <button 
                      type="button"
                      onClick={() => showToast('New messaging thread dialog is offline in preview.', 'info')}
                      className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                    <input 
                      type="text"
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="w-full bg-surface border border-outline/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-primary/20 transition-all outline-none text-on-background" 
                      placeholder="Search conversations..." 
                    />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {([
                      { id: 'all', label: 'All' },
                      { id: 'candidates', label: 'Candidates' },
                      { id: 'starred', label: 'Starred' }
                    ] as const).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveChatCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                          activeChatCategory === cat.id ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                  {conversationsList
                    .filter(conv => {
                      const matchesSearch = conv.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || conv.role.toLowerCase().includes(chatSearchQuery.toLowerCase());
                      const matchesCat = activeChatCategory === 'all' || 
                                         (activeChatCategory === 'starred' && conv.starred) ||
                                         (activeChatCategory === 'candidates' && conv.category === 'candidates');
                      return matchesSearch && matchesCat;
                    })
                    .map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedChatId(conv.id)}
                        className={`p-4 border-b border-outline/5 cursor-pointer transition-colors ${
                          selectedChatId === conv.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-surface-container-high/40'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="relative shrink-0">
                            <img alt={conv.name} className="w-11 h-11 rounded-full object-cover" src={conv.avatar} />
                            {conv.isTyping && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-fixed border-2 border-surface rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-xs text-primary truncate">{conv.name}</h4>
                              <span className="text-[9px] text-outline font-semibold">{conv.lastTime}</span>
                            </div>
                            <p className="text-[10px] text-primary font-bold truncate opacity-80 mt-0.5">{conv.role}</p>
                            <p className="text-[10px] text-on-surface-variant truncate mt-1">
                              {conv.isTyping ? 'Is typing...' : conv.messages[conv.messages.length - 1]?.text}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-1">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-extrabold rounded">{conv.matchRate}% Match</span>
                            <span className="px-2 py-0.5 bg-secondary-container text-secondary text-[9px] font-extrabold rounded">{conv.stage}</span>
                          </div>
                          {conv.starred && (
                            <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                          )}
                          {conv.unreadCount && (
                            <span className="bg-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </aside>

              {/* Column 2: Chat Pane */}
              {(() => {
                const activeChat = conversationsList.find(c => c.id === selectedChatId) || conversationsList[0];
                if (!activeChat) return null;
                return (
                  <div className="flex-grow flex flex-col h-full bg-white">
                    {/* Header */}
                    <div className="p-4 border-b border-outline/5 flex items-center justify-between bg-surface-container-low/10 shrink-0">
                      <div className="flex items-center gap-3">
                        <img alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" src={activeChat.avatar} />
                        <div>
                          <p className="font-bold text-xs text-primary">{activeChat.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-bold">{activeChat.role}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const mockCandidateObj: EmployerCandidate = {
                            id: `cand_${Date.now()}`,
                            name: activeChat.name,
                            avatar: activeChat.avatar,
                            university: 'University Sourcing Pool',
                            location: 'San Francisco, CA',
                            score: 9,
                            matchRate: activeChat.matchRate,
                            skills: activeChat.skills,
                            salary: '$120k',
                            status: 'Immediate',
                            appliedDate: '2026-07-03'
                          };
                          setSelectedCandidate(mockCandidateObj);
                          setIsResumeOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-white border border-outline-variant/30 text-primary rounded-lg text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        View Resume
                      </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-surface-container-low/10 custom-scrollbar">
                      <div className="flex justify-center">
                        <span className="px-4 py-1 bg-surface-container rounded-full text-[9px] font-extrabold text-outline uppercase tracking-wider">Today</span>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        {activeChat.messages.map((msg: any, idx: number) => {
                          const isSentByMe = msg.sender === 'me';
                          return (
                            <div key={idx} className={`flex items-start gap-3 max-w-[80%] ${isSentByMe ? 'self-end flex-row-reverse' : ''}`}>
                              {!isSentByMe && (
                                <img className="w-8 h-8 rounded-full object-cover mt-0.5 shrink-0" src={activeChat.avatar} alt={activeChat.name} />
                              )}
                              <div className="space-y-1">
                                <div className={`p-3 rounded-2xl shadow-sm border border-outline/5 text-xs font-semibold ${
                                  isSentByMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-on-surface rounded-tl-none'
                                }`}>
                                  <p className="leading-relaxed text-left">{msg.text}</p>
                                </div>
                                {msg.attachment && (
                                  <div 
                                    onClick={() => showToast(`Starting download of ${msg.attachment.name}...`, 'success')}
                                    className="p-3 bg-white hover:bg-surface-container rounded-xl border border-outline/10 flex items-center gap-3 cursor-pointer transition-colors mt-2"
                                  >
                                    <span className="material-symbols-outlined text-primary text-xl">description</span>
                                    <div className="flex-grow min-w-0 text-left">
                                      <p className="text-[11px] font-bold text-primary truncate">{msg.attachment.name}</p>
                                      <p className="text-[9px] text-on-surface-variant font-bold mt-0.5">{msg.attachment.size} • {msg.attachment.type}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-outline text-lg">download</span>
                                  </div>
                                )}
                                <div className={`flex items-center gap-1.5 text-[9px] text-outline font-semibold ${isSentByMe ? 'justify-end' : ''}`}>
                                  <span>{msg.time}</span>
                                  {isSentByMe && (
                                    <span className="material-symbols-outlined text-[13px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chat Input Bar */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!messagingInput.trim()) return;
                        
                        const newMsg = {
                          sender: 'me',
                          text: messagingInput.trim(),
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };

                        setConversationsList(prev => prev.map(c => {
                          if (c.id === selectedChatId) {
                            return {
                              ...c,
                              isTyping: false,
                              messages: [...c.messages, newMsg]
                            };
                          }
                          return c;
                        }));

                        setMessagingInput('');
                        showToast('Message sent successfully.', 'success');
                      }}
                      className="p-4 border-t border-outline/5 bg-white shrink-0"
                    >
                      <div className="flex items-center gap-2 bg-surface-container-low border border-outline/10 rounded-2xl p-2">
                        <button 
                          type="button"
                          onClick={() => showToast('Attachment uploads are simulated.', 'info')}
                          className="p-2 hover:bg-primary/5 rounded-full text-outline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">add_circle</span>
                        </button>
                        <input 
                          type="text"
                          value={messagingInput}
                          onChange={(e) => setMessagingInput(e.target.value)}
                          className="flex-grow bg-transparent border-none focus:ring-0 text-xs font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40" 
                          placeholder={`Message ${activeChat.name}...`} 
                        />
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => {
                              setMessagingInput(`Hi ${activeChat.name}, I reviewed your experience and would love to schedule a call next week.`);
                              showToast('AI draft message pre-filled.', 'success');
                            }}
                            title="AI Draft Rewrite"
                            className="p-2 hover:bg-primary/5 rounded-full text-outline cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">auto_fix</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => showToast('Scheduled messages are simulated.', 'info')}
                            title="Schedule Message"
                            className="p-2 hover:bg-primary/5 rounded-full text-outline cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">schedule</span>
                          </button>
                          <button 
                            type="submit"
                            className="bg-primary text-white p-2 rounded-xl hover:bg-primary/95 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                          >
                            <span className="material-symbols-outlined text-base">send</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                );
              })()}

              {/* Column 3: Sidebar Details */}
              {(() => {
                const activeChat = conversationsList.find(c => c.id === selectedChatId) || conversationsList[0];
                if (!activeChat) return null;
                return (
                  <aside className="w-80 border-l border-outline/5 bg-surface-container-low overflow-y-auto custom-scrollbar flex flex-col h-full shrink-0 text-left p-6">
                    <div className="text-center pb-6 border-b border-outline/5">
                      <img className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-primary/5 object-cover" src={activeChat.avatar} alt={activeChat.name} />
                      <h3 className="font-extrabold text-primary text-md">{activeChat.name}</h3>
                      <p className="text-[10px] font-bold text-on-surface-variant mt-0.5">{activeChat.role}</p>
                      <div className="mt-4 flex justify-center gap-1.5">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{activeChat.matchRate}% AI Match</span>
                        <span className="px-3 py-1 bg-secondary-container text-secondary text-[10px] font-bold rounded-full">Score: {activeChat.score}</span>
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 flex-grow">
                      <section>
                        <h4 className="text-[9px] font-bold uppercase tracking-widest text-outline mb-3">AI Insights</h4>
                        <div className="bg-primary/5 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-on-surface-variant">Recommendation</span>
                            <span className="text-primary uppercase tracking-wider">Strong Hire</span>
                          </div>
                          <div className="w-full bg-outline/10 h-1 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[94%]"></div>
                          </div>
                          <p className="text-[10px] font-semibold text-on-surface-variant leading-relaxed">{activeChat.aiInsights}</p>
                        </div>
                      </section>

                      <section>
                        <h4 className="text-[9px] font-bold uppercase tracking-widest text-outline mb-3">Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {activeChat.skills.map((s: string) => (
                            <span key={s} className="px-2.5 py-1 bg-white border border-outline-variant/20 rounded-lg text-[10px] font-bold text-primary">
                              {s}
                            </span>
                          ))}
                        </div>
                      </section>

                      <section className="pt-2">
                        <h4 className="text-[9px] font-bold uppercase tracking-widest text-outline mb-3">Recruitment Data</h4>
                        <div className="space-y-2.5 text-xs font-semibold text-on-surface-variant">
                          <div className="flex justify-between">
                            <span className="text-outline">Expected</span>
                            <span className="font-bold text-primary">{activeChat.expectedSalary}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-outline">Notice Period</span>
                            <span className="font-bold text-primary">{activeChat.noticePeriod}</span>
                          </div>
                        </div>
                      </section>
                    </div>
                  </aside>
                );
              })()}

            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="space-y-8 text-left animate-slide-up">
            <SectionHeader
              title="Company Profile"
              subtitle="Manage your company's public identity, culture, and recruitment branding"
              actions={
                <>
                  <SecondaryButton
                    leftIcon={<span className="material-symbols-outlined text-sm">visibility</span>}
                    onClick={() => showToast('Student-facing profile preview launched.', 'info')}
                  >
                    Preview
                  </SecondaryButton>
                  <SecondaryButton
                    leftIcon={<span className="material-symbols-outlined text-sm">share</span>}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('Share link copied to clipboard!', 'success');
                    }}
                  >
                    Share
                  </SecondaryButton>
                  <PrimaryButton
                    leftIcon={saveStatus === 'saving' ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : saveStatus === 'saved' ? <span className="material-symbols-outlined text-sm">check</span> : undefined}
                    onClick={handleSaveCompanyProfile}
                    disabled={saveStatus === 'saving'}
                    className={saveStatus === 'saved' ? 'bg-[#e9dfc8] text-[#696250]' : ''}
                  >
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
                  </PrimaryButton>
                </>
              }
            />

            <BentoGrid>
              {/* Left Column (8 columns) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                {/* Banner / Cover Card */}
                <div className="bg-white rounded-3xl border border-primary/5 shadow-sm overflow-hidden relative">
                  <div className="h-64 relative bg-slate-200">
                    <img className="w-full h-full object-cover" alt="Company Cover Banner" src={companyCover} />
                    <button 
                      onClick={() => { setCoverUrlInput(companyCover); setIsCoverEditOpen(true); }}
                      className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold hover:bg-black/60 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span> Edit Cover
                    </button>
                  </div>
                  <div className="px-8 pb-8 relative flex flex-col sm:flex-row items-start sm:items-end justify-between mt-6 gap-4">
                    <div className="flex items-end gap-5">
                      <div className="h-28 w-28 bg-white rounded-2xl border-4 border-white shadow-md overflow-hidden flex items-center justify-center p-3 group relative shrink-0">
                        <img className="w-full h-full object-contain" alt="Company Logo" src={companyLogo} />
                        <div 
                          onClick={() => { setLogoUrlInput(companyLogo); setIsLogoEditOpen(true); }}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-white text-xl">edit</span>
                        </div>
                      </div>
                      <div className="pb-2 text-left">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xl font-bold text-primary">{companyName}</h3>
                          <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified
                          </span>
                          <button 
                            onClick={() => setIsEditingBasicInfo(true)}
                            className="text-on-surface-variant hover:text-primary transition-colors ml-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                          </button>
                        </div>
                        <p className="text-on-surface-variant flex items-center gap-1 text-xs font-semibold mt-1">
                          <span className="material-symbols-outlined text-xs">location_on</span> 
                          {companyLocation} • {companyIndustry}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-6 border-l border-outline-variant/30 pl-6 pb-2 text-xs font-bold">
                      <div className="text-center">
                        <span className="block text-xl font-extrabold text-primary">{jobs.length}</span>
                        <span className="text-[9px] uppercase tracking-wider text-on-surface-variant">Active Jobs</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-xl font-extrabold text-primary">8</span>
                        <span className="text-[9px] uppercase tracking-wider text-on-surface-variant">Recruiters</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-xl font-extrabold text-primary">850</span>
                        <span className="text-[9px] uppercase tracking-wider text-on-surface-variant">Employees</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Us & Mission */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardCard className="text-left flex flex-col justify-between" hoverable={false}>
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary">About Us</h4>
                        <button 
                          onClick={() => setIsEditingAbout(!isEditingAbout)}
                          className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">{isEditingAbout ? 'close' : 'edit'}</span>
                        </button>
                      </div>
                      {isEditingAbout ? (
                        <textarea
                          rows={4}
                          value={aboutUsText}
                          onChange={(e) => setAboutUsText(e.target.value)}
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary text-on-background"
                        />
                      ) : (
                        <p className="text-xs font-semibold text-on-surface-variant leading-relaxed">
                          {aboutUsText}
                        </p>
                      )}
                    </div>
                  </DashboardCard>

                  <DashboardCard className="text-left flex flex-col justify-between" hoverable={false}>
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Mission &amp; Values</h4>
                        <button 
                          onClick={() => setIsEditingValues(!isEditingValues)}
                          className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">{isEditingValues ? 'close' : 'edit'}</span>
                        </button>
                      </div>
                      
                      {isEditingValues ? (
                        <div className="space-y-3">
                          {missionValues.map((val, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                value={val}
                                onChange={(e) => {
                                  const updated = [...missionValues];
                                  updated[i] = e.target.value;
                                  setMissionValues(updated);
                                }}
                                className="flex-grow p-1.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs outline-none text-on-background"
                              />
                              <button 
                                type="button"
                                onClick={() => setMissionValues(missionValues.filter((_, idx) => idx !== i))}
                                className="text-xs text-error font-bold"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Add a new value..."
                              value={newValuesInput}
                              onChange={(e) => setNewValuesInput(e.target.value)}
                              className="flex-grow p-1.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs outline-none text-on-background"
                            />
                            <PrimaryButton 
                              type="button"
                              onClick={() => {
                                  if (!newValuesInput.trim()) return;
                                  setMissionValues([...missionValues, newValuesInput.trim()]);
                                  setNewValuesInput('');
                              }}
                              className="py-1.5 px-3 text-[10px]"
                            >
                              Add
                            </PrimaryButton>
                          </div>
                        </div>
                      ) : (
                        <ul className="space-y-2.5">
                          {missionValues.map((val, i) => (
                            <li key={i} className="flex gap-2.5 text-xs font-semibold text-on-surface-variant">
                              <span className="material-symbols-outlined text-primary text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                              </span>
                              <span>{val}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </DashboardCard>
                </div>

                {/* Office Locations */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-primary">Office Locations</h3>
                    <span className="text-[10px] font-extrabold bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full uppercase">
                      {officeLocations.length} Total Locations
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {officeLocations.map(loc => (
                      <div 
                        key={loc.id} 
                        onClick={() => { setSelectedLocation({ ...loc }); setIsEditingLocation(true); }}
                        className="bg-white rounded-2xl border border-primary/5 shadow-sm overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="h-32 bg-surface-container-low relative">
                          <img className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" alt={loc.name} src={loc.image} />
                          {loc.type && (
                            <span className="absolute bottom-2 left-4 bg-primary text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {loc.type}
                            </span>
                          )}
                        </div>
                        <div className="p-4 text-left">
                          <h4 className="font-bold text-sm text-primary">{loc.name}</h4>
                          <p className="text-[10px] text-on-surface-variant mt-1 font-semibold truncate">{loc.description}</p>
                          <div className="mt-4 flex justify-between items-center text-[9px] font-extrabold uppercase text-on-surface-variant">
                            <span>{loc.employees} Employees</span>
                            <span className="material-symbols-outlined text-primary text-base group-hover:translate-x-1 transition-transform">
                              arrow_forward
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Tech Stack & Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tech Stack Card */}
                  <DashboardCard className="text-left flex flex-col justify-between" hoverable={false}>
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-5">Tech Stack</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {techStack.map(tech => (
                          <div key={tech} className="px-2.5 py-1 bg-secondary-container/50 text-on-secondary-container rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1.5 border border-secondary-container/20">
                            {tech}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setTechStack(techStack.filter(t => t !== tech));
                                showToast(`${tech} removed from stack.`, 'info');
                              }}
                              className="text-xs text-on-secondary-container/70 hover:text-on-secondary-container cursor-pointer"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsAddingTech(true)}
                      className="mt-6 text-[10px] text-primary font-bold flex items-center gap-1 hover:underline text-left w-fit cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span> Add Technologies
                    </button>
                  </DashboardCard>

                  {/* Company Benefits Card */}
                  <DashboardCard className="text-left" hoverable={false}>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-5">Company Benefits</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs font-bold text-on-surface-variant">
                      {[
                        { label: 'Health Insurance', icon: 'medical_services' },
                        { label: 'Flexible Hours', icon: 'schedule' },
                        { label: 'Remote Work', icon: 'house_with_shield' },
                        { label: 'Learning Budget', icon: 'school' }
                      ].map((b, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-3 bg-surface-container-low/50 rounded-xl border border-primary/5">
                          <span className="material-symbols-outlined text-primary text-base">{b.icon}</span>
                          <span>{b.label}</span>
                        </div>
                      ))}
                    </div>
                  </DashboardCard>
                </div>

                {/* Hiring Departments */}
                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-primary">Hiring Departments</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                    {[
                      { label: 'Engineering', count: 120, open: 8, icon: 'code' },
                      { label: 'Product', count: 45, open: 2, icon: 'inventory_2' },
                      { label: 'Design', count: 30, open: 1, icon: 'brush' },
                      { label: 'Marketing', count: 25, open: 1, icon: 'campaign' }
                    ].map(dept => (
                      <div 
                        key={dept.label}
                        onClick={() => showToast(`Selected department: ${dept.label}`, 'info')}
                        className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm hover:scale-[1.03] transition-all duration-300 cursor-pointer"
                      >
                        <div className="w-9 h-9 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-3">
                          <span className="material-symbols-outlined text-sm">{dept.icon}</span>
                        </div>
                        <h4 className="font-bold text-xs text-primary">{dept.label}</h4>
                        <p className="text-[9px] text-on-surface-variant font-semibold mt-1 uppercase tracking-tight">
                          {dept.count} Members • {dept.open} Open
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Life at Lumina Gallery */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-primary">Life at Lumina</h3>
                    <button 
                      onClick={() => setIsUploadingMedia(true)}
                      className="text-[10px] text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add_photo_alternate</span> Upload Media
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {galleryImages.map((imgUrl, i) => (
                      <div 
                        key={i} 
                        className={`rounded-2xl overflow-hidden border border-primary/5 shadow-sm ${
                          i === 0 ? 'sm:col-span-2 sm:row-span-2' : i === 3 ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <img className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300 min-h-32" alt={`Life gallery ${i}`} src={imgUrl} />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recruiter Directory */}
                <DataTable
                  title="Recruiter Directory"
                  columns={[
                    { key: 'member', label: 'Member' },
                    { key: 'role', label: 'Role' },
                    { key: 'openJobs', label: 'Open Jobs' },
                    { key: 'location', label: 'Location' }
                  ]}
                  headerActions={
                    <button 
                      type="button"
                      onClick={() => showToast('Team management is offline in preview.', 'info')}
                      className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold hover:bg-surface-container transition-all cursor-pointer bg-white"
                    >
                      Manage Team
                    </button>
                  }
                >
                  {[
                    { initials: 'SJ', name: 'Sarah Jenkins', role: 'Sr. Recruiter', openJobs: 4, location: 'London', color: 'bg-primary-fixed text-primary' },
                    { initials: 'AR', name: 'Alex Rivera', role: 'Head of Talent', openJobs: 2, location: 'San Francisco', color: 'bg-secondary-fixed text-secondary' },
                    { initials: 'MA', name: 'Michael Adams', role: 'Technical Recruiter', openJobs: 6, location: 'Remote', color: 'bg-tertiary-fixed text-tertiary' }
                  ].map((rec, i) => (
                    <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${rec.color} font-bold flex items-center justify-center text-xs`}>
                            {rec.initials}
                          </div>
                          <span className="font-bold text-sm text-primary">{rec.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-on-surface-variant">{rec.role}</td>
                      <td className="px-4 py-4 text-xs font-extrabold text-primary">{rec.openJobs}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant">{rec.location}</td>
                    </tr>
                  ))}
                </DataTable>
              </div>

              {/* Right Column (4 columns) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* Profile Strength */}
                <DashboardCard className="text-left" hoverable={false}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Profile Strength</h4>
                    <span className="text-xl font-extrabold text-primary">85%</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden mb-6">
                    <div className="bg-primary h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <ul className="space-y-3.5 text-xs font-semibold text-on-surface-variant">
                    <li className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                      <span>Verified Logo Uploaded</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                      <span>Mission &amp; Values Defined</span>
                    </li>
                    <li className="flex items-center gap-2.5 opacity-55">
                      <span className="material-symbols-outlined text-base">circle</span>
                      <span>Add 3 more Recruiter bios</span>
                    </li>
                  </ul>
                </DashboardCard>

                {/* AI Talent Sourcing Insights */}
                <div className="bg-primary text-white p-6 rounded-3xl relative overflow-hidden group shadow-sm flex flex-col text-left">
                  <div className="absolute -top-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                  </div>
                  <div className="relative z-10 flex flex-col h-full flex-grow">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="material-symbols-outlined text-primary-fixed">auto_awesome</span>
                      <h3 className="text-lg font-bold">Talent Insights</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {[
                        { label: 'AI Confidence', val: '94%' },
                        { label: 'Alignment', val: 'High' }
                      ].map(stat => (
                        <div key={stat.label} className="px-3 py-1 bg-white/10 rounded-lg border border-white/10 flex-1 min-w-[70px] text-center">
                          <p className="text-[8px] uppercase tracking-wider opacity-70">{stat.label}</p>
                          <p className="text-xs font-bold">{stat.val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-bold text-primary-fixed uppercase tracking-widest">Top Universities</h4>
                          <span className="text-[9px] bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full font-bold">
                            Priority Target
                          </span>
                        </div>
                        <div className="space-y-2 text-xs font-semibold text-white/95">
                          <div className="flex items-center justify-between">
                            <p>Stanford University</p>
                            <span className="text-[9px] opacity-75">92% Match</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p>MIT</p>
                            <span className="text-[9px] opacity-75">88% Match</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-bold text-primary-fixed uppercase tracking-widest">Market Comparison</h4>
                          <span className="text-[9px] bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full font-bold">
                            Competitive
                          </span>
                        </div>
                        <div className="flex items-end gap-1.5 mt-2">
                          <span className="text-2xl font-bold">$185k</span>
                          <span className="text-[9px] opacity-75 mb-1">/ Year Avg.</span>
                        </div>
                        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary-fixed h-full" style={{ width: '85%' }}></div>
                        </div>
                        <p className="text-[8px] opacity-75">Offerings in the 85th Percentile for SF.</p>
                      </div>
                    </div>
                    <PrimaryButton
                      leftIcon={<span className="material-symbols-outlined text-base">description</span>}
                      onClick={triggerAudit}
                      className="mt-6 w-full py-3 bg-white text-primary hover:bg-white/95"
                    >
                      Generate Talent Audit
                    </PrimaryButton>
                  </div>
                </div>

                {/* Monthly Goals */}
                <DashboardCard className="text-left" hoverable={false}>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant mb-5">Monthly Goals</h4>
                  <div className="space-y-5 text-xs font-semibold text-on-surface-variant">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span>Applications Screened</span>
                        <span className="font-bold text-primary">
                          {monthlyGoals.screened}/{monthlyGoals.screenedTarget}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${(monthlyGoals.screened / monthlyGoals.screenedTarget) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span>Campus Outreach</span>
                        <span className="font-bold text-primary">
                          {monthlyGoals.outreach}/{monthlyGoals.outreachTarget}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${(monthlyGoals.outreach / monthlyGoals.outreachTarget) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <SecondaryButton 
                    onClick={() => setIsAdjustingGoals(true)}
                    className="w-full mt-6"
                  >
                    Adjust Goals
                  </SecondaryButton>
                </DashboardCard>

                {/* Branding & Links */}
                <DashboardCard className="text-left" hoverable={false}>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant mb-5">Branding &amp; Links</h4>
                  <div className="space-y-3 text-xs font-bold text-on-surface-variant">
                    {[
                      { label: 'LinkedIn Profile', icon: 'link' },
                      { label: 'GitHub (Engineering)', icon: 'code' },
                      { label: 'Brand Guidelines', icon: 'palette' }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => showToast(`Navigating to company ${item.label}...`, 'info')}
                        className="flex items-center gap-3 p-3 bg-surface-container-low/50 rounded-xl cursor-pointer hover:bg-surface-container-high transition-all group border border-primary/5"
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm group-hover:scale-110 transition-all text-primary">
                          <span className="material-symbols-outlined text-sm">{item.icon}</span>
                        </div>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </DashboardCard>
              </div>
            </BentoGrid>
          </div>
        )}

        {activeTab === 'candidate-details' && selectedDetailedCandidate && (
          <div className="space-y-8 text-left animate-slide-up">
            {/* Breadcrumbs & Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant mb-2">
                  <span 
                    onClick={() => { setSelectedDetailedCandidate(null); setActiveTab('candidates'); }}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    Candidates
                  </span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="text-primary font-bold">{selectedDetailedCandidate.name}</span>
                </nav>
                <h2 className="font-headline-lg text-headline-lg text-primary">Candidate Details</h2>
                <p className="text-body-md text-on-surface-variant">Review profile, interview progress, and AI insights.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => handleOpenMessage(selectedDetailedCandidate)}
                  className="bg-secondary-container text-on-secondary-container px-4 py-2.5 rounded-xl font-label-md flex items-center gap-2 hover:bg-secondary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span> Send Message
                </button>
                <button 
                  onClick={() => { setIsJoinMeetOpen(true); showToast('Inviting candidate to call...', 'info'); }}
                  className="bg-primary text-white px-5 py-2.5 rounded-xl font-label-md flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">event</span> Schedule Interview
                </button>
                <button 
                  onClick={() => showToast('Stage moves are offline in preview.', 'info')}
                  className="bg-surface-container-highest border border-outline-variant/30 text-on-surface px-4 py-2.5 rounded-xl font-label-md flex items-center gap-2"
                >
                  Move Stage <span className="material-symbols-outlined">expand_more</span>
                </button>
                <button 
                  onClick={() => showToast('Options expanded.', 'info')}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface"
                >
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column: Primary Content */}
              <div className="xl:col-span-8 space-y-8">
                {/* Hero Section Card */}
                <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="relative">
                      <img className="w-32 h-32 rounded-2xl object-cover" alt={selectedDetailedCandidate.name} src={selectedDetailedCandidate.avatar} />
                      <div className="absolute -bottom-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface-container-lowest shadow-lg">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-headline-md text-headline-md text-on-surface">{selectedDetailedCandidate.name}</h3>
                        <span className="bg-primary-fixed text-on-primary-fixed-variant text-label-sm px-3 py-1 rounded-full font-bold">Top Match</span>
                        <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-label-sm px-3 py-1 rounded-full">Frontend</span>
                      </div>
                      <p className="text-body-lg text-on-surface-variant mb-6">{selectedDetailedCandidate.title || 'Senior Frontend Engineer at TechFlow Systems'}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div className="bg-surface-container rounded-xl p-3 border border-primary/5">
                          <p className="text-label-sm text-on-surface-variant mb-1">Score</p>
                          <p className="font-headline-md text-primary">{selectedDetailedCandidate.matchRate}%</p>
                        </div>
                        <div className="bg-surface-container rounded-xl p-3 border border-primary/5">
                          <p className="text-label-sm text-on-surface-variant mb-1">AI Match</p>
                          <p className="font-headline-md text-secondary">High</p>
                        </div>
                        <div className="bg-surface-container rounded-xl p-3 border border-primary/5">
                          <p className="text-label-sm text-on-surface-variant mb-1">Experience</p>
                          <p className="font-headline-md text-on-surface">{selectedDetailedCandidate.experience || '8 Yrs'}</p>
                        </div>
                        <div className="bg-surface-container rounded-xl p-3 border border-primary/5">
                          <p className="text-label-sm text-on-surface-variant mb-1">Location</p>
                          <p className="font-headline-md text-on-surface">{selectedDetailedCandidate.location.split(',')[0]}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-8">
                        <a className="flex items-center gap-2 text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#linkedin">
                          <img className="w-4 h-4 opacity-70" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQt_R-MLbp2U4Vg37IxLg5I8u22Z4EHFd9bvJszTMYFFjqXV690p1UKqWuR95zzMYL81PPVnBEdbbbjdU6PxpU_E_H1OPd0hYV7bTr3Ci9bxb8HI0I5nl7HfBlvAjx5nzsVuG3slh_gQ2tuZr9zIw3_RU9CgPyi2H6cbbbV2eSsUn7KC6E0WRLZsU0njXd_KE2xmljMK-SlrI88sTkOmep7dRXOU7rhkxbdlSOW8wQl5CpPv7zuqaWZ7HWCjMl-wXbEBFyIkeRSpk" alt="LinkedIn" /> LinkedIn
                        </a>
                        <a className="flex items-center gap-2 text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#github">
                          <img className="w-4 h-4 opacity-70" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB366H7qAKAsRzh3zUnBUQ1O7pwd5MwrF-8gQeBHuOg_GeSf6vQSaHaUtuMq_pzjr09pzqhWiLxd0HwL2_j2m2EAEZAcycx5bYb8qn5Z39DYg2Q9r_7RXaodnVYEKaE3bbt3ExR3tLv_FpS1AQxIfUiJpHNCEDHfIuTSEDSYNVDIEZb__SHEV9pSvKmS3H92zuGmp5rhBeojzfm6ZjvyBJSwJb7-DZskTF_-HWqlglDP03HNbwXItdQnX9LYgTKUjKN18mGzJhFKMU" alt="GitHub" /> GitHub
                        </a>
                        <a className="flex items-center gap-2 text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#portfolio">
                          <span className="material-symbols-outlined text-[18px]">public</span> Portfolio
                        </a>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Profile Summary */}
                <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                  <h4 className="font-headline-md text-headline-md mb-4 text-primary">Profile Summary</h4>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {selectedDetailedCandidate.summary}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {(selectedDetailedCandidate.strengths || ['Architecture', 'Team Leadership', 'Performance Optimization']).map((strength: string) => (
                      <span key={strength} className="bg-surface-container px-3 py-1.5 rounded-lg text-label-sm text-on-surface-variant font-medium border border-outline-variant/10">
                        {strength}
                      </span>
                    ))}
                  </div>
                </section>

                {/* AI Resume Insights */}
                <section className="relative overflow-hidden bg-primary-container rounded-2xl p-8 shadow-xl">
                  <div className="absolute top-0 right-0 opacity-10 p-4">
                    <span className="material-symbols-outlined text-[120px] text-white">auto_awesome</span>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <h4 className="font-headline-md text-white">AI Resume Insights</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-end gap-2">
                          <p className="text-[48px] font-bold text-white leading-none">98%</p>
                          <p className="text-primary-fixed text-label-sm mb-1">ATS Score</p>
                        </div>
                        <p className="text-white/80 text-body-md">Highly optimized for modern semantic search and technical keyword matching.</p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-primary-fixed font-bold text-label-md uppercase tracking-wider">Top Strengths</p>
                        <ul className="space-y-2">
                          {(selectedDetailedCandidate.strengths || ['React/Next.js Mastery', 'Scalable CSS Systems', 'Web Vitals Expert']).slice(0, 3).map((st: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-white/90 text-body-md">
                              <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span> {st}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <p className="text-primary-fixed font-bold text-label-md uppercase tracking-wider">Growth Areas</p>
                        <ul className="space-y-2">
                          {(selectedDetailedCandidate.growthAreas || ['Backend Exposure (Node.js)', 'Mobile Development']).map((grow: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-white/90 text-body-md">
                              <span className="material-symbols-outlined text-secondary-fixed text-sm">info</span> {grow}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Experience & Education */}
                <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                  <h4 className="font-headline-md text-headline-md mb-8 text-primary">Experience &amp; Education</h4>
                  <div className="relative border-l-2 border-surface-container-high ml-4 space-y-12">
                    {(selectedDetailedCandidate.history || []).map((item: any, idx: number) => (
                      <div key={idx} className="relative pl-10">
                        <div className={`absolute top-0 left-[-9px] w-4 h-4 rounded-full border-4 border-surface-container-lowest ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-primary/40' : 'bg-secondary'}`}></div>
                        <div className="flex flex-col sm:flex-row justify-between mb-2">
                          <div>
                            <h5 className="text-body-lg font-bold text-on-surface">{item.role}</h5>
                            <p className="text-body-md text-primary font-medium">{item.company}</p>
                          </div>
                          <span className="text-label-md text-on-surface-variant font-medium">{item.date}</span>
                        </div>
                        {item.desc && <p className="text-body-md text-on-surface-variant">{item.desc}</p>}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Interview Progress */}
                <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                  <h4 className="font-headline-md text-headline-md mb-8 text-primary">Interview Progress</h4>
                  <div className="space-y-8">
                    {/* Stages */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center gap-2 group flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[20px]">check</span>
                        </div>
                        <p className="text-label-sm text-primary font-bold">Applied</p>
                      </div>
                      <div className="h-1 flex-1 bg-primary mx-2 rounded"></div>
                      <div className="flex flex-col items-center gap-2 group flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[20px]">check</span>
                        </div>
                        <p className="text-label-sm text-primary font-bold">Screening</p>
                      </div>
                      <div className="h-1 flex-1 bg-primary mx-2 rounded"></div>
                      <div className="flex flex-col items-center gap-2 group flex-1">
                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 bg-primary-fixed text-primary flex items-center justify-center font-bold relative">
                          <span className="material-symbols-outlined animate-pulse">code</span>
                        </div>
                        <p className="text-label-sm text-primary font-bold">Technical</p>
                      </div>
                      <div className="h-1 flex-1 bg-surface-container mx-2 rounded"></div>
                      <div className="flex flex-col items-center gap-2 group flex-1 opacity-40">
                        <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold">
                          4
                        </div>
                        <p className="text-label-sm">Leadership</p>
                      </div>
                    </div>

                    {/* Feedback Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-outline-variant/20">
                      <div className="text-center">
                        <p className="text-label-sm text-on-surface-variant mb-2">Technical Skill</p>
                        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[95%]"></div>
                        </div>
                        <p className="mt-1 font-bold text-primary">{(selectedDetailedCandidate.feedback && selectedDetailedCandidate.feedback.technical) || '4.8'} / 5.0</p>
                      </div>
                      <div className="text-center">
                        <p className="text-label-sm text-on-surface-variant mb-2">Communication</p>
                        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[88%]"></div>
                        </div>
                        <p className="mt-1 font-bold text-primary">{(selectedDetailedCandidate.feedback && selectedDetailedCandidate.feedback.communication) || '4.4'} / 5.0</p>
                      </div>
                      <div className="text-center">
                        <p className="text-label-sm text-on-surface-variant mb-2">Culture Fit</p>
                        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-secondary w-[90%]"></div>
                        </div>
                        <p className="mt-1 font-bold text-secondary">{(selectedDetailedCandidate.feedback && selectedDetailedCandidate.feedback.culture) || '4.5'} / 5.0</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Resume Viewer */}
                <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                  <div className="p-6 border-b border-primary/5 flex justify-between items-center bg-surface-bright">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                      <span className="font-label-md text-on-surface">{selectedDetailedCandidate.name.replace(' ', '_')}_Resume_2023.pdf</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => showToast('Full-screen PDF toggled.', 'info')} className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant cursor-pointer">
                        <span className="material-symbols-outlined">fullscreen</span>
                      </button>
                      <button type="button" onClick={() => showToast('PDF file download started.', 'success')} className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant cursor-pointer">
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </div>
                  </div>
                  <div className="h-[600px] bg-surface-container-low p-12 overflow-y-auto">
                    <div className="mx-auto max-w-[800px] bg-white shadow-lg p-10 min-h-[1000px] text-zinc-800">
                      <div className="border-b-2 border-zinc-200 pb-4 mb-6">
                        <h1 className="text-3xl font-bold text-black uppercase tracking-tight">{selectedDetailedCandidate.name}</h1>
                        <p className="text-sm text-zinc-500 mt-1">{selectedDetailedCandidate.location} • {selectedDetailedCandidate.name.toLowerCase().replace(' ', '.')}@email.com • github.com</p>
                      </div>
                      <div className="space-y-6">
                        <section>
                          <h6 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Professional Summary</h6>
                          <p className="text-sm leading-relaxed">{selectedDetailedCandidate.summary}</p>
                        </section>
                        <section>
                          <h6 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Technical Skills</h6>
                          <p className="text-sm">{selectedDetailedCandidate.skills.join(', ')}</p>
                        </section>
                        <section>
                          <h6 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Work History</h6>
                          {(selectedDetailedCandidate.history || []).slice(0, 2).map((h: any, idx: number) => (
                            <div key={idx} className="mb-4 text-left">
                              <div className="flex justify-between font-bold text-sm">
                                <span>{h.company.split('•')[0]}</span>
                                <span>{h.date.split('(')[0]}</span>
                              </div>
                              <p className="italic text-xs text-zinc-600">{h.role}</p>
                              {h.desc && <p className="text-xs text-zinc-500 mt-1">{h.desc}</p>}
                            </div>
                          ))}
                        </section>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Recruiter Notes */}
                <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-headline-md text-headline-md text-primary">Recruiter Notes</h4>
                    <span className="text-label-sm text-on-surface-variant">{(selectedDetailedCandidate.notes && selectedDetailedCandidate.notes.length) || 0} comments</span>
                  </div>
                  <div className="space-y-6 mb-8">
                    {selectedDetailedCandidate.notes && selectedDetailedCandidate.notes.map((note: any, idx: number) => (
                      <div key={idx} className="flex gap-4">
                        <img className="w-10 h-10 rounded-full object-cover" alt={note.author} src={note.avatar} />
                        <div className="flex-1 bg-surface-container p-4 rounded-2xl rounded-tl-none">
                          <div className="flex justify-between mb-1">
                            <span className="font-bold text-label-md">{note.author}</span>
                            <span className="text-label-sm text-on-surface-variant/70">{note.time}</span>
                          </div>
                          <p className="text-body-md text-on-surface-variant">{note.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handlePostNote} className="relative">
                    <textarea 
                      value={newNoteInput}
                      onChange={(e) => setNewNoteInput(e.target.value)}
                      className="w-full bg-surface-container border-outline-variant/30 rounded-2xl p-4 text-body-md focus:ring-primary focus:border-primary min-h-[100px] outline-none" 
                      placeholder="Add a note, use @ to mention someone..."
                    />
                    <div className="absolute bottom-4 right-4 flex gap-3">
                      <button type="button" onClick={() => showToast('Attachment options are offline.', 'info')} className="text-on-surface-variant hover:text-primary cursor-pointer">
                        <span className="material-symbols-outlined">attach_file</span>
                      </button>
                      <button type="submit" className="bg-primary text-white px-4 py-1.5 rounded-lg text-label-md hover:opacity-90">Post Note</button>
                    </div>
                  </form>
                </section>
              </div>

              {/* Right Column: Sticky Sidebar */}
              <aside className="xl:col-span-4 space-y-6 sticky-sidebar">
                {/* Quick Summary Card */}
                <section className="bg-white rounded-2xl p-6 shadow-lg border border-primary/5">
                  <h5 className="text-label-md font-bold uppercase tracking-widest text-on-surface-variant/70 mb-6">Candidate Health</h5>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-body-md text-on-surface-variant">Overall Match</span>
                      <span className="text-headline-md font-bold text-primary">{selectedDetailedCandidate.matchRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-body-md text-on-surface-variant">ATS Compatibility</span>
                      <span className="text-body-lg font-bold text-secondary">High</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-body-md text-on-surface-variant">Current Stage</span>
                      <span className="bg-primary-fixed text-on-primary-fixed text-label-sm px-3 py-1 rounded-full font-bold">Technical Review</span>
                    </div>
                  </div>
                  {selectedDetailedCandidate.nextAction && (
                    <div className="mt-8 pt-8 border-t border-outline-variant/20">
                      <h6 className="text-label-sm font-bold text-on-surface mb-4">Next Action</h6>
                      <div className="bg-surface-container p-4 rounded-xl flex gap-3 items-start border border-primary/5">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                        <div>
                          <p className="text-label-md font-bold text-on-surface">{selectedDetailedCandidate.nextAction.title}</p>
                          <p className="text-label-sm text-on-surface-variant">{selectedDetailedCandidate.nextAction.time}</p>
                          <button 
                            type="button" 
                            onClick={() => showToast('Opening calendar invite details...', 'info')}
                            className="text-primary text-label-sm font-bold mt-2 hover:underline cursor-pointer"
                          >
                            View Invite
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Profile Details Metadata */}
                <section className="bg-white rounded-2xl p-6 shadow-lg border border-primary/5">
                  <h5 className="text-label-md font-bold uppercase tracking-widest text-on-surface-variant/70 mb-6">Profile Details</h5>
                  <div className="space-y-4">
                    <div>
                      <p className="text-label-sm text-on-surface-variant">Expected Salary</p>
                      <p className="text-body-md font-bold text-on-surface">{selectedDetailedCandidate.salary}</p>
                    </div>
                    <div>
                      <p className="text-label-sm text-on-surface-variant">Availability</p>
                      <p className="text-body-md font-bold text-on-surface">{selectedDetailedCandidate.status}</p>
                    </div>
                    <div>
                      <p className="text-label-sm text-on-surface-variant">Recruiter</p>
                      <div className="flex items-center gap-2 mt-1">
                        <img className="w-6 h-6 rounded-full object-cover" alt="Sarah Jenkins" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbkO4BhOCsLkZf0ERNsj-6rt0xZU0f2NOOEXsF8QrtmkSaYnvlQTzC4qNG2n8beTs24Ugs9YEwcAmp0D_eGPOF76Tq4_gya0h0p-NADHedwyksQer8-eNXYBgEbfG_2ZwS74u-MTNfQw4Rv7vbm9uJaQFVLjIQ3sa0jbQYmM1pBdx9aZyXIJErMXZ0vn7YoYFQG37I_oTh58WJ_VXM5WBNbUzh4gyF5Kqfgo_CmXO_6yhPIv5lcZUmXXACuMe2LFCQlVI6V0JzKrM" />
                        <p className="text-body-md font-bold text-on-surface">{selectedDetailedCandidate.recruiter || 'Sarah Jenkins'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-label-sm text-on-surface-variant">Source</p>
                      <p className="text-body-md font-bold text-on-surface">{selectedDetailedCandidate.source || 'LinkedIn InMail'}</p>
                    </div>
                    <div>
                      <p className="text-label-sm text-on-surface-variant">Applied On</p>
                      <p className="text-body-md font-bold text-on-surface">{selectedDetailedCandidate.appliedDate || 'Oct 12, 2023'}</p>
                    </div>
                  </div>
                </section>

                {/* Skills Heatmap */}
                <section className="bg-white rounded-2xl p-6 shadow-lg border border-primary/5">
                  <h5 className="text-label-md font-bold uppercase tracking-widest text-on-surface-variant/70 mb-4">Core Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetailedCandidate.skills.map((skill: string, idx: number) => (
                      <span 
                        key={idx} 
                        className={`px-3 py-1.5 rounded-lg text-label-sm font-bold border ${
                          skill.includes('React') || skill.includes('TypeScript') || skill.includes('Next.js') || skill.includes('Expert')
                            ? 'bg-primary/5 text-primary border-primary/20' 
                            : 'bg-surface-container text-on-surface-variant border-transparent'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8 text-left animate-slide-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="space-y-1">
                <h2 className="font-display text-headline-lg text-primary">Recruitment Analytics</h2>
                <p className="font-body-md text-on-surface-variant max-w-2xl">Monitor recruitment performance, hiring efficiency, recruiter productivity, and organizational hiring trends.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => showToast('Exporting recruitment analytics report...', 'success')}
                  className="px-5 py-2.5 bg-surface border border-outline-variant/30 text-on-surface rounded-xl font-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">ios_share</span>
                  Export Report
                </button>
                <button 
                  onClick={() => showToast('Generating PDF report...', 'success')}
                  className="px-5 py-2.5 bg-surface border border-outline-variant/30 text-on-surface rounded-xl font-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  Generate PDF
                </button>
                <button 
                  onClick={() => showToast('Custom dashboard options are offline in preview.', 'info')}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl font-label-md flex items-center gap-2 hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">dashboard_customize</span>
                  Custom Dashboard
                </button>
              </div>
            </div>

            {/* Timeframe Filters Row */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-primary/5 flex flex-wrap items-center gap-4">
              <span className="font-label-md text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                Date Range:
              </span>
              <div className="flex bg-surface-container-low p-1 rounded-xl">
                {(['today', '7d', '30d', 'quarter', 'year'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setAnalyticsTimeframe(t);
                      showToast(`Timeframe updated to ${t.toUpperCase()}`, 'info');
                    }}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${analyticsTimeframe === t ? 'bg-white text-primary shadow-sm font-extrabold' : 'text-on-surface-variant hover:text-primary'}`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-4">
                <span className="text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded">Filtered by: All Departments</span>
                <button onClick={() => { setAnalyticsTimeframe('30d'); showToast('Filters cleared.', 'info'); }} className="text-primary font-label-md hover:underline cursor-pointer">Clear all</button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* KPI 1: Total Applications */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5 hover:shadow-md transition-shadow text-left">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-primary/5 text-primary rounded-lg">
                    <span className="material-symbols-outlined text-primary">groups</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-label-sm bg-primary/5 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    +12%
                  </div>
                </div>
                <p className="text-on-surface-variant font-label-md">Total Applications</p>
                <h3 className="text-headline-md font-bold text-primary mt-1">5,240</h3>
                <div className="mt-4 h-12 w-full overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 200 40">
                    <path d="M0 35 Q 25 30, 50 32 T 100 15 T 150 20 T 200 5" fill="none" stroke="#023629" strokeWidth="2"></path>
                    <path d="M0 35 Q 25 30, 50 32 T 100 15 T 150 20 T 200 5 V 40 H 0 Z" fill="rgba(2, 54, 41, 0.05)"></path>
                  </svg>
                </div>
              </div>

              {/* KPI 2: Avg Time to Hire */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5 hover:shadow-md transition-shadow text-left">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-secondary-container/30 text-secondary rounded-lg">
                    <span className="material-symbols-outlined text-secondary">timer</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-label-sm bg-primary/5 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                    -2d
                  </div>
                </div>
                <p className="text-on-surface-variant font-label-md">Avg. Time to Hire</p>
                <h3 className="text-headline-md font-bold text-primary mt-1">18 days</h3>
                <div className="mt-4 h-12 w-full overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 200 40">
                    <path d="M0 5 Q 25 10, 50 8 T 100 25 T 150 20 T 200 35" fill="none" stroke="#655e4c" strokeWidth="2"></path>
                    <path d="M0 5 Q 25 10, 50 8 T 100 25 T 150 20 T 200 35 V 40 H 0 Z" fill="rgba(101, 94, 76, 0.05)"></path>
                  </svg>
                </div>
              </div>

              {/* KPI 3: Offer Acceptance Rate */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5 hover:shadow-md transition-shadow text-left">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-primary/5 text-primary rounded-lg">
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-label-sm bg-primary/5 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    +4%
                  </div>
                </div>
                <p className="text-on-surface-variant font-label-md">Offer Acceptance</p>
                <h3 className="text-headline-md font-bold text-primary mt-1">88%</h3>
                <div className="mt-4 h-12 w-full overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 200 40">
                    <path d="M0 30 Q 25 25, 50 28 T 100 15 T 150 18 T 200 10" fill="none" stroke="#384b42" strokeWidth="2"></path>
                  </svg>
                </div>
              </div>

              {/* KPI 4: AI Hiring Accuracy */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5 hover:shadow-md transition-shadow text-left bg-[radial-gradient(circle_at_top_right,rgba(182,204,192,0.1),transparent)]">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-label-sm bg-primary/5 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    +1.2%
                  </div>
                </div>
                <p className="text-on-surface-variant font-label-md">AI Hiring Accuracy</p>
                <h3 className="text-headline-md font-bold text-primary mt-1">94%</h3>
                <div className="mt-6 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>

            {/* Funnel & AI Strategic Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Funnel visualization */}
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-primary/5 text-left">
                <div className="flex justify-between items-center mb-10">
                  <h4 className="font-headline-sm text-primary font-bold text-md">Recruitment Funnel Efficiency</h4>
                  <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                    <span className="w-3 h-3 bg-primary rounded-full"></span> Application to Joined
                  </div>
                </div>
                <div className="flex flex-col gap-4 relative">
                  <div className="flex h-24 items-stretch overflow-hidden rounded-xl">
                    <div className="flex-1 bg-primary text-white flex flex-col justify-center items-center relative z-[6] border-r border-white/10">
                      <span className="font-bold text-headline-md leading-none">5,240</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest opacity-80 mt-1">Application</span>
                    </div>
                    <div className="flex-1 bg-primary/90 text-white flex flex-col justify-center items-center relative z-[5] border-r border-white/10">
                      <span className="font-bold text-headline-md leading-none">1,850</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest opacity-80 mt-1">Screening</span>
                      <div className="absolute top-1 left-1 bg-primary-container px-1 py-0.5 rounded text-[8px] text-primary font-extrabold uppercase">35% Conv</div>
                    </div>
                    <div className="flex-1 bg-primary/80 text-white flex flex-col justify-center items-center relative z-[4] border-r border-white/10">
                      <span className="font-bold text-headline-md leading-none">640</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest opacity-80 mt-1">Shortlisted</span>
                      <div className="absolute top-1 left-1 bg-primary-container px-1 py-0.5 rounded text-[8px] text-primary font-extrabold uppercase">34% Conv</div>
                    </div>
                    <div className="flex-1 bg-primary/70 text-white flex flex-col justify-center items-center relative z-[3] border-r border-white/10">
                      <span className="font-bold text-headline-md leading-none">320</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest opacity-80 mt-1">Interview</span>
                      <div className="absolute top-1 left-1 bg-primary-container px-1 py-0.5 rounded text-[8px] text-primary font-extrabold uppercase">50% Conv</div>
                    </div>
                    <div className="flex-1 bg-primary/60 text-white flex flex-col justify-center items-center relative z-[2] border-r border-white/10">
                      <span className="font-bold text-headline-md leading-none">145</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest opacity-80 mt-1">Offer</span>
                      <div className="absolute top-1 left-1 bg-primary-container px-1 py-0.5 rounded text-[8px] text-primary font-extrabold uppercase">45% Conv</div>
                    </div>
                    <div className="flex-1 bg-primary/50 text-white flex flex-col justify-center items-center relative z-[1]">
                      <span className="font-bold text-headline-md leading-none">128</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest opacity-80 mt-1">Joined</span>
                      <div className="absolute top-1 left-1 bg-primary-container px-1 py-0.5 rounded text-[8px] text-primary font-extrabold uppercase">88% Conv</div>
                    </div>
                  </div>
                </div>
                <div className="mt-12 grid grid-cols-3 gap-6 pt-6 border-t border-outline-variant/20 font-semibold">
                  <div className="text-center">
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Screening Bottleneck</p>
                    <p className="text-primary font-extrabold text-lg mt-1">High</p>
                    <p className="text-[10px] text-error font-extrabold mt-0.5">Review time &gt; 4 days</p>
                  </div>
                  <div className="text-center border-x border-outline-variant/20">
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Overall Conv. Rate</p>
                    <p className="text-primary font-extrabold text-lg mt-1">2.4%</p>
                    <p className="text-[10px] text-primary font-extrabold mt-0.5">+0.3% from LY</p>
                  </div>
                  <div className="text-center">
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Candidate Quality</p>
                    <p className="text-primary font-extrabold text-lg mt-1">Exceptional</p>
                    <p className="text-[10px] text-primary font-extrabold mt-0.5">92% meet criteria</p>
                  </div>
                </div>
              </div>

              {/* AI Strategic Insights */}
              <div className="bg-primary text-white p-8 rounded-2xl shadow-xl relative overflow-hidden group text-left">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <span className="material-symbols-outlined text-[120px] text-white">auto_awesome</span>
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h4 className="font-headline-sm font-bold text-white uppercase tracking-wider">AI Strategic Insights</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="font-bold uppercase tracking-wider text-primary-fixed">Hiring Forecast</span>
                        <span className="bg-primary-container text-primary-fixed px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">92% Confidence</span>
                      </div>
                      <p className="text-xs font-semibold text-white/95 leading-relaxed">Expect a 15% surge in Engineering applications over the next 45 days based on regional graduation cycles.</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-primary-fixed">Market Demand Analysis</span>
                      <p className="text-xs font-semibold text-white/95 leading-relaxed">Product Manager roles are currently 2.4x more competitive than Q3. Consider revising salary benchmarks by +8% to maintain top-tier conversion.</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-primary-fixed">Recruitment Bottlenecks</span>
                      <p className="text-xs font-semibold text-white/95 leading-relaxed">\'Technical Interview\' stage is averaging 6.2 days. Reducing this to 4.0 days would improve offer acceptance by ~5.2%.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => showToast('Full AI strategic report generated.', 'success')}
                    className="w-full py-3 bg-white text-primary rounded-xl font-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Generate Full AI Report
                  </button>
                </div>
              </div>
            </div>

            {/* Hiring Trends Bar Chart */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-primary/5 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h4 className="font-headline-sm text-primary font-bold text-md">Hiring Trends</h4>
                  <p className="text-on-surface-variant text-xs font-semibold">Year-over-year comparison of applications and hires.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-primary rounded-full"></span>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-secondary rounded-full"></span>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Hires</span>
                  </div>
                </div>
              </div>
              <div className="h-80 w-full flex items-end justify-between gap-1 group relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                  <div className="border-b border-primary w-full h-0"></div>
                  <div className="border-b border-primary w-full h-0"></div>
                  <div className="border-b border-primary w-full h-0"></div>
                  <div className="border-b border-primary w-full h-0"></div>
                </div>
                
                {/* Bars Simulation */}
                {[
                  { month: 'Jan', app: '60%', hire: '15%' },
                  { month: 'Feb', app: '70%', hire: '20%' },
                  { month: 'Mar', app: '85%', hire: '25%' },
                  { month: 'Apr', app: '55%', hire: '18%' },
                  { month: 'May', app: '92%', hire: '32%' },
                  { month: 'Jun', app: '80%', hire: '28%' },
                  { month: 'Jul', app: '65%', hire: '22%' },
                  { month: 'Aug', app: '75%', hire: '24%' },
                  { month: 'Sep', app: '88%', hire: '30%' },
                  { month: 'Oct', app: '72%', hire: '26%' },
                  { month: 'Nov', app: '60%', hire: '20%' },
                  { month: 'Dec', app: '40%', hire: '12%' }
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1 h-full cursor-pointer group/bar">
                    <div className="flex items-end gap-1 w-full justify-center">
                      <div className="w-5 bg-primary rounded-t-sm transition-all group-hover/bar:opacity-80" style={{ height: item.app }} title={`Applications: ${item.app}`}></div>
                      <div className="w-5 bg-secondary rounded-t-sm transition-all group-hover/bar:opacity-80" style={{ height: item.hire }} title={`Hires: ${item.hire}`}></div>
                    </div>
                    <span className="text-[9px] text-on-surface-variant mt-2 font-bold uppercase tracking-wider">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruiter Leaderboard & Geographic Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recruiter Leaderboard */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden text-left">
                <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                  <h4 className="font-headline-sm text-primary font-bold text-md">Recruiter Performance</h4>
                  <button onClick={() => showToast('Opening recruiters performance sheet...', 'info')} className="text-primary text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer">
                    View All <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-8 py-4">Recruiter Name</th>
                        <th className="px-8 py-4">Managed</th>
                        <th className="px-8 py-4">Hires</th>
                        <th className="px-8 py-4">Avg. Rating</th>
                        <th className="px-8 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-xs font-semibold text-on-surface-variant">
                      <tr className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="px-8 py-5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-extrabold text-primary">SK</div>
                          <div>
                            <p className="font-bold text-on-surface text-xs">Sarah Kinsley</p>
                            <p className="text-[10px] text-on-surface-variant">Tech Lead</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-on-surface">428</td>
                        <td className="px-8 py-5 font-bold text-primary">32</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center text-primary font-bold gap-0.5">
                            <span className="material-symbols-outlined text-[16px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span>4.9</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">On Track</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="px-8 py-5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary-container/50 flex items-center justify-center font-extrabold text-secondary">MP</div>
                          <div>
                            <p className="font-bold text-on-surface text-xs">Mark Pinedo</p>
                            <p className="text-[10px] text-on-surface-variant">Sales Recruiter</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-on-surface">312</td>
                        <td className="px-8 py-5 font-bold text-primary">28</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center text-primary font-bold gap-0.5">
                            <span className="material-symbols-outlined text-[16px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span>4.7</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">On Track</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="px-8 py-5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-tertiary-fixed-dim/40 flex items-center justify-center font-extrabold text-on-tertiary-fixed-variant">JL</div>
                          <div>
                            <p className="font-bold text-on-surface text-xs">Julia Lopez</p>
                            <p className="text-[10px] text-on-surface-variant">Ops Specialist</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-on-surface">295</td>
                        <td className="px-8 py-5 font-bold text-primary">15</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center text-primary font-bold gap-0.5">
                            <span className="material-symbols-outlined text-[16px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span>4.2</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="px-3 py-1 bg-error/10 text-error text-[10px] font-bold rounded-full uppercase tracking-wider">Warning</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Geographic & Diversity Metrics */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5 text-left space-y-8">
                <div>
                  <h4 className="font-headline-sm text-primary font-bold text-md mb-4">Candidate Diversity</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-on-surface">Gender Diversity</span>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Updated Yesterday</span>
                    </div>
                    <div className="flex h-3.5 w-full rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[48%]" title="Female"></div>
                      <div className="h-full bg-secondary w-[45%]" title="Male"></div>
                      <div className="h-full bg-tertiary-fixed-dim w-[7%]" title="Non-binary"></div>
                    </div>
                    <div className="flex gap-4 pt-1 font-bold text-[10px]">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span><span>48% F</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-secondary"></span><span>45% M</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim"></span><span>7% NB</span></div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant/10 space-y-4">
                  <p className="text-xs font-bold text-on-surface">Top Talent Geographies</p>
                  <div className="space-y-4 font-semibold text-xs text-on-surface-variant">
                    {/* NA */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                          <span>North America</span>
                        </div>
                        <span className="font-bold text-primary">64%</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[64%]"></div>
                      </div>
                    </div>
                    {/* EU */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                          <span>Europe</span>
                        </div>
                        <span className="font-bold text-primary">22%</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[22%]"></div>
                      </div>
                    </div>
                    {/* APAC */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                          <span>Asia Pacific</span>
                        </div>
                        <span className="font-bold text-primary">14%</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[14%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <footer className="pt-12 pb-8 text-center text-on-surface-variant opacity-40 text-xs font-bold border-t border-outline-variant/20">
              © 2024 CareerBridge Enterprise. All recruitment data is processed according to Global Talent Privacy Regulations.
            </footer>
          </div>
        )}

        {activeTab === 'recruiters' && (
          <div className="space-y-8 text-left animate-slide-up">
            {/* Page Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="max-w-2xl">
                <h2 className="text-headline-lg font-headline-lg text-primary mb-2">Team Management</h2>
                <p className="text-body-md font-body-md text-on-surface-variant">Manage recruiters, hiring managers, permissions, workloads, and recruitment performance across your organization.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => showToast('Exporting recruiters team data...', 'success')}
                  className="px-4 py-2.5 bg-surface-container-high border border-outline-variant/30 text-primary hover:bg-surface-container-highest transition-colors rounded-xl font-label-md text-label-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">file_download</span> Export Team
                </button>
                <button 
                  onClick={() => showToast('Assigning roles dialog is offline.', 'info')}
                  className="px-4 py-2.5 bg-secondary-container text-on-secondary-container border border-outline-variant/30 hover:bg-secondary-fixed transition-colors rounded-xl font-label-md text-label-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span> Assign Roles
                </button>
                <button 
                  onClick={() => showToast('Invite Recruiter modal opened.', 'info')}
                  className="px-6 py-2.5 bg-primary text-white hover:opacity-90 transition-opacity rounded-xl font-label-md text-label-md flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span> Invite Recruiter
                </button>
              </div>
            </div>

            {/* KPI Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider text-[10px]">Total Recruiters</p>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-headline-md font-headline-md text-primary font-extrabold">54</span>
                  <span className="text-label-sm font-bold text-green-600 mb-1 flex items-center">+4%</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider text-[10px]">Active Now</p>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-headline-md font-headline-md text-primary font-extrabold">32</span>
                  <div className="flex items-center gap-1 mb-1.5 px-1.5 py-0.5 bg-green-50 rounded-full border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-green-600 font-bold uppercase tracking-tighter">Live</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider text-[10px]">Hiring Managers</p>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-headline-md font-headline-md text-primary font-extrabold">128</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider text-[10px]">Open Jobs</p>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-headline-md font-headline-md text-primary font-extrabold">212</span>
                  <span className="text-[10px] text-on-surface-variant font-bold mb-1">avg 4/rec</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider text-[10px]">Candidates</p>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-headline-md font-headline-md text-primary font-extrabold">4.2k</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider text-[10px]">Success Rate</p>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-headline-md font-headline-md text-primary font-extrabold">92%</span>
                  <span className="material-symbols-outlined text-primary/40 text-[18px] mb-1">trending_up</span>
                </div>
              </div>
            </div>

            {/* Main Workspace Area (Split) */}
            <div className="flex flex-col xl:flex-row gap-8 items-start">
              {/* Content Canvas */}
              <div className="flex-1 w-full space-y-6">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full text-left">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
                    <input className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border-none focus:ring-2 focus:ring-primary/20 font-body-md text-body-md" placeholder="Search by name, email, department, or employee ID..." type="text"/>
                  </div>
                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <button 
                      onClick={() => showToast('Filters are offline in preview.', 'info')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-container-high transition-colors rounded-xl border border-outline-variant/20 text-label-md font-label-md cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">filter_list</span> Filters
                    </button>
                    <div className="flex bg-surface rounded-xl p-1 border border-outline-variant/20">
                      <button 
                        onClick={() => setRecruiterViewMode('card')}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${recruiterViewMode === 'card' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                      </button>
                      <button 
                        onClick={() => setRecruiterViewMode('table')}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${recruiterViewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">view_list</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Directory Card View */}
                {recruiterViewMode === 'card' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Recruiter Card 1 */}
                    <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] hover:translate-y-[-4px] transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4 text-left">
                          <div className="relative">
                            <img className="w-14 h-14 rounded-full object-cover" alt="Sarah Jenkins" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbkO4BhOCsLkZf0ERNsj-6rt0xZU0f2NOOEXsF8QrtmkSaYnvlQTzC4qNG2n8beTs24Ugs9YEwcAmp0D_eGPOF76Tq4_gya0h0p-NADHedwyksQer8-eNXYBgEbfG_2ZwS74u-MTNfQw4Rv7vbm9uJaQFVLjIQ3sa0jbQYmM1pBdx9aZyXIJErMXZ0vn7YoYFQG37I_oTh58WJ_VXM5WBNbUzh4gyF5Kqfgo_CmXO_6yhPIv5lcZUmXXACuMe2LFCQlVI6V0JzKrM" />
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                          </div>
                          <div>
                            <h3 className="font-headline-sm text-primary font-bold text-sm">Sarah Jenkins</h3>
                            <p className="text-[10px] font-bold text-on-surface-variant/75 mt-0.5">Senior Tech Recruiter</p>
                          </div>
                        </div>
                        <button onClick={() => showToast('Options expanded.', 'info')} className="text-on-surface-variant hover:text-primary p-1 cursor-pointer">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </div>
                      <div className="space-y-3 mb-6 text-xs text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant font-medium">Department</span>
                          <span className="font-bold text-primary">Engineering</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant font-medium">Office</span>
                          <span className="font-bold text-primary">San Francisco</span>
                        </div>
                        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-primary h-full rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase text-on-surface-variant/60">
                          <span>Workload: High</span>
                          <span>75% Capacity</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-4 border-y border-on-surface/5 mb-6 text-center">
                        <div>
                          <p className="text-headline-sm font-bold text-primary text-[18px]">12</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/75 uppercase mt-0.5">Jobs</p>
                        </div>
                        <div>
                          <p className="text-headline-sm font-bold text-primary text-[18px]">48</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/75 uppercase mt-0.5">Cand.</p>
                        </div>
                        <div>
                          <p className="text-headline-sm font-bold text-primary text-[18px]">8</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/75 uppercase mt-0.5">Intvw.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => showToast('Opening profile sheet for Sarah Jenkins.', 'info')}
                        className="w-full py-2.5 rounded-xl bg-surface hover:bg-primary hover:text-white text-primary font-label-md text-label-md transition-all duration-200 border border-primary/5 cursor-pointer"
                      >
                        View Profile
                      </button>
                    </div>

                    {/* Recruiter Card 2 */}
                    <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] hover:translate-y-[-4px] transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4 text-left">
                          <div className="relative">
                            <img className="w-14 h-14 rounded-full object-cover" alt="Marcus Chen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIjmKXVwHPGzSrC0uFxLwFnUnRHnRLh37G0t-grSuU6SQy8Ot2_DZ4zhU5gyOpsKDBaUoJMsmbBMCUgcpsok_uNjYfF3aLnkfKskH-AuCFFj8x9AUEg3zatPKSN8f-OTR5tR0Gzq-Bv1jU_TM6GyrBl8C6b5EVtsRM4pWvi22kZvEF4QDPguy2ClD-YDGTWa3nCbFd3Ph4YBpMKvT1FGKjmQaWiCkJYnxy19_FD3oCDXfIstE3GWyb1Uy-lxTBJGVJZ2EU3ie5zHA" />
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                          </div>
                          <div>
                            <h3 className="font-headline-sm text-primary font-bold text-sm">Marcus Chen</h3>
                            <p className="text-[10px] font-bold text-on-surface-variant/75 mt-0.5">Product Recruiter</p>
                          </div>
                        </div>
                        <button onClick={() => showToast('Options expanded.', 'info')} className="text-on-surface-variant hover:text-primary p-1 cursor-pointer">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </div>
                      <div className="space-y-3 mb-6 text-xs text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant font-medium">Department</span>
                          <span className="font-bold text-primary">Product</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant font-medium">Office</span>
                          <span className="font-bold text-primary">New York</span>
                        </div>
                        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-primary h-full rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase text-on-surface-variant/60">
                          <span>Workload: Optimal</span>
                          <span>45% Capacity</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-4 border-y border-on-surface/5 mb-6 text-center">
                        <div>
                          <p className="text-headline-sm font-bold text-primary text-[18px]">6</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/75 uppercase mt-0.5">Jobs</p>
                        </div>
                        <div>
                          <p className="text-headline-sm font-bold text-primary text-[18px]">22</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/75 uppercase mt-0.5">Cand.</p>
                        </div>
                        <div>
                          <p className="text-headline-sm font-bold text-primary text-[18px]">14</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/75 uppercase mt-0.5">Intvw.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => showToast('Opening profile sheet for Marcus Chen.', 'info')}
                        className="w-full py-2.5 rounded-xl bg-surface hover:bg-primary hover:text-white text-primary font-label-md text-label-md transition-all duration-200 border border-primary/5 cursor-pointer"
                      >
                        View Profile
                      </button>
                    </div>

                    {/* Recruiter Card 3 */}
                    <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] hover:translate-y-[-4px] transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4 text-left">
                          <div className="relative">
                            <img className="w-14 h-14 rounded-full object-cover" alt="Elena Rodriguez" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoYhd5YniuqYMLwIc5TCxBWW-1RaX2sFXceTkay8ME8086DmK4GYN3Wc3Y_WYvmsChb1AK-q5EeCvo75zDLnnF0gyZqCyZNanVSwUhCF1ZGeQbNYU03S-2fnq4xN7J1b0KbV3RfKznvnIGJn_7sThbe0j1xbGDDo-nW3gQjeN_-UqROp9raBiFRIbWfggX1rxPX2iBms2UFepcRSr6E13Mc0OI6HOhm8btBJ4FMFzpIB3rUnrbp9Gp2LZKUJ9kKsAVMgieE8bl-Yw" />
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-300 border-2 border-white rounded-full"></span>
                          </div>
                          <div>
                            <h3 className="font-headline-sm text-primary font-bold text-sm">Elena Rodriguez</h3>
                            <p className="text-[10px] font-bold text-on-surface-variant/75 mt-0.5">Global Talent Lead</p>
                          </div>
                        </div>
                        <button onClick={() => showToast('Options expanded.', 'info')} className="text-on-surface-variant hover:text-primary p-1 cursor-pointer">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </div>
                      <div className="space-y-3 mb-6 text-xs text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant font-medium">Department</span>
                          <span className="font-bold text-primary">Sales &amp; Ops</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant font-medium">Office</span>
                          <span className="font-bold text-primary">London</span>
                        </div>
                        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-primary h-full rounded-full" style={{ width: '90%' }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase text-on-surface-variant/60">
                          <span>Workload: Critical</span>
                          <span>90% Capacity</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-4 border-y border-on-surface/5 mb-6 text-center">
                        <div>
                          <p className="text-headline-sm font-bold text-primary text-[18px]">18</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/75 uppercase mt-0.5">Jobs</p>
                        </div>
                        <div>
                          <p className="text-headline-sm font-bold text-primary text-[18px]">94</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/75 uppercase mt-0.5">Cand.</p>
                        </div>
                        <div>
                          <p className="text-headline-sm font-bold text-primary text-[18px]">5</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/75 uppercase mt-0.5">Intvw.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => showToast('Opening profile sheet for Elena Rodriguez.', 'info')}
                        className="w-full py-2.5 rounded-xl bg-surface hover:bg-primary hover:text-white text-primary font-label-md text-label-md transition-all duration-200 border border-primary/5 cursor-pointer"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Table View mode */
                  <div className="overflow-x-auto bg-white rounded-2xl border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)]">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-surface border-b border-on-surface/8 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                          <th className="px-6 py-4">Employee ID</th>
                          <th className="px-6 py-4">Recruiter</th>
                          <th className="px-6 py-4">Dept / Role</th>
                          <th className="px-6 py-4 text-center">Jobs</th>
                          <th className="px-6 py-4 text-center">Cand.</th>
                          <th className="px-6 py-4 text-center">Hires</th>
                          <th className="px-6 py-4">Response Time</th>
                          <th className="px-6 py-4">Rating</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-on-surface/5 font-body-md text-xs font-semibold text-on-surface-variant">
                        <tr className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="px-6 py-4 text-on-surface-variant">#RE-2941</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img className="w-8 h-8 rounded-full object-cover" alt="Sarah Jenkins" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbkO4BhOCsLkZf0ERNsj-6rt0xZU0f2NOOEXsF8QrtmkSaYnvlQTzC4qNG2n8beTs24Ugs9YEwcAmp0D_eGPOF76Tq4_gya0h0p-NADHedwyksQer8-eNXYBgEbfG_2ZwS74u-MTNfQw4Rv7vbm9uJaQFVLjIQ3sa0jbQYmM1pBdx9aZyXIJErMXZ0vn7YoYFQG37I_oTh58WJ_VXM5WBNbUzh4gyF5Kqfgo_CmXO_6yhPIv5lcZUmXXACuMe2LFCQlVI6V0JzKrM" />
                              <span className="font-bold text-primary">Sarah Jenkins</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-primary text-xs font-bold">Engineering</p>
                            <p className="text-[10px] text-on-surface-variant">Senior Lead</p>
                          </td>
                          <td className="px-6 py-4 text-center text-on-surface font-extrabold">12</td>
                          <td className="px-6 py-4 text-center text-on-surface font-extrabold">48</td>
                          <td className="px-6 py-4 text-center text-on-surface font-extrabold">144</td>
                          <td className="px-6 py-4">4.2h</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-0.5 text-primary font-bold">
                              <span className="material-symbols-outlined text-[16px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span>4.9</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Active</span>
                          </td>
                          <td className="px-6 py-4">
                            <button onClick={() => showToast('Action details expanded.', 'info')} className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer">more_vert</button>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="px-6 py-4 text-on-surface-variant">#RE-2942</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img className="w-8 h-8 rounded-full object-cover" alt="Marcus Chen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIjmKXVwHPGzSrC0uFxLwFnUnRHnRLh37G0t-grSuU6SQy8Ot2_DZ4zhU5gyOpsKDBaUoJMsmbBMCUgcpsok_uNjYfF3aLnkfKskH-AuCFFj8x9AUEg3zatPKSN8f-OTR5tR0Gzq-Bv1jU_TM6GyrBl8C6b5EVtsRM4pWvi22kZvEF4QDPguy2ClD-YDGTWa3nCbFd3Ph4YBpMKvT1FGKjmQaWiCkJYnxy19_FD3oCDXfIstE3GWyb1Uy-lxTBJGVJZ2EU3ie5zHA" />
                              <span className="font-bold text-primary">Marcus Chen</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-primary text-xs font-bold">Product</p>
                            <p className="text-[10px] text-on-surface-variant">Recruiter</p>
                          </td>
                          <td className="px-6 py-4 text-center text-on-surface font-extrabold">6</td>
                          <td className="px-6 py-4 text-center text-on-surface font-extrabold">22</td>
                          <td className="px-6 py-4 text-center text-on-surface font-extrabold">89</td>
                          <td className="px-6 py-4">12h</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-0.5 text-primary font-bold">
                              <span className="material-symbols-outlined text-[16px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span>4.7</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Active</span>
                          </td>
                          <td className="px-6 py-4">
                            <button onClick={() => showToast('Action details expanded.', 'info')} className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer">more_vert</button>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="px-6 py-4 text-on-surface-variant">#RE-3011</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img className="w-8 h-8 rounded-full object-cover" alt="Elena Rodriguez" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoYhd5YniuqYMLwIc5TCxBWW-1RaX2sFXceTkay8ME8086DmK4GYN3Wc3Y_WYvmsChb1AK-q5EeCvo75zDLnnF0gyZqCyZNanVSwUhCF1ZGeQbNYU03S-2fnq4xN7J1b0KbV3RfKznvnIGJn_7sThbe0j1xbGDDo-nW3gQjeN_-UqROp9raBiFRIbWfggX1rxPX2iBms2UFepcRSr6E13Mc0OI6HOhm8btBJ4FMFzpIB3rUnrbp9Gp2LZKUJ9kKsAVMgieE8bl-Yw" />
                              <span className="font-bold text-primary">Elena Rodriguez</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-primary text-xs font-bold">Sales &amp; Ops</p>
                            <p className="text-[10px] text-on-surface-variant">Lead Recruiter</p>
                          </td>
                          <td className="px-6 py-4 text-center text-on-surface font-extrabold">18</td>
                          <td className="px-6 py-4 text-center text-on-surface font-extrabold">94</td>
                          <td className="px-6 py-4 text-center text-on-surface font-extrabold">210</td>
                          <td className="px-6 py-4">2.1h</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-0.5 text-primary font-bold">
                              <span className="material-symbols-outlined text-[16px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span>5.0</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-bold rounded-lg uppercase tracking-wider">Away</span>
                          </td>
                          <td className="px-6 py-4">
                            <button onClick={() => showToast('Action details expanded.', 'info')} className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer">more_vert</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="px-6 py-4 border-t border-on-surface/5 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                      <p>Showing 1-3 of 54 recruiters</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => showToast('Already on first page.', 'info')} className="p-2 hover:bg-surface rounded-lg disabled:opacity-30 cursor-pointer" disabled>
                          <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button type="button" className="p-1 px-3 bg-primary/10 text-primary font-bold rounded-lg text-xs">1</button>
                        <button type="button" onClick={() => showToast('Pagination is simulated.', 'info')} className="p-2 hover:bg-surface rounded-lg cursor-pointer">2</button>
                        <button type="button" onClick={() => showToast('Pagination is simulated.', 'info')} className="p-2 hover:bg-surface rounded-lg cursor-pointer">3</button>
                        <button type="button" onClick={() => showToast('Pagination is simulated.', 'info')} className="p-2 hover:bg-surface rounded-lg cursor-pointer">
                          <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Panels */}
              <div className="w-full xl:w-80 space-y-6">
                {/* AI Performance Insights */}
                <div className="bg-primary text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group text-left">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[20px] text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <h3 className="font-headline-sm font-bold text-white text-md">AI Performance</h3>
                    </div>
                    <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 text-xs">
                      <p className="text-[9px] uppercase font-bold text-primary-fixed mb-1">Top Performer This Week</p>
                      <p className="font-extrabold text-white text-sm">Elena Rodriguez</p>
                      <p className="text-[10px] text-primary-fixed font-bold mt-0.5">+12% over target</p>
                    </div>
                    <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 text-xs">
                      <p className="text-[9px] uppercase font-bold text-primary-fixed mb-1">Hiring Forecast</p>
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-bold text-white">42 <span className="text-xs font-normal opacity-70">Hires</span></span>
                        <span className="px-2 py-0.5 bg-primary-fixed text-primary text-[9px] font-bold rounded uppercase">88% Conf.</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs font-semibold">
                      <p className="text-[10px] font-bold text-primary-fixed">Recs: Workload Balance</p>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                        <span>Offload 4 jobs from Jenkins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span>
                        <span>Assign Product Lead to Chen</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                    <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                  </div>
                </div>

                {/* High Workload Alerts */}
                <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-headline-sm font-bold text-primary text-sm">Alerts</h3>
                    <span className="px-2.5 py-0.5 bg-error/10 text-error text-[10px] font-bold rounded-full uppercase tracking-wider">3 CRITICAL</span>
                  </div>
                  <div className="space-y-4 text-xs font-semibold text-on-surface-variant">
                    <div className="flex gap-3 items-start pb-4 border-b border-on-surface/5">
                      <span className="material-symbols-outlined text-error mt-0.5 text-base">warning</span>
                      <div>
                        <p className="font-bold text-primary">Sarah Jenkins</p>
                        <p className="text-[10px] mt-0.5">Response time exceeded 24h threshold on 5 candidates.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start pb-2">
                      <span className="material-symbols-outlined text-error mt-0.5 text-base">group_remove</span>
                      <div>
                        <p className="font-bold text-primary">Elena Rodriguez</p>
                        <p className="text-[10px] mt-0.5">Capacity at 92%. Risks burnout. Recommendations available.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] text-left">
                  <h3 className="font-headline-sm font-bold text-primary text-sm mb-6">Recent Activity</h3>
                  <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-on-surface/10">
                    <div className="relative pl-8 text-xs font-semibold text-on-surface-variant">
                      <span className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white ring-1 ring-primary/20"></span>
                      <p className="font-bold text-primary">New Hire Success</p>
                      <p className="text-[11px] mt-0.5">Marcus Chen closed \'Senior UX Designer\' role in NYC.</p>
                      <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-wider">14m ago</p>
                    </div>
                    <div className="relative pl-8 text-xs font-semibold text-on-surface-variant">
                      <span className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white ring-1 ring-primary/20"></span>
                      <p className="font-bold text-primary">Team Expansion</p>
                      <p className="text-[11px] mt-0.5">David Kim joined the Engineering Recruiting team.</p>
                      <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-wider">2h ago</p>
                    </div>
                    <div className="relative pl-8 text-xs font-semibold text-on-surface-variant">
                      <span className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary/20 border-2 border-white ring-1 ring-primary/20"></span>
                      <p className="font-bold text-on-surface-variant">Permission Change</p>
                      <p className="text-[11px] mt-0.5">Admin updated \'Interviewer\' access for Sarah Jenkins.</p>
                      <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-wider">5h ago</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => showToast('Full recent team activities loaded.', 'info')}
                    className="w-full mt-6 text-center text-xs font-bold text-primary/60 hover:text-primary transition-colors cursor-pointer"
                  >
                    View All Activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8 text-left animate-slide-up">
            {/* Page Header & Actions */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-8">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-primary mb-1 font-bold">Reports Center</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Generate, analyze, export, and schedule recruitment reports across the organization.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  type="button"
                  onClick={() => showToast('Exporting all organization reports...', 'success')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-all font-label-md text-xs cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">ios_share</span> Export All
                </button>
                <button 
                  type="button"
                  onClick={() => showToast('Opening report scheduler...', 'info')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-all font-label-md text-xs cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span> Schedule Report
                </button>
                <button 
                  type="button"
                  onClick={() => showToast('Opening custom report builder...', 'info')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-container text-on-secondary-container font-label-md text-xs hover:opacity-95 transition-all cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span> Create Custom Report
                </button>
                <button 
                  type="button"
                  onClick={() => showToast('Generating comprehensive organization report...', 'success')}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-label-md text-xs hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">bar_chart</span> Generate Report
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-10">
              {/* Card 1 */}
              <div className="bg-surface border border-primary/5 p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] flex flex-col justify-between h-40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Reports</span>
                  <span className="text-error font-bold text-[10px] flex items-center gap-0.5">-2.4% <span className="material-symbols-outlined text-[12px]">trending_down</span></span>
                </div>
                <div className="text-headline-md font-bold text-primary mb-2">250</div>
                <div className="h-8 w-full overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path fill="none" strokeWidth={2} stroke="#ba1a1a" d="M0,30 Q10,10 20,25 T40,15 T60,35 T80,20 T100,30"></path>
                  </svg>
                </div>
              </div>
              {/* Card 2 */}
              <div className="bg-surface border border-primary/5 p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] flex flex-col justify-between h-40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Scheduled</span>
                  <span className="text-primary font-bold text-[10px] flex items-center gap-0.5">+12% <span className="material-symbols-outlined text-[12px]">trending_up</span></span>
                </div>
                <div className="text-headline-md font-bold text-primary mb-2">100</div>
                <div className="h-8 w-full overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path fill="none" strokeWidth={2} stroke="#3a6757" d="M0,35 Q20,10 40,25 T70,15 T100,5"></path>
                  </svg>
                </div>
              </div>
              {/* Card 3 */}
              <div className="bg-surface border border-primary/5 p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] flex flex-col justify-between h-40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">This Month</span>
                  <span className="text-primary font-bold text-[10px] flex items-center gap-0.5">+5% <span className="material-symbols-outlined text-[12px]">trending_up</span></span>
                </div>
                <div className="text-headline-md font-bold text-primary mb-2">45</div>
                <div className="h-8 w-full overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path fill="none" strokeWidth={2} stroke="#3a6757" d="M0,25 L20,30 L40,10 L60,20 L80,15 L100,5"></path>
                  </svg>
                </div>
              </div>
              {/* Card 4 */}
              <div className="bg-surface border border-primary/5 p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] flex flex-col justify-between h-40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Downloads</span>
                  <span className="text-primary font-bold text-[10px] flex items-center gap-0.5">+18% <span className="material-symbols-outlined text-[12px]">trending_up</span></span>
                </div>
                <div className="text-headline-md font-bold text-primary mb-2">1.2k</div>
                <div className="h-8 w-full overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path fill="none" strokeWidth={2} stroke="#3a6757" d="M0,38 L10,32 L30,35 L50,15 L70,25 L90,10 L100,5"></path>
                  </svg>
                </div>
              </div>
              {/* Card 5 */}
              <div className="bg-surface border border-primary/5 p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] flex flex-col justify-between h-40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Shared</span>
                  <span className="text-on-surface-variant font-bold text-[10px] flex items-center gap-0.5">0% <span className="material-symbols-outlined text-[12px]">horizontal_rule</span></span>
                </div>
                <div className="text-headline-md font-bold text-primary mb-2">88</div>
                <div className="h-8 w-full overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path fill="none" strokeWidth={2} stroke="#717975" d="M0,20 L100,20"></path>
                  </svg>
                </div>
              </div>
              {/* Card 6 */}
              <div className="bg-surface border border-primary/5 p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] flex flex-col justify-between h-40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Avg. Gen Time</span>
                  <span className="text-primary font-bold text-[10px] flex items-center gap-0.5">-0.4s <span className="material-symbols-outlined text-[12px]">trending_down</span></span>
                </div>
                <div className="text-headline-md font-bold text-primary mb-2">1.2s</div>
                <div className="h-8 w-full overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path fill="none" strokeWidth={2} stroke="#3a6757" d="M0,10 Q25,35 50,10 T100,30"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Template Library Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Report Templates</h2>
                <button 
                  type="button"
                  onClick={() => showToast('Displaying all 12 preset templates...', 'info')}
                  className="text-primary font-label-md flex items-center gap-1 hover:underline text-xs cursor-pointer font-bold"
                >
                  View All Templates <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {([
                  { icon: 'person_search', name: 'Recruitment', desc: 'Sourcing efficacy and funnel conversion metrics across all channels.', last: '2h ago' },
                  { icon: 'group_add', name: 'Hiring', desc: 'New hire velocity and time-to-productivity database reports.', last: '5h ago' },
                  { icon: 'video_chat', name: 'Interview', desc: 'Panel efficiency and candidate feedback structured logs.', last: '1d ago' },
                  { icon: 'monitoring', name: 'Recruiter Performance', desc: 'Individual and team KPIs across the hiring cycle.', last: '3h ago' },
                  { icon: 'psychology', name: 'Candidate Analytics', desc: 'Behavioral trends and demographic profiles reports.', last: '4h ago' },
                  { icon: 'domain', name: 'Department Analytics', desc: 'Department-specific budget and vacancy ratios.', last: '6h ago' },
                  { icon: 'school', name: 'University Sourcing', desc: 'Campus recruitment pipelines and intern ratios.', last: '1w ago' },
                  { icon: 'diversity_3', name: 'Diversity & Inclusion', desc: 'DEI initiative tracking and candidate pipeline logs.', last: '2d ago' }
                ] as const).map((temp, index) => (
                  <div key={index} className="bg-surface p-6 rounded-2xl border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] hover:border-primary transition-all flex flex-col group text-left">
                    <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-[26px]">{temp.icon}</span>
                    </div>
                    <h3 className="font-bold text-sm text-primary mb-2">{temp.name}</h3>
                    <p className="text-xs text-on-surface-variant font-semibold flex-grow mb-6 leading-relaxed">{temp.desc}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 mt-auto">
                      <span className="text-[10px] text-on-surface-variant/80 font-bold">Last: {temp.last}</span>
                      <button 
                        type="button"
                        onClick={() => showToast(`Generating ${temp.name} report template...`, 'success')}
                        className="bg-primary/5 text-primary px-3 py-1.5 rounded-lg font-label-md text-[11px] font-bold hover:bg-primary hover:text-white transition-all cursor-pointer"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Library Table Card */}
            <div className="bg-white rounded-2xl border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] overflow-hidden">
              <div className="p-6 border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low/10">
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Report Library</h2>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                    <input 
                      type="text"
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-background w-full sm:w-60" 
                      placeholder="Search reports library..." 
                    />
                  </div>
                  <select 
                    value={selectedReportCategory}
                    onChange={(e) => setSelectedReportCategory(e.target.value)}
                    className="bg-white border border-outline-variant/30 rounded-xl text-xs font-bold py-2 px-3 focus:ring-1 focus:ring-primary text-on-background outline-none cursor-pointer"
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Hiring">Hiring</option>
                    <option value="Diversity">Diversity</option>
                    <option value="University">University</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low border-b border-outline-variant/30">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Report Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Format</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Schedule</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {([
                      { id: 1, name: 'Q3 Engineering Hiring Pipeline', date: 'Oct 12, 2023', category: 'Hiring', creator: 'Jane Doe', creatorInitials: 'JD', format: 'PDF', schedule: 'Weekly', status: 'Completed' },
                      { id: 2, name: 'DEI Quarterly Audit', date: 'Oct 10, 2023', category: 'Diversity', creator: 'Alex Chen', creatorInitials: 'AC', format: 'XLS', schedule: 'None', status: 'Processing' },
                      { id: 3, name: 'Campus Recruiting Funnel', date: 'Oct 05, 2023', category: 'University', creator: 'Mike Smith', creatorInitials: 'MS', format: 'CSV', schedule: 'Monthly', status: 'Failed' }
                    ] as const)
                    .filter(rep => {
                      const matchesCategory = selectedReportCategory === 'All Categories' || rep.category === selectedReportCategory;
                      const matchesSearch = rep.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || rep.category.toLowerCase().includes(reportSearchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    })
                    .map(rep => (
                      <tr key={rep.id} className="hover:bg-surface-container-low/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-primary">{rep.name}</span>
                            <span className="text-[10px] text-on-surface-variant/80 mt-0.5">Last: {rep.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-on-surface">{rep.category}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container text-[10px] flex items-center justify-center font-bold">
                              {rep.creatorInitials}
                            </div>
                            <span className="text-xs font-semibold text-on-surface">{rep.creator}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant text-[10px] font-extrabold rounded-lg">
                            {rep.format}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs text-on-surface-variant font-semibold">
                            <span className="material-symbols-outlined text-[16px]">repeat</span> {rep.schedule}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold ${
                            rep.status === 'Completed' ? 'bg-primary/10 text-primary' : 
                            rep.status === 'Processing' ? 'bg-secondary-container text-on-secondary-container' : 
                            'bg-error-container text-error'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              rep.status === 'Completed' ? 'bg-primary' : 
                              rep.status === 'Processing' ? 'bg-on-secondary-container animate-pulse' : 
                              'bg-error'
                            }`}></span> {rep.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            type="button"
                            onClick={() => showToast(`Options for ${rep.name} opened.`, 'info')}
                            className="p-1 hover:bg-outline-variant/20 rounded-full text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">more_vert</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-low/10">
                <span className="text-[10px] font-bold text-on-surface-variant">Showing 3 of 250 reports</span>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => showToast('Previous table page.', 'info')}
                    className="p-1.5 border border-outline-variant/20 rounded-xl hover:bg-surface-container transition-all cursor-pointer text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => showToast('Next table page.', 'info')}
                    className="p-1.5 border border-outline-variant/20 rounded-xl hover:bg-surface-container transition-all cursor-pointer text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <EmployerSettings />
        )}

        {activeTab === 'notifications' && (
          <EmployerNotifications />
        )}

        {activeTab === 'help' && (
          <EmployerHelpCenter />
        )}
      </ContentContainer>

      {/* MODAL OVERLAYS */}

      {/* 1. Post a New Job Modal */}
      <Modal isOpen={isPostJobOpen} onClose={() => setIsPostJobOpen(false)} title="Post a New Job Listing" icon="work">
        <form onSubmit={handlePostJob} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Job Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Lead Software Engineer"
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Department</label>
              <select
                value={newJobDept}
                onChange={(e) => setNewJobDept(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none font-semibold text-on-background"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Hiring Recruiter</label>
              <input
                type="text"
                required
                value={newJobRecruiter}
                onChange={(e) => setNewJobRecruiter(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Description Summary</label>
            <textarea
              rows={3}
              placeholder="Summarize the core requirements and responsibilities..."
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-background"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <SecondaryButton onClick={() => setIsPostJobOpen(false)} className="flex-1">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="flex-1">
              Publish Role
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 2. Join Meet Simulation Modal */}
      <Modal isOpen={isJoinMeetOpen} onClose={() => setIsJoinMeetOpen(false)} title="Meet Room: Software Engineer Technical Screen" icon="videocam" size="xl">
        <div className="flex flex-col md:flex-row relative bg-[#1a1c1b] rounded-2xl overflow-hidden min-h-[400px]">
          {/* Main Candidate Video Stream */}
          <div className="flex-grow bg-[#000] relative flex items-center justify-center min-h-[300px]">
            <img
              className="w-full h-full object-cover opacity-80"
              alt="Candidate Live Feed"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQfLF8bCNOX8-bdfGA25V0Gp3uXrhge3ZXUfAUF0ML01iNy4MMrbJZ85wvacWM1RmAq_tsFg6CcMPDqYx4pJc5wadGGz9te4-3GUjFClIKe1vuMREcfaQe1MspepJOtwTlVxDibYH5XU1506AbDZzKbMXGPng5_kI6-e9W18GrvJddUlW1Iev4qDwhrwnbtQnwcTKA1BydRcE0NViO318jmkeQ2btxk_nxuy_5Fe88X9NEXaMFtW8s2qzAW3slblPUNdlqAVA4Iuk"
            />
            <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-md text-[10px] font-bold text-white">
              Alex Chen (Stanford Candidate)
            </div>
            
            {/* Self Stream Miniature */}
            <div className="absolute bottom-4 right-4 w-28 h-20 bg-[#2e312f] rounded-lg border border-white/20 overflow-hidden">
              <img
                className="w-full h-full object-cover"
                alt="Self View"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8fmbPNnHwpWMvZM-T2CWemc-SutIEbVz9atkohzfjK2mywkEapmyc5xnvkFpItib9oV27Rk8xuwjHZM8weXGjQPyCsMU4n60Xl3h05YztHTsBr1-xOFJ2H1ZebRjN6biLoVtI4aTL6CD-fScV-GmkG4Wn4wKiGDuZocI-tHndOkhT53rvl6askVESS4fD3T8tFgWbaGihWr1G5nIIz-KoAkc-s1nl6e-vby-Wj-pF2RSBHwT2Xv1ADmLS8WKWF6sek7hIR6jsvWg"
              />
              <div className="absolute bottom-1 left-1 bg-black/60 text-[7px] px-1 rounded text-white">You</div>
            </div>
          </div>

          {/* Sidebar Interview Checklist */}
          <div className="w-full md:w-64 bg-[#2e312f] border-t md:border-t-0 md:border-l border-white/10 p-4 text-left space-y-4 flex flex-col text-white">
            <p className="font-extrabold text-[10px] uppercase tracking-wider text-primary-fixed">ATS Evaluator</p>
            <div className="flex-grow space-y-3 overflow-y-auto">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-white">Suggested Question:</p>
                <p className="text-xs text-white/80 italic leading-relaxed">
                  "Alex, how did you structure state synchronization in your NextJS projects?"
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-white/70">Evaluation Checkpoints:</p>
                <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-white/20 text-primary focus:ring-0 w-3.5 h-3.5" />
                  React 19 Re-render Knowledge
                </label>
                <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                  <input type="checkbox" className="rounded border-white/20 text-primary focus:ring-0 w-3.5 h-3.5" />
                  Database Query Optimization
                </label>
              </div>
            </div>
            <button
              onClick={() => { setIsJoinMeetOpen(false); showToast('Interview session concluded and saved.', 'success'); }}
              className="w-full py-2 bg-error text-white font-bold rounded-xl text-xs hover:opacity-95 transition-all text-center cursor-pointer"
            >
              End Meeting
            </button>
          </div>
        </div>
      </Modal>

      {/* 3. Resume Preview Modal */}
      <Modal isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} title="Candidate Resume Analyzer" icon="description" size="lg">
        {selectedCandidate && (
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-surface-container pb-4 text-left">
              <img alt={selectedCandidate.name} className="w-16 h-16 rounded-full object-cover" src={selectedCandidate.avatar} />
              <div>
                <h4 className="font-bold text-lg text-primary">{selectedCandidate.name}</h4>
                <p className="text-xs text-on-surface-variant font-semibold">{selectedCandidate.university} · {selectedCandidate.location}</p>
                <p className="text-[10px] text-primary font-bold mt-1 bg-primary/5 px-2.5 py-0.5 rounded-full w-fit">
                  ATS Score Match: {selectedCandidate.score}/10 ({selectedCandidate.matchRate}%)
                </p>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Educational Context</p>
                <p className="text-xs font-semibold text-on-background mt-1">
                  B.S. Computer Science and Design • Graduation Year: 2026
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Skills &amp; Expertise</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedCandidate.skills.map(s => (
                    <StatusBadge key={s} label={s} variant="pill" />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Project Experience Summary</p>
                <ul className="list-disc pl-4 text-xs font-semibold text-on-surface-variant space-y-1.5 mt-1 leading-relaxed">
                  <li>Led frontend UI optimization for a collegiate Fintech portal, decreasing layout shift metrics by 90%.</li>
                  <li>Designed virtualized lists in React 19 to handle high-frequency concurrent status updates.</li>
                  <li>Integrated AWS deployment workflows using ECS container staging setups.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 border-t border-surface-container pt-4">
              <PrimaryButton
                onClick={() => { setIsResumeOpen(false); handleOpenMessage(selectedCandidate); }}
                className="flex-1 py-3"
              >
                Contact Candidate
              </PrimaryButton>
              <SecondaryButton
                onClick={() => { setIsResumeOpen(false); showToast('Resume PDF downloaded.', 'success'); }}
                className="px-6 py-3"
              >
                Download PDF
              </SecondaryButton>
            </div>
          </div>
        )}
      </Modal>

      {/* 4. Chat Dialog Modal fallback */}
      {isMessageOpen && selectedCandidate && activeTab !== 'messaging' && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-3xl shadow-2xl border border-primary/10 overflow-hidden z-50 flex flex-col h-[400px] animate-slide-up">
          <div className="px-4 py-3 bg-primary text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <img alt={selectedCandidate.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white/10" src={selectedCandidate.avatar} />
              <p className="font-bold text-xs text-white">{selectedCandidate.name}</p>
            </div>
            <button onClick={() => setIsMessageOpen(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-white">
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-2.5 rounded-2xl text-[11px] font-semibold ${
                  chat.sender === 'me' ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-container-low text-on-background rounded-tl-none'
                }`}>
                  <p>{chat.text}</p>
                  <span className="block text-[7px] mt-0.5 text-right opacity-70">{chat.time}</span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-surface-container flex gap-2 shrink-0 bg-surface">
            <input
              type="text"
              placeholder="Type message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-grow px-3 py-1.5 border border-outline-variant/40 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-background bg-white"
            />
            <PrimaryButton type="submit" className="px-4 py-1.5 text-[10px]">
              Send
            </PrimaryButton>
          </form>
        </div>
      )}

      {/* 5. Talent Audit Modal */}
      <Modal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} title="AI Talent Audit" icon="auto_awesome">
        {auditProgress < 100 ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/15 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-primary">Analyzing pipeline credentials and matching database metrics...</p>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${auditProgress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <h4 className="font-bold text-sm text-primary">Lumina Systems Audit Report</h4>
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3 text-xs font-semibold text-on-surface-variant">
              <div className="flex justify-between border-b border-primary/5 pb-2">
                <span>Total Active Candidates Analysed</span>
                <span className="text-primary font-bold">128</span>
              </div>
              <div className="flex justify-between border-b border-primary/5 pb-2">
                <span>Average Suitability Score</span>
                <span className="text-primary font-bold">8.7 / 10</span>
              </div>
              <div className="flex justify-between">
                <span>Key Talent Sourcing Origin</span>
                <span className="text-primary font-bold">Stanford &amp; MIT (75%)</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Audit Insights:</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Sourcing matches indicate excellent designer profiles, but frontend roles have a gap in cloud certifications. Recommend sponsoring an AWS training program for incoming candidates to increase retention by 22%.
              </p>
            </div>
            <div className="flex gap-2 border-t border-surface-container pt-4">
              <PrimaryButton onClick={() => setIsAuditOpen(false)} className="flex-1 py-3">
                Done
              </PrimaryButton>
              <SecondaryButton onClick={() => showToast('Audit PDF downloaded.', 'success')} className="px-4 py-3">
                Export PDF
              </SecondaryButton>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. Edit Cover URL Modal */}
      <Modal isOpen={isCoverEditOpen} onClose={() => setIsCoverEditOpen(false)} title="Edit Cover Banner">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (coverUrlInput.trim()) {
              setCompanyCover(coverUrlInput.trim());
              setIsCoverEditOpen(false);
              showToast('Cover banner updated.', 'success');
            }
          }}
          className="space-y-4 text-left"
        >
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Cover Image URL</label>
            <input
              type="url"
              required
              value={coverUrlInput}
              onChange={(e) => setCoverUrlInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-background"
            />
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setIsCoverEditOpen(false)} className="flex-1 py-2.5">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="flex-1 py-2.5">
              Save Banner
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 7. Edit Logo URL Modal */}
      <Modal isOpen={isLogoEditOpen} onClose={() => setIsLogoEditOpen(false)} title="Edit Company Logo">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (logoUrlInput.trim()) {
              setCompanyLogo(logoUrlInput.trim());
              setIsLogoEditOpen(false);
              showToast('Company logo updated.', 'success');
            }
          }}
          className="space-y-4 text-left"
        >
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Logo Image URL</label>
            <input
              type="url"
              required
              value={logoUrlInput}
              onChange={(e) => setLogoUrlInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-background"
            />
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setIsLogoEditOpen(false)} className="flex-1 py-2.5">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="flex-1 py-2.5">
              Save Logo
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 8. Add Tech Modal */}
      <Modal isOpen={isAddingTech} onClose={() => setIsAddingTech(false)} title="Add Technology Tag">
        <form onSubmit={handleAddTech} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Technology Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Docker"
              value={newTechInput}
              onChange={(e) => setNewTechInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-background"
            />
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setIsAddingTech(false)} className="flex-1 py-2.5">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="flex-1 py-2.5">
              Add Tag
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 9. Upload Media Modal */}
      <Modal isOpen={isUploadingMedia} onClose={() => setIsUploadingMedia(false)} title="Upload Culture Media">
        <form onSubmit={handleAddMedia} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Culture Photo URL</label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/..."
              value={mediaUrlInput}
              onChange={(e) => setMediaUrlInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-background"
            />
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setIsUploadingMedia(false)} className="flex-1 py-2.5">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="flex-1 py-2.5">
              Append Image
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 10. Edit Office Location Modal */}
      <Modal isOpen={isEditingLocation && selectedLocation !== null} onClose={() => { setIsEditingLocation(false); setSelectedLocation(null); }} title={`Edit Office: ${selectedLocation?.name}`}>
        {selectedLocation && (
          <form onSubmit={handleSaveLocation} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Office Name</label>
              <input
                type="text"
                required
                value={selectedLocation.name}
                onChange={(e) => setSelectedLocation({ ...selectedLocation, name: e.target.value })}
                className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary text-on-background"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Area / Subheading</label>
              <input
                type="text"
                required
                value={selectedLocation.description}
                onChange={(e) => setSelectedLocation({ ...selectedLocation, description: e.target.value })}
                className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary text-on-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Employees count</label>
                <input
                  type="number"
                  required
                  value={selectedLocation.employees}
                  onChange={(e) => setSelectedLocation({ ...selectedLocation, employees: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary text-on-background"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Type Label</label>
                <input
                  type="text"
                  placeholder="e.g. HQ"
                  value={selectedLocation.type}
                  onChange={(e) => setSelectedLocation({ ...selectedLocation, type: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary text-on-background"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <SecondaryButton onClick={() => { setIsEditingLocation(false); setSelectedLocation(null); }} className="flex-1 py-2.5">
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" className="flex-1 py-2.5">
                Save Office Details
              </PrimaryButton>
            </div>
          </form>
        )}
      </Modal>

      {/* 11. Adjust Goals Modal */}
      <Modal isOpen={isAdjustingGoals} onClose={() => setIsAdjustingGoals(false)} title="Adjust Monthly Sourcing Goals">
        <form onSubmit={handleSaveGoals} className="space-y-5 text-left">
          <div>
            <div className="flex justify-between items-center mb-1 text-xs font-bold text-on-surface-variant">
              <span>Screening Goal Target</span>
              <span>{monthlyGoals.screenedTarget} Applicants</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={monthlyGoals.screenedTarget}
              onChange={(e) => setMonthlyGoals({ ...monthlyGoals, screenedTarget: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 text-xs font-bold text-on-surface-variant">
              <span>Outreach Goal Target</span>
              <span>{monthlyGoals.outreachTarget} Events</span>
            </div>
            <input
              type="range"
              min={2}
              max={50}
              step={1}
              value={monthlyGoals.outreachTarget}
              onChange={(e) => setMonthlyGoals({ ...monthlyGoals, outreachTarget: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <SecondaryButton onClick={() => setIsAdjustingGoals(false)} className="flex-1 py-2.5">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="flex-1 py-2.5">
              Save Goals
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 12. Edit Basic Info Modal */}
      <Modal isOpen={isEditingBasicInfo} onClose={() => setIsEditingBasicInfo(false)} title="Edit Company Details">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            setIsEditingBasicInfo(false);
            showToast('Company details updated.', 'success');
          }}
          className="space-y-4 text-left"
        >
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">Company Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyNameText(e.target.value)}
              className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary text-on-background"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">HQ Location</label>
            <input
              type="text"
              required
              value={companyLocation}
              onChange={(e) => setCompanyLocation(e.target.value)}
              className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary text-on-background"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">Industry</label>
            <input
              type="text"
              required
              value={companyIndustry}
              onChange={(e) => setCompanyIndustry(e.target.value)}
              className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:ring-1 focus:ring-primary text-on-background"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <SecondaryButton onClick={() => setIsEditingBasicInfo(false)} className="flex-1 py-2.5">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="flex-1 py-2.5">
              Save Changes
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 13. Job Preview Drawer */}
      <Drawer 
        isOpen={isJobDrawerOpen && selectedDrawerJob !== null} 
        onClose={() => setIsJobDrawerOpen(false)} 
        title="Job Preview"
        size="md"
      >
        {selectedDrawerJob && (
          <div className="space-y-6 text-left">
            <div>
              <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">Job Title</p>
              <h3 className="text-lg font-bold text-primary">{selectedDrawerJob.title}</h3>
              <p className="text-xs text-on-surface-variant font-bold mt-1">{selectedDrawerJob.department} · {selectedDrawerJob.location || 'Remote'}</p>
            </div>
            
            <section className="space-y-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Job Summary</h4>
              <div className="space-y-2.5 text-xs font-semibold text-on-surface">
                <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl border border-primary/5">
                  <span className="text-on-surface-variant font-medium">Salary Range</span>
                  <span className="font-bold text-primary">{selectedDrawerJob.salaryRange || '$140k - $185k'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl border border-primary/5">
                  <span className="text-on-surface-variant font-medium">Work Model</span>
                  <span className="font-bold text-primary">{selectedDrawerJob.workModel || 'Hybrid (3 days/wk)'}</span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Hiring Timeline</h4>
              <div className="space-y-5 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-primary/10">
                {(selectedDrawerJob.timeline || [
                  { step: 1, name: 'Initial Screen', status: 'Completed • 42 Candidates' },
                  { step: 2, name: 'Portfolio Review', status: 'In Progress • 12 Candidates' }
                ]).map((t, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                      {t.step}
                    </div>
                    <p className="font-bold text-primary text-sm">{t.name}</p>
                    <p className="text-xs text-on-surface-variant">{t.status}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Recent Applications</h4>
                <button 
                  type="button"
                  onClick={() => { setIsJobDrawerOpen(false); setActiveTab('candidates'); }}
                  className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2.5">
                {(selectedDrawerJob.recentApplicants || [
                  { initials: 'AJ', name: 'Alex Johnson', time: 'Applied 2h ago', match: 94, color: 'bg-primary-fixed text-primary' },
                  { initials: 'ML', name: 'Maya Lin', time: 'Applied 5h ago', match: 82, color: 'bg-secondary-fixed text-secondary' }
                ]).map((cand, idx) => (
                  <div key={idx} className="p-3 rounded-2xl border border-primary/5 bg-surface-container-low hover:bg-white hover:shadow-md transition-all flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl ${cand.color} flex items-center justify-center font-bold text-xs`}>
                      {cand.initials}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-primary text-xs">{cand.name}</p>
                      <p className="text-[9px] text-on-surface-variant/75">{cand.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-primary">{cand.match}% Match</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-primary/5">
              <SecondaryButton 
                onClick={() => showToast(`Edit action triggered for ${selectedDrawerJob.title}`, 'info')}
                className="py-2.5"
              >
                Edit Job
              </SecondaryButton>
              <PrimaryButton 
                onClick={() => { setIsJobDrawerOpen(false); setActiveTab('candidates'); }}
                className="py-2.5"
              >
                Manage Candidates
              </PrimaryButton>
            </div>
          </div>
        )}
      </Drawer>
    </EmployerLayout>
  );
};

export default EmployerDashboard;
