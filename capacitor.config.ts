import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mrrich.connect',
  appName: 'MR RICH CONNECT',
  webDir: 'www',
  // This app intentionally uses the live Next.js deployment. It is not a
  // static export, so server routes, Supabase flows, and payment endpoints
  // continue to run on the existing Render backend.
  server: {
    url: 'https://mrrich-connect.onrender.com',
    cleartext: false,
    allowNavigation: [
      'mrrich-connect.onrender.com',
      '*.supabase.co',
      '*.paystack.com',
      'checkout.paystack.com',
    ],
  },
  android: {
    backgroundColor: '#000000',
    allowMixedContent: false,
  },
};

export default config;
