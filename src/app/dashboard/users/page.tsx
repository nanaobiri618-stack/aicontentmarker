'use client';

import { motion } from 'framer-motion';
import { UsersIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  institution: { id: number; name: string } | null;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/users', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load users');
        setUsers(json.users ?? []);
      } catch (e: any) {
        setError(e.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const ownersAdmins = users.filter((u) => u.role === 'owner' || u.role === 'admin').length;
    const customers = users.filter((u) => u.role === 'user').length;
    return { total, ownersAdmins, customers };
  }, [users]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">User Management</h1>
          <p className="text-sm text-slate-400">Manage platform users and role assignments</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyber-blue/20 to-vivid-purple/20 hover:from-cyber-blue/30 hover:to-vivid-purple/30 text-white border border-white/10 rounded-xl text-sm font-medium transition-all">
          <PlusIcon className="w-4 h-4" /> Invite User
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: String(stats.total), color: 'border-cyan-500/30 text-cyan-400' },
          { label: 'Owners/Admins', value: String(stats.ownersAdmins), color: 'border-purple-500/30 text-purple-300' },
          { label: 'Customers', value: String(stats.customers), color: 'border-green-500/30 text-green-400' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white/5 backdrop-blur-md border ${stat.color.split(' ')[0]} rounded-2xl p-5`}>
            <p className={`text-xs mb-1 ${stat.color.split(' ')[1]}`}>{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <UsersIcon className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-white">All Users</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 bg-black/20 uppercase">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Institution</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {loading ? (
              <tr>
                <td className="px-6 py-4 text-slate-400" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : users.length ? (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{user.name ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">{user.institution?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-4 text-slate-400" colSpan={5}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
