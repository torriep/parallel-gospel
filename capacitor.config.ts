import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pierreroberge.parallelgospel',
  appName: 'Parallel Gospels',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FAF6EE',
    },
    StatusBar: {
      style: 'dark',
      overlaysWebView: false,
      visible: false,
    },
  },
  ios: {
    preferredContentMode: 'desktop',
  },
};

export default config;
