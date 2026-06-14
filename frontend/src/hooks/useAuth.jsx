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
        const loggedInUser = {
          name: role === 'Admin' 
            ? 'System Administrator' 
            : role === 'Doctor' 
            ? 'Dr. Sarah Miller' 
            : role === 'Nurse'
            ? 'Nurse Kelly Smith'
            : 'Patient Alex Carter',
          email,
          role,
          organization: role === 'Admin' 
            ? 'NIT JAMSHEDPUR' 
            : role === 'Doctor' 
            ? 'Cardiology Dept' 
            : role === 'Nurse'
            ? 'General Ward'
            : 'Self',
          avatar: role === 'Admin' 
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'
            : role === 'Doctor'
            ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&h=100&q=80'
            : role === 'Nurse'
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80'
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
