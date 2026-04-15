'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: true,
      callbackUrl: '/',
    });

    // If redirect=false was used we'd read res.error. With redirect=true,
    // NextAuth will redirect on success; on failure, it stays.
    if ((res as any)?.error) setError('Invalid email or password');
    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="backdrop-blur-lg bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyber-blue to-vivid-purple bg-clip-text text-transparent mb-4">
            <SparklesIcon className="w-8 h-8" />
            <h1 className="text-3xl font-bold">AI Content Orchestrator</h1>
          </div>
          <p className="text-slate-300">Sign in to access your marketing AI</p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs text-slate-300">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder="name@example.com"
            />
          </label>

          <label className="block">
            <span className="text-xs text-slate-300">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder="Your password"
            />
          </label>

          <button
            onClick={submit}
            disabled={busy || !email.trim() || password.length < 1}
            className="w-full bg-gradient-to-r from-cyber-blue to-vivid-purple hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          No account?{' '}
          <Link href="/auth/signup" className="text-slate-200 hover:text-white underline underline-offset-4">
            Create one
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
