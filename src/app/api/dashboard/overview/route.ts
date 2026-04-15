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

    // Calculate monthly revenue (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyRevenue = orders
      .filter((o: { status: string; createdAt: Date }) => 
        o.status === 'completed' && 
        new Date(o.createdAt).getMonth() === currentMonth &&
        new Date(o.createdAt).getFullYear() === currentYear
      )
      .reduce((sum: number, o: { totalPrice: any }) => sum + Number(o.totalPrice), 0);

    // Calculate revenue growth (compare current month to previous month)
    const prevMonthRevenue = orders
      .filter((o: { status: string; createdAt: Date }) => {
        const orderDate = new Date(o.createdAt);
        const prevMonthDate = new Date(currentYear, currentMonth - 1);
        return o.status === 'completed' && 
          orderDate.getMonth() === prevMonthDate.getMonth() &&
          orderDate.getFullYear() === prevMonthDate.getFullYear();
      })
      .reduce((sum: number, o: { totalPrice: any }) => sum + Number(o.totalPrice), 0);
    
    const revenueGrowthPct = prevMonthRevenue > 0 
      ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
      : monthlyRevenue > 0 ? 100 : 0;

    // Get agent task counts for system metrics
    const allAgentTasks = user.institutionId 
      ? await prisma.agentTask.findMany({
          where: { institutionId: user.institutionId },
        })
      : [];
    const activeAgentCount = allAgentTasks.filter((t: { status: string }) => 
      t.status === 'thinking' || t.status === 'drafting' || t.status === 'validating'
    ).length;
    const totalAgentTasks = allAgentTasks.length;
    
    // Calculate system load based on active tasks vs total
    const systemLoad = totalAgentTasks > 0 
      ? Math.round((activeAgentCount / Math.max(totalAgentTasks, 1)) * 100)
      : 0;

    // Get recent agent tasks/activity
    const recentTasks = user.institution?.agentTasks || [];
    
    // Check if god admin
    const GOD_ADMIN_EMAIL = 'admingod123@gmail.com';
    const isGodAdmin = String(session.user.email).toLowerCase() === GOD_ADMIN_EMAIL;

    // Get users for payment table - based on PURCHASES from institution
    let paymentUsersQuery;
    if (isGodAdmin) {
      // God admin sees all users who purchased from any institution
      paymentUsersQuery = await prisma.user.findMany({
        where: {
          // Users who have orders with products from any institution
          orders: { some: {} },
        },
        include: {
          institution: true,
          orders: {
            where: {
              product: {},
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        take: 100,
      });
    } else if (user.institutionId) {
      // Normal owner only sees users who purchased from THEIR institution
      // Find all orders where product belongs to this institution
      const institutionOrders = await prisma.order.findMany({
        where: { 
          product: {
            institutionId: user.institutionId,
          },
        },
        include: {
          user: {
            include: {
              institution: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      // Get unique users who made purchases
      const uniqueUsers = new Map<number, any>();
      institutionOrders.forEach((order: any) => {
        if (!uniqueUsers.has(order.userId)) {
          uniqueUsers.set(order.userId, {
            ...order.user,
            orders: [order],
          });
        }
      });

      paymentUsersQuery = Array.from(uniqueUsers.values());
    } else {
      // User has no institution, return empty
      paymentUsersQuery = [];
    }

    // Map users to payment status format
    const paymentStatuses = paymentUsersQuery.map(u => {
      const latestOrder = u.orders[0];
      const isPaid = latestOrder?.status === 'completed';
      return {
        id: u.id,
        name: u.name || `User ${u.id}`,
        email: u.email,
        institution: u.institution?.name || null,
        status: isPaid ? 'PAID' : 'UNPAID',
        amount: latestOrder ? Number(latestOrder.totalPrice) : 0,
        lastAlert: latestOrder ? new Date(latestOrder.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null,
      };
    });

    // Generate activity log from real tasks
    const activityLog = recentTasks
      .map(task => {
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
          message: `${task.status === 'completed' ? 'Completed' : 'Processing'}: ${task.taskType} task #${task.id}`,
          color: task.status === 'completed' ? 'green' : task.status === 'failed' ? 'red' : 'cyan',
        };
      })
      .slice(0, 5);

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      institution: user.institution ? {
        name: user.institution.name,
        slug: user.institution.slug,
      } : undefined,
      finance: {
        totalRevenue,
        monthlyRevenue,
        pendingSettlements,
        totalOrders: orders.length,
        paidOrders,
        unpaidOrders,
        revenueGrowthPct,
      },
      activityLog,
      paymentStatuses,
      agentCount: totalAgentTasks,
      systemLoad,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
