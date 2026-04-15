import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendPaymentAlertEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const userId = Number(body?.userId);

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Fetch the target user with their latest order
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        institution: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.email) {
      return NextResponse.json({ error: 'User has no email on file' }, { status: 400 });
    }

    const latestOrder = targetUser.orders[0];
    const amountDue = latestOrder ? Number(latestOrder.totalPrice) : 0;
    const institutionName = targetUser.institution?.name || 'N/A';

    // Send the email
    await sendPaymentAlertEmail({
      to: targetUser.email,
      name: targetUser.name || 'Customer',
      institution: institutionName,
      amount: amountDue,
    });

    // Log the alert in the database (update the order's updatedAt as a record)
    if (latestOrder) {
      await prisma.order.update({
        where: { id: latestOrder.id },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payment alert sent to ${targetUser.email}`,
    });
  } catch (error: any) {
    console.error('Send alert error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send payment alert' },
      { status: 500 }
    );
  }
}
