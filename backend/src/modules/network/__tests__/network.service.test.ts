import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for the "networking is client-side-only" gap flagged
// in the Phase 0 audit: Network.tsx previously toggled local component state
// with no backend call at all, so a connection request vanished on refresh
// and was never visible to the other party. These tests lock in the real,
// persisted behavior: duplicate/self requests are rejected, only the
// receiver may accept/decline, and both actions notify the right person.

vi.mock('../network.repository', () => ({
  NetworkRepository: {
    findProfileById: vi.fn(),
    findExistingConnection: vi.fn(),
    createConnectionRequest: vi.fn(),
    findConnectionById: vi.fn(),
    updateConnectionStatus: vi.fn(),
    getConnectionsForProfile: vi.fn()
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

import { NetworkService } from '../network.service';
import { NetworkRepository } from '../network.repository';
import { ProfileRepository } from '../../profile/profile.repository';
import { NotificationsService } from '../../notifications/notifications.service';

const mockedNetworkRepo = vi.mocked(NetworkRepository);
const mockedProfileRepo = vi.mocked(ProfileRepository);
const mockedNotifications = vi.mocked(NotificationsService);

const ME = { id: 'profile-me', userId: 'user-me', firstName: 'Alex', lastName: 'Rivera' };
const TARGET = { id: 'profile-target', userId: 'user-target', firstName: 'Jordan', lastName: 'Lee' };

describe('NetworkService.requestConnection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects sending a request to yourself', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(ME as any);

    await expect(NetworkService.requestConnection('user-me', ME.id)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'INVALID_TARGET'
    });
    expect(mockedNetworkRepo.createConnectionRequest).not.toHaveBeenCalled();
  });

  it('rejects a target that does not exist', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(ME as any);
    mockedNetworkRepo.findProfileById.mockResolvedValue(null);

    await expect(NetworkService.requestConnection('user-me', 'nonexistent')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'TARGET_NOT_FOUND'
    });
  });

  it('rejects a duplicate request when one is already pending', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(ME as any);
    mockedNetworkRepo.findProfileById.mockResolvedValue(TARGET as any);
    mockedNetworkRepo.findExistingConnection.mockResolvedValue({ status: 'PENDING' } as any);

    await expect(NetworkService.requestConnection('user-me', TARGET.id)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'REQUEST_PENDING'
    });
    expect(mockedNetworkRepo.createConnectionRequest).not.toHaveBeenCalled();
  });

  it('rejects requesting a connection that is already accepted', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(ME as any);
    mockedNetworkRepo.findProfileById.mockResolvedValue(TARGET as any);
    mockedNetworkRepo.findExistingConnection.mockResolvedValue({ status: 'ACCEPTED' } as any);

    await expect(NetworkService.requestConnection('user-me', TARGET.id)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'ALREADY_CONNECTED'
    });
  });

  it('creates a persisted connection and notifies the target on a fresh request', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(ME as any);
    mockedNetworkRepo.findProfileById.mockResolvedValue(TARGET as any);
    mockedNetworkRepo.findExistingConnection.mockResolvedValue(null);
    mockedNetworkRepo.createConnectionRequest.mockResolvedValue({ id: 'conn-1', status: 'PENDING' } as any);

    const result = await NetworkService.requestConnection('user-me', TARGET.id);

    expect(result.id).toBe('conn-1');
    expect(mockedNetworkRepo.createConnectionRequest).toHaveBeenCalledWith(ME.id, TARGET.id);
    expect(mockedNotifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: TARGET.userId, type: 'NETWORK' })
    );
  });
});

describe('NetworkService.respondToConnection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a response from someone who is not the receiver', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(ME as any);
    mockedNetworkRepo.findConnectionById.mockResolvedValue({
      id: 'conn-1',
      receiverId: 'someone-else',
      status: 'PENDING'
    } as any);

    await expect(NetworkService.respondToConnection('user-me', 'conn-1', 'accept')).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'FORBIDDEN'
    });
    expect(mockedNetworkRepo.updateConnectionStatus).not.toHaveBeenCalled();
  });

  it('rejects responding to a request that was already resolved', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(ME as any);
    mockedNetworkRepo.findConnectionById.mockResolvedValue({
      id: 'conn-1',
      receiverId: ME.id,
      status: 'ACCEPTED'
    } as any);

    await expect(NetworkService.respondToConnection('user-me', 'conn-1', 'accept')).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'ALREADY_RESOLVED'
    });
  });

  it('accepts a pending request and notifies the original sender', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(ME as any);
    mockedNetworkRepo.findConnectionById.mockResolvedValue({
      id: 'conn-1',
      receiverId: ME.id,
      senderId: TARGET.id,
      status: 'PENDING'
    } as any);
    mockedNetworkRepo.updateConnectionStatus.mockResolvedValue({ id: 'conn-1', status: 'ACCEPTED' } as any);
    mockedNetworkRepo.findProfileById.mockResolvedValue(TARGET as any);

    const result = await NetworkService.respondToConnection('user-me', 'conn-1', 'accept');

    expect(result.status).toBe('ACCEPTED');
    expect(mockedNetworkRepo.updateConnectionStatus).toHaveBeenCalledWith('conn-1', 'ACCEPTED');
    expect(mockedNotifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: TARGET.userId, type: 'NETWORK' })
    );
  });

  it('declines a pending request without notifying anyone', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(ME as any);
    mockedNetworkRepo.findConnectionById.mockResolvedValue({
      id: 'conn-1',
      receiverId: ME.id,
      senderId: TARGET.id,
      status: 'PENDING'
    } as any);
    mockedNetworkRepo.updateConnectionStatus.mockResolvedValue({ id: 'conn-1', status: 'DECLINED' } as any);

    const result = await NetworkService.respondToConnection('user-me', 'conn-1', 'decline');

    expect(result.status).toBe('DECLINED');
    expect(mockedNotifications.createNotification).not.toHaveBeenCalled();
  });
});
