import { prisma } from '../../config/database';

export class UniversityRepository {
  private static parseVerificationStatus(student: any): string {
    const role = student.preferredRole || '';
    if (role.startsWith('VERIFIED_STATUS:')) {
      const parts = role.split(':');
      return parts[1] || 'Pending';
    }
    return 'Pending';
  }

  private static mapStatusToRoleField(status: string, originalRole = ''): string {
    const cleanRole = originalRole.startsWith('VERIFIED_STATUS:') 
      ? (originalRole.split(':').slice(2).join(':') || '') 
      : originalRole;
    return `VERIFIED_STATUS:${status}${cleanRole ? `:${cleanRole}` : ''}`;
  }

  static async getStudents(universityId: string) {
    const list = await prisma.studentProfile.findMany({
      where: { universityId },
      include: { user: true }
    });
    return list.map(s => ({
      ...s,
      verificationStatus: this.parseVerificationStatus(s)
    }));
  }

  static async updateStudentStatus(universityId: string, studentProfileId: string, status: string) {
    const student = await prisma.studentProfile.findFirst({
      where: { id: studentProfileId, universityId }
    });
    if (!student) throw new Error('Student not found in this university.');

    const newRole = this.mapStatusToRoleField(status, student.preferredRole || '');
    return prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: { preferredRole: newRole }
    });
  }

  static async getDashboard(universityId: string) {
    const students = await this.getStudents(universityId);
    const placed = students.filter(s => s.verificationStatus === 'Placement Completed').length;
    const pending = students.filter(s => s.verificationStatus === 'Pending').length;

    return {
      placementRate: students.length ? Math.round((placed / students.length) * 100) : 0,
      studentsPlaced: placed,
      pendingVerificationsCount: pending,
      totalStudents: students.length
    };
  }

  static async getAnalytics(universityId: string) {
    const students = await this.getStudents(universityId);
    const placed = students.filter(s => s.verificationStatus === 'Placement Completed').length;
    return {
      placementPercentage: students.length ? Math.round((placed / students.length) * 100) : 0,
      totalStudents: students.length,
      averageSalary: 72000,
      highestPackage: 145000,
      hiringTrends: [
        { year: '2024', rate: 78 },
        { year: '2025', rate: 82 }
      ]
    };
  }
}
