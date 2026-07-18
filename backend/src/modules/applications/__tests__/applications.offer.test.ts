import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../applications.repository', () => ({
  ApplicationsRepository: {
    getApplications: vi.fn(),
    getApplicationById: vi.fn(),
    getOfferById: vi.fn(),
    respondToOffer: vi.fn(),
    hasApplied: vi.fn(),
    applyToJob: vi.fn(),
    deleteApplication: vi.fn()
  }
}));

vi.mock('../../profile/profile.repository', () => ({
  ProfileRepository: {
    getStudentProfile: vi.fn()
  }
}));

vi.mock('../../notifications/notifications.service', () => ({
  NotificationsService: {
    createNotification: vi.fn()
  }
}));

vi.mock('../../../config/database', () => ({
  prisma: {
    job: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() }
  }
}));

import { ApplicationsService } from '../applications.service';
import { ApplicationsRepository } from '../applications.repository';
import { ProfileRepository } from '../../profile/profile.repository';
import { NotificationsService } from '../../notifications/notifications.service';
import { prisma } from '../../../config/database';

const mockedRepo = vi.mocked(ApplicationsRepository);
const mockedProfileRepo = vi.mocked(ProfileRepository);
const mockedNotifications = vi.mocked(NotificationsService);
const mockedPrisma = vi.mocked(prisma, true);

const PROFILE = { id: 'profile-1' };
const APP = { id: 'app-1', studentProfileId: 'profile-1', jobId: 'job-1', offer: { id: 'offer-1' } };

describe('ApplicationsService.respondToOffer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects responding when there is no offer on the application', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getApplicationById.mockResolvedValue({ ...APP, offer: null } as any);

    await expect(ApplicationsService.respondToOffer('user-1', 'app-1', true)).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'OFFER_NOT_FOUND'
    });
  });

  it('rejects responding to an offer that is not currently outstanding', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getApplicationById.mockResolvedValue(APP as any);
    mockedRepo.getOfferById.mockResolvedValue({ id: 'offer-1', applicationId: 'app-1', status: 'WITHDRAWN' } as any);

    await expect(ApplicationsService.respondToOffer('user-1', 'app-1', true)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'OFFER_NOT_RESPONDABLE'
    });
    expect(mockedRepo.respondToOffer).not.toHaveBeenCalled();
  });

  it('accepts an outstanding offer and notifies the recruiter', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getApplicationById.mockResolvedValue(APP as any);
    mockedRepo.getOfferById.mockResolvedValue({ id: 'offer-1', applicationId: 'app-1', status: 'EXTENDED' } as any);
    mockedRepo.respondToOffer.mockResolvedValue({ id: 'offer-1', status: 'ACCEPTED' } as any);
    mockedPrisma.job.findUnique.mockResolvedValue({
      title: 'Frontend Engineer',
      recruiter: { user: { id: 'user-recruiter-1' } }
    } as any);

    const result = await ApplicationsService.respondToOffer('user-1', 'app-1', true);

    expect(result.status).toBe('ACCEPTED');
    expect(mockedRepo.respondToOffer).toHaveBeenCalledWith('offer-1', true);
    expect(mockedNotifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'user-recruiter-1', title: 'Offer accepted' })
    );
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'OFFER_ACCEPTED' }) })
    );
  });

  it('declines an outstanding offer and notifies the recruiter', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getApplicationById.mockResolvedValue(APP as any);
    mockedRepo.getOfferById.mockResolvedValue({ id: 'offer-1', applicationId: 'app-1', status: 'EXTENDED' } as any);
    mockedRepo.respondToOffer.mockResolvedValue({ id: 'offer-1', status: 'DECLINED' } as any);
    mockedPrisma.job.findUnique.mockResolvedValue({
      title: 'Frontend Engineer',
      recruiter: { user: { id: 'user-recruiter-1' } }
    } as any);

    const result = await ApplicationsService.respondToOffer('user-1', 'app-1', false);

    expect(result.status).toBe('DECLINED');
    expect(mockedNotifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Offer declined' })
    );
  });
});
