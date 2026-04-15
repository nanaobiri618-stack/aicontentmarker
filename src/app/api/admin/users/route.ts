import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role as string | undefined;
  const email = String(session.user.email ?? '').toLowerCase();
  const GOD_ADMIN_EMAIL = 'admingod123@gmail.com';

  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only god admin can view all users across all institutions
  const isGodAdmin = email === GOD_ADMIN_EMAIL;

  let users;
  if (isGodAdmin) {
    // God admin can see all users
    users = await prisma.user.findMany({
      include: { institution: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  } else {
    // Normal owners/admins only see users from their own institution
    const currentUser = await prisma.user.findUnique({
      where: { email: email },
      include: { institution: true },
    });

    if (!currentUser?.institutionId) {
      return NextResponse.json({ error: 'No institution found' }, { status: 403 });
    }

    users = await prisma.user.findMany({
      where: { institutionId: currentUser.institutionId },
      include: { institution: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      institution: u.institution ? { id: u.institution.id, name: u.institution.name } : null,
      createdAt: u.createdAt,
    })),
  });
}

