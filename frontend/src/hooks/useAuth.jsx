/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { initializeMockUsersKeys } from '../services/cryptoService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth_user')
    return saved ? JSON.parse(saved) : null
  })

  // Initialize keys for default mock users
  useEffect(() => {
    initializeMockUsersKeys()
  }, [])


  const login = async (email, password, role) => {
    // Simulate API request delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
        let matchedUser = null
        
        // Find matching registered user
        for (const u of registeredUsers) {
          const keysData = JSON.parse(localStorage.getItem(`user_keys_${u.name}`) || '{}')
          const userEmail = keysData.email || `${u.name.toLowerCase().replace(/\s+/g, '.')}@health.com`
          if (
            u.userId?.toLowerCase() === email.toLowerCase() ||
            u.name.toLowerCase() === email.toLowerCase() ||
            userEmail.toLowerCase() === email.toLowerCase()
          ) {
            matchedUser = { ...u, email: userEmail, ...keysData }
            break
          }
        }

        // If no match by email/id, fallback to search by role
        if (!matchedUser) {
          matchedUser = registeredUsers.find(u => u.role === role)
        }

        const name = matchedUser ? matchedUser.name : (
          role === 'Admin' 
            ? 'System Administrator' 
            : role === 'Doctor' 
            ? 'Dr. Sarah Miller' 
            : role === 'Nurse'
            ? 'Nurse Kelly Smith'
            : 'Patient Alex Carter'
        )

        const organization = matchedUser ? matchedUser.organization : (
          role === 'Admin' 
            ? 'NIT JAMSHEDPUR' 
            : role === 'Doctor' 
            ? 'Cardiology Dept' 
            : role === 'Nurse'
            ? 'General Ward'
            : 'Self'
        )

        const loggedInUser = {
          name,
          email: matchedUser?.email || email,
          role,
          userId: matchedUser?.userId || (
            role === 'Admin' ? 'UID-999999' :
            role === 'Doctor' ? 'UID-284918' :
            role === 'Nurse' ? 'UID-553219' : 'UID-109284'
          ),
          organization,
          avatar: role === 'Admin' 
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'
            : role === 'Doctor'
            ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&h=100&q=80'
            : role === 'Nurse'
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
          publicKey: matchedUser?.publicKey || ''
        }
        setUser(loggedInUser)
        localStorage.setItem('auth_user', JSON.stringify(loggedInUser))
        resolve(loggedInUser)
      }, 1000)
    })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedFields }
      localStorage.setItem('auth_user', JSON.stringify(newUser))
      return newUser
    })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      login: async () => ({}),
      logout: () => {},
      updateUser: () => {}
    }
  }
  return context
}
