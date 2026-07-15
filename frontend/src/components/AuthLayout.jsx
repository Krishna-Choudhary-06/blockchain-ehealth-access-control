import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, ShieldCheck, Database, Award, Users } from 'lucide-react'
import SecurityBadges from './SecurityBadges'

export default function AuthLayout({ children }) {
  const [stats, setStats] = useState({
    identities: 0,
    activeNodes: 7,
    status: 'ONLINE',
    tps: 0
  })

  // Read registered users count
  useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
      setStats(prev => ({
        ...prev,
        identities: users.length
      }))
    } catch (e) {
      console.error(e)
    }
    const refreshStats = () => {
      try {
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
        setStats(prev => ({
          ...prev,
          identities: users.length
        }))
      } catch (e) {
        console.error(e)
      }
    }

    window.addEventListener('demo:users-updated', refreshStats)
    window.addEventListener('storage', refreshStats)

    return () => {
      window.removeEventListener('demo:users-updated', refreshStats)
      window.removeEventListener('storage', refreshStats)
    }
  }, [])

  return (
    <div className="min-h-[calc(100vh-140px)] w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20 backdrop-blur-xl shadow-2xl transition-colors duration-300">
      
      {/* Left Column: Blockchain Network Visualization (Desktop only) */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 flex-col justify-between overflow-hidden border-r border-slate-200 dark:border-slate-850">
        
        {/* Animated Background Particles */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        {/* Glowing Orbs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Section: Branding & Status */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-white font-extrabold tracking-wider text-sm uppercase">
            <span className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
              <Database className="w-5 h-5" />
            </span>
            <span>eHealth Access Network</span>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-md space-y-3 max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Fabric Channel Status</span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                CONNECTED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Total Identities</span>
                <span className="text-white font-bold text-base">{stats.identities} Enrolled</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Consensus Nodes</span>
                <span className="text-white font-bold text-base">{stats.activeNodes} Active</span>
              </div>
              <div className="col-span-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                <span>Simulation Latency: <strong className="text-slate-350 font-mono">1.2ms</strong></span>
                <span>TX rate: <strong className="text-slate-350 font-mono">{stats.tps} tps</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Node Network Animation */}
        <div className="relative z-10 flex-grow flex items-center justify-center py-6 min-h-[220px]">
          <div className="relative w-48 h-48 flex items-center justify-center">
            
            {/* Center Core Node */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute w-36 h-36 border border-purple-500/20 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute w-44 h-44 border border-indigo-500/10 border-dashed rounded-full"
            />

            {/* Core Node */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/20 z-10 border border-purple-400/30 relative">
              <ShieldCheck className="w-8 h-8" />
              <div className="absolute inset-0 bg-white rounded-2xl opacity-10 animate-ping" />
            </div>

            {/* Connecting Nodes */}
            <NetworkNode icon={Users} label="Patient Registry" className="-top-4 -left-4 bg-sky-500/20 border-sky-500/30 text-sky-400" />
            <NetworkNode icon={Activity} label="Doctor MSP" className="-top-4 -right-4 bg-emerald-500/20 border-emerald-500/30 text-emerald-400" />
            <NetworkNode icon={Award} label="Consensus Hub" className="-bottom-4 -left-4 bg-amber-500/20 border-amber-500/30 text-amber-400" />
            <NetworkNode icon={Database} label="Fabric CA" className="-bottom-4 -right-4 bg-indigo-500/20 border-indigo-500/30 text-indigo-400" />
          </div>
        </div>

        {/* Bottom Section: Security badges info */}
        <div className="relative z-10 space-y-3.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block border-b border-white/5 pb-2">
            On-Chain Protection Layers
          </span>
          <SecurityBadges />
        </div>
      </div>

      {/* Right Column: Authentication Panels */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center p-6 md:p-10 bg-slate-50/20 dark:bg-slate-900/10 min-h-[500px]">
        <div className="max-w-xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

function NetworkNode({ icon: Icon, className, label }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.15 }}
      className={`absolute w-10 h-10 rounded-xl flex items-center justify-center border shadow-md ${className} cursor-pointer group`}
    >
      <Icon className="w-5 h-5 transition-transform group-hover:rotate-12 duration-300" />
      <span className="absolute bottom-11 bg-slate-950 border border-slate-800 text-slate-300 text-[8px] font-bold py-0.5 px-1.5 rounded uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {label}
      </span>
    </motion.div>
  )
}
