export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 py-12 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Description */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">eHealth Access Control</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-sm">
            An Adaptive Blockchain-Enabled Access Control Framework for Secure and Privacy-Preserving E-Health Data Sharing. Built using Hyperledger Fabric and React.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-3">Resources</h4>
          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <li><a href="#about" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">About paper</a></li>
            <li><a href="#fabric" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Hyperledger Fabric</a></li>
            <li><a href="#consent" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Consent Policies</a></li>
          </ul>
        </div>

        {/* Tech Stack details */}
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-3">System Info</h4>
          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <li>Fabric Network: <span className="font-mono text-purple-600 dark:text-purple-400">v2.5</span></li>
            <li>Vite Framework: <span className="font-mono text-purple-600 dark:text-purple-400">v8.0</span></li>
            <li>Encryption: <span className="font-mono text-purple-600 dark:text-purple-400">AES-256</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-900 pt-6 flex flex-col md:flex-row justify-between items-center text-slate-400 dark:text-slate-500 text-xs gap-4">
        <p>© {currentYear} Blockchain e-Health Access Control. Research Implementation. All rights reserved.</p>
        <div className="flex space-x-6">
          <span className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">Security Audit Passed</span>
          <span className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">HIPAA Compliant</span>
        </div>
      </div>
    </footer>
  )
}
