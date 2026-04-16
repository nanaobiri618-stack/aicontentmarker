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

    let tasks: any[] = [];
    if (isGodAdmin) {
      tasks = await prisma.agentTask.findMany({
        include: { institution: true },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    } else if (user.institutionId) {
      tasks = await prisma.agentTask.findMany({
        where: { institutionId: user.institutionId },
        include: { institution: true },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    } else {
      tasks = [];
    }

    const history = tasks.map(task => ({
      id: task.id,
      type: task.status === 'completed' ? 'approved' : task.status === 'failed' ? 'rejected' : 'generated',
      label: `${task.taskType.replace('_', ' ')}: Task #${task.id} ${task.status === 'completed' ? 'Successfully Finished' : 'In Progress'}`,
      institution: task.institution?.name || 'Platform',
      time: new Date(task.createdAt).toLocaleString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('HISTORY_API_ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
