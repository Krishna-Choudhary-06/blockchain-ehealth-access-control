import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import AuthenticationWizard from '../components/AuthenticationWizard'
import AuthSelection from '../components/AuthSelection'
import AdminLoginCard from '../components/AdminLoginCard'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [viewState, setViewState] = useState('selection') // 'selection', 'user_login', 'admin_login'

  const handleAdminLoginSubmit = async (credentials) => {
    const toastId = toast.loading('Verifying admin clearance...')
    try {
      await login(credentials.username, credentials.password, 'Admin')
      toast.success('Welcome back, System Administrator!', { id: toastId })
      navigate('/dashboard')
    } catch (error) {
      toast.error('Admin verification failed.', { id: toastId })
    }
  }

  return (
    <div className="relative pt-6 min-h-[calc(100vh-140px)]">
      {/* Background Gradients */}
      <div className="absolute top-10 left-1/3 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        {viewState === 'selection' && (
          <AuthSelection 
            onSelectUser={() => setViewState('user_login')}
            onSelectAdmin={() => setViewState('admin_login')}
          />
        )}

        {viewState === 'user_login' && (
          <AuthLayout>
            <AuthenticationWizard onBackToSelection={() => setViewState('selection')} />
          </AuthLayout>
        )}

        {viewState === 'admin_login' && (
          <AuthLayout>
            <AdminLoginCard 
              onSubmit={handleAdminLoginSubmit}
              onBack={() => setViewState('selection')}
            />
          </AuthLayout>
        )}
      </div>
    </div>
  )
}
