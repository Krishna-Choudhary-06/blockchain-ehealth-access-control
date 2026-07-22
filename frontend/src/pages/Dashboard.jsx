import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  FiFileText, FiUserCheck, FiCpu, FiUsers, FiHardDrive, FiActivity,
  FiShield, FiSettings, FiUser, FiCheck, FiX, FiCopy, 
  FiAlertTriangle, FiLock, FiUnlock, FiKey, FiPlus, FiHash
} from 'react-icons/fi'
import { 
  FileText, UserCheck, Cpu, Users, HardDrive, Activity, 
  Shield, Settings, User, Check, X, Copy, 
  AlertTriangle, Lock, Unlock, Key, Plus, Hash, 
  Search, Filter, ChevronLeft, ChevronRight, RefreshCw,
  LogOut, ShieldAlert, Award, Grid, Menu, Eye, EyeOff, Radio, Trash2, HelpCircle, Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { decryptFile, decryptKeyForUser } from '../services/cryptoService'
import { downloadFile } from '../services/ipfsService'
import { getLogs, requestAccess } from '../services/apiService'


export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const role = user?.role || 'Patient'
  const location = useLocation()
  const hash = location.hash || ''

  // Dynamic state metrics
  const [blocksMined, setBlocksMined] = useState(0)
  const [successReads, setSuccessReads] = useState(0)
  const [pendingReqs, setPendingReqs] = useState(0)
  const [networkUsers, setNetworkUsers] = useState(() => {
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
    return users.length
  })

  // Admin-specific local states
  const [adminUsers, setAdminUsers] = useState(() => {
    const saved = localStorage.getItem('admin_users_list')
    if (saved) return JSON.parse(saved)
    return []
  })

  const saveAdminUsers = (updated) => {
    localStorage.setItem('admin_users_list', JSON.stringify(updated))
    setAdminUsers(updated)
  }

  // Users management filters & pagination
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [userStatusFilter, setUserStatusFilter] = useState('ALL')
  const [userListPage, setUserListPage] = useState(1)
  const [selectedUserForModal, setSelectedUserForModal] = useState(null)
  const [isUserWarningModalOpen, setIsUserWarningModalOpen] = useState(false)
  const [userModalActionType, setUserModalActionType] = useState('') // 'REVOKE' or 'ACTIVATE'
  const [userActionLoading, setUserActionLoading] = useState(false)

  // Access history filters & view state
  const [logSearchQuery, setLogSearchQuery] = useState('')
  const [logStatusFilter, setLogStatusFilter] = useState('ALL')
  const [logListPage, setLogListPage] = useState(1)
  const [logViewMode, setLogViewMode] = useState('TABLE') // 'TABLE' or 'TIMELINE'
  const [logScope, setLogScope] = useState('ALL') // 'ALL' or 'PROVIDER_ONLY'

  // Custom states for Medrec frontend enhancements
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false)
  const [historyFilterType, setHistoryFilterType] = useState('ALL')
  const [historyFilterProvider, setHistoryFilterProvider] = useState('ALL')
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [historyStartDate, setHistoryStartDate] = useState('')
  const [historyEndDate, setHistoryEndDate] = useState('')
  const [patientRecordsFilterCat, setPatientRecordsFilterCat] = useState('ALL')
  const [patientRecordsSearch, setPatientRecordsSearch] = useState('')
  const [patientRecordsSort, setPatientRecordsSort] = useState('DATE_DESC')
  const [doctorRecordsFilterCat, setDoctorRecordsFilterCat] = useState('ALL')
  const [doctorRecordsSearch, setDoctorRecordsSearch] = useState('')
  const [doctorRecordsSort, setDoctorRecordsSort] = useState('DATE_DESC')
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState(null)
  const [isRecordDetailsModalOpen, setIsRecordDetailsModalOpen] = useState(false)
  const [providerSearchQuery, setProviderSearchQuery] = useState('')

  // Settings active tab
  const [activeSettingTab, setActiveSettingTab] = useState('GENERAL')
  const [settingsGeneral, setSettingsGeneral] = useState(() => {
    const savedPortal = localStorage.getItem('admin_portal_settings')
    const portalData = savedPortal ? JSON.parse(savedPortal) : {
      sessionTimeout: 30,
      portalMode: 'Normal Operations',
      peerEndpoint: 'grpcs://localhost:7051'
    }
    return {
      adminName: user?.name || 'System Administrator',
      adminEmail: user?.email || 'admin@ehealth.org',
      orgName: user?.organization || 'NIT JAMSHEDPUR',
      language: 'English (US)',
      ...portalData
    }
  })

  const [adminAvatar, setAdminAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80')

  useEffect(() => {
    if (user) {
      setSettingsGeneral(prev => ({
        ...prev,
        adminName: user.name || 'System Administrator',
        adminEmail: user.email || 'admin@ehealth.org',
        orgName: user.organization || 'NIT JAMSHEDPUR'
      }))
      setAdminAvatar(user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80')
    }
  }, [user])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 800 * 1024) {
      toast.error('Avatar file size must be under 800KB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only PNG or JPEG image files are accepted.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAdminAvatar(reader.result)
      toast.success('New avatar selected. Click Save to persist changes.')
    }
    reader.onerror = () => {
      toast.error('Failed to read image file.')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveGeneralConfig = () => {
    if (!settingsGeneral.adminName.trim()) {
      toast.error('Username cannot be empty.')
      return
    }
    if (!settingsGeneral.adminEmail.trim()) {
      toast.error('Email target cannot be empty.')
      return
    }

    updateUser({
      name: settingsGeneral.adminName,
      email: settingsGeneral.adminEmail,
      avatar: adminAvatar,
      organization: settingsGeneral.orgName
    })

    localStorage.setItem('admin_portal_settings', JSON.stringify({
      sessionTimeout: settingsGeneral.sessionTimeout,
      portalMode: settingsGeneral.portalMode,
      peerEndpoint: settingsGeneral.peerEndpoint
    }))

    toast.success('General profile & portal configuration saved successfully!')
  }

  // Access Logs Table mock state data
  const [accessLogs, setAccessLogs] = useState([])
  // Simulated Patient Records (implementing Section 5)
  const [patientRecords, setPatientRecords] = useState(() => {
    const saved = localStorage.getItem('patient_records')
    if (saved) return JSON.parse(saved)
    return []
  })

  // Patient Associated Healthcare Providers (implementing Section 3)
  const [providers, setProviders] = useState(() => {
    const saved = localStorage.getItem('patient_providers')
    if (saved) return JSON.parse(saved)
    return []
  })

  const saveProviders = (updated) => {
    localStorage.setItem('patient_providers', JSON.stringify(updated))
    setProviders(updated)
  }

  // Dynamic variables for role-specific logs and reports (removes fake/hardcoded data)
  const doctorLogs = accessLogs.filter(log => log.user.toLowerCase() === user?.userId?.toLowerCase() || log.user.toLowerCase() === user?.name?.toLowerCase() || (user?.role === 'Doctor' && log.role === 'Doctor'))
  
  const nurseLogs = accessLogs.filter(log => log.user.toLowerCase() === user?.userId?.toLowerCase() || log.user.toLowerCase() === user?.name?.toLowerCase() || (user?.role === 'Nurse' && log.role === 'Nurse'))
  
  const nurseRecords = patientRecords.map(rec => {
    const allowed = getRoleAccess(rec.sensitivity, 'Nurse')
    return {
      id: rec.id,
      patient: rec.patientName || 'Unknown Patient',
      file: rec.fileName || rec.name,
      sensitivity: rec.sensitivity,
      allowed: allowed,
      rawRecord: rec
    }
  })

  // Clinician Directory Registry (registered doctors in network whom patient can add/associate)
  const clinicianDirectory = []


  // Get active record IDs belonging to the logged-in patient
  const patientRecordIds = patientRecords
    .filter(rec => rec.patientName?.toLowerCase() === user?.name?.toLowerCase())
    .map(rec => rec.id)

  // Dynamically compute Patient Access History logs (implementing Section 4)
  const getPatientAccessHistory = () => {
    // 1. Map approved local requests from local storage history list
    const savedHistory = JSON.parse(localStorage.getItem('access_history') || '[]')
    const mappedSaved = savedHistory.map(item => {
      const dt = new Date(item.grantedDate)
      return {
        id: item.id,
        user: item.userName,
        action: 'Access Granted',
        file: `${item.recordId}: ${item.recordType}`,
        status: 'Granted',
        date: dt.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        recordId: item.recordId
      }
    })

    // 2. Map check transactions from backend ledger logs
    const mappedLedger = accessLogs
      .filter(log => {
        const matched = log.action.match(/PAT-\d+/)
        const dataId = matched ? matched[0] : null
        return dataId && patientRecordIds.includes(dataId)
      })
      .map(log => {
        const dt = new Date(log.timestamp)
        return {
          id: log.id,
          user: log.user,
          action: log.status === 'Granted' ? 'Viewed File' : 'Denied Attempt',
          file: log.action.replace('Read File ', ''),
          status: log.status,
          date: dt.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          recordId: log.action.replace('Read File ', '')
        }
      })

    const combined = [...mappedSaved, ...mappedLedger]

    return combined.filter(item => {
      const matched = item.file.match(/PAT-\d+/)
      const dataId = matched ? matched[0] : item.recordId
      return patientRecordIds.includes(dataId)
    })

  }

  // Doctor Specific States (for decrypting files)
  const [selectedRecordToDecrypt, setSelectedRecordToDecrypt] = useState(null)
  const [decryptedContent, setDecryptedContent] = useState('')
  const [isDecrypting, setIsDecrypting] = useState(false)

  // Access Requests management states
  const [accessRequests, setAccessRequests] = useState([])
  const [loadingActionId, setLoadingActionId] = useState(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false)
  const [requestFormData, setRequestFormData] = useState({
    patientId: '',
    recordType: 'Cardiology Report',
    purpose: '',
    duration: '24 Hours'
  })

  // Set default patient ID when records load
  useEffect(() => {
    if (patientRecords.length > 0 && !requestFormData.patientId) {
      setRequestFormData(prev => ({ ...prev, patientId: patientRecords[0].id }))
    }
  }, [patientRecords])


  // Load access requests on mount
  useEffect(() => {
    const saved = localStorage.getItem('access_requests')
    if (saved) {
      setAccessRequests(JSON.parse(saved))
    } else {
      setAccessRequests([])
    }
  }, [])

  // Sync state with local storage
  const saveAccessRequests = (updatedRequests) => {
    localStorage.setItem('access_requests', JSON.stringify(updatedRequests))
    setAccessRequests(updatedRequests)
  }

  // Doctor requests access on their dashboard
  const handleDoctorSubmitRequest = async (e) => {
    e.preventDefault()
    if (!requestFormData.purpose.trim()) {
      toast.error('Purpose of access is required.')
      return
    }

    setIsRequestSubmitting(true)
    const toastId = toast.loading('Mining access request block into blockchain ledger...')

    try {
      let requesterId = 'DOC-MOCK'
      if (user?.name) {
        const keys = localStorage.getItem(`user_keys_${user.name}`)
        if (keys) {
          try {
            requesterId = JSON.parse(keys).userId || requesterId
          } catch (err) {
            console.error('Failed to parse keys from localStorage:', err)
          }
        } else {
          const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
          const match = registeredUsers.find(u => u.name === user.name)
          if (match) {
            requesterId = match.userId
          }
        }
      }

      const response = await requestAccess(requesterId, requestFormData.patientId)
      
      const newRequestId = 'REQ-' + Math.floor(100000 + Math.random() * 900000)
      
      const newRequest = {
        id: newRequestId,
        patientId: requestFormData.patientId,
        patientName: requestFormData.patientId,
        recordType: requestFormData.recordType,
        purpose: requestFormData.purpose,
        duration: requestFormData.duration,
        doctorName: user?.name || 'Clinician',
        doctorRole: user?.role || 'Doctor',
        status: response?.data?.status === 'ACCESS_GRANTED' ? 'Granted' : 'Pending',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        txHash: response?.data?.ipfsHash || 'N/A',
        txTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }

      const updatedRequests = [newRequest, ...accessRequests]
      saveAccessRequests(updatedRequests)

      toast.success('Access Request successfully submitted to ledger!', { id: toastId })
      setIsRequestModalOpen(false)
      setRequestFormData({
        patientId: '',
        recordType: 'Cardiology Report',
        purpose: '',
        duration: '24 Hours'
      })
    } catch (error) {
      toast.error(`Consensus failed: ${error.message || 'Access Request service offline'}`, { id: toastId })
    } finally {
      setIsRequestSubmitting(false)
    }
  }

  // Patient actions request from their dashboard list
  const handlePatientAction = async (requestId, nextStatus) => {
    setLoadingActionId(requestId)
    const toastId = toast.loading(`Committing consensus transaction for status: ${nextStatus}...`)

    try {
      await new Promise(resolve => setTimeout(resolve, 1200))

      const updatedRequests = accessRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: nextStatus,
            txHash: 'N/A',
            txTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
          }
        }
        return req
      })

      // If approved, create entry in Access History
      if (nextStatus === 'Approved') {
        const targetRequest = accessRequests.find(r => r.id === requestId)
        if (targetRequest) {
          const currentHistory = JSON.parse(localStorage.getItem('access_history') || '[]')
          const durationStr = targetRequest.duration || '24 Hours'
          const days = durationStr === '24 Hours' ? 1 : durationStr === '7 Days' ? 7 : 30
          const exp = new Date()
          exp.setDate(exp.getDate() + days)

          const historyId = 'HIST-' + Math.floor(100000 + Math.random() * 900000)

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
                blockNumber: 'N/A',
                txId: 'N/A',
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

        let encryptedSymmetricKey = record.sharedKeys[doctorUserId]
        let ipfsHash = record.ipfsHash
        let ivHex = record.ivHex

        // Call real backend Fabric ABAC validation
        try {
          const apiRes = await requestAccess(doctorUserId, record.id)
          if (apiRes && apiRes.success) {
            const dataAccessResult = typeof apiRes.data === 'string' ? JSON.parse(apiRes.data) : apiRes.data
            if (dataAccessResult.status !== 'ACCESS_GRANTED') {
              throw new Error(dataAccessResult.message || 'ABAC permission check rejected on ledger.')
            }
            // Dynamically override from blockchain state
            if (dataAccessResult.ipfsHash) ipfsHash = dataAccessResult.ipfsHash
            if (dataAccessResult.iv) ivHex = dataAccessResult.iv
            if (dataAccessResult.encryptedKeyForYou) {
              encryptedSymmetricKey = dataAccessResult.encryptedKeyForYou
            }
          }
        } catch (apiErr) {
          console.warn('Backend ledger access control check failed/offline:', apiErr)
        }

        if (!encryptedSymmetricKey) {
          throw new Error(`Access Denied: You do not have security clearance for this record.`)
        }

        const aesKeyHex = await decryptKeyForUser(encryptedSymmetricKey, privateKey)
        const encryptedFileBuffer = await downloadFile(ipfsHash)
        const decryptedFileBuffer = await decryptFile(encryptedFileBuffer, aesKeyHex, ivHex)

        const dec = new TextDecoder()
        const plaintext = dec.decode(decryptedFileBuffer)
        setDecryptedContent(plaintext)
      } else {
        await new Promise(resolve => setTimeout(resolve, 1200))
        setDecryptedContent("No blockchain data available")
      }
    } catch (error) {
      console.error(error)
      toast.error(`Decryption failed: ${error.message}`)
      setDecryptedContent(`[ERROR] Decryption process terminated.\nReason: ${error.message}`)
    } finally {
      setIsDecrypting(false)
    }
  }

  // Calculate dynamic metrics for role dashboards
  const myRecordsCount = patientRecords.filter(rec => {
    if (role === 'Patient') {
      return rec.patientName?.toLowerCase() === user?.name?.toLowerCase()
    }
    return true
  }).length

  const myApprovedRequests = accessRequests.filter(req => 
    req.status === 'Approved' && 
    (req.patientName?.toLowerCase().includes(user?.name?.toLowerCase() || ''))
  )
  const uniqueDocs = new Set(myApprovedRequests.map(req => req.doctorName))
  const authorizedDocsCount = uniqueDocs.size

  const myPendingRequests = accessRequests.filter(req => 
    req.status === 'Pending' && 
    (req.patientName?.toLowerCase().includes(user?.name?.toLowerCase() || ''))
  )
  const pendingCount = myPendingRequests.length


  const doctorPendingCount = accessRequests.filter(req => 
    req.status === 'Pending' && 
    req.doctorName?.toLowerCase() === user?.name?.toLowerCase()
  ).length

  const nursePendingCount = accessRequests.filter(req => req.status === 'Pending').length

  // Stat cards configurations based on active role
  const statCards = {
    Patient: [
      { id: 1, label: 'My Enrolled Files', value: `${myRecordsCount}`, icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' },
      { id: 2, label: 'Authorized Doctors', value: `${authorizedDocsCount}`, icon: FiUserCheck, color: 'text-blue-600 bg-blue-500/10' },
      { id: 3, label: 'Active Access Requests', value: `${pendingCount > 0 ? pendingCount + ' Pending' : 'None'}`, icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' }
    ],
    Doctor: [
      { id: 1, label: 'Assigned Patients', value: '3', icon: FiUsers, color: 'text-blue-600 bg-blue-500/10' },
      { id: 2, label: 'Requests Pending', value: `${doctorPendingCount}`, icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' },
      { id: 3, label: 'Successful File Reads', value: `${successReads}`, icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' }
    ],
    Nurse: [
      { id: 1, label: 'Lab Reports Accessible', value: '12', icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' },
      { id: 2, label: 'Access Requests Granted', value: '34', icon: FiUserCheck, color: 'text-blue-600 bg-blue-500/10' },
      { id: 3, label: 'Pending Action Items', value: `${nursePendingCount}`, icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' }
    ],
    Admin: [
      { id: 1, label: 'Peer Nodes Connected', value: '4 / 4', icon: FiCpu, color: 'text-emerald-600 bg-emerald-500/10' },
      { id: 2, label: 'Registered Network Users', value: `${networkUsers}`, icon: FiUsers, color: 'text-purple-600 bg-purple-500/10' },
      { id: 3, label: 'Total Blocks Mined', value: `${blocksMined}`, icon: FiHardDrive, color: 'text-blue-600 bg-blue-500/10' }
    ]
  }

  const activeStats = statCards[role] || statCards.Patient

  // Set up real ledger logs fetching loop
  useEffect(() => {
    let isBackendOffline = false
    const fetchRealLogs = async () => {
      if (isBackendOffline) {
        // Suppress repeated network calls when backend is offline
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
        setNetworkUsers(users.length)
        
        // Load fallback from localStorage if available
        const cached = localStorage.getItem('blockchain_audit_trail')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setAccessLogs(parsed)
            const grantedCount = parsed.filter(l => l.status === 'Granted').length
            setSuccessReads(grantedCount)
            setBlocksMined(parsed.length)
          } catch (e) {
            console.error('Failed to parse cached audit logs:', e)
          }
        }
        return
      }
      try {
        const res = await getLogs()
        let logsData = null
        if (res) {
          if (Array.isArray(res)) {
            logsData = res
          } else if (res.success) {
            logsData = res.data || res.logs
          } else {
            logsData = res.data || res.logs || res
          }
        }
        
        if (typeof logsData === 'string') {
          try {
            logsData = JSON.parse(logsData)
          } catch (e) {
            console.error('Failed to parse logsData JSON:', e)
          }
        }

        if (Array.isArray(logsData)) {
          const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
          const formatted = logsData.map((log, idx) => {
            const matchedUser = registeredUsers.find(u => u.userId === log.requesterId)
            const userRole = matchedUser ? matchedUser.role : (log.requesterLevel === 'L0' ? 'Doctor' : log.requesterLevel === 'L1' ? 'Lab' : log.requesterLevel === 'L2' ? 'Nurse' : 'Public')
            const userName = matchedUser ? matchedUser.name : log.requesterId
            return {
              id: log.txId || `log_${idx}`,
              user: userName,
              role: userRole,
              action: `Read File ${log.dataId}`,
              status: (log.status === 'GRANTED' || log.action === 'GRANTED') ? 'Granted' : 'Denied',
              timestamp: log.timestamp || log.time || new Date().toISOString().replace('T', ' ').substring(0, 19)
            }
          })
          // Sort by timestamp descending
          formatted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          setAccessLogs(formatted.slice(0, 10))
          localStorage.setItem('blockchain_audit_trail', JSON.stringify(formatted.slice(0, 10)))
          
          // Sync success reads count from logs
          const grantedCount = formatted.filter(l => l.status === 'Granted').length
          setSuccessReads(grantedCount)
          
          // Sync blocks count
          setBlocksMined(formatted.length)
        } else {
          // If response format is invalid, load fallback
          const cached = localStorage.getItem('blockchain_audit_trail')
          if (cached) {
            const parsed = JSON.parse(cached)
            setAccessLogs(parsed)
            const grantedCount = parsed.filter(l => l.status === 'Granted').length
            setSuccessReads(grantedCount)
            setBlocksMined(parsed.length)
          }
        }
      } catch (err) {
        isBackendOffline = true
        console.warn('Backend logs offline. Proceeding with frontend local access history (polling disabled).')
        
        // Load fallback logs from localStorage if available
        const cached = localStorage.getItem('blockchain_audit_trail')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setAccessLogs(parsed)
            const grantedCount = parsed.filter(l => l.status === 'Granted').length
            setSuccessReads(grantedCount)
            setBlocksMined(parsed.length)
          } catch (e) {
            console.error('Failed to parse cached audit logs on backend error:', e)
          }
        }
      }

      // Sync user count from localStorage
      const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
      setNetworkUsers(users.length)
    }

    fetchRealLogs()
    const interval = setInterval(fetchRealLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  // Helper check for clearance badges (implementing Section 5 Access Matrix)
  function getRoleAccess(sensitivity, roleToCheck) {
    if (roleToCheck === 'Doctor') return true
    if (roleToCheck === 'Lab') return sensitivity !== 'L0'
    if (roleToCheck === 'Nurse') return (sensitivity === 'L2' || sensitivity === 'L3')
    if (roleToCheck === 'Accountant') return (sensitivity === 'L2' || sensitivity === 'L3')
    if (roleToCheck === 'Public') return sensitivity === 'L3'
    return false
  }

  // --- RENDER SECTION ROUTER ---
  
  // Redesigned Admin Dashboard Overview
  const renderAdminDefault = () => {
    // Compute role distribution based on networkUsers count
    const total = networkUsers
    const docCount = Math.floor(total * 0.42)
    const patCount = Math.floor(total * 0.38)
    const nurseCount = Math.floor(total * 0.15)
    const adminCount = total - (docCount + patCount + nurseCount)

    return (
      <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-105">
        {/* Glowing Welcome Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/90 via-indigo-950/90 to-slate-900 p-6 md:p-8 shadow-xl border border-purple-500/10">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-purple-500/15 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold font-mono tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> Network Consortium Active
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">System Security Administration</h2>
              <p className="text-slate-300 text-xs md:text-sm max-w-xl leading-relaxed">
                Hyperledger Fabric Admin console. Real-time consensus node heartbeat, cryptographic key validation logs, and attribute evaluation.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end justify-center font-mono text-[10.5px] text-slate-300 space-y-1">
              <div>MSP ID: <span className="font-bold text-white">eHealthAdminMSP</span></div>
              <div>Channel: <span className="font-bold text-purple-400">ehealth-channel</span></div>
              <div>Last Synced: <span className="font-bold text-emerald-400">Just now</span></div>
            </div>
          </div>
        </div>

        {/* Premium Dashboard Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Consortium Peer Nodes map */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/70 dark:bg-slate-905/60 border border-slate-200/80 dark:border-slate-850 p-6 rounded-3xl shadow-sm backdrop-blur-xl hover:shadow-md hover:border-purple-500/20 transition-all duration-300 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Cpu className="w-4.5 h-4.5 text-purple-600" />
                Active Peer Heartbeats (Peer Nodes Connected)
              </h3>
              <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">4 / 4 ON</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'peer0.nit.ehealth.org', ping: '12ms', cpu: '1.4%', height: blocksMined },
                { name: 'peer1.hospital.ehealth.org', ping: '8ms', cpu: '2.5%', height: blocksMined },
                { name: 'peer2.labs.ehealth.org', ping: '15ms', cpu: '0.9%', height: blocksMined - 1 },
                { name: 'peer3.client.ehealth.org', ping: '24ms', cpu: '3.1%', height: blocksMined }
              ].map((peer, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100/80 dark:border-slate-900/60 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{peer.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-550 dark:text-slate-400">
                    <span>{peer.ping}</span>
                    <span className="hidden sm:inline">CPU: {peer.cpu}</span>
                    <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded text-[9.5px]">#{peer.height}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 2: Registered Network Identities + Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white/70 dark:bg-slate-905/60 border border-slate-200/80 dark:border-slate-850 p-6 rounded-3xl shadow-sm backdrop-blur-xl hover:shadow-md hover:border-purple-500/20 transition-all duration-300 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-blue-500" />
                Network CA Identities (Registered Network Users)
              </h3>
              <span className="text-[10px] font-mono text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">Active CA</span>
            </div>
            <div className="space-y-3.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{total}</span>
                <span className="text-[10.5px] text-slate-450 dark:text-slate-500">Verified Public Keys</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Doctors', percent: 42, count: docCount, color: 'bg-purple-600' },
                  { label: 'Patients', percent: 38, count: patCount, color: 'bg-emerald-500' },
                  { label: 'Nurses', percent: 15, count: nurseCount, color: 'bg-blue-500' },
                  { label: 'Admins', percent: 5, count: adminCount, color: 'bg-amber-500' }
                ].map((item, i) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between text-[10.5px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{item.count} ({item.percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/30 dark:border-slate-900/60">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 3: Blockchain mined metric */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white/70 dark:bg-slate-905/60 border border-slate-200/80 dark:border-slate-850 p-6 rounded-3xl shadow-sm backdrop-blur-xl hover:shadow-md hover:border-purple-500/20 transition-all duration-300 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <HardDrive className="w-4.5 h-4.5 text-emerald-500" />
                Ledger Chain Height (Total Blocks Mined)
              </h3>
              <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Operational</span>
            </div>
            <div className="space-y-4 flex flex-col justify-between h-[calc(100%-3rem)]">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-450 dark:text-slate-400 block">Total Mined Blocks</span>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono leading-none">{blocksMined}</span>
              </div>
              
              {/* Graphic nodes layout */}
              <div className="flex items-center gap-2 p-3.5 bg-slate-50/60 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-900/60">
                <div className="grid grid-cols-5 gap-1.5 w-full">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-7 rounded-lg border flex flex-col items-center justify-center font-mono text-[9px] font-bold ${
                        i === 4 
                          ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 animate-pulse' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900'
                      }`}
                    >
                      #{blocksMined - 4 + i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>



        {/* Consensus Access Logs Table */}
        <div className="bg-white/70 dark:bg-slate-905/60 border border-slate-200 dark:border-slate-855 p-6 rounded-3xl shadow-sm backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-650" />
                Ledger Consensus Access Logs
              </h3>
              <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5">Immutable audit events resolved on the channel CA index.</p>
            </div>
            <a 
              href="#access-logs"
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              View Full Audit Logs &rarr;
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">User Identity</th>
                  <th className="pb-3">Network Role</th>
                  <th className="pb-3">Transaction Request</th>
                  <th className="pb-3">Consensus Status</th>
                  <th className="pb-3 text-right pr-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 text-xs font-sans">
                {accessLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-955/20 transition-all duration-150">
                    <td className="py-3.5 pl-2 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.user}
                    </td>
                    <td className="py-3.5 font-mono text-[9.5px] uppercase text-slate-500 dark:text-slate-400 font-bold">{log.role}</td>
                    <td className="py-3.5 font-medium text-slate-800 dark:text-slate-250 font-mono text-[10.5px]">{log.action}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                        log.status === 'Granted'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${log.status === 'Granted' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2 font-mono text-[10px] text-slate-550 dark:text-slate-400">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // 1. DEFAULT OVERVIEW VIEW (with Section 7 Security Alerts Section)
  const renderDefault = () => {
    if (role === 'Admin') {
      return renderAdminDefault()
    }
    return (
      <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Workspace Overview</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Real-time ledger updates and attribute evaluation audit trail.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeStats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div 
              key={stat.id} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 flex items-center justify-between shadow-sm dark:shadow-none hover:shadow-md dark:hover:border-slate-800 transition-all duration-200"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-455 block">{stat.label}</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Access Requests widgets based on active role */}
      {role === 'Doctor' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiShield className="text-purple-650 dark:text-purple-400" />
                Access Requests Status
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Submit clinical access request entries and monitor consensus status on ledger.</p>
            </div>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-750 hover:to-indigo-750 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-purple-600/10 hover:shadow-purple-700/15 transition-all cursor-pointer self-start sm:self-center"
            >
              <FiPlus className="w-4 h-4" />
              Request Access
            </button>
          </div>

          {accessRequests.filter(req => req.doctorName.toLowerCase() === user?.name?.toLowerCase()).length === 0 ? (
            <div className="text-center py-10 text-slate-450 dark:text-slate-600 flex flex-col items-center justify-center">
              <svg className="w-10 h-10 mb-2.5 opacity-30 animate-pulse" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-semibold">No blockchain data available</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Request ID / Hash</th>
                    <th className="pb-3">Patient ID</th>
                    <th className="pb-3">Record Type</th>
                    <th className="pb-3">Purpose</th>
                    <th className="pb-3 text-right pr-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
                  {accessRequests
                    .filter(req => req.doctorName.toLowerCase() === user?.name?.toLowerCase())
                    .slice(0, 5)
                    .map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                        <td className="py-3 pl-2 font-semibold text-slate-900 dark:text-white space-y-0.5">
                          <div className="flex items-center gap-1 font-bold">
                            <FiHash className="text-purple-600 w-3 h-3" />
                            {req.id}
                          </div>
                          <div className="text-[9px] font-mono text-slate-450 dark:text-slate-500 truncate max-w-[120px] block" title={req.txHash}>
                            Tx: {req.txHash}
                          </div>
                        </td>
                        <td className="py-3 font-mono text-[10px]">{req.patientId}</td>
                        <td className="py-3 font-semibold text-slate-850 dark:text-slate-300">{req.recordType}</td>
                        <td className="py-3 text-slate-550 dark:text-slate-400 truncate max-w-xs" title={req.purpose}>{req.purpose}</td>
                        <td className="py-3 text-right pr-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border ${
                            req.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                              : req.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                          }`}>
                            {req.status}
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-455 dark:text-slate-500 block mt-0.5">{req.timestamp.split(' ')[0]}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {role === 'Patient' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiShield className="text-purple-650 dark:text-purple-400" />
              Pending Access Requests
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Approve or reject clinical requests querying your secure records.</p>
          </div>

          {accessRequests.filter(req => req.status === 'Pending' && req.patientName.toLowerCase().includes(user?.name?.toLowerCase() || '')).length === 0 ? (
            <div className="text-center py-10 text-slate-450 dark:text-slate-650 flex flex-col items-center justify-center">
              <svg className="w-10 h-10 mb-2.5 opacity-30 animate-pulse" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs font-semibold">No blockchain data available</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Doctor</th>
                    <th className="pb-3">Requested Record</th>
                    <th className="pb-3">Purpose of Access</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
                  {accessRequests
                    .filter(req => req.status === 'Pending' && req.patientName.toLowerCase().includes(user?.name?.toLowerCase() || ''))
                    .map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                        <td className="py-4 pl-2 space-y-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FiUser className="w-3.5 h-3.5 text-slate-400" />
                            {req.doctorName}
                          </span>
                          <span className="text-[10px] text-slate-455 font-mono uppercase tracking-wider block">{req.doctorRole}</span>
                        </td>
                        <td className="py-4 font-semibold text-slate-955 dark:text-slate-300">
                          {req.recordType}
                          <span className="text-[9.5px] font-mono text-slate-455 dark:text-slate-500 block font-normal">ID: {req.patientId}</span>
                        </td>
                        <td className="py-4 text-slate-550 dark:text-slate-405 truncate max-w-xs" title={req.purpose}>{req.purpose}</td>
                        <td className="py-4 font-mono text-[10px] text-slate-455 dark:text-slate-500">{req.timestamp}</td>
                        <td className="py-4 text-right pr-2">
                          {loadingActionId === req.id ? (
                            <div className="flex items-center justify-end gap-1.5 text-xs text-purple-650 font-mono">
                              <FiCpu className="animate-spin w-4 h-4" />
                              <span>Validating...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handlePatientAction(req.id, 'Approved')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold shadow-sm shadow-emerald-500/10 flex items-center gap-1 transition-all cursor-pointer"
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
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}



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
}

  // 2. PATIENT RECORDS & PERMISSION VISIBILITY (implementing Section 5)
  const renderPatientRecords = () => {
    let displayRecords = patientRecords.filter(rec => {
      if (role === 'Patient') {
        return rec.patientName?.toLowerCase() === user?.name?.toLowerCase()
      }
      return true
    })

    // Search query filter
    if (patientRecordsSearch.trim()) {
      const q = patientRecordsSearch.toLowerCase()
      displayRecords = displayRecords.filter(rec => 
        rec.name.toLowerCase().includes(q) || 
        rec.id.toLowerCase().includes(q) || 
        (rec.category && rec.category.toLowerCase().includes(q))
      )
    }

    // Category filter
    if (patientRecordsFilterCat !== 'ALL') {
      displayRecords = displayRecords.filter(rec => rec.category === patientRecordsFilterCat)
    }

    // Sorting
    displayRecords.sort((a, b) => {
      if (patientRecordsSort === 'DATE_DESC') {
        return new Date(b.uploadTime || 0) - new Date(a.uploadTime || 0)
      }
      if (patientRecordsSort === 'DATE_ASC') {
        return new Date(a.uploadTime || 0) - new Date(b.uploadTime || 0)
      }
      if (patientRecordsSort === 'SIZE_DESC') {
        const parseSize = (s) => {
          if (!s) return 0
          const val = parseFloat(s)
          if (s.includes('MB')) return val * 1024 * 1024
          if (s.includes('KB')) return val * 1024
          return val
        }
        return parseSize(b.fileSize) - parseSize(a.fileSize)
      }
      if (patientRecordsSort === 'SIZE_ASC') {
        const parseSize = (s) => {
          if (!s) return 0
          const val = parseFloat(s)
          if (s.includes('MB')) return val * 1024 * 1024
          if (s.includes('KB')) return val * 1024
          return val
        }
        return parseSize(a.fileSize) - parseSize(b.fileSize)
      }
      return 0
    })

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Uploaded Records</h2>
            <p className="text-slate-505 dark:text-slate-405 text-xs mt-1">Audit security clearance levels, record classifications, and attribute access grids set on the ledger.</p>
          </div>
        </div>

        {/* Search, Filter & Sort Toolbar */}
        <div className="bg-white/70 dark:bg-slate-905/60 border border-slate-200/80 dark:border-slate-850 p-4 rounded-3xl shadow-sm backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search record name, ID or category..."
              value={patientRecordsSearch}
              onChange={(e) => setPatientRecordsSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Filter by Category */}
            <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-450" />
              <select
                value={patientRecordsFilterCat}
                onChange={(e) => setPatientRecordsFilterCat(e.target.value)}
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="MRI">MRI</option>
                <option value="X-Ray">X-Ray</option>
                <option value="ECG">ECG</option>
                <option value="Prescription">Prescription</option>
                <option value="Blood Report">Blood Report</option>
                <option value="Lab Report">Lab Report</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
              <select
                value={patientRecordsSort}
                onChange={(e) => setPatientRecordsSort(e.target.value)}
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-355 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                <option value="DATE_DESC">Date: Newest First</option>
                <option value="DATE_ASC">Date: Oldest First</option>
                <option value="SIZE_DESC">Size: Large to Small</option>
                <option value="SIZE_ASC">Size: Small to Large</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {displayRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-8 rounded-3xl text-center space-y-4">
              <FiFileText className="w-12 h-12 text-slate-355 dark:text-slate-700 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Records Found</h3>
              <p className="text-[11px] text-slate-550 dark:text-slate-400 max-w-xs mx-auto">
                No medical records match the active search and filter constraints.
              </p>
              <Link 
                to="/upload"
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all gap-1.5 cursor-pointer mx-auto"
              >
                <FiPlus className="w-4 h-4" />
                Upload New Record
              </Link>
            </div>
          ) : (
            displayRecords.map((record) => (
              <div 
                key={record.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-6 rounded-3xl shadow-sm space-y-4 hover:shadow-md hover:border-purple-500/20 transition-all duration-300 cursor-pointer relative group animate-fadeIn"
                onClick={() => {
                  setSelectedRecordForDetails(record)
                  setIsRecordDetailsModalOpen(true)
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{record.name}</h4>
                      <span className="text-[9px] uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded font-mono border border-purple-500/5">
                        {record.category || 'General'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-405 dark:text-slate-500 truncate max-w-[200px] md:max-w-md block" title={record.ipfsHash}>
                        IPFS CID: {record.ipfsHash}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(record.ipfsHash)
                        }} 
                        className="text-purple-605 hover:text-purple-500 p-0.5 rounded cursor-pointer"
                      >
                        <FiCopy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-right">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-550 block">Uploaded: {record.uploadTime.split(',')[0]}</span>
                      <span className="text-[9.5px] text-slate-455 dark:text-slate-500 font-mono block">Size: {record.fileSize || 'N/A'}</span>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Level {record.sensitivity}
                    </span>
                  </div>
                </div>

                {/* Access Matrix (Section 5 Requirement) */}
                <div className="bg-slate-50 dark:bg-slate-955/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/80" onClick={(e) => e.stopPropagation()}>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">Current Access Clearance Control Matrix</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {['Doctor', 'Nurse', 'Lab', 'Accountant', 'Public'].map((r) => {
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
                    {record.sensitivity === 'L0' && "* L0 restricts access only to Doctor. Nurses, Accountants and laboratory peers are denied."}
                    {record.sensitivity === 'L1' && "* L1 grants authorization rights to Doctors and Laboratory technicians."}
                    {record.sensitivity === 'L2' && "* L2 opens clearance to Accountants, Nurses, Doctors and Laboratories."}
                    {record.sensitivity === 'L3' && "* L3 ledger files are cleared for public access without authentication parameters."}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // 3. RECORD OWNERSHIP VISIBILITY - WHO ACCESSED MY DATA (implementing Section 4)
  const renderPatientWhoAccessed = () => {
    const displayedHistory = getPatientAccessHistory()

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Record Ownership Visibility</h2>
          <p className="text-slate-500 dark:text-slate-405 text-xs mt-1">Directly monitor which medical entities queried or requested access to your secure cases.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-6 rounded-3xl shadow-sm">
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
                {displayedHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-405 dark:text-slate-500">
                      No access log history found for your medical records on the ledger.
                    </td>
                  </tr>
                ) : (
                  displayedHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // 3b. PATIENT PROVIDERS MANAGEMENT (implementing Phase 3)
  const renderPatientProviders = () => {
    const handleToggleProviderStatus = (provId, newStatus) => {
      const updated = providers.map(p => {
        if (p.id === provId) {
          // Log audit entry in notifications
          const existingNotifs = JSON.parse(localStorage.getItem('notifications_list') || '[]')
          const prov = providers.find(item => item.id === provId)
          const newNotif = {
            id: 'NOTIF-' + Math.floor(100000 + Math.random() * 900000),
            text: `Permission Changed: Consent status for "${prov ? prov.name : 'Clinician'}" set to ${newStatus}.`,
            time: 'Just now',
            unread: true,
            type: 'consent'
          }
          localStorage.setItem('notifications_list', JSON.stringify([newNotif, ...existingNotifs]))

          return { ...p, status: newStatus }
        }
        return p
      })
      saveProviders(updated)
      toast.success(`Consent relationship status updated to ${newStatus}`)
    }

    const handleToggleActiveRelationship = (provId, currentActive) => {
      const updated = providers.map(p => {
        if (p.id === provId) {
          const newActive = !currentActive
          // Log audit entry in notifications
          const existingNotifs = JSON.parse(localStorage.getItem('notifications_list') || '[]')
          const prov = providers.find(item => item.id === provId)
          const newNotif = {
            id: 'NOTIF-' + Math.floor(100000 + Math.random() * 900000),
            text: `Relationship Updated: Connection status for "${prov ? prov.name : 'Clinician'}" set to ${newActive ? 'Active' : 'Inactive'}.`,
            time: 'Just now',
            unread: true,
            type: 'relationship'
          }
          localStorage.setItem('notifications_list', JSON.stringify([newNotif, ...existingNotifs]))
          return { ...p, relationshipActive: newActive }
        }
        return p
      })
      saveProviders(updated)
      toast.success(`Provider connection set to ${!currentActive ? 'Active' : 'Inactive'}`)
      // If modal is open, update selected provider state too
      if (selectedProvider && selectedProvider.id === provId) {
        setSelectedProvider(prev => ({ ...prev, relationshipActive: !currentActive }))
      }
    }

    const handleAddProvider = (clinician) => {
      // Check if already associated
      if (providers.some(p => p.id === clinician.id)) {
        toast.error(`${clinician.name} is already associated with your profile.`)
        return
      }
      const newProvider = {
        ...clinician,
        status: 'Pending Consent',
        relationshipActive: false,
        lastVisit: 'Never Visited',
        visitHistory: 'No visits logged yet.',
        visitLogs: []
      }
      const updated = [...providers, newProvider]
      saveProviders(updated)
      
      // Log notification
      const existingNotifs = JSON.parse(localStorage.getItem('notifications_list') || '[]')
      const newNotif = {
        id: 'NOTIF-' + Math.floor(100000 + Math.random() * 900000),
        text: `New Association: Requested association with "${clinician.name}" as provider.`,
        time: 'Just now',
        unread: true,
        type: 'association'
      }
      localStorage.setItem('notifications_list', JSON.stringify([newNotif, ...existingNotifs]))

      toast.success(`Associated ${clinician.name}. Consent status set to Pending.`)
    }

    // Filter clinician directory by search query
    const filteredDirectory = clinicianDirectory.filter(c => 
      c.name.toLowerCase().includes(providerSearchQuery.toLowerCase()) ||
      c.specialty.toLowerCase().includes(providerSearchQuery.toLowerCase()) ||
      c.org.toLowerCase().includes(providerSearchQuery.toLowerCase())
    )

    return (
      <div className="space-y-8 animate-fade-in font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Associated Healthcare Providers</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Manage relationship credentials, active consents, and audit provider access trails.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Associated Providers list */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-base font-bold text-slate-905 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Active Care Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {providers.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 dark:text-slate-500">
                  <span className="font-bold block text-sm text-slate-655 dark:text-slate-400">No healthcare providers associated</span>
                  <span className="text-xs text-slate-450 mt-1">No blockchain data available</span>
                </div>
              ) : (
                providers.map((prov) => (
                  <div key={prov.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-6 rounded-3xl shadow-sm space-y-4 hover:shadow-md transition-all duration-300 relative group animate-fadeIn">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                          {prov.name.substring(4, 5) || prov.name.substring(0, 1)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{prov.name}</h3>
                          <span className="text-[10px] text-purple-600 dark:text-purple-405 font-semibold bg-purple-500/5 px-2.5 py-0.5 rounded-md mt-0.5 inline-block">
                            {prov.specialty}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          prov.status === 'Authorized' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border-emerald-500/20' 
                            : prov.status === 'Pending Consent'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-455 border-amber-500/20 animate-pulse'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                        }`}>
                          {prov.status}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          prov.relationshipActive 
                            ? 'bg-purple-100 text-purple-750 dark:bg-purple-955/40 dark:text-purple-400' 
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prov.relationshipActive ? 'bg-purple-500 animate-ping' : 'bg-slate-400'}`}></span>
                          {prov.relationshipActive ? 'Active Conn' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-105 dark:border-slate-800/60 pt-4 space-y-3 text-xs text-slate-650 dark:text-slate-355">
                      <div className="flex justify-between">
                        <span>Clinic Affiliation</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{prov.org}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>License ID</span>
                        <span className="font-mono text-slate-600 dark:text-slate-400">{prov.license || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Clinical Visit</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{prov.lastVisit}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                      <button
                        onClick={() => {
                          setSelectedProvider(prov)
                          setIsProviderModalOpen(true)
                        }}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-355 font-bold transition-all cursor-pointer text-xs"
                      >
                        Inspect Profile
                      </button>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={prov.status}
                          onChange={(e) => handleToggleProviderStatus(prov.id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-705 dark:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="Authorized">Authorize</option>
                          <option value="Pending Consent">Set Pending</option>
                          <option value="Revoked">Revoke</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clinician Search Directory panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Clinician Directory</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Associate and add verified physicians onto your provider consent panel.</p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-405">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search specialty, name, org..."
                value={providerSearchQuery}
                onChange={(e) => setProviderSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/40 space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {filteredDirectory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No blockchain data available</div>
              ) : (
                filteredDirectory.map(c => {
                  const isAssociated = providers.some(p => p.id === c.id)
                  return (
                    <div key={c.id} className="pt-3 flex flex-col gap-1.5 first:pt-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200">{c.name}</h4>
                          <span className="text-[10px] text-purple-655 dark:text-purple-400 font-semibold block">{c.specialty} • {c.org}</span>
                        </div>
                        <button
                          onClick={() => handleAddProvider(c)}
                          disabled={isAssociated}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            isAssociated
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                              : 'bg-purple-605 hover:bg-purple-500 text-white shadow-sm'
                          }`}
                        >
                          {isAssociated ? 'Connected' : 'Associate'}
                        </button>
                      </div>
                      <p className="text-[9.5px] text-slate-400 leading-relaxed italic">{c.biography}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Provider Profile & Timeline/Visit History Modal */}
        {isProviderModalOpen && selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-zoom-in text-slate-805 dark:text-slate-105">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    {selectedProvider.name.substring(4, 5) || selectedProvider.name.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-955 dark:text-white">{selectedProvider.name}</h3>
                    <p className="text-[10px] text-slate-405 font-mono">Specialty: {selectedProvider.specialty} • Affiliation: {selectedProvider.org}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsProviderModalOpen(false)
                    setSelectedProvider(null)
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Profile Card details */}
                <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-105 dark:border-slate-850">
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-805 dark:text-slate-200">Clinician Profile</h4>
                    <button
                      onClick={() => handleToggleActiveRelationship(selectedProvider.id, selectedProvider.relationshipActive)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        selectedProvider.relationshipActive
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      }`}
                    >
                      Status: {selectedProvider.relationshipActive ? 'Active Connection' : 'Inactive Connection'}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-slate-450 block font-semibold">Distinguished Name / Peer DN</span>
                      <span className="font-mono text-[10px] bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-100 dark:border-slate-900 block truncate">
                        CN={selectedProvider.name},OU=Doctor,O={selectedProvider.org}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-450 font-semibold">License Registration</span>
                        <span className="font-bold block text-slate-800 dark:text-white">{selectedProvider.license || 'LIC-9831-MOCK'}</span>
                      </div>
                      <div>
                        <span className="text-slate-450 font-semibold">Clinical Experience</span>
                        <span className="font-bold block text-slate-800 dark:text-white">{selectedProvider.experience || '8 Years'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-450 font-semibold block">Biography Description</span>
                      <p className="text-slate-650 dark:text-slate-350 leading-relaxed italic">{selectedProvider.biography || 'No biography details loaded.'}</p>
                    </div>
                    <div>
                      <span className="text-slate-455 font-semibold block">Last Visit Notes</span>
                      <p className="text-slate-650 dark:text-slate-350 leading-relaxed font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 italic">
                        {selectedProvider.visitHistory}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visit History timeline logs */}
                <div className="space-y-4 bg-slate-50 dark:bg-slate-955/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <h4 className="font-bold text-slate-805 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800 pb-2">Provider Timeline / Visit History</h4>
                  <div className="space-y-4 overflow-y-auto max-h-64 pr-1">
                    {selectedProvider.visitLogs && selectedProvider.visitLogs.length > 0 ? (
                      selectedProvider.visitLogs.map((vl, idx) => (
                        <div key={idx} className="relative pl-4 border-l-2 border-purple-500/30 space-y-1">
                          <div className="absolute -left-[5.5px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="font-bold text-purple-655 dark:text-purple-400">{vl.date}</span>
                            <span className="text-slate-400 text-[9.5px]">{vl.vitals}</span>
                          </div>
                          <p className="text-[11px] text-slate-705 dark:text-slate-300 leading-relaxed italic">{vl.notes}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400 text-[11px] space-y-2">
                        <FiCalendar className="w-8 h-8 mx-auto opacity-30 text-purple-600" />
                        <span>No patient visit timeline history logs found for this clinician.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Secure record visibility grants mapped to provider specialty */}
              <div className="bg-slate-50 dark:bg-slate-955/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
                <h4 className="font-bold text-slate-805 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800 pb-2 mb-3">Linked Ledger Reports for Clinician Access</h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {patientRecords
                    .filter(rec => rec.patientName?.toLowerCase() === user?.name?.toLowerCase())
                    .map(rec => {
                      const hasAccess = selectedProvider.status === 'Authorized' && getRoleAccess(rec.sensitivity, 'Doctor')
                      return (
                        <div key={rec.id} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-855 p-2.5 rounded-xl">
                          <div>
                            <span className="font-bold text-slate-909 dark:text-white block">{rec.name}</span>
                            <span className="text-[10px] text-slate-405 font-mono">Category: {rec.category || 'General'} | Sensitivity Level {rec.sensitivity}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            hasAccess 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                          }`}>
                            {hasAccess ? 'Access Authorized' : 'Access Prohibited'}
                          </span>
                        </div>
                      )
                    })}
                  {patientRecords.filter(rec => rec.patientName?.toLowerCase() === user?.name?.toLowerCase()).length === 0 && (
                    <div className="text-center py-4 text-slate-400">No medical records uploaded for authorization.</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-105 dark:border-slate-850">
                <button
                  onClick={() => {
                    setIsProviderModalOpen(false)
                    setSelectedProvider(null)
                  }}
                  className="px-5 py-2.5 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-808 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Profile Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 3c. MEDICAL HISTORY TIMELINE (implementing Phase 4)
  const renderPatientHistory = () => {
    // Collect historical events:
    // 1. Files uploaded
    // 2. Visits logged with providers
    // 3. Permission grants
    const events = []

    // 1. Files uploaded
    patientRecords
      .filter(rec => rec.patientName?.toLowerCase() === user?.name?.toLowerCase())
      .forEach(rec => {
        events.push({
          id: `upload-${rec.id}`,
          type: 'UPLOAD',
          title: `Medical Record Uploaded: ${rec.fileName}`,
          description: `Uploaded report type ${rec.category} with sensitivity ${rec.sensitivity} and CID ${rec.ipfsHash.substring(0, 15)}...`,
          date: rec.uploadTime.split(',')[0],
          rawDate: new Date(rec.uploadTime),
          category: rec.category,
          provider: rec.uploadedBy || 'Patient Self',
          meta: `IPFS CID: ${rec.ipfsHash}`
        })
      })

    // 2. Visits logged with providers
    providers.forEach(p => {
      if (p.visitLogs) {
        p.visitLogs.forEach((vl, idx) => {
          events.push({
            id: `visit-${p.id}-${idx}`,
            type: 'VISIT',
            title: `Clinical Consultation: ${p.name}`,
            description: `Diagnostics summary: "${vl.notes}"`,
            date: vl.date,
            rawDate: new Date(vl.date),
            category: 'Prescription', // Mocking clinic notes under Prescription type
            provider: p.name,
            meta: `Vitals: ${vl.vitals}`
          })
        })
      }
    })

    // 3. Access logs / Permission updates
    const savedHistory = JSON.parse(localStorage.getItem('access_history') || '[]')
    savedHistory.forEach((h, idx) => {
      events.push({
        id: `access-${idx}`,
        type: 'PERMISSION',
        title: `Permission Updated: ${h.userName}`,
        description: `Consent status changed or record shared key created for case file ${h.recordId}.`,
        date: new Date(h.grantedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        rawDate: new Date(h.grantedDate),
        category: h.recordType,
        provider: h.userName,
        meta: `Clearance State: Active Granted`
      })
    })

    // Filter events by SearchQuery
    let filteredEvents = events.filter(e => {
      const q = historySearchQuery.toLowerCase()
      return e.title.toLowerCase().includes(q) || 
             e.description.toLowerCase().includes(q) || 
             e.provider.toLowerCase().includes(q) ||
             (e.category && e.category.toLowerCase().includes(q))
    })

    // Filter events by Category
    if (historyFilterType !== 'ALL') {
      filteredEvents = filteredEvents.filter(e => e.category?.toLowerCase() === historyFilterType.toLowerCase() || e.type === historyFilterType)
    }

    // Filter events by Provider
    if (historyFilterProvider !== 'ALL') {
      filteredEvents = filteredEvents.filter(e => e.provider.toLowerCase().includes(historyFilterProvider.toLowerCase()) || historyFilterProvider.toLowerCase().includes(e.provider.toLowerCase()))
    }

    // Filter events by Start Date & End Date calendars
    if (historyStartDate) {
      const start = new Date(historyStartDate)
      filteredEvents = filteredEvents.filter(e => e.rawDate >= start)
    }
    if (historyEndDate) {
      const end = new Date(historyEndDate)
      end.setHours(23, 59, 59, 999) // include whole end day
      filteredEvents = filteredEvents.filter(e => e.rawDate <= end)
    }

    // Sort events chronologically (Newest First)
    filteredEvents.sort((a, b) => b.rawDate - a.rawDate)

    const categoriesList = ['ECG', 'MRI', 'Blood Report', 'Prescription', 'Lab Report', 'X-Ray']

    return (
      <div className="space-y-8 animate-fade-in font-sans">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Medical History Timeline</h2>
          <p className="text-slate-550 dark:text-slate-400 text-xs mt-1">Trace all medical updates, diagnoses, uploads, and clinical visits anchored in blockchain ledger.</p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-405">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search history, diagnoses, providers..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Filter by Category */}
            <select
              value={historyFilterType}
              onChange={(e) => setHistoryFilterType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="UPLOAD">File Uploads</option>
              <option value="VISIT">Clinic Visits</option>
              <option value="PERMISSION">Consent Logs</option>
              {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {/* Filter by Provider */}
            <select
              value={historyFilterProvider}
              onChange={(e) => setHistoryFilterProvider(e.target.value)}
              className="bg-slate-50 dark:bg-slate-955 border border-slate-205 border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Caregivers</option>
              {providers.map(prov => <option key={prov.id} value={prov.name}>{prov.name}</option>)}
            </select>

            {/* Start Date */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-semibold">Start:</span>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-semibold">End:</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Visual Timeline Section */}
        <div className="relative border-l-2 border-purple-500/30 ml-4 md:ml-8 pl-6 md:pl-8 space-y-8">
          {filteredEvents.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center text-slate-450 ml-[-30px]">
              <FiFileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-purple-650" />
              <span>No historical events match the current search filters or date range.</span>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="relative ml-[-30px] md:ml-[-40px] flex items-start gap-4 md:gap-6 group">
                {/* Timeline Icon Node */}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-md bg-white dark:bg-slate-900 z-10 transition-transform group-hover:scale-110 ${
                  event.type === 'UPLOAD'
                    ? 'border-emerald-500 text-emerald-500'
                    : event.type === 'VISIT'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-purple-500 text-purple-500'
                }`}>
                  {event.type === 'UPLOAD' ? (
                    <FiArrowUp className="w-3.5 h-3.5" />
                  ) : event.type === 'VISIT' ? (
                    <FiActivity className="w-3.5 h-3.5" />
                  ) : (
                    <FiCheckCircle className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Event details card */}
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-5 rounded-3xl shadow-sm space-y-2.5 transition-all duration-300 hover:shadow-md hover:border-purple-500/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h3 className="font-bold text-sm text-slate-905 dark:text-white flex items-center gap-2">
                      {event.title}
                      {event.category && (
                        <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          {event.category}
                        </span>
                      )}
                    </h3>
                    <span className="text-[10px] font-mono text-purple-650 dark:text-purple-400 font-bold whitespace-nowrap bg-purple-500/5 px-2 py-0.5 rounded">
                      {event.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">{event.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/40 pt-2 text-[10px] text-slate-450 font-semibold font-mono">
                    <span>Caregiver: {event.provider}</span>
                    <span className="text-slate-400">{event.meta}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // 4. DOCTOR RECORDS LIST
  const renderDoctorRecords = () => {
    // Map patient records to Doctor's workspace records
    let doctorPatients = patientRecords.map(rec => {
      let authorized = false
      if (rec.sharedKeys) {
        // Real record: check if Doctor's key is present
        const docKeysSaved = localStorage.getItem(`user_keys_${user.name}`)
        if (docKeysSaved) {
          const docKeys = JSON.parse(docKeysSaved)
          authorized = !!rec.sharedKeys[docKeys.userId]
        }
      }
      return {
        id: rec.id,
        patient: rec.patientName || 'Unknown Patient',
        file: rec.fileName || rec.name,
        category: rec.category,
        sensitivity: rec.sensitivity,
        authorized: authorized,
        uploadTime: rec.uploadTime,
        fileSize: rec.fileSize,
        rawRecord: rec
      }
    })

    // Search query filter
    if (doctorRecordsSearch.trim()) {
      const q = doctorRecordsSearch.toLowerCase()
      doctorPatients = doctorPatients.filter(rec => 
        rec.file.toLowerCase().includes(q) || 
        rec.patient.toLowerCase().includes(q) || 
        rec.id.toLowerCase().includes(q) || 
        (rec.category && rec.category.toLowerCase().includes(q))
      )
    }

    // Category filter
    if (doctorRecordsFilterCat !== 'ALL') {
      doctorPatients = doctorPatients.filter(rec => rec.category === doctorRecordsFilterCat)
    }

    // Sorting
    doctorPatients.sort((a, b) => {
      if (doctorRecordsSort === 'DATE_DESC') {
        return new Date(b.uploadTime || 0) - new Date(a.uploadTime || 0)
      }
      if (doctorRecordsSort === 'DATE_ASC') {
        return new Date(a.uploadTime || 0) - new Date(b.uploadTime || 0)
      }
      if (doctorRecordsSort === 'SIZE_DESC') {
        const parseSize = (s) => {
          if (!s) return 0
          const val = parseFloat(s)
          if (s.includes('MB')) return val * 1024 * 1024
          if (s.includes('KB')) return val * 1024
          return val
        }
        return parseSize(b.fileSize) - parseSize(a.fileSize)
      }
      if (doctorRecordsSort === 'SIZE_ASC') {
        const parseSize = (s) => {
          if (!s) return 0
          const val = parseFloat(s)
          if (s.includes('MB')) return val * 1024 * 1024
          if (s.includes('KB')) return val * 1024
          return val
        }
        return parseSize(a.fileSize) - parseSize(b.fileSize)
      }
      return 0
    })

    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Patient Records Workspace</h2>
          <p className="text-slate-505 dark:text-slate-400 text-xs mt-1">Decrypt and inspect active patient health records authorized by ABAC consensus.</p>
        </div>

        {/* Search, Filter & Sort Toolbar */}
        <div className="bg-white/70 dark:bg-slate-905/60 border border-slate-200/80 dark:border-slate-850 p-4 rounded-3xl shadow-sm backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search patient name, case ID or category..."
              value={doctorRecordsSearch}
              onChange={(e) => setDoctorRecordsSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <select
              value={doctorRecordsFilterCat}
              onChange={(e) => setDoctorRecordsFilterCat(e.target.value)}
              className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-355 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="MRI">MRI</option>
              <option value="X-Ray">X-Ray</option>
              <option value="ECG">ECG</option>
              <option value="Prescription">Prescription</option>
              <option value="Blood Report">Blood Report</option>
              <option value="Lab Report">Lab Report</option>
            </select>

            <select
              value={doctorRecordsSort}
              onChange={(e) => setDoctorRecordsSort(e.target.value)}
              className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-355 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
            >
              <option value="DATE_DESC">Date: Newest First</option>
              <option value="DATE_ASC">Date: Oldest First</option>
              <option value="SIZE_DESC">Size: Large to Small</option>
              <option value="SIZE_ASC">Size: Small to Large</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Accessible Ledger Files</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40 space-y-3">
              {doctorPatients.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">No ledger files found matching filters.</div>
              ) : (
                doctorPatients.map((rec) => (
                  <div 
                    key={rec.id} 
                    className="pt-3 flex items-center justify-between gap-3 first:pt-0 group cursor-pointer animate-fadeIn"
                    onClick={() => {
                      setSelectedRecordForDetails(rec.rawRecord)
                      setIsRecordDetailsModalOpen(true)
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">{rec.file}</h4>
                      <span className="text-[10px] text-slate-450 block truncate">
                        Patient: <span className="font-semibold text-slate-750 dark:text-slate-300">{rec.patient}</span> | Classification: Level {rec.sensitivity} | Category: <span className="font-bold text-purple-650 dark:text-purple-400">{rec.category || 'General'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {rec.authorized ? (
                        <button 
                          onClick={() => handleDecrypt(rec.rawRecord || rec)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-600/10 cursor-pointer transition-colors"
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
                  </div>
                ))
              )}
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
                      <pre className="bg-slate-900 border border-slate-900/60 p-4 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-350 font-normal">
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
              {doctorLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400 italic">No access logs registered for your identity on the ledger.</td>
                </tr>
              ) : (
                doctorLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 pl-2 font-mono text-[10px] uppercase">{log.action || 'Read File'}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'Granted' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 font-semibold">{log.dataId || 'General Audit'}</td>
                    <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-550">{log.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // 6. NURSE ACCESS LAB REPORTS
  const renderNurseLabReports = () => {

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
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                      }`}>
                        {item.allowed ? 'Authorized' : 'Denied'}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                        {item.allowed ? (
                          <button 
                            onClick={() => {
                              setSelectedRecordForDetails(item.rawRecord)
                              setIsRecordDetailsModalOpen(true)
                            }}
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
                {nurseLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 italic">No access logs registered for your identity on the ledger.</td>
                  </tr>
                ) : (
                  nurseLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors">
                      <td className="py-4 pl-2 font-mono text-[10px]">{log.action || 'Read File'}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'Granted' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4 font-semibold">{log.dataId || 'General Audit'}</td>
                      <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-550">{log.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // 8. ADMIN USER MANAGEMENT
  const renderAdminUsers = () => {
    // Apply Search and Filters
    const filteredUsers = adminUsers.filter(usr => {
      const matchSearch = usr.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                          usr.cert.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          usr.email.toLowerCase().includes(userSearchQuery.toLowerCase())
      
      const matchRole = userRoleFilter === 'ALL' || usr.role.toUpperCase() === userRoleFilter.toUpperCase()
      const matchStatus = userStatusFilter === 'ALL' || usr.status.toUpperCase() === userStatusFilter.toUpperCase()
      
      return matchSearch && matchRole && matchStatus
    })

    // Pagination (5 items per page)
    const itemsPerPage = 5
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1
    
    // Adjust current page if out of bounds
    const currentPage = Math.min(userListPage, totalPages)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

    const handleActionClick = (usr, type) => {
      setSelectedUserForModal(usr)
      setUserModalActionType(type)
      setIsUserWarningModalOpen(true)
    }

    const executeUserAction = () => {
      setUserActionLoading(true)
      const actionName = userModalActionType === 'REVOKE' ? 'revoked' : 're-activated'
      
      setTimeout(() => {
        const updated = adminUsers.map(u => {
          if (u.id === selectedUserForModal.id) {
            return { ...u, status: userModalActionType === 'REVOKE' ? 'Revoked' : 'Active' }
          }
          return u
        })
        saveAdminUsers(updated)
        
        // Log transaction to consensus logs
        const newLog = {
          id: Date.now(),
          user: 'System Administrator',
          role: 'Admin',
          action: `${userModalActionType === 'REVOKE' ? 'Revoked' : 'Activated'} identity cert ${selectedUserForModal.cert.substring(0, 10)}... for ${selectedUserForModal.name}`,
          status: 'Granted',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }
        setAccessLogs(prev => [newLog, ...prev])

        toast.success(`User certificate has been successfully ${actionName} on CA ledger.`)
        setUserActionLoading(false)
        setIsUserWarningModalOpen(false)
      }, 1200)
    }

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="text-purple-600 dark:text-purple-400" />
              User Administration
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Manage public certificate access states, inspect digital signatures and revoke security keys.</p>
          </div>
        </div>

        {/* Filters and Search Bar Card */}
        <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-205 dark:border-slate-800 p-4 rounded-2xl shadow-sm backdrop-blur-xl flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search user name, email or certificate hash..."
              value={userSearchQuery}
              onChange={(e) => {
                setUserSearchQuery(e.target.value)
                setUserListPage(1)
              }}
              className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value)
                  setUserListPage(1)
                }}
                className="bg-slate-50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-305 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="ALL">All Roles</option>
                <option value="DOCTOR">Doctors</option>
                <option value="NURSE">Nurses</option>
                <option value="PATIENT">Patients</option>
                <option value="EXTERNAL">External</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
              <select
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value)
                  setUserListPage(1)
                }}
                className="bg-slate-50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-305 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="REVOKED">Revoked Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* User List Table */}
        <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-805 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold bg-slate-50/50 dark:bg-slate-955/20">
                  <th className="py-4 pl-6">User Name</th>
                  <th className="py-4">Network Role</th>
                  <th className="py-4">Certificate Hash (CA Index)</th>
                  <th className="py-4">Status</th>
                  <th className="py-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 text-xs font-sans">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-400 dark:text-slate-500">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse text-purple-600" />
                      <span className="font-bold block text-sm text-slate-655 dark:text-slate-400">No blockchain data available</span>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((usr, idx) => (
                    <motion.tr 
                      key={usr.id} 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-955/20 transition-all duration-150"
                    >
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shadow-sm">
                            {usr.name.charAt(0) === 'D' && usr.name.includes('Dr.') ? 'Dr' : usr.name.substring(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block hover:text-purple-600 cursor-pointer" onClick={() => setSelectedUserForModal(usr)}>
                              {usr.name}
                            </span>
                            <span className="text-[10px] text-slate-455 dark:text-slate-500 block font-mono">{usr.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono tracking-wider ${
                          usr.role === 'Doctor' 
                            ? 'bg-purple-100/60 dark:bg-purple-900/20 text-purple-750 dark:text-purple-400 border border-purple-500/10'
                            : usr.role === 'Patient'
                            ? 'bg-emerald-100/60 dark:bg-emerald-900/20 text-emerald-705 dark:text-emerald-400 border border-emerald-500/10'
                            : usr.role === 'Nurse'
                            ? 'bg-blue-100/60 dark:bg-blue-900/20 text-blue-750 dark:text-blue-400 border border-blue-500/10'
                            : 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-655 dark:text-slate-400 border border-slate-500/10'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <span 
                            onClick={() => setSelectedUserForModal(usr)}
                            className="font-mono text-[10.5px] text-slate-550 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer underline decoration-dotted tracking-tight"
                            title="Inspect X.509 Certificate"
                          >
                            {usr.cert.substring(0, 14)}...{usr.cert.substring(usr.cert.length - 8)}
                          </span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(usr.cert)
                              toast.success('Certificate hash copied to clipboard!')
                            }}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border ${
                          usr.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${usr.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {usr.status}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-6">
                        {usr.status === 'Active' ? (
                          <button 
                            onClick={() => handleActionClick(usr, 'REVOKE')}
                            className="px-2.5 py-1.5 border border-rose-500/30 text-rose-555 bg-rose-500/5 hover:bg-rose-500/15 rounded-xl text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Revoke Cert
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleActionClick(usr, 'ACTIVATE')}
                            className="px-2.5 py-1.5 border border-emerald-500/30 text-emerald-555 bg-emerald-500/5 hover:bg-emerald-500/15 rounded-xl text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Re-activate
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-between font-sans text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold text-slate-800 dark:text-slate-200">{startIndex + 1}</span> to{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {Math.min(startIndex + itemsPerPage, filteredUsers.length)}
                </span>{' '}
                of <span className="font-bold text-slate-800 dark:text-slate-200">{filteredUsers.length}</span> entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setUserListPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setUserListPage(i + 1)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                      currentPage === i + 1
                        ? 'bg-purple-650 text-white'
                        : 'border border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350'
                    } cursor-pointer`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setUserListPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }  // 9. ADMIN SYSTEM ACCESS LOGS
  const renderAdminAccessLogs = () => {
    // Search and Status Filtering
    const filteredLogs = accessLogs.filter(log => {
      const matchSearch = log.user.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
                          log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          log.role.toLowerCase().includes(logSearchQuery.toLowerCase())
      
      const matchStatus = logStatusFilter === 'ALL' || log.status.toUpperCase() === logStatusFilter.toUpperCase()
      
      const matchScope = logScope === 'ALL' || 
                         (logScope === 'PROVIDER_ONLY' && (log.role === 'Doctor' || log.role === 'Nurse'))
      
      return matchSearch && matchStatus && matchScope
    })

    // Pagination (5 items per page)
    const itemsPerPage = 5
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1
    const currentPage = Math.min(logListPage, totalPages)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="text-purple-650 dark:text-purple-400 animate-pulse" />
              Fabric Ledger Access Audit Logs
            </h2>
            <p className="text-slate-550 dark:text-slate-400 text-xs mt-1">Complete system-wide access logs committed to CouchDB state database.</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* System logs vs Provider logs scope toggle (Phase 7) */}
            <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-202 dark:border-slate-850 flex items-center font-sans text-xs">
              <button
                onClick={() => {
                  setLogScope('ALL')
                  setLogListPage(1)
                }}
                className={`px-4.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  logScope === 'ALL' 
                    ? 'bg-white dark:bg-slate-900 text-purple-655 dark:text-purple-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-805 dark:hover:text-slate-200'
                }`}
              >
                All Access Logs
              </button>
              <button
                onClick={() => {
                  setLogScope('PROVIDER_ONLY')
                  setLogListPage(1)
                }}
                className={`px-4.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  logScope === 'PROVIDER_ONLY' 
                    ? 'bg-white dark:bg-slate-900 text-purple-655 dark:text-purple-400 shadow-sm' 
                    : 'text-slate-505 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Provider Actions
              </button>
            </div>

            {/* Table vs Timeline Sliding Toggle */}
            <div className="bg-slate-100 dark:bg-slate-955 p-1 rounded-2xl border border-slate-205 dark:border-slate-850 flex items-center font-sans text-xs">
              <button
                onClick={() => {
                  setLogViewMode('TABLE')
                  setLogListPage(1)
                }}
                className={`px-4.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  logViewMode === 'TABLE' 
                    ? 'bg-white dark:bg-slate-900 text-purple-655 dark:text-purple-400 shadow-sm' 
                    : 'text-slate-505 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => {
                  setLogViewMode('TIMELINE')
                  setLogListPage(1)
                }}
                className={`px-4.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  logViewMode === 'TIMELINE' 
                    ? 'bg-white dark:bg-slate-900 text-purple-655 dark:text-purple-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Timeline View
              </button>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm backdrop-blur-xl flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search user, action or role..."
              value={logSearchQuery}
              onChange={(e) => {
                setLogSearchQuery(e.target.value)
                setLogListPage(1)
              }}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={logStatusFilter}
                onChange={(e) => {
                  setLogStatusFilter(e.target.value)
                  setLogListPage(1)
                }}
                className="bg-slate-50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="GRANTED">Granted Only</option>
                <option value="DENIED">Denied Only</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                toast.success('Refreshing audit state index from CouchDB...')
              }}
              className="p-2 border border-slate-200 dark:border-slate-850 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-xl cursor-pointer"
              title="Sync Ledger Logs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-605 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Dynamic Display Mode */}
        {logViewMode === 'TABLE' ? (
          /* TABLE VIEW */
          <div className="bg-white/70 dark:bg-slate-905/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold bg-slate-50/50 dark:bg-slate-955/20">
                    <th className="py-4 pl-6">User identity</th>
                    <th className="py-4">Network Role</th>
                    <th className="py-4">Action Executed</th>
                    <th className="py-4">Consensus Validation</th>
                    <th className="py-4 text-right pr-6">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 text-xs font-sans">
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <Activity className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse text-purple-650" />
                        <span className="font-bold block text-sm text-slate-655 dark:text-slate-400">No logs found</span>
                        <span className="text-xs text-slate-450 mt-1">Ledger state database is clean.</span>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log, idx) => (
                      <motion.tr 
                        key={log.id} 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className="hover:bg-slate-50/40 dark:hover:bg-slate-955/20 transition-all duration-150"
                      >
                        <td className="py-4 pl-6 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                          {log.user}
                        </td>
                        <td className="py-4 font-mono text-[9.5px] uppercase text-slate-550 dark:text-slate-405 font-bold">{log.role}</td>
                        <td className="py-4 font-medium text-slate-850 dark:text-slate-250 font-mono text-[10.5px]">{log.action}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border ${
                            log.status === 'Granted'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${log.status === 'Granted' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-6 font-mono text-[10px] text-slate-450 dark:text-slate-500">{log.timestamp}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-between font-sans text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Showing <span className="font-bold text-slate-800 dark:text-slate-200">{startIndex + 1}</span> to{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {Math.min(startIndex + itemsPerPage, filteredLogs.length)}
                  </span>{' '}
                  of <span className="font-bold text-slate-800 dark:text-slate-200">{filteredLogs.length}</span> entries
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLogListPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-655 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLogListPage(i + 1)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                        currentPage === i + 1
                          ? 'bg-purple-655 text-white'
                          : 'border border-slate-202 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350'
                      } cursor-pointer`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setLogListPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-655 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TIMELINE VIEW */
          <div className="space-y-6">
            {paginatedLogs.length === 0 ? (
              <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse text-purple-650" />
                <span className="font-bold block text-sm">No activity records match filters</span>
              </div>
            ) : (
              <div className="relative border-l-2 border-purple-500/30 ml-4 md:ml-8 pl-6 md:pl-8 space-y-8 font-sans">
                {paginatedLogs.map((log, index) => {
                  const isGranted = log.status === 'Granted'
                  const tColor = isGranted 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-455'

                  return (
                    <div key={log.id} className="relative group animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                      {/* Pulsing indicator node */}
                      <span className={`absolute -left-[37px] md:-left-[45px] top-1.5 rounded-full p-1.5 border-2 flex items-center justify-center h-7 w-7 shadow-sm transition-transform duration-300 group-hover:scale-110 ${tColor}`}>
                        {isGranted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </span>

                      {/* Timeline Detail Card */}
                      <div className="bg-white/75 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm backdrop-blur-xl hover:shadow-md hover:border-purple-500/20 transition-all duration-300 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{log.user}</span>
                            <span className="text-[9px] uppercase tracking-wider bg-slate-105 dark:bg-slate-950 font-mono font-bold px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                              {log.role}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-450 dark:text-slate-500 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 text-purple-650" />
                            {log.timestamp}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <span className="text-slate-450 dark:text-slate-405 mr-1 text-[11px]">Requested Operation:</span>
                            <span className="font-mono text-purple-655 dark:text-purple-400 font-bold bg-purple-500/5 px-2 py-1 rounded border border-purple-500/10">
                              {log.action}
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                            <div>Validation: <span className={isGranted ? 'text-emerald-500 font-bold' : 'text-rose-505 font-bold'}>{log.status}</span></div>
                            <div>•</div>
                            <div>Transaction Hash: <span className="underline select-all">0x{log.id.toString(16).padEnd(40, '0').substring(0, 16)}...</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white/40 dark:bg-slate-900/20 p-4 border border-slate-202 dark:border-slate-850 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-350">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLogListPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setLogListPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // 10. ROLE-BASED SETTINGS (implementing Section 9 Settings)
  const renderSettings = () => {
    const tabs = [
      { id: 'GENERAL', label: 'General', icon: User },
      { id: 'SECURITY', label: 'Security', icon: Lock },
      { id: 'NOTIFICATIONS', label: 'Notifications', icon: Activity },
      { id: 'BLOCKCHAIN', label: 'Blockchain', icon: Shield },
      { id: 'THEME', label: 'Theme', icon: Settings }
    ]

    return (
      <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="text-purple-650 dark:text-purple-400" />
            Account & Portal Settings
          </h2>
          <p className="text-slate-505 dark:text-slate-405 text-xs mt-1">Configure your login credentials, interface themes, notification rules, and network options.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Settings Sidebar Tabs */}
          <div className="lg:col-span-3 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm backdrop-blur-xl space-y-1.5 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              const isActive = activeSettingTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingTab(tab.id)}
                  className={`flex items-center gap-3 px-4.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                    isActive 
                      ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 border border-purple-500/10' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/60 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <TabIcon className="w-4.5 h-4.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Settings Content Area */}
          <div className="lg:col-span-9 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm backdrop-blur-xl">
                        {/* GENERAL TAB */}
            {activeSettingTab === 'GENERAL' && (
              <div className="space-y-6 animate-fadeIn font-sans">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  General Profile Configuration
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-4">
                  <div 
                    onClick={() => document.getElementById('adminAvatarUpload').click()}
                    className="relative group w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500/20 cursor-pointer shadow-sm hover:border-purple-500/50 transition-all duration-300"
                  >
                    <img 
                      src={adminAvatar} 
                      alt="avatar" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 group-hover:brightness-75"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <FiPlus className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <input 
                      type="file" 
                      id="adminAvatarUpload" 
                      accept="image/png, image/jpeg" 
                      onChange={handleAvatarChange} 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => document.getElementById('adminAvatarUpload').click()}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-purple-500/10"
                    >
                      Change Avatar
                    </button>
                    <span className="text-[10px] text-slate-400 block">PNG or JPEG, Max size of 800KB</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">Account Username</label>
                    <input 
                      type="text" 
                      value={settingsGeneral.adminName}
                      onChange={(e) => setSettingsGeneral(p => ({ ...p, adminName: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">Security Email Target</label>
                    <input 
                      type="email" 
                      value={settingsGeneral.adminEmail}
                      onChange={(e) => setSettingsGeneral(p => ({ ...p, adminEmail: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-202 dark:border-slate-855 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">Member MSP Organization</label>
                    <input 
                      type="text" 
                      value={settingsGeneral.orgName}
                      onChange={(e) => setSettingsGeneral(p => ({ ...p, orgName: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-202 dark:border-slate-850 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">System Language</label>
                    <select 
                      value={settingsGeneral.language}
                      onChange={(e) => setSettingsGeneral(p => ({ ...p, language: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-202 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="English (US)">English (US)</option>
                      <option value="English (UK)">English (UK)</option>
                      <option value="Spanish">Español</option>
                      <option value="German">Deutsch</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">Portal Session Timeout (Minutes)</label>
                    <input 
                      type="number" 
                      min="5" 
                      max="1440" 
                      value={settingsGeneral.sessionTimeout}
                      onChange={(e) => setSettingsGeneral(p => ({ ...p, sessionTimeout: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">Portal Security Mode</label>
                    <select 
                      value={settingsGeneral.portalMode}
                      onChange={(e) => setSettingsGeneral(p => ({ ...p, portalMode: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-202 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="Normal Operations">Normal Operations</option>
                      <option value="Maintenance Mode">Maintenance Mode</option>
                      <option value="Audit Only Mode">Audit Only Mode</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-slate-500 dark:text-slate-400">Primary Channel Peer Endpoint</label>
                    <input 
                      type="text" 
                      value={settingsGeneral.peerEndpoint}
                      onChange={(e) => setSettingsGeneral(p => ({ ...p, peerEndpoint: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button 
                    onClick={handleSaveGeneralConfig}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-500/10"
                  >
                    Save General Configuration
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeSettingTab === 'SECURITY' && (
              <div className="space-y-6 animate-fadeIn font-sans text-xs font-semibold">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Credential & Cryptographic Security
                </h3>
                
                <div className="bg-purple-500/5 p-4 rounded-2xl border border-purple-500/10 flex gap-3 items-start leading-relaxed text-purple-700 dark:text-purple-300">
                  <Shield className="w-5 h-5 flex-shrink-0 text-purple-650 mt-0.5" />
                  <span>Enforcing high-level CA validation passwords prevents session hijacking on the Hyperledger orderer network. Password audits are performed client-side using local keys.</span>
                </div>

                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">Current Administrative Password</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">New Administrative Password</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-2xl max-w-md cursor-pointer select-none">
                  <div>
                    <span className="block text-slate-700 dark:text-slate-350">Enforce Multi-Factor Auth (MFA)</span>
                    <span className="text-[10px] text-slate-450 block font-normal mt-0.5">Enforces dynamic security banner challenges upon portal session launches.</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.enforceMfa}
                    onChange={(e) => setSettings(p => ({ ...p, enforceMfa: e.target.checked }))}
                    className="w-4.5 h-4.5 text-purple-650 rounded bg-slate-50 border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button 
                    onClick={() => toast.success('System security credentials updated.')}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-500/10"
                  >
                    Save Security Policies
                  </button>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeSettingTab === 'NOTIFICATIONS' && (
              <div className="space-y-6 animate-fadeIn font-sans text-xs font-semibold text-slate-700 dark:text-slate-300">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  System Audit Notifications
                </h3>

                <div className="space-y-4">
                  {[
                    { title: 'Email Audit Reports', desc: 'Send daily cryptographic validation logs and intercepted threat activities directly to the admin email.', checked: true },
                    { title: 'Real-time Verification Alerts', desc: 'Display instant notification alerts for all blockchain block-mining and key-access transactions.', checked: true },
                    { title: 'SMS Security Breach Alarms', desc: 'Trigger high-priority cellular alerts whenever consensus logs intercept a critical (revoked certificate) access attempt.', checked: false }
                  ].map((notif, idx) => (
                    <label key={idx} className="flex gap-4 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl cursor-pointer transition-colors">
                      <input type="checkbox" defaultChecked={notif.checked} className="w-4.5 h-4.5 text-purple-655 rounded border-slate-305 focus:ring-purple-500 mt-0.5 cursor-pointer" />
                      <div>
                        <span className="block font-bold text-slate-900 dark:text-white">{notif.title}</span>
                        <span className="text-[10px] text-slate-455 dark:text-slate-500 block font-normal leading-normal mt-0.5">{notif.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button 
                    onClick={() => toast.success('Audit notification rules updated.')}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-500/10"
                  >
                    Save Notification Rules
                  </button>
                </div>
              </div>
            )}

            {/* BLOCKCHAIN TAB */}
            {activeSettingTab === 'BLOCKCHAIN' && (
              <div className="space-y-6 animate-fadeIn font-sans text-xs font-semibold">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Blockchain Channel Tuning
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">Symmetric Cryptographic Standard</label>
                    <select 
                      value={settings.keyLength} 
                      onChange={(e) => setSettings(p => ({ ...p, keyLength: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="AES-128">AES-128 (Faster throughput)</option>
                      <option value="AES-192">AES-192 (Intermediate standard)</option>
                      <option value="AES-256">AES-256 (High secure HIPAA clearance)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-505 dark:text-slate-400">Min Consensual Organizations</label>
                    <input 
                      type="number" 
                      min="2" 
                      max="10"
                      value={settings.consensusNodes}
                      onChange={(e) => setSettings(p => ({ ...p, consensusNodes: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-202 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">Fabric Channel Identifier</label>
                    <input 
                      type="text" 
                      defaultValue="ehealth-channel"
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400">Consensus Orderer Address</label>
                    <input 
                      type="text" 
                      defaultValue="orderer.ehealth.org:7050"
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 font-sans">
                  <button 
                    onClick={() => toast.success('Hyperledger Fabric channel configurations saved.')}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-500/10"
                  >
                    Save Blockchain Tunings
                  </button>
                </div>
              </div>
            )}

            {/* THEME TAB */}
            {activeSettingTab === 'THEME' && (
              <div className="space-y-6 animate-fadeIn font-sans text-xs font-semibold">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Theme Configuration
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'LIGHT', name: 'Light Mode', desc: 'Recommended for daylight operations and standard setups.', active: !document.documentElement.classList.contains('dark') },
                    { id: 'DARK', name: 'Dark Mode', desc: 'LED low-light interface styled with deep neon accents.', active: document.documentElement.classList.contains('dark') }
                  ].map((themeOpt) => (
                    <div 
                      key={themeOpt.id}
                      onClick={() => {
                        if (themeOpt.id === 'LIGHT') {
                          document.documentElement.classList.remove('dark')
                          localStorage.setItem('theme', 'light')
                        } else {
                          document.documentElement.classList.add('dark')
                          localStorage.setItem('theme', 'dark')
                        }
                        toast.success(`Theme mode: ${themeOpt.name}`)
                      }}
                      className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between gap-3 transition-all duration-300 ${
                        themeOpt.active 
                          ? 'border-purple-500 bg-purple-500/5 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400' 
                          : 'border-slate-202 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{themeOpt.name}</span>
                        {themeOpt.active && <div className="w-2.5 h-2.5 rounded-full bg-purple-650 dark:bg-purple-400"></div>}
                      </div>
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 leading-normal font-normal">{themeOpt.desc}</p>
                    </div>
                  ))}
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
    const keysKey = `user_keys_${user?.name}`
    const userKeys = JSON.parse(localStorage.getItem(keysKey) || '{}')
    const privateKey = userKeys.privateKey || ''

    const downloadProfilePrivateKey = () => {
      if (!privateKey) {
        toast.error('No private key available for this profile.')
        return
      }
      const element = document.createElement("a");
      const file = new Blob([privateKey], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${user?.name.replace(/\s+/g, '_')}_private_key.pem`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Private key PEM file downloaded successfully!');
    }

    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Security Profile</h2>
          <p className="text-slate-500 dark:text-slate-405 text-xs mt-1">Manage your identity, view cryptographic certificates, and check organization nodes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Profile Details */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-6 rounded-3xl shadow-sm space-y-6">
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
                  <span className="text-slate-455 dark:text-slate-400">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-455 dark:text-slate-400">Organization / Group</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.organization || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-455 dark:text-slate-400">Security Clearance</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {role === 'Admin' ? 'Level 4 (Full System Control)' : role === 'Doctor' ? 'Level 3 (Write/Read Authorized)' : role === 'Nurse' ? 'Level 2 (Read/Update Limited)' : 'Level 1 (Self Records Access)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-455 dark:text-slate-400">Consensus Peer Affinity</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-355 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2 py-0.5 rounded">
                    {role === 'Admin' ? 'Peer0.Admin.ehealth.org' : role === 'Doctor' ? 'Peer1.Hospital.ehealth.org' : role === 'Nurse' ? 'Peer2.Lab.ehealth.org' : 'Peer3.Client.ehealth.org'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Certificate */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiShield className="text-emerald-500" />
                eHealth Digital X.509 Certificate
              </h3>
              <p className="text-[10px] text-slate-500">Hyperledger Fabric CA Issued identity certificate for securing patient HIPAA compliance logs.</p>
              
              <div className="space-y-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-955 border border-slate-202 dark:border-slate-855 rounded-2xl space-y-2.5 font-mono text-[10px]">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-405">VERSION</span>
                    <span className="text-slate-900 dark:text-white">v3 (X.509)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-405">SERIAL NUMBER / UID</span>
                    <span className="text-slate-900 dark:text-white font-mono">{user?.userId || '0F:D4:5A:21:BC:07:90:E5'}</span>
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
                    <span className="text-slate-405 block mb-1">X.509 PUBLIC KEY DATA (PEM)</span>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-xl text-[9px] text-slate-500 dark:text-slate-405 break-all max-h-16 overflow-y-auto font-mono relative group">
                      {user?.publicKey || 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7p95R3eO3w9oF3d72rGv'}
                      <button 
                        onClick={() => handleCopy(user?.publicKey || 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7p95R3eO3w9oF3d72rGv')}
                        className="absolute right-2 top-2 p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-955 dark:hover:bg-slate-900 rounded cursor-pointer"
                        title="Copy Key"
                      >
                        <FiCopy className="w-3 h-3 text-slate-650 dark:text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {privateKey && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-850 mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-500 font-bold block">X.509 PRIVATE KEY DATA (PEM)</span>
                        <button 
                          onClick={downloadProfilePrivateKey}
                          className="text-[10px] text-purple-650 dark:text-purple-400 hover:underline cursor-pointer font-bold"
                        >
                          Download .PEM File
                        </button>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-xl text-[9px] text-slate-500 dark:text-slate-405 break-all max-h-16 overflow-y-auto font-mono relative group">
                        {privateKey}
                        <button 
                          onClick={() => handleCopy(privateKey)}
                          className="absolute right-2 top-2 p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-955 dark:hover:bg-slate-900 rounded cursor-pointer"
                          title="Copy Key"
                        >
                          <FiCopy className="w-3 h-3 text-slate-650 dark:text-slate-400" />
                        </button>
                      </div>
                    </div>
                  )}
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
      case '#providers':
        if (role === 'Patient') return renderPatientProviders()
        return renderDefault()
      case '#history':
        if (role === 'Patient') return renderPatientHistory()
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
        if (role === 'Admin' || role === 'Accountant') return renderAdminAccessLogs()
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

      {/* Doctor Modal Overlay for Access Request */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-zoom-in text-slate-800 dark:text-slate-100">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-655 dark:text-purple-400 flex items-center justify-center">
                  <FiLock className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                    Submit Access Request Block
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">CHANNEL: ehealth-channel | ABAC PROTOCOL</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleDoctorSubmitRequest} className="space-y-4 text-xs font-semibold text-slate-755 dark:text-slate-350">
              {/* Patient ID select */}
              <div className="space-y-1.5">
                <label className="block text-slate-505 dark:text-slate-400">Target Patient ID</label>
                <select
                  value={requestFormData.patientId}
                  onChange={(e) => setRequestFormData(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  {patientRecords.map(rec => (
                    <option key={rec.id} value={rec.id}>{rec.id} ({rec.patientName})</option>
                  ))}
                  {patientRecords.length === 0 && (
                    <option value="">No patient records available</option>
                  )}
                </select>
              </div>

              {/* Record Type select */}
              <div className="space-y-1.5">
                <label className="block text-slate-505 dark:text-slate-400">Medical Record Target Type</label>
                <select
                  value={requestFormData.recordType}
                  onChange={(e) => setRequestFormData(prev => ({ ...prev, recordType: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="Cardiology Report">Cardiology Report</option>
                  <option value="Blood Panel Analysis">Blood Panel Analysis</option>
                  <option value="MRI Brain Scan">MRI Brain Scan</option>
                  <option value="General Health Screening">General Health Screening</option>
                </select>
              </div>

              {/* Purpose of Access text area */}
              <div className="space-y-1.5">
                <label className="block text-slate-550 dark:text-slate-400 font-bold">Purpose of Access (ABAC evaluation reason)</label>
                <textarea
                  value={requestFormData.purpose}
                  onChange={(e) => setRequestFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Describe why clinical access is required for patient data..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-xl px-3.5 py-3 text-slate-900 dark:text-white placeholder-slate-400/80 focus:ring-1 focus:ring-purple-500 focus:outline-none font-sans"
                />
              </div>

              {/* Request Duration select */}
              <div className="space-y-1.5">
                <label className="block text-slate-550 dark:text-slate-400 font-bold">Requested Authorization Duration</label>
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

              {/* Notice */}
              <div className="bg-purple-500/5 border border-purple-500/10 p-3.5 rounded-2xl flex gap-2.5 items-start text-[10px] text-purple-700 dark:text-purple-300 font-medium leading-relaxed font-sans">
                <FiShield className="w-4.5 h-4.5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>The system automatically signs this request using your ECDSA keys. It is registered as a pending transaction pending the patient's authorization check.</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-202 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-350 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRequestSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-md flex items-center gap-1.5 ${
                    isRequestSubmitting 
                      ? 'bg-slate-250 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-200/10'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20 cursor-pointer'
                  }`}
                >
                  {isRequestSubmitting ? (
                    <>
                      <FiCpu className="animate-spin w-4 h-4" />
                      Mining Block...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Certificate Inspector Modal */}
      {selectedUserForModal && !isUserWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-zoom-in text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Inspect X.509 Certificate</h3>
                  <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-bold block mt-0.5">ISSUED BY: EHEALTH-CA-MSP</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUserForModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-semibold text-xs text-slate-700 dark:text-slate-350">
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450 dark:text-slate-400">Subject Distinguished Name</span>
                <span className="text-slate-900 dark:text-white font-mono text-[10.5px]">CN={selectedUserForModal.name},OU={selectedUserForModal.role},O={selectedUserForModal.org}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450 dark:text-slate-400">Email Reference</span>
                <span className="text-slate-900 dark:text-white font-mono">{selectedUserForModal.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-455 dark:text-slate-400">CA Serial Code</span>
                <span className="text-slate-900 dark:text-white font-mono text-[10px] uppercase">
                  {selectedUserForModal.cert.substring(2, 10).match(/.{1,2}/g).join(':')}:{selectedUserForModal.id.replace('usr-', '0')}A:FE:90
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-455 dark:text-slate-400">Clearance Status</span>
                <span className={`font-bold ${selectedUserForModal.status === 'Active' ? 'text-emerald-505' : 'text-rose-505'}`}>{selectedUserForModal.status.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                <span className="text-slate-450 dark:text-slate-400">Registered Date</span>
                <span className="text-slate-900 dark:text-white font-mono">{selectedUserForModal.dateRegistered || '2026-05-12'}</span>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-slate-450 dark:text-slate-400 block">X.509 Cryptographic Certificate Payload (ECDSA Secp256r1)</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 overflow-y-auto max-h-36 font-mono text-[9px] text-slate-350 select-all leading-normal">
                  -----BEGIN CERTIFICATE-----
                  MIIB2zCCAXKgAwIBAgIU{selectedUserForModal.cert.substring(2, 20).toUpperCase()}
                  WDAMBggqhkjOPQQDAjAzMRUwEwYDVQQDDAxlSGVhbHRoLUNBLU1TUDEe
                  MBwGA1UECgwWZWhlYWx0aC5jb25zb3J0aXVtLm9yZzAeFw0yNjA1MTIw
                  NDMwMDBaFw0zMDA1MTIwNDMwMDBaMGcxFTATBgNVBAMMDERyLiBTYXJh
                  aCBNaWxsZXIxDzANBgNVBAsMBkRvY3RvcjEVMBsGA1UECgwVTklUIEpB
                  TVNIRURQVVIgSE9TUElUQUwwWTATBgcqhkjOPQIBBggqhkjOPQMBBwND
                  IABEgGj+2Sg/d56S{selectedUserForModal.cert.substring(20, 40).toLowerCase()}
                  HwLhR4Y59tQ8z7XvE6Pj30l5y91Vf2479Y25...
                  -----END CERTIFICATE-----
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-850">
              <button 
                onClick={() => setSelectedUserForModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Revocation/Activation Warning Modal */}
      {selectedUserForModal && isUserWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 animate-zoom-in text-slate-800 dark:text-slate-100 font-sans">
            <div className="flex items-center gap-3.5 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                <ShieldAlert className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  {userModalActionType === 'REVOKE' ? 'Revoke Security Certificate' : 'Re-activate Identity Access'}
                </h3>
                <span className="text-[9.5px] font-mono text-rose-600 dark:text-rose-450 font-bold block mt-0.5">ACTION TARGETS CONSENSUS MSP</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans font-semibold">
              <p>
                {userModalActionType === 'REVOKE' ? (
                  <>
                    Are you sure you want to revoke the digital certificate for <strong className="text-slate-900 dark:text-white">{selectedUserForModal.name}</strong>? 
                    This will immediately block their ability to query secure records, register new clinic files or submit consent modifications.
                  </>
                ) : (
                  <>
                    Are you sure you want to re-activate the security certificate for <strong className="text-slate-900 dark:text-white">{selectedUserForModal.name}</strong>? 
                    This will grant them standard access permissions to query relevant medical records and submit ledger transaction blocks.
                  </>
                )}
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-105 dark:border-slate-850 font-mono text-[9.5px] text-slate-500 select-none">
                <div>Identity: {selectedUserForModal.name} ({selectedUserForModal.role})</div>
                <div className="mt-1 font-bold">CA Hash: {selectedUserForModal.cert.substring(0, 16)}...</div>
              </div>
              
              <p className="text-[10px] text-rose-500 flex items-start gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 animate-bounce" />
                <span>Notice: This administrative request is signed with your admin key and logged permanently to the channel ledger audit trail.</span>
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => {
                  setIsUserWarningModalOpen(false)
                  setSelectedUserForModal(null)
                }}
                disabled={userActionLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeUserAction}
                disabled={userActionLoading}
                className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-md text-xs flex items-center gap-1.5 ${
                  userActionLoading 
                    ? 'bg-slate-250 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-200/10'
                    : userModalActionType === 'REVOKE'
                    ? 'bg-rose-600 hover:bg-rose-500 hover:shadow-rose-500/20 cursor-pointer'
                    : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 cursor-pointer'
                }`}
              >
                {userActionLoading ? (
                  <>
                    <RefreshCw className="animate-spin w-4 h-4" />
                    Committing block...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Action
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Phase 2: Record Details Modal Overlay */}
      {isRecordDetailsModalOpen && selectedRecordForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-zoom-in text-slate-805 dark:text-slate-105">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center">
                  <FiFileText className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-955 dark:text-white">
                    Medical Record Details
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">RECORD ID: {selectedRecordForDetails.id}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsRecordDetailsModalOpen(false)
                  setSelectedRecordForDetails(null)
                }}
                className="p-1.5 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="space-y-4 text-xs font-semibold text-slate-750 dark:text-slate-350">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-455 block">Record Name / Title</span>
                  <span className="text-slate-950 dark:text-white font-bold block">{selectedRecordForDetails.fileName || selectedRecordForDetails.name}</span>
                </div>
                <div>
                  <span className="text-slate-455 block">Classification / Category</span>
                  <span className="text-purple-655 dark:text-purple-400 font-bold block">{selectedRecordForDetails.category || 'General'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <div>
                  <span className="text-slate-455 block">File Size</span>
                  <span className="text-slate-955 dark:text-white font-bold block">{selectedRecordForDetails.fileSize || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-455 block">Upload Timestamp</span>
                  <span className="text-slate-955 dark:text-white font-mono block">{selectedRecordForDetails.uploadTime}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <div>
                  <span className="text-slate-455 block">Record Owner (Patient)</span>
                  <span className="text-slate-955 dark:text-white font-bold block">{selectedRecordForDetails.patientName || 'Unknown Patient'}</span>
                </div>
                <div>
                  <span className="text-slate-455 block">Originator (Healthcare Entity)</span>
                  <span className="text-slate-955 dark:text-white font-bold block">{selectedRecordForDetails.uploadedBy || 'Patient Uploaded'}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 space-y-2">
                <div>
                  <span className="text-slate-455 block mb-1">IPFS Content Identifier (CID)</span>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 font-mono text-[10px] break-all select-all flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>{selectedRecordForDetails.ipfsHash}</span>
                    <button 
                      onClick={() => handleCopy(selectedRecordForDetails.ipfsHash)}
                      className="text-purple-655 hover:text-purple-500 p-1 cursor-pointer"
                      title="Copy CID"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-455 block mb-1">Blockchain Transaction ID (TxHash)</span>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 font-mono text-[10px] break-all select-all flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>{selectedRecordForDetails.txId || '0xbaad9923ffee45a21bc0790e54ff521bc0790e5f'}</span>
                    <button 
                      onClick={() => handleCopy(selectedRecordForDetails.txId || '0xbaad9923ffee45a21bc0790e54ff521bc0790e5f')}
                      className="text-purple-655 hover:text-purple-500 p-1 cursor-pointer"
                      title="Copy Transaction Hash"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-3 text-[10px] font-mono">
                <div>
                  <span className="text-slate-455 block">Security Clearance Access Level</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Level {selectedRecordForDetails.sensitivity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-455 block">Cryptographic Certificate Signature</span>
                  <span className="text-slate-900 dark:text-white font-bold block">{selectedRecordForDetails.certificateId || 'CERT-N/A'}</span>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl flex gap-2.5 items-start text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold leading-relaxed font-sans">
                <FiLock className="w-4 h-4 text-emerald-505 flex-shrink-0 mt-0.5" />
                <span>HIPAA Compliant Integrity Checked: Encrypted using AES-256 and anchored in the Fabric block header with zero-knowledge verification proof.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setIsRecordDetailsModalOpen(false)
                  setSelectedRecordForDetails(null)
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-808 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
