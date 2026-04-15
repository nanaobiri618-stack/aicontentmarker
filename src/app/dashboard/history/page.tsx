'use client';

import { motion } from 'framer-motion';
import { ClockIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

const HISTORY = [
  { id: 1, type: 'approved', label: 'Golden Pharmacy — Flu Season Campaign', user: 'Annor P.', time: '14 Apr, 10:45' },
  { id: 2, type: 'generated', label: 'AI generated 14 new ad variants for Golden Pharmacy', user: 'Marketer Agent', time: '14 Apr, 09:30' },
  { id: 3, type: 'rejected', label: 'Pharma-Link G. — Weekend Flash Sale', user: 'Annor P.', time: '13 Apr, 17:12' },
  { id: 4, type: 'approved', label: 'Pharma-Link G — Chronic Care Awareness', user: 'Ama K.', time: '13 Apr, 14:05' },
  { id: 5, type: 'generated', label: 'AI identified target audience: Chronic Care Patients', user: 'Analyzer Agent', time: '13 Apr, 12:00' },
  { id: 6, type: 'approved', label: 'Golden Pharmacy — Wellness Wednesday', user: 'Annor P.', time: '12 Apr, 11:30' },
];

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  approved: { icon: CheckCircleIcon, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  rejected: { icon: XCircleIcon, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  generated: { icon: SparklesIcon, color: 'text-cyber-blue', bg: 'bg-cyan-500/10 border-cyan-500/20' },
};

export default function HistoryPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Activity History</h1>
        <p className="text-sm text-slate-400">Full log of content decisions and AI actions</p>
      </header>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />

        <div className="space-y-4">
          {HISTORY.map((item, i) => {
            const cfg = typeConfig[item.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-5 pl-2"
              >
                {/* Icon node on the line */}
                <div className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>

                {/* Card */}
                <div className="flex-1 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white leading-snug">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">by {item.user}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                    <ClockIcon className="w-3 h-3" />
                    {item.time}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
