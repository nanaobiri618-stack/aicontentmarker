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

export default function UserDashboardPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/user/orders', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load orders');
        setOrders(json.orders ?? []);
      } catch (e: any) {
        setError(e.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const storeSlug = (session?.user as any)?.institutionSlug as string | null | undefined;

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Dashboard</h1>
            <p className="text-sm text-slate-400">{session?.user?.email ?? '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            {storeSlug ? (
              <Link
                href={`/store/${storeSlug}`}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30"
              >
                Go to Store
              </Link>
            ) : null}
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-sm font-semibold text-white">My Orders</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-black/20 uppercase">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-400" colSpan={6}>
                      Loading…
                    </td>
                  </tr>
                ) : orders.length ? (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/5">
                      <td className="px-4 py-4 font-mono">#{o.id}</td>
                      <td className="px-4 py-4">{o.product.name}</td>
                      <td className="px-4 py-4">{o.product.institution.name}</td>
                      <td className="px-4 py-4">GHS {Number(o.totalPrice).toFixed(2)}</td>
                      <td className="px-4 py-4">{o.status}</td>
                      <td className="px-4 py-4 text-slate-400">{new Date(o.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4 text-slate-400" colSpan={6}>
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

