import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { isAuthenticated } = useAuth()

  const platformLinks = [
    { name: 'About', to: '/#about' }
  ]

  const resourceLinks = [
    { name: 'Home Portal', to: '/' },
    { name: 'User Registration', to: '/register' },
    ...(isAuthenticated 
      ? [{ name: 'Secure Dashboard', to: '/dashboard' }]
      : [{ name: 'Sign In', to: '/login' }]
    )
  ]

  const handleLinkClick = (e, to) => {
    if (to.startsWith('/#')) {
      const id = to.split('#')[1]
      if (window.location.pathname === '/') {
        e.preventDefault()
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  return (
    <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 py-16 px-6 sm:px-12 md:px-16 transition-colors duration-300 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/5 dark:bg-purple-600/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-16 mb-12">
        {/* Brand Description - occupies 6/12 width on desktop */}
        <div className="sm:col-span-2 lg:col-span-6 space-y-5">
          <Link to="/" className="flex items-center space-x-3 group inline-block">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/10 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
              eHealth Access Control
            </span>
          </Link>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-md">
            An Adaptive Distributed Framework securing clinical information exchange. Built using Hyperledger Fabric 2.5 and React to ensure immutable HIPAA-compliant electronic medical records.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-3.5 pt-2">
            <a 
              href="https://github.com/krishna-choudhary-06" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 w-10 bg-white dark:bg-slate-900 hover:bg-purple-600/5 dark:hover:bg-purple-500/10 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-purple-600 dark:text-slate-500 dark:hover:text-purple-400 transition-all duration-300 hover:scale-105 transform shadow-sm"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
            </a>
            <a 
              href="https://x.com/krishna_choudhary" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 w-10 bg-white dark:bg-slate-900 hover:bg-purple-600/5 dark:hover:bg-purple-500/10 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-purple-600 dark:text-slate-505 dark:hover:text-purple-400 transition-all duration-300 hover:scale-105 transform shadow-sm"
              aria-label="X"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a 
              href="https://linkedin.com/in/krishna-choudhary-06" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 w-10 bg-white dark:bg-slate-900 hover:bg-purple-600/5 dark:hover:bg-purple-500/10 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-purple-600 dark:text-slate-500 dark:hover:text-purple-400 transition-all duration-300 hover:scale-105 transform shadow-sm"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Resources Section - occupies 3/12 width */}
        <div className="sm:col-span-1 lg:col-span-3 space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-slate-200 text-sm uppercase tracking-wider">Resources</h4>
          <ul className="space-y-3.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {resourceLinks.map((link) => (
              <li key={link.name}>
                <Link 
                  to={link.to} 
                  onClick={(e) => handleLinkClick(e, link.to)}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 hover:translate-x-1 transform inline-block"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Platform Section - occupies 3/12 width */}
        <div className="sm:col-span-1 lg:col-span-3 space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-slate-200 text-sm uppercase tracking-wider">Platform</h4>
          <ul className="space-y-3.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {platformLinks.map((link) => (
              <li key={link.name}>
                <Link 
                  to={link.to} 
                  onClick={(e) => handleLinkClick(e, link.to)}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 hover:translate-x-1 transform inline-block"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Bottom bar */}
      <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-900 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 dark:text-slate-400 gap-6">
        <p className="text-center md:text-left">
          © {currentYear} Blockchain e-Health Access Control. Research Implementation. All rights reserved.
        </p>
        <div className="flex space-x-4">
          <span className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:scale-105 transition-transform duration-300 cursor-default shadow-sm">
            Security Audit Passed
          </span>
          <span className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:scale-105 transition-transform duration-300 cursor-default shadow-sm">
            HIPAA Compliant
          </span>
        </div>
      </div>
    </footer>
  )
}
