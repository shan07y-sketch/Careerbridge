import { prisma } from '../../config/database';
import { ConnectionStatus } from '@prisma/client';

export class NetworkRepository {
  static async findProfileById(studentProfileId: string) {
    return prisma.studentProfile.findUnique({
      where: { id: studentProfileId }
    });
  }

  /**
   * A connection is undirected in meaning even though the schema models it
   * as sender/receiver, so an existing request in *either* direction must
   * block a duplicate (you shouldn't be able to send a second request to
   * someone who already sent you one).
   */
  static async findExistingConnection(profileIdA: string, profileIdB: string) {
    return prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: profileIdA, receiverId: profileIdB },
          { senderId: profileIdB, receiverId: profileIdA }
        ]
      }
    });
  }

  static async createConnectionRequest(senderId: string, receiverId: string) {
    return prisma.connection.create({
      data: { senderId, receiverId, status: ConnectionStatus.PENDING }
    });
  }

  static async findConnectionById(id: string) {
    return prisma.connection.findUnique({ where: { id } });
  }

  static async updateConnectionStatus(id: string, status: ConnectionStatus) {
    return prisma.connection.update({
      where: { id },
      data: { status }
    });
  }

  /**
   * Every connection (any status) touching this profile, with enough of the
   * other party's info to render a network list without N+1 lookups from
   * the caller.
   */
  static async getConnectionsForProfile(profileId: string) {
    return prisma.connection.findMany({
      where: {
        OR: [{ senderId: profileId }, { receiverId: profileId }]
      },
      include: {
        sender: { select: { id: true, userId: true, firstName: true, lastName: true, avatarUrl: true, preferredRole: true } },
        receiver: { select: { id: true, userId: true, firstName: true, lastName: true, avatarUrl: true, preferredRole: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
