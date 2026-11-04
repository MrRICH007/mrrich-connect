import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKETS = ['status-images', 'announcements', 'ad-images'] as const;
const HOUR_12 = 12 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const secret = process.env.MEDIA_CLEANUP_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || new URL(request.url).searchParams.get('key');
  if (!secret || supplied !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Supabase service configuration is missing' }, { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const cutoff = Date.now() - HOUR_12;
  const removed: Record<string, number> = {};

  async function walk(bucket: string, prefix = ''): Promise<string[]> {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } });
    if (error) throw new Error(`${bucket}: ${error.message}`);
    const paths: string[] = [];
    for (const item of data || []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) paths.push(...await walk(bucket, path));
      else if (item.created_at && new Date(item.created_at).getTime() < cutoff) paths.push(path);
    }
    return paths;
  }

  try {
    for (const bucket of BUCKETS) {
      const paths = await walk(bucket);
      let count = 0;
      for (let i = 0; i < paths.length; i += 100) {
        const batch = paths.slice(i, i + 100);
        const { error } = await supabase.storage.from(bucket).remove(batch);
        if (error) throw new Error(`${bucket} delete failed: ${error.message}`);
        count += batch.length;
      }
      removed[bucket] = count;
    }

    // Keep announcement rows in sync with their image expiry.
    const { error: announcementError } = await supabase.from('community_announcements').delete().lt('created_at', new Date(cutoff).toISOString());
    if (announcementError) throw new Error(`Announcement row cleanup failed: ${announcementError.message}`);
    const { data: statusPaths, error: statusError } = await supabase.from('user_statuses').select('image_path').lte('expires_at', new Date().toISOString());
    if (statusError) throw new Error(`Expired status lookup failed: ${statusError.message}`);
    const expired = (statusPaths || []).map(row => row.image_path).filter(Boolean);
    for (let i = 0; i < expired.length; i += 100) {
      const { error } = await supabase.storage.from('status-images').remove(expired.slice(i, i + 100));
      if (error) throw new Error(`Expired status image cleanup failed: ${error.message}`);
    }
    const { error: pruneError } = await supabase.rpc('rc_prune_expired_status_rows');
    if (pruneError) throw new Error(`Expired status row cleanup failed: ${pruneError.message}`);
    return NextResponse.json({ success: true, removed });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cleanup failed', removed }, { status: 500 });
  }
}
