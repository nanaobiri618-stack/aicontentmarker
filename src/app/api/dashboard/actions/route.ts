import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, id, status, forwarded } = await req.json();

    if (type === 'delivery') {
      const delivery = await prisma.deliveryDetails.update({
        where: { orderId: id },
        data: { status },
      });
      return NextResponse.json(delivery);
    }

    if (type === 'complaint') {
      const complaint = await prisma.complaint.update({
        where: { id },
        data: { 
          status: status || undefined,
          forwarded: forwarded !== undefined ? forwarded : undefined
        },
      });
      return NextResponse.json(complaint);
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
