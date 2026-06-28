import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.careerbridge.app',
  appName: 'CareerBridge',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
