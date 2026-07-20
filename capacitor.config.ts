import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.careerbridge.app',
  appName: 'CareerBridge',
  webDir: 'dist',
  server: {
    // https scheme keeps secure-context APIs (camera, mic, clipboard) working
    // inside the WebView and matches production web behavior.
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#14453D',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#14453D',
      overlaysWebView: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
