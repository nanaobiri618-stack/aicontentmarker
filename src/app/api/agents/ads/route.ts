import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { runAdAgent } from '@/lib/ai/agents/adAgent';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const institutionId = Number(body?.institutionId);
    if (!institutionId) return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });

    const result = await runAdAgent(institutionId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

