import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-server';
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const auth = await requireAdmin(request); if ('response' in auth) return auth.response; const { id } = await context.params; const b = await request.json();
    const patch: Record<string, unknown> = {};
    if (typeof b.name === 'string' && b.name.trim()) patch.name = b.name.trim().slice(0, 80);
    if (b.member_limit === null || (Number.isInteger(b.member_limit) && b.member_limit >= 2)) patch.member_limit = b.member_limit;
    if (Array.isArray(b.allowed_levels)) patch.allowed_levels = b.allowed_levels.filter((x: unknown) => typeof x === 'string').slice(0, 20);
    if (Array.isArray(b.allowed_schools)) patch.allowed_schools = b.allowed_schools.filter((x: unknown) => typeof x === 'string').slice(0, 100);
    if (typeof b.members_can_message === 'boolean') patch.members_can_message = b.members_can_message;
    if (typeof b.is_premium_only === 'boolean') patch.is_premium_only = b.is_premium_only;
    if (!Object.keys(patch).length) return Response.json({ error: 'No valid settings supplied.' }, { status: 400 });
    const { error } = await auth.db.from('groups').update(patch).eq('id', id); if (error) return Response.json({ error: error.message }, { status: 500 }); return Response.json({ ok: true });
  } catch (e: any) { return Response.json({ error: e?.message || 'Admin request failed.' }, { status: 500 }); }
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const auth = await requireAdmin(request); if ('response' in auth) return auth.response; const { id } = await context.params;
    const { data: group, error: readError } = await auth.db.from('groups').select('conversation_id').eq('id', id).maybeSingle(); if (readError) return Response.json({ error: readError.message }, { status: 500 });
    const { error } = await auth.db.from('groups').delete().eq('id', id); if (error) return Response.json({ error: error.message }, { status: 500 });
    if (group?.conversation_id) await auth.db.from('conversations').delete().eq('id', group.conversation_id);
    return Response.json({ ok: true });
  } catch (e: any) { return Response.json({ error: e?.message || 'Admin request failed.' }, { status: 500 }); }
}
