import { prisma } from '../../config/database';
import { UserRole } from '@prisma/client';

export class AdminRepository {
  static async getUsersList(page: number, limit: number) {
    return prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateUserState(id: string, updates: { isDeleted?: boolean; isVerified?: boolean; role?: UserRole; passwordHash?: string }) {
    return prisma.user.update({
      where: { id },
      data: {
        isDeleted: updates.isDeleted,
        deletedAt: updates.isDeleted ? new Date() : null,
        isVerified: updates.isVerified,
        role: updates.role,
        passwordHash: updates.passwordHash
      }
    });
  }

  static async updateCompanyState(id: string, isDeleted: boolean) {
    return prisma.company.update({
      where: { id },
      data: {
        isDeleted,
        deletedAt: isDeleted ? new Date() : null
      }
    });
  }

  static async updateUniversityState(id: string, isDeleted: boolean) {
    return prisma.university.update({
      where: { id },
      data: {
        isDeleted,
        deletedAt: isDeleted ? new Date() : null
      }
    });
  }

  static async getAuditLogs(filters: { userId?: string; action?: string; startDate?: Date; endDate?: Date }, page: number, limit: number) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getGlobalStats() {
    const usersCount = await prisma.user.count();
    const companiesCount = await prisma.company.count();
    const universitiesCount = await prisma.university.count();
    const jobsCount = await prisma.job.count();
    const applicationsCount = await prisma.application.count();

    return {
      totalUsers: usersCount,
      companiesCount,
      universitiesCount,
      jobsPublished: jobsCount,
      applicationsCount,
      activeConnectionsEstimate: 5
    };
  }

  static async globalSearch(query: string) {
    const students = await prisma.studentProfile.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    const companies = await prisma.company.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 5
    });

    const jobs = await prisma.job.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      take: 5
    });

    return {
      students,
      companies,
      jobs
    };
  }
}
