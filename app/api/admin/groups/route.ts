import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-server';
export async function GET(request: NextRequest) {
  try { const auth = await requireAdmin(request); if ('response' in auth) return auth.response;
    const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
    const { data, error } = await auth.db.from('groups').select('id,name,conversation_id,avatar_url,created_by,member_limit,allowed_levels,allowed_schools,members_can_message,is_premium_only').order('name').limit(1000);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ groups: (data || []).filter((g: any) => !q || String(g.name || '').toLowerCase().includes(q)) });
  } catch (e: any) { return Response.json({ error: e?.message || 'Admin request failed.' }, { status: 500 }); }
}
