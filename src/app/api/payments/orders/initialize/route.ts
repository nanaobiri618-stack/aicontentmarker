import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { initializeOrderPayment } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const orderId = Number(body?.orderId);
    const storeSlug = String(body?.storeSlug || '');

    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    if (!storeSlug) return NextResponse.json({ error: 'storeSlug is required' }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, product: { include: { institution: true } } },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const sessionUserId = parseInt(String((session.user as any).id));
    if (order.userId !== sessionUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const payment = await initializeOrderPayment({
      email: order.user.email!,
      amountGhs: Number(order.totalPrice),
      callbackUrl: `${process.env.NEXTAUTH_URL}/store/${storeSlug}/checkout?orderId=${order.id}`,
      metadata: {
        order_id: order.id,
        product_id: order.productId,
        institution_id: order.product.institutionId,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: payment.reference },
    });

    return NextResponse.json(payment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

