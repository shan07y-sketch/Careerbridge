import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { securityConfig } from '../../config/security';
import { logger } from '../../config/logger';
import { eventBus } from './event-bus';
import { PresenceService } from './presence.service';

export class SocketService {
  private static io: Server | null = null;
  private static userSockets = new Map<string, string[]>();

  static initialize(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: securityConfig.cors.origin,
        credentials: true
      }
    });

    this.io.use((socket: Socket, next) => {
      const authHeader = socket.handshake.auth.token || socket.handshake.headers.authorization;
      if (!authHeader) {
        return next(new Error('Authentication token is required.'));
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

      try {
        const decoded = jwt.verify(token, securityConfig.jwt.accessSecret) as any;
        socket.data.user = decoded;
        next();
      } catch (err) {
        logger.warn({ err }, 'Socket handshake authentication failure');
        next(new Error('Invalid credentials token.'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      const userId = user.id;

      logger.info({ socketId: socket.id, userId }, 'WS client connected');

      const existing = this.userSockets.get(userId) || [];
      this.userSockets.set(userId, [...existing, socket.id]);

      PresenceService.setUserOnline(userId);

      socket.join(`user:${userId}`);
      socket.join('global');
      if (user.role === 'ADMIN') {
        socket.join('admin');
      }

      socket.on('join-conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        logger.info({ socketId: socket.id, conversationId }, 'Joined conversation room');
      });

      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info({ socketId: socket.id, conversationId }, 'Left conversation room');
      });

      socket.on('typing-start', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('typing-started', {
          conversationId,
          userId,
          name: user.email.split('@')[0]
        });
      });

      socket.on('typing-stop', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('typing-stopped', {
          conversationId,
          userId
        });
      });

      socket.on('status-away', () => {
        PresenceService.setUserAway(userId);
      });

      socket.on('status-online', () => {
        PresenceService.setUserOnline(userId);
      });

      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id, userId }, 'WS client disconnected');
        const sockets = this.userSockets.get(userId) || [];
        const filtered = sockets.filter(id => id !== socket.id);
        if (filtered.length === 0) {
          this.userSockets.delete(userId);
          PresenceService.setUserOffline(userId);
        } else {
          this.userSockets.set(userId, filtered);
        }
      });
    });

    this.registerEventBusListeners();
  }

  private static registerEventBusListeners() {
    eventBus.on('MessageSent', (payload: any) => {
      this.io?.to(`conversation:${payload.conversationId}`).emit('message-received', payload);
    });

    eventBus.on('MessageRead', (payload: any) => {
      this.io?.to(`conversation:${payload.conversationId}`).emit('message-read-receipt', payload);
    });

    eventBus.on('NotificationCreated', (payload: any) => {
      this.io?.to(`user:${payload.recipientId}`).emit('notification-received', payload);
    });

    eventBus.on('PresenceChanged', (payload: any) => {
      this.io?.to('global').emit('presence-updated', payload);
    });

    eventBus.on('ApplicationCreated', (payload: any) => {
      if (payload.companyId) {
        this.io?.to(`company:${payload.companyId}`).emit('application-submitted', payload);
      }
    });

    eventBus.on('ApplicationUpdated', (payload: any) => {
      this.io?.to(`user:${payload.studentId}`).emit('application-updated', payload);
    });
  }

  static sendToUser(userId: string, event: string, data: any) {
    this.io?.to(`user:${userId}`).emit(event, data);
  }
}
