import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import CheckoutClient from './checkoutClient';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { productId?: string; qty?: string; reference?: string; orderId?: string };
}) {
  const site = await prisma.generatedSite.findUnique({
    where: { slug: params.slug },
    include: { institution: true },
  });
  if (!site) return notFound();

  const productId = Number(searchParams.productId);
  const qty = Math.max(1, Number(searchParams.qty ?? 1) || 1);

  if (!productId) {
    return (
      <CheckoutClient
        storeSlug={params.slug}
        institutionName={site.institution.name}
        product={null}
        qty={qty}
        reference={searchParams.reference ?? null}
        orderId={searchParams.orderId ? Number(searchParams.orderId) : null}
      />
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { institution: true },
  });
  if (!product) return notFound();
  if (product.institutionId !== site.institutionId) return notFound();

  return (
    <CheckoutClient
      storeSlug={params.slug}
      institutionName={site.institution.name}
      product={{
        id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: product.quantity,
      }}
      qty={qty}
      reference={searchParams.reference ?? null}
      orderId={searchParams.orderId ? Number(searchParams.orderId) : null}
    />
  );
}

