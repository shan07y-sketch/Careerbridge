import { prisma } from '../../config/database';
import { User, StudentProfile, RefreshToken, UserRole } from '@prisma/client';

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
            resumes: { orderBy: { isActive: 'desc' }, include: { resumeAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 } } },
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

  /**
   * Create the first refresh token of a new login session. Establishes a
   * fresh `family` id that every subsequent rotation of this session will
   * share, so a reuse of any token in the family can be detected later.
   */
  static async createRefreshToken(userId: string, token: string, expiresAt: Date, family?: string) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        ...(family ? { family } : {})
      }
    });
  }

  static async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  }

  /**
   * Rotate a refresh token: mint a new token in the same family, mark the
   * presented token as consumed (revoked + replacedByToken), atomically.
   */
  static async rotateRefreshToken(oldToken: string, newToken: string, expiresAt: Date, family: string, userId: string) {
    return prisma.$transaction([
      prisma.refreshToken.update({
        where: { token: oldToken },
        data: { isRevoked: true, revokedAt: new Date(), replacedByToken: newToken }
      }),
      prisma.refreshToken.create({
        data: { userId, token: newToken, expiresAt, family }
      })
    ]);
  }

  static async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token }
    });
  }

  static async revokeRefreshToken(token: string) {
    return prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true, revokedAt: new Date() }
    });
  }

  /**
   * Reuse-detection response: an already-revoked (or otherwise consumed)
   * refresh token was presented again, which means either the legitimate
   * client raced a refresh, or the token was stolen and used by an attacker
   * after the real user already rotated it. Either way, the safe response is
   * to burn the entire token family so every derived token stops working and
   * the user is forced to re-authenticate.
   */
  static async revokeTokenFamily(family: string) {
    return prisma.refreshToken.updateMany({
      where: { family, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() }
    });
  }

  static async revokeAllRefreshTokensForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true, revokedAt: new Date() }
    });
  }

  /**
   * Database Transaction registration creating User + Profiles + Placeholders atomicity.
   */
  static async registerUser(data: {
    email: string;
    passwordHash: string;
    role: UserRole;
    verificationToken: string | null;
    isVerified?: boolean;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    industry?: string;
    universityName?: string;
    location?: string;
    degree?: string;
    graduationYear?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the base User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          verificationToken: data.verificationToken,
          isVerified: data.isVerified ?? false
        }
      });

      // 2. Perform Profile & Placeholder allocations based on UserRole
      if (data.role === 'STUDENT') {
        // If the university the student typed already exists as a registered
        // University entity, link the profile to it; otherwise leave the
        // relation unset (StudentProfile.universityId is nullable). We never
        // fabricate a University row here -- those are created only by real
        // UNIVERSITY-role registrations.
        let universityId: string | undefined;
        if (data.universityName) {
          const uni = await tx.university.findFirst({
            where: { name: data.universityName, isDeleted: false },
            select: { id: true }
          });
          universityId = uni?.id;
        }

        const studentProfile = await tx.studentProfile.create({
          data: {
            userId: user.id,
            firstName: data.firstName || 'First',
            lastName: data.lastName || 'Last',
            graduationYear: data.graduationYear,
            ...(universityId ? { universityId } : {})
            // preferredRole/preferredWorkMode/preferredLocations are left
            // unset on purpose -- a brand-new student hasn't told us any of
            // this yet, and the profile/onboarding UI's empty state ("Set
            // your preferences") is the correct thing to show until they do.
          }
        });

        // Persist the degree the student declared at signup as their first
        // Education entry, tied to the university name they typed. This is
        // real user-entered data (not fabricated), so it belongs in the DB.
        if (data.degree && data.universityName) {
          await tx.education.create({
            data: {
              studentProfileId: studentProfile.id,
              institution: data.universityName,
              degree: data.degree,
              fieldOfStudy: data.degree,
              startDate: new Date(),
              endDate: data.graduationYear ? new Date(`${data.graduationYear}-06-01`) : null
            }
          });
        }

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

        // Deliberately no placeholder Resume row here: "hasn't uploaded a
        // resume yet" is a real, representable state (zero rows / no active
        // resume) that the resume workflow's empty-state UI handles
        // directly. A fake row with a dead localhost URL was a real bug in
        // any non-local deployment -- new users would appear to already
        // have a resume that 404s.

        // Same reasoning applies to Career Insight: no row is created here.
        // `CareerRepository.getCareerInsights` returns `[]` for a student
        // with none yet, and the frontend's empty state ("Upload your first
        // resume to generate career insights") handles that directly --
        // inserting a fake score:0/PENDING row was redundant with that UI
        // and risked being misread as a real (if low) readiness score.
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

        // Create Recruiter Profile. firstName/lastName were already being
        // collected by this same registerUser() call for other roles --
        // persisting them here too (Recruiter.firstName/lastName, see
        // migration 20260717130000_recruiter_name_fields) is what makes the
        // real name available at all now, instead of being silently
        // dropped.
        await tx.recruiter.create({
          data: {
            userId: user.id,
            companyId: company.id,
            title: 'Hiring Manager',
            firstName: data.firstName,
            lastName: data.lastName
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

  // ────────────────────────── Two-step verification ──────────────────────────

  /** Swaps the whole recovery-code set atomically, so a failure part-way
   *  through cannot leave an account with a mix of old and new codes. */
  static async replaceRecoveryCodes(userId: string, codeHashes: string[]) {
    return prisma.$transaction([
      prisma.twoFactorRecoveryCode.deleteMany({ where: { userId } }),
      prisma.twoFactorRecoveryCode.createMany({
        data: codeHashes.map((codeHash) => ({ userId, codeHash })),
      }),
    ]);
  }

  static async findUnusedRecoveryCodes(userId: string) {
    return prisma.twoFactorRecoveryCode.findMany({
      where: { userId, usedAt: null },
      select: { id: true, codeHash: true },
    });
  }

  static async countUnusedRecoveryCodes(userId: string) {
    return prisma.twoFactorRecoveryCode.count({ where: { userId, usedAt: null } });
  }

  static async markRecoveryCodeUsed(id: string) {
    return prisma.twoFactorRecoveryCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  static async deleteRecoveryCodes(userId: string) {
    return prisma.twoFactorRecoveryCode.deleteMany({ where: { userId } });
  }
}
