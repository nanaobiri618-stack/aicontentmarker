'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

type Institution = {
  id: number;
  name: string;
  slug: string;
  industry: string;
  verificationStatus: string;
  verificationNote?: string | null;
  createdAt: string;
  generatedSite?: { slug: string; status: string } | null;
  products?: { id: number }[];
};

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase?.() ?? 'pending';
  const styles =
    s === 'verified'
      ? 'bg-green-500/15 text-green-300 border-green-500/30'
      : s === 'rejected'
      ? 'bg-red-500/15 text-red-300 border-red-500/30'
      : s === 'processing'
      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
      : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${styles}`}>
      {s.toUpperCase()}
    </span>
  );
}

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/institutions', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load institutions');
      setInstitutions(json);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...institutions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [institutions]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Institutions</h1>
          <p className="text-sm text-slate-400">Create, verify, and launch storefronts for your institutions.</p>
        </div>
        <Link
          href="/dashboard/institutions/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          New Institution
        </Link>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}{' '}
          <button onClick={load} className="underline underline-offset-2 hover:text-white">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
                <div className="h-4 w-2/3 bg-white/10 rounded mb-3" />
                <div className="h-3 w-1/2 bg-white/10 rounded mb-6" />
                <div className="h-9 w-full bg-white/10 rounded" />
              </div>
            ))
          : sorted.map((inst) => (
              <div key={inst.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{inst.name}</h3>
                    <p className="text-xs text-slate-400">{inst.industry}</p>
                  </div>
                  <StatusBadge status={inst.verificationStatus} />
                </div>

                {inst.verificationNote ? (
                  <p className="mt-3 text-xs text-slate-300 line-clamp-3">{inst.verificationNote}</p>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">No verification note yet.</p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>{inst.products?.length ?? 0} products</span>
                  <span className="truncate">/{inst.slug || 'slug-pending'}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/dashboard/institutions/${inst.id}`}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30 text-center"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/dashboard/institutions/${inst.id}/products`}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30 text-center"
                  >
                    Products
                  </Link>
                </div>

                {inst.generatedSite?.slug ? (
                  <Link
                    href={`/store/${inst.generatedSite.slug}`}
                    className="mt-3 block text-center text-sm text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                  >
                    View Storefront
                  </Link>
                ) : null}
              </div>
            ))}
      </div>
    </div>
  );
}

