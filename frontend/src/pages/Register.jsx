import React from 'react'
import EnrollmentWizard from '../components/EnrollmentWizard'

export default function Register() {
  return (
    <div className="relative pt-6 min-h-[calc(100vh-140px)]">
      {/* Background Gradients */}
      <div className="absolute top-10 left-1/3 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Header Info */}
      <div className="text-center max-w-2xl mx-auto mb-10 animate-fade-in-up opacity-0">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
          Identity Enrollment Portal
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
          Generate decentralized cryptographic keys and register attribute profiles to anchor authority on the blockchain network.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <EnrollmentWizard />
      </div>
    </div>
  )
}

