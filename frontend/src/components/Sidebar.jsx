import { useAuth } from '../hooks/useAuth'
import { useLocation, Link } from 'react-router-dom'
import { 
  FiGrid, FiUpload, FiClock, FiFileText, 
  FiActivity, FiUser, FiUsers, FiSettings
} from 'react-icons/fi'

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  // Define menus for each role
  const menus = {
    Patient: [
      { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
      { name: 'Upload File', path: '/upload', icon: FiUpload },
      { name: 'My Records', path: '#my-records', icon: FiFileText },
      { name: 'Who Accessed My Data', path: '#who-accessed', icon: FiClock },
      { name: 'Profile', path: '#profile', icon: FiUser },
      { name: 'Explorer', path: '/explorer', icon: FiActivity }
    ],
    Doctor: [
      { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
      { name: 'Upload File', path: '/upload', icon: FiUpload },
      { name: 'Patient Files', path: '#records', icon: FiFileText },
      { name: 'Access Logs', path: '#logs', icon: FiClock },
      { name: 'Profile', path: '#profile', icon: FiUser },
      { name: 'Explorer', path: '/explorer', icon: FiActivity }
    ],
    Nurse: [
      { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
      { name: 'Upload File', path: '/upload', icon: FiUpload },
      { name: 'Lab Reports', path: '#lab-reports', icon: FiFileText },
      { name: 'Access History', path: '#access-history', icon: FiClock },
      { name: 'Profile', path: '#profile', icon: FiUser },
      { name: 'Explorer', path: '/explorer', icon: FiActivity }
    ],
    Admin: [
      { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
      { name: 'Upload File', path: '/upload', icon: FiUpload },
      { name: 'Users', path: '#users', icon: FiUsers },
      { name: 'Access Logs', path: '#access-logs', icon: FiClock },
      { name: 'Blockchain Explorer', path: '/explorer', icon: FiActivity },
      { name: 'Performance Monitor', path: '/performance', icon: FiActivity },
      { name: 'Settings', path: '#settings', icon: FiSettings }
    ]
  }

  const role = user?.role || 'Patient'
  const activeMenu = menus[role] || menus.Patient
  const initials = (user?.name || 'Guest')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 flex flex-col justify-between h-screen sticky top-0 transition-colors duration-300">
      <div className="p-6">
        {/* Brand/Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">eHealth Portal</h2>
            <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-semibold tracking-widest block">SECURED LEDGER</span>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="space-y-1 relative">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3 px-3">
            {role} Workspace
          </span>
          {activeMenu.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path.startsWith('#') && location.hash === item.path)
            const isHash = item.path.startsWith('#')
            
            const linkClasses = `flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
              isActive 
                ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 font-bold' 
                : 'text-slate-650 hover:bg-slate-50 dark:text-slate-450 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-white'
            }`

            const iconElement = <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-[1.08] ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-405 dark:text-slate-500'}`} />
            const activeIndicator = isActive && (
              <span className="w-1 h-5 rounded-full bg-purple-600 dark:bg-purple-400 absolute left-0 top-1/2 transform -translate-y-1/2"></span>
            )

            return isHash ? (
              <a
                key={item.name}
                href={item.path}
                className={linkClasses}
              >
                {iconElement}
                <span>{item.name}</span>
                {activeIndicator}
              </a>
            ) : (
              <Link
                key={item.name}
                to={item.path}
                className={linkClasses}
              >
                {iconElement}
                <span>{item.name}</span>
                {activeIndicator}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Info footer in Sidebar */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-purple-600/10 text-purple-600 dark:text-purple-300 flex items-center justify-center text-[11px] font-black">
            {initials}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{user?.name || 'Guest User'}</h4>
            <span className="text-[9px] font-medium text-slate-450 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-md mt-0.5 inline-block uppercase tracking-wider font-mono">
              {role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
