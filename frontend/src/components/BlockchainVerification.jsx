import React, { useEffect, useState } from 'react'
import { Check, Loader2, Database, ShieldCheck } from 'lucide-react'

const verificationSteps = [
  { id: 1, label: 'Identity Registry Lookup', statusMsg: 'Locating credential mapping...' },
  { id: 2, label: 'Certificate Validity Checked', statusMsg: 'Resolving X.509 certificate status...' },
  { id: 3, label: 'Role ABAC Authorization', statusMsg: 'Checking access policy parameters...' },
  { id: 4, label: 'Consensus Policy Verified', statusMsg: 'Verifying channel signature threshold...' },
  { id: 5, label: 'Cryptographic Signature Checked', statusMsg: 'Validating RSA credentials...' },
  { id: 6, label: 'Session Token Registered', statusMsg: 'Issuing credential ticket...' }
]

export default function BlockchainVerification({ onComplete }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (activeStep < verificationSteps.length) {
      const timer = setTimeout(() => {
        setActiveStep(prev => prev + 1)
      }, 700)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        onComplete()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [activeStep, onComplete])

  return (
    <div className="space-y-6 py-4 animate-fade-in-up">
      <div className="text-center max-w-sm mx-auto space-y-2">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto animate-pulse">
          <Database className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
          Blockchain Access Validation
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Evaluating smart contracts and security assertions on Hyperledger consensus channels.
        </p>
      </div>

      {/* Progress Steps Timeline */}
      <div className="max-w-md mx-auto space-y-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-900 rounded-2xl p-5">
        {verificationSteps.map((step, index) => {
          const isVerified = activeStep > index
          const isActive = activeStep === index
          const isPending = activeStep < index

          return (
            <div 
              key={step.id} 
              className={`flex items-start gap-3.5 transition-opacity duration-300 ${
                isPending ? 'opacity-35' : 'opacity-100'
              }`}
            >
              {/* Checkbox Icon Indicator */}
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${
                isVerified 
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                  : isActive
                  ? 'bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-650'
              }`}>
                {isVerified ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : isActive ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                )}
              </div>

              {/* Text Info */}
              <div className="space-y-0.5">
                <span className={`text-xs font-bold block ${
                  isVerified 
                    ? 'text-slate-850 dark:text-slate-200 line-through decoration-slate-400/35' 
                    : isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-500 dark:text-slate-550'
                }`}>
                  {step.label}
                </span>
                
                {isActive && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                    {step.statusMsg}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {activeStep >= verificationSteps.length && (
        <div className="text-center py-2 animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 animate-bounce" />
            Redirecting to Authorized Workspace...
          </span>
        </div>
      )}
    </div>
  )
}
