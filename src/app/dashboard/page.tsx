'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { UserCircleIcon, CheckCircleIcon, PlayIcon, TruckIcon, ChatBubbleLeftRightIcon, ArrowDownRightIcon, MapPinIcon } from '@heroicons/react/24/outline';
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
    orderId?: number;
    name: string;
    email: string;
    institution: string | null;
    status: string;
    deliveryStatus: string;
    deliveryInfo?: {
      phone: string;
      address: string;
      lat: number | null;
      lng: number | null;
    } | null;
    amount: number;
    lastAlert: string | null;
  }>;
  complaints: Array<{
    id: number;
    userName: string;
    institutionName: string;
    subject: string;
    message: string;
    status: string;
    forwarded: boolean;
    createdAt: string;
  }>;
  agentCount: number;
  systemLoad: number;
  unverifiedInstitutions?: Array<{
    id: number;
    name: string;
    slug: string;
    industry: string;
    verificationStatus: string;
  }>;
  ownedInstitutions?: Array<{
    id: number;
    name: string;
    slug: string;
    industry: string;
    verificationStatus: string;
    createdAt: string;
  }>;
};

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [viewingMap, setViewingMap] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
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

  async function handleAction(payload: any) {
    setBusyAction(`${payload.type}-${payload.id}`);
    try {
      const res = await fetch('/api/dashboard/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Action failed');
      await load(); // Refresh data
    } catch (e) {
      alert('Failed to perform action');
    } finally {
      setBusyAction(null);
    }
  }

  async function sendAlert(userId: number, userName: string) {
    if (!confirm(`Send payment reminder email to ${userName}?`)) return;
    
    setBusyAction(`alert-${userId}`);
    try {
      const res = await fetch('/api/payments/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send alert');
      alert('Payment reminder email sent successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to send alert');
    } finally {
      setBusyAction(null);
    }
  }

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

  const isGodAdmin = data?.user?.email === 'admingod123@gmail.com';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 tracking-tight">System Command</h1>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {data?.user?.role === 'owner' ? `Business Owner: ${data.institution?.name}` : 'Main Platform Administrator'}
          </p>
        </div>
        <div className="flex items-center gap-4">
           {isGodAdmin && (
             <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest">
               God Mode Active
             </div>
           )}
           <UserCircleIcon className="w-12 h-12 text-slate-700" />
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: `GHS ${(data?.finance?.totalRevenue || 0).toLocaleString()}`, color: 'cyan', icon: ArrowDownRightIcon },
          { label: 'Active Agents', value: data?.agentCount || 0, color: 'purple', icon: PlayIcon },
          { label: 'Pending Payout', value: `GHS ${(data?.finance?.pendingSettlements || 0).toLocaleString()}`, color: 'yellow', icon: ArrowDownRightIcon },
          { label: 'System Load', value: `${data?.systemLoad || 0}%`, color: 'blue', icon: CheckCircleIcon },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] backdrop-blur relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
              <stat.icon className={`w-20 h-20 text-${stat.color}-400`} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className="text-2xl font-black text-white">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Complaints Section */}
          <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-pink-500" />
                  Customer Support Inquiry Flow
                </h2>
                <p className="text-xs text-slate-500 mt-1">Real-time complaints and issue tracking</p>
              </div>
            </div>

            <div className="space-y-4">
              {data?.complaints.length ? data.complaints.map((c) => (
                <div key={c.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-pink-500/20 transition-all flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-pink-500/10 text-pink-500 border border-pink-500/20">
                         {c.status}
                       </span>
                       <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-200">{c.subject}</h4>
                    <p className="text-sm text-slate-400 mt-2 italic">&quot;{c.message}&quot;</p>
                    <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                       <span>FROM: {c.userName}</span>
                       <span>AT: {c.institutionName}</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 justify-end">
                    {isGodAdmin && !c.forwarded && (
                      <button
                        onClick={() => handleAction({ type: 'complaint', id: c.id, forwarded: true, status: 'forwarded' })}
                        className="px-4 py-2 rounded-xl bg-pink-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
                        disabled={busyAction === `complaint-${c.id}`}
                      >
                        Forward to Owner
                      </button>
                    )}
                    <button
                      onClick={() => handleAction({ type: 'complaint', id: c.id, status: 'resolved' })}
                      className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold hover:bg-green-500/20 transition-all"
                      disabled={busyAction === `complaint-${c.id}`}
                    >
                      Resolve Issue
                    </button>
                  </div>
                </div>
              )) : (
                <p className="text-center py-10 text-slate-600 italic">No pending complaints. Your customers are happy!</p>
              )}
            </div>
          </section>

          {/* God Admin: Institutional Verification Oversight */}
          {isGodAdmin && data?.unverifiedInstitutions && data.unverifiedInstitutions.length > 0 && (
            <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    Institutional Verification Oversight
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">Manual onboarding overrides</p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black animate-pulse">
                  ACTION REQUIRED
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                      <th className="px-8 py-4">Institution</th>
                      <th className="px-8 py-4">Industry</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Verification Logic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.unverifiedInstitutions.map((inst: any) => (
                      <tr key={inst.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="font-bold text-white group-hover:text-cyber-blue transition-colors">{inst.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inst.slug}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs text-slate-400 capitalize">{inst.industry}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            inst.verificationStatus === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
                          }`}>
                            {inst.verificationStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right space-x-4">
                          <button
                            onClick={() => handleAction({ type: 'verify_institution', id: inst.id, status: 'verified' })}
                            disabled={busyAction === `verify_institution-${inst.id}`}
                            className="text-[10px] font-black text-cyber-blue hover:text-white transition-colors uppercase tracking-widest disabled:opacity-50"
                          >
                            {busyAction === `verify_institution-${inst.id}` ? 'Approving...' : 'Verify Manually'}
                          </button>
                          <button
                            onClick={() => handleAction({ type: 'verify_institution', id: inst.id, status: 'rejected' })}
                            className="text-[10px] font-black text-red-400 hover:text-white transition-colors uppercase tracking-widest"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Owner: My Institutions Management */}
          {data?.user?.role === 'owner' && data.ownedInstitutions && data.ownedInstitutions.length > 0 && (
            <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <UserCircleIcon className="w-6 h-6 text-cyber-blue" />
                    Your Business Institutions
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">Manage your registered businesses</p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-[10px] font-black">
                  {data.ownedInstitutions.length} OWNED
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                      <th className="px-8 py-4">Business Name</th>
                      <th className="px-8 py-4">Industry</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Execution Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.ownedInstitutions.map((inst) => (
                      <tr key={inst.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="font-bold text-white group-hover:text-cyber-blue transition-colors">{inst.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inst.slug}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs text-slate-400 capitalize">{inst.industry}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            inst.verificationStatus === 'verified' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                          }`}>
                            {inst.verificationStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right space-x-4">
                          <a
                            href={inst.slug ? `/store/${inst.slug}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-black text-cyber-blue hover:text-white transition-colors uppercase tracking-widest"
                          >
                            View Store
                          </a>
                          <button
                            onClick={() => alert('Switching active institution context... (logic to be implemented)')}
                            className="text-[10px] font-black text-vivid-purple hover:text-white transition-colors uppercase tracking-widest"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Delivery & Orders Table */}
          <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <TruckIcon className="w-6 h-6 text-cyber-blue" />
                Delivery Logistics & Fulfillment
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <th className="px-8 py-4">Customer</th>
                    <th className="px-8 py-4">Fulfillment</th>
                    <th className="px-8 py-4">Delivery Details</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.paymentStatuses.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            u.status === 'PAID' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {u.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            u.deliveryStatus === 'delivered' ? 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>
                            {u.deliveryStatus.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 max-w-xs">
                        {u.deliveryInfo ? (
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" /> {u.deliveryInfo.address}
                            </div>
                            <div className="text-[10px] text-slate-500">{u.deliveryInfo.phone}</div>
                            {u.deliveryInfo.lat && (
                              <button 
                                onClick={() => setViewingMap(u.deliveryInfo)}
                                className="text-[10px] text-cyber-blue font-bold hover:underline"
                              >
                                View Location Map
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">No delivery info</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {u.status === 'PAID' && u.deliveryStatus !== 'delivered' && (
                          <button
                            onClick={() => handleAction({ type: 'delivery', id: u.orderId, status: 'delivered' })}
                            className="text-xs font-black text-cyber-blue hover:text-white transition-colors"
                            disabled={busyAction === `delivery-${u.orderId}`}
                          >
                            {busyAction === `delivery-${u.orderId}` ? 'Updating...' : 'Mark Delivered'}
                          </button>
                        )}
                        {u.status !== 'PAID' && (
                          <button
                            onClick={() => sendAlert(u.id, u.name)}
                            disabled={busyAction === `alert-${u.id}`}
                            className="text-xs font-black text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            {busyAction === `alert-${u.id}` ? 'Sending...' : 'Send Alert'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           <section className="bg-gradient-to-br from-indigo-900/20 to-slate-900/50 border border-indigo-500/20 rounded-[2.5rem] p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Real-time Activity</h3>
              <div className="space-y-6">
                 {data?.activityLog.map((log, i) => (
                   <div key={i} className="flex gap-4">
                      <div className={`w-2 h-2 mt-1.5 rounded-full bg-${log.color}-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]`} />
                      <div>
                        <p className="text-xs font-bold text-slate-200">{log.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase">{log.type}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Delivery Coverage</h3>
              <div className="aspect-square rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://api.placeholder.com/400/400')] opacity-20 grayscale" />
                 <div className="text-center z-10 px-6">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Live Heatmap</p>
                   <p className="text-xs text-slate-400 italic">Visualizing delivery clusters in your region.</p>
                 </div>
              </div>
           </section>
        </div>
      </div>

      {/* Map Modal */}
      <AnimatePresence>
        {viewingMap && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setViewingMap(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl aspect-video bg-slate-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="absolute top-6 right-6 z-10">
                <button onClick={() => setViewingMap(null)} className="p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-bg">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <iframe
                title="Google Maps Location"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_YOUR_KEY&q=${viewingMap.lat},${viewingMap.lng}&zoom=15`}
                allowFullScreen
              />
              <div className="absolute bottom-10 left-10 right-10 p-8 rounded-3xl bg-black/60 backdrop-blur border border-white/10">
                 <h4 className="text-white font-bold mb-1">Precise Delivery Location</h4>
                 <p className="text-slate-400 text-sm">{viewingMap.address}</p>
                 <div className="mt-2 text-[10px] text-slate-500 font-mono">LAT: {viewingMap.lat} / LNG: {viewingMap.lng}</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}