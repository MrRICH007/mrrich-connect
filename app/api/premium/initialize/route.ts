
import { NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  getServerConfig,
} from '../../../../lib/paystack';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in to purchase Premium.' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'Your account needs an email address.' },
        { status: 400 }
      );
    }

    const { paystackSecret } = getServerConfig();
    const origin = new URL(request.url).origin;

    const response = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: 150000,
          currency: 'NGN',
          callback_url: `${origin}/?premium=payment`,
          metadata: {
            user_id: user.id,
            plan: 'mr-rich-connect-premium-monthly',
            custom_fields: [
              {
                display_name: 'Plan',
                variable_name: 'plan',
                value: 'MR RICH CONNECT Premium — 1 month',
              },
            ],
          },
        }),
        cache: 'no-store',
      }
    );

    const result = await response.json();

    if (
      !response.ok ||
      !result?.status ||
      !result?.data?.authorization_url ||
      !result?.data?.reference
    ) {
      console.error('Paystack initialization failed:', result);

      return NextResponse.json(
        { error: 'Paystack could not start the payment. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error) {
    console.error('Premium initialization error:', error);

    return NextResponse.json(
      { error: 'Payment setup is temporarily unavailable.' },
      { status: 500 }
    );
  }
                    }
