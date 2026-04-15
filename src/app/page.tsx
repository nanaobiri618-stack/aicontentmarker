'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon, CogIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const [isThinking, setIsThinking] = useState(false)

  const handleGenerate = () => {
    setIsThinking(true)
    // Simulate AI thinking
    setTimeout(() => setIsThinking(false), 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyber-blue to-vivid-purple bg-clip-text text-transparent mb-4">
            <SparklesIcon className="w-8 h-8" />
            <h1 className="text-4xl font-bold">AI Content Orchestrator</h1>
          </div>
          <p className="text-xl text-slate-300 mb-8">
            Professional marketing automation for the future
          </p>
        </motion.div>

        {/* Main Dashboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-lg bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6 text-cyber-blue">Quick Start</h2>
              <button
                onClick={handleGenerate}
                disabled={isThinking}
                className="w-full bg-gradient-to-r from-cyber-blue to-vivid-purple hover:from-cyber-blue/80 hover:to-vivid-purple/80 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
              >
                {isThinking ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <CogIcon className="w-6 h-6" />
                    </motion.div>
                    <span>AI is thinking...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-6 h-6" />
                    <span>Generate Content</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Panel */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6 text-vivid-purple">System Status</h2>
              <div className="backdrop-blur-sm bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Database</span>
                  <span className="text-green-400">● Connected</span>
                </div>
              </div>
              <div className="backdrop-blur-sm bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">AI Engine</span>
                  <span className="text-green-400">● Ready</span>
                </div>
              </div>
              <div className="backdrop-blur-sm bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Observer</span>
                  <span className="text-yellow-400">● Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 backdrop-blur-lg bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-cyber-blue">Recent Tasks</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="backdrop-blur-sm bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Content generation task #{i}</span>
                  <span className="text-green-400 text-sm">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}