import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/institutions/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const institution = await prisma.institution.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      socialHandles: true,
      products: true,
      brandGuides: true,
      generatedSite: true,
      agentTasks: { orderBy: { createdAt: 'desc' }, take: 10 },
      generatedPosts: { orderBy: { createdAt: 'desc' }, take: 10, where: { status: 'pending' } },
    },
  });

  if (!institution) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(institution);
}

// PATCH /api/institutions/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const institution = await prisma.institution.update({
    where: { id: parseInt(params.id) },
    data: body,
  });
  return NextResponse.json(institution);
}

// DELETE /api/institutions/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.institution.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ success: true });
}
