'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Institution {
  id: number;
  name: string;
  industry: string;
  description: string | null;
  website_url: string | null;
  verificationStatus: string;
  verificationNote: string | null;
  createdAt: string;
  documents: string | null;
  brandGuides: any[];
  socialHandles: any[];
  products: any[];
}

export default function PendingInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingInstitutions();
  }, []);

  async function fetchPendingInstitutions() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pending-institutions');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch institutions');
      }
      
      setInstitutions(data.institutions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(institutionId: number, action: 'approve' | 'reject', note: string = '') {
    try {
      setProcessingId(institutionId);
      
      const res = await fetch('/api/admin/pending-institutions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          action,
          adminNote: note,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update institution');
      }
      
      // Remove the institution from the list
      setInstitutions(prev => prev.filter(inst => inst.id !== institutionId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchPendingInstitutions}
          className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Pending Institutions</h1>
          <p className="text-slate-400 mt-1">
            Review and manually approve institutions that failed AI validation
          </p>
        </div>
        <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-slate-400">Pending: </span>
          <span className="text-cyan-400 font-bold">{institutions.length}</span>
        </div>
      </div>

      {institutions.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Pending Institutions
          </h3>
          <p className="text-slate-400">
            All institutions have been reviewed. New submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {institutions.map((inst) => (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{inst.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      inst.verificationStatus === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {inst.verificationStatus === 'pending' ? 'Pending' : 'Rejected'}
                    </span>
                  </div>
                  
                  <p className="text-slate-400 text-sm mb-4">{inst.industry}</p>
                  
                  {inst.description && (
                    <p className="text-slate-300 mb-4">{inst.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {inst.website_url && (
                      <div>
                        <span className="text-slate-500 text-sm">Website:</span>
                        <a 
                          href={inst.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 ml-2 text-sm"
                        >
                          {inst.website_url}
                        </a>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-slate-500 text-sm">Products:</span>
                      <span className="text-white ml-2 text-sm">{inst.products.length}</span>
                    </div>
                    
                    <div>
                      <span className="text-slate-500 text-sm">Social Handles:</span>
                      <span className="text-white ml-2 text-sm">{inst.socialHandles.length}</span>
                    </div>
                    
                    <div>
                      <span className="text-slate-500 text-sm">Documents:</span>
                      <span className="text-white ml-2 text-sm">
                        {inst.documents ? 'Uploaded' : 'None'}
                      </span>
                    </div>
                  </div>
                  
                  {inst.verificationNote && (
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                      <span className="text-slate-500 text-sm">AI Note:</span>
                      <p className="text-slate-400 text-sm mt-1">{inst.verificationNote}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => {
                      const note = prompt('Optional approval note:');
                      if (note !== null) {
                        handleAction(inst.id, 'approve', note);
                      }
                    }}
                    disabled={processingId === inst.id}
                    className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    {processingId === inst.id ? 'Processing...' : '✓ Approve'}
                  </button>
                  
                  <button
                    onClick={() => {
                      const note = prompt('Rejection reason (required):');
                      if (note) {
                        handleAction(inst.id, 'reject', note);
                      }
                    }}
                    disabled={processingId === inst.id}
                    className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    ✕ Reject
                  </button>
                  
                  <Link
                    href={`/dashboard/institutions/${inst.id}`}
                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-center text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
