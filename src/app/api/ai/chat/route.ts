import { NextRequest, NextResponse } from 'next/server';
import { runChatAgent } from '@/lib/ai/agents/chatAgent';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { institutionId, message, history } = await req.json();
    const session = await getServerSession(authOptions);

    if (!institutionId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const chatResponse = await runChatAgent(institutionId, message, history);

    // If the AI flagged this as a complaint, log it automatically
    if (chatResponse.isComplaint && session?.user) {
      await prisma.complaint.create({
        data: {
          userId: parseInt((session.user as any).id),
          institutionId,
          subject: 'Complaint via AI Chat',
          message: message,
          status: 'pending',
        },
      });
    }

    return NextResponse.json(chatResponse);
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
