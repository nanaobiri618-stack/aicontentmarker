import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/institutions/paystack-key — Check if institution has Paystack key configured
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user?.institutionId) {
    return NextResponse.json({ error: 'No institution found' }, { status: 404 });
  }

  const institution = await prisma.institution.findUnique({ where: { id: user.institutionId } });
  if (!institution) {
    return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
  }

  return NextResponse.json({
    hasPaystackKey: !!(institution as any).paystackApiKey,
    institutionId: institution.id,
    institutionName: institution.name,
  });
}

// POST /api/institutions/paystack-key — Save or update Paystack API key
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role as string | undefined;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Only owners/admins can update payment settings' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { paystackApiKey } = body;

    if (!paystackApiKey || typeof paystackApiKey !== 'string') {
      return NextResponse.json({ error: 'paystackApiKey is required' }, { status: 400 });
    }

    // Validate key format (Paystack test keys start with sk_test_, live with sk_live_)
    if (!paystackApiKey.startsWith('sk_test_') && !paystackApiKey.startsWith('sk_live_')) {
      return NextResponse.json(
        { error: 'Invalid Paystack key format. Key must start with sk_test_ or sk_live_' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user?.institutionId) {
      return NextResponse.json({ error: 'No institution found' }, { status: 404 });
    }

    await prisma.institution.update({
      where: { id: user.institutionId },
      data: { paystackApiKey } as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Paystack API key saved successfully',
      isLive: paystackApiKey.startsWith('sk_live_'),
    });
  } catch (error: any) {
    console.error('Error saving Paystack key:', error);
    return NextResponse.json({ error: 'Failed to save Paystack key' }, { status: 500 });
  }
}

// DELETE /api/institutions/paystack-key — Remove Paystack API key
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role as string | undefined;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Only owners/admins can update payment settings' }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user?.institutionId) {
      return NextResponse.json({ error: 'No institution found' }, { status: 404 });
    }

    await prisma.institution.update({
      where: { id: user.institutionId },
      data: { paystackApiKey: null } as any,
    });

    return NextResponse.json({ success: true, message: 'Paystack API key removed' });
  } catch (error: any) {
    console.error('Error removing Paystack key:', error);
    return NextResponse.json({ error: 'Failed to remove Paystack key' }, { status: 500 });
  }
}
