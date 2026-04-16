'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

type OrderRow = {
  id: number;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  product: {
    id: number;
    name: string;
    institution: { name: string };
  };
};

type StoreCard = {
  slug: string;
  institutionName: string;
  industry: string;
  description: string;
  logo?: string;
};

type Recommendation = {
  productId: number;
  name: string;
  reason: string;
  matchScore: number;
};

export default function UserDashboardPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stores, setStores] = useState<StoreCard[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Parallel fetching
        const [ordersRes, storesRes, recsRes] = await Promise.all([
          fetch('/api/user/orders', { cache: 'no-store' }),
          fetch('/api/public/stores', { cache: 'no-store' }),
          fetch('/api/user/recommendations', { cache: 'no-store' }),
        ]);

        const ordersJson = await ordersRes.json();
        const storesJson = await storesRes.json();
        const recsJson = await recsRes.json();

        setOrders(ordersJson.orders ?? []);
        setStores(storesJson.stores ?? []);
        setRecommendations(recsJson.recommendations ?? []);
      } catch (e: any) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyber-blue/30 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vivid-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-blue/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-3xl">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'Explorer'}
            </h1>
            <p className="text-slate-400 mt-1">{session?.user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="rounded-2xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 animate-pulse">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Areas */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Exploration Hub */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Explore Businesses</h2>
                <div className="h-px flex-1 bg-white/10 mx-4 hidden md:block" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 rounded-2xl bg-white/5 animate-shimmer" />
                  ))
                ) : stores.length > 0 ? (
                  stores.map((store) => (
                    <Link
                      key={store.slug}
                      href={`/store/${store.slug}`}
                      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 hover:border-cyber-blue/50 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 shadow-2xl"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyber-blue to-vivid-purple rounded-full blur-2xl" />
                      </div>
                      
                      <div className="flex items-start gap-4">
                        {store.logo ? (
                          <img src={store.logo} alt={store.institutionName} className="w-12 h-12 rounded-xl object-cover bg-black/40 border border-white/10" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-blue/20 to-vivid-purple/20 border border-white/10 flex items-center justify-center font-bold text-cyber-blue text-xs">
                            {store.institutionName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white group-hover:text-cyber-blue transition-colors">
                              {store.institutionName}
                            </h3>
                            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 font-bold">
                              {store.industry}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {store.description || 'Verified institution providing premium services and products.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">/store/{store.slug}</span>
                        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Visit Store</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm col-span-2">No businesses listed yet.</p>
                )}
              </div>
            </section>

            {/* Orders Table */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase tracking-widest bg-white/[0.02]">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Institution</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {loading ? (
                         [1, 2, 3].map((i) => (
                          <tr key={i}><td className="px-6 py-6 animate-pulse" colSpan={5}><div className="h-4 bg-white/5 rounded w-full"/></td></tr>
                        ))
                      ) : orders.length > 0 ? (
                        orders.map((o) => (
                          <tr key={o.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">#{o.id}</td>
                            <td className="px-6 py-4 font-medium text-white">{o.product.name}</td>
                            <td className="px-6 py-4 text-xs text-slate-400">{o.product.institution.name}</td>
                            <td className="px-6 py-4">GHS {Number(o.totalPrice).toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                o.status === 'completed' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                              }`}>
                                {o.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td className="px-6 py-8 text-slate-500 text-center" colSpan={5}>No order history available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Area - Recommendations */}
          <aside className="space-y-8">
            <div className="sticky top-10 space-y-8">
              <section className="rounded-3xl p-6 bg-gradient-to-br from-cyber-blue/10 to-vivid-purple/10 border border-white/10 relative overflow-hidden group">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyber-blue blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
                
                <div className="relative flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                    <svg className="w-5 h-5 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <h2 className="text-lg font-bold">Personalized for You</h2>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    [1, 2].map((i) => (
                      <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                    ))
                  ) : recommendations.length > 0 ? (
                    recommendations.map((rec) => (
                      <div key={rec.productId} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group/rec shadow-lg">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm text-white group-hover/rec:text-cyber-blue transition-colors">{rec.name}</h4>
                          <span className="text-[10px] font-mono text-cyber-blue bg-cyber-blue/10 px-1.5 py-0.5 rounded border border-cyber-blue/20">{rec.matchScore}% Match</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight italic">"{rec.reason}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center py-10">
                      <p className="text-xs text-slate-500">Start shopping to unlock AI recommendations tailored to your style.</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Powered by Gemini AI Monitor</p>
                </div>
              </section>

              {/* Quick Support / Feedback */}
              <div className="p-6 rounded-3xl border border-white/10 bg-white/5 text-center hidden lg:block">
                <h3 className="text-sm font-bold mb-2 text-slate-300">Need Assistance?</h3>
                <p className="text-xs text-slate-500 mb-4 px-2">Our agents are always monitoring to improve your experience.</p>
                <button className="text-xs font-semibold text-cyber-blue hover:text-white transition-colors">Support Center &rarr;</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

