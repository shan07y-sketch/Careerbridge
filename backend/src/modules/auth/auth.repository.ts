import { prisma } from '../../config/database';
import { User, StudentProfile, RefreshToken, UserRole, WorkMode, ResumeStatus } from '@prisma/client';

export class AuthRepository {
  static async findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, isDeleted: false },
      include: {
        studentProfile: true,
        recruiterProfile: { include: { company: true } },
        universityProfile: true
      }
    });
  }

  static async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: {
          include: {
            resumes: true,
            careerInsights: true
          }
        },
        recruiterProfile: { include: { company: true } },
        universityProfile: true
      }
    });
  }

  static async findUserByVerificationToken(token: string) {
    return prisma.user.findFirst({
      where: { verificationToken: token, isDeleted: false }
    });
  }

  static async findUserByResetToken(token: string) {
    return prisma.user.findFirst({
      where: { resetToken: token, isDeleted: false }
    });
  }

  static async updateUser(id: string, data: Partial<User>) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  static async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  static async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token }
    });
  }

  static async revokeRefreshToken(token: string) {
    return prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true }
    });
  }

  static async revokeAllRefreshTokensForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });
  }

  /**
   * Database Transaction registration creating User + Profiles + Placeholders atomicity.
   */
  static async registerUser(data: {
    email: string;
    passwordHash: string;
    role: UserRole;
    verificationToken: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    industry?: string;
    universityName?: string;
    location?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the base User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          verificationToken: data.verificationToken,
          isVerified: false
        }
      });

      // 2. Perform Profile & Placeholder allocations based on UserRole
      if (data.role === 'STUDENT') {
        const studentProfile = await tx.studentProfile.create({
          data: {
            userId: user.id,
            firstName: data.firstName || 'First',
            lastName: data.lastName || 'Last',
            preferredRole: 'Software Engineer',
            preferredWorkMode: WorkMode.HYBRID,
            preferredLocations: ['San Francisco']
          }
        });

        // Create default system Welcome notification
        await tx.notification.create({
          data: {
            recipientId: user.id,
            type: 'SYSTEM',
            title: 'Welcome to CareerBridge!',
            content: 'Please verify your email address to unlock AI match assessments.',
            priority: 'HIGH'
          }
        });

        // Create Initial Resume placeholder
        const resume = await tx.resume.create({
          data: {
            studentProfileId: studentProfile.id,
            fileName: 'Resume_Placeholder.pdf',
            fileUrl: 'http://localhost:5000/uploads/placeholder.pdf',
            status: ResumeStatus.PROCESSING
          }
        });

        // Create Initial Career Insight metadata placeholder
        await tx.careerInsight.create({
          data: {
            studentProfileId: studentProfile.id,
            summary: 'Upload your first resume to generate career insights.',
            score: 0,
            status: 'PENDING',
            modelVersion: '1.0'
          }
        });
      } else if (data.role === 'EMPLOYER') {
        // Find or create Company owned entity
        let company = await tx.company.findFirst({
          where: { name: data.companyName || 'Default Company' }
        });

        if (!company) {
          company = await tx.company.create({
            data: {
              name: data.companyName || 'Default Company',
              industry: data.industry || 'Technology',
              description: 'Company registered on CareerBridge'
            }
          });
        }

        // Link User to Company
        await tx.user.update({
          where: { id: user.id },
          data: { companyId: company.id }
        });

        // Create Recruiter Profile
        await tx.recruiter.create({
          data: {
            userId: user.id,
            companyId: company.id,
            title: 'Hiring Manager'
          }
        });
      } else if (data.role === 'UNIVERSITY') {
        await tx.university.create({
          data: {
            userId: user.id,
            name: data.universityName || 'Default University',
            location: data.location || 'San Francisco'
          }
        });
      }

      return user;
    });
  }
}
