import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// DELETE /api/institutions/ai-models/[id] — Remove AI model
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role as string | undefined;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Only owners/admins can remove AI models' }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user?.institutionId) {
      return NextResponse.json({ error: 'No institution found' }, { status: 404 });
    }

    const modelId = Number(params.id);
    const aiModel = await (prisma as any).aIModel.findUnique({
      where: { id: modelId },
    });

    if (!aiModel) {
      return NextResponse.json({ error: 'AI model not found' }, { status: 404 });
    }

    if (aiModel.institutionId !== user.institutionId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await (prisma as any).aIModel.delete({ where: { id: modelId } });

    return NextResponse.json({ success: true, message: 'AI model removed' });
  } catch (error: any) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json({ error: 'Failed to delete AI model' }, { status: 500 });
  }
}

// PATCH /api/institutions/ai-models/[id] — Set as default
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role as string | undefined;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Only owners/admins can update AI models' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { isDefault } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user?.institutionId) {
      return NextResponse.json({ error: 'No institution found' }, { status: 404 });
    }

    const modelId = Number(params.id);
    const aiModel = await (prisma as any).aIModel.findUnique({
      where: { id: modelId },
    });

    if (!aiModel) {
      return NextResponse.json({ error: 'AI model not found' }, { status: 404 });
    }

    if (aiModel.institutionId !== user.institutionId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await (prisma as any).aIModel.updateMany({
        where: { institutionId: user.institutionId },
        data: { isDefault: false },
      });
    }

    await (prisma as any).aIModel.update({
      where: { id: modelId },
      data: { isDefault },
    });

    return NextResponse.json({ success: true, message: 'AI model updated' });
  } catch (error: any) {
    console.error('Error updating AI model:', error);
    return NextResponse.json({ error: 'Failed to update AI model' }, { status: 500 });
  }
}
