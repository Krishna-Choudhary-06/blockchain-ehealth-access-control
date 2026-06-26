import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { 
  FiFileText, FiUserCheck, FiCpu, FiUsers, FiHardDrive, FiActivity,
  FiShield, FiUser, FiCheck, FiX, FiPlus, FiHash, FiClock
} from 'react-icons/fi'

export default function AccessRequests() {
  const { user } = useAuth()
  const role = user?.role || 'Patient'

  const [accessRequests, setAccessRequests] = useState([])
  const [loadingActionId, setLoadingActionId] = useState(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false)
  const [requestFormData, setRequestFormData] = useState({
    patientId: 'PAT-8820',
    recordType: 'Cardiology Report',
    purpose: '',
    duration: '24 Hours'
  })
  const [patients, setPatients] = useState([])

  // Load access requests & registered patients on mount
  useEffect(() => {
    const saved = localStorage.getItem('access_requests')
    if (saved) {
      setAccessRequests(JSON.parse(saved))
    } else {
      const defaultRequests = [
        {
          id: "REQ-892014",
          patientId: "PAT-8820",
          patientName: "Patient Alex Carter",
          recordType: "Cardiology Report",
          purpose: "Cardiovascular evaluation for chest pains",
          duration: "7 Days",
          doctorName: "Dr. Sarah Miller",
          doctorRole: "Doctor",
          status: "Pending",
          timestamp: "2026-06-17 10:30:15",
          txHash: "0x3a9a141b7829ac252dbef23f8b0e7a2b0e9f1a2380d90d81014ac2460d5b78ab",
          txTimestamp: "2026-06-17 10:30:15"
        },
        {
          id: "REQ-382910",
          patientId: "PAT-3491",
          patientName: "Patient Alex Carter",
          recordType: "Blood Panel Analysis",
          purpose: "Metabolic screening follow-up",
          duration: "30 Days",
          doctorName: "Dr. James Watson",
          doctorRole: "Doctor",
          status: "Approved",
          timestamp: "2026-06-15 14:22:10",
          txHash: "0x8823f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb00",
          txTimestamp: "2026-06-15 14:23:00"
        },
        {
          id: "REQ-102948",
          patientId: "PAT-1092",
          patientName: "Patient Alex Carter",
          recordType: "MRI Brain Scan",
          purpose: "Chronic Migraine Evaluation",
          duration: "24 Hours",
          doctorName: "Dr. Helen Cho",
          doctorRole: "Doctor",
          status: "Rejected",
          timestamp: "2026-06-16 09:12:44",
          txHash: "0x1092aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e5",
          txTimestamp: "2026-06-16 09:13:10"
        }
      ]
      localStorage.setItem('access_requests', JSON.stringify(defaultRequests))
      setAccessRequests(defaultRequests)
    }

    // Load registered patients
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
    const patientUsers = users.filter(u => u.role === 'Patient')
    const defaultPatients = [
      { userId: 'PAT-8820', name: 'Patient Alex Carter', defaultRecord: 'Cardiology Report' },
      { userId: 'PAT-3491', name: 'Patient Alice Johnson', defaultRecord: 'Blood Panel Analysis' },
      { userId: 'PAT-1092', name: 'Patient Bob Smith', defaultRecord: 'MRI Brain Scan' },
      { userId: 'PAT-5420', name: 'Patient Alex Carter', defaultRecord: 'General Health Screening' }
    ]
    const combined = [...defaultPatients]
    patientUsers.forEach(pu => {
      if (!combined.some(c => c.userId === pu.userId)) {
        combined.push({
          userId: pu.userId,
          name: pu.name,
          defaultRecord: 'General Health Screening'
        })
      }
    })
    setPatients(combined)
  }, [])

  const saveAccessRequests = (updatedRequests) => {
    localStorage.setItem('access_requests', JSON.stringify(updatedRequests))
    setAccessRequests(updatedRequests)
  }

  const handleDoctorSubmitRequest = async (e) => {
    e.preventDefault()
    if (!requestFormData.purpose.trim()) {
      toast.error('Purpose of access is required.')
      return
    }

    setIsRequestSubmitting(true)
    const toastId = toast.loading('Mining access request block into blockchain ledger...')

    try {
      await new Promise(resolve => setTimeout(resolve, 1200))

      const newRequestId = 'REQ-' + Math.floor(100000 + Math.random() * 900000)
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')

      const selectedPatient = patients.find(p => p.userId === requestFormData.patientId)
      const patientName = selectedPatient ? selectedPatient.name : 'Unknown Patient'

      const newRequest = {
        id: newRequestId,
        patientId: requestFormData.patientId,
        patientName: patientName,
        recordType: requestFormData.recordType,
        purpose: requestFormData.purpose,
        duration: requestFormData.duration,
        doctorName: user?.name || 'Dr. Sarah Miller',
        doctorRole: user?.role || 'Doctor',
        status: 'Pending',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        txHash: mockTxHash,
        txTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }

      const updatedRequests = [newRequest, ...accessRequests]
      saveAccessRequests(updatedRequests)
      
      toast.success('Access Request successfully submitted to ledger!', { id: toastId })
      setIsRequestModalOpen(false)
      setRequestFormData({
        patientId: 'PAT-8820',
        recordType: 'Cardiology Report',
        purpose: '',
        duration: '24 Hours'
      })
    } catch (error) {
      toast.error(`Consensus failed: ${error.message}`, { id: toastId })
    } finally {
      setIsRequestSubmitting(false)
    }
  }

  const handlePatientAction = async (requestId, nextStatus) => {
    setLoadingActionId(requestId)
    const toastId = toast.loading(`Committing consensus transaction for status: ${nextStatus}...`)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const updatedRequests = accessRequests.map(req => {
        if (req.id === requestId) {
          const newTxHash = '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')
          
          return {
            ...req,
            status: nextStatus,
            txHash: newTxHash,
            txTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
          }
        }
        return req
      })

      if (nextStatus === 'Approved') {
        const targetRequest = accessRequests.find(r => r.id === requestId)
        if (targetRequest) {
          const currentHistory = JSON.parse(localStorage.getItem('access_history') || '[]')
          const durationStr = targetRequest.duration || '24 Hours'
          const days = durationStr === '24 Hours' ? 1 : durationStr === '7 Days' ? 7 : 30
          const exp = new Date()
          exp.setDate(exp.getDate() + days)

          const historyId = 'HIST-' + Math.floor(100000 + Math.random() * 900000)
          const txHash = '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')

          const newHistoryEntry = {
            id: historyId,
            userName: targetRequest.doctorName,
            userRole: targetRequest.doctorRole,
            recordType: targetRequest.recordType,
            recordId: targetRequest.patientId,
            grantedDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
            expiryDate: exp.toISOString().replace('T', ' ').substring(0, 19),
            status: 'Active',
            timeline: [
              {
                event: "Access Granted",
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                blockNumber: 413,
                txId: txHash,
                contractEvent: "AccessControl.GrantAccess"
              }
            ]
          }
          localStorage.setItem('access_history', JSON.stringify([newHistoryEntry, ...currentHistory]))
        }
      }

      saveAccessRequests(updatedRequests)
      toast.success(`Access Request ${nextStatus === 'Approved' ? 'Approved & Enrolled' : 'Rejected'} on ledger!`, { id: toastId })
    } catch (error) {
      toast.error(`Transaction failed: ${error.message}`, { id: toastId })
    } finally {
      setLoadingActionId(null)
    }
  }

  // Filter requests depending on role
  const filtered = role === 'Patient' 
    ? accessRequests.filter(req => req.patientName.toLowerCase().includes(user?.name?.toLowerCase() || 'alex carter'))
    : role === 'Doctor'
    ? accessRequests.filter(req => req.doctorName.toLowerCase() === user?.name?.toLowerCase())
    : accessRequests

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FiShield className="text-purple-600 dark:text-purple-400" />
            Blockchain Access Control Requests
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Manage, request, and verify decentralized cryptographic record permissions.
          </p>
        </div>

        {role === 'Doctor' && (
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Request Record Access
          </button>
        )}
      </div>

      {/* Sharing Workflow Visualization (Phase 11) */}
      <div className="w-full overflow-hidden p-6 rounded-3xl bg-slate-950 border border-slate-850 shadow-md relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-indigo-500/5 to-transparent rounded-3xl pointer-events-none" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2 relative z-10">
          <FiActivity className="text-purple-500 w-4 h-4 animate-pulse" /> Cryptographic Consent Lifecycle Workflow
        </h3>
        
        <div className="relative z-10 max-w-4xl mx-auto py-2">
          {/* SVG Canvas for Flow Connections */}
          <svg className="w-full hidden md:block absolute top-8 left-0 h-10 overflow-visible pointer-events-none z-0">
            <defs>
              <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <path d="M 60,10 H 650" fill="none" stroke="url(#flowGrad)" strokeWidth="2.5" strokeDasharray="6 6" />
          </svg>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg relative transition-all duration-300">
                <FiPlus className="w-6 h-6" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-purple-600 border-2 border-slate-950 text-[10px] font-bold text-white flex items-center justify-center">1</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 block">Doctor Request</span>
                <span className="text-[10px] text-slate-500 block max-w-[160px] leading-normal">Doctor submits record request query to ledger</span>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg relative transition-all duration-300">
                <FiUserCheck className="w-6 h-6" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-600 border-2 border-slate-950 text-[10px] font-bold text-white flex items-center justify-center">2</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 block">Patient Consent</span>
                <span className="text-[10px] text-slate-500 block max-w-[160px] leading-normal">Patient signs and approves request with private key</span>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg relative transition-all duration-300">
                <FiCpu className="w-6 h-6" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 border-2 border-slate-950 text-[10px] font-bold text-white flex items-center justify-center">3</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 block">ABAC Validation</span>
                <span className="text-[10px] text-slate-500 block max-w-[160px] leading-normal">Fabric validation peers evaluate attribute criteria</span>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg relative transition-all duration-300">
                <FiFileText className="w-6 h-6" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 text-[10px] font-bold text-white flex items-center justify-center">4</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 block">Record Decryption</span>
                <span className="text-[10px] text-slate-500 block max-w-[160px] leading-normal">Doctor decrypts files using consensus-granted key</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h3 className="text-sm font-bold text-slate-855 dark:text-slate-300 uppercase tracking-wider">
            {role === 'Patient' ? 'Incoming Requests Querying Your Records' : 'Your Submitted Access Queries'}
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-450 dark:text-slate-600 flex flex-col items-center justify-center">
            <FiFileText className="w-12 h-12 mb-3 opacity-30 animate-pulse text-purple-600" />
            <span className="text-xs font-semibold">No requests registered on this channel</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Request Info</th>
                  <th className="pb-3">Clearance Target</th>
                  <th className="pb-3">Purpose of Access</th>
                  <th className="pb-3">On-Chain Transaction</th>
                  <th className="pb-3 text-right pr-2">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="py-4 pl-2 space-y-0.5">
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 font-bold">
                        <FiHash className="text-purple-600 w-3.5 h-3.5" />
                        {req.id}
                      </span>
                      <span className="text-[10px] text-slate-450 font-mono block">By {req.doctorName} ({req.doctorRole})</span>
                    </td>
                    <td className="py-4 font-semibold text-slate-955 dark:text-slate-300">
                      {req.recordType}
                      <span className="text-[9.5px] font-mono text-slate-455 dark:text-slate-500 block font-normal">Patient ID: {req.patientId}</span>
                    </td>
                    <td className="py-4 text-slate-550 dark:text-slate-405 truncate max-w-xs" title={req.purpose}>{req.purpose}</td>
                    <td className="py-4 font-mono text-[9px] text-slate-450 dark:text-slate-500 truncate max-w-[120px]" title={req.txHash}>
                      <span className="text-slate-500">Hash:</span> {req.txHash}
                    </td>
                    <td className="py-4 text-right pr-2">
                      {role === 'Patient' && req.status === 'Pending' ? (
                        loadingActionId === req.id ? (
                          <div className="flex items-center justify-end gap-1.5 text-xs text-purple-600 font-mono">
                            <FiCpu className="animate-spin w-4 h-4" />
                            <span>Approving...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handlePatientAction(req.id, 'Approved')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handlePatientAction(req.id, 'Rejected')}
                              className="px-2.5 py-1.5 border border-rose-550/30 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <FiX className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border ${
                          req.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                            : req.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctor Access Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white leading-tight">
                  Request Record Clearance
                </h3>
                <span className="text-[9px] uppercase font-mono bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded font-bold">
                  ABAC Node Query
                </span>
              </div>
            </div>

            <form onSubmit={handleDoctorSubmitRequest} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Target Patient Record
                </label>
                <select
                  value={requestFormData.patientId}
                  onChange={(e) => {
                    const selectedPat = patients.find(p => p.userId === e.target.value)
                    setRequestFormData(prev => ({ 
                      ...prev, 
                      patientId: e.target.value,
                      recordType: selectedPat ? selectedPat.defaultRecord || 'General Health Screening' : 'General Health Screening'
                    }))
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer text-xs font-semibold"
                >
                  {patients.map(p => (
                    <option key={p.userId} value={p.userId}>
                      {p.userId}: {p.name} ({p.defaultRecord || 'General Health Screening'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Purpose of Access
                </label>
                <textarea
                  value={requestFormData.purpose}
                  onChange={(e) => setRequestFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Provide clinical justification..."
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-855 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none text-xs h-20"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Access Window Duration
                </label>
                <select
                  value={requestFormData.duration}
                  onChange={(e) => setRequestFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="24 Hours">24 Hours (Immediate audit)</option>
                  <option value="7 Days">7 Days (Short consultation)</option>
                  <option value="30 Days">30 Days (Treatment course)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-202 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-950 text-xs text-slate-700 dark:text-slate-350 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRequestSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
