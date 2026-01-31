import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.engagekit.demo',
  appName: 'EngageKit Demo',
  webDir: 'dist',
  server: {
    // For OAuth redirects - use https scheme for iOS
    androidScheme: 'https',
    iosScheme: 'https',
    // For development, uncomment and set to your computer's IP
    // url: 'http://192.168.1.XXX:5173',
    // cleartext: true,
  },
  plugins: {
    CapacitorCookies: {
      enabled: true, // Required for session management
    },
  },
};

export default config;
