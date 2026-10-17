import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MR RICH CONNECT',
  description: 'Connect, chat, create groups, and build your community.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
