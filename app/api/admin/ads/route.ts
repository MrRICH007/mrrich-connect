import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-server';
export async function GET(request: NextRequest) {
  try { const auth = await requireAdmin(request); if ('response' in auth) return auth.response;
    const { data, error } = await auth.db.from('ad_campaigns').select('id,title,media_type,media_path,target_url,starts_at,expires_at,is_enabled,created_at').order('created_at', { ascending: false }).limit(100);
    if (error) return Response.json({ error: error.message }, { status: 500 }); return Response.json({ ads: data || [] });
  } catch (e: any) { return Response.json({ error: e?.message || 'Admin request failed.' }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try { const auth = await requireAdmin(request); if ('response' in auth) return auth.response;
    const form = await request.formData(); const file = form.get('image'); const title = String(form.get('title') || '').trim().slice(0, 120); const target = String(form.get('target_url') || '').trim(); const expires = String(form.get('expires_at') || '');
    if (!(file instanceof File) || !file.type.startsWith('image/')) return Response.json({ error: 'Choose an image file.' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return Response.json({ error: 'Image must be 5 MB or smaller.' }, { status: 400 });
    if (!title || !target || !expires) return Response.json({ error: 'Title, destination URL and expiry date are required.' }, { status: 400 });
    let parsed: URL; try { parsed = new URL(target); } catch { return Response.json({ error: 'Enter a valid destination URL.' }, { status: 400 }); }
    if (!['http:', 'https:'].includes(parsed.protocol)) return Response.json({ error: 'Destination must use HTTP or HTTPS.' }, { status: 400 });
    if (!Number.isFinite(Date.parse(expires)) || Date.parse(expires) <= Date.now()) return Response.json({ error: 'Expiry must be in the future.' }, { status: 400 });
    const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'jpg'; const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await auth.db.storage.from('ad-images').upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return Response.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });
    const { data: publicData } = auth.db.storage.from('ad-images').getPublicUrl(path);
    const { data, error } = await auth.db.from('ad_campaigns').insert({ title, media_type: 'image', media_path: publicData.publicUrl, target_url: parsed.toString(), starts_at: new Date().toISOString(), expires_at: new Date(expires).toISOString(), is_enabled: true }).select('id,title,media_type,media_path,target_url,starts_at,expires_at,is_enabled').single();
    if (error) { await auth.db.storage.from('ad-images').remove([path]); return Response.json({ error: error.message }, { status: 500 }); }
    return Response.json({ ad: data });
  } catch (e: any) { return Response.json({ error: e?.message || 'Admin request failed.' }, { status: 500 }); }
}
