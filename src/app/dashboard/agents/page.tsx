'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SparklesIcon, PlusIcon, TrashIcon, StarIcon, KeyIcon, ServerIcon } from '@heroicons/react/24/outline';

interface AIModel {
  id: number;
  provider: string;
  modelName: string;
  apiKey: string;
  isDefault: boolean;
  createdAt: string;
}

export default function AIAgentsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newModel, setNewModel] = useState({
    provider: 'gemini',
    modelName: 'gemini-1.5-flash',
    apiKey: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    try {
      const res = await fetch('/api/institutions/ai-models');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch AI models');
      setModels(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddModel(e: React.FormEvent) {
    e.preventDefault();
    if (!newModel.apiKey.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/institutions/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add AI model');

      setModels([...models, data.aiModel]);
      setNewModel({ provider: 'gemini', modelName: 'gemini-1.5-flash', apiKey: '', isDefault: false });
      setShowAddForm(false);
      setMessage({ type: 'success', text: 'AI model added successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id: number) {
    try {
      const res = await fetch(`/api/institutions/ai-models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set default model');

      setModels(models.map(m => ({ ...m, isDefault: m.id === id })));
      setMessage({ type: 'success', text: 'Default model updated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to remove this AI model?')) return;

    try {
      const res = await fetch(`/api/institutions/ai-models/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove AI model');

      setModels(models.filter(m => m.id !== id));
      setMessage({ type: 'success', text: 'AI model removed!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">AI Agents</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your AI models and API keys for content generation
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Model
          </button>
        </div>

        {/* How it works */}
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">How AI Agents Work</h3>
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">1.</span>
              <p className="text-slate-700 dark:text-slate-300">
                Add your AI provider API key (Gemini, OpenAI, etc.)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">2.</span>
              <p className="text-slate-700 dark:text-slate-300">
                Select the model name (e.g., <code className="text-slate-500 dark:text-slate-400">gemini-1.5-flash</code>, <code className="text-slate-500 dark:text-slate-400">gpt-4</code>)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">3.</span>
              <p className="text-slate-700 dark:text-slate-300">
                Set one model as default for your AI agents
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">4.</span>
              <p className="text-slate-700 dark:text-slate-300">
                Your agents will use your API key for content generation
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg p-4 text-sm ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30'
              : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        {/* Add Model Form */}
        {showAddForm && (
          <form onSubmit={handleAddModel} className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add New AI Model</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Provider</label>
                <select
                  value={newModel.provider}
                  onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="gemini">Gemini (Google)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model Name</label>
                <input
                  type="text"
                  value={newModel.modelName}
                  onChange={(e) => setNewModel({ ...newModel, modelName: e.target.value })}
                  placeholder="gemini-1.5-flash"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">API Key</label>
              <input
                type="password"
                value={newModel.apiKey}
                onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your API key is stored securely and never exposed to the client.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={newModel.isDefault}
                onChange={(e) => setNewModel({ ...newModel, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="isDefault" className="text-sm text-slate-700 dark:text-slate-300">
                Set as default model
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !newModel.apiKey.trim()}
                className="px-6 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Adding...' : 'Add Model'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Models List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your AI Models</h3>
          
          {models.length === 0 ? (
            <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
              <ServerIcon className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No AI models configured yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Add your first AI model to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {models.map((model) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-slate-100 dark:bg-slate-800/50 border rounded-xl p-4 ${
                    model.isDefault ? 'border-cyan-500 dark:border-cyan-500/50 bg-cyan-50 dark:bg-cyan-500/5' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{model.modelName}</h4>
                        {model.isDefault && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs rounded-full">
                            <StarIcon className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <SparklesIcon className="w-4 h-4" />
                          {model.provider}
                        </span>
                        <span className="flex items-center gap-1">
                          <KeyIcon className="w-4 h-4" />
                          •••{model.apiKey.slice(-4)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!model.isDefault && (
                        <button
                          onClick={() => handleSetDefault(model.id)}
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Set as default"
                        >
                          <StarIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(model.id)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Remove model"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* API Key Help */}
        <div className="bg-gradient-to-r from-purple-100 dark:from-purple-500/10 to-cyan-100 dark:to-cyan-500/10 border border-purple-300 dark:border-purple-500/30 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Where to get API Keys</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold">Gemini:</span>
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline"
              >
                Get API Key →
              </a>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold">OpenAI:</span>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline"
              >
                Get API Key →
              </a>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold">Anthropic:</span>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline"
              >
                Get API Key →
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
