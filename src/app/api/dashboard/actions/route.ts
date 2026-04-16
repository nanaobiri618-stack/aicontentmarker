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
        include: {
          order: {
            include: {
              user: true,
              product: true
            }
          }
        }
      });

      // Send Email to Customer if delivered
      if (status === 'delivered') {
        try {
          const { sendDeliveryStatusEmail } = await import('@/lib/email');
          await sendDeliveryStatusEmail({
            to: delivery.order.user.email,
            name: delivery.order.user.name || 'Customer',
            productName: delivery.order.product.name,
            orderId: delivery.order.id
          });
        } catch (e) {
          console.error('Delivery Email Error:', e);
        }
      }

      return NextResponse.json(delivery);
    }

    if (type === 'complaint') {
      const complaint = await prisma.complaint.update({
        where: { id },
        data: { 
          status: status || undefined,
          forwarded: forwarded !== undefined ? forwarded : undefined
        },
        include: {
          user: true,
          institution: {
            include: { users: { where: { role: 'owner' } } }
          }
        }
      });

      // Send Email to Owner if forwarded
      if (forwarded === true) {
        try {
          const { sendForwardedComplaintEmail } = await import('@/lib/email');
          for (const owner of complaint.institution.users) {
            await sendForwardedComplaintEmail({
              to: owner.email,
              customerName: complaint.user.name || complaint.user.email,
              subject: complaint.subject,
              message: complaint.message
            });
          }
        } catch (e) {
          console.error('Complaint Email Error:', e);
        }
      }

      return NextResponse.json(complaint);
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
