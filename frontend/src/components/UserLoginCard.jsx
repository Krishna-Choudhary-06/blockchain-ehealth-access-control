import React from 'react'
import { motion } from 'framer-motion'
import { Users, Activity, ShieldCheck } from 'lucide-react'

export default function UserLoginCard({ onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.025, translateY: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group relative rounded-3xl p-8 cursor-pointer border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-purple-500/5 text-center md:text-left flex flex-col justify-between min-h-[300px]"
    >
      {/* Background Gradient Accent */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-purple-500 to-indigo-500" />
      
      <div className="relative z-10 space-y-6">
        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-650 dark:text-purple-400 text-purple-600 transition-transform group-hover:scale-110 duration-300">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-450 bg-slate-100 dark:bg-slate-850 px-2.5 py-1 rounded-full text-slate-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" /> Healthcare Node
          </div>
        </div>

        {/* Text details */}
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Sign In as User
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Authorized healthcare professionals (Doctors, Nurses, Staff) and Patients. Access records, manage consents, and review access histories.
          </p>
        </div>
      </div>

      {/* Footer status */}
      <div className="relative z-10 flex items-center justify-between border-t border-slate-100 dark:border-slate-850/80 pt-4 mt-6">
        <span className="text-[10px] text-slate-450 font-bold text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Identity Authentication Enabled
        </span>
        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1.5 transition-transform">
          Access Portal &rarr;
        </span>
      </div>
    </motion.div>
  )
}
