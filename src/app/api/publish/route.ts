import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface PublishRequest {
  postId: number;
  platform: 'instagram' | 'linkedin' | 'email';
  scheduledTime?: string;
}

interface PublishResult {
  success: boolean;
  url: string | null;
  error: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { postId, platform }: PublishRequest = await request.json();

    if (!postId || !platform) {
      return NextResponse.json(
        { error: 'Post ID and platform required' },
        { status: 400 }
      );
    }

    // Fetch the post to publish
    const post = await prisma.generatedPost.findUnique({
      where: { id: postId },
      include: { institution: true, agentTask: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status !== 'approved') {
      return NextResponse.json(
        { error: 'Post must be approved before publishing' },
        { status: 400 }
      );
    }

    let publishResult: PublishResult = { success: false, url: null, error: null };

    try {
      // Platform-specific publishing logic
      switch (platform) {
        case 'instagram':
          publishResult = await publishToInstagram(post);
          break;
        case 'linkedin':
          publishResult = await publishToLinkedIn(post);
          break;
        case 'email':
          publishResult = await publishToEmail(post);
          break;
      }

      // Update post status
      await prisma.generatedPost.update({
        where: { id: postId },
        data: {
          status: publishResult.success ? 'published' : 'failed',
        },
      });

      return NextResponse.json({
        success: true,
        url: publishResult.url,
        error: null,
      });
    } catch (publishError) {
      console.error(`Publish to ${platform} failed:`, publishError);

      // Update post status to failed
      await prisma.generatedPost.update({
        where: { id: postId },
        data: { status: 'failed' },
      });

      return NextResponse.json(
        { error: `Failed to publish to ${platform}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Publish API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Platform-specific publishing functions (implement with actual API integrations)
async function publishToInstagram(post: any) {
  // TODO: Implement Instagram Graph API integration
  // For now, simulate success
  console.log('Publishing to Instagram:', post.contentText);
  return {
    success: true,
    url: `https://instagram.com/p/mock-${post.id}`,
    error: null,
  };
}

async function publishToLinkedIn(post: any) {
  // TODO: Implement LinkedIn API integration
  console.log('Publishing to LinkedIn:', post.contentText);
  return {
    success: true,
    url: `https://linkedin.com/posts/mock-${post.id}`,
    error: null,
  };
}

async function publishToEmail(post: any) {
  // TODO: Implement email service integration (Mailchimp, SendGrid, etc.)
  console.log('Sending email:', post.contentText);
  return {
    success: true,
    url: null, // Emails don't have public URLs
    error: null,
  };
}
