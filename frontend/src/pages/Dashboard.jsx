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


export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const role = user?.role || 'Patient'
  const location = useLocation()
  const hash = location.hash || ''

  // Dynamic state metrics
  const [blocksMined, setBlocksMined] = useState(412)
  const [successReads, setSuccessReads] = useState(128)
  const [pendingReqs, setPendingReqs] = useState(2)
  const [networkUsers, setNetworkUsers] = useState(156)

  // Admin-specific local states
  const [adminUsers, setAdminUsers] = useState(() => {
    const saved = localStorage.getItem('admin_users_list')
    if (saved) return JSON.parse(saved)
    return [
      { id: 'usr-1', name: 'Dr. Sarah Miller', role: 'Doctor', org: 'NIT JAMSHEDPUR', status: 'Active', cert: '0x8823f99011def4b5c6d7e8f9a0b1c2d3e4f5a6b7', email: 'sarah.miller@nit.edu', dateRegistered: '2026-05-12' },
      { id: 'usr-2', name: 'Patient Alex Carter', role: 'Patient', org: 'Self', status: 'Active', cert: '0x1092aa88f912bc0790e54ff521bc0790e5fd45a2', email: 'alex.carter@gmail.com', dateRegistered: '2026-06-01' },
      { id: 'usr-3', name: 'Nurse Kelly Smith', role: 'Nurse', org: 'NIT JAMSHEDPUR', status: 'Active', cert: '0x5532ab99f831efee5532ab99f8313219fb00aa99', email: 'kelly.smith@nit.edu', dateRegistered: '2026-05-18' },
      { id: 'usr-4', name: 'Doctor Amit', role: 'Doctor', org: 'General Ward', status: 'Active', cert: '0x3219fb00e234ac252dbef23f8b0e7a2b0e9f1a23', email: 'dr.amit@hospital.org', dateRegistered: '2026-06-10' },
      { id: 'usr-5', name: 'Unauthorized Intruder', role: 'External', org: 'Malicious Peer', status: 'Revoked', cert: '0xbaad9923ffee45a21bc0790e54ff521bc0790e5f', email: 'intruder@badpeer.net', dateRegistered: '2026-06-15' }
    ]
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

  // Access Requests management states
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

  // Load access requests on mount
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
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newRequestId = 'REQ-' + Math.floor(100000 + Math.random() * 900000)
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')

      const newRequest = {
        id: newRequestId,
        patientId: requestFormData.patientId,
        patientName: requestFormData.patientId === 'PAT-8820' ? 'Patient Alex Carter' : 
                     requestFormData.patientId === 'PAT-3491' ? 'Patient Alice Johnson' : 'Patient Bob Smith',
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

  // Patient actions request from their dashboard list
  const handlePatientAction = async (requestId, nextStatus) => {
    setLoadingActionId(requestId)
    const toastId = toast.loading(`Committing consensus transaction for status: ${nextStatus}...`)

    try {
      await new Promise(resolve => setTimeout(resolve, 1200))

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
                Active Peer Heartbeats
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
                Network CA Identities
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
                Ledger Chain Height
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

        {/* Security threat intelligence feed (threat dashboard) */}
        <div className="bg-rose-500/5 dark:bg-rose-955/10 border border-rose-500/20 dark:border-rose-900/30 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-rose-500/10 dark:border-rose-900/10 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="text-rose-500 dark:text-rose-450 w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Security Threat Intelligence & Alerts</h3>
            </div>
            <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-bold rounded-full animate-pulse uppercase tracking-wide">
              Attacks Intercepted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Suspicious Access Detected',
                text: "Unknown peer signature check requested access to Patient Alex Carter's private ledger directory.",
                meta: 'IPFS Hash: QmXoypizjW3...',
                status: 'WARNING',
                icon: AlertTriangle,
                color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
              },
              {
                title: 'Multiple Failed Attempts',
                text: '3 failed cryptographic verification checking requests detected from peer node NIT-HOSP-3 within 15 seconds.',
                meta: 'Node ID: peer0.nit.com',
                status: 'CRITICAL',
                icon: ShieldAlert,
                color: 'text-rose-600 bg-rose-650/10 border-rose-500/20 animate-pulse'
              },
              {
                title: 'Unauthorized Access Blocked',
                text: 'Nurse Kelly Smith requested access to L0 record PAT-8820. Attribute check denied (ABAC Policy restrict).',
                meta: 'Status Code: 403 (Forbidden)',
                status: 'DENIED',
                icon: AlertTriangle,
                color: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
              }
            ].map((threat, idx) => {
              const TIcon = threat.icon
              return (
                <div 
                  key={idx} 
                  className="bg-white/90 dark:bg-slate-900/90 border border-slate-205 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-rose-500/30 transition-all duration-300"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${threat.color.split(' ')[0]} ${threat.color.split(' ')[1]}`}>
                      <TIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">{threat.title}</h4>
                        <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded font-mono ${
                          threat.status === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                        }`}>{threat.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {threat.text}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block pt-1.5 border-t border-slate-50 dark:border-slate-850 font-bold">
                    {threat.meta}
                  </span>
                </div>
              )
            })}
          </div>
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
              <span className="text-xs font-semibold">No requests submitted yet</span>
              <span className="text-[10px] mt-0.5">Submit a request to query a patient's medical records.</span>
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

          {accessRequests.filter(req => req.status === 'Pending' && req.patientName.toLowerCase().includes(user?.name?.toLowerCase() || 'alex carter')).length === 0 ? (
            <div className="text-center py-10 text-slate-450 dark:text-slate-650 flex flex-col items-center justify-center">
              <svg className="w-10 h-10 mb-2.5 opacity-30 animate-pulse" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs font-semibold">No pending access requests</span>
              <span className="text-[10px] mt-0.5">Your ledger workspace is clean and secure.</span>
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
                    .filter(req => req.status === 'Pending' && req.patientName.toLowerCase().includes(user?.name?.toLowerCase() || 'alex carter'))
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
}

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
                      <span className="font-bold block text-sm text-slate-655 dark:text-slate-400">No identities matched</span>
                      <span className="text-xs text-slate-450 mt-1">Try refining search string or role filter settings.</span>
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
  }

  // 9. ADMIN SYSTEM ACCESS LOGS
  const renderAdminAccessLogs = () => {
    // Search and Status Filtering
    const filteredLogs = accessLogs.filter(log => {
      const matchSearch = log.user.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
                          log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          log.role.toLowerCase().includes(logSearchQuery.toLowerCase())
      
      const matchStatus = logStatusFilter === 'ALL' || log.status.toUpperCase() === logStatusFilter.toUpperCase()
      
      return matchSearch && matchStatus
    })

    // Pagination (5 items per page)
    const itemsPerPage = 5
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1
    const currentPage = Math.min(logListPage, totalPages)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="text-purple-650 dark:text-purple-400 animate-pulse" />
              Fabric Ledger Access Audit Logs
            </h2>
            <p className="text-slate-550 dark:text-slate-400 text-xs mt-1">Complete system-wide access logs committed to CouchDB state database.</p>
          </div>

          {/* Table vs Timeline Sliding Toggle */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-850 flex items-center self-start sm:self-center font-sans text-xs">
            <button
              onClick={() => {
                setLogViewMode('TABLE')
                setLogListPage(1)
              }}
              className={`px-4.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                logViewMode === 'TABLE' 
                  ? 'bg-white dark:bg-slate-900 text-purple-650 dark:text-purple-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
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
                  ? 'bg-white dark:bg-slate-900 text-purple-650 dark:text-purple-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Timeline View
            </button>
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
                  <option value="PAT-8820">PAT-8820 (Patient Alex Carter)</option>
                  <option value="PAT-3491">PAT-3491 (Patient Alice Johnson)</option>
                  <option value="PAT-1092">PAT-1092 (Patient Bob Smith)</option>
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
    </div>
  )
}
