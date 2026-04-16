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

    // Check if god admin
    const GOD_ADMIN_EMAIL = 'admingod123@gmail.com';
    const isGodAdmin = String(session.user.email).toLowerCase() === GOD_ADMIN_EMAIL;

    // Get current user with their institution
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedInstitutions: {
          select: {
            id: true,
            name: true,
            slug: true,
            industry: true,
            verificationStatus: true,
            createdAt: true,
          }
        },
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
            deliveryDetails: true,
          },
        })
      : [];

    // Calculate finance metrics with safer mapping
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const pendingOrders = orders.filter((o) => o.status === 'pending');
    
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const pendingSettlements = pendingOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const paidOrders = completedOrders.length;
    const unpaidOrders = pendingOrders.length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyRevenue = completedOrders
      .filter((o) => 
        new Date(o.createdAt).getMonth() === currentMonth &&
        new Date(o.createdAt).getFullYear() === currentYear
      )
      .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    const prevMonthRevenue = completedOrders
      .filter((o) => {
        const orderDate = new Date(o.createdAt);
        const prevMonthDate = new Date(currentYear, currentMonth - 1);
        return orderDate.getMonth() === prevMonthDate.getMonth() &&
               orderDate.getFullYear() === prevMonthDate.getFullYear();
      })
      .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    
    const revenueGrowthPct = prevMonthRevenue > 0 
      ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
      : monthlyRevenue > 0 ? 100 : 0;

    // Get complaints
    let complaints: any[] = [];
    try {
      if (isGodAdmin) {
        complaints = await prisma.complaint.findMany({
          include: { user: true, institution: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      } else if (user.institutionId) {
        complaints = await prisma.complaint.findMany({
          where: { institutionId: user.institutionId },
          include: { user: true, institution: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      }
    } catch (dbErr) {
      console.error('Complaints query failed:', dbErr);
    }

    // Agent metrics
    const allAgentTasks = (user.institutionId) 
      ? await prisma.agentTask.findMany({
          where: { institutionId: user.institutionId },
        })
      : [];
    const activeAgentCount = allAgentTasks.filter((t) => 
      t.status === 'thinking' || t.status === 'drafting' || t.status === 'validating'
    ).length;
    const totalAgentTasks = allAgentTasks.length;
    const systemLoad = totalAgentTasks > 0 ? Math.round((activeAgentCount / totalAgentTasks) * 100) : 0;
    const recentTasks = (user.institution as any)?.agentTasks || [];

    // Get users for payment table
    let paymentUsersQuery: any[] = [];
    try {
      if (isGodAdmin) {
        paymentUsersQuery = await prisma.user.findMany({
          where: { orders: { some: {} } },
          include: {
            institution: true,
            orders: {
              include: { deliveryDetails: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          take: 100,
        });
      } else if (user.institutionId) {
        const institutionOrders = await prisma.order.findMany({
          where: { product: { institutionId: user.institutionId } },
          include: {
            user: { include: { institution: true } },
            deliveryDetails: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        const uniqueUsers = new Map();
        institutionOrders.forEach((order) => {
          if (!uniqueUsers.has(order.userId)) {
            uniqueUsers.set(order.userId, { ...order.user, orders: [order] });
          }
        });
        paymentUsersQuery = Array.from(uniqueUsers.values());
      }
    } catch (dbErr) {
      console.error('Payment users query failed:', dbErr);
    }

    const paymentStatuses = paymentUsersQuery.map(u => {
      const latestOrder = u.orders?.[0];
      const isPaid = latestOrder?.status === 'completed' || latestOrder?.status === 'paid';
      return {
        id: u.id,
        orderId: latestOrder?.id,
        name: u.name || `User ${u.id}`,
        email: u.email,
        institution: u.institution?.name || null,
        status: isPaid ? 'PAID' : 'UNPAID',
        deliveryStatus: latestOrder?.deliveryDetails?.status || 'pending',
        deliveryInfo: latestOrder?.deliveryDetails ? {
          phone: latestOrder.deliveryDetails.phoneNumber,
          address: latestOrder.deliveryDetails.address,
          lat: latestOrder.deliveryDetails.latitude,
          lng: latestOrder.deliveryDetails.longitude,
        } : null,
        amount: latestOrder ? (Number(latestOrder.totalPrice) || 0) : 0,
        lastAlert: latestOrder ? new Date(latestOrder.createdAt).toLocaleDateString('en-GB') : null,
      };
    });

    const activityLog = recentTasks
      .map((task: any) => ({
        type: 'AI',
        message: `${task.status === 'completed' ? 'Completed' : 'Processing'}: ${task.taskType} task #${task.id}`,
        color: task.status === 'completed' ? 'green' : task.status === 'failed' ? 'red' : 'cyan',
      }))
      .slice(0, 5);

    // God Admin specific: Fetch institutions needing verification
    let unverifiedInstitutions: any[] = [];
    if (isGodAdmin) {
      unverifiedInstitutions = await prisma.institution.findMany({
        where: { verificationStatus: { not: 'verified' } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      user: { name: user.name, email: user.email, role: user.role },
      institution: user.institution ? { name: user.institution.name, slug: user.institution.slug } : undefined,
      finance: { totalRevenue, monthlyRevenue, pendingSettlements, totalOrders: orders.length, paidOrders, unpaidOrders, revenueGrowthPct },
      activityLog,
      paymentStatuses,
      complaints: complaints.map(c => ({
        id: c.id || 0,
        userName: c.user?.name || c.user?.email || 'Unknown User',
        institutionName: c.institution?.name || 'Platform',
        subject: c.subject || 'No Subject',
        message: c.message || '',
        status: c.status || 'pending',
        forwarded: c.forwarded || false,
        createdAt: c.createdAt || new Date(),
      })),
      unverifiedInstitutions,
      ownedInstitutions: user.ownedInstitutions || [],
      agentCount: totalAgentTasks,
      systemLoad,
    });
  } catch (error: any) {
    console.error('DASHBOARD_OVERVIEW_CRITICAL_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to load dashboard data' }, { status: 500 });
  }
}
