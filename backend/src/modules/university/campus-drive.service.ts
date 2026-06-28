import { prisma } from '../../config/database';
import { eventBus } from '../shared/event-bus';

export class CampusDriveService {
  private static serializeDriveTitle(universityId: string, title: string): string {
    return `CAMPUS_DRIVE:${universityId}:${title}`;
  }

  private static deserializeDriveTitle(fullTitle: string): { universityId: string; title: string } | null {
    if (!fullTitle.startsWith('CAMPUS_DRIVE:')) return null;
    const parts = fullTitle.split(':');
    return {
      universityId: parts[1],
      title: parts.slice(2).join(':')
    };
  }

  static async createDrive(universityId: string, data: { title: string; description: string; location: string; scheduledAt: Date; deadline: Date }) {
    const fullTitle = this.serializeDriveTitle(universityId, data.title);
    const drive = await prisma.event.create({
      data: {
        title: fullTitle,
        description: data.description,
        location: data.location,
        scheduledAt: data.scheduledAt,
        deadline: data.deadline
      }
    });

    eventBus.emit('CampusDriveCreated', { id: drive.id, universityId });
    return {
      ...drive,
      title: data.title
    };
  }

  static async getDrives(universityId: string) {
    const events = await prisma.event.findMany({
      where: {
        title: { startsWith: `CAMPUS_DRIVE:${universityId}:` },
        isDeleted: false
      }
    });

    return events.map(e => {
      const parts = this.deserializeDriveTitle(e.title);
      return {
        ...e,
        title: parts ? parts.title : e.title
      };
    });
  }

  static async updateDrive(universityId: string, id: string, data: any) {
    const drive = await prisma.event.findFirst({
      where: {
        id,
        title: { startsWith: `CAMPUS_DRIVE:${universityId}:` }
      }
    });

    if (!drive) throw new Error('Campus drive not found or unauthorized.');

    const fullTitle = data.title ? this.serializeDriveTitle(universityId, data.title) : undefined;

    const result = await prisma.event.update({
      where: { id },
      data: {
        title: fullTitle,
        description: data.description,
        location: data.location,
        scheduledAt: data.scheduledAt,
        deadline: data.deadline
      }
    });

    eventBus.emit('CampusDriveUpdated', { id: result.id, universityId });
    return result;
  }
}
