'use client';

import { motion } from 'framer-motion';
import { UserCircleIcon, CheckCircleIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

type FinanceSummary = {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingSettlements: number;
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  revenueGrowthPct: number;
};

export default function DashboardOverview() {
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [financeError, setFinanceError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setFinanceError(null);
      try {
        const res = await fetch('/api/agents/finance', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load finance summary');
        setFinance(json);
      } catch (e: any) {
        setFinanceError(e.message || 'Failed to load finance summary');
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome Back, Annor!</h1>
          <p className="text-sm text-slate-400">Owner/Admin roles</p>
        </div>
        <div className="flex items-center gap-4 text-cyber-blue font-semibold tracking-widest uppercase text-sm">
          OWNER COMMAND CENTER
          <UserCircleIcon className="w-10 h-10 text-slate-400" />
        </div>
      </header>

      {/* Top Metrics Row */}
      <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">FY&apos;26 Fiscal & Operational Health</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-md border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <p className="text-xs text-cyan-400 mb-2">Total System Revenue (GHS)</p>
          <h3 className="text-3xl font-bold text-white mb-2">
            {finance ? finance.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </h3>
          <p className={`text-xs flex items-center gap-1 ${finance?.revenueGrowthPct && finance.revenueGrowthPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {finance ? `${finance.revenueGrowthPct >= 0 ? '▲' : '▼'} ${Math.abs(finance.revenueGrowthPct).toFixed(1)}%` : financeError ? 'Failed to load' : 'Loading…'}
          </p>
        </div>

        {/* Agents Card */}
        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/80 backdrop-blur-md border border-purple-500/30 p-6 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <p className="text-xs text-slate-300 mb-2">Active AI Agents</p>
          <div className="flex items-center gap-4">
            {/* Mock Waveform */}
            <div className="flex gap-1 items-end h-8">
              {[1, 2, 3, 2, 4, 2, 1].map((h, i) => (
                <motion.div key={i} animate={{ height: h * 8 }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }} className="w-1 bg-purple-400 rounded-full" />
              ))}
            </div>
            <h3 className="text-3xl font-bold text-white">12 <span className="text-xl text-slate-500">/ 12</span></h3>
          </div>
          <p className="text-xs text-slate-400 mt-2">Fully Utilized</p>
        </div>

        {/* Pending Settlements */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-slate-900/80 backdrop-blur-md border border-yellow-500/30 p-6 rounded-2xl shadow-[0_0_15px_rgba(234,179,8,0.1)]">
          <p className="text-xs text-yellow-500 mb-2">Monthly Settlements (PENDING)</p>
          <h3 className="text-2xl font-bold text-white mb-2">
            GHS {finance ? finance.pendingSettlements.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </h3>
          <p className="text-xs text-yellow-600 bg-yellow-500/10 inline-block px-2 py-1 rounded">⏳ 2d 11h till EOFY notification</p>
        </div>

        {/* System Load */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400 mb-2 w-full text-left">System Load</p>
          <div className="relative w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent flex items-center justify-center animate-[spin_3s_linear_infinite]">
            <div className="absolute inset-0 flex items-center justify-center animate-[spin_3s_linear_infinite_reverse]">
              <span className="text-sm font-bold text-white">68%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Orchestration & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diagram Area */}
        <div className="lg:col-span-2 bg-white/5 border border-purple-500/30 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-6">Global Orchestration View <span className="text-slate-500 font-normal">(The Core AI logic)</span></h3>
          
          {/* Mock Node Diagram */}
          <div className="relative h-48 flex items-center justify-between px-8 bg-black/20 rounded-xl border border-white/5 overflow-hidden">
             {/* Simple visual representation of your image's nodes */}
             <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-12 h-12 rounded-full border-2 border-purple-500 flex items-center justify-center bg-slate-900"><UserCircleIcon className="w-6 h-6 text-purple-400"/></div>
                <span className="text-xs text-slate-300">Researcher</span>
             </div>
             <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-4 opacity-50 relative">
                <motion.div animate={{ left: ["0%", "100%"] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute w-2 h-2 bg-white rounded-full -top-0.5" />
             </div>
             <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-12 h-12 rounded-full border-2 border-blue-500 flex items-center justify-center bg-slate-900"><CheckCircleIcon className="w-6 h-6 text-blue-400"/></div>
                <span className="text-xs text-slate-300 text-center">Institution:<br/>Golden Pharmacy</span>
             </div>
          </div>
        </div>

        {/* Task Queue */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4">Task Queue & Agent Activity</h3>
          <div className="flex-1 space-y-3 overflow-y-auto font-mono text-xs">
            <p className="text-green-400 bg-green-400/5 p-2 rounded border border-green-400/10">[System] Marketer Agent generated 14 new ads for &apos;Golden Pharmacy&apos;.</p>
            <p className="text-cyan-400 bg-cyan-400/5 p-2 rounded border border-cyan-400/10">[AI] Analyzer Agent identified target audience: &apos;Chronic Care Patients&apos;.</p>
            <p className="text-purple-400 bg-purple-400/5 p-2 rounded border border-purple-400/10">[Sales] Site Redirects activated.</p>
          </div>
        </div>
      </div>

      {/* Bottom Table */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Payment Status & User Management</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 bg-black/20 uppercase">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Institution</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Alert</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            <tr className="hover:bg-white/5">
              <td className="px-6 py-4">Annor P.</td>
              <td className="px-6 py-4">Golden Pharmacy</td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">PAID</span></td>
              <td className="px-6 py-4">14 Apr</td>
              <td className="px-6 py-4 text-right text-cyan-400 hover:text-cyan-300 cursor-pointer">View Site</td>
            </tr>
            <tr className="hover:bg-white/5">
              <td className="px-6 py-4">Ama K.</td>
              <td className="px-6 py-4">Pharma-Link G.</td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs">UNPAID (GHS 1,250)</span></td>
              <td className="px-6 py-4">12 Apr</td>
              <td className="px-6 py-4 text-right text-red-400 hover:text-red-300 cursor-pointer flex justify-end items-center gap-1"><PlayIcon className="w-4 h-4"/> Send Alert (Sound)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}