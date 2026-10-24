
import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  activatePremiumForVerifiedPayment,
  getServerConfig,
} from '../../../../lib/paystack';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { paystackSecret } = getServerConfig();
    const rawBody = await request.text();
    const signature =
      request.headers.get('x-paystack-signature') || '';

    const expected = createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    const suppliedBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: 'Invalid signature.' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    if (event?.event === 'charge.success') {
      const reference = event?.data?.reference;
      const userId = event?.data?.metadata?.user_id;

      if (
        typeof reference === 'string' &&
        typeof userId === 'string'
      ) {
        await activatePremiumForVerifiedPayment(reference, userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);

    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
