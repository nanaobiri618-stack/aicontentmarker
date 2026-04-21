import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public: list live storefronts for customer shopping
export async function GET() {
  // Query institutions directly so users can see newly added ones immediately
  const institutions = await prisma.institution.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({
    stores: institutions.map((inst) => ({
      slug: inst.slug,
      institutionName: inst.name,
      industry: inst.industry,
      description: inst.description,
      logo: inst.logoBase64,
    })),
  });
}

