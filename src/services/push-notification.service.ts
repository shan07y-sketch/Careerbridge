import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export class PushNotificationService {
  private static isNative = Capacitor.isNativePlatform();

  /**
   * Best-effort push registration. Push requires a Firebase `google-services.json`
   * in the Android project; without it `register()` fails natively. Everything is
   * wrapped so a missing/misconfigured Firebase can NEVER crash or block app
   * startup — the app simply runs without push. Also guards for the plugin being
   * unavailable (older webviews / plugin not installed).
   */
  static async initialize() {
    if (!this.isNative) {
      console.log('[PUSH] Push notifications skipped (non-native platform).');
      return;
    }

    // If the plugin isn't registered on this platform build, do nothing.
    if (!Capacitor.isPluginAvailable('PushNotifications')) {
      console.log('[PUSH] PushNotifications plugin unavailable; skipping.');
      return;
    }

    try {
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
        perm = await PushNotifications.requestPermissions();
      }

      if (perm.receive !== 'granted') {
        console.log('[PUSH] Permission not granted; push disabled.');
        return;
      }

      // Register listeners BEFORE register() so a registrationError is captured
      // rather than surfacing as an unhandled rejection.
      this.addListeners();
      await PushNotifications.register();
    } catch (err) {
      // Most common cause: no Firebase google-services.json, so register()
      // throws "Default FirebaseApp is not initialized". Swallow — the app is
      // fully usable without push.
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
