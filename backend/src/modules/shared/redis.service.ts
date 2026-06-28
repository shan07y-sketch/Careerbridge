import { createClient } from 'redis';
import { logger } from '../../config/logger';

export class RedisService {
  private static client: any = null;
  private static isConnected = false;
  private static memoryCache = new Map<string, { value: string; expiry: number }>();

  static async initialize() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    logger.info({ url }, '[REDIS] Connecting to server...');

    try {
      this.client = createClient({
        url,
        socket: {
          reconnectStrategy: false
        }
      });
      
      this.client.on('error', (err: any) => {
        logger.error({ err }, '[REDIS] Connection error. Switching to in-memory fallback cache.');
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('[REDIS] Client connected successfully.');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (err) {
      logger.error({ err }, '[REDIS] Initialization failed. Running in in-memory fallback cache mode.');
      this.isConnected = false;
    }
  }

  static async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        logger.warn({ err }, '[REDIS] Failed to execute GET operation. Checking fallback cache.');
      }
    }

    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    if (cached.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return cached.value;
  }

  static async set(key: string, value: string, ttlSeconds = 3600): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, value, { EX: ttlSeconds });
        return;
      } catch (err) {
        logger.warn({ err }, '[REDIS] Failed to execute SET operation. Saving in fallback cache.');
      }
    }

    const expiry = Date.now() + (ttlSeconds * 1000);
    this.memoryCache.set(key, { value, expiry });
  }

  static async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        logger.warn({ err }, '[REDIS] Failed to execute DEL operation.');
      }
    }
    this.memoryCache.delete(key);
  }

  static async flush(): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.flushAll();
        return;
      } catch (err) {
        logger.warn({ err }, '[REDIS] Failed to execute flushAll.');
      }
    }
    this.memoryCache.clear();
  }
}
