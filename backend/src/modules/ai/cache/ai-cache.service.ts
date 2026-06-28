import crypto from 'crypto';

export class AICacheService {
  private static cache = new Map<string, string>();

  static generateHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  static get(hash: string): string | null {
    return this.cache.get(hash) || null;
  }

  static set(hash: string, value: string): void {
    this.cache.set(hash, value);
  }
}
