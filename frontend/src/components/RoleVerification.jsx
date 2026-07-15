import React, { useEffect, useRef } from 'react'
import { CheckCircle2, ShieldCheck, Heart, UserCheck, ArrowRight } from 'lucide-react'

export default function RoleVerification({ verifiedUser, onProceed, onPatientBypass, autoProceed = false }) {
  const didAutoProceed = useRef(false)

  useEffect(() => {
    if (!autoProceed || didAutoProceed.current || !verifiedUser) return

    didAutoProceed.current = true
    const timeout = setTimeout(() => {
      if (verifiedUser.role === 'Patient') {
        onPatientBypass?.()
      } else {
        onProceed?.()
      }
    }, 350)

    return () => clearTimeout(timeout)
  }, [autoProceed, onPatientBypass, onProceed, verifiedUser])

  if (!verifiedUser) return null

  const { name, identityId, role, organization } = verifiedUser
  const isPatient = role === 'Patient'

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Step 3: Role Verification
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Cryptographic credentials resolved successfully. Please verify your role clearance parameters.
        </p>
      </div>

      {isPatient ? (
        /* Special Patient Login Flow */
        <div className="bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 dark:border-sky-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Heart className="w-5.5 h-5.5 fill-sky-500/20" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Patient Identity Verified
              </h4>
              <span className="flex items-center gap-1 text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 mt-0.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                BLOCKCHAIN SECURED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-200/50 dark:border-slate-800/50 font-semibold text-slate-600 dark:text-slate-400">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Patient Holder</span>
              <strong className="text-slate-800 dark:text-slate-200">{name}</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Certificate UID</span>
              <span className="font-mono text-slate-850 dark:text-slate-200">{identityId}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Role Attribute</span>
              <strong className="text-sky-650 dark:text-sky-400">{role}</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Ledger Status</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Verified</span>
            </div>
          </div>

          <button
            onClick={onPatientBypass}
            className="w-full mt-2 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            Continue Directly to Patient Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Professional Roles Login Flow */
        <div className="space-y-4">
          <div className="bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-450 text-xs font-bold bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Identity Found in Blockchain Registry</span>
            </div>
            
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-450 text-xs font-bold bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/10">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Role Verified: {role}</span>
            </div>

            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-450 text-xs font-bold bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/10">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Organization Verified: {organization}</span>
            </div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 text-[11px] text-purple-700 dark:text-purple-300/80 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-purple-500 flex-shrink-0 mt-0.5" />
            <span>Fabric endorsement policies require you to provide your password and optional PEM cryptographic key pair file to sign the session token.</span>
          </div>

          <button
            onClick={onProceed}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Key Authentication</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
