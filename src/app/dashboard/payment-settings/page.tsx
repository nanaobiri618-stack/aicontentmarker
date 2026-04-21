'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PaymentSettingsPage() {
  const [paystackKey, setPaystackKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function checkKey() {
      try {
        const res = await fetch('/api/institutions/paystack-key');
        const data = await res.json();
        if (res.ok) {
          setHasKey(data.hasPaystackKey);
          setInstitutionName(data.institutionName || '');
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    checkKey();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!paystackKey.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/institutions/paystack-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paystackApiKey: paystackKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save key' });
        return;
      }

      setHasKey(true);
      setIsLive(data.isLive);
      setPaystackKey('');
      setMessage({ type: 'success', text: `Paystack API key saved successfully! (${data.isLive ? 'LIVE' : 'TEST'} mode)` });
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm('Are you sure you want to remove your Paystack key? Payments will default to the platform account.')) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/institutions/paystack-key', { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to remove key' });
        return;
      }

      setHasKey(false);
      setIsLive(false);
      setMessage({ type: 'success', text: 'Paystack API key removed. Payments will go to platform account.' });
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Payment Settings</h1>
          <p className="text-slate-400 mt-1">
            Connect your Paystack account to receive payments directly
          </p>
        </div>

        {/* How it works */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">How it works</h3>
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 font-bold">1.</span>
              <p className="text-slate-300">
                <a
                  href="https://paystack.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Sign up for a Paystack account
                </a>{' '}
                if you don&apos;t have one
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 font-bold">2.</span>
              <p className="text-slate-300">
                Get your <strong>Secret Key</strong> from Paystack Dashboard → Settings → API Keys
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 font-bold">3.</span>
              <p className="text-slate-300">
                Paste your key below — all payments from your store go to <strong>your</strong> Paystack account
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 font-bold">7%</span>
              <p className="text-slate-300">
                A <strong>7% platform fee</strong> is added on top of every purchase for maintenance costs
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className={`rounded-xl p-5 border ${
          hasKey
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">
                {hasKey ? '✓ Paystack Connected' : '⚠ Paystack Not Connected'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {hasKey
                  ? `Payments from ${institutionName} go to your Paystack account`
                  : 'Payments default to the platform account until you connect your key'}
              </p>
            </div>
            {hasKey && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {isLive ? 'LIVE' : 'TEST'}
              </span>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg p-4 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Paystack Secret Key
            </label>
            <input
              type="password"
              value={paystackKey}
              onChange={(e) => setPaystackKey(e.target.value)}
              placeholder="sk_test_... or sk_live_..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              Your key is stored securely and never exposed to the client. Use <code className="text-slate-400">sk_test_</code> for testing, <code className="text-slate-400">sk_live_</code> for production.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !paystackKey.trim()}
              className="px-6 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : hasKey ? 'Update Key' : 'Connect Paystack'}
            </button>

            {hasKey && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={saving}
                className="px-6 py-2.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Remove Key
              </button>
            )}
          </div>
        </form>

        {/* Paystack Signup Link */}
        {!hasKey && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Don&apos;t have a Paystack account?</h3>
            <p className="text-slate-400 text-sm mb-4">
              Sign up for free and start accepting payments from customers in Ghana
            </p>
            <a
              href="https://paystack.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-semibold"
            >
              Sign Up for Paystack →
            </a>
          </div>
        )}

        {/* Fee Breakdown */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-3">Fee Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Product Price</span>
              <span className="text-white">Paid by customer</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Platform Fee (7%)</span>
              <span className="text-yellow-400">Added on top</span>
            </div>
            <div className="border-t border-slate-600 pt-2 flex justify-between">
              <span className="text-slate-300 font-medium">You Receive</span>
              <span className="text-green-400 font-medium">100% of product price</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Platform Receives</span>
              <span className="text-yellow-400 font-medium">7% fee from customer</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Example: Product costs GHS 100 → Customer pays GHS 107 → You receive GHS 100 → Platform receives GHS 7
          </p>
        </div>
      </motion.div>
    </div>
  );
}
