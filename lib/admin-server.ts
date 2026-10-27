import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export async function requireAdmin(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) throw new Error('Missing Supabase server environment variables.');
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return { response: Response.json({ error: 'Sign in is required.' }, { status: 401 }) };
  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return { response: Response.json({ error: 'Your session is invalid or expired.' }, { status: 401 }) };
  const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin');
  if (adminError || isAdmin !== true) return { response: Response.json({ error: 'Admin access denied.' }, { status: 403 }) };
  return { user: authData.user, db: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }) };
}

export function isProtectedAccount(id: string) {
  // Fail closed: until the owner UUID is configured, destructive account actions are blocked.
  return !process.env.ADMIN_PROTECTED_USER_ID || id === process.env.ADMIN_PROTECTED_USER_ID;
}
