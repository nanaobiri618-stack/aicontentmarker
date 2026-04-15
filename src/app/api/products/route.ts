import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/products?institutionId=X
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const institutionId = req.nextUrl.searchParams.get('institutionId');
  const products = await prisma.product.findMany({
    where: institutionId ? { institutionId: parseInt(institutionId) } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(products);
}

// POST /api/products
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { institutionId, name, description, price, quantity, images } = body;

  if (!institutionId || !name || price == null) {
    return NextResponse.json({ error: 'institutionId, name and price are required' }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      institutionId: parseInt(institutionId),
      name,
      description,
      price,
      quantity: quantity ?? 0,
      images: images ? JSON.stringify(images) : null,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
