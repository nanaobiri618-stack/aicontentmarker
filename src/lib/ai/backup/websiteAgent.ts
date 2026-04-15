import { prisma } from '@/lib/db';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export async function runWebsiteAgent(institutionId: number): Promise<{ slug: string }> {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    include: {
      products: { where: { isVisible: true } },
      brandGuides: true,
      socialHandles: true,
    },
  });

  if (!institution) throw new Error('Institution not found');
  if (institution.verificationStatus !== 'verified') {
    throw new Error('Institution must be verified before a site can be generated');
  }

  // Log agent task
  await prisma.agentTask.create({
    data: { institutionId, taskType: 'website_generation', status: 'thinking' },
  });

  const baseSlug = toSlug(institution.name);
  const slug = `${baseSlug}-${institution.id}`;

  // Build theme config stored as JSON
  const themeData = JSON.stringify({
    institutionName: institution.name,
    industry: institution.industry,
    description: institution.description,
    logo: institution.logoBase64,
    colorPrimary: institution.colorPrimary ?? '#00D4FF',
    colorSecondary: institution.colorSecondary ?? '#B026FF',
    socialHandles: institution.socialHandles,
    brandGuide: institution.brandGuides[0] ?? null,
    productCount: institution.products.length,
  });

  // Upsert generated site
  await prisma.generatedSite.upsert({
    where: { institutionId },
    update: { slug, status: 'live', themeData },
    create: { institutionId, slug, status: 'live', themeData },
  });

  // Update institution slug
  await prisma.institution.update({
    where: { id: institutionId },
    data: { slug },
  });

  await prisma.agentTask.updateMany({
    where: { institutionId, taskType: 'website_generation', status: 'thinking' },
    data: { status: 'completed' },
  });

  return { slug };
}
