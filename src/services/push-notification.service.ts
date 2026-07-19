import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Push notifications are DISABLED until Firebase is configured.
 *
 * The Android app has no `google-services.json`, so `PushNotifications.register()`
 * fails at the NATIVE layer with "Default FirebaseApp is not initialized" — and a
 * native crash cannot be caught by a JavaScript try/catch, so it takes the whole
 * app down (this is exactly what crashed the app right after tapping "Allow" on
 * the permission prompt). Requesting the permission at all is therefore both
 * pointless and dangerous here.
 *
 * To ENABLE push later:
 *   1. Add `android/app/google-services.json` from your Firebase project
 *      (the gradle build applies the google-services plugin only when it exists).
 *   2. Flip PUSH_ENABLED to true.
 */
const PUSH_ENABLED = false;

export class PushNotificationService {
  private static isNative = Capacitor.isNativePlatform();

  static async initialize() {
    if (!PUSH_ENABLED) {
      console.log('[PUSH] Disabled (no Firebase config). Skipping permission + register.');
      return;
    }

    if (!this.isNative || !Capacitor.isPluginAvailable('PushNotifications')) {
      return;
    }

    try {
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted') return;

      this.addListeners();
      await PushNotifications.register();
    } catch (err) {
      console.warn('[PUSH] Push notifications unavailable; continuing without them.', err);
    }
  }

  private static addListeners() {
    try {
      PushNotifications.addListener('registration', (token: { value: string }) => {
        console.log('[PUSH] Native push registration token:', token.value);
      });
      PushNotifications.addListener('registrationError', (err: unknown) => {
        console.warn('[PUSH] Native push registration failed:', err);
      });
      PushNotifications.addListener('pushNotificationReceived', (notification: unknown) => {
        console.log('[PUSH] Push notification received:', notification);
      });
    } catch (err) {
      console.warn('[PUSH] Could not attach push listeners:', err);
    }
  }
}
