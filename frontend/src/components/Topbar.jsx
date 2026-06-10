import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import toast from 'react-hot-toast'
import { FiSun, FiMoon, FiBell, FiLogOut, FiChevronDown, FiUser } from 'react-icons/fi'

export default function Topbar() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const notifications = [
    { id: 1, text: 'Consensus reached for block #592', time: '5m ago', unread: true },
    { id: 2, text: 'Access request authorized for Dr. Sarah', time: '12m ago', unread: true },
    { id: 3, text: 'Ledger backup completed successfully', time: '1h ago', unread: false }
  ]

  const handleLogout = () => {
    logout()
    toast.success('Successfully logged out.')
    navigate('/login')
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 px-6 flex items-center justify-between transition-colors duration-300 relative z-30">
      {/* Dynamic Greetings */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Welcome back, <span className="text-purple-600 dark:text-purple-400 font-bold">{user?.name || 'Guest'}</span>
        </h3>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Org: {user?.organization || 'Hospital Branch'}</p>
      </div>

      {/* Action panel */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-450 transition-colors cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDark ? <FiSun className="w-4.5 h-4.5" /> : <FiMoon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowProfileMenu(false)
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-450 transition-colors cursor-pointer relative"
          >
            <FiBell className="w-4.5 h-4.5" />
            {notifications.some(n => n.unread) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 shadow-xl rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Notifications</span>
                <button 
                  onClick={() => toast.success('All marked as read')}
                  className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="space-y-2.5">
                {notifications.map(n => (
                  <div key={n.id} className="flex justify-between items-start text-[11px] hover:bg-slate-50 dark:hover:bg-slate-950 p-1.5 rounded-lg transition-colors cursor-pointer">
                    <div className="space-y-0.5 max-w-[200px]">
                      <p className={`leading-snug ${n.unread ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {n.text}
                      </p>
                      <span className="text-[9px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                    {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1"></span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu)
              setShowNotifications(false)
            }}
            className="flex items-center space-x-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/40 px-2 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <img 
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'} 
              alt={user?.name} 
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 object-cover hover:scale-105 transition-transform duration-200"
            />
            <span className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{user?.name || 'Guest'}</span>
              <span className="text-[9px] font-medium text-slate-450 dark:text-slate-500 capitalize">{user?.role || 'Guest'}</span>
            </span>
            <FiChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl py-1.5 animate-fadeIn">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate">{user?.email}</p>
              </div>
              
              <a 
                href="#profile" 
                onClick={() => { setShowProfileMenu(false); toast.success('Profile settings loading...') }}
                className="flex items-center space-x-2.5 px-3.5 py-2 text-xs text-slate-650 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-950 transition-colors"
              >
                <FiUser className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </a>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left cursor-pointer"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
