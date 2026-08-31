import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cinetheme.app',
  appName: 'CineTheme',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: '#0a0a0f',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0f',
      overlaysWebView: true,
    },
  },
};

export default config;
