'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Chatbot from '@/components/storefront/Chatbot';

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

type Recommendation = {
  productId: number;
  name: string;
  reason: string;
  matchScore: number;
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
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const loadRecs = async () => {
        setLoadingRecs(true);
        try {
          const res = await fetch(`/api/user/recommendations?institutionId=${institution.id}`, { cache: 'no-store' });
          const json = await res.json();
          if (res.ok) setRecommendations(json.recommendations ?? []);
        } catch (e) {
          console.error('Failed to load recommendations');
        } finally {
          setLoadingRecs(false);
        }
      };
      loadRecs();
    }
  }, [session, institution.id]);

  const heroGradient = useMemo(() => {
    return `linear-gradient(135deg, ${institution.colorPrimary}33, ${institution.colorSecondary}22)`;
  }, [institution.colorPrimary, institution.colorSecondary]);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyber-blue/30">
      <Chatbot institutionId={institution.id} institutionName={institution.name} />
      
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
                <div className="h-14 w-14 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center font-bold text-cyber-blue">
                  {institution.name.charAt(0)}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{institution.name}</h1>
                    <p className="text-sm text-slate-200/80">{institution.industry}</p>
                  </div>
                  {!session?.user ? (
                    <Link
                      href="/auth/signin"
                      className="text-sm text-slate-200/90 hover:text-white underline underline-offset-4"
                    >
                      Sign in
                    </Link>
                  ) : (
                    <Link href="/user" className="text-xs font-bold uppercase tracking-widest text-cyber-blue hover:opacity-80">
                      My Dashboard
                    </Link>
                  )}
                </div>
                {institution.description ? (
                  <p className="mt-3 text-sm text-slate-100/90 max-w-2xl">{institution.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10 space-y-12">
        {/* Personalized Recommendations Section */}
        {session?.user && recommendations.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyber-blue/10 border border-cyber-blue/20">
                <svg className="w-5 h-5 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Recommended for You</h2>
                <p className="text-xs text-slate-400">Based on your recent interests and purchases</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <div key={rec.productId} className="group relative p-5 rounded-3xl border border-cyber-blue/20 bg-cyber-blue/5 hover:bg-cyber-blue/10 hover:border-cyber-blue/40 transition-all shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className="w-16 h-16 bg-cyber-blue rounded-full blur-2xl" />
                  </div>
                  <div className="relative">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-cyber-blue">{rec.name}</h4>
                      <span className="text-[10px] font-bold text-cyber-blue bg-cyber-blue/20 px-2 py-0.5 rounded-full border border-cyber-blue/30">
                        {rec.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 italic mb-4">&quot;{rec.reason}&quot;</p>
                    <Link
                      href={`/store/${storeSlug}/checkout?productId=${rec.productId}&qty=1`}
                      className="inline-flex items-center gap-2 text-xs font-bold text-white bg-cyber-blue/40 px-4 py-2 rounded-xl hover:bg-cyber-blue transition-colors"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold">Products</h2>
            <p className="text-sm text-slate-400">Browse available items and checkout securely.</p>
          </div>

          {products.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const imgs = safeParseImages(p.images);
                const img = imgs[0];
                const outOfStock = p.quantity <= 0;
                return (
                  <div key={p.id} className="group rounded-3xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 hover:bg-white/[0.07] transition-all shadow-xl">
                    <div className="aspect-[4/3] bg-black/30 border-b border-white/10 overflow-hidden relative">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                          No image
                        </div>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-white">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold truncate group-hover:text-cyber-blue transition-colors">{p.name}</div>
                          {p.description ? (
                            <div className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description}</div>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-white">GHS {p.price.toFixed(2)}</div>
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${outOfStock ? 'text-red-400' : 'text-slate-500'}`}>
                            {outOfStock ? 'Expired' : `${p.quantity} Available`}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <Link
                          href={`/store/${storeSlug}/checkout?productId=${p.id}&qty=1`}
                          aria-disabled={outOfStock}
                          className={`block text-center rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                            outOfStock
                              ? 'bg-white/5 text-slate-600 pointer-events-none'
                              : 'bg-white/10 border border-white/10 text-white hover:bg-vivid-purple hover:border-vivid-purple hover:shadow-[0_0_20px_rgba(176,38,255,0.4)]'
                          }`}
                        >
                          {outOfStock ? 'Locked' : 'Purchase'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-slate-500">
              No products available yet. Check back soon.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
