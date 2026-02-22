import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apartmentmanager.app',
  appName: 'Apartment Manager',
  webDir: 'dist/part-manager/browser',
  server: {
    url: 'http://10.0.2.2:4200',
    cleartext: true,
  },
};

export default config;
