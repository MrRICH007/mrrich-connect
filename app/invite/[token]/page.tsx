import type { Metadata } from 'next';
import InviteRedirect from './InviteRedirect';

type Preview = { nickname?: string; avatar_url?: string | null } | null;

async function getPreview(token: string): Promise<Preview> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const response = await fetch(`${url}/rest/v1/rpc/rc_get_inviter_preview`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_token: token }),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const preview = await getPreview(token);
  const nickname = preview?.nickname?.replace(/^@/, '') || 'MR RICH CONNECT MEMBER';
  const title = `Connect with @${nickname} on MR RICH CONNECT`;
  const description = `You are invited to connect with @${nickname} on MR RICH CONNECT. Create your account and message each other directly.`;
  const images = preview?.avatar_url ? [{ url: preview.avatar_url, alt: `@${nickname} on MR RICH CONNECT` }] : [];
  return {
    title,
    description,
    openGraph: { type: 'website', title, description, images },
    twitter: { card: images.length ? 'summary_large_image' : 'summary', title, description, images },
  };
}

export default async function InviteLanding({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteRedirect token={token} />;
}
