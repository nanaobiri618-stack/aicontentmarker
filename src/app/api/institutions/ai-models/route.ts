import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/institutions/ai-models — Get institution's AI models
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user?.institutionId) {
    return NextResponse.json({ error: 'No institution found' }, { status: 404 });
  }

  const aiModels = await (prisma as any).aIModel.findMany({
    where: { institutionId: user.institutionId },
    orderBy: { isDefault: 'desc' },
  });

  return NextResponse.json(aiModels);
}

// POST /api/institutions/ai-models — Add new AI model
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role as string | undefined;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Only owners/admins can add AI models' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { provider, modelName, apiKey, isDefault } = body;

    if (!provider || !modelName || !apiKey) {
      return NextResponse.json(
        { error: 'provider, modelName, and apiKey are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user?.institutionId) {
      return NextResponse.json({ error: 'No institution found' }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await (prisma as any).aIModel.updateMany({
        where: { institutionId: user.institutionId },
        data: { isDefault: false },
      });
    }

    const aiModel = await (prisma as any).aIModel.create({
      data: {
        institutionId: user.institutionId,
        provider,
        modelName,
        apiKey,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ success: true, aiModel });
  } catch (error: any) {
    console.error('Error creating AI model:', error);
    return NextResponse.json({ error: 'Failed to create AI model' }, { status: 500 });
  }
}
