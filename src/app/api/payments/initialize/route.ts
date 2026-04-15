import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/payments';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    const paymentData = await createSubscription(user.email!, planId);

    return NextResponse.json({
      authorization_url: paymentData.authorization_url,
      reference: paymentData.reference,
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
