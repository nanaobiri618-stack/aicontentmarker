import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const email = String(session.user.email ?? '').toLowerCase();
    const GOD_ADMIN_EMAIL = 'admingod123@gmail.com';
    const isGodAdmin = email === GOD_ADMIN_EMAIL;

    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');
    const status = searchParams.get('status');

    if (!institutionId) {
      return NextResponse.json({ error: 'Institution ID required' }, { status: 400 });
    }

    // Validate user has access to the requested institution
    if (!isGodAdmin) {
      const currentUser = await prisma.user.findUnique({
        where: { email: email },
      });

      if (!currentUser?.institutionId || currentUser.institutionId !== parseInt(institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const where: any = { institutionId: parseInt(institutionId) };
    if (status) {
      where.status = status;
    }

    const posts = await prisma.generatedPost.findMany({
      where,
      include: {
        agentTask: {
          include: {
            contentSource: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ posts });

  } catch (error) {
    console.error('Posts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { postId, status, feedback } = await request.json();

    if (!postId || !status) {
      return NextResponse.json(
        { error: 'Post ID and status required' },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (feedback) {
      updateData.feedback = feedback;
    }

    const updatedPost = await prisma.generatedPost.update({
      where: { id: postId },
      data: updateData,
    });

    return NextResponse.json({ post: updatedPost });

  } catch (error) {
    console.error('Posts PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}
