import React from 'react'
import AuthLayout from '../components/AuthLayout'
import AuthenticationWizard from '../components/AuthenticationWizard'

export default function Login() {
  return (
    <div className="relative pt-6 min-h-[calc(100vh-140px)]">
      {/* Background Gradients */}
      <div className="absolute top-10 left-1/3 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16 animate-fade-in-up">
        <AuthLayout>
          <AuthenticationWizard />
        </AuthLayout>
      </div>
    </div>
  )
}
