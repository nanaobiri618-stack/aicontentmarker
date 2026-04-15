'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Institution = {
  id: number;
  name: string;
  slug: string;
  industry: string;
  description?: string | null;
  website_url?: string | null;
  logoBase64?: string | null;
  documents?: string | null;
  verificationStatus: string;
  verificationNote?: string | null;
  colorPrimary?: string | null;
  colorSecondary?: string | null;
  socialHandles: { id: number; platform: string; handle: string }[];
  brandGuides: { id: number; toneVoice: string; targetAudience: string; restrictedKeywords: string; colorPalette?: string | null }[];
  products: { id: number; name: string; price: any; quantity: number; isVisible: boolean }[];
  generatedSite?: { id: number; slug: string; status: string } | null;
  agentTasks: { id: number; taskType: string; status: string; createdAt: string }[];
  generatedPosts: { id: number; platform: string; status: string; contentText: string; createdAt: string }[];
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

export default function InstitutionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: session } = useSession();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [manualNote, setManualNote] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/institutions/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load institution');
      setInstitution(json);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const brandGuide = institution?.brandGuides?.[0] ?? null;

  const palette = useMemo(() => {
    try {
      const parsed = brandGuide?.colorPalette ? JSON.parse(brandGuide.colorPalette) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [brandGuide?.colorPalette]);

  async function runAction(path: string, label: string) {
    setActionBusy(label);
    setError(null);
    try {
      const payload =
        label === 'generate ads' || label === 'predict'
          ? { institutionId: Number(id) }
          : undefined;

      const res = await fetch(path, {
        method: 'POST',
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Failed to ${label}`);
      await load();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setActionBusy(null);
    }
  }

  const isGodAdmin = String(session?.user?.email ?? '').toLowerCase() === 'admingod123@gmail.com';

  async function manualVerify(status: 'verified' | 'rejected' | 'pending') {
    setActionBusy(`manual_${status}`);
    setError(null);
    try {
      const res = await fetch(`/api/institutions/${id}/manual-verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: manualNote }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Manual verification failed');
      await load();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{institution?.name ?? (loading ? 'Loading…' : 'Institution')}</h1>
            {institution ? <StatusBadge status={institution.verificationStatus} /> : null}
          </div>
          {institution ? (
            <p className="text-sm text-slate-400">
              {institution.industry} • <span className="font-mono">/{institution.slug}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-400">Institution details and agent activity.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/institutions"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30"
          >
            Back
          </Link>
          {institution?.generatedSite?.slug ? (
            <Link
              href={`/store/${institution.generatedSite.slug}`}
              className="rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              View Storefront
            </Link>
          ) : null}
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">Loading institution…</div>
      ) : institution ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Verification</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Status: <span className="font-medium text-slate-200">{institution.verificationStatus}</span>
                  </p>
                  <p className="text-sm text-slate-300 mt-3">{institution.verificationNote || 'No verification note yet.'}</p>

                  {isGodAdmin ? (
                    <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs text-slate-400 mb-2">Main admin decision</div>
                      <textarea
                        value={manualNote}
                        onChange={(e) => setManualNote(e.target.value)}
                        placeholder="Add a verification note (optional)"
                        className="w-full min-h-20 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => manualVerify('verified')}
                          disabled={!!actionBusy}
                          className="rounded-xl bg-green-500/20 border border-green-500/30 px-3 py-2 text-sm text-green-200 hover:bg-green-500/30 disabled:opacity-50"
                        >
                          {actionBusy === 'manual_verified' ? 'Approving…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => manualVerify('rejected')}
                          disabled={!!actionBusy}
                          className="rounded-xl bg-red-500/20 border border-red-500/30 px-3 py-2 text-sm text-red-200 hover:bg-red-500/30 disabled:opacity-50"
                        >
                          {actionBusy === 'manual_rejected' ? 'Rejecting…' : 'Reject'}
                        </button>
                        <button
                          onClick={() => manualVerify('pending')}
                          disabled={!!actionBusy}
                          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30 disabled:opacity-50"
                        >
                          {actionBusy === 'manual_pending' ? 'Updating…' : 'Set Pending'}
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        Only <span className="font-mono">adminGOD123@gmail.com</span> can do this.
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => runAction(`/api/institutions/${institution.id}/validate`, 'validate')}
                    disabled={!!actionBusy}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30 disabled:opacity-50"
                  >
                    {actionBusy === 'validate' ? 'Validating…' : 'Run Validation Agent'}
                  </button>
                  <Link
                    href={`/dashboard/institutions/${institution.id}/products`}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30 text-center"
                  >
                    Manage Products
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Agents</h2>
                  <p className="text-sm text-slate-400 mt-1">Trigger background agents for this institution.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => runAction(`/api/institutions/${institution.id}/generate-site`, 'generate site')}
                    disabled={!!actionBusy}
                    className="rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {actionBusy === 'generate site' ? 'Generating…' : 'Generate Website'}
                  </button>
                  <button
                    onClick={() => runAction(`/api/agents/ads`, 'generate ads')}
                    disabled={!!actionBusy}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30 disabled:opacity-50"
                  >
                    {actionBusy === 'generate ads' ? 'Generating…' : 'Generate Ads'}
                  </button>
                  <button
                    onClick={() => runAction(`/api/agents/predict`, 'predict')}
                    disabled={!!actionBusy}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30 disabled:opacity-50"
                  >
                    {actionBusy === 'predict' ? 'Predicting…' : 'Run Prediction'}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-slate-400">Brand Guide</div>
                  <div className="mt-2 text-sm text-white">{brandGuide?.toneVoice ?? '—'}</div>
                  <div className="mt-1 text-xs text-slate-400">{brandGuide?.targetAudience ?? '—'}</div>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs text-slate-400">Palette:</span>
                    {(palette ?? [institution.colorPrimary, institution.colorSecondary]).filter(Boolean).slice(0, 4).map((c: any) => (
                      <span key={String(c)} className="h-4 w-4 rounded-full border border-white/10" style={{ background: String(c) }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-slate-400">Social handles</div>
                  <div className="mt-2 space-y-1 text-sm text-slate-200">
                    {institution.socialHandles.length ? (
                      institution.socialHandles.map((s) => (
                        <div key={s.id} className="flex items-center justify-between">
                          <span className="text-slate-300">{s.platform}</span>
                          <span className="font-mono text-slate-100">@{s.handle}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400">No handles added.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-sm font-semibold text-white">Recent Agent Activity</h2>
              <div className="mt-3 space-y-2 text-sm">
                {institution.agentTasks.length ? (
                  institution.agentTasks.map((t) => (
                    <div key={t.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 flex items-center justify-between">
                      <div className="text-slate-200">
                        <span className="font-mono text-xs text-slate-400">{t.taskType}</span>
                        <div className="text-sm">{t.status}</div>
                      </div>
                      <div className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400">No agent tasks yet.</div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-sm font-semibold text-white">Products</h2>
              <p className="text-sm text-slate-400 mt-1">{institution.products.length} total</p>
              <div className="mt-3 space-y-2">
                {institution.products.slice(0, 8).map((p) => (
                  <div key={p.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.isVisible ? 'visible' : 'hidden'}</div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      GHS {Number(p.price)} • stock {p.quantity}
                    </div>
                  </div>
                ))}
                {institution.products.length > 8 ? (
                  <div className="text-xs text-slate-400">+ {institution.products.length - 8} more</div>
                ) : null}
              </div>
              <Link
                href={`/dashboard/institutions/${institution.id}/products`}
                className="mt-4 block text-center rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Manage products
              </Link>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-sm font-semibold text-white">Pending Posts</h2>
              <div className="mt-3 space-y-2 text-sm">
                {institution.generatedPosts.length ? (
                  institution.generatedPosts.map((p) => (
                    <div key={p.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200">{p.platform}</span>
                        <span className="text-xs text-slate-400">{p.status}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-300 line-clamp-3">{p.contentText}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400">No pending posts.</div>
                )}
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">Not found.</div>
      )}
    </div>
  );
}

