import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Payment reference required' }, { status: 400 });
    }

    const result = await verifyPayment(reference);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
