import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user with their institution
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        institution: {
          include: {
            products: true,
            agentTasks: {
              include: {
                generatedPosts: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch orders separately since they're not directly on Institution
    const orders = user.institutionId 
      ? await prisma.order.findMany({
          where: {
            product: {
              institutionId: user.institutionId,
            },
          },
          include: {
            user: true,
            product: true,
          },
        })
      : [];

    // Calculate finance metrics from real orders
    const totalRevenue = orders
      .filter((o: { status: string }) => o.status === 'completed')
      .reduce((sum: number, o: { totalPrice: any }) => sum + Number(o.totalPrice), 0);
    
    const pendingSettlements = orders
      .filter((o: { status: string }) => o.status === 'pending')
      .reduce((sum: number, o: { totalPrice: any }) => sum + Number(o.totalPrice), 0);

    const paidOrders = orders.filter((o: { status: string }) => o.status === 'completed').length;
    const unpaidOrders = orders.filter((o: { status: string }) => o.status === 'pending').length;

    // Get recent agent tasks/activity
    const recentTasks = user.institution?.agentTasks || [];
    
    // Get all users for this institution for the payment table
    const institutionUsers = await prisma.user.findMany({
      where: { institutionId: user.institutionId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Map users to payment status format
    const paymentStatuses = institutionUsers.map(u => {
      const latestOrder = u.orders[0];
      const isPaid = latestOrder?.status === 'completed';
      return {
        id: u.id,
        name: u.name || `User ${u.id}`,
        email: u.email,
        institution: user.institution?.name || 'N/A',
        status: isPaid ? 'PAID' : 'UNPAID',
        amount: latestOrder ? Number(latestOrder.totalPrice) : 0,
        lastAlert: latestOrder ? new Date(latestOrder.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Never',
      };
    });

    // Generate activity log from real tasks
    const activityLog = recentTasks.map(task => {
      const posts = task.generatedPosts || [];
      if (posts.length > 0) {
        return {
          type: 'System',
          message: `Marketer Agent generated ${posts.length} new ads for '${user.institution?.name || 'Institution'}'`,
          color: 'green',
        };
      }
      return {
        type: 'AI',
        message: `Analyzer Agent identified target audience for task ${task.id}`,
        color: 'cyan',
      };
    });

    // Add default activities if none exist
    if (activityLog.length === 0) {
      activityLog.push(
        { type: 'System', message: `Site generated for '${user.institution?.name || 'Institution'}'`, color: 'purple' },
        { type: 'AI', message: 'Analyzer Agent ready for content analysis', color: 'cyan' },
      );
    }

    return NextResponse.json({
      user: {
        name: user.name || 'User',
        email: user.email,
        role: user.role,
      },
      institution: user.institution ? {
        name: user.institution.name,
        slug: user.institution.slug,
      } : undefined,
      finance: {
        totalRevenue,
        monthlyRevenue: totalRevenue * 0.3, // Approximation
        pendingSettlements,
        totalOrders: orders.length,
        paidOrders,
        unpaidOrders,
        revenueGrowthPct: 12.5, // Placeholder until historical data
      },
      activityLog,
      paymentStatuses,
      agentCount: 12,
      systemLoad: 68,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
