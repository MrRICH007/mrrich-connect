
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const expectedSecret = Deno.env.get('MESSAGE_PUSH_WEBHOOK_SECRET');

  if (
    !expectedSecret ||
    req.headers.get('x-webhook-secret') !== expectedSecret
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('PROJECT_URL');
  const serviceKey = Deno.env.get('SERVICE_ROLE_KEY');
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const subject =
    Deno.env.get('VAPID_SUBJECT') ||
    'mailto:admin@mrrich-connect.example';

  if (!supabaseUrl || !serviceKey || !publicKey || !privateKey) {
    return new Response('Push environment missing', { status: 500 });
  }

  try {
    const payload = await req.json();
    const message = payload.record;

    if (
      payload.type !== 'INSERT' ||
      payload.table !== 'messages' ||
      !message?.conversation_id ||
      !message?.sender_id
    ) {
      return new Response('Ignored', { status: 200 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: members, error: membersError } = await admin
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', message.conversation_id)
      .neq('user_id', message.sender_id);

    if (membersError) throw membersError;

    const recipientIds = [
      ...new Set(
        (members || []).map((m: { user_id: string }) => m.user_id)
      ),
    ];

    if (!recipientIds.length) {
      return new Response(
        JSON.stringify({ message: 'No recipients', delivered: 0, failed: 0 }),
        { status: 200, headers: corsHeaders }
      );
    }

    const [
      { data: subscriptions, error: subError },
      { data: sender, error: senderError },
    ] = await Promise.all([
      admin
        .from('push_subscriptions')
        .select('id, user_id, endpoint, subscription')
        .in('user_id', recipientIds),
      admin
        .from('profiles')
        .select('nickname')
        .eq('id', message.sender_id)
        .maybeSingle(),
    ]);

    if (subError) throw subError;
    if (senderError) throw senderError;

    const validSubscriptions = subscriptions || [];

    if (!validSubscriptions.length) {
      return new Response(
        JSON.stringify({
          subscriptions: 0,
          delivered: 0,
          failed: 0,
          message: 'No push subscriptions found',
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const title = 'MR RICH CONNECT';
    const senderName = sender?.nickname
      ? `@${sender.nickname}`
      : 'Someone';

    const notification = JSON.stringify({
      title,
      body: `${senderName} sent you a new message.`,
      tag: `message-${message.id || crypto.randomUUID()}`,
      conversation_id: message.conversation_id,
      url: '/?tab=Messages',
    });

    let delivered = 0;
    let failed = 0;

    await Promise.all(
      validSubscriptions.map(
        async (sub: {
          id: string;
          subscription: webpush.PushSubscription;
        }) => {
          try {
            await webpush.sendNotification(
              sub.subscription,
              notification
            );

            delivered++;
          } catch (error) {
            failed++;

            const status = (
              error as { statusCode?: number }
            )?.statusCode;

            if (status === 404 || status === 410) {
              const { error: deleteError } = await admin
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id);

              if (deleteError) {
                console.error(
                  'Failed to remove expired subscription',
                  deleteError
                );
              }
            } else {
              console.error('Push delivery failed:', status || error);
            }
          }
        }
      )
    );

    const summary = {
      subscriptions: validSubscriptions.length,
      delivered,
      failed,
    };

    console.log('Push delivery summary:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Push function error:', error);

    return new Response(
      JSON.stringify({ error: 'Push delivery failed' }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
