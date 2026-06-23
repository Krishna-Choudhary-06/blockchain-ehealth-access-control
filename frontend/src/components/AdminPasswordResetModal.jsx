import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Key, ShieldCheck, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react'
import OTPVerificationStep from './OTPVerificationStep'
import PasswordUpdateStep from './PasswordUpdateStep'

export default function AdminPasswordResetModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [prevPassword, setPrevPassword] = useState('')
  const [errors, setErrors] = useState({})
  
  // Step 2 sub-animation checkpoints
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    if (step === 2) {
      setAnimationStep(0)
      const timers = [
        setTimeout(() => setAnimationStep(1), 1000), // Checking Previous Password...
        setTimeout(() => setAnimationStep(2), 2200), // Identity Verified...
        setTimeout(() => setAnimationStep(3), 3400), // OTP Requested...
        setTimeout(() => setStep(3), 4600)           // Transition to OTP screen
      ]
      return () => timers.forEach(clearTimeout)
    }
  }, [step])

  if (!isOpen) return null

  const handleStep1Submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!email) errs.email = 'Admin email is required.'
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) errs.email = 'Invalid email address.'
    
    if (!prevPassword) errs.prevPassword = 'Previous password is required.'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    setStep(2)
  }

  const handleOTPVerify = (code) => {
    // Mock verify success
    setStep(4)
  }

  const handlePasswordUpdate = (newPass) => {
    // Mock update success
    setStep(5)
  }

  const handleClose = () => {
    setStep(1)
    setEmail('')
    setPrevPassword('')
    setErrors({})
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh] relative"
      >
        {/* Close Button */}
        {step !== 2 && (
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white leading-tight">
              Change Administrator Credentials
            </h3>
            <span className="text-[9px] uppercase font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-bold">
              Secure reset wizard (Step {step}/5)
            </span>
          </div>
        </div>

        {/* Wizard Steps */}
        <AnimatePresence mode="wait">
          {/* Step 1: Input Identity */}
          {step === 1 && (
            <motion.form
              key="step1"
              onSubmit={handleStep1Submit}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-4"
            >
              <div className="text-center mb-1">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Provide your designated systems administrator email and current password to verify authority.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Admin Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-505 group-focus-within:text-purple-500 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrors(prev => ({ ...prev, email: '' }))
                    }}
                    placeholder="admin.key@ehealth.org"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm font-sans"
                  />
                </div>
                {errors.email && (
                  <span className="text-[10px] text-red-500 font-bold block mt-1">
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-305 uppercase tracking-wider block">
                  Previous Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-505 group-focus-within:text-purple-500 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={prevPassword}
                    onChange={(e) => {
                      setPrevPassword(e.target.value)
                      setErrors(prev => ({ ...prev, prevPassword: '' }))
                    }}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm font-sans"
                  />
                </div>
                {errors.prevPassword && (
                  <span className="text-[10px] text-red-500 font-bold block mt-1">
                    {errors.prevPassword}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-3 border-t border-slate-105 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Verify Identity
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 2: Animated Checking */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 flex flex-col items-center justify-center space-y-6 text-left w-full"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 relative">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
              </div>

              <div className="w-full space-y-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-900 rounded-2xl p-5">
                {/* Checkpoint 1: Checking Previous Password... */}
                <div className={`flex items-center gap-2.5 transition-opacity duration-300 ${animationStep >= 0 ? 'opacity-100' : 'opacity-20'}`}>
                  {animationStep >= 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500 flex-shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Checking Previous Password...</span>
                </div>

                {/* Checkpoint 2: Identity Verified... */}
                <div className={`flex items-center gap-2.5 transition-opacity duration-300 ${animationStep >= 1 ? 'opacity-100' : 'opacity-20'}`}>
                  {animationStep >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : animationStep === 1 ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-800 flex-shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Identity Verified...</span>
                </div>

                {/* Checkpoint 3: OTP Requested... */}
                <div className={`flex items-center gap-2.5 transition-opacity duration-300 ${animationStep >= 2 ? 'opacity-100' : 'opacity-20'}`}>
                  {animationStep >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : animationStep === 2 ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-800 flex-shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">OTP Requested...</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: OTP Code verification */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
            >
              <OTPVerificationStep onVerify={handleOTPVerify} onBack={() => setStep(1)} />
            </motion.div>
          )}

          {/* Step 4: Password Update */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
            >
              <PasswordUpdateStep onSubmit={handlePasswordUpdate} onBack={() => setStep(3)} />
            </motion.div>
          )}

          {/* Step 5: Success Screen */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 flex flex-col items-center text-center space-y-5"
            >
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 fill-emerald-500/10" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Password Updated Successfully
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your new administrator passcode credentials are active. You may now sign in using your new password.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Return To Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
