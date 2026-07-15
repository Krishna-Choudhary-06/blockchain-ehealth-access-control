import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { 
  FiUploadCloud, FiFileText, FiCheckCircle, FiLock, 
  FiFile, FiX, FiEye, FiClock, FiDatabase, FiUser, 
  FiAlertCircle, FiArrowRight, FiShield 
} from 'react-icons/fi'
import { uploadRecord } from '../services/apiService'
import { useAuth } from '../hooks/useAuth'
import { deriveRequiredLevel, levelLabel, roleAccessMap } from '../utils/privacyPolicy'

function safeIdPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(value || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function makeRecordId(patientName, selectedFile) {
  const patient = safeIdPart(patientName) || 'patient'
  const fileName = safeIdPart(selectedFile?.name?.replace(/\.[^.]+$/, '')) || 'record'
  return `${patient}-${fileName}-${Date.now()}`
}

export default function Upload() {
  const { user } = useAuth()
  const [patientName, setPatientName] = useState('')
  const [dataCategory, setDataCategory] = useState('prescription')
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [reportId, setReportId] = useState('')
  
  // Uploading state
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [result, setResult] = useState(null)

  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const categoryOptions = [
    { value: 'prescription', label: 'Prescription', level: 'L0' },
    { value: 'laboratory', label: 'Lab Report', level: 'L1' },
    { value: 'medical_history', label: 'Medical History', level: 'L2' },
    { value: 'billing', label: 'Billing', level: 'L3' }
  ]

  useEffect(() => {
    if (user?.role === 'Patient' && !patientName) {
      setPatientName(user.name || '')
    }
  }, [patientName, user])

  useEffect(() => {
    if (user?.role === 'Patient') {
      setDataCategory('medical_history')
    }
  }, [user?.role])

  const requiredLevel = deriveRequiredLevel(dataCategory)
  const selectedCategoryLabel = categoryOptions.find((option) => option.value === dataCategory)?.label || 'Unknown'

  // Clean up Object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const currentUserKeys = user?.name
    ? safeJsonParse(localStorage.getItem(`user_keys_${user.name}`), {})
    : {}

  const ownerId = user?.role === 'Patient'
    ? (user?.identityId || currentUserKeys.userId || safeIdPart(user?.name))
    : safeIdPart(patientName)

  // File extension checks
  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      setFileError('Please select a file.')
      return false
    }

    const extension = selectedFile.name.split('.').pop().toLowerCase()
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx']
    const rejectedExtensions = ['exe', 'bat', 'apk']

    // Check size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (selectedFile.size > maxSize) {
      const errorMsg = `File size exceeds 10MB limit (Current: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)`
      setFileError(errorMsg)
      toast.error(errorMsg)
      return false
    }

    if (rejectedExtensions.includes(extension)) {
      const errorMsg = `Security Block: File extension .${extension.toUpperCase()} is strictly prohibited.`
      setFileError(errorMsg)
      toast.error(errorMsg)
      return false
    }

    if (!allowedExtensions.includes(extension)) {
      const errorMsg = `Invalid file type. Supported: PDF, images, text, CSV, Word, and Excel documents.`
      setFileError(errorMsg)
      toast.error(errorMsg)
      return false
    }

    setFileError('')
    return true
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const isValid = validateFile(selectedFile)
      if (isValid) {
        setFile(selectedFile)
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(URL.createObjectURL(selectedFile))
        setReportId(makeRecordId(patientName, selectedFile))
      } else {
        setFile(null)
        setPreviewUrl(null)
        setReportId('')
      }
    }
  }

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0]
      const isValid = validateFile(selectedFile)
      if (isValid) {
        setFile(selectedFile)
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(URL.createObjectURL(selectedFile))
        setReportId(makeRecordId(patientName, selectedFile))
      } else {
        setFile(null)
        setPreviewUrl(null)
        setReportId('')
      }
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileError('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setReportId('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const loadDemoRecord = () => {
    const demoText = [
      'Patient Name: John Doe',
      'Diagnosis: Hypertension',
      'Prescription: Amlodipine'
    ].join('\n')

    const demoFile = new File([demoText], 'demo_record.txt', { type: 'text/plain' })
    setPatientName('patient1')
    setDataCategory('prescription')
    setFileError('')
    setFile(demoFile)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(URL.createObjectURL(demoFile))
    setReportId(makeRecordId('patient1', demoFile))
    toast.success('Demo record loaded into the upload form.')
  }

  // Handle upload submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!patientName.trim()) {
      toast.error('Patient ID is required.')
      return
    }

    const registeredUsers = safeJsonParse(localStorage.getItem('registered_users'), [])
    const normalizedInput = patientName.trim().toLowerCase().replace(/\s+/g, '')
    const patientExists = registeredUsers.some(u =>
      u.role?.toLowerCase() === 'patient' && (
        String(u.userId || '').toLowerCase().replace(/\s+/g, '') === normalizedInput ||
        String(u.name || '').toLowerCase().replace(/\s+/g, '') === normalizedInput ||
        String(u.email || '').toLowerCase().replace(/\s+/g, '') === normalizedInput
      )
    )
    if (!patientExists) {
      toast.error(`Patient "${patientName.trim()}" is not registered. Please register the patient first.`)
      return
    }

    if (!file) {
      setFileError('Please select or drop a medical file.')
      toast.error('Medical file is required.')
      return
    }

    if (fileError) {
      toast.error('Please fix the validation errors first.')
      return
    }

    setUploading(true)
    setProgress(5)
    setCurrentStep('Reading medical file...')
    setResult(null)

    try {
      setProgress(25)
      setCurrentStep('Mapping category to privacy level and deriving authorized recipients...')
      
      setProgress(50)
      setCurrentStep('Sending medical file to backend for BGW encryption...')

      setProgress(70)
      setCurrentStep('Uploading encrypted BGW envelope to IPFS and writing Fabric policy...')
      
      const fileId = reportId || makeRecordId(patientName, file)
      
      const apiResult = await uploadRecord(
        patientName.replace(/ /g, ''),
        fileId,
        file,
        {
          category: dataCategory,
          ownerId,
          ownerRecipientId: user?.bgwRecipientId || currentUserKeys.bgwRecipientId || '',
          uploadedBy: user?.identityId || currentUserKeys.userId || user?.name || '',
          uploaderRole: user?.role || '',
          organization: user?.organization || currentUserKeys.organization || ''
        }
      )
      
      if (!apiResult.success) throw new Error(apiResult.error || 'Upload failed at backend')
      
      const cid = apiResult.ipfsHash || apiResult.data?.ipfsHash || 'CID_MISSING_FROM_BACKEND'
      const resolvedLevel = apiResult.requiredLevel || requiredLevel

      const txId = apiResult.txId || apiResult.data?.txId || apiResult.data?.transactionId || apiResult.payloadHash || fileId
      const certId = apiResult.certificateId || apiResult.data?.certificateId || `CERT-${fileId}`

      const ledgerRecord = {
        id: fileId,
        name: `${fileId}: ${file.name}`,
        sensitivity: resolvedLevel,
        category: dataCategory,
        ipfsHash: cid,
        payloadHash: apiResult.payloadHash,
        uploadTime: new Date().toLocaleString(),
        bgwHeader: apiResult.bgwHeader,
        updateToken: apiResult.data?.updateToken,
        recipients: apiResult.recipients || [],
        authorizedUsers: apiResult.authorizedUsers || [],
        ownerId,
        uploadedBy: user?.identityId || currentUserKeys.userId || user?.name || '',
        uploaderRole: user?.role || '',
        patientName: patientName,
        fileName: file.name,
        fileSize: formatBytes(file.size),
        encryptionStatus: 'BGW Broadcast Encryption + AES-256-GCM',
        certificateId: certId,
        txId
      }

      const localRecords = JSON.parse(localStorage.getItem('patient_records') || '[]')
      const nextLocalRecords = localRecords.filter((record) => record?.id !== fileId)
      nextLocalRecords.push(ledgerRecord)
      localStorage.setItem('patient_records', JSON.stringify(nextLocalRecords))

      setProgress(100)
      setCurrentStep('Completed')
      
      setResult({
        ipfsHash: cid,
        payloadHash: apiResult.payloadHash,
        txId,
        encryptionStatus: 'BGW Broadcast Encryption + AES-256-GCM',
        fileName: file.name,
        fileSize: formatBytes(file.size),
        uploadTime: ledgerRecord.uploadTime,
        patientName: patientName,
        sensitivityLevel: resolvedLevel,
        category: dataCategory,
        certificateId: certId
      })

      window.dispatchEvent(new Event('records:updated'))
      setUploading(false)
      toast.success('Medical record securely committed to Blockchain and IPFS!')
    } catch (error) {
      console.error(error)
      toast.error(`BGW/IPFS/Fabric upload failed: ${error.message}`)
      setUploading(false)
      setProgress(0)
      setCurrentStep('')
    }
  }

  const handleReset = () => {
    setPatientName('')
    setDataCategory('prescription')
    setFile(null)
    setFileError('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setReportId('')
    setResult(null)
    setProgress(0)
    setCurrentStep('')
  }

  // Format bytes helper
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  const isPdf = file?.name?.toLowerCase().endsWith('.pdf')

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background radial gradients */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-7000"></div>

      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-900/60 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <FiUploadCloud className="text-purple-600 dark:text-purple-400" />
              Secure File Upload
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
              Store encrypted medical records in IPFS while Fabric enforces privacy levels, BGW headers, content hashes, and access logs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 px-3.5 py-2 rounded-xl text-purple-600 dark:text-purple-400 shadow-sm self-start md:self-center">
            <FiShield />
            <span>BGW + FABRIC + IPFS</span>
          </div>
        </div>

        {/* Loading/Progress Panel */}
        {uploading && (
          <div className="bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-900/35 backdrop-blur-xl rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-xl space-y-6 transform scale-98 transition-transform duration-300">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-purple-200 dark:border-purple-900/30 border-t-purple-600 dark:border-t-purple-400 animate-spin"></div>
              <FiLock className="absolute text-purple-600 dark:text-purple-400 w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Securing Medical Payload</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">{currentStep}</p>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                <span>PROGRESS</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-800/40">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-650 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Main Interface Grid */}
        {!uploading && !result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Section */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-md dark:shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Upload Specifications</h2>
                <button
                  type="button"
                  onClick={loadDemoRecord}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-500/20 text-purple-700 dark:text-purple-300 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
                >
                  <FiShield className="w-4 h-4" />
                  Load demo_record.txt
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient ID field */}
                <div className="space-y-1.5">
                  <label htmlFor="patientName" className="text-xs font-bold text-slate-650 dark:text-slate-350 uppercase tracking-wider block">
                    Patient ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiUser className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter the patient ID for this upload"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-10 pr-4 py-3.5 text-slate-950 dark:text-white placeholder-slate-400/80 focus:outline-none focus:ring-2 focus:ring-purple-500/80 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="dataCategory" className="text-xs font-bold text-slate-650 dark:text-slate-350 uppercase tracking-wider block">
                    Data Category
                  </label>
                  <select
                    id="dataCategory"
                    value={dataCategory}
                    onChange={(e) => setDataCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3.5 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/80 focus:border-transparent transition-all text-sm"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                      Selected Type: {selectedCategoryLabel}
                    </span>
                    <span className="px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-900/40 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 font-bold">
                      Required Level: {requiredLevel}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-300">
                    <FiShield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Automatic Mapping</span>
                      The system automatically maps category to privacy level and derives BGW recipients. You do not need to select doctors or recipient IDs.
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-xs space-y-2">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FiShield className="w-3 h-3" />
                      Who Can Access This Record
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(roleAccessMap).map(([role, levels]) => {
                        const canAccess = levels.includes(requiredLevel)
                        return (
                          <span key={role} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            canAccess
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : 'bg-slate-200/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-850 line-through decoration-1'
                          }`}>
                            {canAccess ? role : <span className="line-through decoration-1">{role}</span>}
                          </span>
                        )
                      })}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-850/50">
                      {requiredLevel === 'L0' && 'Only Doctors can access prescriptions (L0).'}
                      {requiredLevel === 'L1' && 'Doctors and Lab Technicians can access lab reports (L1).'}
                      {requiredLevel === 'L2' && 'Doctors, Nurses, and Staff can access medical history (L2).'}
                      {requiredLevel === 'L3' && 'All roles including Public can access billing records (L3).'}
                    </div>
                  </div>
                </div>

                {/* File Upload drag area */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-650 dark:text-slate-350 uppercase tracking-wider block">
                    Medical Record File
                  </span>

                  {!file ? (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={triggerFileSelect}
                      className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                        dragActive 
                          ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/10 scale-99' 
                          : 'border-slate-300 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-900 bg-slate-50/50 dark:bg-slate-950/30'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.doc,.docx,.xls,.xlsx"
                      />
                      
                      <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 shadow-sm">
                        <FiUploadCloud className="w-6 h-6" />
                      </div>

                      <p className="text-sm font-bold text-slate-850 dark:text-white text-center">
                        Drag & Drop or Click to browse
                      </p>
                      
                      <p className="text-xs text-slate-550 dark:text-slate-500 text-center mt-1.5">
                        Allowed: PDF, images, text, CSV, Word, Excel (Max 10MB)
                      </p>

                      <div className="flex items-center gap-3 mt-4 text-[10px] uppercase font-bold tracking-wider text-red-550 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/20">
                        <FiAlertCircle className="w-3.5 h-3.5" />
                        <span>Forbidden: EXE, BAT, APK</span>
                      </div>
                    </div>
                  ) : (
                    // Selected file summary
                    <div className="border border-slate-200 dark:border-slate-850 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3 animate-zoom-in">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/15 flex items-center justify-center text-purple-650 dark:text-purple-400 flex-shrink-0">
                          {isPdf ? <FiFileText className="w-5.5 h-5.5" /> : <FiFile className="w-5.5 h-5.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-2">
                            {file.name}
                          </p>
                          <span className="text-xs text-slate-500 font-mono">
                            {formatBytes(file.size)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all flex-shrink-0"
                        title="Remove file"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <div className="text-red-550 dark:text-red-400 text-xs font-semibold flex items-center gap-2 mt-2 bg-red-550/10 p-3 rounded-xl border border-red-500/20 animate-shake">
                      <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-750 hover:to-indigo-750 text-white rounded-2xl py-4 font-bold text-sm shadow-lg shadow-purple-600/15 hover:shadow-purple-700/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Encrypt & Upload to Ledger
                  <FiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </form>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl backdrop-blur-xl shadow-md dark:shadow-xl h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2 mb-4">
                    <FiEye className="text-slate-400" />
                    File Previewer
                  </h2>
                  
                  {file && previewUrl ? (
                    <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-250 dark:border-slate-900 flex items-center justify-center min-h-[300px] relative group p-2">
                      {isPdf ? (
                        /* PDF Preview Box */
                        <div className="w-full text-center p-6 space-y-4">
                          <FiFileText className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto drop-shadow-sm" />
                          <div>
                            <p className="text-sm font-bold text-slate-850 dark:text-slate-200">{file.name}</p>
                            <span className="text-xs text-slate-500 font-mono block mt-1">{formatBytes(file.size)}</span>
                          </div>
                          <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-650 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/25 px-3 py-1.5 rounded-lg">
                            <span>PDF Document Verified</span>
                          </div>
                          
                            {/* PDF metadata container to look like a standard reader view */}
                            <div className="border border-slate-250 dark:border-slate-900 rounded-xl p-4 bg-white dark:bg-slate-900/50 text-[10px] text-slate-400 text-left font-mono space-y-2 h-24 overflow-hidden mask-fade-bottom">
                              <p className="font-bold border-b border-slate-100 dark:border-slate-800 pb-1 text-slate-600 dark:text-slate-355">MEDICAL CASE SUMMARY</p>
                              <p>Patient ID: {patientName || 'N/A'}</p>
                              <p>Report ID: {reportId || 'N/A'}</p>
                              <p>Verification Hash: SECURE_LOCAL_BUFFER_SHA256</p>
                            </div>
                        </div>
                      ) : (
                        /* Image Preview Box */
                        <img 
                          src={previewUrl} 
                          alt="Medical Preview" 
                          className="max-h-[360px] w-auto object-contain rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 dark:border-slate-850 rounded-2xl p-12 text-center text-slate-450 dark:text-slate-600 flex flex-col items-center justify-center min-h-[300px]">
                      <FiFile className="w-12 h-12 mb-3 opacity-40" />
                      <p className="text-sm font-semibold">No active file selected</p>
                      <p className="text-xs mt-1">Select a valid PDF or Image to see the visual preview layout here.</p>
                    </div>
                  )}
                </div>
                
                {file && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-850 flex justify-between text-xs text-slate-500 dark:text-slate-450 font-medium">
                    <span>NAME: <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[120px] inline-block align-bottom">{file.name}</span></span>
                    <span>SIZE: <span className="text-slate-800 dark:text-slate-200 font-bold">{formatBytes(file.size)}</span></span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Results Card panel */}
        {result && (
          <div className="max-w-4xl mx-auto space-y-8 animate-zoom-in">
            <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/60 dark:to-slate-950/20 border border-slate-250 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl dark:shadow-2xl relative overflow-hidden space-y-6">
              
              {/* Highlight ribbon */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-purple-600 to-indigo-650"></div>

              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900/65 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-950/30">
                    <FiCheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-950 dark:text-white">Secure Ledger Entry Created</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">The block has been consensus validated and stored.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wide self-start sm:self-center">
                  STATUS: COMMITTED
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Result hashes section */}
                <div className="md:col-span-7 space-y-5">
                  <h3 className="text-sm font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FiDatabase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Storage Details
                  </h3>

                  {/* Hash components */}
                  <div className="space-y-4">
                    
                    {/* IPFS Hash */}
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-900">
                      <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">IPFS Content Identifier (CID)</span>
                      <p className="text-xs font-mono font-bold text-purple-650 dark:text-purple-450 select-all break-all leading-normal">
                        {result.ipfsHash}
                      </p>
                    </div>

                    {/* Transaction ID */}
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-900">
                      <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Blockchain Transaction ID</span>
                      <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-350 select-all break-all leading-normal">
                        {result.txId}
                      </p>
                    </div>

                    {/* Encryption status */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-900">
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Encryption Standard</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300 font-mono block mt-0.5">{result.encryptionStatus}</span>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950/30 flex items-center justify-center">
                        <FiLock className="w-4.5 h-4.5" />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Metadata Card section */}
                <div className="md:col-span-5 space-y-5">
                  <h3 className="text-sm font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FiFileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Record Metadata
                  </h3>

                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-900 p-5 rounded-2xl space-y-4">
                    <div className="border-b border-slate-200 dark:border-slate-900/60 pb-3">
                      <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest font-mono">Ledger Certificate</span>
                      <p className="text-xs font-mono font-bold text-purple-650 dark:text-purple-400 mt-0.5">{result.certificateId}</p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-450 dark:text-slate-500">Patient:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{result.patientName}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-450 dark:text-slate-500">File Name:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={result.fileName}>{result.fileName}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-450 dark:text-slate-500">File Size:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{result.fileSize}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-450 dark:text-slate-500">Privacy Level:</span>
                        <span className="font-bold font-mono text-purple-600 dark:text-purple-450 bg-purple-50 dark:bg-purple-900/10 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/30">
                          {result.sensitivityLevel} · {levelLabel(result.sensitivityLevel)}
                        </span>
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-200/50 dark:border-slate-900/50">
                        <span className="font-semibold text-slate-450 dark:text-slate-500 flex items-center gap-1">
                          <FiClock className="w-3.5 h-3.5" />
                          Timestamp:
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">{result.uploadTime}</span>
                      </div>

                    </div>
                  </div>
                </div>

              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-slate-200 dark:border-slate-900/65 pt-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl px-6 py-3 font-bold text-sm transition-all text-center cursor-pointer"
                >
                  Upload Another Record
                </button>
                <a
                  href="/dashboard"
                  className="w-full sm:w-auto border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl px-6 py-3 font-bold text-sm transition-all text-center cursor-pointer"
                >
                  Return to Dashboard
                </a>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
