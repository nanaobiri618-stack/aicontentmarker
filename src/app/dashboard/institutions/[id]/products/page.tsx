'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: any;
  quantity: number;
  images?: string | null;
  isVisible: boolean;
  createdAt: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function InstitutionProductsPage() {
  const params = useParams<{ id: string }>();
  const institutionId = params?.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('0');
  const [quantity, setQuantity] = useState<string>('0');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?institutionId=${institutionId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load products');
      setProducts(json);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (institutionId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [products]);

  async function addProduct() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          name,
          description: description || null,
          price: Number(price),
          quantity: Number(quantity),
          images: images.length ? images.slice(0, 5) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to add product');
      setName('');
      setDescription('');
      setPrice('0');
      setQuantity('0');
      setImages([]);
      await load();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(p: Product) {
    setError(null);
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !p.isVisible }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to update product');
      await load();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    }
  }

  async function generateSite() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/institutions/${institutionId}/generate-site`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to generate site');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-slate-400">Add products, manage stock, and generate a storefront.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/institutions/${institutionId}`}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30"
          >
            Back to institution
          </Link>
          <button
            onClick={generateSite}
            disabled={generating}
            className="rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate Website'}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold text-white">Add product</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-xs text-slate-300">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-300">Price (GHS)</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs text-slate-300">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full min-h-20 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-300">Quantity</span>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="0" step="1" className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1 md:col-span-1">
            <span className="text-xs text-slate-300">Images (up to 5)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="w-full text-sm text-slate-300"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []).slice(0, 5);
                const b64 = await Promise.all(files.map(fileToBase64));
                setImages(b64);
              }}
            />
          </label>
        </div>

        {images.length ? (
          <div className="mt-4 grid grid-cols-5 gap-2">
            {images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`Product image ${i + 1}`} className="h-16 w-16 rounded-lg object-cover border border-white/10" />
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            onClick={addProduct}
            disabled={saving || !name.trim() || Number(price) <= 0}
            className="rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add product'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold text-white">Product list</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-black/20 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : sorted.length ? (
                sorted.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{p.name}</div>
                      {p.description ? <div className="text-xs text-slate-400 line-clamp-2">{p.description}</div> : null}
                    </td>
                    <td className="px-4 py-4">GHS {Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-4">{p.quantity}</td>
                    <td className="px-4 py-4">{p.isVisible ? 'Visible' : 'Hidden'}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => toggleVisibility(p)}
                        className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white hover:bg-black/30"
                      >
                        Toggle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={5}>
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

