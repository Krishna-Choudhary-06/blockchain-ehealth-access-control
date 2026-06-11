import { useState } from 'react'
import toast from 'react-hot-toast'
import { FiUser, FiBriefcase, FiLayers, FiCheckCircle, FiLoader } from 'react-icons/fi'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    organization: ''
  })
  const [loading, setLoading] = useState(false)
  const [txDetails, setTxDetails] = useState(null)

  const roles = ['Patient', 'Doctor', 'Nurse', 'Admin']

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please enter a valid name.')
      return
    }
    if (!formData.role) {
      toast.error('Please select a system role.')
      return
    }
    if (!formData.organization.trim()) {
      toast.error('Please enter an organization.')
      return
    }

    setLoading(true)
    setTxDetails(null)
    const toastId = toast.loading('Initiating registration transaction on blockchain...')

    // Simulate smart contract invoke registration
    setTimeout(() => {
      toast.loading('Generating cryptographic credentials and key pairs...', { id: toastId })
    }, 1000)

    setTimeout(() => {
      toast.loading('Committing block to Hyperledger Fabric consensus network...', { id: toastId })
    }, 2200)

    setTimeout(() => {
      const mockTxHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      setTxDetails({
        txHash: mockTxHash,
        blockNumber: Math.floor(Math.random() * 1000) + 500,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleString(),
        name: formData.name,
        role: formData.role,
        organization: formData.organization,
        identityId: 'UID-' + Math.floor(100000 + Math.random() * 900000)
      })

      setLoading(false)
      toast.success('Registration Successful! Committed to Ledger.', { id: toastId })
      
      // Reset form
      setFormData({
        name: '',
        role: '',
        organization: ''
      })
    }, 3500)
  }

  return (
    <div className="relative">
      {/* Background Gradients */}
      <div className="absolute top-10 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Registration Form Card */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors duration-300">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">User Identity Registration</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Enroll your identity and attributes into the secure access control blockchain network.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <FiUser className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Sarah Miller"
                  disabled={loading}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
                />
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="role" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">System Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <FiLayers className="w-4.5 h-4.5" />
                </div>
                <select
                  name="role"
                  id="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:border-transparent transition-all text-sm disabled:opacity-50 cursor-pointer appearance-none"
                >
                  <option value="" disabled>Select User Role</option>
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Organization Input */}
            <div className="space-y-1.5">
              <label htmlFor="organization" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Organization / Department</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <FiBriefcase className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  name="organization"
                  id="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="e.g. Cardiology Department, NIT Hospital"
                  disabled={loading}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
                />
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 shadow-md ${
                loading
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 flex items-center justify-center space-x-2"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/10 dark:shadow-purple-900/30 hover:scale-[1.01] cursor-pointer"
              }`}
            >
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                  <span>Registering on Blockchain...</span>
                </>
              ) : (
                "Register on Blockchain"
              )}
            </button>
          </form>
        </div>

        {/* Info & Ledger State Logs */}
        <div className="md:col-span-5 space-y-6">
          {/* Paper Info Summary */}
          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-6 transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Blockchain Phase 1</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              According to the adaptive access control paper, user registration establishes mapping credentials. It generates user secret keys mapped with attribute identifiers, ensuring role validation occurs at the smart contract level.
            </p>
          </div>

          {/* Ledger Tx details panel */}
          {txDetails && (
            <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/25 dark:border-emerald-500/20 rounded-3xl p-6 shadow-md animate-fadeIn">
              <div className="flex items-center space-x-2.5 text-emerald-600 dark:text-emerald-400 mb-4">
                <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Transaction Committed</h3>
              </div>
              <div className="space-y-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-sans">Certificate ID</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{txDetails.identityId}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-sans">Transaction ID</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 break-all select-all">{txDetails.txHash}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-sans">Block Mined</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">#{txDetails.blockNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-sans">Status</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{txDetails.status}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-900/50">
                  <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-sans">Attributes Enrolled</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[9px]">Name: {txDetails.name}</span>
                    <span className="bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[9px]">Role: {txDetails.role}</span>
                    <span className="bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[9px]">Org: {txDetails.organization}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
