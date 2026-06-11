import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiLayers, FiLoader } from 'react-icons/fi'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'Patient', // default role
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)

  const roles = ['Patient', 'Doctor', 'Admin']

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    toast.success('Password reset link sent to your registered email.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email.trim()) {
      toast.error('Please enter your email address.')
      return
    }
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (!formData.password) {
      toast.error('Please enter your password.')
      return
    }

    setLoading(true)
    try {
      const loggedInUser = await login(formData.email, formData.password, formData.role)
      toast.success(`Welcome back, ${loggedInUser.name}!`)
      navigate('/dashboard')
    } catch (error) {
      toast.error('Login failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Background Glow */}
      <div className="absolute top-10 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-md mx-auto bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Sign In</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">Access your secure eHealth medical record management dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <FiMail className="w-4.5 h-4.5" />
              </div>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. user@hospital.com"
                disabled={loading}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <FiLock className="w-4.5 h-4.5" />
              </div>
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {/* Simulated Role Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="role" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Access Role (Simulation)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <FiLayers className="w-4.5 h-4.5" />
              </div>
              <select
                name="role"
                id="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:border-transparent transition-all text-sm disabled:opacity-50 cursor-pointer appearance-none"
              >
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Remember Me & Forgot Password Links */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 text-purple-600 border-slate-300 dark:border-slate-850 rounded focus:ring-purple-500 bg-slate-50 dark:bg-slate-950"
              />
              <span>Remember me</span>
            </label>
            <button
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-500 font-semibold focus:outline-none cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 shadow-md ${
              loading
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 flex items-center justify-center space-x-2"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/10 dark:shadow-purple-900/30 hover:scale-[1.01] cursor-pointer"
            }`}
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              "Login to Dashboard"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
