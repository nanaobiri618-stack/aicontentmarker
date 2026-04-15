import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/products?institutionId=X
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = String(session.user.email ?? '').toLowerCase();
  const GOD_ADMIN_EMAIL = 'admingod123@gmail.com';
  const isGodAdmin = email === GOD_ADMIN_EMAIL;

  const institutionId = req.nextUrl.searchParams.get('institutionId');
  
  let whereClause;
  if (institutionId) {
    // If institutionId is specified, validate access
    if (isGodAdmin) {
      // God admin can view any institution
      whereClause = { institutionId: parseInt(institutionId) };
    } else {
      // Normal users can only view their own institution
      const currentUser = await prisma.user.findUnique({
        where: { email: email },
      });

      if (!currentUser?.institutionId || currentUser.institutionId !== parseInt(institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      whereClause = { institutionId: currentUser.institutionId };
    }
  } else {
    // No institutionId specified - only god admin can view all
    if (!isGodAdmin) {
      // Normal users can only view their own institution
      const currentUser = await prisma.user.findUnique({
        where: { email: email },
      });

      if (!currentUser?.institutionId) {
        return NextResponse.json([], { status: 200 });
      }

      whereClause = { institutionId: currentUser.institutionId };
    }
    // God admin with no filter returns all products
    whereClause = undefined;
  }

  const products = await prisma.product.findMany({
    where: whereClause,
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
