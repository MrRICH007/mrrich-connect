
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'MR RICH CONNECT',
    short_name: 'MR RICH',
    description: 'Connect, chat, create groups, and build your community.',
    start_url: '/?tab=Messages',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#080D1C',
    theme_color: '#0B1F5E',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
