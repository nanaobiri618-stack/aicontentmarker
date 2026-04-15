'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type SocialHandleInput = { platform: string; handle: string; profileUrl?: string };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

const steps = ['Basic Info', 'Documentation', 'Social Handles', 'Brand Guide'] as const;

export default function NewInstitutionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [colorPrimary, setColorPrimary] = useState('#00D4FF');
  const [colorSecondary, setColorSecondary] = useState('#B026FF');

  // Step 2
  const [documentsBase64, setDocumentsBase64] = useState<string | null>(null);

  // Step 3
  const [socialHandles, setSocialHandles] = useState<SocialHandleInput[]>([
    { platform: 'instagram', handle: '' },
    { platform: 'facebook', handle: '' },
    { platform: 'twitter', handle: '' },
    { platform: 'tiktok', handle: '' },
  ]);

  // Step 4
  const [toneVoice, setToneVoice] = useState('Professional');
  const [targetAudience, setTargetAudience] = useState('General public');
  const [restrictedWords, setRestrictedWords] = useState('');

  const canContinue = useMemo(() => {
    if (step === 0) return name.trim().length > 1 && industry.trim().length > 1;
    return true;
  }, [step, name, industry]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const cleanHandles = socialHandles
        .map((s) => ({ ...s, handle: s.handle.trim().replace(/^@/, '') }))
        .filter((s) => s.handle.length);

      const restrictedKeywords = restrictedWords
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);

      const createRes = await fetch('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry,
          description: description || null,
          website_url: websiteUrl || null,
          logoBase64,
          documents: documentsBase64,
          colorPrimary,
          colorSecondary,
          socialHandles: cleanHandles.map((s) => ({
            platform: s.platform,
            handle: s.handle,
            profileUrl: s.profileUrl || null,
          })),
          brandGuide: {
            toneVoice,
            targetAudience,
            restrictedKeywords: JSON.stringify(restrictedKeywords),
            colorPalette: JSON.stringify([colorPrimary, colorSecondary]),
          },
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created?.error || 'Failed to create institution');

      // Trigger Validation Agent immediately
      const validateRes = await fetch(`/api/institutions/${created.id}/validate`, { method: 'POST' });
      if (!validateRes.ok) {
        const j = await validateRes.json().catch(() => ({}));
        throw new Error(j?.error || 'Institution created but validation failed to start');
      }

      router.push(`/dashboard/institutions/${created.id}`);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">New Institution</h1>
          <p className="text-sm text-slate-400">Step {step + 1} of {steps.length}: {steps[step]}</p>
        </div>
        <Link href="/dashboard/institutions" className="text-sm text-slate-300 hover:text-white underline underline-offset-4">
          Back to list
        </Link>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex gap-2 flex-wrap mb-5">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(i)}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                i === step
                  ? 'bg-purple-500/15 text-purple-200 border-purple-500/30'
                  : 'bg-black/20 text-slate-300 border-white/10 hover:bg-black/30'
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {step === 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-xs text-slate-300">Institution name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-300">Industry</span>
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-xs text-slate-300">Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full min-h-24 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-slate-300">Website URL</span>
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <label className="space-y-1 md:col-span-1">
                <span className="text-xs text-slate-300">Logo upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-slate-300"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const b64 = await fileToBase64(f);
                    setLogoBase64(b64);
                  }}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-300">Primary color</span>
                <input type="color" value={colorPrimary} onChange={(e) => setColorPrimary(e.target.value)} className="h-10 w-full rounded-xl bg-black/30 border border-white/10 p-1" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-300">Secondary color</span>
                <input type="color" value={colorSecondary} onChange={(e) => setColorSecondary(e.target.value)} className="h-10 w-full rounded-xl bg-black/30 border border-white/10 p-1" />
              </label>
            </div>

            {logoBase64 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-slate-400 mb-2">Logo preview</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoBase64} alt="Logo preview" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <label className="space-y-1">
              <span className="text-xs text-slate-300">Registration docs (PDF/image)</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="w-full text-sm text-slate-300"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const b64 = await fileToBase64(f);
                  setDocumentsBase64(b64);
                }}
              />
            </label>
            <div className="text-xs text-slate-400">
              Stored as base64 in the database (swap to cloud storage for production).
            </div>
            {documentsBase64 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                Documents uploaded.
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-400">
                No documents uploaded yet.
              </div>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-300">Add your social handles (optional).</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialHandles.map((s, idx) => (
                <label key={s.platform} className="space-y-1">
                  <span className="text-xs text-slate-300">{s.platform}</span>
                  <input
                    value={s.handle}
                    onChange={(e) => {
                      const next = [...socialHandles];
                      next[idx] = { ...next[idx], handle: e.target.value };
                      setSocialHandles(next);
                    }}
                    placeholder="@handle"
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-slate-300">Tone of voice</span>
              <input value={toneVoice} onChange={(e) => setToneVoice(e.target.value)} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-slate-300">Target audience</span>
              <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-slate-300">Restricted words (comma-separated)</span>
              <input value={restrictedWords} onChange={(e) => setRestrictedWords(e.target.value)} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white" />
            </label>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400">
              Brand colors are taken from Step 1. You can update these later.
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white hover:bg-black/30 disabled:opacity-50"
            disabled={step === 0 || submitting}
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              disabled={!canContinue || submitting}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className="rounded-xl bg-gradient-to-r from-cyber-blue to-vivid-purple px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              disabled={submitting || !canContinue}
            >
              {submitting ? 'Submitting…' : 'Submit & Validate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

