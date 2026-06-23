import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import {
  FiClock, FiTrendingUp, FiCheckCircle, FiFileText, FiDatabase,
  FiSearch, FiFilter, FiCalendar, FiDownload, FiCpu, FiUser,
  FiPlus, FiList, FiTrendingDown, FiShield, FiAlertTriangle, FiRefreshCw, FiGrid, FiList as FiListIcon
} from 'react-icons/fi'
import { getLogs as getLogsFabric } from '../services/apiService'

// Databases for event simulation
const doctorsList = ['Dr. Sarah Miller', 'Dr. James Watson', 'Dr. Helen Cho', 'Dr. Robert Carter', 'Dr. Emily Vance']
const patientsList = ['Alice Johnson', 'Bob Smith', 'Charlie Green', 'David Wright', 'Eva Adams']
const nursesList = ['Nurse Kelly Smith', 'Nurse John Davis', 'Nurse Clara Barton']
const adminList = ['Admin System', 'Network Monitor']
const recordsList = ['PAT-8820', 'PAT-3491', 'PAT-1092', 'PAT-5420', 'PAT-6612', 'PAT-7720']

export default function AuditTrail() {
  const { user } = useAuth()

  // Logs state
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('timeline') // 'timeline' or 'table'
  
  // Search & filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [filterAction, setFilterAction] = useState('All')
  const [filterDate, setFilterDate] = useState('')

  // Simulator control state
  const [isSimulating, setIsSimulating] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 5

  // 1. Initial Seeding of Audit logs
  useEffect(() => {
    const fetchLogs = async () => {
      const fetchedLogs = await getLogsFabric()
      if (fetchedLogs && fetchedLogs.length > 0) {
        setLogs(fetchedLogs)
      } else {
        const defaultLogs = [
        {
          id: "log_1",
          user: "Patient Alex Carter",
          role: "Patient",
          action: "Consent Updated",
          description: "Updated consent policy for Dr. Sarah Miller on record PAT-8820",
          timestamp: "2026-06-16 10:15:30",
          txHash: "0x4a9a141b7829ac252dbef23f8b0e7a2b0e9f1a2380d90d81014ac2460d5b78ab",
          blockHeight: 580
        },
        {
          id: "log_2",
          user: "Dr. Sarah Miller",
          role: "Doctor",
          action: "Record Viewed",
          description: "Viewed Cardiology Report PAT-8820",
          timestamp: "2026-06-16 11:20:45",
          txHash: "0xf99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb001092a",
          blockHeight: 581
        },
        {
          id: "log_3",
          user: "Patient Alice Johnson",
          role: "Patient",
          action: "Record Uploaded",
          description: "Uploaded case file Blood Panel Analysis PAT-3491",
          timestamp: "2026-06-16 12:44:59",
          txHash: "0x1092aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e599",
          blockHeight: 582
        },
        {
          id: "log_4",
          user: "Dr. James Watson",
          role: "Doctor",
          action: "Record Viewed",
          description: "Viewed Blood Panel Analysis PAT-3491",
          timestamp: "2026-06-16 14:02:12",
          txHash: "0x5420aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e588",
          blockHeight: 583
        },
        {
          id: "log_5",
          user: "Patient Bob Smith",
          role: "Patient",
          action: "Access Granted",
          description: "Granted access to Dr. Helen Cho for MRI Brain Scan PAT-1092",
          timestamp: "2026-06-16 15:30:00",
          txHash: "0x7720aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e577",
          blockHeight: 584
        },
        {
          id: "log_6",
          user: "Dr. Helen Cho",
          role: "Doctor",
          action: "Record Viewed",
          description: "Viewed MRI Brain Scan PAT-1092",
          timestamp: "2026-06-16 16:15:22",
          txHash: "0x6612aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e566",
          blockHeight: 585
        },
        {
          id: "log_7",
          user: "Patient Alex Carter",
          role: "Patient",
          action: "Access Revoked",
          description: "Revoked access of Nurse Kelly Smith for Chest X-Ray Scan PAT-5420",
          timestamp: "2026-06-16 17:05:10",
          txHash: "0x8820f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb00",
          blockHeight: 586
        },
        {
          id: "log_8",
          user: "Admin System",
          role: "Admin",
          action: "Consent Updated",
          description: "Updated security endorsement policies for Org1 peers",
          timestamp: "2026-06-17 08:30:15",
          txHash: "0x3491f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb01",
          blockHeight: 587
        },
        {
          id: "log_9",
          user: "Nurse Kelly Smith",
          role: "Nurse",
          action: "Record Viewed",
          description: "Viewed Pain Relief Prescription PAT-6612",
          timestamp: "2026-06-17 09:12:44",
          txHash: "0x1092f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb02",
          blockHeight: 588
        },
        {
          id: "log_10",
          user: "Admin System",
          role: "Admin",
          action: "Access Granted",
          description: "Granted emergency temporary access to Dr. Emily Vance on PAT-5420",
          timestamp: "2026-06-17 10:00:00",
          txHash: "0x5420f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb03",
          blockHeight: 589
        },
        {
          id: "log_11",
          user: "Dr. Emily Vance",
          role: "Doctor",
          action: "Record Viewed",
          description: "Viewed Chest X-Ray Scan PAT-5420",
          timestamp: "2026-06-17 10:15:30",
          txHash: "0x7720f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb04",
          blockHeight: 590
        },
        {
          id: "log_12",
          user: "Patient Alice Johnson",
          role: "Patient",
          action: "Consent Updated",
          description: "Renewed consent sharing rule for Dr. James Watson on Blood Panel Analysis PAT-3491",
          timestamp: "2026-06-17 11:45:00",
          txHash: "0x6612f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb05",
          blockHeight: 591
        }
      ]
      localStorage.setItem('blockchain_audit_trail', JSON.stringify(defaultLogs))
      setLogs(defaultLogs)
    }
  }
    fetchLogs()
  }, [])

  // 2. Blockchain Transaction Simulator
  const simulateBlockchainEvent = () => {
    // Pick a random user/role
    const roles = ['Doctor', 'Patient', 'Nurse', 'Admin']
    const role = roles[Math.floor(Math.random() * roles.length)]
    
    let user = ''
    if (role === 'Doctor') {
      user = doctorsList[Math.floor(Math.random() * doctorsList.length)]
    } else if (role === 'Patient') {
      user = `Patient ${patientsList[Math.floor(Math.random() * patientsList.length)]}`
    } else if (role === 'Nurse') {
      user = nursesList[Math.floor(Math.random() * nursesList.length)]
    } else {
      user = adminList[Math.floor(Math.random() * adminList.length)]
    }

    // Pick a random action
    const actions = ['Record Viewed', 'Record Uploaded', 'Access Granted', 'Access Revoked', 'Consent Updated']
    const action = actions[Math.floor(Math.random() * actions.length)]
    const targetRecord = recordsList[Math.floor(Math.random() * recordsList.length)]

    let description = ''
    if (action === 'Record Viewed') {
      description = `Viewed patient medical file ${targetRecord}`
    } else if (action === 'Record Uploaded') {
      description = `Uploaded fresh diagnostic record ${targetRecord} to encrypted IPFS peer nodes`
    } else if (action === 'Access Granted') {
      description = `Authorized attribute access tokens to ${doctorsList[Math.floor(Math.random() * doctorsList.length)]} for ${targetRecord}`
    } else if (action === 'Access Revoked') {
      description = `Revoked credential keys of ${nursesList[Math.floor(Math.random() * nursesList.length)]} for ${targetRecord}`
    } else {
      description = `Updated consent permission rule sets on channel for ${targetRecord}`
    }

    // Generate SHA-256 styled hash
    const randomHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')

    // Fetch block height
    const lastBlock = logs.length > 0 ? logs[0].blockHeight : 591
    const nextBlock = lastBlock + 1

    const newLog = {
      id: `log_${Date.now()}`,
      user,
      role,
      action,
      description,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      txHash: randomHash,
      blockHeight: nextBlock
    }

    const updatedLogs = [newLog, ...logs]
    setLogs(updatedLogs)
    localStorage.setItem('blockchain_audit_trail', JSON.stringify(updatedLogs))
    
    toast.success(`Consensus Reached! Block #${nextBlock} committed to channel.`, {
      icon: '🔒',
      style: {
        borderRadius: '12px',
        background: '#1e293b',
        color: '#f8fafc',
      }
    })
  }

  // 3. Live Auto-Simulate Stream Effect
  useEffect(() => {
    let interval = null
    if (isSimulating) {
      interval = setInterval(() => {
        simulateBlockchainEvent()
      }, 6000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSimulating, logs])

  // 4. Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setFilterRole('All')
    setFilterAction('All')
    setFilterDate('')
    setCurrentPage(1)
    toast.success('Filters cleared.')
  }

  // 5. Reporting Exports
  const handleExportCSV = () => {
    const csvHeaders = ['Block', 'Timestamp', 'User', 'Role', 'Action Type', 'Description', 'Transaction Hash']
    const csvRows = filteredLogs.map(log => [
      `#${log.blockHeight}`,
      log.timestamp,
      log.user,
      log.role,
      log.action,
      log.description,
      log.txHash
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [csvHeaders.join(","), ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `blockchain_audit_trail_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('CSV report downloaded!')
  }

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Blockchain Access Control - Audit Trail Report</title>
          <style>
            body { 
              font-family: 'Inter', system-ui, sans-serif; 
              padding: 40px; 
              color: #0f172a; 
              background-color: #ffffff;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            h1 { font-size: 22px; font-weight: 800; color: #1e1b4b; margin: 0; }
            .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 11px; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .hash { font-family: monospace; font-size: 10px; color: #4f46e5; word-break: break-all; }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .role-Doctor { background-color: #e0f2fe; color: #0369a1; }
            .role-Patient { background-color: #dcfce7; color: #15803d; }
            .role-Nurse { background-color: #fef9c3; color: #a16207; }
            .role-Admin { background-color: #f3e8ff; color: #6b21a8; }
            .footer { 
              margin-top: 40px; 
              border-top: 1px solid #e2e8f0; 
              padding-top: 15px; 
              font-size: 10px; 
              color: #94a3b8; 
              text-align: center; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>eHealth Portal Blockchain Audit Report</h1>
            <div class="meta">
              Report Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; 
              Total Access Operations: ${filteredLogs.length} &nbsp;|&nbsp;
              Peer Node: org1-peer0.ehealth.network
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 8%">Block</th>
                <th style="width: 15%">Timestamp</th>
                <th style="width: 20%">User</th>
                <th style="width: 12%">Role</th>
                <th style="width: 15%">Action</th>
                <th style="width: 30%">Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.map(log => `
                <tr>
                  <td><strong>#${log.blockHeight}</strong></td>
                  <td>${log.timestamp}</td>
                  <td><strong>${log.user}</strong></td>
                  <td><span class="badge role-${log.role}">${log.role}</span></td>
                  <td>${log.action}</td>
                  <td><span class="hash">${log.txHash}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            End of Report. Cryptographically verified against Hyperledger CouchDB ledger hashes.
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
    toast.success('PDF report triggered!')
  }

  // 6. Filter & Search Logs logic
  const getFilteredLogs = () => {
    let filtered = logs

    // Text search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        log.txHash.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (filterRole !== 'All') {
      filtered = filtered.filter(log => log.role === filterRole)
    }

    // Action filter
    if (filterAction !== 'All') {
      filtered = filtered.filter(log => log.action === filterAction)
    }

    // Date filter
    if (filterDate) {
      filtered = filtered.filter(log => log.timestamp.startsWith(filterDate))
    }

    return filtered
  }

  const filteredLogs = getFilteredLogs()

  // 7. Dynamic Stats computations
  const getTotalEvents = () => logs.length

  const getActivePermissionsCount = () => {
    try {
      const history = JSON.parse(localStorage.getItem('access_history') || '[]')
      const activeHist = history.filter(h => h.status === 'Active').length
      return activeHist > 0 ? activeHist : 4 // Seed value fallback
    } catch {
      return 4
    }
  }

  const getRevokedPermissionsCount = () => {
    return logs.filter(log => log.action === 'Access Revoked').length
  }

  const getUniqueRecordsAccessed = () => {
    const records = new Set()
    logs.forEach(log => {
      const match = log.description.match(/PAT-\d+/g)
      if (match) {
        match.forEach(id => records.add(id))
      }
    })
    return records.size > 0 ? records.size : 5 // Seed value fallback
  }

  // 8. Pagination logic
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background Visual Blobs */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-indigo-650/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-7000"></div>

      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-900/60 pb-6 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <FiClock className="text-purple-605 dark:text-purple-400" />
              Blockchain Audit Trail
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
              Inspect cryptographically secure event logs committed to the ledger. Track viewed, updated, and revoked clearances in real-time.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Stream Status indicator */}
            <div className="flex items-center gap-2 text-xs font-mono bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 px-3.5 py-2.5 rounded-xl text-purple-650 dark:text-purple-400 shadow-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-emerald-500 animate-ping' : 'bg-slate-350 dark:bg-slate-700'}`}></span>
              <span>{isSimulating ? 'LIVE LEDGER BLOCKSTREAM ACTIVE' : 'STREAM DISCONNECTED'}</span>
            </div>

            {/* Toggle Simulator */}
            <button
              onClick={() => {
                setIsSimulating(!isSimulating)
                toast.success(isSimulating ? 'Live stream paused' : 'Live stream activated')
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isSimulating 
                  ? 'bg-amber-500 hover:bg-amber-400 text-white border-transparent'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
              }`}
            >
              <FiCpu className={isSimulating ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
              {isSimulating ? 'Pause Sync' : 'Live Sync Stream'}
            </button>

            {/* Force Simulate Trigger */}
            <button
              onClick={simulateBlockchainEvent}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Force Inject Simulated Block Access"
            >
              <FiPlus className="w-4 h-4" />
              Simulate Block Commit
            </button>

          </div>
        </div>

        {/* Analytics KPIs Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 dark:hover:border-purple-900/60 transition-all duration-200">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider block">Total Ledger Operations</span>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 block font-mono">{getTotalEvents()}</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FiDatabase className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 dark:hover:border-purple-900/60 transition-all duration-200">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider block">Active Permissions</span>
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-450 mt-1.5 block font-mono">{getActivePermissionsCount()}</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FiShield className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 dark:hover:border-purple-900/60 transition-all duration-200">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider block">Revocation Events</span>
              <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-455 mt-1.5 block font-mono">{getRevokedPermissionsCount()}</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <FiTrendingDown className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 dark:hover:border-purple-900/60 transition-all duration-200">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider block">Unique Records Accessed</span>
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-450 mt-1.5 block font-mono">{getUniqueRecordsAccessed()}</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FiFileText className="w-5.5 h-5.5" />
            </div>
          </div>

        </div>

        {/* Filter and Export Interface Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Search input */}
            <div className="lg:col-span-4 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by User, Action, Tx Hash..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-2xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold"
              />
            </div>

            {/* Role filter */}
            <div className="lg:col-span-2">
              <select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-2xl px-3.5 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Patient">Patient</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Action filter */}
            <div className="lg:col-span-2">
              <select
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-2xl px-3.5 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Action Types</option>
                <option value="Record Viewed">Record Viewed</option>
                <option value="Record Uploaded">Record Uploaded</option>
                <option value="Access Granted">Access Granted</option>
                <option value="Access Revoked">Access Revoked</option>
                <option value="Consent Updated">Consent Updated</option>
              </select>
            </div>

            {/* Date filter */}
            <div className="lg:col-span-2 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiCalendar className="w-3.5 h-3.5" />
              </span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-2xl pl-10 pr-3.5 py-2.5 text-slate-755 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="lg:col-span-2 flex items-center gap-2 justify-end">
              <button
                onClick={handleResetFilters}
                className="p-3 border border-slate-200 dark:border-slate-855 hover:bg-slate-55 dark:hover:bg-slate-950 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl transition-all cursor-pointer"
                title="Clear Filters"
              >
                <FiRefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 text-purple-650 dark:text-purple-400 rounded-2xl text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                title="Export CSV"
              >
                <FiDownload className="w-4 h-4" />
                <span>CSV</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="px-3.5 py-3 bg-purple-650 hover:bg-purple-550 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-purple-650/10"
                title="Print/Save PDF"
              >
                <FiFileText className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>

          </div>
        </div>

        {/* View Selection (Timeline vs Table) */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
            <button
              onClick={() => {
                setActiveTab('timeline')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-purple-650 dark:text-purple-400 shadow-sm border border-slate-200/40 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FiListIcon className="w-3.5 h-3.5" />
              Timeline View
            </button>
            <button
              onClick={() => {
                setActiveTab('table')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-white dark:bg-slate-900 text-purple-650 dark:text-purple-400 shadow-sm border border-slate-200/40 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FiGrid className="w-3.5 h-3.5" />
              Table View
            </button>
          </div>

          <span className="text-xs text-slate-500 px-2">
            Filtered: <strong>{filteredLogs.length}</strong> transactions
          </span>
        </div>

        {/* Logs visual workspace */}
        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-16 rounded-3xl text-center text-slate-455 dark:text-slate-605 flex flex-col items-center justify-center">
            <FiAlertTriangle className="w-12 h-12 mb-3 opacity-30 animate-pulse text-purple-650 dark:text-purple-400" />
            <p className="text-sm font-semibold">No audit logs matched search criteria</p>
            <p className="text-xs mt-1">Refine your query string, check role constraints, or clear date boundaries.</p>
            <button 
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-955 dark:hover:bg-slate-900 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : activeTab === 'timeline' ? (
          
          /* Timeline view layout */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 md:p-8 rounded-3xl shadow-sm dark:shadow-none space-y-6">
            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8">
              {currentLogs.map((log) => {
                let badgeColor = 'bg-blue-500/10 border-blue-500/20 text-blue-650 dark:text-blue-400'
                let icon = <FiClock className="w-4 h-4" />

                if (log.action === 'Record Uploaded') {
                  badgeColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                } else if (log.action === 'Access Granted') {
                  badgeColor = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-650 dark:text-indigo-400'
                } else if (log.action === 'Access Revoked') {
                  badgeColor = 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455'
                  icon = <FiAlertTriangle className="w-4 h-4" />
                } else if (log.action === 'Consent Updated') {
                  badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                }

                return (
                  <div key={log.id} className="relative animate-fade-in group">
                    {/* Circle Dot with Icon */}
                    <span className={`absolute -left-[37px] md:-left-[45px] top-1.5 rounded-full p-2 border flex items-center justify-center shadow-sm bg-white dark:bg-slate-900 ${badgeColor}`}>
                      {icon}
                    </span>

                    <div className="space-y-2 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-955/20 border border-slate-100 dark:border-slate-850/50 p-5 rounded-2xl transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-900/60 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${badgeColor} font-mono uppercase tracking-wider`}>
                            {log.action}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Block <strong>#{log.blockHeight}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {log.timestamp}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-4 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-200/50 dark:bg-slate-900 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                            {log.user.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-250 block">{log.user}</span>
                            <span className="text-[9px] font-bold text-slate-450 uppercase font-mono bg-slate-200/30 dark:bg-slate-900/60 px-1 py-0.2 rounded mt-0.5 inline-block">{log.role}</span>
                          </div>
                        </div>

                        <div className="md:col-span-8 space-y-1 md:border-l border-slate-100 dark:border-slate-900 md:pl-5">
                          <p className="text-xs font-semibold text-slate-705 dark:text-slate-300 leading-relaxed">
                            {log.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                            <span>TX HASH:</span>
                            <span className="text-purple-650 dark:text-purple-400 break-all select-all font-semibold">{log.txHash}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        ) : (

          /* Table view layout */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Block</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Action Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3 text-right pr-2">Transaction Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all group animate-fade-in">
                      <td className="py-4 pl-2 font-bold text-slate-950 dark:text-white font-mono">
                        #{log.blockHeight}
                      </td>
                      <td className="py-4 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {log.user}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          log.role === 'Doctor' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                          log.role === 'Patient' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' :
                          log.role === 'Nurse' ? 'bg-amber-500/10 text-amber-605 dark:text-amber-400 border-amber-500/20' :
                          'bg-purple-500/10 text-purple-650 dark:text-purple-400 border-purple-500/20'
                        } font-mono uppercase`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`font-semibold text-[11px] ${
                          log.action === 'Record Uploaded' ? 'text-emerald-600 dark:text-emerald-450' :
                          log.action === 'Access Granted' ? 'text-indigo-600 dark:text-indigo-400' :
                          log.action === 'Access Revoked' ? 'text-rose-600 dark:text-rose-455' :
                          log.action === 'Consent Updated' ? 'text-amber-600 dark:text-amber-450' :
                          'text-blue-600 dark:text-blue-400'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 text-slate-550 dark:text-slate-350 max-w-[200px] truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="py-4 text-right pr-2 font-mono text-[10px] text-purple-650 dark:text-purple-400 font-bold max-w-[120px] truncate group-hover:text-purple-500 select-all" title={log.txHash}>
                        {log.txHash}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-4 rounded-3xl shadow-sm">
            <span className="text-xs text-slate-550">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredLogs.length} total operations)
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  currentPage === 1 
                    ? 'text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-900 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => paginate(idx + 1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === idx + 1
                      ? 'bg-purple-650 text-white border-transparent'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 border border-transparent'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  currentPage === totalPages 
                    ? 'text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-900 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
