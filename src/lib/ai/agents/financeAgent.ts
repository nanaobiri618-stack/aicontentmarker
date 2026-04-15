import { prisma } from '@/lib/db';

export interface FinanceSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingSettlements: number;
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  revenueGrowthPct: number;
  topInstitution: string | null;
  recentOrders: {
    id: number;
    productName: string;
    institution: string;
    amount: number;
    status: string;
    date: Date;
  }[];
}

export async function runFinanceAgent(): Promise<FinanceSummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [allOrders, monthlyOrders, lastMonthOrders, recentRaw] = await Promise.all([
    prisma.order.findMany({ where: { status: 'paid' } }),
    prisma.order.findMany({ where: { status: 'paid', createdAt: { gte: startOfMonth } } }),
    prisma.order.findMany({
      where: { status: 'paid', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { product: { include: { institution: true } } },
    }),
  ]);

  const totalRevenue = allOrders.reduce((s, o) => s + Number(o.totalPrice), 0);
  const monthlyRevenue = monthlyOrders.reduce((s, o) => s + Number(o.totalPrice), 0);
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + Number(o.totalPrice), 0);

  const pendingOrders = await prisma.order.findMany({ where: { status: 'pending' } });
  const pendingSettlements = pendingOrders.reduce((s, o) => s + Number(o.totalPrice), 0);

  const totalOrdersCount = await prisma.order.count();
  const paidOrdersCount = await prisma.order.count({ where: { status: 'paid' } });
  const unpaidOrdersCount = totalOrdersCount - paidOrdersCount;

  const growthPct =
    lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : monthlyRevenue > 0
      ? 100
      : 0;

  // Top revenue institution
  const institutionRevenue = await prisma.order.groupBy({
    by: ['productId'],
    where: { status: 'paid' },
    _sum: { totalPrice: true },
  });

  const recentOrders = recentRaw.map((o) => ({
    id: o.id,
    productName: o.product.name,
    institution: o.product.institution.name,
    amount: Number(o.totalPrice),
    status: o.status,
    date: o.createdAt,
  }));

  return {
    totalRevenue,
    monthlyRevenue,
    pendingSettlements,
    totalOrders: totalOrdersCount,
    paidOrders: paidOrdersCount,
    unpaidOrders: unpaidOrdersCount,
    revenueGrowthPct: Math.round(growthPct * 10) / 10,
    topInstitution: null,
    recentOrders,
  };
}
