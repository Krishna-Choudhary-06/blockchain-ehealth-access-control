import React from 'react'
import { motion } from 'framer-motion'
import { Shield, ShieldAlert, ShieldCheck, Lock, Activity } from 'lucide-react'
import UserLoginCard from './UserLoginCard'

export default function AuthSelection({ onSelectUser, onSelectAdmin }) {
  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Title Header */}
      <div className="text-center space-y-3.5">
        <span className="flex items-center gap-1 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase w-fit mx-auto">
          <Shield className="w-3.5 h-3.5" /> Security Gateway Select
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight max-w-xl mx-auto">
          Access Blockchain Healthcare Network
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
          Select your network gateway node below to authorize credentials on the Hyperledger Fabric channel.
        </p>
      </div>

      {/* Two Large Animated Selection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* User Card */}
        <UserLoginCard onClick={onSelectUser} />

        {/* Admin Card */}
        <motion.div
          onClick={onSelectAdmin}
          whileHover={{ scale: 1.025, translateY: -4 }}
          whileTap={{ scale: 0.98 }}
          className="group relative rounded-3xl p-8 cursor-pointer border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300 shadow-lg hover:shadow-indigo-500/5 text-center md:text-left flex flex-col justify-between min-h-[300px]"
        >
          {/* Background Gradient Accent */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-indigo-500 to-violet-500" />
          
          <div className="relative z-10 space-y-6">
            {/* Header Icon */}
            <div className="flex items-center justify-between">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-indigo-600 transition-transform group-hover:scale-110 duration-300">
                <Shield className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-red-550 bg-red-500/10 px-2.5 py-1 rounded-full text-red-600 dark:text-red-400">
                <Lock className="w-3 h-3 animate-pulse" /> Restricted Access
              </div>
            </div>

            {/* Text details */}
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Sign In as Admin
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                System Administrators only. Configure network consensus nodes, audit cryptographic access trails, and manage core ABAC security policies.
              </p>
            </div>
          </div>

          {/* Footer status */}
          <div className="relative z-10 flex items-center justify-between border-t border-slate-100 dark:border-slate-850/80 pt-4 mt-6">
            <span className="text-[10px] text-slate-450 font-bold text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-500" /> Admin Clearances Logged
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1.5 transition-transform">
              Admin Access Portal &rarr;
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
