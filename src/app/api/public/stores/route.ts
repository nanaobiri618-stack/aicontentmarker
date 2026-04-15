import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public: list live storefront slugs for customer signup
export async function GET() {
  const sites = await prisma.generatedSite.findMany({
    where: { status: 'live' },
    include: { institution: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({
    stores: sites.map((s) => ({
      slug: s.slug,
      institutionName: s.institution.name,
      industry: s.institution.industry,
    })),
  });
}

