import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Key, Fingerprint, FileUp, Check, Lock } from 'lucide-react'
import ValidationMessage from './ValidationMessage'
import toast from 'react-hot-toast'

export default function LoginForm({ verifiedUser, onSubmit }) {
  const [pemFile, setPemFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const hasStoredPassword = Boolean(verifiedUser.passwordHash)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: verifiedUser.email,
      identityId: verifiedUser.identityId,
      password: '',
      rememberDevice: false
    }
  })

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      if (content.includes('BEGIN PRIVATE KEY')) {
        setPemFile(file.name)
        toast.success('Cryptographic Private Key loaded successfully!')
      } else {
        toast.error('Invalid PEM key: make sure it is a valid private key file.')
      }
      setUploading(false)
    }
    reader.readAsText(file)
  }

  const handleBiometric = () => {
    toast.error('Biometric authentication is only available on verified client nodes.')
  }

  const onFormSubmit = (data) => {
    onSubmit({
      ...data,
      pemKeyLoaded: !!pemFile
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4.5 animate-fade-in-up">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Step 4: Credential Authentication
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Enter the password created during enrollment and optionally attach a local signing key.
        </p>
      </div>

      {/* Profile Summary Badge */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 p-3.5 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Holder User</span>
          <strong className="text-slate-800 dark:text-slate-200">{verifiedUser.name}</strong>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Authorized Role</span>
          <span className="text-purple-600 dark:text-purple-400 font-bold">{verifiedUser.role}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Username/Email (Disabled) */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Email Address / ID
          </label>
          <input
            type="text"
            disabled
            value={verifiedUser.email}
            className="w-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
          />
        </div>

        {/* Certificate UID (Disabled) */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Certificate UID
          </label>
          <input
            type="text"
            disabled
            value={verifiedUser.identityId}
            className="w-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-mono cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Account Password
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type="password"
            {...register('password', hasStoredPassword ? { required: 'Password is required' } : {})}
            disabled={!hasStoredPassword}
            placeholder={hasStoredPassword ? 'Enter enrollment password' : 'Legacy identity: no password was created'}
            className="w-full bg-slate-50/50 disabled:bg-slate-100 dark:bg-slate-950 disabled:dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm disabled:cursor-not-allowed disabled:text-slate-500"
          />
        </div>
        <ValidationMessage error={errors.password} />
        {!hasStoredPassword && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            This identity was enrolled before password support. Re-enroll it to require password login.
          </p>
        )}
      </div>

      {/* Cryptographic PEM Key Upload */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Consensus Signature Verification Key (Optional PEM)
        </label>
        <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 rounded-2xl p-4 transition-all text-center">
          <input
            type="file"
            accept=".pem,.key,.txt"
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-1.5">
            {pemFile ? (
              <>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{pemFile} Loaded</span>
              </>
            ) : (
              <>
                <FileUp className="w-6 h-6 text-slate-400 group-hover:text-purple-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Drag & drop or <span className="text-purple-600 dark:text-purple-400 hover:underline">browse</span> PEM Private Key
                </span>
                <span className="text-[9px] text-slate-450 uppercase block">Used to sign local transactions</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Remember me & Biometric Ready */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('rememberDevice')}
            className="w-4 h-4 text-purple-600 border-slate-300 dark:border-slate-800 rounded focus:ring-purple-500 bg-slate-50 dark:bg-slate-950"
          />
          <span>Remember Device</span>
        </label>

        <button
          type="button"
          onClick={handleBiometric}
          className="text-slate-500 hover:text-purple-600 dark:text-slate-450 dark:hover:text-purple-400 flex items-center gap-1.5 font-semibold cursor-pointer"
        >
          <Fingerprint className="w-4.5 h-4.5" />
          <span>Biometric Ready</span>
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Key className="w-4 h-4" />
        Authenticate Identity
      </button>
    </form>
  )
}
