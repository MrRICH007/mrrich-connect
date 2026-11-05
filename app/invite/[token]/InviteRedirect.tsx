'use client';

import { useEffect } from 'react';

export default function InviteRedirect({ token }: { token: string }) {
  useEffect(() => {
    window.location.replace(`/?invite=${encodeURIComponent(token)}`);
  }, [token]);

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: '#080d16', color: '#f8fafc', textAlign: 'center' }}>
      <div>
        <h1 style={{ marginBottom: 8 }}>MR RICH CONNECT</h1>
        <p>Opening your personal invitation…</p>
        <a href={`/?invite=${encodeURIComponent(token)}`} style={{ color: '#93c5fd' }}>Continue to invitation</a>
      </div>
    </main>
  );
}
