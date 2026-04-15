import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/orders
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await prisma.order.findMany({
    include: { product: { include: { institution: true } }, user: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(orders);
}

// POST /api/orders — customer places an order
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { productId, quantity } = body;

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  if (product.quantity < (quantity ?? 1)) {
    return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
  }

  const qty = quantity ?? 1;
  const totalPrice = Number(product.price) * qty;

  const order = await prisma.order.create({
    data: {
      userId: parseInt(String((session.user as any).id)),
      productId: parseInt(productId),
      quantity: qty,
      totalPrice,
      status: 'pending',
    },
  });

  // Decrement stock
  await prisma.product.update({
    where: { id: parseInt(productId) },
    data: { quantity: { decrement: qty } },
  });

  return NextResponse.json(order, { status: 201 });
}
