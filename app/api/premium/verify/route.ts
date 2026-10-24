
import { NextResponse } from 'next/server';
import {
  activatePremiumForVerifiedPayment,
  getAuthenticatedUser,
} from '../../../../lib/paystack';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in again to verify your payment.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reference =
      typeof body.reference === 'string' ? body.reference.trim() : '';

    if (!reference || reference.length > 200) {
      return NextResponse.json(
        { error: 'A valid payment reference is required.' },
        { status: 400 }
      );
    }

    const result = await activatePremiumForVerifiedPayment(
      reference,
      user.id
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Premium verification error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Payment verification failed.',
      },
      { status: 400 }
    );
  }
}
