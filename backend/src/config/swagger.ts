import swaggerJsdoc from 'swagger-jsdoc';

/**
 * CareerBridge - Complete OpenAPI 3.0 Specification
 * All endpoints are documented here explicitly (not via JSDoc scanning)
 * so that the spec is always accurate regardless of which files swagger-jsdoc
 * manages to parse on disk.
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CareerBridge API',
      version: '1.0.0',
      description: `
## CareerBridge – Career Success Platform

Complete REST API serving the Student, Employer, University, and Admin portals
backed by PostgreSQL via Prisma ORM. All endpoints return:

\`\`\`json
{ "success": true, "data": <payload>, "message": "..." }
\`\`\`

Authentication uses **JWT Bearer tokens** (access token) + **HttpOnly refresh-token cookie**.

### Roles
| Role | Portal |
|------|--------|
| STUDENT | Student Portal |
| EMPLOYER | Employer/Recruiter Portal |
| UNIVERSITY | University Placement Portal |
| ADMIN | Admin Operations Portal |
      `,
      contact: { name: 'CareerBridge Team', email: 'api@careerbridge.ai' }
    },
    servers: [
      { url: 'http://localhost:5000/api/v1', description: 'Development Server' },
      { url: 'https://api.careerbridge.ai/api/v1', description: 'Production Server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token obtained from POST /auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        PaginatedMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            companyId: { type: 'string' },
            companyName: { type: 'string' },
            companyLogo: { type: 'string' },
            location: { type: 'string' },
            salaryRange: { type: 'string' },
            type: { type: 'string', enum: ['Full-time', 'Part-time', 'Internship', 'Contract'] },
            workMode: { type: 'string', enum: ['Remote', 'Hybrid', 'On-site'] },
            matchRate: { type: 'integer' },
            description: { type: 'string' },
            requirements: { type: 'array', items: { type: 'string' } },
            responsibilities: { type: 'array', items: { type: 'string' } }
          }
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            jobId: { type: 'string' },
            status: { type: 'string', enum: ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'REJECTED', 'WITHDRAWN'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            logo: { type: 'string' },
            industry: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            employeeCount: { type: 'string' }
          }
        },
        StudentProfile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            preferredRole: { type: 'string', nullable: true },
            graduationYear: { type: 'integer', nullable: true }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            deadline: { type: 'string', format: 'date-time' },
            totalSeats: { type: 'integer' },
            remainingSeats: { type: 'integer' },
            registered: { type: 'boolean' }
          }
        },
        ResumeVersion: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fileName: { type: 'string' },
            fileUrl: { type: 'string' },
            status: { type: 'string', enum: ['PARSED', 'PROCESSING', 'FAILED'] },
            version: { type: 'integer' },
            isActive: { type: 'boolean' },
            extractedSkills: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        AICareerInsight: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            targetRole: { type: 'string' },
            readinessPercent: { type: 'integer' },
            summary: { type: 'string' },
            matchedSkills: { type: 'array', items: { type: 'string' } },
            missingSkills: { type: 'array', items: { type: 'string' } },
            roadmap: { type: 'array', items: { type: 'object' } },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Health', description: 'Platform health monitoring' },
      { name: 'Authentication', description: 'Register, login, logout, token refresh, password management' },
      { name: 'Student – Dashboard', description: 'Student portal home dashboard metrics' },
      { name: 'Student – Profile', description: 'Student profile read and update' },
      { name: 'Jobs & Companies', description: 'Public job board, saved jobs, company profiles, recruiters' },
      { name: 'Applications', description: 'Student job applications and offer responses' },
      { name: 'Resume', description: 'Resume upload, versioning, analysis, and sharing' },
      { name: 'Career AI', description: 'AI-powered career readiness insights and mock interview history' },
      { name: 'Mock Interview AI', description: 'Live AI mock interview session (start → answer → end)' },
      { name: 'Notifications', description: 'In-app notification management' },
      { name: 'Messages', description: 'Direct messaging between users' },
      { name: 'Events', description: 'Career fairs and events listings and registration' },
      { name: 'Network', description: 'Professional connection requests and management' },
      { name: 'Shared – Companies & Recruiters & Mentors', description: 'Public Company, Recruiter, and Mentor lookup endpoints' },
      { name: 'Employer – Dashboard', description: 'Recruiter dashboard metrics' },
      { name: 'Employer – Jobs', description: 'Create, manage, archive, and close job postings' },
      { name: 'Employer – Applications', description: 'Hiring pipeline: review, shortlist, reject, schedule interviews, extend offers' },
      { name: 'Employer – Analytics', description: 'Hiring funnel and pipeline analytics' },
      { name: 'Employer AI', description: 'AI candidate evaluation and comparison' },
      { name: 'University – Dashboard', description: 'University placement cell dashboard' },
      { name: 'University – Students', description: 'Student roster management and verification' },
      { name: 'University – Drives', description: 'Campus placement drive management' },
      { name: 'University – Analytics', description: 'Placement analytics and reports' },
      { name: 'University AI', description: 'AI placement predictions and drive recommendations' },
      { name: 'Admin – Users', description: 'User account management' },
      { name: 'Admin – Companies', description: 'Company verification and management' },
      { name: 'Admin – Universities', description: 'University verification and management' },
      { name: 'Admin – Platform', description: 'Announcements, feature flags, audit logs, sessions, support tickets' },
      { name: 'Admin AI', description: 'Admin AI intelligence reports' }
    ],
    paths: {
      // =====================
      // HEALTH
      // =====================
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Platform health check',
          security: [],
          responses: {
            200: { description: 'Platform is operational' }
          }
        }
      },

      // =====================
      // AUTHENTICATION
      // =====================
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user account',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'role'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    role: { type: 'string', enum: ['STUDENT', 'EMPLOYER', 'UNIVERSITY'] },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    universityName: { type: 'string' },
                    companyName: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'User registered successfully. Verification email sent.' },
            400: { description: 'Validation error or email already exists' }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login with email and password',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'student@example.com' },
                    password: { type: 'string', example: 'Password123!' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login successful. Returns access token and user info.' },
            401: { description: 'Invalid credentials' }
          }
        }
      },
      '/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout and revoke refresh token',
          responses: { 200: { description: 'Logged out successfully' } }
        }
      },
      '/auth/refresh': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token using HttpOnly refresh-token cookie',
          security: [],
          responses: {
            200: { description: 'New access token returned' },
            401: { description: 'Refresh token missing or revoked' }
          }
        }
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Request a password reset email',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string', format: 'email' } }
                }
              }
            }
          },
          responses: { 200: { description: 'Reset email sent if account exists' } }
        }
      },
      '/auth/reset-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Reset password with token from email link',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'password'],
                  properties: {
                    token: { type: 'string' },
                    password: { type: 'string', minLength: 8 }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Password reset successfully' } }
        }
      },
      '/auth/verify-email': {
        get: {
          tags: ['Authentication'],
          summary: 'Verify email address using link token',
          security: [],
          parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Email verified' }, 400: { description: 'Invalid or expired token' } }
        }
      },
      '/auth/resend-verification': {
        post: {
          tags: ['Authentication'],
          summary: 'Resend email verification link',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string', format: 'email' } }
                }
              }
            }
          },
          responses: { 200: { description: 'Verification email resent' } }
        }
      },
      '/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current authenticated user profile',
          responses: { 200: { description: 'Current user info' }, 401: { description: 'Unauthorized' } }
        }
      },
      '/auth/change-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Change password while authenticated',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword: { type: 'string', minLength: 8 }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Password changed successfully' }, 401: { description: 'Wrong current password' } }
        }
      },
      '/auth/check': {
        get: {
          tags: ['Authentication'],
          summary: 'Check authentication status (optional auth)',
          security: [],
          responses: { 200: { description: 'Auth status returned' } }
        }
      },

      // =====================
      // STUDENT DASHBOARD
      // =====================
      '/dashboard': {
        get: {
          tags: ['Student – Dashboard'],
          summary: 'Get student dashboard metrics',
          responses: { 200: { description: 'Dashboard data including stats, recent applications, upcoming interviews' } }
        }
      },

      // =====================
      // STUDENT PROFILE
      // =====================
      '/student/profile': {
        get: {
          tags: ['Student – Profile'],
          summary: 'Get current student profile',
          responses: { 200: { description: 'Student profile with skills, education, experience' } }
        },
        put: {
          tags: ['Student – Profile'],
          summary: 'Update student profile fields',
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, bio: { type: 'string' }, preferredRole: { type: 'string' } } }
              }
            }
          },
          responses: { 200: { description: 'Profile updated' } }
        }
      },
      '/student/profile/skills': {
        post: {
          tags: ['Student – Profile'],
          summary: 'Add a skill to student profile',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, level: { type: 'integer' } } } } } },
          responses: { 201: { description: 'Skill added' } }
        }
      },
      '/student/profile/skills/{skillId}': {
        delete: {
          tags: ['Student – Profile'],
          summary: 'Remove a skill from student profile',
          parameters: [{ name: 'skillId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Skill removed' } }
        }
      },

      // =====================
      // JOBS & COMPANIES
      // =====================
      '/jobs': {
        get: {
          tags: ['Jobs & Companies'],
          summary: 'List all published jobs with optional filters',
          security: [],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'companyId', in: 'query', schema: { type: 'string' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'workMode', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Paginated job list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { '$ref': '#/components/schemas/Job' } } } } } } } }
        }
      },
      '/jobs/saved': {
        get: {
          tags: ['Jobs & Companies'],
          summary: 'Get saved/bookmarked jobs for authenticated student',
          responses: { 200: { description: 'List of saved jobs' } }
        }
      },
      '/jobs/{id}': {
        get: {
          tags: ['Jobs & Companies'],
          summary: 'Get a single job posting by ID',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Job detail' }, 404: { description: 'Job not found' } }
        }
      },
      '/jobs/{id}/save': {
        post: {
          tags: ['Jobs & Companies'],
          summary: 'Toggle save/unsave a job (student)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Save status toggled', content: { 'application/json': { schema: { type: 'object', properties: { saved: { type: 'boolean' } } } } } } }
        }
      },
      '/companies': {
        get: {
          tags: ['Jobs & Companies'],
          summary: 'List all companies',
          security: [],
          responses: { 200: { description: 'Company list' } }
        }
      },
      '/companies/{id}': {
        get: {
          tags: ['Jobs & Companies'],
          summary: 'Get company profile by ID',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Company profile' }, 404: { description: 'Company not found' } }
        }
      },
      '/recruiters/{id}': {
        get: {
          tags: ['Shared – Companies & Recruiters & Mentors'],
          summary: 'Get recruiter by ID',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Recruiter profile' } }
        }
      },
      '/recruiters/company/{companyId}': {
        get: {
          tags: ['Shared – Companies & Recruiters & Mentors'],
          summary: 'Get first recruiter for a company',
          security: [],
          parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Recruiter or null' } }
        }
      },
      '/mentors': {
        get: {
          tags: ['Shared – Companies & Recruiters & Mentors'],
          summary: 'List all mentors',
          security: [],
          responses: { 200: { description: 'Mentor list' } }
        }
      },
      '/mentors/{id}': {
        get: {
          tags: ['Shared – Companies & Recruiters & Mentors'],
          summary: 'Get mentor by ID',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Mentor profile' } }
        }
      },

      // =====================
      // APPLICATIONS
      // =====================
      '/applications': {
        get: {
          tags: ['Applications'],
          summary: 'Get all applications for authenticated student',
          responses: { 200: { description: 'Application list with job and offer data' } }
        },
        post: {
          tags: ['Applications'],
          summary: 'Apply to a job',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['jobId'], properties: { jobId: { type: 'string' } } } } }
          },
          responses: { 201: { description: 'Application submitted' }, 409: { description: 'Already applied' } }
        }
      },
      '/applications/{id}': {
        get: {
          tags: ['Applications'],
          summary: 'Get a specific application with timeline',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Application detail' } }
        },
        delete: {
          tags: ['Applications'],
          summary: 'Retract/withdraw an application',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Application withdrawn' } }
        }
      },
      '/applications/{id}/offer/accept': {
        patch: {
          tags: ['Applications'],
          summary: 'Accept a job offer',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Offer accepted' } }
        }
      },
      '/applications/{id}/offer/decline': {
        patch: {
          tags: ['Applications'],
          summary: 'Decline a job offer',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Offer declined' } }
        }
      },

      // =====================
      // RESUME
      // =====================
      '/resume': {
        get: {
          tags: ['Resume'],
          summary: 'Get all resume versions for authenticated student',
          responses: { 200: { description: 'Resume version list' } }
        }
      },
      '/resume/upload': {
        post: {
          tags: ['Resume'],
          summary: 'Upload a new resume (PDF/DOC/DOCX, max 10MB)',
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { resume: { type: 'string', format: 'binary' } } } } }
          },
          responses: { 201: { description: 'Resume uploaded and queued for parsing' } }
        }
      },
      '/resume/{id}': {
        get: {
          tags: ['Resume'],
          summary: 'Get a specific resume version',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Resume version detail with analysis results' } }
        },
        delete: {
          tags: ['Resume'],
          summary: 'Delete a resume version',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Resume deleted' } }
        }
      },
      '/resume/{id}/download': {
        get: {
          tags: ['Resume'],
          summary: 'Download a resume file (binary response)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Resume file stream', content: { 'application/pdf': {} } } }
        }
      },
      '/resume/{id}/share': {
        post: {
          tags: ['Resume'],
          summary: 'Create a public share link for a resume',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Share link created', content: { 'application/json': { schema: { type: 'object', properties: { shareUrl: { type: 'string' }, shareExpiresAt: { type: 'string' } } } } } } }
        },
        delete: {
          tags: ['Resume'],
          summary: 'Revoke a resume share link',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Share link revoked' } }
        }
      },
      '/resume-share/{token}': {
        get: {
          tags: ['Resume'],
          summary: 'Public access to a shared resume via token (no auth required)',
          security: [],
          parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Shared resume file' }, 404: { description: 'Token not found or expired' } }
        }
      },

      // =====================
      // CAREER AI
      // =====================
      '/career/insights': {
        get: {
          tags: ['Career AI'],
          summary: 'Get latest AI career readiness insight for student',
          responses: { 200: { description: 'AI career insight or null', content: { 'application/json': { schema: { '$ref': '#/components/schemas/AICareerInsight' } } } } }
        }
      },
      '/career/insight': {
        post: {
          tags: ['Career AI'],
          summary: 'Generate a new AI career readiness insight',
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { targetRole: { type: 'string' } } } } }
          },
          responses: { 201: { description: 'New AI career insight generated and persisted' } }
        }
      },
      '/career/mock-interviews': {
        get: {
          tags: ['Career AI'],
          summary: 'Get student mock interview session history',
          responses: { 200: { description: 'List of completed mock interview reports' } }
        }
      },
      '/career/mock-interviews/{id}': {
        get: {
          tags: ['Career AI'],
          summary: 'Get a specific mock interview report',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Mock interview report detail' } }
        }
      },

      // =====================
      // MOCK INTERVIEW AI (Live Session)
      // =====================
      '/interview': {
        get: {
          tags: ['Mock Interview AI'],
          summary: 'Get all past mock interview sessions for authenticated student',
          responses: { 200: { description: 'Mock interview history' } }
        }
      },
      '/interview/{id}': {
        get: {
          tags: ['Mock Interview AI'],
          summary: 'Get a specific mock interview session detail',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Session detail with answers and scores' } }
        }
      },
      '/interview/start': {
        post: {
          tags: ['Mock Interview AI'],
          summary: 'Start a new AI mock interview session',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    targetRole: { type: 'string' },
                    numQuestions: { type: 'integer', default: 5 },
                    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Session started. Returns first question.' } }
        }
      },
      '/interview/{id}/answer': {
        post: {
          tags: ['Mock Interview AI'],
          summary: 'Submit an audio (+ optional video) answer clip for a question',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    audio: { type: 'string', format: 'binary', description: 'Audio clip (webm/wav/mp3/ogg)' },
                    video: { type: 'string', format: 'binary', description: 'Video clip (webm/mp4) – optional' },
                    questionIndex: { type: 'integer' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Answer evaluated. Returns score, feedback, and next question if any.' } }
        }
      },
      '/interview/{id}/end': {
        post: {
          tags: ['Mock Interview AI'],
          summary: 'End a mock interview session and generate final report',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Final report with overall score, transcript, and improvement suggestions' } }
        }
      },

      // =====================
      // NOTIFICATIONS
      // =====================
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get all notifications for authenticated user',
          responses: { 200: { description: 'Notification list, newest first' } }
        }
      },
      '/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark all notifications as read',
          responses: { 200: { description: 'All marked as read' } }
        }
      },
      '/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark a single notification as read',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Notification marked as read' } }
        }
      },
      '/notifications/{id}': {
        delete: {
          tags: ['Notifications'],
          summary: 'Delete a notification',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Notification deleted' } }
        }
      },

      // =====================
      // MESSAGES
      // =====================
      '/messages': {
        get: {
          tags: ['Messages'],
          summary: 'Get all conversations (threads) for authenticated user',
          responses: { 200: { description: 'Conversation list with last message preview' } }
        }
      },
      '/messages/start': {
        post: {
          tags: ['Messages'],
          summary: 'Start a new conversation with another user by profile ID',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['recipientProfileId'], properties: { recipientProfileId: { type: 'string' } } } } }
          },
          responses: { 201: { description: 'Conversation created or existing one returned' } }
        }
      },
      '/messages/{conversationId}': {
        get: {
          tags: ['Messages'],
          summary: 'Get all messages in a conversation',
          parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Message list' } }
        },
        post: {
          tags: ['Messages'],
          summary: 'Send a message in a conversation',
          parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } }
          },
          responses: { 201: { description: 'Message sent' } }
        }
      },

      // =====================
      // EVENTS
      // =====================
      '/events': {
        get: {
          tags: ['Events'],
          summary: 'List all active career events and fairs',
          security: [],
          responses: { 200: { description: 'Event list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { '$ref': '#/components/schemas/Event' } } } } } } } }
        }
      },
      '/events/{id}': {
        get: {
          tags: ['Events'],
          summary: 'Get a specific event by ID',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Event detail' }, 404: { description: 'Event not found' } }
        }
      },
      '/events/{id}/register': {
        post: {
          tags: ['Events'],
          summary: 'Register for an event (student)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Registered successfully' }, 409: { description: 'Already registered or no seats' } }
        },
        delete: {
          tags: ['Events'],
          summary: 'Unregister from an event',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Unregistered successfully' } }
        }
      },

      // =====================
      // NETWORK
      // =====================
      '/network/connections': {
        get: {
          tags: ['Network'],
          summary: 'Get all network connections for authenticated user',
          responses: { 200: { description: 'Connection list with status (PENDING/ACCEPTED)' } }
        }
      },
      '/network/connect': {
        post: {
          tags: ['Network'],
          summary: 'Send a connection request to another user',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['targetUserId'], properties: { targetUserId: { type: 'string' } } } } }
          },
          responses: { 201: { description: 'Connection request sent' }, 409: { description: 'Already connected or pending' } }
        }
      },
      '/network/connections/{id}/accept': {
        patch: {
          tags: ['Network'],
          summary: 'Accept a pending connection request',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Connection accepted' } }
        }
      },
      '/network/connections/{id}/decline': {
        patch: {
          tags: ['Network'],
          summary: 'Decline a pending connection request',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Connection declined' } }
        }
      },

      // =====================
      // AI HEALTH
      // =====================
      '/ai/health': {
        get: {
          tags: ['Career AI'],
          summary: 'Check AI provider connectivity status (Gemini)',
          responses: { 200: { description: 'AI provider status' } }
        }
      },

      // =====================
      // EMPLOYER – DASHBOARD
      // =====================
      '/employer/dashboard': {
        get: {
          tags: ['Employer – Dashboard'],
          summary: 'Get employer dashboard metrics',
          responses: { 200: { description: 'Job count, application funnel stats, recent activity' } }
        }
      },
      '/employer/company': {
        get: {
          tags: ['Employer – Dashboard'],
          summary: 'Get company profile for authenticated recruiter',
          responses: { 200: { description: 'Company profile' } }
        },
        put: {
          tags: ['Employer – Dashboard'],
          summary: 'Update company profile',
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Company profile updated' } }
        }
      },
      '/employer/recruiters': {
        get: {
          tags: ['Employer – Dashboard'],
          summary: 'List all recruiters for the company',
          responses: { 200: { description: 'Recruiter list' } }
        }
      },
      '/employer/recruiters/invite': {
        post: {
          tags: ['Employer – Dashboard'],
          summary: 'Invite a new recruiter to the company',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } } } },
          responses: { 201: { description: 'Invitation sent' } }
        }
      },

      // =====================
      // EMPLOYER – JOBS
      // =====================
      '/employer/jobs': {
        get: {
          tags: ['Employer – Jobs'],
          summary: 'List all jobs posted by the company',
          responses: { 200: { description: 'Job list with application counts' } }
        },
        post: {
          tags: ['Employer – Jobs'],
          summary: 'Create a new job posting',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'requirements', 'location', 'jobType', 'workMode', 'categoryId'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    requirements: { type: 'string' },
                    location: { type: 'string' },
                    jobType: { type: 'string' },
                    workMode: { type: 'string' },
                    categoryId: { type: 'string' },
                    salaryMin: { type: 'number', nullable: true },
                    salaryMax: { type: 'number', nullable: true },
                    deadline: { type: 'string', format: 'date-time', nullable: true },
                    status: { type: 'string', enum: ['DRAFT', 'PUBLISHED'] }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Job created' } }
        }
      },
      '/employer/jobs/bulk-archive': {
        patch: {
          tags: ['Employer – Jobs'],
          summary: 'Bulk archive jobs by IDs',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { jobIds: { type: 'array', items: { type: 'string' } } } } } } },
          responses: { 200: { description: 'Jobs archived' } }
        }
      },
      '/employer/jobs/bulk-close': {
        patch: {
          tags: ['Employer – Jobs'],
          summary: 'Bulk close jobs by IDs',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { jobIds: { type: 'array', items: { type: 'string' } } } } } } },
          responses: { 200: { description: 'Jobs closed' } }
        }
      },
      '/employer/jobs/{id}': {
        put: {
          tags: ['Employer – Jobs'],
          summary: 'Full update of a job posting',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Job updated' } }
        },
        delete: {
          tags: ['Employer – Jobs'],
          summary: 'Delete a job posting',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Job deleted' } }
        }
      },
      '/employer/jobs/{id}/autosave': {
        patch: {
          tags: ['Employer – Jobs'],
          summary: 'Auto-save partial job draft (no validation required)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Draft auto-saved' } }
        }
      },
      '/employer/jobs/{id}/duplicate': {
        post: {
          tags: ['Employer – Jobs'],
          summary: 'Duplicate an existing job posting',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 201: { description: 'Job duplicated as DRAFT' } }
        }
      },
      '/employer/jobs/{id}/archive': {
        patch: {
          tags: ['Employer – Jobs'],
          summary: 'Archive a job posting',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Job archived' } }
        }
      },
      '/employer/jobs/{id}/close': {
        patch: {
          tags: ['Employer – Jobs'],
          summary: 'Close a job posting to new applications',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Job closed' } }
        }
      },
      '/employer/jobs/{id}/reopen': {
        patch: {
          tags: ['Employer – Jobs'],
          summary: 'Reopen a closed or archived job',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Job reopened' } }
        }
      },
      '/employer/job-categories': {
        get: {
          tags: ['Employer – Jobs'],
          summary: 'List all available job categories',
          responses: { 200: { description: 'Category list' } }
        }
      },

      // =====================
      // EMPLOYER – APPLICATIONS
      // =====================
      '/employer/applications': {
        get: {
          tags: ['Employer – Applications'],
          summary: 'List all applications across company jobs',
          responses: { 200: { description: 'Application list' } }
        }
      },
      '/employer/applications/queue': {
        get: {
          tags: ['Employer – Applications'],
          summary: 'Get prioritized hiring queue with filtering and sorting',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'jobId', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } }
          ],
          responses: { 200: { description: 'Paginated queue with total count' } }
        }
      },
      '/employer/applications/bulk': {
        patch: {
          tags: ['Employer – Applications'],
          summary: 'Bulk shortlist or reject applications',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    applicationIds: { type: 'array', items: { type: 'string' } },
                    action: { type: 'string', enum: ['shortlist', 'reject'] },
                    reason: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Bulk action applied' } }
        }
      },
      '/employer/applications/bulk/tags': {
        post: {
          tags: ['Employer – Applications'],
          summary: 'Attach a tag to multiple applications',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { applicationIds: { type: 'array', items: { type: 'string' } }, tagId: { type: 'string' } } } } } },
          responses: { 200: { description: 'Tag applied to applications' } }
        }
      },
      '/employer/applications/ai-compare': {
        post: {
          tags: ['Employer AI'],
          summary: 'AI-powered comparison and ranking of multiple candidates for a job',
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { jobId: { type: 'string' }, applicationIds: { type: 'array', items: { type: 'string' } } } } } }
          },
          responses: { 200: { description: 'Ranked candidate comparison result' } }
        }
      },
      '/employer/applications/{id}': {
        get: {
          tags: ['Employer – Applications'],
          summary: 'Get full application detail for hiring pipeline',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Application with candidate profile, notes, timeline' } }
        }
      },
      '/employer/applications/{id}/stage': {
        patch: {
          tags: ['Employer – Applications'],
          summary: 'Update application stage',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { stage: { type: 'string' } } } } } },
          responses: { 200: { description: 'Stage updated' } }
        }
      },
      '/employer/applications/{id}/shortlist': {
        patch: {
          tags: ['Employer – Applications'],
          summary: 'Shortlist a candidate',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Candidate shortlisted' } }
        }
      },
      '/employer/applications/{id}/reject': {
        patch: {
          tags: ['Employer – Applications'],
          summary: 'Reject a candidate',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } },
          responses: { 200: { description: 'Candidate rejected' } }
        }
      },
      '/employer/applications/{id}/notes': {
        get: {
          tags: ['Employer – Applications'],
          summary: 'Get internal recruiter notes for an application',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Notes list' } }
        },
        post: {
          tags: ['Employer – Applications'],
          summary: 'Add an internal recruiter note to an application',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } } },
          responses: { 201: { description: 'Note added' } }
        }
      },
      '/employer/applications/{id}/interviews': {
        post: {
          tags: ['Employer – Applications'],
          summary: 'Schedule an interview for a candidate',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'scheduledAt', 'duration'],
                  properties: {
                    title: { type: 'string' },
                    scheduledAt: { type: 'string', format: 'date-time' },
                    duration: { type: 'integer', description: 'Duration in minutes' },
                    locationUrl: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Interview scheduled' } }
        }
      },
      '/employer/applications/{id}/offer': {
        post: {
          tags: ['Employer – Applications'],
          summary: 'Extend a job offer to a candidate',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'salary', 'startDate'],
                  properties: {
                    title: { type: 'string' },
                    salary: { type: 'number' },
                    currency: { type: 'string', default: 'USD' },
                    startDate: { type: 'string', format: 'date' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Offer extended' } }
        }
      },
      '/employer/applications/{id}/timeline': {
        get: {
          tags: ['Employer – Applications'],
          summary: 'Get full timeline of events for an application',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Timeline entries' } }
        }
      },
      '/employer/applications/{id}/tags': {
        post: {
          tags: ['Employer – Applications'],
          summary: 'Attach a tag to an application',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { tagId: { type: 'string' } } } } } },
          responses: { 200: { description: 'Tag attached' } }
        }
      },
      '/employer/applications/{id}/tags/{tagId}': {
        delete: {
          tags: ['Employer – Applications'],
          summary: 'Remove a tag from an application',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'tagId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Tag removed' } }
        }
      },
      '/employer/applications/{id}/ai-evaluate': {
        post: {
          tags: ['Employer AI'],
          summary: 'Generate AI evaluation of a candidate for a job',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'AI candidate evaluation with fit score, strengths, concerns' } }
        }
      },
      '/employer/applications/{id}/ai-evaluation': {
        get: {
          tags: ['Employer AI'],
          summary: 'Get latest persisted AI evaluation for an application',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Latest evaluation or null' } }
        }
      },
      '/employer/interviews/{id}': {
        patch: {
          tags: ['Employer – Applications'],
          summary: 'Update an interview record (reschedule, update status, add feedback)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Interview updated' } }
        }
      },
      '/employer/offers/{id}/withdraw': {
        patch: {
          tags: ['Employer – Applications'],
          summary: 'Withdraw an extended job offer',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Offer withdrawn' } }
        }
      },

      // =====================
      // EMPLOYER – TAGS & FILTERS
      // =====================
      '/employer/tags': {
        get: {
          tags: ['Employer – Applications'],
          summary: 'List all candidate tags for the company',
          responses: { 200: { description: 'Tag list' } }
        },
        post: {
          tags: ['Employer – Applications'],
          summary: 'Create a new candidate tag',
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, color: { type: 'string' } } } } } },
          responses: { 201: { description: 'Tag created' } }
        }
      },
      '/employer/tags/{id}': {
        delete: {
          tags: ['Employer – Applications'],
          summary: 'Delete a candidate tag',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Tag deleted' } }
        }
      },
      '/employer/saved-filters': {
        get: {
          tags: ['Employer – Applications'],
          summary: 'List saved application queue filter presets',
          responses: { 200: { description: 'Saved filter list' } }
        },
        post: {
          tags: ['Employer – Applications'],
          summary: 'Save a filter preset',
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name', 'filters'], properties: { name: { type: 'string' }, filters: { type: 'object' } } } } } },
          responses: { 201: { description: 'Filter preset saved' } }
        }
      },
      '/employer/saved-filters/{id}': {
        delete: {
          tags: ['Employer – Applications'],
          summary: 'Delete a saved filter preset',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Filter deleted' } }
        }
      },

      // =====================
      // EMPLOYER – RESUMES & ANALYTICS
      // =====================
      '/employer/resumes/{id}/preview': {
        get: {
          tags: ['Employer – Applications'],
          summary: 'Preview a candidate resume PDF (authenticated blob)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Resume file stream' } }
        }
      },
      '/employer/resumes/{id}/download': {
        get: {
          tags: ['Employer – Applications'],
          summary: 'Download a candidate resume file',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Resume file download' } }
        }
      },
      '/employer/analytics': {
        get: {
          tags: ['Employer – Analytics'],
          summary: 'Get full hiring pipeline analytics',
          responses: { 200: { description: 'Funnel metrics, time-to-hire, offer acceptance rate, per-job breakdown' } }
        }
      },

      // =====================
      // UNIVERSITY – DASHBOARD
      // =====================
      '/university/dashboard': {
        get: {
          tags: ['University – Dashboard'],
          summary: 'Get university placement dashboard metrics',
          responses: { 200: { description: 'Placement rate, student counts, upcoming drives' } }
        }
      },
      '/university/students': {
        get: {
          tags: ['University – Students'],
          summary: 'List all students affiliated with the university',
          responses: { 200: { description: 'Student list with verification status' } }
        }
      },
      '/university/students/{studentId}/verify': {
        patch: {
          tags: ['University – Students'],
          summary: 'Update student verification status',
          parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: { status: { type: 'string', enum: ['PENDING', 'VERIFIED', 'PLACEMENT_ELIGIBLE', 'PLACEMENT_COMPLETED', 'REJECTED'] } }
                }
              }
            }
          },
          responses: { 200: { description: 'Student verification updated' } }
        }
      },
      '/university/students/{studentId}/ai-insight': {
        post: {
          tags: ['University AI'],
          summary: 'Generate AI placement prediction for a student',
          parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Placement probability, risk level, and recommended actions' } }
        },
        get: {
          tags: ['University AI'],
          summary: 'Get latest AI placement insight for a student',
          parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Latest insight or null' } }
        }
      },
      '/university/drives': {
        get: {
          tags: ['University – Drives'],
          summary: 'List all campus placement drives',
          responses: { 200: { description: 'Drive list' } }
        },
        post: {
          tags: ['University – Drives'],
          summary: 'Create a new placement drive',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'location', 'scheduledAt', 'deadline'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    location: { type: 'string' },
                    scheduledAt: { type: 'string', format: 'date-time' },
                    deadline: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Drive created' } }
        }
      },
      '/university/drives/{id}': {
        put: {
          tags: ['University – Drives'],
          summary: 'Update a placement drive',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Drive updated' } }
        },
        delete: {
          tags: ['University – Drives'],
          summary: 'Delete a placement drive (soft delete)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Drive deleted' } }
        }
      },
      '/university/drives/ai-recommendations': {
        post: {
          tags: ['University AI'],
          summary: 'AI recommendation for optimal campus drive targets',
          responses: { 200: { description: 'Recommended companies and roles based on student profiles' } }
        }
      },
      '/university/analytics': {
        get: {
          tags: ['University – Analytics'],
          summary: 'Get placement analytics (rates, department breakdown, salary stats)',
          responses: { 200: { description: 'Detailed analytics data' } }
        }
      },
      '/university/analytics/ai-insight': {
        post: {
          tags: ['University AI'],
          summary: 'Generate AI department performance insight',
          responses: { 200: { description: 'Department insights and recommendations' } }
        }
      },
      '/university/reports/ai-report': {
        post: {
          tags: ['University AI'],
          summary: 'Generate executive-level AI placement report',
          responses: { 200: { description: 'Executive summary, key findings, recommendations' } }
        }
      },
      '/university/companies': {
        get: {
          tags: ['University – Analytics'],
          summary: 'Get list of partner companies with hiring data for the university',
          responses: { 200: { description: 'Partner company list' } }
        }
      },
      '/university/settings': {
        get: {
          tags: ['University – Dashboard'],
          summary: 'Get university settings and placement cell info',
          responses: { 200: { description: 'University settings' } }
        },
        put: {
          tags: ['University – Dashboard'],
          summary: 'Update university settings',
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Settings updated' } }
        }
      },
      '/university/messages/broadcast': {
        post: {
          tags: ['University – Dashboard'],
          summary: 'Send a broadcast message to multiple students',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['recipientUserIds', 'title', 'content'],
                  properties: {
                    recipientUserIds: { type: 'array', items: { type: 'string' } },
                    title: { type: 'string' },
                    content: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Broadcast sent with recipient count' } }
        }
      },
      '/university/messages/sent': {
        get: {
          tags: ['University – Dashboard'],
          summary: 'List previously sent broadcast messages',
          responses: { 200: { description: 'Sent broadcast list' } }
        }
      },
      '/university/support': {
        post: {
          tags: ['University – Dashboard'],
          summary: 'Submit a support request to the admin team',
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['subject', 'message'], properties: { subject: { type: 'string' }, message: { type: 'string' } } } } } },
          responses: { 201: { description: 'Support ticket submitted' } }
        }
      },

      // =====================
      // ADMIN – USERS
      // =====================
      '/admin/users': {
        get: {
          tags: ['Admin – Users'],
          summary: 'List all users with pagination and role/search filters',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['STUDENT', 'EMPLOYER', 'UNIVERSITY', 'ADMIN'] } }
          ],
          responses: { 200: { description: 'Paginated user list' } }
        }
      },
      '/admin/users/{id}/suspend': {
        patch: {
          tags: ['Admin – Users'],
          summary: 'Suspend a user account',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'User suspended' } }
        }
      },
      '/admin/users/{id}/activate': {
        patch: {
          tags: ['Admin – Users'],
          summary: 'Activate / unsuspend a user account',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'User activated' } }
        }
      },
      '/admin/users/{id}/verify': {
        patch: {
          tags: ['Admin – Users'],
          summary: 'Manually mark a user as verified',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'User verified' } }
        }
      },
      '/admin/users/{id}/reset-password': {
        patch: {
          tags: ['Admin – Users'],
          summary: 'Admin force-reset a user password',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string' } } } } } },
          responses: { 200: { description: 'Password reset' } }
        }
      },
      '/admin/users/{id}/role': {
        patch: {
          tags: ['Admin – Users'],
          summary: 'Change a user role',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['STUDENT', 'EMPLOYER', 'UNIVERSITY', 'ADMIN'] } } } } } },
          responses: { 200: { description: 'Role updated' } }
        }
      },

      // =====================
      // ADMIN – COMPANIES
      // =====================
      '/admin/companies': {
        get: {
          tags: ['Admin – Companies'],
          summary: 'List all companies with pagination',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'search', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Paginated company list with job/recruiter counts' } }
        }
      },
      '/admin/companies/{id}/toggle': {
        patch: {
          tags: ['Admin – Companies'],
          summary: 'Activate or deactivate a company',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { deactivate: { type: 'boolean' } } } } } },
          responses: { 200: { description: 'Company toggled' } }
        }
      },
      '/admin/companies/{id}/verify': {
        patch: {
          tags: ['Admin – Companies'],
          summary: 'Verify or unverify a company',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { isVerified: { type: 'boolean' } } } } } },
          responses: { 200: { description: 'Verification status updated' } }
        }
      },

      // =====================
      // ADMIN – UNIVERSITIES
      // =====================
      '/admin/universities': {
        get: {
          tags: ['Admin – Universities'],
          summary: 'List all universities',
          parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'search', in: 'query', schema: { type: 'string' } }],
          responses: { 200: { description: 'University list with student/drive counts' } }
        }
      },
      '/admin/universities/{id}/toggle': {
        patch: {
          tags: ['Admin – Universities'],
          summary: 'Activate or deactivate a university',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { deactivate: { type: 'boolean' } } } } } },
          responses: { 200: { description: 'University toggled' } }
        }
      },
      '/admin/universities/{id}/verify': {
        patch: {
          tags: ['Admin – Universities'],
          summary: 'Verify or unverify a university',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { isVerified: { type: 'boolean' } } } } } },
          responses: { 200: { description: 'Verification updated' } }
        }
      },

      // =====================
      // ADMIN – PLATFORM
      // =====================
      '/admin/stats': {
        get: {
          tags: ['Admin – Platform'],
          summary: 'Get global platform statistics',
          responses: { 200: { description: 'User counts, job counts, application counts, verification queues' } }
        }
      },
      '/admin/monitoring': {
        get: {
          tags: ['Admin – Platform'],
          summary: 'Get system monitoring data (DB health, uptime, memory, CPU)',
          responses: { 200: { description: 'System monitoring metrics' } }
        }
      },
      '/admin/audit-logs': {
        get: {
          tags: ['Admin – Platform'],
          summary: 'Get paginated audit log entries',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'userId', in: 'query', schema: { type: 'string' } },
            { name: 'action', in: 'query', schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
          ],
          responses: { 200: { description: 'Audit log entries with user info and action details' } }
        }
      },
      '/admin/search': {
        get: {
          tags: ['Admin – Platform'],
          summary: 'Global search across users, companies, universities, and jobs',
          parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Search results grouped by entity type' } }
        }
      },
      '/admin/feature-flags': {
        get: {
          tags: ['Admin – Platform'],
          summary: 'List all platform feature flags',
          responses: { 200: { description: 'Feature flag list with current values' } }
        }
      },
      '/admin/feature-flags/{key}': {
        patch: {
          tags: ['Admin – Platform'],
          summary: 'Enable or disable a feature flag',
          parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { value: { type: 'boolean' } } } } } },
          responses: { 200: { description: 'Flag updated' } }
        }
      },
      '/admin/announcements': {
        get: {
          tags: ['Admin – Platform'],
          summary: 'List platform announcements',
          parameters: [{ name: 'activeOnly', in: 'query', schema: { type: 'boolean' } }],
          responses: { 200: { description: 'Announcement list' } }
        },
        post: {
          tags: ['Admin – Platform'],
          summary: 'Create a platform announcement',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content', 'severity'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
                    expiresAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Announcement created' } }
        }
      },
      '/admin/announcements/{id}/active': {
        patch: {
          tags: ['Admin – Platform'],
          summary: 'Toggle active status of an announcement',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { isActive: { type: 'boolean' } } } } } },
          responses: { 200: { description: 'Announcement activation updated' } }
        }
      },
      '/admin/announcements/{id}': {
        delete: {
          tags: ['Admin – Platform'],
          summary: 'Delete a platform announcement',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Announcement deleted' } }
        }
      },
      '/admin/support-tickets': {
        get: {
          tags: ['Admin – Platform'],
          summary: 'List all support tickets with optional status filter',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] } }
          ],
          responses: { 200: { description: 'Support ticket list' } }
        }
      },
      '/admin/support-tickets/{id}': {
        patch: {
          tags: ['Admin – Platform'],
          summary: 'Update a support ticket (status, priority, resolution note)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, priority: { type: 'string' }, resolutionNote: { type: 'string' } } } } } },
          responses: { 200: { description: 'Ticket updated' } }
        }
      },
      '/admin/sessions': {
        get: {
          tags: ['Admin – Platform'],
          summary: 'List all active user refresh token sessions',
          parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'search', in: 'query', schema: { type: 'string' } }],
          responses: { 200: { description: 'Session list with user info and expiry' } }
        }
      },
      '/admin/sessions/{id}': {
        delete: {
          tags: ['Admin – Platform'],
          summary: 'Revoke a specific session token',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Session revoked' } }
        }
      },
      '/admin/sessions/family/{family}': {
        delete: {
          tags: ['Admin – Platform'],
          summary: 'Revoke all sessions in a token family (force logout all devices for a user)',
          parameters: [{ name: 'family', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'All family sessions revoked' } }
        }
      },

      // =====================
      // ADMIN AI
      // =====================
      '/admin/ai/fraud-detection': {
        post: {
          tags: ['Admin AI'],
          summary: 'Generate AI fraud and anomaly detection report',
          responses: { 200: { description: 'Fraud signals flagged with descriptions and recommended actions' } }
        },
        get: {
          tags: ['Admin AI'],
          summary: 'Get latest persisted fraud detection report',
          responses: { 200: { description: 'Fraud report or null' } }
        }
      },
      '/admin/ai/platform-insights': {
        post: {
          tags: ['Admin AI'],
          summary: 'Generate AI platform growth and engagement insights',
          parameters: [{ name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly'], default: 'weekly' } }],
          responses: { 200: { description: 'Platform growth summary, key insights, engagement analysis' } }
        },
        get: {
          tags: ['Admin AI'],
          summary: 'Get latest platform insights report',
          parameters: [{ name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly'] } }],
          responses: { 200: { description: 'Latest insights report or null' } }
        }
      },
      '/admin/ai/moderation': {
        post: {
          tags: ['Admin AI'],
          summary: 'Generate AI content moderation recommendations',
          responses: { 200: { description: 'Recommended reviews for flagged content' } }
        },
        get: {
          tags: ['Admin AI'],
          summary: 'Get latest moderation report',
          responses: { 200: { description: 'Moderation report or null' } }
        }
      },
      '/admin/ai/system-health': {
        post: {
          tags: ['Admin AI'],
          summary: 'Generate AI system health summary from recent error logs',
          responses: { 200: { description: 'Health status, detected issues, recurring patterns, AI summary' } }
        },
        get: {
          tags: ['Admin AI'],
          summary: 'Get latest system health report',
          responses: { 200: { description: 'Health report or null' } }
        }
      },
      '/admin/ai/executive-report': {
        post: {
          tags: ['Admin AI'],
          summary: 'Generate an AI executive summary report',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reportType: { type: 'string', enum: ['quarterly', 'annual', 'growth', 'hiring'] }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Executive summary with key metrics and recommendations' } }
        }
      },
      '/admin/ai/executive-report/{reportType}': {
        get: {
          tags: ['Admin AI'],
          summary: 'Get latest persisted executive report by type',
          parameters: [{ name: 'reportType', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Executive report or null' } }
        }
      },
      '/admin/ai/predictive-analytics': {
        post: {
          tags: ['Admin AI'],
          summary: 'Generate AI predictive analytics (growth forecast, hiring demand)',
          responses: { 200: { description: 'Forecast data for platform growth, hiring volume, and declining departments' } }
        },
        get: {
          tags: ['Admin AI'],
          summary: 'Get latest predictive analytics report',
          responses: { 200: { description: 'Analytics report or null' } }
        }
      }
    }
  },
  apis: [] // All paths are defined above; no file scanning needed
};

export const swaggerSpec = swaggerJsdoc(options);
