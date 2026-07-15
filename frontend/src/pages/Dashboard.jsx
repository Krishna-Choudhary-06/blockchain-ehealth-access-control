import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  FiFileText, FiUserCheck, FiCpu, FiUsers, FiHardDrive, FiActivity,
  FiShield, FiSettings, FiUser, FiCheck, FiX, FiCopy, 
  FiAlertTriangle, FiLock, FiUnlock, FiKey, FiDownload, FiExternalLink,
  FiEye
} from 'react-icons/fi'
import { roleCanAccessLevel, levelLabel } from '../utils/privacyPolicy'
import {
  getLogs,
  getDataRecords,
  getUsers,
  requestAccessAndDecrypt,
  addRecipients,
  removeRecipients
} from '../services/apiService'

const TEST_PREFIXES = [
  'doctor_paper_',
  'doctor_full_',
  'doctor_bgw_',
  'record_paper_',
  'record_full_',
  'data_bgw_'
]

function isTestArtifact(value = '') {
  const text = String(value).toLowerCase()
  return TEST_PREFIXES.some(prefix => text.startsWith(prefix)) || ['doctor1', 'record1'].includes(text)
}

function isRealLog(log) {
  return !isTestArtifact(log.requesterId) && !isTestArtifact(log.dataId)
}

function isRealRecord(record) {
  return !isTestArtifact(record.dataId || record.id)
}

function parseJson(value, fallback) {
  try {
    if (value == null || value === '') return fallback
    if (typeof value === 'object') return value
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function hasEncryptedPayload(record) {
  return Boolean(record?.id && record?.ipfsHash && record?.payloadHash && (record?.bgwHeader || record?.updateToken))
}

function isLocalRecordUsable(record) {
  return isRealRecord(record) && hasEncryptedPayload(record)
}

function normalizeLogStatus(action = '') {
  return String(action).toUpperCase() === 'GRANTED' ? 'Granted' : 'Denied'
}

function formatDateTime(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function getCurrentUserKeys(user) {
  if (!user?.name) return {}
  return readJson(`user_keys_${user.name}`, {})
}

function isUserRecordOwner(record, userId) {
  if (!userId) return false
  const uploaderCandidates = [
    record?.uploadedBy,
    record?.metadata?.uploadedBy
  ]
  return uploaderCandidates.some(candidate => safeCompare(candidate) === safeCompare(userId))
}

function isUserRecordSubject(record, userId) {
  if (!userId) return false
  return (
    safeCompare(record?.patientId) === safeCompare(userId) ||
    safeCompare(record?.metadata?.patientId) === safeCompare(userId)
  )
}

function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function getMimeType(fileName = '') {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.json')) return 'application/json'
  if (lower.endsWith('.txt') || lower.endsWith('.csv')) return 'text/plain'
  return 'application/octet-stream'
}

function isTextMime(mimeType) {
  return mimeType.startsWith('text/') || mimeType === 'application/json'
}

function safeCompare(value = '') {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role || 'Patient'
  const location = useLocation()
  const hash = location.hash || ''

  const [networkUsers, setNetworkUsers] = useState(0)
  const [fabricUsers, setFabricUsers] = useState([])
  const [accessLogs, setAccessLogs] = useState([])
  const [patientRecords, setPatientRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [grantRecord, setGrantRecord] = useState(null)
  const [grantMode, setGrantMode] = useState('grant')
  const [recipientId, setRecipientId] = useState('')
  const [authorizedUser, setAuthorizedUser] = useState('')
  const [granting, setGranting] = useState(false)

  // Doctor Specific States (for decrypting files)
  const [selectedRecordToDecrypt, setSelectedRecordToDecrypt] = useState(null)
  const [decryptedContent, setDecryptedContent] = useState('')
  const [decryptedFile, setDecryptedFile] = useState(null)
  const [isDecrypting, setIsDecrypting] = useState(false)

  // Settings state (Admin setting tuning parameters)
  const [settings, setSettings] = useState({
    keyLength: 'AES-256',
    consensusNodes: 4,
    enforceMfa: true
  })

  // copy to clipboard helper
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const refreshRecords = async () => {
    setRecordsLoading(true)
    try {
      const response = await getDataRecords()
      if (response.success && Array.isArray(response.data)) {
        const chainRecords = response.data
          .filter(isRealRecord)
          .map((record) => {
            const bgwHeader = parseJson(record.bgwHeader, null)
            const recipients = Array.isArray(bgwHeader?.recipientIds)
              ? bgwHeader.recipientIds.map(Number)
              : parseJson(record.metadata?.recipients, [])
            const authorizedUsers = Array.isArray(record.authorizedUsers)
              ? record.authorizedUsers
              : []

            return {
              id: record.dataId,
              name: `${record.dataId}: ${record.metadata?.filename || record.category || 'Medical Record'}`,
              sensitivity: record.requiredLevel,
              category: record.category,
              ipfsHash: record.ipfsHash,
              payloadHash: record.payloadHash,
              bgwHeader,
              updateToken: record.updateToken,
              authorizedUsers,
              recipients,
              uploadTime: record.storedAt,
              patientName: record.patientId,
              patientId: record.patientId,
              ownerId: record.metadata?.ownerId,
              uploadedBy: record.metadata?.uploadedBy,
              uploaderRole: record.metadata?.uploaderRole,
              fileName: record.metadata?.filename || record.dataId,
              encryptionStatus: bgwHeader && record.updateToken
                ? 'BGW Broadcast Encryption + AES-256-GCM'
                : 'Legacy / Non-BGW Record',
              source: 'fabric',
              organization: record.metadata?.organization || '',
              metadata: record.metadata || {},
              revokedUsers: record.revokedUsers || [],
              grantedUsers: record.grantedUsers || [],
              rawRecord: record
            }
          })

        const saved = readJson('patient_records', [])
          .filter(isLocalRecordUsable)
          .map((record) => ({
            ...record,
            source: 'legacy',
            encryptionStatus: record.encryptionStatus || 'Legacy / Non-BGW Record'
          }))

        setPatientRecords([
          ...chainRecords,
          ...saved.filter((local) => !chainRecords.some((chain) => chain.id === local.id))
        ])
      }
    } catch (err) {
      console.error('Failed to load Fabric data records', err)
      const fallback = readJson('patient_records', []).filter(isLocalRecordUsable)
      setPatientRecords(fallback.map((record) => ({ ...record, source: 'legacy' })))
    } finally {
      setRecordsLoading(false)
    }
  }

  // Decryption action for Doctor
  const handleDecrypt = async (record) => {
    setIsDecrypting(true)
    setSelectedRecordToDecrypt(record)
    setDecryptedContent('')
    setDecryptedFile((previous) => {
      if (previous?.url) URL.revokeObjectURL(previous.url)
      return null
    })

    try {
      if (record.payloadHash && record.ipfsHash) {
        const docKeys = getCurrentUserKeys(user)
        if (!docKeys.userId) {
          throw new Error(`BGW keys for ${user.name} not found in this client. Please enroll this identity first.`)
        }

        if (!docKeys.bgwPrivateKey) {
          throw new Error(`BGW private key is missing for ${user.name}. Re-enroll the identity.`)
        }

        const response = await requestAccessAndDecrypt(
          docKeys.userId,
          record.id,
          docKeys.bgwPrivateKey,
          docKeys.bgwPublicKey,
          role
        )
        if (!response.success) {
          throw new Error(response.error || response.access?.message || 'Access denied by Fabric policy.')
        }
        const fileName = record.fileName || record.file || record.name || `${record.id}.bin`
        const mimeType = getMimeType(fileName)
        const bytes = base64ToBytes(response.data)
        if (isTextMime(mimeType)) {
          setDecryptedContent(new TextDecoder().decode(bytes))
        } else {
          const blob = new Blob([bytes], { type: mimeType })
          setDecryptedFile({
            name: fileName,
            type: mimeType,
            size: bytes.byteLength,
            url: URL.createObjectURL(blob)
          })
        }
      } else {
        throw new Error('This record was not uploaded through the BGW/IPFS workflow, so there is no encrypted payload to decrypt.')
      }
    } catch (error) {
      console.error(error)
      toast.error(`Decryption failed: ${error.message}`)
      setDecryptedContent(`[ERROR] Decryption process terminated.\nReason: ${error.message}`)
      setDecryptedFile(null)
    } finally {
      setIsDecrypting(false)
    }
  }
  const handleGrantAccess = async () => {
    if (!grantRecord) return

    try {
      setGranting(true)
      const nextRecipientId = Number(recipientId)
      if (!Number.isInteger(nextRecipientId) || nextRecipientId <= 0) {
        throw new Error('Recipient ID must be a positive integer.')
      }
      if (!authorizedUser.trim()) {
        throw new Error('Authorized user is required.')
      }

      const response = await addRecipients(
        grantRecord.id,
        [nextRecipientId],
        [authorizedUser.trim()],
        currentUserId
      )

      if (!response.success) {
        throw new Error(response.error || 'Grant access failed')
      }

      toast.success('Access granted successfully')
      setGrantRecord(null)
      setGrantMode('grant')
      setRecipientId('')
      setAuthorizedUser('')
      await refreshRecords()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGranting(false)
    }
  }

  const handleRevokeAccess = async () => {
    if (!grantRecord) return

    try {
      setGranting(true)
      const nextRecipientId = Number(recipientId)
      if (!Number.isInteger(nextRecipientId) || nextRecipientId <= 0) {
        throw new Error('Recipient ID must be a positive integer.')
      }

      const response = await removeRecipients(
        grantRecord.id,
        [nextRecipientId],
        authorizedUser.trim() ? [authorizedUser.trim()] : [],
        currentUserId
      )

      if (!response.success) {
        throw new Error(response.error || 'Remove access failed')
      }

      toast.success('Access revoked successfully')
      setGrantRecord(null)
      setGrantMode('grant')
      setRecipientId('')
      setAuthorizedUser('')
      await refreshRecords()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGranting(false)
    }
  }
  useEffect(() => {
    return () => {
      if (decryptedFile?.url) URL.revokeObjectURL(decryptedFile.url)
    }
  }, [decryptedFile])

  const registeredUsers = readJson('registered_users', [])
  const currentKeys = getCurrentUserKeys(user)
  const currentUserId = user?.identityId || currentKeys.userId || ''
  const currentOrganization = user?.organization || currentKeys.organization || ''

  const getIdentityOrganization = (identityValue) => {
    const normalized = safeCompare(identityValue)
    if (!normalized) return ''

    const directMatch = registeredUsers.find((item) => {
      const itemId = safeCompare(item.userId || item.identityId || '')
      const itemName = safeCompare(item.name || '')
      return itemId === normalized || itemName === normalized
    })

    if (directMatch?.organization) {
      return directMatch.organization
    }

    const keyMatch = registeredUsers.find((item) => safeCompare(item.name || '') === normalized)
    if (keyMatch?.organization) {
      return keyMatch.organization
    }

    return ''
  }

  const getRecordHospital = (record) => {
    const orgFromRecord =
      record.organization ||
      record.patientOrganization ||
      record.metadata?.organization ||
      record.metadata?.hospital ||
      record.metadata?.org ||
      ''

    if (orgFromRecord) return orgFromRecord

    const patientIdentity = record.patientId || record.patientName || record.ownerId || ''
    return getIdentityOrganization(patientIdentity)
  }

  const matchesHospitalScope = (record) => {
    if (role === 'Patient') return true
    if (currentKeys.userId && Array.isArray(record.grantedUsers) && record.grantedUsers.includes(currentKeys.userId)) return true
    if (!currentOrganization) return true
    const recordHospital = getRecordHospital(record)
    if (!recordHospital) return false
    return safeCompare(recordHospital) === safeCompare(currentOrganization)
  }

  const isOwnedByCurrentPatient = (record) => {
    if (role !== 'Patient') return true
    const normalizedName = safeCompare(user?.name)
    return (
      record.ownerId === currentUserId ||
      record.patientId === currentUserId ||
      safeCompare(record.patientName) === normalizedName ||
      safeCompare(record.patientId) === safeCompare(currentUserId)
    )
  }
  const visibleRecords = patientRecords.filter(isOwnedByCurrentPatient).filter(matchesHospitalScope)
  const visibleRecordIds = new Set(visibleRecords.map(record => record.id))
  const relevantAccessLogs = role === 'Patient'
    ? accessLogs.filter(log => visibleRecordIds.has(log.dataId))
    : accessLogs
  const displayedAccessLogs = role === 'Patient' ? relevantAccessLogs : accessLogs
  const deniedLogs = relevantAccessLogs.filter(log => normalizeLogStatus(log.action) === 'Denied')
  const successfulReads = accessLogs.filter(log =>
    normalizeLogStatus(log.action) === 'Granted' &&
    (!currentKeys.userId || log.requesterId === currentKeys.userId || log.requesterId === user?.identityId)
  ).length
  const authorizedClinicalUsers = registeredUsers.filter(item => ['Doctor', 'Nurse', 'Lab', 'Staff'].includes(item.role)).length
  const accessibleRecords = visibleRecords
  const assignedPatients = new Set(accessibleRecords.map(record => record.patientName || record.patientId).filter(Boolean)).size
  const patientAccessHistory = relevantAccessLogs.map((log, index) => {
    const date = new Date(log.time)
    const knownRecord = visibleRecords.find(record => record.id === log.dataId)
    return {
      id: `${log.requesterId}-${log.dataId}-${log.time}-${index}`,
      user: log.requesterId,
      action: log.action,
      file: knownRecord?.name || log.dataId,
      date: Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString(),
      time: Number.isNaN(date.getTime()) ? log.time : date.toLocaleTimeString(),
      status: normalizeLogStatus(log.action)
    }
  })
  const currentUserLogs = accessLogs.filter(log =>
    !currentKeys.userId || log.requesterId === currentKeys.userId || log.requesterId === user?.identityId
  )
  const currentUserInitials = (user?.name || 'User')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Stat cards configurations based on active role
  const statCards = {
    Patient: [
      { id: 1, label: 'My Enrolled Files', value: `${visibleRecords.length}`, icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' },
      { id: 2, label: 'Authorized Clinical Users', value: `${authorizedClinicalUsers}`, icon: FiUserCheck, color: 'text-blue-600 bg-blue-500/10' },
      { id: 3, label: 'Denied Access Attempts', value: `${deniedLogs.length}`, icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' }
    ],
    Doctor: [
      { id: 1, label: 'Assigned Patients', value: `${assignedPatients}`, icon: FiUsers, color: 'text-blue-600 bg-blue-500/10' },
      { id: 2, label: 'Accessible Records', value: `${accessibleRecords.length}`, icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' },
      { id: 3, label: 'Successful File Reads', value: `${successfulReads}`, icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' }
    ],
    Nurse: [
      { id: 1, label: 'Reports Accessible', value: `${accessibleRecords.length}`, icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' },
      { id: 2, label: 'Access Requests Granted', value: `${successfulReads}`, icon: FiUserCheck, color: 'text-blue-600 bg-blue-500/10' },
      { id: 3, label: 'Denied Requests', value: `${deniedLogs.length}`, icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' }
    ],
    'Lab Technician': [
      { id: 1, label: 'Records Accessible', value: `${accessibleRecords.length}`, icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' },
      { id: 2, label: 'Successful Reads', value: `${successfulReads}`, icon: FiUserCheck, color: 'text-blue-600 bg-blue-500/10' },
      { id: 3, label: 'Access Log Entries', value: `${accessLogs.length}`, icon: FiHardDrive, color: 'text-amber-600 bg-amber-500/10' }
    ],
    Accountant: [
      { id: 1, label: 'Records Accessible', value: `${accessibleRecords.length}`, icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' },
      { id: 2, label: 'Successful Reads', value: `${successfulReads}`, icon: FiUserCheck, color: 'text-blue-600 bg-blue-500/10' },
      { id: 3, label: 'Access Log Entries', value: `${accessLogs.length}`, icon: FiHardDrive, color: 'text-amber-600 bg-amber-500/10' }
    ],
    Admin: [
      { id: 1, label: 'Peer Nodes Connected', value: '4 / 4', icon: FiCpu, color: 'text-emerald-600 bg-emerald-500/10' },
      { id: 2, label: 'Registered Network Users', value: `${networkUsers}`, icon: FiUsers, color: 'text-purple-600 bg-purple-500/10' },
      { id: 3, label: 'Access Log Entries', value: `${accessLogs.length}`, icon: FiHardDrive, color: 'text-blue-600 bg-blue-500/10' }
    ]
  }

  const activeStats = statCards[role] || statCards.Patient
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const response = await getLogs()
        if (response.success) {
          setAccessLogs(
            response.data.filter(isRealLog).sort(
              (a, b) => new Date(b.time) - new Date(a.time)
            )
          )
        }
      } catch (err) {
        console.error('Failed to load logs', err)
      }
    }

    const loadUsers = async () => {
      const localUsers = readJson('registered_users', [])
      try {
        const response = await getUsers()
        if (response.success && Array.isArray(response.data)) {
          setFabricUsers(response.data)
          setNetworkUsers(Math.max(localUsers.length, response.data.filter((entry) => !isTestArtifact(entry.userId)).length))
          return
        }
      } catch (err) {
        console.error('Failed to load Fabric users', err)
      }
      setNetworkUsers(localUsers.length)
    }

    loadLogs()
    loadUsers()
    refreshRecords()
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
            {deniedLogs.length} Denied
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deniedLogs.length === 0 && (
            <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-4 rounded-2xl flex items-start space-x-3 shadow-sm">
              <FiShield className="text-emerald-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">No Denied Access Attempts</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  The current ledger view does not contain rejected ABAC/BGW access attempts.
                </p>
              </div>
            </div>
          )}
          {deniedLogs.slice(0, 3).map(log => (
            <div key={`${log.requesterId}-${log.dataId}-${log.time}-alert`} className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-4 rounded-2xl flex items-start space-x-3 shadow-sm hover:border-red-500/30 dark:hover:border-rose-900/40 transition-all">
              <FiAlertTriangle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">Access Denied By Policy</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {log.requesterId} requested {log.dataId}; requester level {log.requesterLevel || 'N/A'} did not satisfy data level {log.dataLevel || 'N/A'}.
                </p>
                <span className="text-[9px] font-mono text-red-500 dark:text-rose-400 block mt-2 font-bold">{formatDateTime(log.time)}</span>
              </div>
            </div>
          ))}
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
                <th className="pb-3.5 pl-2">Requester</th>
<th className="pb-3.5">Data ID</th>
<th className="pb-3.5">Action</th>
<th className="pb-3.5">Requester Level</th>
<th className="pb-3.5">Data Level</th>
<th className="pb-3.5 text-right pr-2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-355 text-xs">
              {displayedAccessLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-450 dark:text-slate-500">
                    No Fabric access logs are available for registered application activity yet.
                  </td>
                </tr>
              )}
              {displayedAccessLogs.map((log) => (
                <tr
  key={`${log.requesterId}-${log.dataId}-${log.time}`}
  className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors"
>
  <td className="py-4 pl-2 font-semibold text-slate-900 dark:text-white">
    {log.requesterId}
  </td>

  <td className="py-4 font-mono">
    {log.dataId}
  </td>

  <td className="py-4">
    {log.action}
  </td>

  <td className="py-4">
    {log.requesterLevel}
  </td>

  <td className="py-4">
    {log.dataLevel}
  </td>

  <td className="py-4 text-right pr-2 font-mono text-[10px]">
    {log.time}
  </td>
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
        {visibleRecords.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm text-sm text-slate-500 dark:text-slate-400">
            No medical records have been uploaded through the BGW/IPFS workflow yet.
          </div>
        )}
        {visibleRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4 transition-transform duration-150 hover:-translate-y-0.5"
            onClick={() => setSelectedRecordToDecrypt(record)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setSelectedRecordToDecrypt(record)
              }
            }}
          >
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
                <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" title={`${levelLabel(record.sensitivity)} — ${record.sensitivity}`}>
                  {record.sensitivity} · {levelLabel(record.sensitivity)}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border ${
                  record.bgwHeader && record.updateToken
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                }`}>
                  {record.bgwHeader && record.updateToken ? 'BGW Enabled' : 'Legacy'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold">Recipients</div>
                <div className="mt-1 font-mono text-slate-700 dark:text-slate-300">
                  {Array.isArray(record.recipients) && record.recipients.length > 0 ? record.recipients.join(', ') : 'Not specified'}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold">Authorized Users</div>
                <div className="mt-1 font-mono text-slate-700 dark:text-slate-300">
                  {Array.isArray(record.authorizedUsers) && record.authorizedUsers.length > 0 ? record.authorizedUsers.join(', ') : 'Not specified'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold flex items-center gap-1.5">
                  <FiUserCheck className="w-3 h-3 text-emerald-500" />
                  Granted Users
                </div>
                <div className="mt-1 flex flex-wrap gap-1" title={Array.isArray(record.grantedUsers) ? record.grantedUsers.join(', ') : ''}>
                  {Array.isArray(record.grantedUsers) && record.grantedUsers.length > 0
                    ? record.grantedUsers.map((u, i) => (
                        <span key={i} className="inline-block px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-md text-[10px] font-mono font-medium">{u}</span>
                      ))
                    : <span className="text-slate-400 italic text-[10px]">Not specified</span>}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold flex items-center gap-1.5">
                  <FiX className="w-3 h-3 text-rose-500" />
                  Revoked Users
                </div>
                <div className="mt-1 flex flex-wrap gap-1" title={Array.isArray(record.revokedUsers) ? record.revokedUsers.join(', ') : ''}>
                  {Array.isArray(record.revokedUsers) && record.revokedUsers.length > 0
                    ? record.revokedUsers.map((u, i) => (
                        <span key={i} className="inline-block px-1.5 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-md text-[10px] font-mono font-medium">{u}</span>
                      ))
                    : <span className="text-slate-400 italic text-[10px]">Not specified</span>}
                </div>
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

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                <div className="flex items-center gap-1"><FiUser className="w-3 h-3" /> Owner: <span className="font-semibold text-slate-700 dark:text-slate-300">{record.ownerId || 'Not specified'}</span></div>
                <div className="flex items-center gap-1"><FiEye className="w-3 h-3" /> Uploaded By: <span className="font-semibold text-slate-700 dark:text-slate-300">{record.uploadedBy || 'Not specified'}</span> {record.uploaderRole ? <span className="text-slate-400">({record.uploaderRole})</span> : null}</div>
                <div className="flex items-center gap-1"><FiFileText className="w-3 h-3" /> Patient: <span className="font-semibold text-slate-700 dark:text-slate-300">{record.patientName || record.patientId || 'Not specified'}</span></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {record.bgwHeader && record.updateToken && isUserRecordOwner(record, currentUserId) ? (
                  <>
                    <button
                      onClick={() => handleDecrypt(record)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      View / Decrypt
                    </button>
                    <button
                      onClick={() => {
                        setGrantMode('grant')
                        setGrantRecord(record)
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Grant Access
                    </button>
                    <button
                      onClick={() => {
                        setGrantMode('revoke')
                        setGrantRecord(record)
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Revoke Access
                    </button>
                  </>
                ) : record.bgwHeader && record.updateToken ? (
                  <>
                    <button
                      onClick={() => handleDecrypt(record)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      View / Decrypt
                    </button>
                  </>
                ) : (
                  <span className="px-4 py-2 bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">
                    Legacy Record
                  </span>
                )}
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
              {patientAccessHistory.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-450 dark:text-slate-500">
                    No access history has been committed for your records yet.
                  </td>
                </tr>
              )}
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

  // 4. UNIFIED CLINICAL RECORDS WORKSPACE (Doctor, Nurse, Admin, Lab Technician)
  const renderClinicalRecords = () => {
    const isPatientView = role === 'Patient'
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{isPatientView ? 'My Records' : 'Organization Patient Records'}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{isPatientView ? 'Your medical records stored on the blockchain ledger.' : 'All patient records within your organization. Decryption is gated by ABAC policy, access grants, and privacy levels.'}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {accessibleRecords.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm text-sm text-slate-500 dark:text-slate-400">
              No records are available yet.
            </div>
          )}
          {accessibleRecords.map((record) => {
            const isBgwRecord = Boolean(record.bgwHeader && record.updateToken)
            const isUploader = isUserRecordOwner(record, currentUserId)
            const isRevoked = currentKeys.userId && record.revokedUsers?.includes(currentKeys.userId)
            const authUsers = Array.isArray(record.authorizedUsers) ? record.authorizedUsers : []
            const revUsers = Array.isArray(record.revokedUsers) ? record.revokedUsers : []
            return (
              <div key={record.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-4">
                {/* Row 1: File name + badge + actions */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[400px]" title={record.fileName || record.name}>
                        {record.fileName || record.name}
                      </h4>
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl text-[10px] font-bold font-mono" title={`${levelLabel(record.sensitivity)} — ${record.sensitivity}`}>{record.sensitivity} · {levelLabel(record.sensitivity)}</span>
                      <span className={`px-2 py-0.5 rounded-xl text-[10px] font-bold font-mono ${isBgwRecord ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                        {isBgwRecord ? 'BGW' : 'Legacy'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {isRevoked ? (
                      <span className="px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-[11px] font-bold">Revoked</span>
                    ) : isBgwRecord ? (
                      <>
                        <button onClick={() => handleDecrypt(record)} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold cursor-pointer">View / Decrypt</button>
                        {isUploader && (
                          <>
                            <button onClick={() => { setGrantMode('grant'); setGrantRecord(record) }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold cursor-pointer">Grant</button>
                            <button onClick={() => { setGrantMode('revoke'); setGrantRecord(record) }} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[11px] font-bold cursor-pointer">Revoke</button>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-800">Legacy Record</span>
                    )}
                  </div>
                </div>

                {/* Row 2: Identity grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                    <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold">Patient</div>
                    <div className="mt-1 font-mono text-slate-700 dark:text-slate-300 truncate">{record.patientName || record.patientId || record.ownerId || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                    <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold">Uploaded By</div>
                    <div className="mt-1 font-mono text-slate-700 dark:text-slate-300 truncate">{record.uploadedBy || 'N/A'}{record.uploaderRole ? <span className="text-slate-400 ml-1">({record.uploaderRole})</span> : null}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                    <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold">Organization</div>
                    <div className="mt-1 font-mono text-slate-700 dark:text-slate-300 truncate">{record.organization || record.metadata?.organization || record.patientOrganization || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                    <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold">Record ID</div>
                    <div className="mt-1 font-mono text-slate-700 dark:text-slate-300 truncate text-[10px]" title={record.id}>{record.id}</div>
                  </div>
                </div>

                {/* Row 2b: Role-based access summary */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
                  <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold flex items-center gap-1.5 mb-2">
                    <FiShield className="w-3 h-3" />
                    Role-Based Access
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Doctor', 'Nurse', 'Lab', 'Staff', 'Public'].map((r) => {
                      const allowed = getRoleAccess(record.sensitivity, r)
                      return (
                        <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          allowed
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            : 'bg-slate-200/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-850'
                        }`}>
                          {allowed ? <FiCheck className="w-2.5 h-2.5" /> : <FiX className="w-2.5 h-2.5" />}
                          {r}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Row 3: Access lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                    <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold">Authorized Users {authUsers.length > 0 && <span className="text-emerald-600 dark:text-emerald-400">({authUsers.length})</span>}</div>
                    <div className="mt-1 flex flex-wrap gap-1" title={authUsers.join(', ')}>
                      {authUsers.length > 0
                        ? authUsers.map((u, i) => (
                            <span key={i} className="inline-block px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-md text-[10px] font-mono font-medium" title={u}>{u}</span>
                          ))
                        : <span className="text-slate-400 italic">None</span>}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-850">
                    <div className="text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold">Revoked Users {revUsers.length > 0 && <span className="text-rose-600 dark:text-rose-400">({revUsers.length})</span>}</div>
                    <div className="mt-1 flex flex-wrap gap-1" title={revUsers.join(', ')}>
                      {revUsers.length > 0
                        ? revUsers.map((u, i) => (
                            <span key={i} className="inline-block px-1.5 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-md text-[10px] font-mono font-medium" title={u}>{u}</span>
                          ))
                        : <span className="text-slate-400 italic">None</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Decryption View Terminal */}
        <div className="bg-slate-955 text-slate-200 p-6 rounded-3xl border border-slate-900 min-h-[280px] font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4 text-[10px] text-slate-400">
            <span>SECURE CRYPTO DECIPHER MODULE</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          {selectedRecordToDecrypt ? (
            <div className="space-y-4">
              <div>
                <span className="text-purple-400">Target File:</span> {selectedRecordToDecrypt.fileName || selectedRecordToDecrypt.name || selectedRecordToDecrypt.id}
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
                    Permissions validated. Decrypted payload recovered:
                  </div>
                  {decryptedFile ? (
                    <div className="bg-slate-900 border border-slate-900/60 p-4 rounded-xl space-y-3 text-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-100">{decryptedFile.name}</div>
                          <div className="text-[10px] text-slate-500">{decryptedFile.type} &bull; {(decryptedFile.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <FiFileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={decryptedFile.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold"
                        >
                          <FiExternalLink className="w-3.5 h-3.5" />
                          Open File
                        </a>
                        <a
                          href={decryptedFile.url}
                          download={decryptedFile.name}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-[11px] font-bold"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <pre className="bg-slate-900 border border-slate-900/60 p-4 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-300">
                      {decryptedContent}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
              <FiKey className="w-8 h-8 text-slate-600" />
              <span>Select a record to initiate Fabric-gated BGW decryption.</span>
            </div>
          )}
        </div>
        {selectedRecordToDecrypt && !isDecrypting && (
          <div className="text-[10px] text-slate-550 border-t border-slate-900 pt-3 mt-4">
            * Fabric authorized the request, IPFS hash was verified, and BGW recovered the payload key.
          </div>
        )}
      </div>
    )
  }

  // 5. CLINICAL STAFF ACCESS LOGS
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
              {currentUserLogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-450 dark:text-slate-500">
                    No access requests have been recorded for this identity yet.
                  </td>
                </tr>
              )}
              {currentUserLogs.map(log => {
                const status = normalizeLogStatus(log.action)
                const record = patientRecords.find(item => item.id === log.dataId)
                return (
                  <tr key={`${log.requesterId}-${log.dataId}-${log.time}-personal`} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 pl-2 font-mono text-[10px] uppercase">{log.action}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        status === 'Granted'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                      }`}>{status}</span>
                    </td>
                    <td className="py-4 font-semibold">{record?.name || log.dataId}</td>
                    <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-550">{formatDateTime(log.time)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // 6. ADMIN USER MANAGEMENT
  const renderAdminUsers = () => {
    const localUsers = readJson('registered_users', [])
    const localUserIds = new Set(localUsers.map(item => item.userId))
    const adminUsersList = [
      ...localUsers.map(item => ({
        name: item.name,
        role: item.role,
        org: item.organization || '',
        status: 'Active',
        cert: item.userId || item.publicKey?.slice(0, 16) || 'N/A'
      })),
      ...fabricUsers
        .filter(item => item.userId && !localUserIds.has(item.userId) && !isTestArtifact(item.userId))
        .map(item => ({
          name: item.userId,
          role: item.role || 'Member',
          org: item.organization || '',
          status: item.revoked ? 'Revoked' : 'Active',
          cert: item.userId
        }))
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
                {adminUsersList.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-450 dark:text-slate-500">
                      No enrolled identities are available yet.
                    </td>
                  </tr>
                )}
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
                <th className="pb-3.5 pl-2">Requester</th>
<th className="pb-3.5">Data ID</th>
<th className="pb-3.5">Action</th>
<th className="pb-3.5">Level</th>
<th className="pb-3.5 text-right pr-2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-355 text-xs font-sans">
  {accessLogs.map((log) => (
    <tr
      key={`${log.requesterId}-${log.dataId}-${log.time}`}
      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
    >
      <td className="py-4 pl-2 font-semibold text-slate-900 dark:text-white">
        {log.requesterId}
      </td>

      <td className="py-4 font-mono">
        {log.dataId}
      </td>

      <td className="py-4">
        {log.action}
      </td>

      <td className="py-4">
        {log.requesterLevel}
      </td>

      <td className="py-4">
        {log.dataLevel}
      </td>

      <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-550 dark:text-slate-400">
        {log.time}
      </td>
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
                <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-purple-600/10 text-purple-600 dark:text-purple-300 flex items-center justify-center text-lg font-black shadow-sm">
                  {currentUserInitials}
                </div>
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
        if (role === 'Patient') return renderClinicalRecords()
        return renderDefault()
      case '#who-accessed':
        if (role === 'Patient') return renderPatientWhoAccessed()
        return renderDefault()
      case '#records':
        if (role !== 'Patient') return renderClinicalRecords()
        return renderDefault()
      case '#logs':
        if (role !== 'Patient' && role !== 'Admin') return renderDoctorLogs()
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

  // --- DECRYPT RESULT MODAL ---
  const renderDecryptModal = () => {
    if (!selectedRecordToDecrypt) return null
    if (isDecrypting) return null

    const isError = decryptedContent?.startsWith('[ERROR]') || (!decryptedContent && !decryptedFile)
    if (isError && !decryptedContent) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-[560px] max-h-[80vh] flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">
              {isError ? 'Access Denied' : 'Decrypted Record'}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {selectedRecordToDecrypt?.id}
            </span>
          </div>

          {isError ? (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FiLock className="text-rose-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Access Denied</span>
                  <p className="text-xs text-slate-500 mt-1">
                    {decryptedContent?.replace('[ERROR] Decryption process terminated.\nReason: ', '') || 'You do not have permission to decrypt this record.'}
                  </p>
                </div>
              </div>
            </div>
          ) : decryptedFile ? (
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{decryptedFile.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{decryptedFile.type} &bull; {(decryptedFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <FiFileText className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={decryptedFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
                >
                  <FiExternalLink className="w-3.5 h-3.5" />
                  Open File
                </a>
                <a
                  href={decryptedFile.url}
                  download={decryptedFile.name}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          ) : (
            <pre className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300 max-h-[400px] overflow-y-auto">
              {decryptedContent}
            </pre>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setSelectedRecordToDecrypt(null)
                setDecryptedContent('')
                setDecryptedFile((previous) => {
                  if (previous?.url) URL.revokeObjectURL(previous.url)
                  return null
                })
              }}
              className="px-4 py-2 border rounded-lg text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- GRANT / REVOKE MODAL ---
  const renderGrantRevokeModal = () => {
    const isGrant = grantMode === 'grant'
    const recordSensitivity = grantRecord?.sensitivity || grantRecord?.rawRecord?.requiredLevel || ''
    const recordRevoked = (grantRecord?.revokedUsers || grantRecord?.rawRecord?.revokedUsers || [])
    const recordAuthorized = (grantRecord?.authorizedUsers || grantRecord?.rawRecord?.authorizedUsers || [])
    const recordGranted = (grantRecord?.grantedUsers || grantRecord?.rawRecord?.grantedUsers || [])
    const recordOrganization = grantRecord?.organization || grantRecord?.rawRecord?.metadata?.organization || ''

    const hasAccess = (u) => {
      const uOrg = u.organization || ''
      const sameOrg = uOrg && recordOrganization && uOrg.toLowerCase() === recordOrganization.toLowerCase()
      const byRole = sameOrg && roleCanAccessLevel(u.role, recordSensitivity) && !recordRevoked.includes(u.userId)
      const byExplicit = recordAuthorized.includes(u.userId) || recordGranted.includes(u.userId)
      return byRole || byExplicit
    }

    const isEligibleRole = (u) => u.role && u.role !== 'Patient'

    const selectedUsers = isGrant
      ? registeredUsers.filter(u =>
          u.userId !== currentUserId &&
          isEligibleRole(u) &&
          !hasAccess(u)
        )
      : registeredUsers
          .filter(u =>
            u.userId !== currentUserId &&
            isEligibleRole(u) &&
            !isUserRecordOwner(grantRecord, u.userId) &&
            !isUserRecordSubject(grantRecord, u.userId) &&
            hasAccess(u)
          )

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-[480px] max-h-[80vh] flex flex-col space-y-4">
          <h3 className="text-lg font-bold">
            {isGrant ? 'Grant Access' : 'Revoke Access'}
          </h3>
          <p className="text-xs text-slate-500">
            {isGrant
              ? 'Select a user to grant access to this record:'
              : 'Select a currently authorized user to revoke access:'}
          </p>

          {grantRecord && (
            <div className="text-[10px] text-slate-400 font-mono">
              Record: {grantRecord.id} | Sensitivity: {grantRecord.sensitivity || grantRecord.rawRecord?.sensitivity}
            </div>
          )}

          {/* User list */}
          <div className="flex-1 overflow-y-auto space-y-1 border rounded-xl p-2 max-h-[300px]">
            {selectedUsers.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4">
                {isGrant ? 'No other users available.' : 'No authorized users to revoke.'}
              </div>
            )}
            {selectedUsers.map((u) => {
              const name = u.name || u.userId
              const bgwId = u.bgwRecipientId || ''
              const isSelected = authorizedUser === u.userId
              const userOrg = u.organization || ''
              return (
                <button
                  key={u.userId}
                  onClick={() => {
                    setAuthorizedUser(u.userId)
                    setRecipientId(String(bgwId))
                  }}
                  className={`w-full text-left p-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? isGrant
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{u.role || ''}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500 font-mono">ID: {u.userId}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{userOrg || 'No Hospital'}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setGrantRecord(null)
                setGrantMode('grant')
                setRecipientId('')
                setAuthorizedUser('')
              }}
              className="px-4 py-2 border rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={isGrant ? handleGrantAccess : handleRevokeAccess}
              disabled={granting || !authorizedUser}
              className={`px-4 py-2 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 ${
                isGrant ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {granting
                ? isGrant ? 'Granting...' : 'Revoking...'
                : isGrant ? 'Confirm Grant' : 'Confirm Revoke'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- FINAL ROUTING WRAPPER ---
  return (
    <div className="animate-fadeIn">
      {renderSection()}
      {selectedRecordToDecrypt && !isDecrypting && (decryptedContent || decryptedFile) && renderDecryptModal()}
      {grantRecord && renderGrantRevokeModal()}
    </div>
  )
}
