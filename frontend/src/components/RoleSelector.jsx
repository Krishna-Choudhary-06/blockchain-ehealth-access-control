import React from 'react'
import { motion } from 'framer-motion'
import { Stethoscope, Activity, Heart, Coins, Shield } from 'lucide-react'

const roles = [
  {
    id: 'Doctor',
    title: 'Doctor',
    description: 'Provide clinical treatments, view assigned patient records, and update medical histories.',
    icon: Stethoscope,
    color: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'group-hover:border-emerald-500/50 selected:border-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    accentColor: 'text-emerald-500 bg-emerald-500/10'
  },
  {
    id: 'Nurse',
    title: 'Nurse',
    description: 'Monitor vitals, record observations, check patient charts, and manage care delivery.',
    icon: Activity,
    color: 'from-pink-500/20 to-rose-500/20',
    borderColor: 'group-hover:border-rose-500/50 selected:border-rose-500',
    glowColor: 'rgba(244, 63, 94, 0.15)',
    accentColor: 'text-rose-500 bg-rose-500/10'
  },
  {
    id: 'Patient',
    title: 'Patient',
    description: 'Own medical history, view personal health records, and control cryptographic access rights.',
    icon: Heart,
    color: 'from-sky-500/20 to-blue-500/20',
    borderColor: 'group-hover:border-blue-500/50 selected:border-blue-500',
    glowColor: 'rgba(14, 165, 233, 0.15)',
    accentColor: 'text-blue-500 bg-blue-500/10'
  },
  {
    id: 'Staff',
    title: 'Staff',
    description: 'Manage administrative tasks, assist clinic operations, and view general records.',
    icon: Shield,
    color: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'group-hover:border-yellow-500/50 selected:border-yellow-500',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    accentColor: 'text-yellow-500 bg-yellow-500/10'
  }
]
export default function RoleSelector({ selectedRole, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {roles.map((role) => {
        const Icon = role.icon
        const isSelected = selectedRole === role.id

        return (
          <motion.div
            key={role.id}
            onClick={() => onChange(role.id)}
            whileHover={{ scale: 1.025, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative rounded-2xl p-5 cursor-pointer border backdrop-blur-xl transition-all duration-300 ${
              isSelected
                ? 'bg-slate-900/10 dark:bg-slate-100/5 border-purple-500 shadow-lg'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 hover:shadow-md'
            }`}
            style={{
              boxShadow: isSelected ? `0 0 25px ${role.glowColor}` : 'none'
            }}
          >
            {/* Background Gradient Accent on select/hover */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${role.color}`} />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${role.accentColor} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {/* Select Indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-500 text-white' 
                      : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-scale-up" />
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {role.title}
                </h3>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {role.description}
                </p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
