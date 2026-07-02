import React from 'react'
import { User, FileText, Briefcase, Shield, Cpu } from 'lucide-react'

export default function StepProgress({ currentStep }) {
  const steps = [
    { id: 1, label: 'Role', icon: User },
    { id: 2, label: 'Personal', icon: FileText },
    { id: 3, label: 'Review', icon: Shield },
    { id: 4, label: 'Enroll', icon: Cpu }
  ]

  return (
    <div className="w-full mb-10">
      {/* Progress Track */}
      <div className="relative flex justify-between items-center max-w-xl mx-auto px-4">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 -z-10 rounded-full" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 -translate-y-1/2 -z-10 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const IconComponent = step.icon
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Step Circle */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : isActive
                    ? 'bg-white dark:bg-slate-900 border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/10 scale-110 ring-4 ring-purple-500/10'
                    : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              
              {/* Step Label */}
              <span
                className={`absolute -bottom-7 text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
                  isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : isCompleted
                    ? 'text-slate-800 dark:text-slate-200 font-semibold'
                    : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
