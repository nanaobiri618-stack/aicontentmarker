'use client';

import { motion } from 'framer-motion';
import { ClockIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface HistoryItem {
  id: number;
  type: 'approved' | 'rejected' | 'generated';
  label: string;
  institution: string;
  time: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  approved: { icon: CheckCircleIcon, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  rejected: { icon: XCircleIcon, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  generated: { icon: SparklesIcon, color: 'text-cyber-blue', bg: 'bg-cyan-500/10 border-cyan-500/20' },
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/dashboard/history');
        if (!res.ok) throw new Error('Failed to fetch history data');
        const data = await res.json();
        setHistory(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-cyber-blue border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Sequencing History...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 font-bold mb-2">Error Retrieval Failed</p>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <header className="mb-10 text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase italic">
          Activity Log
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center lg:justify-start gap-2 uppercase tracking-widest font-bold">
          <span className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse" />
          Full audit of content decisions and AI actions
        </p>
      </header>

      {/* Timeline */}
      <div className="relative">
        {history.length > 0 ? (
          <>
            {/* Vertical line with gradient */}
            <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyber-blue/50 via-slate-200 dark:via-white/10 to-transparent" />

            <div className="space-y-6">
              {history.map((item, i) => {
                const cfg = typeConfig[item.type] || typeConfig.generated;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-6 pl-2 group"
                  >
                    {/* Icon node on the line */}
                    <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-xl rounded-[1.5rem] px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:border-slate-300 hover:dark:border-white/10 hover:bg-slate-50 hover:dark:bg-white/5 shadow-sm dark:shadow-none">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.institution}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="text-[10px] font-black text-cyber-blue uppercase tracking-widest">Agent Task</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyber-blue transition-colors">
                          {item.label}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 flex-shrink-0 uppercase tracking-widest">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {item.time}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[2.5rem]">
             <ClockIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No activity found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
