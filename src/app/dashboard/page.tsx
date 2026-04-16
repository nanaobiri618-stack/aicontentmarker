'use client';

import { motion } from 'framer-motion';
import { UserCircleIcon, CheckCircleIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

type DashboardData = {
  user: {
    name: string;
    email: string;
    role: string;
  };
  institution?: {
    name: string | null;
    slug: string;
  };
  finance: {
    totalRevenue: number;
    monthlyRevenue: number;
    pendingSettlements: number;
    totalOrders: number;
    paidOrders: number;
    unpaidOrders: number;
    revenueGrowthPct: number;
  };
  activityLog: Array<{
    type: string;
    message: string;
    color: string;
  }>;
  paymentStatuses: Array<{
    id: number;
    name: string;
    email: string;
    institution: string | null;
    status: string;
    amount: number;
    lastAlert: string | null;
  }>;
  agentCount: number;
  systemLoad: number;
};

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingAlert, setSendingAlert] = useState<number | null>(null);
  const [alertResult, setAlertResult] = useState<{ id: number; success: boolean; message: string } | null>(null);

  async function sendAlert(userId: number, userName: string) {
    setSendingAlert(userId);
    setAlertResult(null);
    try {
      const res = await fetch('/api/payments/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to send alert');
      setAlertResult({ id: userId, success: true, message: `Alert sent to ${userName}` });
    } catch (e: any) {
      setAlertResult({ id: userId, success: false, message: e.message || 'Failed to send alert' });
    } finally {
      setSendingAlert(null);
    }
  }

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const res = await fetch('/api/dashboard/overview', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load dashboard data');
        setData(json);
      } catch (e: any) {
        setError(e.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-red-400 text-center">
          <p className="text-xl font-semibold mb-2">Failed to load dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white mb-1">Welcome Back, {data?.user?.name || 'User'}!</h1>
          <p className="text-xs sm:text-sm text-slate-400">{data?.user?.role === 'owner' ? 'Owner' : data?.user?.role === 'admin' ? 'Administrator' : 'User'} Dashboard</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-cyber-blue font-semibold tracking-widest uppercase text-xs sm:text-sm">
          {(data?.user?.role === 'owner' || data?.user?.role === 'admin') && (
            <a href="/dashboard/pending-institutions" className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors">
              Pending Review
            </a>
          )}
          <span className="hidden sm:inline">OWNER COMMAND CENTER</span>
          <span className="sm:hidden">COMMAND</span>
          <UserCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
        </div>
      </header>

      {/* Top Metrics Row */}
      <h2 className="text-xs sm:text-sm font-semibold text-slate-300 tracking-wide uppercase mb-3">FY&apos;26 Fiscal & Operational Health</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-md border border-cyan-500/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <p className="text-xs text-cyan-400 mb-2">Total System Revenue (GHS)</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {data?.finance ? data.finance.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </h3>
          <p className={`text-xs flex items-center gap-1 ${data?.finance?.revenueGrowthPct && data.finance.revenueGrowthPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data?.finance ? `${data.finance.revenueGrowthPct >= 0 ? '▲' : '▼'} ${Math.abs(data.finance.revenueGrowthPct).toFixed(1)}%` : 'Loading…'}
          </p>
        </div>

        {/* Agents Card */}
        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/80 backdrop-blur-md border border-purple-500/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <p className="text-xs text-slate-300 mb-2">Active AI Agents</p>
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mock Waveform */}
            <div className="flex gap-1 items-end h-6 sm:h-8">
              {[1, 2, 3, 2, 4, 2, 1].map((h, i) => (
                <motion.div key={i} animate={{ height: h * 6 }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }} className="w-0.5 sm:w-1 bg-purple-400 rounded-full" />
              ))}
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">{data?.agentCount || 0}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-2">{data?.agentCount === 0 ? 'No active tasks' : 'Processing tasks'}</p>
        </div>

        {/* Pending Settlements */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-slate-900/80 backdrop-blur-md border border-yellow-500/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_0_15px_rgba(234,179,8,0.1)]">
          <p className="text-xs text-yellow-500 mb-2">Monthly Settlements (PENDING)</p>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            GHS {data?.finance ? data.finance.pendingSettlements.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </h3>
          <p className="text-xs text-yellow-600 bg-yellow-500/10 inline-block px-2 py-1 rounded">
            {(data?.finance?.unpaidOrders ?? 0) > 0 
              ? `⏳ ${data!.finance.unpaidOrders} pending payment${data!.finance.unpaidOrders > 1 ? 's' : ''}` 
              : '✓ All settled'}
          </p>
        </div>

        {/* System Load */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-row sm:flex-col items-center sm:justify-center gap-4 sm:gap-0">
          <p className="text-xs text-slate-400 sm:mb-2 sm:w-full sm:text-left">Task Load</p>
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-indigo-500 border-t-transparent flex items-center justify-center animate-[spin_3s_linear_infinite]">
            <div className="absolute inset-0 flex items-center justify-center animate-[spin_3s_linear_infinite_reverse]">
              <span className="text-xs sm:text-sm font-bold text-white">{data?.systemLoad || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Orchestration & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Diagram Area */}
        <div className="lg:col-span-2 bg-white/5 border border-purple-500/30 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-white mb-4 sm:mb-6">Global Orchestration View <span className="text-slate-500 font-normal">(The Core AI logic)</span></h3>
          
          {/* Mock Node Diagram */}
          <div className="relative h-32 sm:h-48 flex items-center justify-between px-4 sm:px-8 bg-black/20 rounded-lg sm:rounded-xl border border-white/5 overflow-hidden">
             {/* Simple visual representation of your image's nodes */}
             <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-purple-500 flex items-center justify-center bg-slate-900"><UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400"/></div>
                <span className="text-xs text-slate-300">Researcher</span>
             </div>
             <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-2 sm:mx-4 opacity-50 relative">
                <motion.div animate={{ left: ["0%", "100%"] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute w-2 h-2 bg-white rounded-full -top-0.5" />
             </div>
             <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-500 flex items-center justify-center bg-slate-900"><CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400"/></div>
                <span className="text-xs text-slate-300 text-center">Institution:<br/>{data?.institution?.name || '—'}</span>
             </div>
          </div>
        </div>

        {/* Task Queue */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4">Task Queue & Agent Activity</h3>
          <div className="flex-1 space-y-3 overflow-y-auto font-mono text-xs max-h-48 sm:max-h-none">
            {data?.activityLog?.length ? (
              data.activityLog.map((activity, idx) => (
                <p key={idx} className={`text-${activity.color}-400 bg-${activity.color}-400/5 p-2 rounded border border-${activity.color}-400/10`}>
                  [{activity.type}] {activity.message}
                </p>
              ))
            ) : (
              <p className="text-slate-500 text-xs italic">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Table */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Payment Status & User Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[640px]">
            <thead className="text-xs text-slate-400 bg-black/20 uppercase">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4">Name</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">Institution</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">Status</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">Last Alert</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {data?.paymentStatuses?.length ? (
                data.paymentStatuses.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">{user.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">{user.institution || '-'}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`px-2 py-1 border rounded text-xs ${
                        user.status === 'PAID' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {user.status === 'PAID' ? 'PAID' : `UNPAID (GHS ${user.amount.toLocaleString()})`}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">{user.lastAlert || '-'}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      {user.status === 'PAID' ? (
                        <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer text-xs sm:text-sm">View Site</span>
                      ) : sendingAlert === user.id ? (
                        <span className="text-yellow-400 flex justify-end items-center gap-1 text-xs sm:text-sm">
                          <svg className="animate-spin w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          Sending…
                        </span>
                      ) : alertResult?.id === user.id && alertResult.success ? (
                        <span className="text-green-400 flex justify-end items-center gap-1 text-xs sm:text-sm">✓ Sent</span>
                      ) : (
                        <button
                          onClick={() => sendAlert(user.id, user.name)}
                          className="text-red-400 hover:text-red-300 cursor-pointer flex justify-end items-center gap-1 text-xs sm:text-sm"
                        >
                          <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4"/> Send Alert
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-slate-500">
                    No users found. Add users to your institution to see them here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}