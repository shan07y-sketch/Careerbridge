import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export class PushNotificationService {
  private static isNative = Capacitor.isNativePlatform();

  static async initialize() {
    if (!this.isNative) {
      console.log('[PUSH] Push notifications skipped (non-native platform).');
      return;
    }

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive !== 'granted') {
      perm = await PushNotifications.requestPermissions();
    }

    if (perm.receive === 'granted') {
      await PushNotifications.register();
      this.addListeners();
    }
  }

  private static addListeners() {
    PushNotifications.addListener('registration', (token: { value: string }) => {
      console.log('[PUSH] Native push registration token:', token.value);
    });

    PushNotifications.addListener('registrationError', (err: any) => {
      console.error('[PUSH] Native push registration failed:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('[PUSH] Push notification received:', notification);
    });
  }
}
