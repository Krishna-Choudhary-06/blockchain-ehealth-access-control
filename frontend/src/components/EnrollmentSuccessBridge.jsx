import React from 'react'
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'

export default function EnrollmentSuccessBridge({ enrolledData }) {
  if (!enrolledData) return null

  const { name, identityId, role } = enrolledData

  return (
    <div className="bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-4.5 mb-6 text-slate-800 dark:text-slate-100 flex items-start gap-3.5 animate-fade-in-up">
      <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex-shrink-0">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Enrollment Successful
          </h4>
          <span className="flex items-center gap-0.5 bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">
            <Sparkles className="w-2.5 h-2.5" /> Ready for Login
          </span>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Your credential profile has been loaded. Authenticate with your password to access the workspace.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
          <div>
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block">Identified User</span>
            <span className="text-slate-800 dark:text-slate-200 line-clamp-1">{name}</span>
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block">Certificate ID</span>
            <span className="font-mono text-slate-850 dark:text-slate-200">{identityId}</span>
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block">System Role</span>
            <span className="text-purple-600 dark:text-purple-400">{role}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
