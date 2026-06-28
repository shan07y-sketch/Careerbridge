import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export class StorageService {
  private static isNative = Capacitor.isNativePlatform();

  static async getItem(key: string): Promise<string | null> {
    if (this.isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  }

  static async setItem(key: string, value: string): Promise<void> {
    if (this.isNative) {
      await Preferences.set({ key, value });
      return;
    }
    localStorage.setItem(key, value);
  }

  static async removeItem(key: string): Promise<void> {
    if (this.isNative) {
      await Preferences.remove({ key });
      return;
    }
    localStorage.removeItem(key);
  }

  static async clear(): Promise<void> {
    if (this.isNative) {
      await Preferences.clear();
      return;
    }
    localStorage.clear();
  }
}
