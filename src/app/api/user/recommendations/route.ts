import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { runRecommendationAgent } from '@/lib/ai/agents/recommendationAgent';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const institutionId = req.nextUrl.searchParams.get('institutionId');
    const userId = parseInt((session.user as any).id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 400 });
    }

    const recommendations = await runRecommendationAgent(
      userId,
      institutionId ? parseInt(institutionId) : undefined
    );

    return NextResponse.json({ recommendations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
