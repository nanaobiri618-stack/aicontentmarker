'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { CogIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Institution {
  id: number;
  name: string;
  industry: string;
  website_url?: string;
  subscription_tier: string;
}

interface BrandGuide {
  id: number;
  toneVoice: string;
  targetAudience: string;
  restrictedKeywords: string;
  colorPalette?: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [brandGuide, setBrandGuide] = useState<BrandGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // TODO: Fetch from API based on user session
      // For now, mock data
      setInstitution({
        id: 1,
        name: 'Sample Institution',
        industry: 'Technology',
        website_url: 'https://example.com',
        subscription_tier: 'pro',
      });
      setBrandGuide({
        id: 1,
        toneVoice: 'Professional',
        targetAudience: 'Tech Professionals',
        restrictedKeywords: '["cheap", "worst"]',
        colorPalette: '#00D4FF,#B026FF',
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <CogIcon className="w-12 h-12 text-cyber-blue" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-1">Institution Settings</h1>
          <p className="text-sm text-slate-400">Configure your brand and content preferences</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Institution Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6"
          >
            <h2 className="text-xl font-semibold mb-6 text-vivid-purple">Institution Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={institution?.name || ''}
                  onChange={(e) => setInstitution(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyber-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={institution?.industry || ''}
                  onChange={(e) => setInstitution(prev => prev ? { ...prev, industry: e.target.value } : null)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyber-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={institution?.website_url || ''}
                  onChange={(e) => setInstitution(prev => prev ? { ...prev, website_url: e.target.value } : null)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyber-blue focus:outline-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Brand Guide */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6"
          >
            <h2 className="text-xl font-semibold mb-6 text-vivid-purple">Brand Guide</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tone of Voice
                </label>
                <select
                  value={brandGuide?.toneVoice || ''}
                  onChange={(e) => setBrandGuide(prev => prev ? { ...prev, toneVoice: e.target.value } : null)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyber-blue focus:outline-none"
                >
                  <option value="Professional">Professional</option>
                  <option value="Casual">Casual</option>
                  <option value="Academic">Academic</option>
                  <option value="Gen-Z">Gen-Z</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={brandGuide?.targetAudience || ''}
                  onChange={(e) => setBrandGuide(prev => prev ? { ...prev, targetAudience: e.target.value } : null)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyber-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Restricted Keywords (comma-separated)
                </label>
                <textarea
                  value={brandGuide?.restrictedKeywords || ''}
                  onChange={(e) => setBrandGuide(prev => prev ? { ...prev, restrictedKeywords: e.target.value } : null)}
                  placeholder="cheap,worst,terrible"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyber-blue focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-cyber-blue to-vivid-purple hover:from-cyber-blue/80 hover:to-vivid-purple/80 disabled:opacity-50 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 mx-auto"
          >
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <CogIcon className="w-6 h-6" />
                </motion.div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-6 h-6" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </motion.div>
    </div>
  );
}
