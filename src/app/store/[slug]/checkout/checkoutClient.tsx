'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

type Product = { id: number; name: string; price: number; quantity: number } | null;

export default function CheckoutClient({
  storeSlug,
  institutionName,
  product,
  qty,
  reference,
  orderId,
}: {
  storeSlug: string;
  institutionName: string;
  product: Product;
  qty: number;
  reference: string | null;
  orderId: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [quantity, setQuantity] = useState(qty);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const total = useMemo(() => {
    if (!product) return 0;
    return product.price * quantity;
  }, [product, quantity]);

  useEffect(() => {
    async function verifyIfNeeded() {
      if (!reference || !orderId) return;
      setBusy('verifying');
      setError(null);
      setSuccess(null);
      try {
        const res = await fetch(`/api/payments/orders/verify?reference=${encodeURIComponent(reference)}&orderId=${orderId}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to verify payment');
        if (json?.success) setSuccess('Payment verified. Your order is confirmed.');
        else setError('Payment not successful yet. If you just paid, refresh in a moment.');
      } catch (e: any) {
        setError(e.message || 'Something went wrong');
      } finally {
        setBusy(null);
      }
    }
    verifyIfNeeded();
  }, [reference, orderId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const next = `/store/${storeSlug}/checkout?${searchParams.toString()}`;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(next)}`);
    }
  }, [router, searchParams, status, storeSlug]);

  async function placeOrderAndPay() {
    if (!product) return;
    setBusy('pay');
    setError(null);
    setSuccess(null);
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order?.error || 'Failed to create order');

      const initRes = await fetch('/api/payments/orders/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, storeSlug }),
      });
      const init = await initRes.json();
      if (!initRes.ok) throw new Error(init?.error || 'Failed to initialize payment');

      window.location.href = init.authorization_url;
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Checkout</h1>
            <p className="text-sm text-slate-400">{institutionName}</p>
          </div>
          <Link href={`/store/${storeSlug}`} className="text-sm text-slate-300 hover:text-white underline underline-offset-4">
            Back to store
          </Link>
        </header>

        {success ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">{success}</div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          {!product ? (
            <div className="text-slate-300">
              Missing product selection. Go back and choose a product.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-white">{product.name}</div>
                  <div className="text-sm text-slate-400">GHS {product.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">In stock</div>
                  <div className="text-sm text-slate-200">{product.quantity}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-slate-300">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, product.quantity)}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity || 1, Number(e.target.value) || 1)))}
                  className="w-28 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="text-sm text-slate-300">Total</div>
                <div className="text-lg font-bold">GHS {total.toFixed(2)}</div>
              </div>

              <button
                onClick={placeOrderAndPay}
                disabled={busy === 'pay' || status !== 'authenticated' || product.quantity <= 0}
                className="w-full rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy === 'pay' ? 'Redirecting to Paystack…' : 'Pay with Paystack'}
              </button>

              <div className="text-xs text-slate-400">
                Signed in as: <span className="text-slate-200">{session?.user?.email ?? '—'}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

