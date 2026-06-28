import http from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';

const server = http.createServer(app);

import { SocketService } from './modules/shared/socket.service';
import { RedisService } from './modules/shared/redis.service';

const startServer = async () => {
  try {
    // Verify database connectivity
    await prisma.$connect();
    logger.info('Database connection established successfully.');
  } catch (err) {
    logger.error(err, 'Database connection failed. Continuing server startup in disconnected mode.');
  }

  // Initialize Redis Cache wrapper
  await RedisService.initialize();

  // Initialize Socket.IO Server wrapper
  SocketService.initialize(server);

  try {
    server.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode.`);
    });
  } catch (err) {
    logger.fatal(err, 'Failed to startup server.');
    process.exit(1);
  }
};

// Clean termination handlers
const shutdown = async (signal: string) => {
  logger.warn(`Received ${signal}. Starting clean shutdown.`);
  server.close(async () => {
    logger.info('HTTP server terminated.');
    await prisma.$disconnect();
    logger.info('Database client disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ promise, reason }, 'Unhandled Promise Rejection.');
});

process.on('uncaughtException', (error) => {
  logger.fatal(error, 'Uncaught Exception.');
  process.exit(1);
});

startServer();
