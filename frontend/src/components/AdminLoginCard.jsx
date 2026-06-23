import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Lock, User, ArrowLeft, Shield } from 'lucide-react'
import SecurityBanner from './SecurityBanner'

export default function AdminLoginCard({ onSubmit, onChangePassword, onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!username) errs.username = 'Username is required.'
    if (!password) errs.password = 'Password is required.'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    onSubmit({ username, password })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full max-w-lg mx-auto bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6 relative"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-5 left-5 md:top-8 md:left-8 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Header Info */}
      <div className="text-center pt-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-indigo-650 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Admin Access Portal
        </h2>
        <span className="text-[9px] uppercase tracking-wider bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded font-bold text-slate-550 dark:text-slate-350">
          System Administration
        </span>
      </div>

      {/* Restricted Security Warning Banner */}
      <SecurityBanner />

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-705 dark:text-slate-305 uppercase tracking-wider block">
            Admin Username
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-505 group-focus-within:text-purple-500 transition-colors">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setErrors(prev => ({ ...prev, username: '' }))
              }}
              placeholder="e.g. administrator"
              className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm font-sans"
            />
          </div>
          {errors.username && (
            <span className="text-[10px] text-red-500 font-bold block mt-1">
              {errors.username}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-705 dark:text-slate-305 uppercase tracking-wider block">
              Clearance Passcode
            </label>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-505 group-focus-within:text-purple-500 transition-colors">
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

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-850/80">
          <button
            type="button"
            onClick={onChangePassword}
            className="w-full sm:w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
          >
            Change Password
          </button>
          <button
            type="submit"
            className="w-full sm:w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </form>
    </motion.div>
  )
}
