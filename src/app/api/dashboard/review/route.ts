import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true, 
        institutionId: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const GOD_ADMIN_EMAIL = 'admingod123@gmail.com';
    const isGodAdmin = String(session.user.email).toLowerCase() === GOD_ADMIN_EMAIL;

    let posts;
    if (isGodAdmin) {
      posts = await prisma.generatedPost.findMany({
        where: { status: 'pending' },
        include: { institution: true, agentTask: true },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.institutionId) {
      posts = await prisma.generatedPost.findMany({
        where: { 
          institutionId: user.institutionId,
        },
        include: { institution: true, agentTask: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      posts = [];
    }

    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: `${post.platform.toUpperCase()} Draft: ${post.agentTask?.taskType.replace('_', ' ') || 'Content'}`,
      content: post.contentText,
      institution: post.institution?.name || 'Platform',
      platform: post.platform,
      aiScore: 85, // Placeholder for actual scoring logic
      status: post.status,
      createdAt: post.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedPosts);
  } catch (error: any) {
    console.error('REVIEW_API_ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch review queue' }, { status: 500 });
  }
}
