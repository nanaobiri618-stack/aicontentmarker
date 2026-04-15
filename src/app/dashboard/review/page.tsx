'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface ContentItem {
  id: number;
  title: string;
  content: string;
  institution: string;
  platform: string;
  aiScore: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const MOCK_ITEMS: ContentItem[] = [
  {
    id: 1,
    title: 'Golden Pharmacy — Flu Season Campaign',
    content:
      'Stay protected this flu season! Golden Pharmacy now stocks all major flu vaccines and antivirals. Walk in today — no appointment needed. Your health is our priority.',
    institution: 'Golden Pharmacy',
    platform: 'Facebook',
    aiScore: 94,
    status: 'pending',
    createdAt: '2026-04-14T10:30:00Z',
  },
  {
    id: 2,
    title: 'Pharma-Link G — Chronic Care Awareness',
    content:
      'Managing diabetes or hypertension? Pharma-Link G offers personalised medication packs, auto-refills, and free monthly blood pressure checks. Speak to our pharmacist today.',
    institution: 'Pharma-Link G.',
    platform: 'Instagram',
    aiScore: 88,
    status: 'pending',
    createdAt: '2026-04-14T09:15:00Z',
  },
  {
    id: 3,
    title: 'Golden Pharmacy — Weekend Promo',
    content:
      'This weekend only: 15% off all OTC vitamins and supplements. Visit Golden Pharmacy at Airport Hills and take control of your wellness journey.',
    institution: 'Golden Pharmacy',
    platform: 'Twitter/X',
    aiScore: 76,
    status: 'pending',
    createdAt: '2026-04-13T16:45:00Z',
  },
];

const platformColors: Record<string, string> = {
  Facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Twitter/X': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ContentItem[]>(MOCK_ITEMS);
  const [preview, setPreview] = useState<ContentItem | null>(null);

  const handleAction = (id: number, action: 'approved' | 'rejected') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
    if (preview?.id === id) setPreview(null);
  };

  const pending = items.filter((i) => i.status === 'pending');
  const done = items.filter((i) => i.status !== 'pending');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Content Review Queue</h1>
          <p className="text-sm text-slate-400">
            {pending.length} item{pending.length !== 1 ? 's' : ''} awaiting your approval
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <SparklesIcon className="w-4 h-4 text-cyber-blue" />
          AI pre-scored &amp; ranked
        </div>
      </header>

      {/* Pending Items */}
      <AnimatePresence>
        {pending.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-base font-semibold text-white">{item.title}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      platformColors[item.platform] ?? 'bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    {item.platform}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {item.institution} &middot;{' '}
                  {new Date(item.createdAt).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* AI Score */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`text-lg font-bold ${
                    item.aiScore >= 90
                      ? 'text-green-400'
                      : item.aiScore >= 75
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {item.aiScore}
                </div>
                <span className="text-xs text-slate-500">AI Score</span>
              </div>
            </div>

            {/* Content preview */}
            <p className="text-sm text-slate-300 leading-relaxed bg-black/20 rounded-xl p-4 border border-white/5">
              {item.content}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => handleAction(item.id, 'approved')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium transition-all"
              >
                <CheckCircleIcon className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => handleAction(item.id, 'rejected')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-all"
              >
                <XCircleIcon className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => setPreview(preview?.id === item.id ? null : item)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded-xl text-sm font-medium transition-all ml-auto"
              >
                <EyeIcon className="w-4 h-4" /> Preview
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {pending.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center"
        >
          <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold text-lg">Queue is clear!</p>
          <p className="text-slate-400 text-sm mt-1">All content has been reviewed.</p>
        </motion.div>
      )}

      {/* Processed */}
      {done.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Recently Processed
          </h3>
          <div className="space-y-3">
            {done.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl px-5 py-3"
              >
                <span className="text-sm text-slate-400">{item.title}</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    item.status === 'approved'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
