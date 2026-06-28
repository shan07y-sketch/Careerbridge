import type { Student, Job, Application, Company, Recruiter, Mentor, Interview, Event, Message, Thread, Notification, CareerInsight, InterviewReport } from '../types';

export const mockStudent: Student = {
  id: 'student_1',
  name: 'Alex Rivera',
  email: 'alex.rivera@mit.edu',
  university: 'Massachusetts Institute of Technology',
  degree: 'B.S. Computer Science & Engineering',
  gradYear: 2026,
  profilePicture: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1Z06J7OeckxCu3w8L1VBcSX5Hoao7qMW6lvtD6G8HSaxxX8GAQMJn-lNYIwZF1s_gsD6pi8mPtbMBHI_U-QQMsQdhr2Fd_e2-B8BSbQWrWipFZfPbpARcXsUCpqHdjOYI2CesC9HcETnQE8l2UkJYSYMuwHrO_4sO8t0GHsrl1gebTXdzXvFkyvLDXngAIzIfZlnhHIqGLkw1x9bgCGFZUbepArFI3fBBsr4qVvP6bs3HQ1ju1Nnp22MOhzDaMfu9m6g7ix_7Cd8',
  careerGoal: 'Software Engineer (Frontend/AI)',
  workMode: 'Hybrid',
  preferredLocation: 'San Francisco, CA; New York, NY; Boston, MA',
  skills: [
    { name: 'React / TypeScript', level: 95 },
    { name: 'SQL & Database Design', level: 70 },
    { name: 'Python & Machine Learning', level: 60 },
    { name: 'Soft Skills (Leadership)', level: 85 },
  ],
  resumeUrl: '/documents/alex_rivera_resume.pdf',
  portfolioUrl: 'https://alexrivera.dev',
  resumeScore: 82,
  readinessScore: 87,
  linkedInConnected: true,
  gitHubConnected: true,
  phoneVerified: true,
  emailVerified: true
};

export const mockCompanies: Company[] = [
  {
    id: 'google',
    name: 'Google',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD4sxf9TKcCHmJJjuvI_cIzrPgAf0cor30KbIkRkFaTchfRrOLj_0FojbMIwPgswto8Scn7nJzteNEl2k0IwZS-swoN_wgDbd5oFLc6u4gbkeRiMxrTF11Jh0BHAHIDmafyVcsU9julP0ZqJJvUY3H5xzXlKoXMHFjqNMrdO1ZmJX9zx5mJxfevfDr575eIb5QMv00iKuXUznXPY0Ut_JjRYn0e7f-7rknIQ1_xsq8_m_o_sBzHzp8Yq1sowtUPDBUXz7joJA6HY8',
    banner: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAay2bI53s3YVtZTX184CV-znKidv9pfhuGCy95XbXL21YSzenkJExrStcZSjmpoOWnpfGibROsIPEcpkEB2xlVKJFKLxAYdRtOgTK7c-Qy8YITBw_OiiCafWxmc_4v7l3mdOZogJLZgDfkXJ4KY6piBugELiL76E9WyrIRONJzqVugmFpYCErDiHBJUi9XOAc8zGQh9YqixYuFz95mZ_TjKeJ2pvPNyMhd11-Z__Gyjjh_E6yVwvbC5T3Jb6-6AbGH70ffH52sIm0',
    employeeCount: '100,000+',
    location: 'Mountain View, CA (HQ) • Worldwide',
    industry: 'Technology / Internet',
    description: 'Googles mission is to organize the worlds information and make it universally accessible and useful. We work on cutting edge projects in search, hardware, cloud computing, artificial intelligence, and operating systems.',
    culturePhotos: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAay2bI53s3YVtZTX184CV-znKidv9pfhuGCy95XbXL21YSzenkJExrStcZSjmpoOWnpfGibROsIPEcpkEB2xlVKJFKLxAYdRtOgTK7c-Qy8YITBw_OiiCafWxmc_4v7l3mdOZogJLZgDfkXJ4KY6piBugELiL76E9WyrIRONJzqVugmFpYCErDiHBJUi9XOAc8zGQh9YqixYuFz95mZ_TjKeJ2pvPNyMhd11-Z__Gyjjh_E6yVwvbC5T3Jb6-6AbGH70ffH52sIm0',
    ],
    openJobsCount: 12,
    rating: 4.8,
    website: 'https://careers.google.com'
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArxwRzHs5-ak-P6Uozf-sjDmb0mDNlNrLHwTYKBJTs32qxDEgYGaqbNUfjc3_K8meMDN9D5k16hXRyeUn-d2zfeUQ8lBLrCXSZ6VWWGJ84VwSu9cKD-rHNT_CBqjIBOrMvFUknA__6FK_sKorqwcBP4SWRZ32W27TKt96kwZK8Tcc_c1Eecjp3Clyh2zwFzO8SDGpegTM1vrc4RHq7d89Uk7SOjEULMlVTvkw47Ue1593N3D0O9qsr7UpkqXgnv89SHydsUs4j038',
    banner: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAay2bI53s3YVtZTX184CV-znKidv9pfhuGCy95XbXL21YSzenkJExrStcZSjmpoOWnpfGibROsIPEcpkEB2xlVKJFKLxAYdRtOgTK7c-Qy8YITBw_OiiCafWxmc_4v7l3mdOZogJLZgDfkXJ4KY6piBugELiL76E9WyrIRONJzqVugmFpYCErDiHBJUi9XOAc8zGQh9YqixYuFz95mZ_TjKeJ2pvPNyMhd11-Z__Gyjjh_E6yVwvbC5T3Jb6-6AbGH70ffH52sIm0',
    employeeCount: '220,000+',
    location: 'Redmond, WA (HQ) • Remote Friendly',
    industry: 'Technology / Cloud & Productivity',
    description: 'Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge. Its mission is to empower every person and every organization on the planet to achieve more.',
    culturePhotos: [],
    openJobsCount: 8,
    rating: 4.7,
    website: 'https://careers.microsoft.com'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    logo: 'https://logo.clearbit.com/stripe.com',
    banner: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAay2bI53s3YVtZTX184CV-znKidv9pfhuGCy95XbXL21YSzenkJExrStcZSjmpoOWnpfGibROsIPEcpkEB2xlVKJFKLxAYdRtOgTK7c-Qy8YITBw_OiiCafWxmc_4v7l3mdOZogJLZgDfkXJ4KY6piBugELiL76E9WyrIRONJzqVugmFpYCErDiHBJUi9XOAc8zGQh9YqixYuFz95mZ_TjKeJ2pvPNyMhd11-Z__Gyjjh_E6yVwvbC5T3Jb6-6AbGH70ffH52sIm0',
    employeeCount: '8,000+',
    location: 'San Francisco, CA • Remote',
    industry: 'Financial Technology',
    description: 'Stripe is a financial infrastructure platform for the internet. Millions of companies—from the worlds largest enterprises to the most ambitious startups—use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.',
    culturePhotos: [],
    openJobsCount: 5,
    rating: 4.6,
    website: 'https://stripe.com/jobs'
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    logo: 'https://logo.clearbit.com/nvidia.com',
    banner: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAay2bI53s3YVtZTX184CV-znKidv9pfhuGCy95XbXL21YSzenkJExrStcZSjmpoOWnpfGibROsIPEcpkEB2xlVKJFKLxAYdRtOgTK7c-Qy8YITBw_OiiCafWxmc_4v7l3mdOZogJLZgDfkXJ4KY6piBugELiL76E9WyrIRONJzqVugmFpYCErDiHBJUi9XOAc8zGQh9YqixYuFz95mZ_TjKeJ2pvPNyMhd11-Z__Gyjjh_E6yVwvbC5T3Jb6-6AbGH70ffH52sIm0',
    employeeCount: '29,000+',
    location: 'Santa Clara, CA • Hybrid',
    industry: 'Semiconductor / Artificial Intelligence',
    description: 'NVIDIA pioneered accelerated computing to tackle challenges no one else can solve. Our work in AI, graphics, and supercomputing is redefining industries from gaming to scientific visualization and autonomous driving.',
    culturePhotos: [],
    openJobsCount: 15,
    rating: 4.9,
    website: 'https://careers.nvidia.com'
  }
];

export const mockJobs: Job[] = [
  {
    id: 'job_google_frontend',
    title: 'Frontend Developer',
    companyId: 'google',
    companyName: 'Google',
    companyLogo: mockCompanies[0].logo,
    location: 'Mountain View, CA',
    postedTime: '2h ago',
    rating: 4.8,
    salaryRange: '$145k - $190k',
    type: 'Full-time',
    workMode: 'Hybrid',
    matchRate: 98,
    easyApply: true,
    description: 'We are looking for a Frontend Engineer with a passion for designing and building highly scalable, responsive, and polished web applications. You will work with React, TypeScript, and modern styling utilities to create intuitive user interfaces.',
    requirements: [
      'B.S. or M.S. in Computer Science or related fields',
      'Strong proficiency in React, TypeScript, and CSS layouts',
      'Experience with modern build configurations (Webpack, Vite)',
      'Excellent collaborative skills and attention to detail'
    ],
    responsibilities: [
      'Design, build, and optimize core web frontend views',
      'Collaborate with designers and backend teams to integrate RESTful/GraphQL endpoints',
      'Write clean, accessible, and thoroughly tested UI components'
    ],
    urgency: 'high',
    experienceRequired: '2+ Yrs Exp',
    benefits: ['Comprehensive Medical/Dental/Vision', '401(k) with 5% Match', 'Annual Wellness Stipend ($1,500)', 'Free On-site Gourmet Meals'],
    applicantsCount: 148,
    aiMatchExplanation: 'Matches 95% of React/TypeScript capabilities listed on your profile and aligns with preferred location.',
    skillsMatchSummary: ['React', 'TypeScript', 'Vite', 'Responsive layouts'],
    preferredSkills: ['Next.js', 'PostCSS', 'Component Testing'],
    technologies: ['React 19', 'TypeScript', 'Vite', 'PostCSS', 'Vitest'],
    reportingManager: 'Dr. Evelyn Smith (Engineering Director)',
    teamInfo: 'Google Cloud Workspace UI Integration Squad',
    hiringStages: ['1. Resume Screen & ATS Match', '2. Live Frontend Coding Panel (60m)', '3. System Architecture Deep-dive', '4. Behavioral & Culture Fit'],
    companyOverview: 'Google is a global technology pioneer specializing in search systems, cloud resources, hardware products, and machine learning structures.',
    officeLocations: ['Mountain View, CA', 'San Francisco, CA', 'New York, NY'],
    recruiterName: 'Jordan Lee',
    recruiterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdHqAlh7hSx2-wTQEWiGk3qvrGIaN6skh1V09HnEi-7MPasJrX1sN-h55M__i29klAryXx8yvPOqSnJccXzxOJIHshryi7YUL1pHCLP1eYp6oQWY33FTG_vaj-vU567uolKQxQURAGO6-ntV_IpCE7blc3nO0x-t4FwCmog1kiCHjqkxxCGMv6maWybbNYM5eql_uMGenJdwwtN9dzyXFdT_veXoX_Mbf6DRsu6dDvcxYEWL2YV5Boyd2p9RJkn_s6fK3IRrmoD-Y',
    deadline: 'July 20, 2026'
  },
  {
    id: 'job_microsoft_swe',
    title: 'Software Engineer',
    companyId: 'microsoft',
    companyName: 'Microsoft',
    companyLogo: mockCompanies[1].logo,
    location: 'Redmond, WA',
    postedTime: '5h ago',
    rating: 4.7,
    salaryRange: '$130k - $175k',
    type: 'Full-time',
    workMode: 'Remote',
    matchRate: 92,
    easyApply: true,
    description: 'Join the Azure developer platform team. You will be responsible for creating robust developer tools, microservices, and web experiences that empower developers globally.',
    requirements: [
      'Experience with TypeScript, React, and Node.js backend services',
      'Familiarity with cloud hosting services (Azure/AWS)',
      'Understanding of microservice architecture and database modeling'
    ],
    responsibilities: [
      'Maintain and extend core platform features',
      'Participate in code reviews and code architecture iterations',
      'Perform root-cause diagnostics and debug production issues'
    ],
    urgency: 'medium',
    experienceRequired: '1+ Yrs Exp',
    benefits: ['Full Health Coverage', 'Microsoft Stock Purchase Plan', 'Learning Budget ($2,000/yr)', 'Home Office Upgrade Allowance'],
    applicantsCount: 82,
    aiMatchExplanation: 'Matches your experience with asynchronous state synchronization and state management.',
    skillsMatchSummary: ['TypeScript', 'React', 'Git workflow'],
    preferredSkills: ['Azure Cloud', 'Docker', 'RESTful API Integration'],
    technologies: ['TypeScript', 'React', 'Node.js', 'Azure', 'CosmosDB'],
    reportingManager: 'Marcus Sterling (Principal SWE Lead)',
    teamInfo: 'Azure Developer Tools and Sandbox Experience Group',
    hiringStages: ['1. Resume shortlisting', '2. Live algorithm sandbox (45m)', '3. Team-fit structural interview', '4. Offer review call'],
    companyOverview: 'Microsoft empowers digital transformations with intelligent cloud networks, business automation, and developer ecosystems.',
    officeLocations: ['Redmond, WA', 'Seattle, WA', 'Boston, MA'],
    recruiterName: 'Sarah Jenkins',
    recruiterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAooeaKR0AI_Pj4jiksFauxBttFRYblf1bZZ7vrKE1KQHac20lHxjl3odxy2AoPj3ki7vzgmagPxoNTveOqi_m3l8P7W1hMlQ4FrL3wUAJIseJTv2809m81KQhp2BJ1y_uLeZn5jur2uJ33BNlxwIZfCSfzE_2CQlqlODKC29lZOV91Q4bWREOTumkVNTVzKiqZQ_2C6czp3XcxSnuDDrAbIQ-N7OIzeFmds7D4I22kg7GQNO_OUK5fbuxNFR1-1BhVyGowLCB1ZTM',
    deadline: 'July 18, 2026'
  },
  {
    id: 'job_stripe_swe',
    title: 'Software Engineer - Billing APIs',
    companyId: 'stripe',
    companyName: 'Stripe',
    companyLogo: mockCompanies[2].logo,
    location: 'San Francisco, CA',
    postedTime: '1d ago',
    rating: 4.6,
    salaryRange: '$150k - $200k',
    type: 'Full-time',
    workMode: 'Remote',
    matchRate: 85,
    easyApply: false,
    description: 'Help Stripe build the payment billing API of tomorrow. You will build and support APIs processed by millions of vendors globally.',
    requirements: [
      'Deep knowledge of backend technologies (Ruby, Go, Java, or Python)',
      'Strong system design foundations',
      'Familiarity with payment systems or banking standards is a plus'
    ],
    responsibilities: [
      'Build secure, highly available API endpoints',
      'Write comprehensive integration tests',
      'Collaborate on public API design standards'
    ],
    urgency: 'low',
    experienceRequired: '3+ Yrs Exp',
    benefits: ['Full Medical, Dental, and Vision', 'Stripe Equity Options', 'Yearly Learning & Fitness Stipend ($2,500)', 'Generous Parental Leave'],
    applicantsCount: 215,
    aiMatchExplanation: 'Matches system design components, though your profile is more frontend-focused.',
    skillsMatchSummary: ['System Design', 'APIs Design', 'Unit Testing'],
    preferredSkills: ['Ruby on Rails', 'Go Lang', 'PostgreSQL'],
    technologies: ['Ruby', 'Go', 'PostgreSQL', 'Docker', 'AWS'],
    reportingManager: 'Jordan Lee (Billing PM Lead)',
    teamInfo: 'Stripe Global Payments & Recurring Subscriptions Engine',
    hiringStages: ['1. Technical Screening', '2. Systems design check', '3. Pair programming exercise', '4. Executive review'],
    companyOverview: 'Stripe builds financial technology infrastructure for internet billing, e-commerce collections, and online banking gates.',
    officeLocations: ['San Francisco, CA', 'New York, NY', 'Dublin, IE'],
    recruiterName: 'Jordan Lee',
    recruiterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdHqAlh7hSx2-wTQEWiGk3qvrGIaN6skh1V09HnEi-7MPasJrX1sN-h55M__i29klAryXx8yvPOqSnJccXzxOJIHshryi7YUL1pHCLP1eYp6oQWY33FTG_vaj-vU567uolKQxQURAGO6-ntV_IpCE7blc3nO0x-t4FwCmog1kiCHjqkxxCGMv6maWybbNYM5eql_uMGenJdwwtN9dzyXFdT_veXoX_Mbf6DRsu6dDvcxYEWL2YV5Boyd2p9RJkn_s6fK3IRrmoD-Y',
    deadline: 'July 30, 2026'
  },
  {
    id: 'job_nvidia_ai',
    title: 'Senior AI Engineer',
    companyId: 'nvidia',
    companyName: 'NVIDIA',
    companyLogo: mockCompanies[3].logo,
    location: 'Santa Clara, CA',
    postedTime: '3d ago',
    rating: 4.9,
    salaryRange: '$180k - $240k',
    type: 'Full-time',
    workMode: 'Hybrid',
    matchRate: 94,
    easyApply: false,
    description: 'Implement GPU-accelerated neural networks and custom transformer modeling to accelerate next-generation software features.',
    requirements: [
      'PhD or equivalent in Machine Learning, Computer Science, or Mathematics',
      'Strong python coding skills and PyTorch expertise',
      'Understanding of GPU memory architecture optimization'
    ],
    responsibilities: [
      'Train, evaluate, and compress deep learning models',
      'Integrate pipeline operations with Triton inference server',
      'Author scientific code contributions and benchmark performance metrics'
    ],
    urgency: 'high',
    experienceRequired: '5+ Yrs Exp',
    benefits: ['Nvidia ESPP & Stock Options', 'Top-tier Health Coverage', 'Unlimited PTO', 'Flexible Hybrid Work Model'],
    applicantsCount: 310,
    aiMatchExplanation: 'Matches Python/Machine Learning expertise, and builds upon high engineering capability score.',
    skillsMatchSummary: ['Python', 'Machine Learning', 'CUDA optimization'],
    preferredSkills: ['TensorFlow', 'C++', 'Neural Architecture Search'],
    technologies: ['Python', 'PyTorch', 'CUDA', 'Triton Server', 'Docker'],
    reportingManager: 'Dr. Jane Ho (AI Chief Scientist)',
    teamInfo: 'Deep Learning Inference Optimization and CUDA Frameworks',
    hiringStages: ['1. Paper Review & Resume Screen', '2. Live algorithm coding session', '3. CUDA Deep-dive panel', '4. VP Executive Interview'],
    companyOverview: 'NVIDIA pioneer accelerated computing hardware, custom neural network pipelines, and AI supercomputing infrastructure.',
    officeLocations: ['Santa Clara, CA', 'Austin, TX', 'Remote (US)'],
    recruiterName: 'Sarah Jenkins',
    recruiterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAooeaKR0AI_Pj4jiksFauxBttFRYblf1bZZ7vrKE1KQHac20lHxjl3odxy2AoPj3ki7vzgmagPxoNTveOqi_m3l8P7W1hMlQ4FrL3wUAJIseJTv2809m81KQhp2BJ1y_uLeZn5jur2uJ33BNlxwIZfCSfzE_2CQlqlODKC29lZOV91Q4bWREOTumkVNTVzKiqZQ_2C6czp3XcxSnuDDrAbIQ-N7OIzeFmds7D4I22kg7GQNO_OUK5fbuxNFR1-1BhVyGowLCB1ZTM',
    deadline: 'Aug 05, 2026'
  }
];

export const mockApplications: Application[] = [
  {
    id: 'app_1',
    jobId: 'job_google_frontend',
    status: 'interviewing',
    dateApplied: '2026-06-15',
    jobTitle: 'Frontend Developer',
    companyName: 'Google',
    companyLogo: mockCompanies[0].logo,
    timeline: [
      { stage: 'Applied', date: 'June 15, 2026', description: 'Resume submitted and parsed successfully', active: false },
      { stage: 'Screening Call', date: 'June 18, 2026', description: 'Brief 30m screening call with recruiter Jordan Lee', active: false },
      { stage: 'Technical Panel', date: 'July 02, 2026', description: '60m coding round focusing on React re-renders and virtual lists', active: true }
    ],
    recruiterName: 'Jordan Lee',
    recruiterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdHqAlh7hSx2-wTQEWiGk3qvrGIaN6skh1V09HnEi-7MPasJrX1sN-h55M__i29klAryXx8yvPOqSnJccXzxOJIHshryi7YUL1pHCLP1eYp6oQWY33FTG_vaj-vU567uolKQxQURAGO6-ntV_IpCE7blc3nO0x-t4FwCmog1kiCHjqkxxCGMv6maWybbNYM5eql_uMGenJdwwtN9dzyXFdT_veXoX_Mbf6DRsu6dDvcxYEWL2YV5Boyd2p9RJkn_s6fK3IRrmoD-Y',
    expectedResponseDate: 'July 05, 2026',
    applicationScore: 98,
    requiredAction: 'Complete React 19 performance optimizations checklist',
    missingDocuments: ['Unofficial transcript copy'],
    activityLog: [
      { action: 'Resume parsed and uploaded', time: 'June 15, 10:00 AM' },
      { action: 'Recruiter review completed', time: 'June 17, 02:40 PM' },
      { action: 'Technical panel scheduled', time: 'June 18, 04:15 PM' }
    ]
  },
  {
    id: 'app_2',
    jobId: 'job_microsoft_swe',
    status: 'interviewing',
    dateApplied: '2026-06-18',
    jobTitle: 'Software Engineer',
    companyName: 'Microsoft',
    companyLogo: mockCompanies[1].logo,
    timeline: [
      { stage: 'Applied', date: 'June 18, 2026', description: 'Resume submitted through MIT portal', active: false },
      { stage: 'HR Phone Check', date: 'June 22, 2026', description: 'Verification of work format and location preferences', active: false },
      { stage: 'System Coding', date: 'July 10, 2026', description: 'Algorithm screening session covering asynchronous loops', active: true }
    ],
    recruiterName: 'Sarah Jenkins',
    recruiterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAooeaKR0AI_Pj4jiksFauxBttFRYblf1bZZ7vrKE1KQHac20lHxjl3odxy2AoPj3ki7vzgmagPxoNTveOqi_m3l8P7W1hMlQ4FrL3wUAJIseJTv2809m81KQhp2BJ1y_uLeZn5jur2uJ33BNlxwIZfCSfzE_2CQlqlODKC29lZOV91Q4bWREOTumkVNTVzKiqZQ_2C6czp3XcxSnuDDrAbIQ-N7OIzeFmds7D4I22kg7GQNO_OUK5fbuxNFR1-1BhVyGowLCB1ZTM',
    expectedResponseDate: 'July 14, 2026',
    applicationScore: 92,
    requiredAction: 'Practice mock algorithm rounds in Mock Interview Room',
    missingDocuments: [],
    activityLog: [
      { action: 'Submitted application', time: 'June 18, 09:12 AM' },
      { action: 'Location check passed', time: 'June 22, 11:30 AM' }
    ]
  },
  {
    id: 'app_3',
    jobId: 'job_stripe_swe',
    status: 'applied',
    dateApplied: '2026-06-20',
    jobTitle: 'Software Engineer - Billing APIs',
    companyName: 'Stripe',
    companyLogo: mockCompanies[2].logo,
    timeline: [
      { stage: 'Applied', date: 'June 20, 2026', description: 'Application received and waiting for recruiter check', active: true }
    ],
    recruiterName: 'Jordan Lee',
    recruiterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdHqAlh7hSx2-wTQEWiGk3qvrGIaN6skh1V09HnEi-7MPasJrX1sN-h55M__i29klAryXx8yvPOqSnJccXzxOJIHshryi7YUL1pHCLP1eYp6oQWY33FTG_vaj-vU567uolKQxQURAGO6-ntV_IpCE7blc3nO0x-t4FwCmog1kiCHjqkxxCGMv6maWybbNYM5eql_uMGenJdwwtN9dzyXFdT_veXoX_Mbf6DRsu6dDvcxYEWL2YV5Boyd2p9RJkn_s6fK3IRrmoD-Y',
    expectedResponseDate: 'July 01, 2026',
    applicationScore: 85,
    requiredAction: 'Add payments portfolio references',
    missingDocuments: [],
    activityLog: [
      { action: 'Application submitted', time: 'June 20, 04:30 PM' }
    ]
  }
];

export const mockRecruiters: Recruiter[] = [
  {
    id: 'rec_jordan',
    name: 'Jordan Lee',
    companyId: 'stripe',
    companyName: 'Stripe',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdHqAlh7hSx2-wTQEWiGk3qvrGIaN6skh1V09HnEi-7MPasJrX1sN-h55M__i29klAryXx8yvPOqSnJccXzxOJIHshryi7YUL1pHCLP1eYp6oQWY33FTG_vaj-vU567uolKQxQURAGO6-ntV_IpCE7blc3nO0x-t4FwCmog1kiCHjqkxxCGMv6maWybbNYM5eql_uMGenJdwwtN9dzyXFdT_veXoX_Mbf6DRsu6dDvcxYEWL2YV5Boyd2p9RJkn_s6fK3IRrmoD-Y',
    bio: 'Senior Technical Recruiter at Stripe. Passionate about linking aspiring university engineers with challenging payments infrastructure roles.',
    activeJobs: ['job_stripe_swe'],
    email: 'jordan.lee@stripe.com',
    phone: '+1 (415) 555-0192'
  }
];

export const mockMentors: Mentor[] = [
  {
    id: 'mentor_sarah',
    name: 'Sarah Jenkins',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAooeaKR0AI_Pj4jiksFauxBttFRYblf1bZZ7vrKE1KQHac20lHxjl3odxy2AoPj3ki7vzgmagPxoNTveOqi_m3l8P7W1hMlQ4FrL3wUAJIseJTv2809m81KQhp2BJ1y_uLeZn5jur2uJ33BNlxwIZfCSfzE_2CQlqlODKC29lZOV91Q4bWREOTumkVNTVzKiqZQ_2C6czp3XcxSnuDDrAbIQ-N7OIzeFmds7D4I22kg7GQNO_OUK5fbuxNFR1-1BhVyGowLCB1ZTM',
    role: 'Senior Staff PM',
    companyName: 'Tesla',
    expertise: ['Product Management', 'Career Strategy', 'System Planning'],
    bio: 'PM leader with 10+ years in automotive tech and autonomous software stacks. Mentor to 50+ students on transitioning to product management.',
    rating: 4.9,
    reviewsCount: 38,
    availabilitySlots: [
      '2026-06-30T10:00:00Z',
      '2026-06-30T14:30:00Z',
      '2026-07-02T11:00:00Z'
    ]
  }
];

export const mockInterviews: Interview[] = [
  {
    id: 'int_1',
    jobId: 'job_nvidia_ai',
    jobTitle: 'Senior AI Engineer',
    companyName: 'NVIDIA',
    companyLogo: mockJobs[3].companyLogo,
    type: 'Technical',
    dateTime: 'Tomorrow, 10:00 AM',
    status: 'scheduled',
    readinessScore: 92,
    roomLink: 'https://meet.careerbridge.ai/nvidia-technical-int_1'
  },
  {
    id: 'int_2',
    jobId: 'job_microsoft_swe',
    jobTitle: 'Software Engineer',
    companyName: 'Microsoft',
    companyLogo: mockJobs[1].companyLogo,
    type: 'HR',
    dateTime: 'Friday, 14:30 PM',
    status: 'pending',
    readinessScore: 78
  }
];

export const mockEvents: Event[] = [
  {
    id: 'evt_sv_career_fair',
    title: 'Silicon Valley Career Fair',
    banner: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAay2bI53s3YVtZTX184CV-znKidv9pfhuGCy95XbXL21YSzenkJExrStcZSjmpoOWnpfGibROsIPEcpkEB2xlVKJFKLxAYdRtOgTK7c-Qy8YITBw_OiiCafWxmc_4v7l3mdOZogJLZgDfkXJ4KY6piBugELiL76E9WyrIRONJzqVugmFpYCErDiHBJUi9XOAc8zGQh9YqixYuFz95mZ_TjKeJ2pvPNyMhd11-Z__Gyjjh_E6yVwvbC5T3Jb6-6AbGH70ffH52sIm0',
    organizer: 'Silicon Valley Engineering Council',
    date: 'Oct 25, 2026 • 10:00 AM - 5:00 PM PST',
    location: 'San Jose Convention Center & Virtual',
    deadline: 'Oct 20, 2026',
    description: 'Connect with over 100 top technology companies recruiting for full-time and internship software engineering, hardware engineering, data science, and product management roles.',
    speakers: [
      { name: 'Dr. Evelyn Smith', role: 'Head of AI at Google Cloud', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAooeaKR0AI_Pj4jiksFauxBttFRYblf1bZZ7vrKE1KQHac20lHxjl3odxy2AoPj3ki7vzgmagPxoNTveOqi_m3l8P7W1hMlQ4FrL3wUAJIseJTv2809m81KQhp2BJ1y_uLeZn5jur2uJ33BNlxwIZfCSfzE_2CQlqlODKC29lZOV91Q4bWREOTumkVNTVzKiqZQ_2C6czp3XcxSnuDDrAbIQ-N7OIzeFmds7D4I22kg7GQNO_OUK5fbuxNFR1-1BhVyGowLCB1ZTM' },
      { name: 'Marcus Sterling', role: 'VPE at Microsoft', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdHqAlh7hSx2-wTQEWiGk3qvrGIaN6skh1V09HnEi-7MPasJrX1sN-h55M__i29klAryXx8yvPOqSnJccXzxOJIHshryi7YUL1pHCLP1eYp6oQWY33FTG_vaj-vU567uolKQxQURAGO6-ntV_IpCE7blc3nO0x-t4FwCmog1kiCHjqkxxCGMv6maWybbNYM5eql_uMGenJdwwtN9dzyXFdT_veXoX_Mbf6DRsu6dDvcxYEWL2YV5Boyd2p9RJkn_s6fK3IRrmoD-Y' },
      { name: 'Dr. Jane Ho', role: 'Chief Scientist at NVIDIA', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAooeaKR0AI_Pj4jiksFauxBttFRYblf1bZZ7vrKE1KQHac20lHxjl3odxy2AoPj3ki7vzgmagPxoNTveOqi_m3l8P7W1hMlQ4FrL3wUAJIseJTv2809m81KQhp2BJ1y_uLeZn5jur2uJ33BNlxwIZfCSfzE_2CQlqlODKC29lZOV91Q4bWREOTumkVNTVzKiqZQ_2C6czp3XcxSnuDDrAbIQ-N7OIzeFmds7D4I22kg7GQNO_OUK5fbuxNFR1-1BhVyGowLCB1ZTM' }
    ],
    remainingSeats: 12,
    totalSeats: 300,
    registered: false
  }
];

export const mockThreads: Thread[] = [
  {
    id: 'th_sarah_chen',
    participantId: 'rec_sarah_chen',
    participantName: 'Sarah Chen',
    participantAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwc6Lf-M0cP0Vcbc3NJCkuy3qJPK9FNFwhfD5voTf-zElldhQIwLtMJ32Ade_lsE_p0vDxmuwa9EL1ftnTfpUwjxhfYWHiwRpV2vlKVdlMHb_z6DrmUr20-HqvJUHkbMUiXPrwwJAQCc64qG6dH8cyylVBJfnVjL0ItgpGZcMqKgOWxZpu3m7nGEstxP794RMlb4B3aW8ZVjGmMU24xZhClLmdSl-GYW5hL1sPMXdVaPM2DjlFBgo9gjSbcOy4AS0peEj1B0-wZ8Y',
    participantRole: 'Tech Recruiter @ Stripe',
    lastMessage: 'Would you be available for a brief introductory call next Tuesday or Wednesday?',
    lastMessageTime: '10:25 AM',
    unreadCount: 0
  },
  {
    id: 'th_julian',
    participantId: 'mentor_julian',
    participantName: 'Dr. Julian V.',
    participantAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCi-YMv4A9vlXl2L8-c_UZYDxrAgE5JL39xUdCwflAo1kyMr25y-cbluKEqDBbZQfZlaNMYkqplXarPHs43KITZcgMUfiXvW-UV01YWbXGh5um202rVMfjRzW93No_eUwiig1JtKCkxlyeIE6r4IlG198MJEMyRHjrPGcCLWabBCWZKXkNl1Q6es9b_VnXKqzY98b_tfKmHL1hjODGePmNaKfVQRIU2e8DVZqSc4GFiAdxfs3mIa2Dl876j3NRayRWemY7N9d1w1Vs',
    participantRole: 'Senior Mentor @ CareerBridge',
    lastMessage: 'That\'s a great approach to the case study. Let\'s discuss...',
    lastMessageTime: 'Yesterday',
    unreadCount: 1
  },
  {
    id: 'th_marcus',
    participantId: 'designer_marcus',
    participantName: 'Marcus Thorne',
    participantAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwK7gcLcdKAtNUAwSXCopB7_e7_1m_sAVNEZ9PfXhX_R595iQsLP8hljQiq1HaRmrXNgZwZdPGZju2ny3YAXIZEEgQT9msIRGD7E7-hvg_zbFW_CPFzptOMXxnBpUXgILJZ1rtHk4s0YPqdCHmPh32JhxqODm9ZGQY-PIpIlKkFdrfCnCKgQLgSN3zlYyKTb5uxQPcNIaz9esg6t3mjtCMTLcU06N1bjT1LkJEZz5JbU7bKldaI0BOBlDiXkmvGe0LQXfDC_KLM1g',
    participantRole: 'Design Lead @ Canva',
    lastMessage: 'Sent you the Figma file for the collaborative project.',
    lastMessageTime: 'Tue',
    unreadCount: 0
  },
  {
    id: 'th_elena',
    participantId: 'vp_elena',
    participantName: 'Elena Rodriguez',
    participantAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsdToQapphi_FRVz7kBhaVF6nhTTnsqWMXZ7e78OkHNXTwsIVrbzOqX2GDrGsl2ToRqbQVfadgFNZtC-d6ZNwBpOPq7sqLCKwTvvMFk-yIp_C32-L7A8rXjzs4KHLd3wHa0YoCbK6NNZElPFgIpbVobHQqPaVp3C-DYGtZGIDH2HP9YqDydBb6MH8S4TSrks_7RZu9bnjBzf-ImDvgwuWZ9wGUmBi-vrYy0Xa59MnLBDdDEsrUgN-vlV7nNCz-gXkqkq29wcAoZrw',
    participantRole: 'VP Engineering @ Adobe',
    lastMessage: 'Thanks for the referral! I\'ll keep you posted on the progress.',
    lastMessageTime: 'Monday',
    unreadCount: 0
  }
];

export const mockMessages: Message[] = [
  {
    id: 'msg_1',
    senderId: 'rec_sarah_chen',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwc6Lf-M0cP0Vcbc3NJCkuy3qJPK9FNFwhfD5voTf-zElldhQIwLtMJ32Ade_lsE_p0vDxmuwa9EL1ftnTfpUwjxhfYWHiwRpV2vlKVdlMHb_z6DrmUr20-HqvJUHkbMUiXPrwwJAQCc64qG6dH8cyylVBJfnVjL0ItgpGZcMqKgOWxZpu3m7nGEstxP794RMlb4B3aW8ZVjGmMU24xZhClLmdSl-GYW5hL1sPMXdVaPM2DjlFBgo9gjSbcOy4AS0peEj1B0-wZ8Y',
    content: 'Hi there! I\'ve reviewed your portfolio and I\'m very impressed with the work you\'ve done for the Fintech dashboard. The user flow is exceptionally clean.',
    timestamp: '10:24 AM',
    threadId: 'th_sarah_chen',
    isRead: true
  },
  {
    id: 'msg_2',
    senderId: 'rec_sarah_chen',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwc6Lf-M0cP0Vcbc3NJCkuy3qJPK9FNFwhfD5voTf-zElldhQIwLtMJ32Ade_lsE_p0vDxmuwa9EL1ftnTfpUwjxhfYWHiwRpV2vlKVdlMHb_z6DrmUr20-HqvJUHkbMUiXPrwwJAQCc64qG6dH8cyylVBJfnVjL0ItgpGZcMqKgOWxZpu3m7nGEstxP794RMlb4B3aW8ZVjGmMU24xZhClLmdSl-GYW5hL1sPMXdVaPM2DjlFBgo9gjSbcOy4AS0peEj1B0-wZ8Y',
    content: 'Would you be available for a brief introductory call next Tuesday or Wednesday? We have some interesting Product Design openings that might be a great fit.',
    timestamp: '10:25 AM',
    threadId: 'th_sarah_chen',
    isRead: true
  },
  {
    id: 'msg_3',
    senderId: 'me',
    senderName: 'Alex Rivera',
    senderAvatar: '',
    content: 'Thank you so much, Sarah! I\'m glad you liked the Fintech project. Tuesday afternoon works perfectly for me. Shall we say 2:00 PM EST?',
    timestamp: '10:32 AM',
    threadId: 'th_sarah_chen',
    isRead: true
  },
  {
    id: 'msg_julian_1',
    senderId: 'mentor_julian',
    senderName: 'Dr. Julian V.',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCi-YMv4A9vlXl2L8-c_UZYDxrAgE5JL39xUdCwflAo1kyMr25y-cbluKEqDBbZQfZlaNMYkqplXarPHs43KITZcgMUfiXvW-UV01YWbXGh5um202rVMfjRzW93No_eUwiig1JtKCkxlyeIE6r4IlG198MJEMyRHjrPGcCLWabBCWZKXkNl1Q6es9b_VnXKqzY98b_tfKmHL1hjODGePmNaKfVQRIU2e8DVZqSc4GFiAdxfs3mIa2Dl876j3NRayRWemY7N9d1w1Vs',
    content: 'That\'s a great approach to the case study. Let\'s discuss the technical bottlenecks on our next mentoring session.',
    timestamp: 'Yesterday, 4:00 PM',
    threadId: 'th_julian',
    isRead: false
  },
  {
    id: 'msg_marcus_1',
    senderId: 'designer_marcus',
    senderName: 'Marcus Thorne',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwK7gcLcdKAtNUAwSXCopB7_e7_1m_sAVNEZ9PfXhX_R595iQsLP8hljQiq1HaRmrXNgZwZdPGZju2ny3YAXIZEEgQT9msIRGD7E7-hvg_zbFW_CPFzptOMXxnBpUXgILJZ1rtHk4s0YPqdCHmPh32JhxqODm9ZGQY-PIpIlKkFdrfCnCKgQLgSN3zlYyKTb5uxQPcNIaz9esg6t3mjtCMTLcU06N1bjT1LkJEZz5JbU7bKldaI0BOBlDiXkmvGe0LQXfDC_KLM1g',
    content: 'Sent you the Figma file for the collaborative project. Let me know what you think of the user landing flows!',
    timestamp: 'Tuesday, 11:15 AM',
    threadId: 'th_marcus',
    isRead: true
  },
  {
    id: 'msg_elena_1',
    senderId: 'vp_elena',
    senderName: 'Elena Rodriguez',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsdToQapphi_FRVz7kBhaVF6nhTTnsqWMXZ7e78OkHNXTwsIVrbzOqX2GDrGsl2ToRqbQVfadgFNZtC-d6ZNwBpOPq7sqLCKwTvvMFk-yIp_C32-L7A8rXjzs4KHLd3wHa0YoCbK6NNZElPFgIpbVobHQqPaVp3C-DYGtZGIDH2HP9YqDydBb6MH8S4TSrks_7RZu9bnjBzf-ImDvgwuWZ9wGUmBi-vrYy0Xa59MnLBDdDEsrUgN-vlV7nNCz-gXkqkq29wcAoZrw',
    content: 'Thanks for the referral! I\'ll keep you posted on the progress and let you know if we open any junior frontend headcounts.',
    timestamp: 'Monday, 2:10 PM',
    threadId: 'th_elena',
    isRead: true
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    type: 'interview',
    title: 'Interview Scheduled',
    content: 'Your technical interview with NVIDIA for the Senior AI Engineer role is confirmed for tomorrow at 10:00 AM PST.',
    time: '2h ago',
    isRead: false,
    isImportant: true,
    category: 'interview',
    priority: 'high',
    action: {
      label: 'Join Interview',
      link: '/student/interview/int_1'
    }
  },
  {
    id: 'notif_2',
    type: 'ai',
    title: '94% AI Job Match Found',
    content: 'Our AI analyzed Anthropic\'s new "Product Lead" opening and found it perfectly aligns with your experience in LLM deployments.',
    time: '4h ago',
    isRead: false,
    category: 'general',
    priority: 'medium',
    action: {
      label: 'View Job',
      link: '/student/jobs/job_stripe_swe'
    }
  },
  {
    id: 'notif_3',
    type: 'resume',
    title: 'Resume Analysis Complete',
    content: 'Your updated resume score has improved by +6%. We\'ve identified 3 more keywords you can add.',
    time: 'Yesterday, 1:45 PM',
    isRead: true,
    isCompleted: true,
    category: 'system',
    priority: 'low',
    action: {
      label: 'View Report',
      link: '/student/interview-report/rep_1'
    }
  },
  {
    id: 'notif_4',
    type: 'network',
    title: 'New Connection Invitation',
    content: 'Jordan Lee, Recruiter at Stripe, wants to connect with you.',
    time: 'Yesterday, 9:20 AM',
    isRead: true,
    category: 'network',
    priority: 'medium',
    action: {
      label: 'Accept',
      link: '/student/network'
    }
  }
];

export const mockCareerInsight: CareerInsight = {
  profileStrength: 92,
  careerReadiness: 87,
  resumeScore: 82,
  industryMatchPercent: 98,
  skillGaps: [
    { skill: 'Advanced React Patterns', difficulty: 'Intermediate', estTime: '4h', status: 'Completed', progress: 100 },
    { skill: 'SQL for Developers', difficulty: 'Intermediate', estTime: '6h', status: 'In Progress', progress: 70 },
    { skill: 'Practice DSA', difficulty: 'Advanced', estTime: '12h', status: 'Up Next', progress: 0 }
  ]
};

export const mockInterviewReport: InterviewReport = {
  id: 'rep_1',
  date: '2026-06-25',
  roleTitle: 'Frontend Developer',
  companyName: 'Google',
  overallScore: 86,
  metrics: {
    grammar: 90,
    pacing: 85,
    sentiment: 88,
    keywords: 80
  },
  transcript: [
    { speaker: 'AI', text: 'Hi Alex, welcome to your Google mock interview. Tell me about a time you resolved a complex CSS layout issue on a production app.', time: '0:05' },
    { speaker: 'Student', text: 'Thank you. On my last project, we noticed a cumulative layout shift on rendering dashboards. I analyzed the container hierarchy, set specific flex baselines, and implemented dynamic aspect-ratio layouts which stabilized UI positioning and decreased layout shifts by 90%.', time: '0:45' },
    { speaker: 'AI', text: 'Excellent. How did you structure your components for testing?', time: '1:50' }
  ],
  suggestions: [
    'Focus on using industry-standard naming metrics when explaining complex architectures.',
    'Increase your use of specific database indicators (e.g. explain queries latency times).',
    'Try to pace your responses slightly slower to achieve ideal speech scores.'
  ]
};
export const mockCareerReport = mockCareerInsight;
