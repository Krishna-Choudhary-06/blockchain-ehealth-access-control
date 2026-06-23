import React from 'react'
import { ShieldAlert } from 'lucide-react'

export default function SecurityBanner() {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start animate-pulse">
      <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
          Restricted Access Portal
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          This system is restricted to authorized Administrators. All session creations, credential lookups, and authentication attempts are cryptographically anchored and audited on the Hyperledger Fabric blockchain ledger channel.
        </p>
      </div>
    </div>
  )
}
