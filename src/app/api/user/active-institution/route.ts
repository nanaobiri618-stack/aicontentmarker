import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { institutionId } = await req.json();
    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    const email = String(session.user.email).toLowerCase();
    const isGodAdmin = email === 'admingod123@gmail.com';

    // 1. Verify ownership (unless god admin)
    if (!isGodAdmin) {
      const institution = await prisma.institution.findFirst({
        where: {
          id: institutionId,
          owner: { email }
        }
      });

      if (!institution) {
        return NextResponse.json({ error: 'Institution not found or you do not own it' }, { status: 403 });
      }
    }

    // 2. Update user's active context
    await prisma.user.update({
      where: { email },
      data: { institutionId }
    });

    console.log(`[CONTEXT-SWITCH] User ${email} switched to institution ${institutionId}`);

    return NextResponse.json({ success: true, message: 'Active institution updated' });
  } catch (error: any) {
    console.error('[CONTEXT-SWITCH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
