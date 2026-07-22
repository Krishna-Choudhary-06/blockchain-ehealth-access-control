import React, { useState, useEffect } from 'react'
import { Activity, Shield, Server, Loader2 } from 'lucide-react'
import { getPerformanceStats } from '../services/apiService'

export default function Performance() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getPerformanceStats()
        if (isMounted) {
          setStats(data)
          setError(false)
        }
      } catch (err) {
        console.error('Performance stats API not available:', err)
        if (isMounted) {
          setError(true)
          setStats(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchStats()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading benchmark stats...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="relative min-h-[calc(100vh-8rem)] px-2 md:px-4 py-2 flex items-center justify-center font-sans">
        <div className="text-center max-w-sm mx-auto space-y-4 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-455 flex items-center justify-center mx-auto animate-pulse">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-955 dark:text-white">
            Performance Benchmarks
          </h3>
          <p className="text-sm text-slate-505 dark:text-slate-405 font-bold">
            No benchmark data available
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] px-2 md:px-4 py-2 font-sans">
      {/* Background glow graphics */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-purple-500/10 dark:bg-purple-650/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-650/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <Activity className="text-purple-650 dark:text-purple-400 w-8 h-8" />
              Performance Experiments
            </h1>
            <p className="text-slate-505 dark:text-slate-405 mt-2 text-sm max-w-2xl">
              Live ledger engine benchmarks verified from Hyperledger Fabric channel peers.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 px-3.5 py-2 rounded-xl text-purple-650 dark:text-purple-400 shadow-sm">
            <Shield className="w-3.5 h-3.5" />
            <span>FABRIC BENCHMARK SUITE</span>
          </div>
        </div>

        {/* Real stats display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-2xl shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Real-time Latency</span>
            <h4 className="text-3xl font-extrabold text-purple-650 dark:text-purple-400">{stats.latency ?? 'N/A'} ms</h4>
          </div>
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-2xl shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Throughput (TPS)</span>
            <h4 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stats.tps ?? 'N/A'} TPS</h4>
          </div>
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-2xl shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Block Commit Time</span>
            <h4 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.blockCommitTime ?? 'N/A'} ms</h4>
          </div>
        </div>
      </div>
    </div>
  )
}
