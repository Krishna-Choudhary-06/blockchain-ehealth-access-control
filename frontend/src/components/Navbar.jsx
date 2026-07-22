import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../hooks/useAuth'
import { Link, useLocation } from 'react-router-dom'
import { FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi'

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { name: 'Home Portal', to: '/' },
    { name: 'About', to: '/#about' },
    { name: 'User Registration', to: '/register' },
    ...(isAuthenticated 
      ? [{ name: 'Secure Dashboard', to: '/dashboard' }]
      : [{ name: 'Sign In', to: '/login' }]
    )
  ]

  const handleLinkClick = (e, to) => {
    if (to.startsWith('/#')) {
      const id = to.split('#')[1]
      if (location.pathname === '/') {
        e.preventDefault()
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  return (
    <nav className="border-b border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white transform group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-350">
                eHealth Access Control
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">BLOCKCHAIN SECURED</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.name}
                  to={link.to}
                  onClick={(e) => handleLinkClick(e, link.to)}
                  className={`text-sm font-semibold tracking-wide transition-all duration-300 relative py-2 px-3.5 rounded-xl ${
                    isActive 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-500/5 dark:bg-purple-400/5 font-bold shadow-sm' 
                      : 'text-slate-650 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          {/* Controls */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-all duration-200 cursor-pointer hover:rotate-12 transform"
              aria-label="Toggle Theme"
            >
              {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <span className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Consensus Active</span>
            </span>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-200 dark:border-slate-900 space-y-2 pb-2 transition-all duration-300 animate-fadeIn">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.name}
                  to={link.to}
                  onClick={(e) => {
                    setIsOpen(false)
                    handleLinkClick(e, link.to)
                  }}
                  className={`block text-sm font-semibold py-2 px-3 rounded-lg transition-all ${
                    isActive 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-500/5 dark:bg-purple-400/5' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-900/20'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-900 mt-2">
              <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">Ledger Node status:</span>
              <span className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Active</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
