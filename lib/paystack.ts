
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

export function getServerConfig() {
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !paystackSecret) {
    throw new Error('Missing server payment environment variables.');
  }

  return { supabaseUrl, supabaseAnonKey, serviceRoleKey, paystackSecret };
}

export function getAdminSupabase() {
  const { supabaseUrl, serviceRoleKey } = getServerConfig();

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) return null;

  const { supabaseUrl, supabaseAnonKey } = getServerConfig();

  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) return null;

  return data.user;
}

export async function activatePremiumForVerifiedPayment(
  reference: string,
  userId: string
) {
  const { paystackSecret } = getServerConfig();
  const admin = getAdminSupabase();

  // Prevent the same successful payment from being applied twice.
  const { data: existing } = await admin
    .from('premium_entitlements')
    .select('id,status,expires_at')
    .eq('provider_reference', reference)
    .maybeSingle();

  if (existing?.status === 'active') {
    return {
      alreadyProcessed: true,
      expiresAt: existing.expires_at,
    };
  }

  // Always verify directly with Paystack.
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${paystackSecret}` },
      cache: 'no-store',
    }
  );

  const result = await response.json();
  const transaction = result?.data;

  if (
    !response.ok ||
    !result?.status ||
    transaction?.status !== 'success'
  ) {
    throw new Error('Paystack has not confirmed a successful payment.');
  }

  if (
    Number(transaction.amount) !== 150000 ||
    transaction.currency !== 'NGN'
  ) {
    throw new Error('Payment amount or currency does not match the Premium plan.');
  }

  if (transaction.metadata?.user_id !== userId) {
    throw new Error('This payment reference does not belong to this account.');
  }

  const now = new Date();

  // Renewals extend an existing active membership instead of wasting
  // the remaining time on the current membership.
  const { data: current } = await admin
    .from('premium_entitlements')
    .select('expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', now.toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const startsAt =
    current?.expires_at && new Date(current.expires_at) > now
      ? new Date(current.expires_at)
      : now;

  // Add one calendar month while safely handling month-end dates.
  const expiresAt = new Date(startsAt);
  const originalDay = expiresAt.getUTCDate();

  expiresAt.setUTCDate(1);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);

  const lastDay = new Date(
    Date.UTC(
      expiresAt.getUTCFullYear(),
      expiresAt.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  expiresAt.setUTCDate(Math.min(originalDay, lastDay));

  const { error: entitlementError } = await admin
    .from('premium_entitlements')
    .upsert(
      {
        user_id: userId,
        source: 'payment',
        provider_reference: reference,
        status: 'active',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'provider_reference' }
    );

  if (entitlementError) {
    throw new Error(
      'Payment was verified but Premium could not be saved. Contact support with your payment reference.'
    );
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      premium_status: 'active',
      premium_title: 'Premium Member',
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(
      'Payment was verified but the profile could not be updated. Contact support with your payment reference.'
    );
  }

  return {
    alreadyProcessed: false,
    expiresAt: expiresAt.toISOString(),
  };
}
