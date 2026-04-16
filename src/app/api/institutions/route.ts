import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/institutions — list institutions for the current owner (all if god admin)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = String(session.user.email ?? '').toLowerCase();
  const GOD_ADMIN_EMAIL = 'admingod123@gmail.com';
  const isGodAdmin = email === GOD_ADMIN_EMAIL;

  let institutions;
  if (isGodAdmin) {
    // God admin can see all institutions
    institutions = await prisma.institution.findMany({
      include: { socialHandles: true, products: true, generatedSite: true, brandGuides: true },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    // Normal owners only see their own institutions
    const currentUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!currentUser?.institutionId) {
      return NextResponse.json([], { status: 200 });
    }

    institutions = await prisma.institution.findMany({
      where: { id: currentUser.institutionId },
      include: { socialHandles: true, products: true, generatedSite: true, brandGuides: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  return NextResponse.json(institutions);
}

// POST /api/institutions — create a new institution
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    name, industry, description, website_url,
    logoBase64, documents, colorPrimary, colorSecondary,
    socialHandles, brandGuide,
  } = body;

  if (!name || !industry) {
    return NextResponse.json({ error: 'Name and industry are required' }, { status: 400 });
  }

  const baseSlug = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
  const slug = `${baseSlug}-${Date.now()}`;

    const institution = await prisma.institution.create({
      data: {
        name,
        slug,
        industry,
        description,
        website_url,
        logoBase64,
        documents,
        colorPrimary: colorPrimary ?? '#00D4FF',
        colorSecondary: colorSecondary ?? '#B026FF',
        socialHandles: socialHandles?.length
          ? { create: socialHandles }
          : undefined,
        brandGuides: brandGuide
          ? { create: { toneVoice: brandGuide.toneVoice, targetAudience: brandGuide.targetAudience, restrictedKeywords: brandGuide.restrictedKeywords ?? '[]', colorPalette: brandGuide.colorPalette } }
          : undefined,
      },
      include: { socialHandles: true, brandGuides: true },
    });

    // CRITICAL: Link the current user to the new institution
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { institutionId: institution.id }
    });

    return NextResponse.json(institution, { status: 201 });
}
