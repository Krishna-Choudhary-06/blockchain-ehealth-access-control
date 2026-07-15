/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { generateBGWPrivateKey, registerUserProfile } from '../services/apiService'
import { hashPassword } from '../services/cryptoService'
import DEMO_PROFILE_OVERRIDES from './demoProfileOverrides'

const AuthContext = createContext()

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function resolveRegisteredIdentity(email, role, verifiedProfile = {}) {
  const users = readJson('registered_users', [])
  const requestedEmail = (email || verifiedProfile.email || '').trim().toLowerCase()
  const requestedRole = (role || verifiedProfile.role || '').trim().toLowerCase()
  const requestedIdentity = (verifiedProfile.identityId || verifiedProfile.userId || '').trim().toLowerCase()

  const matchesRole = (candidate) => !requestedRole || candidate.role?.toLowerCase() === requestedRole
  const candidates = users.filter(matchesRole)

  const exactMatches = candidates.filter((candidate) => {
    const keyData = readJson(`user_keys_${candidate.name}`, {})
    return (
      candidate.email?.toLowerCase() === requestedEmail ||
      keyData.email?.toLowerCase() === requestedEmail ||
      candidate.userId?.toLowerCase() === requestedIdentity ||
      candidate.identityId?.toLowerCase() === requestedIdentity
    )
  })

  const exact = exactMatches.at(-1)

  const resolved = exact || candidates.at(-1) || verifiedProfile
  const demoOverrideKey = String(resolved?.name || resolved?.userId || requestedIdentity || requestedEmail || '').trim().toLowerCase()
  const override = DEMO_PROFILE_OVERRIDES[demoOverrideKey] || null

  return override ? { ...resolved, ...override } : resolved
}

function removeLegacyDemoIdentities() {
  const demoNames = new Set([
    'Dr. Sarah Miller',
    'Dr. James Watson',
    'Nurse Kelly Smith',
    'Patient Alex Carter',
    'patient1',
    'patient2',
    'patient3',
    'patient4',
    'doctor1',
    'doctor2',
    'nurse1',
    'admin1'
  ])
  const users = readJson('registered_users', [])
  const cleanedUsers = users.filter(user => {
    const name = String(user.name || '').toLowerCase()
    const userId = String(user.userId || user.identityId || '').toLowerCase()
    return !demoNames.has(name) && !demoNames.has(userId)
  })

  if (cleanedUsers.length !== users.length) {
    localStorage.setItem('registered_users', JSON.stringify(cleanedUsers))
  }

  demoNames.forEach(name => localStorage.removeItem(`user_keys_${name}`))
  localStorage.removeItem('mock_keys_initialized')

  const activeUser = readJson('auth_user', null)
  if (activeUser?.name && demoNames.has(activeUser.name)) {
    localStorage.removeItem('auth_user')
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    removeLegacyDemoIdentities()
    const saved = localStorage.getItem('auth_user')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    removeLegacyDemoIdentities()
  }, [])

  const login = async (email, password, role, verifiedProfile = {}) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Promise.resolve().then(async () => {
          const identity = resolveRegisteredIdentity(email, role, verifiedProfile)
          const keyData = identity?.name ? readJson(`user_keys_${identity.name}`, {}) : {}
          const normalizedRecipientId = identity?.bgwRecipientId || keyData.bgwRecipientId || ''
          const needsRecipientSync =
            normalizedRecipientId &&
            String(keyData.bgwRecipientId || '') !== String(normalizedRecipientId)

          if (needsRecipientSync && keyData.bgwPublicKey) {
            try {
              const bgwPrivateKeyResult = await generateBGWPrivateKey(
                normalizedRecipientId,
                undefined,
                keyData.bgwPublicKey
              )
              keyData.bgwRecipientId = normalizedRecipientId
              keyData.bgwPrivateKey = bgwPrivateKeyResult.data || keyData.bgwPrivateKey || ''
              localStorage.setItem(`user_keys_${identity.name}`, JSON.stringify({
                ...keyData,
                bgwRecipientId: normalizedRecipientId,
                bgwPrivateKey: keyData.bgwPrivateKey
              }))
            } catch (error) {
              console.warn('BGW key resync failed during login:', error)
            }
          }

          if (identity?.userId && identity?.role && normalizedRecipientId) {
            try {
              await registerUserProfile({
                userId: identity.userId,
                role: identity.role,
                privacyLevel: identity.privacyLevel || keyData.privacyLevel || DEMO_PROFILE_OVERRIDES[(identity?.name || identity?.userId || '').toLowerCase()]?.privacyLevel || '',
                bgwRecipientId: normalizedRecipientId,
                organization: identity.organization || keyData.organization || ''
              })
            } catch (profileSyncError) {
              console.warn('User profile sync failed during login:', profileSyncError)
            }
          }

          const passwordHash = identity?.passwordHash || keyData.passwordHash
          const passwordSalt = identity?.passwordSalt || keyData.passwordSalt

          const resolvedRole = identity?.role || role || ''
          const isPatientBypass = resolvedRole.toLowerCase() === 'patient'

          if (!isPatientBypass && passwordHash && passwordSalt) {
            const enteredHash = await hashPassword(password || '', passwordSalt)
            if (enteredHash !== passwordHash) {
              throw new Error('Incorrect password for this identity.')
            }
          }

          const loggedInUser = {
            name: identity?.name || email || 'Registered User',
            email: identity?.email || keyData.email || email,
            role: identity?.role || role,
            organization: identity?.organization || keyData.organization || '',
            identityId: identity?.userId || identity?.identityId || keyData.userId || '',
            privacyLevel: identity?.privacyLevel || keyData.privacyLevel || DEMO_PROFILE_OVERRIDES[(identity?.name || identity?.userId || '').toLowerCase()]?.privacyLevel || '',
            bgwRecipientId: normalizedRecipientId || DEMO_PROFILE_OVERRIDES[(identity?.name || identity?.userId || '').toLowerCase()]?.bgwRecipientId || '',
            avatar: identity?.avatar || ''
          }

          setUser(loggedInUser)
          localStorage.setItem('auth_user', JSON.stringify(loggedInUser))
          resolve(loggedInUser)
        }).catch(reject)
      }, 500)
    })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
