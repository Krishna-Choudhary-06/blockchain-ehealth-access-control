import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, Shield } from 'lucide-react'

export default function AuthenticationAnimations({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { label: 'Verifying Username' },
    { label: 'Validating Credentials' },
    { label: 'Creating Session' },
    { label: 'Redirecting to Admin Dashboard' }
  ]

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      const finishTimer = setTimeout(() => {
        onComplete()
      }, 800)
      return () => clearTimeout(finishTimer)
    }
  }, [currentStep, onComplete, steps.length])

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 min-h-[350px]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 rounded-3xl p-8 backdrop-blur-xl shadow-xl flex flex-col items-center text-center space-y-6"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Shield className="w-8 h-8 animate-pulse" />
          </div>
          {currentStep < steps.length && (
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 border-t-purple-600 animate-spin" />
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Secure Authentication
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Establishing cryptographic session channel...
          </p>
        </div>

        <div className="w-full space-y-3.5 text-left bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-900 rounded-2xl p-5">
          {steps.map((step, index) => {
            const isCompleted = currentStep > index
            const isActive = currentStep === index

            return (
              <div
                key={index}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  isCompleted || isActive ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="text-emerald-500"
                  >
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500/10" />
                  </motion.div>
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-800" />
                )}
                <span
                  className={`text-xs font-bold transition-colors duration-300 ${
                    isActive
                      ? 'text-purple-600 dark:text-purple-400 font-semibold'
                      : isCompleted
                      ? 'text-slate-700 dark:text-slate-300 font-medium'
                      : 'text-slate-400 dark:text-slate-650'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
