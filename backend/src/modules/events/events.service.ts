import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';

export class EventsService {
  static async getEvents() {
    const events = await prisma.event.findMany({
      where: { isDeleted: false },
      include: {
        registrations: { select: { id: true, studentProfileId: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return events.map(ev => ({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      location: ev.location,
      date: ev.scheduledAt.toISOString(),
      deadline: ev.deadline.toISOString(),
      totalSeats: ev.maxSeats ?? 0,
      remainingSeats: Math.max(0, (ev.maxSeats ?? 0) - ev.registrations.length),
      registeredCount: ev.registrations.length,
      banner: `https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200`,
      organizer: 'CareerBridge Platform',
      speakers: [],
      registered: false // will be overridden in authenticated context
    }));
  }

  static async getEventById(eventId: string) {
    const ev = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: { select: { id: true, studentProfileId: true } }
      }
    });
    if (!ev || ev.isDeleted) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }
    return {
      id: ev.id,
      title: ev.title,
      description: ev.description,
      location: ev.location,
      date: ev.scheduledAt.toISOString(),
      deadline: ev.deadline.toISOString(),
      totalSeats: ev.maxSeats ?? 0,
      remainingSeats: Math.max(0, (ev.maxSeats ?? 0) - ev.registrations.length),
      registeredCount: ev.registrations.length,
      banner: `https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200`,
      organizer: 'CareerBridge Platform',
      speakers: [],
      registered: false
    };
  }

  static async registerForEvent(userId: string, eventId: string) {
    const ev = await prisma.event.findUnique({
      where: { id: eventId },
      include: { registrations: true }
    });
    if (!ev || ev.isDeleted) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppError('Student profile required to register', 403, 'PROFILE_REQUIRED');
    }

    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId, studentProfileId: profile.id }
    });
    if (existing) {
      throw new AppError('Already registered for this event', 409, 'ALREADY_REGISTERED');
    }

    if (ev.maxSeats !== null && ev.registrations.length >= ev.maxSeats) {
      throw new AppError('No seats available for this event', 409, 'NO_SEATS');
    }

    await prisma.eventRegistration.create({
      data: { eventId, studentProfileId: profile.id }
    });

    return { registered: true, eventId };
  }

  static async unregisterFromEvent(userId: string, eventId: string) {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) return;

    await prisma.eventRegistration.deleteMany({
      where: { eventId, studentProfileId: profile.id }
    });
  }
}
