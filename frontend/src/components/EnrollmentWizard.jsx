import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, ArrowRight, CheckCircle, Loader2, ShieldAlert, 
  Cpu, Copy, Check, ExternalLink, ShieldCheck, Key, X 
} from 'lucide-react'
import { generateSalt, generateUserKeyPair, getDelay, hashPassword } from '../services/cryptoService'
import { registerUser, assignLevel, getBGWState, generateBGWPrivateKey } from '../services/apiService'
import StepProgress from './StepProgress'
import RoleSelector from './RoleSelector'
import DynamicRegistrationForm from './DynamicRegistrationForm'
import AttributePreview from './AttributePreview'

export default function EnrollmentWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [txDetails, setTxDetails] = useState(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [enrollmentProgress, setEnrollmentProgress] = useState('')

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: {
      role: '',
      name: '',
      email: '',
      phone: '',
      accountPassword: '',
      confirmPassword: '',
      organization: '',
      department: '',
      specialization: '',
      regNo: '',
      experience: '',
      licenseExpiry: '',
      shiftType: '',
      dob: '',
      gender: '',
      bloodGroup: '',
      emergencyContact: '',
      insuranceNo: '',
      employeeId: '',
      adminId: '',
      securityLevel: ''
    }
  })

  // Watch all inputs for live preview
  const formData = watch()

  // Handle role selection
  const handleRoleChange = (role) => {
    setValue('role', role, { shouldValidate: true })
  }

  // Custom step validation before going forward
  const handleNextStep = async () => {
    if (step === 1) {
      if (!formData.role) {
        toast.error('Please select a system role to continue.')
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      // Validate Step 2 fields based on role
      const fieldsToValidate = ['name', 'email', 'phone', 'accountPassword', 'confirmPassword']
      if (formData.role === 'Patient') {
        fieldsToValidate.push('dob', 'gender', 'bloodGroup')
      }
      const isStep2Valid = await trigger(fieldsToValidate)
      if (isStep2Valid && formData.accountPassword !== formData.confirmPassword) {
        toast.error('Passwords do not match.')
        return
      }
      if (isStep2Valid) {
        setStep(3)
      } else {
        toast.error('Please fix the errors in Personal Information.')
      }
      return
    }

    if (step === 3) {
      // Validate Step 3 fields based on role
      let fieldsToValidate = []
      if (formData.role === 'Doctor') {
        fieldsToValidate = ['regNo', 'specialization', 'department', 'organization', 'experience', 'licenseExpiry']
      } else if (formData.role === 'Nurse') {
        fieldsToValidate = ['regNo', 'department', 'shiftType', 'organization', 'experience']
      } else if (formData.role === 'Patient') {
        fieldsToValidate = ['patientId', 'emergencyContact', 'insuranceNo']
      } else if (formData.role === 'Accountant') {
        fieldsToValidate = ['employeeId', 'department', 'organization']
      } else if (formData.role === 'Admin') {
        fieldsToValidate = ['adminId', 'organization', 'securityLevel']
      }

      const isStep3Valid = await trigger(fieldsToValidate)
      if (isStep3Valid) {
        setStep(4)
      } else {
        toast.error('Please fix the errors in Professional Information.')
      }
      return
    }

    if (step === 4) {
      setStep(5)
      return
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleCopyKey = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    toast.success('Public key copied to clipboard!')
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleEnrollIdentity = async () => {
    setLoading(true)
    setEnrollmentProgress('Initiating registration transaction on Hyperledger consensus network...')
    const toastId = toast.loading('Initiating registration transaction...')

    try {
      await new Promise(resolve => setTimeout(resolve, getDelay(800)))
      setEnrollmentProgress('Generating browser identity key material for certificate registration...')
      toast.loading('Generating registration credentials...', { id: toastId })
      
      const keyPair = await generateUserKeyPair()
      const passwordSalt = generateSalt()
      const passwordHash = await hashPassword(formData.accountPassword, passwordSalt)
      
      await new Promise(resolve => setTimeout(resolve, getDelay(800)))
      setEnrollmentProgress('Committing attribute records to Hyperledger Fabric channel ledger...')
      toast.loading('Committing block to Hyperledger Fabric consensus network...', { id: toastId })

      await new Promise(resolve => setTimeout(resolve, getDelay(1000)))
      
      const identityId =
  formData.name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')      
      // CALL BACKEND API TO REGISTER USER
      setEnrollmentProgress('Registering identity on Hyperledger Fabric backend...')
      toast.loading('Registering identity on Hyperledger Fabric backend...', { id: toastId })
      const apiResult = await registerUser(identityId, keyPair.publicKey, formData.role)
      if (!apiResult.success) throw new Error(apiResult.error || 'Registration failed')
      
      // Paper privacy model: L0 is most restrictive, L3 is public.
      let securityLvl = 'L2'
      if (formData.role === 'Admin') securityLvl = 'L0'
      else if (formData.role === 'Doctor') securityLvl = 'L0'
      else if (formData.role === 'Nurse') securityLvl = 'L2'
      else if (formData.role === 'Accountant') securityLvl = 'L3'
      else if (formData.role === 'Patient') securityLvl = 'L0'
      if (formData.securityLevel) securityLvl = 'L' + formData.securityLevel

      setEnrollmentProgress('Assigning Privacy Level on Fabric...')
      await assignLevel(identityId, securityLvl)

      const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
      setEnrollmentProgress('Issuing BGW broadcast private key for the enrolled recipient...')
      const bgwState = await getBGWState()
      const recipientIndex = existingUsers.length + 1
      const bgwPrivateKeyResult = await generateBGWPrivateKey(
        recipientIndex,
        undefined,
        bgwState.data.publicKey
      )

      // Determine Organization display value
      const finalOrg = formData.organization || formData.department || 'Consortium Hospital'

      // Save keys
      localStorage.setItem(`user_keys_${formData.name}`, JSON.stringify({
        userId: identityId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        organization: finalOrg,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        bgwRecipientId: recipientIndex,
        bgwPrivateKey: bgwPrivateKeyResult.data,
        bgwPublicKey: bgwState.data.publicKey,
        privacyLevel: securityLvl,
        passwordSalt,
        passwordHash
      }))

      // Save to registered users list
      existingUsers.push({
        userId: identityId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        organization: finalOrg,
        publicKey: keyPair.publicKey,
        bgwRecipientId: recipientIndex,
        privacyLevel: securityLvl,
        passwordSalt,
        passwordHash
      })
      localStorage.setItem('registered_users', JSON.stringify(existingUsers))

      const transactionData = {
        txHash: apiResult.data?.txId || apiResult.data?.transactionId || identityId,
        blockNumber: apiResult.data?.blockNumber || 'Committed',
        status: 'SUCCESS',
        timestamp: new Date().toLocaleString(),
        name: formData.name,
        role: formData.role,
        organization: finalOrg,
        email: formData.email,
        passwordHash,
        passwordSalt,
        identityId: identityId,
        publicKey: keyPair.publicKey
      }

      setTxDetails(transactionData)
      setLoading(false)
      toast.success('Identity node enrolled and committed to ledger!', { id: toastId })
    } catch (error) {
      toast.error(`Registration failed: ${error.message}`, { id: toastId })
      setLoading(false)
    }
  }

  const handleResetWizard = () => {
    reset()
    setTxDetails(null)
    setStep(1)
  }

  // Animation variants
  const slideVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  return (
    <div className="relative">
      {/* Step Progress Bar at top */}
      <StepProgress currentStep={step} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Content */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-lg transition-all duration-300">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={slideVariants}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Step 1: Choose Your System Role
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    Select a designated role to determine form parameters and access rights on the EHR network.
                  </p>
                </div>
                
                <RoleSelector selectedRole={formData.role} onChange={handleRoleChange} />
              </motion.div>
            )}

            {(step === 2 || step === 3) && (
              <motion.div
                key={`step${step}`}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={slideVariants}
                transition={{ duration: 0.3 }}
              >
                <form className="space-y-4">
                  <DynamicRegistrationForm 
                    register={register} 
                    errors={errors} 
                    role={formData.role} 
                    step={step} 
                  />
                </form>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={slideVariants}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Step 4: Blockchain Attribute Review
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    Please review your entered parameters. These will be serialized and cryptographically hashed before commitment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl space-y-2.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block border-b border-slate-200 dark:border-slate-800 pb-1.5">Personal Identity</span>
                    <div><span className="text-slate-400">Name:</span> <strong className="text-slate-700 dark:text-slate-350">{formData.name}</strong></div>
                    <div><span className="text-slate-400">Email:</span> <span className="text-slate-700 dark:text-slate-350">{formData.email}</span></div>
                    <div><span className="text-slate-400">Phone:</span> <span className="text-slate-700 dark:text-slate-350">{formData.phone}</span></div>
                    {formData.role === 'Patient' && (
                      <>
                        <div><span className="text-slate-400">DOB:</span> <span className="text-slate-700 dark:text-slate-350">{formData.dob}</span></div>
                        <div><span className="text-slate-400">Gender:</span> <span className="text-slate-700 dark:text-slate-350">{formData.gender}</span></div>
                        <div><span className="text-slate-400">Blood Group:</span> <span className="text-slate-700 dark:text-slate-350">{formData.bloodGroup}</span></div>
                      </>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl space-y-2.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block border-b border-slate-200 dark:border-slate-800 pb-1.5">Professional Details</span>
                    <div><span className="text-slate-400">System Role:</span> <strong className="text-purple-600 dark:text-purple-400">{formData.role}</strong></div>
                    {formData.role === 'Doctor' && (
                      <>
                        <div><span className="text-slate-400">Reg Number:</span> <span className="text-slate-700 dark:text-slate-350">{formData.regNo}</span></div>
                        <div><span className="text-slate-400">Specialization:</span> <span className="text-slate-700 dark:text-slate-350">{formData.specialization}</span></div>
                        <div><span className="text-slate-400">Department:</span> <span className="text-slate-700 dark:text-slate-350">{formData.department}</span></div>
                        <div><span className="text-slate-400">Hospital:</span> <span className="text-slate-700 dark:text-slate-350">{formData.organization}</span></div>
                      </>
                    )}
                    {formData.role === 'Nurse' && (
                      <>
                        <div><span className="text-slate-400">Reg Number:</span> <span className="text-slate-700 dark:text-slate-350">{formData.regNo}</span></div>
                        <div><span className="text-slate-400">Department:</span> <span className="text-slate-700 dark:text-slate-350">{formData.department}</span></div>
                        <div><span className="text-slate-400">Shift Type:</span> <span className="text-slate-700 dark:text-slate-350">{formData.shiftType}</span></div>
                        <div><span className="text-slate-400">Organization:</span> <span className="text-slate-700 dark:text-slate-350">{formData.organization}</span></div>
                      </>
                    )}
                    {formData.role === 'Patient' && (
                      <>
                        <div><span className="text-slate-400">Patient ID:</span> <span className="text-slate-700 dark:text-slate-350">{formData.patientId}</span></div>
                        <div><span className="text-slate-400">Emergency Phone:</span> <span className="text-slate-700 dark:text-slate-350">{formData.emergencyContact}</span></div>
                        <div><span className="text-slate-400">Insurance ID:</span> <span className="text-slate-700 dark:text-slate-350">{formData.insuranceNo}</span></div>
                      </>
                    )}
                    {formData.role === 'Accountant' && (
                      <>
                        <div><span className="text-slate-400">Employee ID:</span> <span className="text-slate-700 dark:text-slate-350">{formData.employeeId}</span></div>
                        <div><span className="text-slate-400">Finance Dept:</span> <span className="text-slate-700 dark:text-slate-350">{formData.department}</span></div>
                        <div><span className="text-slate-400">Organization:</span> <span className="text-slate-700 dark:text-slate-350">{formData.organization}</span></div>
                      </>
                    )}
                    {formData.role === 'Admin' && (
                      <>
                        <div><span className="text-slate-400">Admin ID:</span> <span className="text-slate-700 dark:text-slate-350">{formData.adminId}</span></div>
                        <div><span className="text-slate-400">Organization:</span> <span className="text-slate-700 dark:text-slate-350">{formData.organization}</span></div>
                        <div><span className="text-slate-400">Security Clear:</span> <strong className="text-indigo-600 dark:text-indigo-400">Level {formData.securityLevel}</strong></div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={slideVariants}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center py-6"
              >
                {!txDetails ? (
                  <div className="space-y-5">
                    <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 animate-pulse">
                      <Cpu className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                        Enroll Cryptographic Identity Node
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
                        Ready to sign registration parameters with consensus validators. This will generate locally stored keypairs and broadcast credentials.
                      </p>
                    </div>

                    {loading ? (
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl p-6 max-w-md mx-auto space-y-4 text-left">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Processing Node Enrollment</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                          {enrollmentProgress}
                        </p>
                      </div>
                    ) : (
                      <div className="max-w-md mx-auto p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-[11px] text-purple-700 dark:text-purple-300/80 leading-relaxed text-left flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>By clicking Enroll, your browser generates a custom cryptographic keypair. The public key is registered in the decentralized patient attribute registry.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                        Identity Successfully Enrolled
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Blockchain registration transaction hash generated successfully.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleResetWizard}
                      className="mx-auto mt-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Enroll Another Identity
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wizard Action Buttons */}
          <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex justify-between">
            {step > 1 && !loading && !txDetails && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {/* Spacer */}
            <div className="flex-grow" />

            {step < 5 && (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg shadow-purple-900/10 dark:shadow-purple-900/20 cursor-pointer"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 5 && !txDetails && (
              <button
                type="button"
                disabled={loading}
                onClick={handleEnrollIdentity}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  loading 
                    ? 'bg-slate-200 dark:bg-slate-850 text-slate-400 dark:text-slate-650 cursor-not-allowed border border-slate-300/10' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20 cursor-pointer'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Enroll Identity
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Attribute Preview */}
        <div className="lg:col-span-5 space-y-6">
          <AttributePreview formData={formData} />
        </div>
      </div>

      {/* Success Modal / Transaction Ledger Details */}
      <AnimatePresence>
        {txDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      Blockchain Node Committed
                    </h3>
                    <span className="text-[10px] uppercase font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                      Block Status: {txDetails.status}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleResetWizard}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details Content */}
              <div className="space-y-5">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Decentralized identity registered. The cryptographic credentials and access attributes have been recorded successfully.
                </p>

                {/* Grid details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-4.5 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Enrolled User</span>
                    <strong className="text-slate-800 dark:text-slate-200">{txDetails.name}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Authorized Role</span>
                    <strong className="text-purple-600 dark:text-purple-400">{txDetails.role}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Assigned Certificate ID</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{txDetails.identityId}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Consensus Block Hash</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold break-all">{txDetails.txHash}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Mined Block Height</span>
                    <strong className="text-slate-800 dark:text-slate-200">#{txDetails.blockNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Consensus Timestamp</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{txDetails.timestamp}</span>
                  </div>
                </div>

                {/* Public Key Display */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" /> Generated Registration Public Key
                    </span>
                    <button
                      onClick={() => handleCopyKey(txDetails.publicKey)}
                      className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      Copy PEM
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-slate-400 rounded-xl font-mono text-[8px] leading-normal overflow-y-auto max-h-[100px] border border-slate-900">
                    {txDetails.publicKey}
                  </pre>
                </div>
              </div>

              {/* Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <button
                  onClick={() => {
                    navigate('/login', {
                      state: {
                        justEnrolled: true,
                        name: txDetails.name,
                        identityId: txDetails.identityId,
                        role: txDetails.role,
                        organization: txDetails.organization,
                        email: txDetails.email,
                        passwordHash: txDetails.passwordHash,
                        passwordSalt: txDetails.passwordSalt
                      }
                    })
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all shadow-purple-900/10 cursor-pointer"
                >
                  Done & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
