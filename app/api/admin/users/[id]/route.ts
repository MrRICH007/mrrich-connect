import { NextRequest } from 'next/server';
import { requireAdmin, isProtectedAccount } from '@/lib/admin-server';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request); if ('response' in auth) return auth.response;
    const { id } = await context.params; const body = await request.json();
    if (!id) return Response.json({ error: 'Missing user id.' }, { status: 400 });
    const patch: Record<string, unknown> = {};
    if (body.action === 'premium') { if (!['active','inactive'].includes(body.value)) return Response.json({ error: 'Invalid Premium status.' }, { status: 400 }); patch.premium_status = body.value; }
    else if (body.action === 'block') { if (isProtectedAccount(id)) return Response.json({ error: 'The protected owner account cannot be blocked.' }, { status: 403 }); patch.is_blocked = !!body.value; }
    else return Response.json({ error: 'Unsupported action.' }, { status: 400 });
    const { error } = await auth.db.from('profiles').update(patch).eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (body.action === 'block') { const { error: banError } = await auth.db.auth.admin.updateUserById(id, { ban_duration: body.value ? '876000h' : 'none' }); if (banError) return Response.json({ error: `Profile status saved, but login restriction failed: ${banError.message}` }, { status: 500 }); }
    return Response.json({ ok: true });
  } catch (e: any) { return Response.json({ error: e?.message || 'Admin request failed.' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request); if ('response' in auth) return auth.response;
    const { id } = await context.params;
    if (isProtectedAccount(id)) return Response.json({ error: 'The protected owner account cannot be deleted.' }, { status: 403 });
    const { error } = await auth.db.auth.admin.deleteUser(id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e: any) { return Response.json({ error: e?.message || 'Admin request failed.' }, { status: 500 }); }
}
