import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { 
  FiClock, FiUser, FiActivity, FiCheck, FiX, FiPlus, 
  FiCpu, FiHash, FiShield, FiAlertCircle, FiDatabase,
  FiSearch, FiFilter, FiCalendar, FiEdit3, FiRefreshCw
} from 'react-icons/fi'

export default function ConsentManagement() {
  const { user } = useAuth()
  const role = user?.role || 'Patient'

  // Consent list state
  const [consents, setConsents] = useState([])
  const [selectedConsent, setSelectedConsent] = useState(null)
  
  // Controls
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false)
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false)

  // Loading/submitting indicators
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeActionId, setActiveActionId] = useState(null)

  // Forms state
  const [createForm, setCreateForm] = useState({
    userName: 'Dr. Sarah Miller',
    recordType: 'Cardiology Report',
    duration: '7 Days',
    notes: ''
  })

  const [modifyForm, setModifyForm] = useState({
    id: '',
    recordType: 'Cardiology Report',
    notes: ''
  })

  const [renewForm, setRenewForm] = useState({
    id: '',
    duration: '7 Days'
  })

  // Network users for select dropdown
  const defaultNetworkUsers = [
    { name: 'Dr. Sarah Miller', role: 'Doctor' },
    { name: 'Dr. James Watson', role: 'Doctor' },
    { name: 'Dr. Helen Cho', role: 'Doctor' },
    { name: 'Nurse Kelly Smith', role: 'Nurse' },
    { name: 'Lab Tech Dave', role: 'Staff' }
  ]

  // Seed / Load Consents from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('patient_consents')
    if (saved) {
      const parsed = JSON.parse(saved)
      setConsents(parsed)
      if (parsed.length > 0) {
        setSelectedConsent(parsed[0])
      }
    } else {
      const defaultConsents = [
        {
          id: "CONS-891023",
          userName: "Dr. Sarah Miller",
          userRole: "Doctor",
          recordType: "Cardiology Report",
          grantedDate: "2026-06-17 11:20:00",
          expiryDate: "2026-06-24 11:20:00",
          status: "Active",
          notes: "Clinical consultation for cardiac arrhythmia monitoring.",
          timeline: [
            {
              event: "Consent Created",
              timestamp: "2026-06-17 11:20:00",
              blockNumber: 412,
              txId: "0x891023af7829ac252dbef23f8b0e7a2b0e9f1a2380d90d81014ac2460d5b78ac",
              contractEvent: "ConsentContract.GrantConsent"
            }
          ]
        },
        {
          id: "CONS-349102",
          userName: "Nurse Kelly Smith",
          userRole: "Nurse",
          recordType: "MRI Brain Scan",
          grantedDate: "2026-06-12 09:12:44",
          expiryDate: "2026-06-19 09:12:44",
          status: "Revoked",
          notes: "Assisting doctor during inpatient rehabilitation check.",
          timeline: [
            {
              event: "Consent Created",
              timestamp: "2026-06-12 09:12:44",
              blockNumber: 402,
              txId: "0x1092aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e5",
              contractEvent: "ConsentContract.GrantConsent"
            },
            {
              event: "Consent Revoked",
              timestamp: "2026-06-14 11:40:15",
              blockNumber: 405,
              txId: "0x5532ab99f8313219fb00e234baad9923ffee5532ab99f8313219fb00e234ba9",
              contractEvent: "ConsentContract.RevokeConsent"
            }
          ]
        },
        {
          id: "CONS-781920",
          userName: "Dr. Helen Cho",
          userRole: "Doctor",
          recordType: "General Health Screening",
          grantedDate: "2026-06-10 14:22:10",
          expiryDate: "2026-06-11 14:22:10",
          status: "Expired",
          notes: "Pre-employment medical diagnostics checkup.",
          timeline: [
            {
              event: "Consent Created",
              timestamp: "2026-06-10 14:22:10",
              blockNumber: 395,
              txId: "0x8823f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb00",
              contractEvent: "ConsentContract.GrantConsent"
            }
          ]
        }
      ]
      localStorage.setItem('patient_consents', JSON.stringify(defaultConsents))
      setConsents(defaultConsents)
      setSelectedConsent(defaultConsents[0])
    }
  }, [])

  const saveConsents = (updated) => {
    localStorage.setItem('patient_consents', JSON.stringify(updated))
    setConsents(updated)
    if (selectedConsent) {
      const match = updated.find(c => c.id === selectedConsent.id)
      if (match) setSelectedConsent(match)
    }
  }

  // Action: Create Consent
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.notes.trim()) {
      toast.error('Notes are required to clarify consent reason.')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Mining consent entry block into blockchain ledger...')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const selectedUserObj = defaultNetworkUsers.find(u => u.name === createForm.userName)
      const parsedDays = createForm.duration === '24 Hours' ? 1 : createForm.duration === '7 Days' ? 7 : 30
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + parsedDays)

      const consentId = 'CONS-' + Math.floor(100000 + Math.random() * 900000)
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')

      const newConsent = {
        id: consentId,
        userName: createForm.userName,
        userRole: selectedUserObj?.role || 'Doctor',
        recordType: createForm.recordType,
        grantedDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        expiryDate: expDate.toISOString().replace('T', ' ').substring(0, 19),
        status: 'Active',
        notes: createForm.notes,
        timeline: [
          {
            event: "Consent Created",
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            blockNumber: 413,
            txId: mockTxHash,
            contractEvent: "ConsentContract.GrantConsent"
          }
        ]
      }

      const updated = [newConsent, ...consents]
      saveConsents(updated)
      toast.success('Patient consent registered on ledger successfully!', { id: toastId })
      setIsCreateModalOpen(false)
      setCreateForm({
        userName: 'Dr. Sarah Miller',
        recordType: 'Cardiology Report',
        duration: '7 Days',
        notes: ''
      })
    } catch (err) {
      toast.error(`Transaction failed: ${err.message}`, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Modify Consent
  const handleModifyClick = (consent) => {
    setModifyForm({
      id: consent.id,
      recordType: consent.recordType,
      notes: consent.notes
    })
    setIsModifyModalOpen(true)
  }

  const handleModifySubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const toastId = toast.loading('Invoking ModifyConsent transaction on blockchain...')

    try {
      await new Promise(resolve => setTimeout(resolve, 1200))

      const updated = consents.map(rec => {
        if (rec.id === modifyForm.id) {
          const newBlock = (rec.timeline[rec.timeline.length - 1]?.blockNumber || 410) + Math.floor(Math.random() * 5) + 1
          const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')

          const modifyTimelineEvent = {
            event: "Consent Modified",
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            blockNumber: newBlock,
            txId: mockTxHash,
            contractEvent: "ConsentContract.ModifyConsent"
          }

          return {
            ...rec,
            recordType: modifyForm.recordType,
            notes: modifyForm.notes,
            timeline: [...rec.timeline, modifyTimelineEvent]
          }
        }
        return rec
      })

      saveConsents(updated)
      toast.success('Consent policy modifications committed to ledger.', { id: toastId })
      setIsModifyModalOpen(false)
    } catch (err) {
      toast.error(`Consensus change failed: ${err.message}`, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Revoke Consent
  const handleRevoke = async (consentId) => {
    setActiveActionId(consentId)
    const toastId = toast.loading('Broadcasting Consent Revocation parameters...')

    try {
      await new Promise(resolve => setTimeout(resolve, 1300))

      const updated = consents.map(rec => {
        if (rec.id === consentId) {
          const newBlock = (rec.timeline[rec.timeline.length - 1]?.blockNumber || 410) + Math.floor(Math.random() * 5) + 1
          const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')

          const revokeTimelineEvent = {
            event: "Consent Revoked",
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            blockNumber: newBlock,
            txId: mockTxHash,
            contractEvent: "ConsentContract.RevokeConsent"
          }

          return {
            ...rec,
            status: 'Revoked',
            timeline: [...rec.timeline, revokeTimelineEvent]
          }
        }
        return rec
      })

      saveConsents(updated)
      toast.success('Access privilege revoked, nodes synchronized.', { id: toastId })
    } catch (err) {
      toast.error(`Revocation failed: ${err.message}`, { id: toastId })
    } finally {
      setActiveActionId(null)
    }
  }

  // Action: Renew Consent
  const handleRenewClick = (consent) => {
    setRenewForm({
      id: consent.id,
      duration: '7 Days'
    })
    setIsRenewModalOpen(true)
  }

  const handleRenewSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const toastId = toast.loading('Re-signing consent transaction on ledger...')

    try {
      await new Promise(resolve => setTimeout(resolve, 1400))
      const parsedDays = renewForm.duration === '24 Hours' ? 1 : renewForm.duration === '7 Days' ? 7 : 30
      
      const updated = consents.map(rec => {
        if (rec.id === renewForm.id) {
          const exp = new Date()
          exp.setDate(exp.getDate() + parsedDays)
          const newExpiryDateStr = exp.toISOString().replace('T', ' ').substring(0, 19)

          const newBlock = (rec.timeline[rec.timeline.length - 1]?.blockNumber || 410) + Math.floor(Math.random() * 5) + 1
          const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')

          const renewTimelineEvent = {
            event: "Consent Renewed",
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            blockNumber: newBlock,
            txId: mockTxHash,
            contractEvent: "ConsentContract.RenewConsent"
          }

          return {
            ...rec,
            status: 'Active',
            expiryDate: newExpiryDateStr,
            timeline: [...rec.timeline, renewTimelineEvent]
          }
        }
        return rec
      })

      saveConsents(updated)
      toast.success(`Consent policy renewed successfully for ${renewForm.duration}.`, { id: toastId })
      setIsRenewModalOpen(false)
    } catch (err) {
      toast.error(`Renewal failed: ${err.message}`, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtering list
  const getFilteredConsents = () => {
    let filtered = consents

    // Filter by Role Select
    if (filterRole !== 'All') {
      filtered = filtered.filter(item => item.userRole === filterRole)
    }

    // Filter by Status Select
    if (filterStatus !== 'All') {
      filtered = filtered.filter(item => item.status === filterStatus)
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.userName.toLowerCase().includes(q) ||
        item.userRole.toLowerCase().includes(q) ||
        item.recordType.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      )
    }

    return filtered
  }

  const filteredConsents = getFilteredConsents()

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background gradients */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-650/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-7000"></div>

      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-900/60 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <FiShield className="text-purple-650 dark:text-purple-400" />
              Consent Management
            </h1>
            <p className="text-slate-505 dark:text-slate-400 mt-2 text-sm max-w-2xl">
              Explicitly authorize system identities to view your secure ledger records. Revoke, renew, or edit parameters in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {role === 'Patient' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-750 hover:to-indigo-750 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-purple-600/15 hover:shadow-purple-700/20 transition-all cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                Create Consent
              </button>
            )}

            <div className="flex items-center gap-2 text-xs font-mono bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 px-3.5 py-2.5 rounded-xl text-purple-650 dark:text-purple-405 shadow-sm">
              <FiCpu className="animate-spin text-purple-500 w-3.5 h-3.5" />
              <span>CONSENT LEDGER ONLINE</span>
            </div>
          </div>
        </div>

        {/* Filter and Search controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search consent policies by name, role, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-medium"
              />
            </div>

            {/* Role Filter */}
            <div className="md:col-span-3">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-3.5 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Doctor">Doctors</option>
                <option value="Nurse">Nurses</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-3.5 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Consent</option>
                <option value="Revoked">Revoked</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

          </div>
        </div>

        {/* Split Audit workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block: Table List */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Granted Consent Registry</h3>
              <p className="text-slate-500 dark:text-slate-455 text-[11px] mt-0.5">Click a consent row to retrieve its mock blockchain audit logs and timeline.</p>
            </div>

            {filteredConsents.length === 0 ? (
              <div className="text-center py-16 text-slate-455 dark:text-slate-605 flex flex-col items-center justify-center">
                <FiSliders className="w-10 h-10 mb-2.5 opacity-30 animate-pulse" />
                <span className="text-xs font-bold">No active consent policies found</span>
                <span className="text-[10px] mt-0.5">Try adjusting your filter settings.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 pl-2">User details</th>
                      <th className="pb-3">Record Scope</th>
                      <th className="pb-3">Status</th>
                      {role === 'Patient' && <th className="pb-3 text-right pr-2">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-355 text-xs">
                    {filteredConsents.map((rec) => (
                      <tr 
                        key={rec.id}
                        onClick={() => setSelectedConsent(rec)}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all cursor-pointer ${
                          selectedConsent?.id === rec.id ? 'bg-purple-500/5 dark:bg-purple-500/5 border-l-2 border-purple-500 pl-1' : ''
                        }`}
                      >
                        {/* User details */}
                        <td className="py-4 pl-2 space-y-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FiUser className="w-3.5 h-3.5 text-slate-400" />
                            {rec.userName}
                          </span>
                          <span className="text-[9.5px] font-mono text-slate-455 uppercase tracking-wider block">{rec.userRole}</span>
                        </td>

                        {/* Record Scope & dates */}
                        <td className="py-4 space-y-1">
                          <span className="font-semibold text-slate-850 dark:text-slate-300 block">{rec.recordType}</span>
                          <div className="text-[9.5px] text-slate-450 space-y-0.5 leading-none">
                            <span className="block">Granted: {rec.grantedDate.split(' ')[0]}</span>
                            <span className="block">Expires: {rec.expiryDate.split(' ')[0]}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            rec.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                              : rec.status === 'Revoked'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              rec.status === 'Active' ? 'bg-emerald-500' : rec.status === 'Revoked' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}></span>
                            {rec.status}
                          </span>
                        </td>

                        {/* Actions (Patient-Only) */}
                        {role === 'Patient' && (
                          <td className="py-4 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                            {activeActionId === rec.id ? (
                              <FiCpu className="animate-spin text-purple-650 w-4 h-4 ml-auto" />
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleModifyClick(rec)}
                                  className="p-1.5 border border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl transition-all cursor-pointer"
                                  title="Modify Consent Parameters"
                                >
                                  <FiEdit3 className="w-3.5 h-3.5" />
                                </button>
                                
                                {rec.status === 'Active' ? (
                                  <button
                                    onClick={() => handleRevoke(rec.id)}
                                    className="p-1.5 border border-rose-500/20 text-rose-650 dark:text-rose-450 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                    title="Revoke Consent"
                                  >
                                    <FiX className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRenewClick(rec)}
                                    className="p-1.5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer"
                                    title="Renew Expired Consent"
                                  >
                                    <FiRefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Block: Audit Timeline panel */}
          <div className="lg:col-span-5 bg-slate-900 text-slate-100 border border-slate-950 p-6 rounded-3xl shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-450 flex items-center gap-1.5">
                <FiShield className="text-purple-400 animate-pulse" />
                Ledger Consent Audit
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {selectedConsent ? (
              <div className="space-y-6">
                
                {/* Header details block */}
                <div className="bg-slate-955/50 p-4 border border-slate-800/80 rounded-2xl space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">POLICY KEY</span>
                    <strong className="text-white">{selectedConsent.id}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">USER PROFILE</span>
                    <span className="text-white font-sans font-bold">{selectedConsent.userName} ({selectedConsent.userRole})</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">RECORD TYPE</span>
                    <span className="text-white truncate max-w-[140px] font-sans font-bold">{selectedConsent.recordType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">VALID UNTIL</span>
                    <span className="text-white font-sans font-semibold">{selectedConsent.expiryDate}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-1">MEMORANDUM / NOTES:</span>
                    <p className="text-slate-300 font-sans leading-relaxed bg-slate-900 p-2.5 rounded-xl border border-slate-950 font-normal">
                      {selectedConsent.notes}
                    </p>
                  </div>
                </div>

                {/* Timeline display */}
                <div className="space-y-5">
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Blockchain Event timeline</h4>
                  
                  <div className="relative pl-5 border-l-2 border-slate-800 space-y-6 ml-2">
                    {selectedConsent.timeline.map((event, idx) => (
                      <div key={idx} className="relative space-y-2 text-[11px]">
                        
                        {/* Event node */}
                        <span className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                          event.event.includes('Created') 
                            ? 'bg-emerald-500' 
                            : event.event.includes('Modified') || event.event.includes('Renewed')
                            ? 'bg-purple-500' 
                            : 'bg-rose-500'
                        }`}></span>

                        <div className="flex items-center justify-between">
                          <strong className="text-slate-200 font-bold">{event.event}</strong>
                          <span className="text-[9px] text-slate-500 font-mono">{event.timestamp}</span>
                        </div>

                        {/* Hash details */}
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900/60 font-mono text-[9px] text-slate-400 space-y-1">
                          <div className="flex justify-between">
                            <span>BLOCK HEIGHT:</span>
                            <span className="text-white">#{event.blockNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>CHAIN EVENT:</span>
                            <span className="text-purple-400 font-semibold">{event.contractEvent}</span>
                          </div>
                          <div className="pt-1 border-t border-slate-900/40">
                            <span className="block text-slate-500">TRANSACTION HASH:</span>
                            <span className="block text-slate-300 break-all select-all">{event.txId}</span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 text-slate-550 flex flex-col items-center justify-center">
                <FiActivity className="w-8 h-8 text-slate-700 mb-2" />
                <span className="text-[11px]">Select a policy entry to load the blockchain consensus timeline logs.</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 1. Modal: Create Consent */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-slate-800 dark:text-slate-100 animate-zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-405 flex items-center justify-center">
                  <FiShield className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                    Register Access Consent
                  </h3>
                  <p className="text-[9px] text-slate-505 font-mono">FABRIC CONSENT POLICY CONTRACT</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-semibold">
              {/* Select User */}
              <div className="space-y-1.5">
                <label className="block text-slate-505 dark:text-slate-400">Select Network Identity User</label>
                <select
                  value={createForm.userName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, userName: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  {defaultNetworkUsers.map(u => (
                    <option key={u.name} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Select Record Type */}
              <div className="space-y-1.5">
                <label className="block text-slate-505 dark:text-slate-400">Select Record Target Scope</label>
                <select
                  value={createForm.recordType}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, recordType: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="Cardiology Report">Cardiology Report</option>
                  <option value="Blood Panel Analysis">Blood Panel Analysis</option>
                  <option value="MRI Brain Scan">MRI Brain Scan</option>
                  <option value="General Health Screening">General Health Screening</option>
                </select>
              </div>

              {/* Expiration period */}
              <div className="space-y-1.5">
                <label className="block text-slate-550 dark:text-slate-400">Expiration Period</label>
                <select
                  value={createForm.duration}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="24 Hours">24 Hours (Clinical checkup)</option>
                  <option value="7 Days">7 Days (Short consultation)</option>
                  <option value="30 Days">30 Days (Ongoing Treatment)</option>
                </select>
              </div>

              {/* Purpose Notes */}
              <div className="space-y-1.5">
                <label className="block text-slate-550 dark:text-slate-400 font-bold">Explicit Authorization Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Specify notes or reasons regarding access bounds..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white placeholder-slate-400/80 focus:ring-1 focus:ring-purple-500 focus:outline-none font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800/85">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-955 text-slate-700 dark:text-slate-350 cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <FiCpu className="animate-spin w-4 h-4" />
                      Signing Block...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Authorize Consent
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Modify Consent */}
      {isModifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-6 text-slate-800 dark:text-slate-100 animate-zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center">
                  <FiEdit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Modify Consent Bounds
                  </h3>
                  <p className="text-[9px] text-slate-505 font-mono">REGISTRY RECORD UPDATE</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsModifyModalOpen(false)
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <FiX className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleModifySubmit} className="space-y-4 text-xs font-semibold">
              {/* Record type */}
              <div className="space-y-1.5">
                <label className="block text-slate-505 dark:text-slate-400">Modify Target Record Type</label>
                <select
                  value={modifyForm.recordType}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, recordType: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="Cardiology Report">Cardiology Report</option>
                  <option value="Blood Panel Analysis">Blood Panel Analysis</option>
                  <option value="MRI Brain Scan">MRI Brain Scan</option>
                  <option value="General Health Screening">General Health Screening</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-slate-550 dark:text-slate-400">Modify Authorization Notes</label>
                <textarea
                  value={modifyForm.notes}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes specifying context..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white placeholder-slate-400/80 focus:ring-1 focus:ring-purple-500 focus:outline-none font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800/85">
                <button
                  type="button"
                  onClick={() => setIsModifyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-955 text-slate-700 dark:text-slate-350 cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <FiCpu className="animate-spin w-4 h-4" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Save Modifications
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Renew Consent */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-6 text-slate-800 dark:text-slate-100 animate-zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center">
                  <FiRefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Renew Consent Policy
                  </h3>
                  <p className="text-[9px] text-slate-505 font-mono">POLICY RENEWAL</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsRenewModalOpen(false)
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <FiX className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="block text-slate-505 dark:text-slate-400">Select Renewal Period</label>
                <select
                  value={renewForm.duration}
                  onChange={(e) => setRenewForm(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="24 Hours">24 Hours (Clinical checkup)</option>
                  <option value="7 Days">7 Days (Short consultation)</option>
                  <option value="30 Days">30 Days (Ongoing Treatment)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800/85">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-955 text-slate-700 dark:text-slate-350 cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <FiCpu className="animate-spin w-4 h-4" />
                      Consensus...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Renew Consent
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
