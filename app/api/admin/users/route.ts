import { NextRequest } from 'next/server';
import { requireAdmin, isProtectedAccount } from '@/lib/admin-server';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request); if ('response' in auth) return auth.response;
    const q = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);
    const { data: profiles, error } = await auth.db.from('profiles').select('id,nickname,level,college,school,department,bio,avatar_url,premium_status,premium_title,total_online_seconds,is_blocked,created_at').order('created_at', { ascending: false }).limit(1000);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const rows = profiles || [];
    const ids = rows.map((p: any) => p.id);
    const { data: privates, error: privateError } = ids.length ? await auth.db.from('private_profiles').select('user_id,full_name,phone').in('user_id', ids) : { data: [], error: null };
    if (privateError) return Response.json({ error: `Could not load private profiles: ${privateError.message}` }, { status: 500 });
    const privateMap = new Map((privates || []).map((p: any) => [p.user_id, p]));
    const { data: authUsers } = await auth.db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailMap = new Map((authUsers?.users || []).map((u: any) => [u.id, u.email || '']));
    const needle = q.toLowerCase();
    const users = rows.map((p: any) => ({ ...p, private_profile: privateMap.get(p.id) || null, email: emailMap.get(p.id) || '', is_protected: isProtectedAccount(p.id) }));
    return Response.json({ users: needle ? users.filter((u: any) => [u.nickname,u.level,u.school].some(v => String(v || '').toLowerCase().includes(needle))) : users });
  } catch (e: any) { return Response.json({ error: e?.message || 'Admin request failed.' }, { status: 500 }); }
}
