import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyTransaction } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    const orderId = Number(searchParams.get('orderId'));

    if (!reference) return NextResponse.json({ error: 'reference is required' }, { status: 400 });
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const sessionUserId = parseInt(String((session.user as any).id));
    if (order.userId !== sessionUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await verifyTransaction(reference);

    if (data.status === 'success') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, status: data.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

