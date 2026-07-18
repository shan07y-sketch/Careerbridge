import crypto from 'crypto';

const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 500;

interface CacheEntry {
  value: string;
  expiresAt: number;
}

export class AICacheService {
  private static cache = new Map<string, CacheEntry>();

  static generateHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  static get(hash: string): string | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(hash);
      return null;
    }
    return entry.value;
  }

  static set(hash: string, value: string): void {
    // Simple FIFO eviction keeps memory bounded without an LRU dependency.
    if (this.cache.size >= MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(hash, { value, expiresAt: Date.now() + TTL_MS });
  }
}
