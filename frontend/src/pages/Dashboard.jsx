import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  FiFileText, FiUserCheck, FiCpu, FiUsers, FiHardDrive, FiActivity,
  FiShield, FiSettings, FiUser, FiCheck, FiX, FiCopy, 
  FiAlertTriangle, FiLock, FiUnlock, FiKey
} from 'react-icons/fi'
import { decryptFile, decryptKeyForUser } from '../services/cryptoService'
import { downloadFile } from '../services/ipfsService'


export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role || 'Patient'
  const location = useLocation()
  const hash = location.hash || ''

  // Dynamic state metrics
  const [blocksMined, setBlocksMined] = useState(412)
  const [successReads, setSuccessReads] = useState(128)
  const [pendingReqs, setPendingReqs] = useState(2)
  const [networkUsers, setNetworkUsers] = useState(156)

  // Access Logs Table mock state data
  const [accessLogs, setAccessLogs] = useState([
    { id: 1, user: 'Dr. Sarah Miller', role: 'Doctor', action: 'Read File PAT-8820', status: 'Granted', timestamp: '2026-06-10 13:42:01' },
    { id: 2, user: 'Nurse Kelly Smith', role: 'Nurse', action: 'Read File PAT-8820', status: 'Denied', timestamp: '2026-06-10 13:40:15' },
    { id: 3, user: 'Patient Alex Carter', role: 'Patient', action: 'Read File PAT-1092', status: 'Granted', timestamp: '2026-06-10 13:12:44' },
    { id: 4, user: 'Dr. James Watson', role: 'Doctor', action: 'Write File PAT-3491', status: 'Granted', timestamp: '2026-06-10 12:44:59' },
    { id: 5, user: 'Unknown Peer', role: 'Doctor', action: 'Read File PAT-8820', status: 'Denied', timestamp: '2026-06-10 12:01:10' }
  ])
  // Simulated Patient Records (implementing Section 5)
  const [patientRecords, setPatientRecords] = useState(() => {
    const saved = localStorage.getItem('patient_records')
    const uploaded = saved ? JSON.parse(saved) : []
    const defaults = [
      { id: 'PAT-8820', name: 'PAT-8820: Cardiology Report', sensitivity: 'L0', ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco', uploadTime: '2026-06-10 13:42:01' },
      { id: 'PAT-3491', name: 'PAT-3491: Blood Panel Analysis', sensitivity: 'L1', ipfsHash: 'QmYwAPJzvHpXnN3WknFiJnKLwHCnL72vedxjQkDDP1mXWp8xyz', uploadTime: '2026-06-10 12:44:59' },
      { id: 'PAT-1092', name: 'PAT-1092: MRI Brain Scan', sensitivity: 'L2', ipfsHash: 'QmZpQRzvHpXnN3WknFiJnKLwHCnL72vedxjQkDDP1mXWq9abc', uploadTime: '2026-06-10 13:12:44' },
      { id: 'PAT-5420', name: 'PAT-5420: General Health Screening', sensitivity: 'L3', ipfsHash: 'QmT123zvHpXnN3WknFiJnKLwHCnL72vedxjQkDDP1mXWr0def', uploadTime: '2026-06-09 10:15:30' }
    ]
    const filteredDefaults = defaults.filter(d => !uploaded.some(u => u.id === d.id))
    return [...uploaded, ...filteredDefaults]
  })  // Simulated Patient Access History logs (implementing Section 4)
  const [patientAccessHistory] = useState([
    { id: 1, user: 'Doctor Amit', action: 'Viewed File', file: 'PAT-8820: Cardiology Report', date: '10 June 2026', time: '12:30 PM', status: 'Granted' },
    { id: 2, user: 'Nurse Kelly Smith', action: 'Read Attempt', file: 'PAT-8820: Cardiology Report', date: '10 June 2026', time: '12:28 PM', status: 'Denied', reason: 'Role permissions restriction (L0)' },
    { id: 3, user: 'Dr. Sarah Miller', action: 'Viewed File', file: 'PAT-8820: Cardiology Report', date: '10 June 2026', time: '11:15 AM', status: 'Granted' },
    { id: 4, user: 'Lab Tech Dave', action: 'Accessed Report', file: 'PAT-3491: Blood Panel Analysis', date: '09 June 2026', time: '04:45 PM', status: 'Granted' },
    { id: 5, user: 'Unknown Peer', action: 'Access Request', file: 'PAT-1092: MRI Brain Scan', date: '09 June 2026', time: '09:12 AM', status: 'Denied', reason: 'Consensus ABAC check failure' }
  ])

  // Doctor Specific States (for decrypting files)
  const [selectedRecordToDecrypt, setSelectedRecordToDecrypt] = useState(null)
  const [decryptedContent, setDecryptedContent] = useState('')
  const [isDecrypting, setIsDecrypting] = useState(false)

  // Settings state (Admin setting tuning parameters)
  const [settings, setSettings] = useState({
    keyLength: 'AES-256',
    consensusNodes: 4,
    enforceMfa: true,
    simulationSpeed: 3
  })

  // copy to clipboard helper
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  // Decryption action for Doctor
  const handleDecrypt = async (record) => {
    setIsDecrypting(true)
    setSelectedRecordToDecrypt(record)
    setDecryptedContent('')

    try {
      if (record.sharedKeys && record.ivHex) {
        // Real client-side decryption flow!
        const docKeysSaved = localStorage.getItem(`user_keys_${user.name}`)
        if (!docKeysSaved) {
          throw new Error(`RSA keys for ${user.name} not found in this client. Please register or re-login.`)
        }
        
        const docKeys = JSON.parse(docKeysSaved)
        const doctorUserId = docKeys.userId
        const privateKey = docKeys.privateKey

        const encryptedSymmetricKey = record.sharedKeys[doctorUserId]
        if (!encryptedSymmetricKey) {
          throw new Error(`Access Denied: You do not have security clearance for this record.`)
        }

        const aesKeyHex = await decryptKeyForUser(encryptedSymmetricKey, privateKey)
        const encryptedFileBuffer = await downloadFile(record.ipfsHash)
        const decryptedFileBuffer = await decryptFile(encryptedFileBuffer, aesKeyHex, record.ivHex)

        const dec = new TextDecoder()
        const plaintext = dec.decode(decryptedFileBuffer)
        setDecryptedContent(plaintext)
      } else {
        await new Promise(resolve => setTimeout(resolve, 1200))
        setDecryptedContent(
          record.id === 'PAT-8820'
            ? "PATIENT: Alex Carter\nDIAGNOSIS: Stable Angina, coronary circulation normal.\nLABS: Cholesterol 185 mg/dL, HDL 48 mg/dL, LDL 112 mg/dL.\nPRESCRIPTIONS: Aspirin 75mg q.d., Atorvastatin 20mg q.d.\nSTATUS: Checked by Dr. Sarah Miller. Condition stable."
            : record.id === 'PAT-3491'
            ? "PATIENT: Alice Johnson\nRESULTS: Fasting Blood Glucose: 92 mg/dL, HbA1c: 5.4% (Normal range).\nREMARKS: Metabolic profiles stable. Recommended annual review."
            : "PATIENT: Bob Smith\nDIAGNOSIS: Brain MRI displays no focal space-occupying lesions or vascular malformations.\nREMARKS: Symptoms indicate chronic migraine. Treatment protocol initiated."
        )
      }
    } catch (error) {
      console.error(error)
      toast.error(`Decryption failed: ${error.message}`)
      setDecryptedContent(`[ERROR] Decryption process terminated.\nReason: ${error.message}`)
    } finally {
      setIsDecrypting(false)
    }
  }

  // Stat cards configurations based on active role
  const statCards = {
    Patient: [
      { id: 1, label: 'My Enrolled Files', value: `${patientRecords.length}`, icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' },
      { id: 2, label: 'Authorized Doctors', value: '3', icon: FiUserCheck, color: 'text-blue-600 bg-blue-500/10' },
      { id: 3, label: 'Active Access Requests', value: `${pendingReqs > 0 ? pendingReqs + ' Pending' : 'None'}`, icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' }
    ],
    Doctor: [
      { id: 1, label: 'Assigned Patients', value: '3', icon: FiUsers, color: 'text-blue-600 bg-blue-500/10' },
      { id: 2, label: 'Requests Pending', value: `${pendingReqs}`, icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' },
      { id: 3, label: 'Successful File Reads', value: `${successReads}`, icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' }
    ],
    Nurse: [
      { id: 1, label: 'Lab Reports Accessible', value: '12', icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' },
      { id: 2, label: 'Access Requests Granted', value: '34', icon: FiUserCheck, color: 'text-blue-600 bg-blue-500/10' },
      { id: 3, label: 'Pending Action Items', value: `${pendingReqs}`, icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' }
    ],
    Admin: [
      { id: 1, label: 'Peer Nodes Connected', value: '4 / 4', icon: FiCpu, color: 'text-emerald-600 bg-emerald-500/10' },
      { id: 2, label: 'Registered Network Users', value: `${networkUsers}`, icon: FiUsers, color: 'text-purple-600 bg-purple-500/10' },
      { id: 3, label: 'Total Blocks Mined', value: `${blocksMined}`, icon: FiHardDrive, color: 'text-blue-600 bg-blue-500/10' }
    ]
  }

  const activeStats = statCards[role] || statCards.Patient

  // Set up refresh simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      const docNames = ['Dr. Sarah Miller', 'Dr. James Watson', 'Dr. Helen Cho', 'Dr. Robert Carter', 'Dr. Emily Vance']
      const nurseNames = ['Nurse Kelly Smith', 'Nurse John Davis', 'Nurse Clara Barton']
      const patientNames = ['Patient Alex Carter', 'Patient Alice Johnson', 'Patient Bob Smith']
      const roles = ['Doctor', 'Nurse', 'Patient']
      
      const chosenRole = roles[Math.floor(Math.random() * roles.length)]
      let user
      let action
      let status

      if (chosenRole === 'Doctor') {
        user = docNames[Math.floor(Math.random() * docNames.length)]
        action = `Read File PAT-${Math.floor(1000 + Math.random() * 9000)}`
        status = Math.random() > 0.15 ? 'Granted' : 'Denied'
      } else if (chosenRole === 'Nurse') {
        user = nurseNames[Math.floor(Math.random() * nurseNames.length)]
        action = `Read File PAT-${Math.floor(1000 + Math.random() * 9000)}`
        status = Math.random() > 0.7 ? 'Granted' : 'Denied'
      } else {
        user = patientNames[Math.floor(Math.random() * patientNames.length)]
        action = `Read File PAT-${Math.floor(1000 + Math.random() * 9000)}`
        status = 'Granted'
      }

      const newLog = {
        id: Date.now(),
        user,
        role: chosenRole,
        action,
        status,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }

      setAccessLogs(prev => [newLog, ...prev].slice(0, 6))
      setBlocksMined(prev => prev + 1)
      if (status === 'Granted' && chosenRole === 'Doctor') {
        setSuccessReads(prev => prev + 1)
      }
      setPendingReqs(Math.floor(Math.random() * 4))
      
      if (Math.random() > 0.8) {
        setNetworkUsers(prev => prev + 1)
      }

    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Helper check for clearance badges (implementing Section 5 Access Matrix)
  const getRoleAccess = (sensitivity, roleToCheck) => {
    if (roleToCheck === 'Doctor') return true
    if (roleToCheck === 'Lab') return sensitivity !== 'L0'
    if (roleToCheck === 'Nurse') return (sensitivity === 'L2' || sensitivity === 'L3')
    if (roleToCheck === 'Staff') return (sensitivity === 'L2' || sensitivity === 'L3')
    if (roleToCheck === 'Public') return sensitivity === 'L3'
    return false
  }

  // --- RENDER SECTION ROUTER ---
  
  // 1. DEFAULT OVERVIEW VIEW (with Section 7 Security Alerts Section)
  const renderDefault = () => (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Workspace Overview</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Real-time ledger updates and attribute evaluation audit trail.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {activeStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 flex items-center justify-between shadow-sm dark:shadow-none hover:shadow-md dark:hover:border-slate-800 transition-all duration-200"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-455 block">{stat.label}</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Security Threat Intelligence Alerts (Section 7) */}
      <div className="bg-red-500/5 dark:bg-rose-955/10 border border-red-500/20 dark:border-rose-900/30 p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-red-500/10 dark:border-rose-900/10 pb-3">
          <div className="flex items-center space-x-2">
            <FiShield className="text-red-500 dark:text-rose-450 w-5 h-5 animate-pulse" />
            <h3 className="text-sm font-bold text-red-700 dark:text-rose-400 uppercase tracking-wider">Security Threat Intelligence & Alerts</h3>
          </div>
          <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-rose-400 text-[9px] font-bold rounded-full animate-pulse uppercase tracking-wide">
            Attacks Intercepted
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-4 rounded-2xl flex items-start space-x-3 shadow-sm hover:border-red-500/30 dark:hover:border-rose-900/40 transition-all">
            <FiAlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">Suspicious Access Detected</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Unknown peer signature check requested access to Patient Alex Carter's private ledger directory.
              </p>
              <span className="text-[9px] font-mono text-red-500 dark:text-rose-400 block mt-2 font-bold">IPFS Hash: QmXoypizjW3...</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-4 rounded-2xl flex items-start space-x-3 shadow-sm hover:border-red-500/30 dark:hover:border-rose-900/40 transition-all">
            <FiAlertTriangle className="text-rose-500 w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">Multiple Failed Attempts</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                3 failed cryptographic verification checking requests detected from peer node NIT-HOSP-3 within 15 seconds.
              </p>
              <span className="text-[9px] font-mono text-red-500 dark:text-rose-400 block mt-2 font-bold">Node ID: peer0.nit.com</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-4 rounded-2xl flex items-start space-x-3 shadow-sm hover:border-red-500/30 dark:hover:border-rose-900/40 transition-all">
            <FiAlertTriangle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">Unauthorized Access Attempt</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Nurse Kelly Smith requested access to L0 record PAT-8820. Attribute check denied (ABAC Policy restrict).
              </p>
              <span className="text-[9px] font-mono text-red-500 dark:text-rose-400 block mt-2 font-bold">Status Code: 403 (Forbidden)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Consensus Access Logs</h3>
          <p className="text-slate-500 dark:text-slate-455 text-xs mt-1">Immutable transaction audit trail committed to Hyperledger Fabric.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                <th className="pb-3.5 pl-2">User</th>
                <th className="pb-3.5">System Role</th>
                <th className="pb-3.5">Action Request</th>
                <th className="pb-3.5">Status</th>
                <th className="pb-3.5 text-right pr-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-355 text-xs">
              {accessLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors">
                  <td className="py-4 pl-2 font-semibold text-slate-900 dark:text-white">{log.user}</td>
                  <td className="py-4 font-mono text-[10px] uppercase">{log.role}</td>
                  <td className="py-4">{log.action}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      log.status === 'Granted'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        log.status === 'Granted' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}></span>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // 2. PATIENT RECORDS & PERMISSION VISIBILITY (implementing Section 5)
  const renderPatientRecords = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Uploaded Records</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Audit security clearance levels and attribute access grids set on the blockchain ledger.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {patientRecords.map((record) => (
          <div key={record.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{record.name}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[200px] md:max-w-md block" title={record.ipfsHash}>
                    IPFS: {record.ipfsHash}
                  </span>
                  <button onClick={() => handleCopy(record.ipfsHash)} className="text-purple-600 hover:text-purple-500 p-0.5 rounded cursor-pointer">
                    <FiCopy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-550 block">Uploaded: {record.uploadTime}</span>
                <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Level {record.sensitivity}
                </span>
              </div>
            </div>

            {/* Access Matrix (Section 5 Requirement) */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/80">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">Current Access Clearance Control Matrix</h5>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {['Doctor', 'Nurse', 'Lab', 'Staff', 'Public'].map((r) => {
                  const allowed = getRoleAccess(record.sensitivity, r)
                  return (
                    <div 
                      key={r} 
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                        allowed 
                          ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-450' 
                          : 'bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-455'
                      }`}
                    >
                      <span>{r}</span>
                      {allowed ? (
                        <FiCheck className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <FiX className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                {record.sensitivity === 'L0' && "* L0 restricts access only to Doctor. Nurses, staff and laboratory peers are denied."}
                {record.sensitivity === 'L1' && "* L1 grants authorization rights to Doctors and Laboratory technicians."}
                {record.sensitivity === 'L2' && "* L2 opens clearance to General Staff, Nurses, Doctors and Laboratories."}
                {record.sensitivity === 'L3' && "* L3 ledger files are cleared for public access without authentication parameters."}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // 3. RECORD OWNERSHIP VISIBILITY - WHO ACCESSED MY DATA (implementing Section 4)
  const renderPatientWhoAccessed = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Record Ownership Visibility</h2>
        <p className="text-slate-500 dark:text-slate-405 text-xs mt-1">Directly monitor which medical entities queried or requested access to your secure cases.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                <th className="pb-3.5 pl-2">User Identity</th>
                <th className="pb-3.5">Action Type</th>
                <th className="pb-3.5">Medical File Target</th>
                <th className="pb-3.5">Status Checked</th>
                <th className="pb-3.5">Date</th>
                <th className="pb-3.5 text-right pr-2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
              {patientAccessHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pl-2 font-semibold text-slate-955 dark:text-white flex items-center gap-1.5">
                    <FiUser className="text-purple-600 w-3.5 h-3.5" />
                    {item.user}
                  </td>
                  <td className="py-4 font-mono text-[10px] uppercase text-slate-550 dark:text-slate-400">{item.action}</td>
                  <td className="py-4 font-semibold">{item.file}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border ${
                      item.status === 'Granted'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">{item.date}</td>
                  <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // 4. DOCTOR RECORDS LIST
  const renderDoctorRecords = () => {
    // Map patient records to Doctor's workspace records
    const doctorPatients = patientRecords.map(rec => {
      let authorized = true
      if (rec.sharedKeys) {
        // Real record: check if Doctor's key is present
        const docKeysSaved = localStorage.getItem(`user_keys_${user.name}`)
        if (docKeysSaved) {
          const docKeys = JSON.parse(docKeysSaved)
          authorized = !!rec.sharedKeys[docKeys.userId]
        } else {
          authorized = false
        }
      } else {
        // Static defaults fallback
        if (rec.id === 'PAT-7720') {
          authorized = false
        }
      }
      return {
        id: rec.id,
        patient: rec.patientName || 'Alex Carter',
        file: rec.fileName || rec.name,
        sensitivity: rec.sensitivity,
        authorized: authorized,
        rawRecord: rec
      }
    })

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Patient Records Workspace</h2>
          <p className="text-slate-505 dark:text-slate-400 text-xs mt-1">Decrypt and inspect active patient health records authorized by ABAC consensus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Accessible Ledger Files</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40 space-y-3">
              {doctorPatients.map((rec) => (
                <div key={rec.id} className="pt-3 flex items-center justify-between gap-3 first:pt-0">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{rec.file}</h4>
                    <span className="text-[10px] text-slate-450 block">Patient: {rec.patient} | Sensitivity: {rec.sensitivity}</span>
                  </div>
                  {rec.authorized ? (
                    <button 
                      onClick={() => handleDecrypt(rec.rawRecord || rec)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-600/10 cursor-pointer"
                    >
                      Decrypt & Read
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-xl">
                      <FiLock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Decryption View Terminal */}
          <div className="bg-slate-955 text-slate-200 p-6 rounded-3xl border border-slate-900 flex flex-col justify-between min-h-[300px] font-mono text-xs">
            <div>
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4 text-[10px] text-slate-400">
                <span>SECURE CRYPTO DECIPHER MODULE</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              {selectedRecordToDecrypt ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-purple-400">Target File:</span> {selectedRecordToDecrypt.file}
                  </div>
                  <div>
                    <span className="text-purple-400">Ledger ID:</span> {selectedRecordToDecrypt.id}
                  </div>

                  {isDecrypting ? (
                    <div className="flex items-center space-x-2 py-4">
                      <FiCpu className="animate-spin text-purple-500 w-5 h-5" />
                      <span className="text-slate-400">Resolving keys, verifying ABAC permissions and deciphering payload...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-emerald-455 flex items-center gap-1.5 font-bold">
                        <FiUnlock className="w-4 h-4" />
                        Permissions Validated. Plaintext output:
                      </div>
                      <pre className="bg-slate-900 border border-slate-900/60 p-4 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-300">
                        {decryptedContent}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                  <FiKey className="w-8 h-8 text-slate-600" />
                  <span>Select an authorized ledger file to initiate client-side decryption.</span>
                </div>
              )}
            </div>
            {selectedRecordToDecrypt && !isDecrypting && (
              <div className="text-[10px] text-slate-550 border-t border-slate-900 pt-3 mt-4">
                * Encrypted with AES-256 using ledger key indices.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 5. DOCTOR PERSONAL LOGS
  const renderDoctorLogs = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Access Logs</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Personal query audits resolved on the Hyperledger Fabric channel.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                <th className="pb-3.5 pl-2">Action Executed</th>
                <th className="pb-3.5">Clearance State</th>
                <th className="pb-3.5">Target Patient File</th>
                <th className="pb-3.5 text-right pr-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                <td className="py-4 pl-2 font-mono text-[10px] uppercase">Read File</td>
                <td className="py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/20">Granted</span>
                </td>
                <td className="py-4 font-semibold">PAT-8820: Cardiology Report</td>
                <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-550">2026-06-10 13:42:01</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors">
                <td className="py-4 pl-2 font-mono text-[10px] uppercase">Read File</td>
                <td className="py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/20">Granted</span>
                </td>
                <td className="py-4 font-semibold">PAT-3491: Blood Panel Analysis</td>
                <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-550">2026-06-10 12:44:59</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // 6. NURSE ACCESS LAB REPORTS
  const renderNurseLabReports = () => {
    const nurseRecords = [
      { id: 'PAT-3491', patient: 'Alice Johnson', file: 'Blood Panel Analysis', sensitivity: 'L1', allowed: false },
      { id: 'PAT-9912', patient: 'Bob Smith', file: 'Brain MRI Scan', sensitivity: 'L2', allowed: true },
      { id: 'PAT-5420', patient: 'Charlie Green', file: 'General Health Screening', sensitivity: 'L3', allowed: true }
    ]

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">General Ward Lab Reports</h2>
          <p className="text-slate-500 dark:text-slate-405 text-xs mt-1">Select and review lab records authorized under your attribute clearances.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="pb-3.5 pl-2">Record File</th>
                  <th className="pb-3.5">Patient</th>
                  <th className="pb-3.5">Sensitivity Level</th>
                  <th className="pb-3.5">Clearance Status</th>
                  <th className="pb-3.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
                {nurseRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 pl-2 font-semibold text-slate-900 dark:text-white">{item.file}</td>
                    <td className="py-4">{item.patient}</td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl text-[10px] font-bold font-mono">
                        {item.sensitivity}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.allowed
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                      }`}>
                        {item.allowed ? 'Authorized' : 'Denied'}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      {item.allowed ? (
                        <button 
                          onClick={() => toast.success(`Viewing ${item.file}... (Simulated)`)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                        >
                          View Report
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold">No Clearance</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // 7. NURSE ACCESS HISTORY
  const renderNurseAccessHistory = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Query History</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Audit log of your general ward ledger access executions.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                <th className="pb-3.5 pl-2">Action</th>
                <th className="pb-3.5">Result</th>
                <th className="pb-3.5">Target File</th>
                <th className="pb-3.5 text-right pr-2">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-355 text-xs">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                <td className="py-4 pl-2 font-mono text-[10px]">Read File</td>
                <td className="py-4">
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">Denied</span>
                </td>
                <td className="py-4 font-semibold">PAT-8820: Cardiology Report</td>
                <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-550">2026-06-10 13:40:15</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // 8. ADMIN USER MANAGEMENT
  const renderAdminUsers = () => {
    const adminUsersList = [
      { name: 'Dr. Sarah Miller', role: 'Doctor', org: 'NIT JAMSHEDPUR', status: 'Active', cert: '0x8823f99011de' },
      { name: 'Patient Alex Carter', role: 'Patient', org: 'Self', status: 'Active', cert: '0x1092aa88f912' },
      { name: 'Nurse Kelly Smith', role: 'Nurse', org: 'NIT JAMSHEDPUR', status: 'Active', cert: '0x5532ab99f831' },
      { name: 'Doctor Amit', role: 'Doctor', org: 'General Ward', status: 'Active', cert: '0x3219fb00e234' },
      { name: 'Unauthorized Intruder', role: 'External', org: 'Malicious Peer', status: 'Revoked', cert: '0xbaad9923ffee' }
    ]

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">User Administration</h2>
          <p className="text-slate-505 dark:text-slate-405 text-xs mt-1">Manage public certificate access states and revoke security keys.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-6 rounded-3xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="pb-3.5 pl-2">User Name</th>
                  <th className="pb-3.5">Network Role</th>
                  <th className="pb-3.5">Identity Certificate Hash</th>
                  <th className="pb-3.5">Member Status</th>
                  <th className="pb-3.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
                {adminUsersList.map((usr, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 pl-2 font-semibold text-slate-900 dark:text-white">{usr.name}</td>
                    <td className="py-4 font-mono text-[10px] uppercase text-purple-650 dark:text-purple-400 font-bold">{usr.role}</td>
                    <td className="py-4 font-mono text-[11px] text-slate-500">{usr.cert}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        usr.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                      }`}>
                        {usr.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      {usr.status === 'Active' ? (
                        <button 
                          onClick={() => toast.success(`Certificate ${usr.cert} has been revoked.`)}
                          className="px-2.5 py-1.5 border border-rose-500/30 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Revoke Cert
                        </button>
                      ) : (
                        <button 
                          onClick={() => toast.success(`Certificate ${usr.cert} re-activated.`)}
                          className="px-2.5 py-1.5 border border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Re-activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // 9. ADMIN SYSTEM ACCESS LOGS
  const renderAdminAccessLogs = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Fabric Ledger Access Audit Logs</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Complete system-wide access logs committed to CouchDB state database.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                <th className="pb-3.5 pl-2">User identity</th>
                <th className="pb-3.5">Role</th>
                <th className="pb-3.5">Action Executed</th>
                <th className="pb-3.5">Status Check</th>
                <th className="pb-3.5 text-right pr-2">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-355 text-xs font-sans">
              {accessLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pl-2 font-semibold text-slate-900 dark:text-white">{log.user}</td>
                  <td className="py-4 font-mono text-[10px] uppercase text-slate-500 dark:text-slate-405">{log.role}</td>
                  <td className="py-4">{log.action}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      log.status === 'Granted'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-550 dark:text-slate-400">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // 10. ROLE-BASED SETTINGS (implementing Section 9 Settings)
  const renderSettings = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Account & Portal Settings</h2>
          <p className="text-slate-500 dark:text-slate-405 text-xs mt-1">Configure your login credentials, interface themes, notification rules, and network options.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main User Settings Cards */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Change Password Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiLock className="text-purple-650" />
                Change Password
              </h3>
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-505 font-semibold block">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-505 font-semibold block">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none" />
                </div>
                <button 
                  onClick={() => toast.success('Password updated successfully.')}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold cursor-pointer transition-all"
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiActivity className="text-blue-500" />
                Notification Preferences
              </h3>
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-650 rounded border-slate-300 focus:ring-purple-500" />
                  <span>Email notifications for record accesses</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-650 rounded border-slate-300 focus:ring-purple-500" />
                  <span>Real-time dashboard popups for verification checks</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-purple-650 rounded border-slate-300 focus:ring-purple-500" />
                  <span>Sms alerts for blocked unauthorized entries</span>
                </label>
                <button 
                  onClick={() => toast.success('Notification rules updated.')}
                  className="px-4 py-2.5 bg-blue-650 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer transition-all mt-2"
                >
                  Save Preferences
                </button>
              </div>
            </div>

          </div>

          {/* Side Column: Theme Toggle & Admin Settings */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Theme Configurator */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiSettings className="text-amber-500" />
                Theme Configuration
              </h3>
              <p className="text-[10px] text-slate-500">Toggle system display mode parameters between standard daylight or low-light LED setups.</p>
              <div className="flex items-center space-x-2 text-xs">
                <button 
                  onClick={() => {
                    document.documentElement.classList.remove('dark')
                    localStorage.setItem('theme', 'light')
                    toast.success('Switched to Light Mode')
                  }}
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-105 dark:hover:bg-slate-900 rounded-xl font-bold border border-slate-200 dark:border-slate-850 cursor-pointer"
                >
                  Light Mode
                </button>
                <button 
                  onClick={() => {
                    document.documentElement.classList.add('dark')
                    localStorage.setItem('theme', 'dark')
                    toast.success('Switched to Dark Mode')
                  }}
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-105 dark:hover:bg-slate-900 rounded-xl font-bold border border-slate-200 dark:border-slate-850 cursor-pointer"
                >
                  Dark Mode
                </button>
              </div>
            </div>

            {/* Admin-Only Config Section */}
            {role === 'Admin' && (
              <div className="bg-purple-500/5 dark:bg-purple-955/10 border border-purple-500/20 p-6 rounded-3xl space-y-4 animate-slide-up">
                <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiShield className="text-purple-600" />
                  System ABAC Settings (Admin-Only)
                </h3>
                <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="space-y-1">
                    <label className="block text-slate-505">Symmetric Key Standard</label>
                    <select 
                      value={settings.keyLength} 
                      onChange={(e) => setSettings(p => ({ ...p, keyLength: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="AES-128">AES-128 (Faster computation)</option>
                      <option value="AES-192">AES-192 (Intermediate security)</option>
                      <option value="AES-256">AES-256 (High clearance standard)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-550">Min Consensus Nodes</label>
                    <input 
                      type="number" 
                      min="2" 
                      max="10"
                      value={settings.consensusNodes}
                      onChange={(e) => setSettings(p => ({ ...p, consensusNodes: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1 cursor-pointer select-none">
                    <div>
                      <span className="block text-slate-700 dark:text-slate-250">Enforce Multi-Factor Auth</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={settings.enforceMfa}
                      onChange={(e) => setSettings(p => ({ ...p, enforceMfa: e.target.checked }))}
                      className="w-4 h-4 text-purple-650 rounded bg-slate-50 border-slate-300 focus:ring-purple-500"
                    />
                  </div>

                  <button 
                    onClick={() => toast.success('Smart contract ABAC policies updated.')}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold cursor-pointer transition-all"
                  >
                    Save System Config
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    )
  }

  // 11. USER PROFILE PAGE (implementing Checklist Profile Page)
  const renderProfile = () => {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Security Profile</h2>
          <p className="text-slate-500 dark:text-slate-405 text-xs mt-1">Manage your identity, view cryptographic certificates, and check organization nodes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Profile Details */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center space-x-4">
                <img 
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'} 
                  alt={user?.name} 
                  className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-800 object-cover shadow-sm"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name || 'Guest User'}</h3>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-405 bg-purple-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono inline-block mt-1">
                    {role} Access Clearance
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 dark:text-slate-400">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 dark:text-slate-400">Organization / Group</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.organization || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 dark:text-slate-400">Security Clearance</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {role === 'Admin' ? 'Level 4 (Full System Control)' : role === 'Doctor' ? 'Level 3 (Write/Read Authorized)' : role === 'Nurse' ? 'Level 2 (Read/Update Limited)' : 'Level 1 (Self Records Access)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 dark:text-slate-400">Consensus Peer Affinity</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-355 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2 py-0.5 rounded">
                    {role === 'Admin' ? 'Peer0.Admin.ehealth.org' : role === 'Doctor' ? 'Peer1.Hospital.ehealth.org' : role === 'Nurse' ? 'Peer2.Lab.ehealth.org' : 'Peer3.Client.ehealth.org'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Certificate */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiShield className="text-emerald-500" />
                eHealth Digital X.509 Certificate
              </h3>
              <p className="text-[10px] text-slate-505">Hyperledger Fabric CA Issued identity certificate for securing patient HIPAA compliance logs.</p>
              
              <div className="space-y-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-2.5 font-mono text-[10px]">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-405">VERSION</span>
                    <span className="text-slate-900 dark:text-white">v3 (X.509)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-405">SERIAL NUMBER</span>
                    <span className="text-slate-900 dark:text-white font-mono">0F:D4:5A:21:BC:07:90:E5</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-405">ISSUER</span>
                    <span className="text-slate-900 dark:text-white">eHealth-RootCA-MSP</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-455">VALIDITY</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">ACTIVE (Expires 2030)</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-405 block mb-1">X.509 PUBLIC KEY DATA (ECDSA)</span>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-xl text-[9px] text-slate-500 dark:text-slate-405 break-all max-h-16 overflow-y-auto font-mono relative group">
                      MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7p95R3eO3w9oF3d72rGv...
                      <button 
                        onClick={() => handleCopy('MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7p95R3eO3w9oF3d72rGv')}
                        className="absolute right-2 top-2 p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 rounded cursor-pointer"
                        title="Copy Key"
                      >
                        <FiCopy className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Helper mapping switch for section hash routing
  const renderSection = () => {
    switch (hash) {
      case '#my-records':
        if (role === 'Patient') return renderPatientRecords()
        return renderDefault()
      case '#who-accessed':
        if (role === 'Patient') return renderPatientWhoAccessed()
        return renderDefault()
      case '#records':
        if (role === 'Doctor') return renderDoctorRecords()
        return renderDefault()
      case '#logs':
        if (role === 'Doctor') return renderDoctorLogs()
        return renderDefault()
      case '#lab-reports':
        if (role === 'Nurse') return renderNurseLabReports()
        return renderDefault()
      case '#access-history':
        if (role === 'Nurse') return renderNurseAccessHistory()
        return renderDefault()
      case '#users':
        if (role === 'Admin') return renderAdminUsers()
        return renderDefault()
      case '#access-logs':
        if (role === 'Admin') return renderAdminAccessLogs()
        return renderDefault()
      case '#settings':
        return renderSettings()
      case '#profile':
        return renderProfile()
      default:
        return renderDefault()
    }
  }

  // --- FINAL ROUTING WRAPPER ---
  return (
    <div className="animate-fadeIn">
      {renderSection()}
    </div>
  )
}
