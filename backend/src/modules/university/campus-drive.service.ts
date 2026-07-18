import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { eventBus } from '../shared/event-bus';

export class CampusDriveService {
  static async createDrive(universityId: string, data: { title: string; description: string; location: string; scheduledAt: Date; deadline: Date }) {
    const drive = await prisma.placementDrive.create({
      data: {
        universityId,
        title: data.title,
        description: data.description,
        location: data.location,
        scheduledAt: data.scheduledAt,
        deadline: data.deadline
      }
    });

    eventBus.emit('CampusDriveCreated', { id: drive.id, universityId });
    return drive;
  }

  static async getDrives(universityId: string) {
    return prisma.placementDrive.findMany({
      where: { universityId, isDeleted: false },
      orderBy: { scheduledAt: 'asc' }
    });
  }

  static async findDriveInUniversity(universityId: string, id: string) {
    return prisma.placementDrive.findFirst({ where: { id, universityId, isDeleted: false } });
  }

  static async updateDrive(universityId: string, id: string, data: Partial<{ title: string; description: string; location: string; scheduledAt: Date; deadline: Date }>) {
    const existing = await this.findDriveInUniversity(universityId, id);
    if (!existing) {
      throw new AppError('Campus drive not found or unauthorized.', 404, 'DRIVE_NOT_FOUND');
    }

    const result = await prisma.placementDrive.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        scheduledAt: data.scheduledAt,
        deadline: data.deadline
      }
    });

    eventBus.emit('CampusDriveUpdated', { id: result.id, universityId });
    return result;
  }

  static async deleteDrive(universityId: string, id: string) {
    const existing = await this.findDriveInUniversity(universityId, id);
    if (!existing) {
      throw new AppError('Campus drive not found or unauthorized.', 404, 'DRIVE_NOT_FOUND');
    }
    await prisma.placementDrive.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    eventBus.emit('CampusDriveDeleted', { id, universityId });
    return { deleted: true };
  }
}
