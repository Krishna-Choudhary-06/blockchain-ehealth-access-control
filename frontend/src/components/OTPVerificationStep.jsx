import React, { useState } from 'react'
import { KeyRound, ShieldAlert } from 'lucide-react'

export default function OTPVerificationStep({ onVerify, onBack }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!otp) {
      setError('Please enter the OTP verification code.')
      return
    }
    if (otp.length < 6) {
      setError('OTP code must be 6 digits.')
      return
    }
    setError('')
    onVerify(otp)
  }

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '')
    if (val.length <= 6) {
      setOtp(val)
      if (val.length === 6) setError('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
      <div className="text-center space-y-1.5">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Enter Verification Code
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          We have dispatched a one-time passcode (OTP) to your system administration secure contact channel.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">
          One-Time Passcode (OTP)
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
            <KeyRound className="w-4 h-4" />
          </div>
          <input
            type="text"
            pattern="\d{6}"
            maxLength={6}
            value={otp}
            onChange={handleChange}
            placeholder="e.g. 109284"
            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm tracking-widest text-center font-bold font-mono"
          />
        </div>
        {error && (
          <span className="text-[10px] text-red-500 font-bold block mt-1">
            {error}
          </span>
        )}
      </div>

      {/* Warning Tip */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl p-3 flex gap-2 items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        <ShieldAlert className="w-4 h-4 text-purple-500 flex-shrink-0" />
        <span>For safety, code validity expires in 5 minutes. Do not share this credentials code.</span>
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
          Verify OTP
        </button>
      </div>
    </form>
  )
}
