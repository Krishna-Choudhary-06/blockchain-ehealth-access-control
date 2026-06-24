import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { 
  FiFileText, FiLock, FiUnlock, FiEye, FiDownload, FiCheckCircle,
  FiCpu, FiHash, FiShield, FiAlertCircle, FiDatabase,
  FiSearch, FiFilter, FiCalendar, FiX, FiActivity, FiKey
} from 'react-icons/fi'

export default function PatientRecords() {
  const { user } = useAuth()
  
  // Records state
  const [records, setRecords] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterAccess, setFilterAccess] = useState('All')

  // Modals state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [verifyingRecord, setVerifyingRecord] = useState(null)
  const [isVerifyingState, setIsVerifyingState] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)

  // Downloading indicators
  const [downloadingId, setDownloadingId] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 4

  // Seed / Load patient records on mount
  useEffect(() => {
    const saved = localStorage.getItem('patient_records')
    if (saved) {
      setRecords(JSON.parse(saved))
    } else {
      const defaultRecords = [
        {
          id: "PAT-8820",
          name: "PAT-8820: Cardiology Report",
          fileName: "cardiology_report.pdf",
          recordType: "Lab Reports",
          sensitivity: "L0",
          owner: "Patient Alex Carter",
          uploadTime: "2026-06-10 13:42:01",
          ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
          recordHash: "3a9a141b7829ac252dbef23f8b0e7a2b0e9f1a2380d90d81014ac2460d5b78ab",
          txId: "tx_8820f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb00",
          description: "Heart Rate: 72 bpm. PR interval: 140ms. QR duration: 86ms. Findings indicate stable sinus rhythm, no ischemic ST changes.",
          accessStatus: "Authorized"
        },
        {
          id: "PAT-3491",
          name: "PAT-3491: Blood Panel Analysis",
          fileName: "blood_panel_analysis.png",
          recordType: "Lab Reports",
          sensitivity: "L1",
          owner: "Patient Alice Johnson",
          uploadTime: "2026-06-10 12:44:59",
          ipfsHash: "QmYwAPJzvHpXnN3WknFiJnKLwHCnL72vedxjQkDDP1mXWp8xyz",
          recordHash: "f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb001092a",
          txId: "tx_3491f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb01",
          description: "Hemoglobin: 14.2 g/dL. WBC: 6.4 x10^3/uL. Platelets: 245 x10^3/uL. Blood Glucose: 92 mg/dL. Metabolic parameters normal.",
          accessStatus: "Authorized"
        },
        {
          id: "PAT-1092",
          name: "PAT-1092: MRI Brain Scan",
          fileName: "mri_brain_scan.jpg",
          recordType: "MRI",
          sensitivity: "L2",
          owner: "Patient Bob Smith",
          uploadTime: "2026-06-10 13:12:44",
          ipfsHash: "QmZpQRzvHpXnN3WknFiJnKLwHCnL72vedxjQkDDP1mXWq9abc",
          recordHash: "1092aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e599",
          txId: "tx_1092f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb02",
          description: "T1, T2, and FLAIR imaging displays normal brain structure. No space-occupying lesions or acute intracranial hemorrhage.",
          accessStatus: "Authorized"
        },
        {
          id: "PAT-5420",
          name: "PAT-5420: Chest X-Ray Scan",
          fileName: "chest_xray.jpg",
          recordType: "X-Ray",
          sensitivity: "L3",
          owner: "Patient Alex Carter",
          uploadTime: "2026-06-09 10:15:30",
          ipfsHash: "QmT123zvHpXnN3WknFiJnKLwHCnL72vedxjQkDDP1mXWr0def",
          recordHash: "5420aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e588",
          txId: "tx_5420f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb03",
          description: "Bilateral lung fields clear. Cardiomediastinal silhouette within normal limits. No pleural effusion or consolidation.",
          accessStatus: "Authorized"
        },
        {
          id: "PAT-7720",
          name: "PAT-7720: Post-Op Discharge Summary",
          fileName: "discharge_summary.pdf",
          recordType: "Discharge Summary",
          sensitivity: "L0",
          owner: "Patient Alex Carter",
          uploadTime: "2026-06-08 16:45:00",
          ipfsHash: "QmP456zvHpXnN3WknFiJnKLwHCnL72vedxjQkDDP1mXWs1ghi",
          recordHash: "7720aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e577",
          txId: "tx_7720f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb04",
          description: "Post-operative recovery following laparoscopic appendectomy was uneventful. Incisions well-healed. Vital signs stable.",
          accessStatus: "Locked"
        },
        {
          id: "PAT-6612",
          name: "PAT-6612: Pain Relief Prescription",
          fileName: "prescription_pain.pdf",
          recordType: "Prescriptions",
          sensitivity: "L1",
          owner: "Patient Alice Johnson",
          uploadTime: "2026-06-07 09:30:00",
          ipfsHash: "QmPres123XnN3WknFiJnKLwHCnL72vedxjQkDDP1mXWp8xyz",
          recordHash: "6612aa88f9120790e50fd45a21bc0790e54ff521bc0790e5fd45a21bc0790e566",
          txId: "tx_6612f99011de9c1f5c6a88a8f912e234baad9923ffee5532ab99f8313219fb05",
          description: "Rx: Ibuprofen 400mg tabs. Take 1 tablet every 6 hours as needed for mild pain. Quantity: 20 tablets. Refills: 0.",
          accessStatus: "Authorized"
        }
      ]
      localStorage.setItem('patient_records', JSON.stringify(defaultRecords))
      setRecords(defaultRecords)
    }
  }, [])

  // Dynamic clearance status check (integrates request approvals & access history)
  const getRecordAccessStatus = (record) => {
    // 1. If L3 (Public), always authorized
    if (record.sensitivity === 'L3') return 'Authorized'

    // 2. Check if there is an Active approval in access_history or access_requests matching current doctor and record ID
    const history = JSON.parse(localStorage.getItem('access_history') || '[]')
    const hasHistoryApproval = history.some(
      h => h.recordId === record.id && 
           h.userName.toLowerCase() === user?.name?.toLowerCase() && 
           h.status === 'Active'
    )
    if (hasHistoryApproval) return 'Authorized'

    const requests = JSON.parse(localStorage.getItem('access_requests') || '[]')
    const hasRequestApproval = requests.some(
      r => r.patientId === record.id && 
           r.doctorName.toLowerCase() === user?.name?.toLowerCase() && 
           r.status === 'Approved'
    )
    if (hasRequestApproval) return 'Authorized'

    // 3. Fallback: default seeded status
    return record.id === 'PAT-7720' ? 'Locked' : 'Authorized'
  }

  // Action: View Record details
  const handleViewRecord = (record) => {
    const currentStatus = getRecordAccessStatus(record)
    
    // Construct record representation for details display
    const detailedRecord = {
      ...record,
      accessStatus: currentStatus,
      description: currentStatus === 'Authorized' 
        ? (record.description || "Simulated health payload: Patient records verified under consensus ledger check.")
        : "[CRYPTOGRAPHIC LOCK] Plaintext details are encrypted under AES-256. Access must be requested."
    }
    
    setSelectedRecord(detailedRecord)
    setIsDetailModalOpen(true)
  }

  // Action: Verify Blockchain Hash
  const handleVerifyHash = async (record) => {
    setVerifyingRecord(record)
    setIsVerifyModalOpen(true)
    setIsVerifyingState(true)
    setVerificationResult(null)

    try {
      // Simulate ledger query latency (1.4 seconds)
      await new Promise(resolve => setTimeout(resolve, 1400))
      
      setVerificationResult({
        status: 'VERIFIED',
        blockHeight: Math.floor(Math.random() * 100) + 500,
        txId: record.txId || 'tx_' + Math.random().toString(36).substring(3, 15),
        consensusNodes: 4,
        policyCheck: 'PASSED (ABAC evaluation)',
        timestamp: new Date().toLocaleString()
      })
    } catch (e) {
      setVerificationResult({
        status: 'FAILED',
        error: e.message
      })
    } finally {
      setIsVerifyingState(false)
    }
  }

  // Action: Download decrypted file from IPFS
  const handleDownload = async (record) => {
    const status = getRecordAccessStatus(record)
    if (status === 'Locked') {
      toast.error('Cryptographic Lock: Please request access to download this file.')
      return
    }

    setDownloadingId(record.id)
    setDownloadProgress(0)

    try {
      // Simulate download progress steps
      for (let i = 20; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setDownloadProgress(i)
      }

      // Trigger file download
      const element = document.createElement("a")
      const fileText = `PATIENT RECORD EXPORT\n---------------------\nRecord Name: ${record.name}\nOwner: ${record.owner}\nIPFS CID: ${record.ipfsHash}\nRecord Hash: ${record.recordHash}\nDescription:\n${record.description || 'Verified on blockchain.'}`
      const file = new Blob([fileText], {type: 'text/plain'})
      element.href = URL.createObjectURL(file)
      element.download = record.fileName || `${record.id}_record.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)

      toast.success('Decrypted file downloaded successfully!')
    } catch (err) {
      toast.error(`Download failed: ${err.message}`)
    } finally {
      setDownloadingId(null)
    }
  }

  // Search & Filters computation
  const getFilteredRecords = () => {
    let filtered = records

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter(rec => rec.recordType === filterType)
    }

    // Filter by access status
    if (filterAccess !== 'All') {
      filtered = filtered.filter(rec => getRecordAccessStatus(rec) === filterAccess)
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(rec => 
        rec.name.toLowerCase().includes(q) ||
        rec.owner.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q) ||
        rec.recordHash.toLowerCase().includes(q)
      )
    }

    return filtered
  }

  const filteredRecords = getFilteredRecords()

  // Pagination bounds
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background visual gradients */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-650/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-indigo-650/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-7000"></div>

      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-900/60 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <FiFileText className="text-purple-650 dark:text-purple-400" />
              Patient Records Workspace
            </h1>
            <p className="text-slate-505 dark:text-slate-400 mt-2 text-sm max-w-2xl">
              Cryptographically secure patient record catalog. Decrypt authorized patient medical records and audit transaction integrity.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 px-3.5 py-2.5 rounded-xl text-purple-650 dark:text-purple-400 shadow-sm self-start md:self-center">
            <FiDatabase className="text-purple-505 w-4 h-4 animate-pulse" />
            <span>IPFS STORAGE CLUSTER</span>
          </div>
        </div>

        {/* Filter and Search Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search patient files by name, ID, patient owner..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-2xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold"
              />
            </div>

            {/* Record Type Filter */}
            <div className="md:col-span-3">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-2xl px-3.5 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="MRI">MRI Scan</option>
                <option value="X-Ray">X-Ray Scan</option>
                <option value="Lab Reports">Lab Reports</option>
                <option value="Prescriptions">Prescriptions</option>
                <option value="Discharge Summary">Discharge Summary</option>
              </select>
            </div>

            {/* Access Status Filter */}
            <div className="md:col-span-3">
              <select
                value={filterAccess}
                onChange={(e) => {
                  setFilterAccess(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-2xl px-3.5 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Access States</option>
                <option value="Authorized">Authorized Clearance</option>
                <option value="Locked">Cryptographic Lock</option>
              </select>
            </div>

          </div>
        </div>

        {/* Record Cards Grid */}
        {currentRecords.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-16 rounded-3xl text-center text-slate-455 dark:text-slate-605 flex flex-col items-center justify-center">
            <FiActivity className="w-12 h-12 mb-3 opacity-30 animate-pulse" />
            <p className="text-sm font-semibold">No medical records found</p>
            <p className="text-xs mt-1">Adjust search queries or type filters to retrieve matching patient records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentRecords.map((record) => {
              const currentStatus = getRecordAccessStatus(record)
              
              return (
                <div 
                  key={record.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-650 dark:text-purple-400 border border-purple-500/20 rounded-md text-[9px] font-bold tracking-wider font-mono uppercase">
                          {record.recordType}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                          {record.name}
                        </h3>
                      </div>
                      
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        currentStatus === 'Authorized'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                      }`}>
                        {currentStatus === 'Authorized' ? (
                          <><FiUnlock className="w-3 h-3 mr-1" /> Authorized</>
                        ) : (
                          <><FiLock className="w-3 h-3 mr-1 animate-pulse" /> Locked</>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Patient Owner</span>
                        <strong className="text-slate-800 dark:text-slate-200">{record.owner}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Commit Date</span>
                        <span>{record.uploadTime.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                    <button
                      onClick={() => handleViewRecord(record)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FiEye className="w-4 h-4" />
                      View
                    </button>
                    
                    <button
                      onClick={() => handleDownload(record)}
                      disabled={downloadingId === record.id}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        currentStatus === 'Authorized'
                          ? 'bg-purple-600 hover:bg-purple-500 text-white border-transparent shadow-sm shadow-purple-600/10'
                          : 'bg-slate-100/50 dark:bg-slate-900/50 text-slate-400 border-slate-200/50 dark:border-slate-800/50 cursor-not-allowed'
                      }`}
                    >
                      {downloadingId === record.id ? (
                        <>
                          <FiCpu className="animate-spin w-4 h-4" />
                          {downloadProgress}%
                        </>
                      ) : (
                        <>
                          <FiDownload className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleVerifyHash(record)}
                      className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition-all cursor-pointer"
                      title="Verify Blockchain Hash Integrity"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-3xl shadow-sm">
            <span className="text-xs text-slate-500">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredRecords.length} total records)
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
                      ? 'bg-purple-600 text-white border-transparent'
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

      {/* 1. Modal: Record Details */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 text-slate-850 dark:text-slate-100 animate-zoom-in">
            
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center">
                  <FiFileText className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                    {selectedRecord.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">OWNER: {selectedRecord.owner}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content & Metadata */}
            <div className="space-y-4">
              {/* Record payload */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block font-mono">Plaintext Report Data</span>
                <div className={`p-4 rounded-2xl border font-sans text-xs leading-relaxed ${
                  selectedRecord.accessStatus === 'Authorized'
                    ? 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-900 text-slate-800 dark:text-slate-300'
                    : 'bg-rose-500/5 border-rose-500/10 text-rose-650 dark:text-rose-455 font-semibold flex items-start gap-2.5'
                }`}>
                  {selectedRecord.accessStatus === 'Authorized' ? (
                    selectedRecord.description
                  ) : (
                    <>
                      <FiLock className="w-5.5 h-5.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-1">Access Restrained</span>
                        Plaintext payload is securely encrypted on client nodes. Perform an ABAC authorization request to retrieve symmetric decryption keys.
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cryptographic metadata details */}
              <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-900 rounded-2xl p-4 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-450 block uppercase tracking-wider font-bold">Record SHA-256 Hash</span>
                  <span className="text-slate-800 dark:text-slate-300 break-all select-all font-semibold">{selectedRecord.recordHash}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-455 block uppercase tracking-wider font-bold">IPFS Content Identifier (CID)</span>
                  <span className="text-slate-800 dark:text-slate-300 break-all select-all font-semibold">{selectedRecord.ipfsHash}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-455 block uppercase tracking-wider font-bold">Blockchain Transaction ID</span>
                  <span className="text-slate-800 dark:text-slate-300 break-all select-all font-semibold">{selectedRecord.txId}</span>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex justify-end gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-350 cursor-pointer text-xs font-bold"
              >
                Close View
              </button>
              {selectedRecord.accessStatus === 'Authorized' && (
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    handleDownload(selectedRecord)
                  }}
                  className="px-5 py-2.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Download File
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. Modal: Blockchain verification dialog */}
      {isVerifyModalOpen && verifyingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-slate-800 dark:text-slate-100 animate-zoom-in font-mono text-xs">
            
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-405 flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white font-sans">
                    Ledger Integrity Check
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono">HYPERLEDGER COUCHDB STATE AUDIT</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsVerifyModalOpen(false)
                  setVerifyingRecord(null)
                  setVerificationResult(null)
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <FiX className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Verifying steps content */}
            {isVerifyingState ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <FiCpu className="animate-spin text-purple-500 w-8 h-8" />
                <div className="space-y-1 text-center font-sans">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Querying peer signatures...</span>
                  <p className="text-[10px] text-slate-405 leading-relaxed max-w-xs">Connecting to nodes to fetch block headers and evaluate state check vectors.</p>
                </div>
              </div>
            ) : verificationResult ? (
              <div className="space-y-5">
                
                {/* Result check info */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex gap-3 text-emerald-650 dark:text-emerald-405 leading-relaxed font-sans">
                  <FiShield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-white">Ledger Integrity Verified</span>
                    The local file hash is fully consistent with state data committed to block #{verificationResult.blockHeight}.
                  </div>
                </div>

                {/* Audit details metadata */}
                <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-2.5 text-[10px]">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">CONSENSUS NODES</span>
                    <span className="text-white font-bold">{verificationResult.consensusNodes} / 4 OK</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">POLICY CHECK</span>
                    <span className="text-emerald-400 font-bold">{verificationResult.policyCheck}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">LEDGER TIMESTAMP</span>
                    <span className="text-white font-bold">{verificationResult.timestamp}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-1">RECORD IDENTITY HASH (SHA-256)</span>
                    <span className="block text-slate-300 break-all select-all font-semibold">{verifyingRecord.recordHash}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-900/40">
                    <span className="block text-slate-500">BLOCK TRANSACTION ID</span>
                    <span className="block text-slate-300 break-all select-all font-semibold">{verificationResult.txId}</span>
                  </div>
                </div>

              </div>
            ) : null}

            {/* Actions */}
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/80 font-sans font-bold">
              <button
                onClick={() => {
                  setIsVerifyModalOpen(false)
                  setVerifyingRecord(null)
                  setVerificationResult(null)
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs cursor-pointer"
              >
                Done Check
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
