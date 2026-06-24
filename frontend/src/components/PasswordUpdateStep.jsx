import React, { useState, useEffect } from 'react'
import { Lock, Check, X, ShieldAlert } from 'lucide-react'

export default function PasswordUpdateStep({ onSubmit, onBack }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [strength, setStrength] = useState({ score: 0, text: 'Very Weak', color: 'bg-red-500' })
  const [errors, setErrors] = useState({})

  // Requirements checklist
  const requirements = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'At least one uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'At least one number', valid: /[0-9]/.test(password) },
    { label: 'At least one special character (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(password) }
  ]

  useEffect(() => {
    let score = 0
    requirements.forEach(req => {
      if (req.valid) score += 1
    })

    let text = 'Very Weak'
    let color = 'bg-red-500'

    if (score === 1) {
      text = 'Weak'
      color = 'bg-red-400'
    } else if (score === 2) {
      text = 'Fair'
      color = 'bg-amber-500'
    } else if (score === 3) {
      text = 'Good'
      color = 'bg-yellow-400'
    } else if (score === 4) {
      text = 'Strong'
      color = 'bg-emerald-500'
    }

    setStrength({ score, text, color })
  }, [password])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}

    if (strength.score < 3) {
      errs.password = 'Password strength must be at least Good.'
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
      <div className="text-center space-y-1">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Set New Credentials
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          Create a secure password. Strong configurations block automated penetration attacks.
        </p>
      </div>

      <div className="space-y-4">
        {/* New Password */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">
            New Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors(prev => ({ ...prev, password: '' }))
              }}
              placeholder="••••••••"
              className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm font-sans"
            />
          </div>
          {errors.password && (
            <span className="text-[10px] text-red-500 font-bold block mt-1">
              {errors.password}
            </span>
          )}
        </div>

        {/* Live Strength Meter */}
        {password.length > 0 && (
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-505 text-slate-500">Security Score:</span>
              <span className={strength.score >= 3 ? 'text-emerald-500' : 'text-red-500'}>
                {strength.text}
              </span>
            </div>
            {/* Meter Bar */}
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full flex-grow transition-all duration-300 ${
                    i < strength.score ? strength.color : 'bg-slate-300 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
            {/* Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1.5 pt-1.5 text-[9px] text-slate-500 dark:text-slate-400 font-medium">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {req.valid ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-350 dark:text-slate-700 flex-shrink-0" />
                  )}
                  <span className={req.valid ? 'text-slate-700 dark:text-slate-200 font-bold' : ''}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm New Password */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">
            Confirm New Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setErrors(prev => ({ ...prev, confirmPassword: '' }))
              }}
              placeholder="••••••••"
              className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm font-sans"
            />
          </div>
          {errors.confirmPassword && (
            <span className="text-[10px] text-red-500 font-bold block mt-1">
              {errors.confirmPassword}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-xs text-slate-700 dark:text-slate-350 cursor-pointer transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-xl bg-purple-650 hover:bg-purple-505 bg-purple-600 text-white hover:bg-purple-500 text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          Update Password
        </button>
      </div>
    </form>
  )
}
