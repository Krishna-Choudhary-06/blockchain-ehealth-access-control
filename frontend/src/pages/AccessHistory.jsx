import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { 
  FiClock, FiUser, FiActivity, FiCheck, FiX, FiRefreshCw,
  FiCpu, FiHash, FiShield, FiAlertCircle, FiDatabase,
  FiSearch, FiFilter, FiCalendar, FiSliders, FiList, FiEdit3
} from 'react-icons/fi'

export default function AccessHistory() {
  const { user } = useAuth()
  const role = user?.role || 'Patient'

  // Access History state
  const [history, setHistory] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  // Extend Modal state
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [extendingRecord, setExtendingRecord] = useState(null)
  const [extendDuration, setExtendDuration] = useState('7 Days')
  const [isExtending, setIsExtending] = useState(false)
  const [isRevoking, setIsRevoking] = useState(null) // holds ID of record being revoked

  // Seed / Load Access History from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('access_history')
    if (saved) {
      const parsed = JSON.parse(saved)
      setHistory(parsed)
      if (parsed.length > 0) {
        setSelectedRecord(parsed[0])
      }
    } else {
      const defaultHistory = [
        {
          id: "HIST-102948",
          userName: "Dr. Sarah Miller",
          userRole: "Doctor",
          recordType: "Cardiology Report",
          recordId: "PAT-8820",
          grantedDate: "2026-06-17 10:30:15",
          expiryDate: "2026-06-24 10:30:15",
          status: "Active",
          timeline: [
            {
              event: "Access Granted",
              timestamp: "2026-06-17 10:30:15",
              blockNumber: 412,
              txId: "0x3a9a141b7829ac252dbef23f8b0e7a2b0e9f1a2380d90d81014ac2460d5b78ab",
              contractEvent: "AccessControl.GrantAccess"
            }
          ]
        },
        {
          id: "HIST-382910",
          userName: "Dr. James Watson",
          userRole: "Doctor",
          recordType: "Blood Panel Analysis",
          recordId: "PAT-3491",
          grantedDate: "2026-06-10 14:22:10",
          expiryDate: "2026-06-11 14:22:10",
          status: "Expired",
          timeline: [
            {
              event: "Access Granted",
              timestamp: "2026-06-10 14:22:10",
              blockNumber: 395,
              txId: "0x8823f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb00",
              contractEvent: "AccessControl.GrantAccess"
            }
          ]
        },
        {
          id: "HIST-553218",
          userName: "Nurse Kelly Smith",
          userRole: "Nurse",
          recordType: "MRI Brain Scan",
          recordId: "PAT-1092",
          grantedDate: "2026-06-12 09:12:44",
          expiryDate: "2026-06-19 09:12:44",
          status: "Revoked",
          timeline: [
            {
              event: "Access Granted",
              timestamp: "2026-06-12 09:12:44",
              blockNumber: 402,
              txId: "0x1092aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e5",
              contractEvent: "AccessControl.GrantAccess"
            },
            {
              event: "Access Revoked",
              timestamp: "2026-06-14 11:40:15",
              blockNumber: 405,
              txId: "0x5532ab99f8313219fb00e234baad9923ffee5532ab99f8313219fb00e234ba9",
              contractEvent: "AccessControl.RevokeAccess"
            }
          ]
        }
      ]
      localStorage.setItem('access_history', JSON.stringify(defaultHistory))
      setHistory(defaultHistory)
      setSelectedRecord(defaultHistory[0])
    }
  }, [])

  const saveHistory = (updated) => {
    localStorage.setItem('access_history', JSON.stringify(updated))
    setHistory(updated)
    // Sync selected record view
    if (selectedRecord) {
      const match = updated.find(h => h.id === selectedRecord.id)
      if (match) setSelectedRecord(match)
    }
  }

  // Action: Revoke Access
  const handleRevoke = async (recordId) => {
    setIsRevoking(recordId)
    const toastId = toast.loading('Invoking RevokeAccess smart contract transaction...')

    try {
      // Simulate blockchain network latency (1.2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1200))

      const updatedHistory = history.map(rec => {
        if (rec.id === recordId) {
          const newBlock = (rec.timeline[rec.timeline.length - 1]?.blockNumber || 410) + Math.floor(Math.random() * 5) + 1
          const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')

          const newTimelineEvent = {
            event: "Access Revoked",
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            blockNumber: newBlock,
            txId: mockTxHash,
            contractEvent: "AccessControl.RevokeAccess"
          }

          return {
            ...rec,
            status: 'Revoked',
            timeline: [...rec.timeline, newTimelineEvent]
          }
        }
        return rec
      })

      saveHistory(updatedHistory)
      toast.success('Access privilege successfully revoked from ledger.', { id: toastId })
    } catch (err) {
      toast.error(`Transaction failed: ${err.message}`, { id: toastId })
    } finally {
      setIsRevoking(null)
    }
  }

  // Action: Extend Access
  const handleExtendSubmit = async (e) => {
    e.preventDefault()
    if (!extendingRecord) return

    setIsExtending(true)
    const toastId = toast.loading('Updating policy parameters in smart contract...')

    try {
      // Simulate blockchain latency (1.4 seconds)
      await new Promise(resolve => setTimeout(resolve, 1400))

      const parsedDurationDays = extendDuration === '24 Hours' ? 1 : extendDuration === '7 Days' ? 7 : 30
      
      const updatedHistory = history.map(rec => {
        if (rec.id === extendingRecord.id) {
          // Calculate new expiry date based on current state (extend from now or from old expiry)
          const oldExpiry = new Date(rec.expiryDate)
          const baseDate = oldExpiry > new Date() ? oldExpiry : new Date()
          baseDate.setDate(baseDate.getDate() + parsedDurationDays)
          const newExpiryDateStr = baseDate.toISOString().replace('T', ' ').substring(0, 19)

          const newBlock = (rec.timeline[rec.timeline.length - 1]?.blockNumber || 410) + Math.floor(Math.random() * 5) + 1
          const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')

          const newTimelineEvent = {
            event: "Access Updated",
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            blockNumber: newBlock,
            txId: mockTxHash,
            contractEvent: "AccessControl.UpdateAccess"
          }

          return {
            ...rec,
            status: 'Active',
            expiryDate: newExpiryDateStr,
            timeline: [...rec.timeline, newTimelineEvent]
          }
        }
        return rec
      })

      saveHistory(updatedHistory)
      toast.success(`Access period successfully extended by ${extendDuration}.`, { id: toastId })
      setIsExtendModalOpen(false)
      setExtendingRecord(null)
    } catch (err) {
      toast.error(`Consensus update failed: ${err.message}`, { id: toastId })
    } finally {
      setIsExtending(false)
    }
  }

  // Get list based on search and filters
  const getFilteredHistory = () => {
    let filtered = history

    // Filter by Patient name scope
    if (role === 'Patient') {
      // Patients only see the history of access granted on their files
      // alex carter matches the mock patient
      filtered = history.filter(item => item.userName.toLowerCase() !== user?.name?.toLowerCase())
    } else if (role === 'Doctor' || role === 'Nurse') {
      // Doctors/Nurses see access granted specifically to them
      filtered = history.filter(item => item.userName.toLowerCase() === user?.name?.toLowerCase())
    } // Admin sees all system logs

    // Filter by Role Select
    if (filterRole !== 'All') {
      filtered = filtered.filter(item => item.userRole === filterRole)
    }

    // Filter by Status Select
    if (filterStatus !== 'All') {
      filtered = filtered.filter(item => item.status === filterStatus)
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.userName.toLowerCase().includes(q) ||
        item.userRole.toLowerCase().includes(q) ||
        item.recordType.toLowerCase().includes(q) ||
        item.recordId.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      )
    }

    return filtered
  }

  const filteredHistory = getFilteredHistory()

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
              <FiSliders className="text-purple-650 dark:text-purple-400" />
              Access Clearance History
            </h1>
            <p className="text-slate-505 dark:text-slate-400 mt-2 text-sm max-w-2xl">
              Audit current and historical system permissions. Patient administrators can modify, extend, or terminate network access keys.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 px-3.5 py-2.5 rounded-xl text-purple-650 dark:text-purple-400 shadow-sm self-start md:self-center">
            <FiDatabase className="text-purple-500 w-4 h-4" />
            <span>HYPERLEDGER FABRIC STATE REGISTRY</span>
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
                placeholder="Search by name, role, file type, or ID..."
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
                <option value="Active">Active Clearance</option>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Permissions Matrix</h3>
              <p className="text-slate-500 dark:text-slate-455 text-[11px] mt-0.5">Click any permission record to view the blockchain audit log.</p>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-16 text-slate-450 dark:text-slate-605 flex flex-col items-center justify-center">
                <FiList className="w-10 h-10 mb-2.5 opacity-30 animate-pulse" />
                <span className="text-xs font-bold">No access privileges found</span>
                <span className="text-[10px] mt-0.5">Try adjusting your filters or search fields.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 pl-2">User / Role</th>
                      <th className="pb-3">Record Type</th>
                      <th className="pb-3">Status</th>
                      {role === 'Patient' && <th className="pb-3 text-right pr-2">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-355 text-xs">
                    {filteredHistory.map((rec) => (
                      <tr 
                        key={rec.id}
                        onClick={() => setSelectedRecord(rec)}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all cursor-pointer ${
                          selectedRecord?.id === rec.id ? 'bg-purple-500/5 dark:bg-purple-500/5 border-l-2 border-purple-500 pl-1' : ''
                        }`}
                      >
                        {/* User & Role */}
                        <td className="py-4 pl-2 space-y-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FiUser className="w-3.5 h-3.5 text-slate-400" />
                            {rec.userName}
                          </span>
                          <span className="text-[9.5px] font-mono text-slate-450 uppercase tracking-wider block">{rec.userRole}</span>
                        </td>

                        {/* Record Type & dates */}
                        <td className="py-4 space-y-1">
                          <span className="font-semibold text-slate-850 dark:text-slate-300 block">{rec.recordType}</span>
                          <div className="text-[9px] text-slate-450 space-y-0.5 leading-none">
                            <span className="block">Granted: {rec.grantedDate.split(' ')[0]}</span>
                            <span className="block">Expires: {rec.expiryDate.split(' ')[0]}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            rec.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                              : rec.status === 'Revoked'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20'
                          }`}>
                            {rec.status}
                          </span>
                        </td>

                        {/* Actions (Patient-Only) */}
                        {role === 'Patient' && (
                          <td className="py-4 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                            {isRevoking === rec.id ? (
                              <FiCpu className="animate-spin text-purple-650 w-4 h-4 ml-auto" />
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setExtendingRecord(rec)
                                    setIsExtendModalOpen(true)
                                  }}
                                  className="p-1.5 border border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl transition-all cursor-pointer"
                                  title="Extend Access Duration"
                                >
                                  <FiCalendar className="w-3.5 h-3.5" />
                                </button>
                                {rec.status === 'Active' && (
                                  <button
                                    onClick={() => handleRevoke(rec.id)}
                                    className="p-1.5 border border-rose-500/20 text-rose-650 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                    title="Revoke Permission"
                                  >
                                    <FiX className="w-3.5 h-3.5" />
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <FiShield className="text-purple-400 animate-pulse" />
                Ledger Policy Timeline
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {selectedRecord ? (
              <div className="space-y-6">
                
                {/* Header overview details */}
                <div className="bg-slate-950/50 p-4 border border-slate-800/80 rounded-2xl space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">POLICY ID</span>
                    <strong className="text-white">{selectedRecord.id}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">RECORD TARGET</span>
                    <span className="text-white truncate max-w-[140px] font-sans font-bold">{selectedRecord.recordType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">SUBJECT NAME</span>
                    <span className="text-white font-sans font-bold">{selectedRecord.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CLEARANCE STATE</span>
                    <span className={`font-bold ${
                      selectedRecord.status === 'Active' ? 'text-emerald-400' : selectedRecord.status === 'Revoked' ? 'text-rose-400' : 'text-amber-400'
                    }`}>{selectedRecord.status}</span>
                  </div>
                </div>

                {/* Timeline display */}
                <div className="space-y-5">
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Historical Audit Logs</h4>
                  
                  <div className="relative pl-5 border-l-2 border-slate-800 space-y-6 ml-2">
                    {selectedRecord.timeline.map((event, idx) => (
                      <div key={idx} className="relative space-y-2 text-[11px]">
                        
                        {/* Timeline marker node */}
                        <span className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                          event.event === 'Access Granted' 
                            ? 'bg-emerald-500' 
                            : event.event === 'Access Updated' 
                            ? 'bg-purple-500' 
                            : 'bg-rose-500'
                        }`}></span>

                        <div className="flex items-center justify-between">
                          <strong className="text-slate-200 font-bold">{event.event}</strong>
                          <span className="text-[9px] text-slate-500 font-mono">{event.timestamp}</span>
                        </div>

                        {/* Tx and Block Metadata */}
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900/60 font-mono text-[9px] text-slate-400 space-y-1">
                          <div className="flex justify-between">
                            <span>BLOCK HEIGHT:</span>
                            <span className="text-white">#{event.blockNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>EVENT TRIGGER:</span>
                            <span className="text-purple-400">{event.contractEvent}</span>
                          </div>
                          <div className="pt-1 border-t border-slate-900/40">
                            <span className="block text-slate-500">TRANSACTION ID (HASH):</span>
                            <span className="block text-slate-300 break-all select-all">{event.txId}</span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 flex flex-col items-center justify-center">
                <FiActivity className="w-8 h-8 text-slate-700 mb-2" />
                <span className="text-[11px]">Select a policy entry in the permission matrix to load the blockchain audit timeline.</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Extension Period modal */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-6 text-slate-800 dark:text-slate-100 animate-zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center">
                  <FiCalendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Extend Policy Expiry
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono">REGISTRY POLICY UPDATE</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsExtendModalOpen(false)
                  setExtendingRecord(null)
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <FiX className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-900 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">SUBJECT:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-sans font-bold">{extendingRecord?.userName}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">RECORD ID:</span>
                  <span className="text-slate-800 dark:text-slate-200">{extendingRecord?.recordId}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">CURRENT EXPIRY:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{extendingRecord?.expiryDate.split(' ')[0]}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-505 dark:text-slate-400">Extension Period</label>
                <select
                  value={extendDuration}
                  onChange={(e) => setExtendDuration(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="24 Hours">24 Hours (Immediate clinical access)</option>
                  <option value="7 Days">7 Days (Short consultation block)</option>
                  <option value="30 Days">30 Days (Extended treatment plan)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsExtendModalOpen(false)
                    setExtendingRecord(null)
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExtending}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isExtending ? (
                    <>
                      <FiCpu className="animate-spin w-4 h-4" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Extend Access
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
