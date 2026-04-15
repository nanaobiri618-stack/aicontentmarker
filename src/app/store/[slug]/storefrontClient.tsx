'use client';

import Link from 'next/link';
import { useMemo } from 'react';

type Institution = {
  id: number;
  name: string;
  industry: string;
  description?: string | null;
  logoBase64?: string | null;
  colorPrimary: string;
  colorSecondary: string;
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  images?: string | null;
};

function safeParseImages(images?: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function StorefrontClient({
  storeSlug,
  institution,
  products,
}: {
  storeSlug: string;
  institution: Institution;
  products: Product[];
}) {
  const heroGradient = useMemo(() => {
    return `linear-gradient(135deg, ${institution.colorPrimary}33, ${institution.colorSecondary}22)`;
  }, [institution.colorPrimary, institution.colorSecondary]);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-8">
          <div
            className="rounded-3xl border border-white/10 p-6 md:p-8 backdrop-blur"
            style={{ background: heroGradient }}
          >
            <div className="flex items-start gap-4">
              {institution.logoBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={institution.logoBase64}
                  alt={`${institution.name} logo`}
                  className="h-14 w-14 rounded-2xl object-cover border border-white/10 bg-black/20"
                />
              ) : (
                <div className="h-14 w-14 rounded-2xl border border-white/10 bg-black/20" />
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{institution.name}</h1>
                    <p className="text-sm text-slate-200/80">{institution.industry}</p>
                  </div>
                  <Link
                    href="/auth/signin"
                    className="text-sm text-slate-200/90 hover:text-white underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </div>
                {institution.description ? (
                  <p className="mt-3 text-sm text-slate-100/90 max-w-2xl">{institution.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="text-sm text-slate-400">Browse available items and checkout securely.</p>
          </div>
        </div>

        {products.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const imgs = safeParseImages(p.images);
              const img = imgs[0];
              const outOfStock = p.quantity <= 0;
              return (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="aspect-[4/3] bg-black/30 border-b border-white/10">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold">{p.name}</div>
                        {p.description ? (
                          <div className="mt-1 text-xs text-slate-400 line-clamp-2">{p.description}</div>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">GHS {p.price.toFixed(2)}</div>
                        <div className={`text-xs ${outOfStock ? 'text-red-300' : 'text-slate-400'}`}>
                          {outOfStock ? 'Out of stock' : `${p.quantity} in stock`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/store/${storeSlug}/checkout?productId=${p.id}&qty=1`}
                        aria-disabled={outOfStock}
                        className={`block text-center rounded-xl px-4 py-2 text-sm font-semibold ${
                          outOfStock
                            ? 'bg-white/10 text-slate-400 pointer-events-none'
                            : 'bg-gradient-to-r from-cyber-blue to-vivid-purple text-white hover:opacity-90'
                        }`}
                      >
                        Buy now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
            No products available yet.
          </div>
        )}
      </main>
    </div>
  );
}

