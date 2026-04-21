import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Paystack webhook handler for async payment confirmation
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (secret && signature) {
      const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const metadata = data.metadata || {};

      const orderId = metadata.order_id;
      const institutionId = metadata.institution_id;

      if (orderId) {
        // Update order status
        const order = await prisma.order.findUnique({
          where: { id: Number(orderId) },
          include: {
            user: true,
            product: { include: { institution: { include: { users: { where: { role: 'owner' } } } } } },
          },
        });

        if (order && order.status !== 'completed') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'completed', paymentRef: reference },
          });

          // Send email notifications
          try {
            const { sendOrderSuccessEmail, sendOwnerOrderAlertEmail } = await import('@/lib/email');

            await sendOrderSuccessEmail({
              to: order.user.email,
              name: order.user.name || 'Customer',
              productName: order.product.name,
              amount: Number(order.totalPrice),
              orderId: order.id,
            });

            const owners = order.product.institution.users;
            for (const owner of owners) {
              await sendOwnerOrderAlertEmail({
                to: owner.email,
                customerName: order.user.name || order.user.email,
                productName: order.product.name,
                amount: Number(order.totalPrice),
                orderId: order.id,
              });
            }
          } catch (emailErr) {
            console.error('Webhook email error:', emailErr);
          }
        }
      }

      // Log platform fee for accounting
      const platformFee = metadata.platform_fee || 0;
      if (platformFee > 0) {
        console.log(`[PLATFORM FEE] Institution ${institutionId}: GHS ${platformFee} from order ${orderId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
