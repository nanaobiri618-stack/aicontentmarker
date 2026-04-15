'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { signIn } from 'next-auth/react';

type StoreOption = { slug: string; institutionName: string; industry: string };

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'user'>('user');
  const [storeSlug, setStoreSlug] = useState<string>('');

  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStores() {
      setLoadingStores(true);
      try {
        const res = await fetch('/api/public/stores', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok) setStores(json.stores ?? []);
      } finally {
        setLoadingStores(false);
      }
    }
    loadStores();
  }, []);

  const canSubmit = useMemo(() => {
    if (!email.trim() || password.length < 8) return false;
    if (role === 'user' && !storeSlug) return false;
    return true;
  }, [email, password, role, storeSlug]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          storeSlug: role === 'user' ? storeSlug : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to sign up');

      // Auto-login after signup
      const login = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: role === 'user' ? '/user' : '/dashboard',
      });

      if ((login as any)?.error) {
        throw new Error('Account created, but login failed. Please sign in.');
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="backdrop-blur-lg bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-sm text-slate-300 mb-6">Sign up to access the platform.</p>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs text-slate-300">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder="user name"
            />
          </label>

          <label className="block">
            <span className="text-xs text-slate-300">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder="user@example.com"
            />
          </label>

          <label className="block">
            <span className="text-xs text-slate-300">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder="At least 8 characters"
            />
          </label>

          <label className="block">
            <span className="text-xs text-slate-300">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
            >
              <option value="user">User (customer)</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {role === 'user' ? (
            <label className="block">
              <span className="text-xs text-slate-300">Choose storefront</span>
              <select
                value={storeSlug}
                onChange={(e) => setStoreSlug(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                disabled={loadingStores}
              >
                <option value="">{loadingStores ? 'Loading stores…' : 'Select a store'}</option>
                {stores.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.institutionName} ({s.industry}) — /store/{s.slug}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                This links your customer account to the institution storefront.
              </p>
            </label>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
              Owners/Admins can create institutions after signing in.
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy || !canSubmit}
            className="w-full bg-gradient-to-r from-cyber-blue to-vivid-purple hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
          >
            {busy ? 'Creating…' : 'Sign up'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-slate-200 hover:text-white underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

