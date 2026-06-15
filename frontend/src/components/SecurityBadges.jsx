import React from 'react'
import { Shield, Key, Cpu, UserCheck, Award } from 'lucide-react'

export default function SecurityBadges() {
  const badges = [
    { text: 'AES-256 Encrypted', icon: LockIcon },
    { text: 'RSA-OAEP Protected', icon: Key },
    { text: 'Hyperledger Verified', icon: Cpu },
    { text: 'ABAC Enabled', icon: UserCheck },
    { text: 'Fabric CA Connected', icon: Award }
  ]

  return (
    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
      {badges.map((badge, i) => {
        const Icon = badge.icon
        return (
          <div 
            key={i} 
            className="flex items-center gap-1.5 bg-slate-900/40 dark:bg-white/5 border border-slate-200/10 dark:border-white/5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 dark:text-slate-350 shadow-sm transition-all hover:bg-slate-900/60 dark:hover:bg-white/10"
          >
            <Icon className="w-3.5 h-3.5 text-purple-400" />
            <span>{badge.text}</span>
          </div>
        )
      })}
    </div>
  )
}

function LockIcon(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
