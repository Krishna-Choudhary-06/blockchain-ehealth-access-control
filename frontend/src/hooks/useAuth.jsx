/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { hashPassword } from '../services/cryptoService'

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

  const exact = candidates.find((candidate) => {
    const keyData = readJson(`user_keys_${candidate.name}`, {})
    return (
      candidate.email?.toLowerCase() === requestedEmail ||
      keyData.email?.toLowerCase() === requestedEmail ||
      candidate.userId?.toLowerCase() === requestedIdentity ||
      candidate.identityId?.toLowerCase() === requestedIdentity
    )
  })

  return exact || candidates.at(-1) || verifiedProfile
}

function removeLegacyDemoIdentities() {
  const demoNames = new Set(['Dr. Sarah Miller', 'Dr. James Watson', 'Nurse Kelly Smith', 'Patient Alex Carter'])
  const users = readJson('registered_users', [])
  const cleanedUsers = users.filter(user => !demoNames.has(user.name))

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
          const passwordHash = identity?.passwordHash || keyData.passwordHash
          const passwordSalt = identity?.passwordSalt || keyData.passwordSalt

          if (passwordHash && passwordSalt) {
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
