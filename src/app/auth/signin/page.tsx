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
          <button
            onClick={() => { setBusy(true); signIn('google', { callbackUrl: '/' }); }}
            disabled={busy}
            className="w-full bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
               <span className="bg-[#1e293b] text-xs text-slate-400 px-3 font-medium tracking-wide uppercase">Or with email</span>
            </div>
          </div>

          <label className="block">
            <span className="text-xs text-slate-300">Email (Admin)</span>
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
