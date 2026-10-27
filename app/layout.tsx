
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MR RICH CONNECT',
  description: 'Connect, chat, create groups, and build your community.',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
