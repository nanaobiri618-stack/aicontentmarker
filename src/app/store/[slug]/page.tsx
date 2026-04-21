import { prisma } from '@/lib/db';
import StorefrontClient from './storefrontClient';
import { notFound } from 'next/navigation';

export default async function StorefrontPage({ params }: { params: { slug: string } }) {
  const institution = await prisma.institution.findUnique({
    where: { slug: params.slug },
    include: {
      products: { where: { isVisible: true }, orderBy: { createdAt: 'desc' } },
      socialHandles: true,
      brandGuides: true,
    },
  });

  if (!institution) return notFound();

  return (
    <StorefrontClient
      storeSlug={institution.slug}
      institution={{
        id: institution.id,
        name: institution.name,
        industry: institution.industry,
        description: institution.description,
        logoBase64: institution.logoBase64,
        colorPrimary: institution.colorPrimary ?? '#00D4FF',
        colorSecondary: institution.colorSecondary ?? '#B026FF',
      }}
      products={institution.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        quantity: p.quantity,
        images: p.images,
      }))}
    />
  );
}

