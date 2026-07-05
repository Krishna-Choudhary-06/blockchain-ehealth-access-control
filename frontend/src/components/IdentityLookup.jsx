import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Mail, Hash, User, ShieldAlert, Loader2 } from 'lucide-react'

export default function IdentityLookup({ onIdentityFound }) {
  const [lookupMethod, setLookupMethod] = useState('certificateId')
  const [searchValue, setSearchValue] = useState('')
  const [searching, setSearching] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLookup = () => {
    if (!searchValue.trim()) {
      setErrorMsg('Please enter a lookup value.')
      return
    }

    setErrorMsg('')
    setSearching(true)

    // Simulate searching blockchain registry
    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
        
        // Find matching identity based on selected method
        const foundUser = users.find(user => {
          const val = searchValue.trim().toLowerCase()
          if (lookupMethod === 'certificateId' || lookupMethod === 'blockchainId') {
            return user.userId.toLowerCase() === val
          }
          if (lookupMethod === 'email') {
            // Check if we can find by matching email in name/org or from keys (emails are saved in user_keys_[name])
            const keysData = JSON.parse(localStorage.getItem(`user_keys_${user.name}`) || '{}')
            return keysData.email?.toLowerCase() === val
          }
          if (lookupMethod === 'username') {
            return user.name.toLowerCase() === val
          }
          return false
        })

        if (foundUser) {
          // Retrieve complete profile info
          const fullKeys = JSON.parse(localStorage.getItem(`user_keys_${foundUser.name}`) || '{}')
          onIdentityFound({
            name: foundUser.name,
            identityId: foundUser.userId,
            role: foundUser.role,
            organization: foundUser.organization || fullKeys.organization || 'Consortium Hub',
            email: fullKeys.email || 'user@health.com',
            phone: fullKeys.phone || '',
            passwordHash: foundUser.passwordHash || fullKeys.passwordHash,
            passwordSalt: foundUser.passwordSalt || fullKeys.passwordSalt
          })
        } else {
          setErrorMsg('Certificate Not Found: The specified identity is not registered on the Fabric channel.')
        }
      } catch (err) {
        setErrorMsg('Consensus Policy rejected search request.')
      } finally {
        setSearching(false)
      }
    }, 1200)
  }

  // Get icons and placeholders based on selected lookup method
  const getLookupConfig = () => {
    switch (lookupMethod) {
      case 'certificateId':
        return { icon: Hash, label: 'Certificate ID', placeholder: 'e.g. UID-684718' }
      case 'blockchainId':
        return { icon: Hash, label: 'Blockchain ID', placeholder: 'e.g. UID-109284' }
      case 'email':
        return { icon: Mail, label: 'Registered Email', placeholder: 'e.g. doctor@hospital.com' }
      case 'username':
        return { icon: User, label: 'Full Username', placeholder: 'e.g. Dr Ram' }
      default:
        return { icon: Hash, label: 'ID', placeholder: 'e.g. UID-684718' }
    }
  }

  const config = getLookupConfig()
  const IconComponent = config.icon

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Step 2: Identity Verification
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Provide your unique cryptographic anchor parameters to identify your node in the ledger.
        </p>
      </div>

      {/* Select Lookup Method */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'certificateId', label: 'Cert ID' },
          { id: 'email', label: 'Email' },
          { id: 'blockchainId', label: 'Chain ID' },
          { id: 'username', label: 'Username' }
        ].map((method) => (
          <button
            key={method.id}
            onClick={() => {
              setLookupMethod(method.id)
              setSearchValue('')
              setErrorMsg('')
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              lookupMethod === method.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            {method.label}
          </button>
        ))}
      </div>

      {/* Input Group */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Enter {config.label}
        </label>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
            <IconComponent className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder={config.placeholder}
            disabled={searching}
            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm disabled:opacity-50"
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-500/5 border border-rose-500/15 text-rose-800 dark:text-rose-450 p-3 rounded-xl text-xs font-semibold flex items-start gap-2 animate-fade-in-up">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Lookup Button */}
      <button
        onClick={handleLookup}
        disabled={searching}
        className={`w-full py-3.5 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
          searching
            ? 'bg-slate-200 dark:bg-slate-850 text-slate-450 cursor-not-allowed border border-slate-300/10'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg shadow-purple-900/10 dark:shadow-purple-900/20 cursor-pointer'
        }`}
      >
        {searching ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching Blockchain Ledger...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Query Identity Node
          </>
        )}
      </button>
    </div>
  )
}
