import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const GOD_ADMIN_EMAIL = 'admingod123@gmail.com';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = String(session.user.email ?? '').toLowerCase();
  if (email !== GOD_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const status = String(body?.status ?? '').toLowerCase();
  const note = body?.note ? String(body.note) : '';

  if (!['verified', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const institutionId = parseInt(params.id);
  if (!institutionId) return NextResponse.json({ error: 'Invalid institution id' }, { status: 400 });

  await prisma.agentTask.create({
    data: {
      institutionId,
      taskType: 'manual_verification',
      status: `set_${status}`,
    },
  });

  const updated = await prisma.institution.update({
    where: { id: institutionId },
    data: {
      verificationStatus: status,
      verificationNote: note || null,
    },
  });

  return NextResponse.json({ institution: updated });
}

