import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').toLowerCase().trim();
    const password = String(body?.password ?? '');
    const role = String(body?.role ?? 'user');
    const storeSlug = body?.storeSlug ? String(body.storeSlug).trim() : null;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!['owner', 'admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (email === 'admingod123@gmail.com') {
      return NextResponse.json(
        { error: 'This email is reserved for the main admin account. Please use a different email.' },
        { status: 400 }
      );
    }

    let institutionId: number | null = null;
    if (role === 'user') {
      if (!storeSlug) {
        return NextResponse.json({ error: 'Store slug is required for users' }, { status: 400 });
      }
      const site = await prisma.generatedSite.findUnique({ where: { slug: storeSlug } });
      if (!site) return NextResponse.json({ error: 'Storefront not found' }, { status: 404 });
      institutionId = site.institutionId;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        role,
        institutionId,
      },
      select: { id: true, email: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to sign up' }, { status: 500 });
  }
}

