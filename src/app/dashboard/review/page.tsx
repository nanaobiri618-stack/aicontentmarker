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

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  linkedin: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  email: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [processed, setProcessed] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ContentItem | null>(null);
  const [busyAction, setBusyAction] = useState<number | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/review');
      if (!res.ok) throw new Error('Failed to load review items');
      const data = await res.json();
      setItems(data.filter((i: ContentItem) => i.status === 'pending'));
      setProcessed(data.filter((i: ContentItem) => i.status !== 'pending'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (id: number, action: 'approved' | 'rejected') => {
    setBusyAction(id);
    try {
      const res = await fetch('/api/dashboard/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'review_post', id, status: action }),
      });
      if (!res.ok) throw new Error('Action failed');
      
      const item = items.find(i => i.id === id);
      if (item) {
        const updated = { ...item, status: action };
        setProcessed(prev => [updated, ...prev]);
        setItems(prev => prev.filter(i => i.id !== id));
      }
      if (preview?.id === id) setPreview(null);
    } catch (e) {
      alert('Failed to perform action');
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-cyber-blue border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Scanning Queue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase italic flex items-center gap-3">
            Review Queue
            <span className="text-cyber-blue text-sm not-italic font-mono bg-cyber-blue/10 px-2 py-0.5 rounded border border-cyber-blue/20">
              {items.length}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
            Audit and approve AI-generated broadcasts
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-full border border-slate-200 dark:border-white/5">
          <SparklesIcon className="w-4 h-4 text-cyber-blue" />
          AI Analysis Active
        </div>
      </header>

      {/* Pending Items */}
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="group bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 space-y-6 transition-all duration-300 hover:border-slate-300 hover:dark:border-white/10 hover:bg-white hover:dark:bg-slate-900/60 shadow-sm dark:shadow-none"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                    platformColors[item.platform.toLowerCase()] ?? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-white/10'
                  }`}>
                    {item.platform}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-cyber-blue transition-colors">
                    {item.title}
                  </h2>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-slate-700 dark:text-slate-300">{item.institution}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>{new Date(item.createdAt).toLocaleString('en-GB')}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 dark:bg-black/30 p-4 rounded-3xl border border-slate-200 dark:border-white/5">
                <div className="text-center">
                   <div className="text-xl font-black text-cyber-blue font-mono">{item.aiScore}%</div>
                   <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AI Confidence</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-black/20 rounded-[1.5rem] p-6 border border-slate-200 dark:border-white/5 font-medium italic">
                &quot;{item.content}&quot;
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleAction(item.id, 'approved')}
                disabled={busyAction === item.id}
                className="flex items-center gap-2 px-6 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                <CheckCircleIcon className="w-4 h-4" /> 
                {busyAction === item.id ? 'Processing...' : 'Approve Broadcast'}
              </button>
              <button
                onClick={() => handleAction(item.id, 'rejected')}
                disabled={busyAction === item.id}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                <XCircleIcon className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => setPreview(preview?.id === item.id ? null : item)}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ml-auto"
              >
                <EyeIcon className="w-4 h-4" /> Full Preview
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[3rem] p-20 text-center shadow-sm dark:shadow-none"
        >
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
             <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-slate-900 dark:text-white font-black text-xl uppercase tracking-tight italic">Clear Signal</p>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">All generated content has been audited.</p>
        </motion.div>
      )}

      {/* Processed */}
      {processed.length > 0 && (
        <div className="mt-12 space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">
            Auditing History
          </h3>
          <div className="space-y-3">
            {processed.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-black/20 border border-white/5 rounded-2xl px-6 py-4 transition-opacity duration-300 hover:bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                    platformColors[item.platform.toLowerCase()] || 'bg-white/10 text-slate-500'
                  }`}>
                    {item.platform}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{item.title}</span>
                </div>
                <span
                  className={`text-[8px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                    item.status === 'approved'
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
