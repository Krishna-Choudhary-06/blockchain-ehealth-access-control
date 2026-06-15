import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Database, Users, ChevronRight, Activity, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

import EnrollmentSuccessBridge from './EnrollmentSuccessBridge'
import IdentityLookup from './IdentityLookup'
import RoleVerification from './RoleVerification'
import LoginForm from './LoginForm'
import BlockchainVerification from './BlockchainVerification'

export default function AuthenticationWizard() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState(1)
  const [verifiedUser, setVerifiedUser] = useState(null)
  const [justEnrolledData, setJustEnrolledData] = useState(null)
  const [stats, setStats] = useState({ identitiesCount: 142 })

  // Initialize checks for enrollment redirection & statistics
  useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
      setStats({ identitiesCount: 142 + users.length })
    } catch (e) {
      console.error(e)
    }

    if (location.state && location.state.justEnrolled) {
      const { name, identityId, role } = location.state
      const resolvedUser = {
        name,
        identityId,
        role,
        organization: location.state.organization || 'Consortium Hospital',
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@health.com`
      }
      
      setJustEnrolledData(resolvedUser)
      setVerifiedUser(resolvedUser)
      // Skip welcome and lookup, go straight to credential verification
      setStep(4)
      toast.success(`Identity ${identityId} loaded! Enter password to login.`)
    }
  }, [location.state])

  const handleIdentityFound = (user) => {
    setVerifiedUser(user)
    setStep(3)
  }

  const handleRoleProceed = () => {
    setStep(4)
  }

  const handlePatientBypass = () => {
    // Patients continue directly to verification & workspace redirection
    setStep(5)
  }

  const handleCredentialsSubmitted = async (data) => {
    // Transition to step 5: Blockchain access timeline check
    setStep(5)
  }

  const handleVerificationCompleted = async () => {
    try {
      // Login with verified details
      const email = verifiedUser.email || `${verifiedUser.name.toLowerCase().replace(/\s+/g, '.')}@health.com`
      
      // Call mock login
      const loggedIn = await login(email, 'password123', verifiedUser.role)
      
      toast.success(`Welcome back, ${loggedIn.name}!`)
      navigate('/dashboard')
    } catch (error) {
      toast.error('Blockchain validation failed: Session could not be created.')
      setStep(4) // Fallback to credentials screen
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      if (step === 3) {
        setVerifiedUser(null)
      }
    }
  }

  // Animation variants
  const variants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -15 }
  }

  return (
    <div className="relative">
      
      {/* Back button (Only for steps 2 to 4, and not when justEnrolled redirects are locked) */}
      {step > 1 && step < 5 && !justEnrolledData && (
        <button
          onClick={handleBack}
          className="absolute -top-12 left-0 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      )}

      {/* Enrollment Success Banner */}
      {justEnrolledData && step === 4 && (
        <EnrollmentSuccessBridge enrolledData={justEnrolledData} />
      )}

      <AnimatePresence mode="wait">
        
        {/* Step 1: Welcome Screen */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.3 }}
            className="space-y-6 text-center lg:text-left"
          >
            <div className="space-y-3">
              <span className="flex items-center gap-1 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase w-fit mx-auto lg:mx-0">
                <Shield className="w-3.5 h-3.5" /> Security Access Enabled
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Access Blockchain Healthcare Network
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
                Authorize your identity using on-chain credentials to open secure sessions on the Hyperledger Fabric channel.
              </p>
            </div>

            {/* Simulated Clinical Graphic for Visual Interest */}
            <div className="p-4 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-900 rounded-2xl flex items-center gap-4.5 max-w-md mx-auto lg:mx-0">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl shadow-md flex-shrink-0 animate-pulse">
                <Activity className="w-6 h-6" />
              </div>
              <div className="text-left space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-450 font-bold block">Consortium Hub Metrics</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Active identities in ledger: <strong className="text-purple-600 dark:text-purple-400 font-mono">{stats.identitiesCount}</strong>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Consensus: <span className="text-emerald-500 font-bold">RAFT ACTIVE</span> (Node 1-7 synced)
                </span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Authenticate Workspace Node / Sign in</span>
              <ChevronRight className="w-8 h-8" />
            </button>
          </motion.div>
        )}

        {/* Step 2: Identity Lookup */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.3 }}
          >
            <IdentityLookup onIdentityFound={handleIdentityFound} />
          </motion.div>
        )}

        {/* Step 3: Role & Organization Verification */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.3 }}
          >
            <RoleVerification 
              verifiedUser={verifiedUser} 
              onProceed={handleRoleProceed} 
              onPatientBypass={handlePatientBypass} 
            />
          </motion.div>
        )}

        {/* Step 4: Password / Key verification */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.3 }}
          >
            <LoginForm 
              verifiedUser={verifiedUser} 
              onSubmit={handleCredentialsSubmitted} 
            />
          </motion.div>
        )}

        {/* Step 5: Progressive On-chain Verification Checks */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.3 }}
          >
            <BlockchainVerification onComplete={handleVerificationCompleted} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
