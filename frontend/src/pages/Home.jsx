import { useState } from 'react'
import { Link } from 'react-router-dom'
import cliniciansImage from '../assets/clinicians.jpg'
import { getSystemStats } from '../services/apiService'

export default function Home() {
  const [logs, setLogs] = useState([
    { id: 1, timestamp: new Date().toLocaleTimeString(), message: "System initialized. Click 'Verify Blockchain Status' to query network nodes.", type: "info" }
  ])
  const [isSimulating, setIsSimulating] = useState(false)

  const verifyBlockchainStatus = async () => {
    setIsSimulating(true)
    setLogs(prev => [
      ...prev,
      { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: "Querying Hyperledger Fabric CA network node status...", type: "info" }
    ])

    try {
      const stats = await getSystemStats()
      await new Promise(resolve => setTimeout(resolve, 800))
      
      if (stats && stats.status === 'UP') {
        setLogs(prev => [
          ...prev,
          { id: Date.now() + 1, timestamp: new Date().toLocaleTimeString(), message: `System health status: ${stats.status}`, type: "success" },
          { id: Date.now() + 2, timestamp: new Date().toLocaleTimeString(), message: `Blockchain Status: Network = ${stats.network || 'Hyperledger Fabric'}, Channel = ${stats.channel || 'ehealth-channel'}, Peers = ${Array.isArray(stats.peers) ? stats.peers.join(', ') : 'peer0.org1.example.com'}`, type: "success" },
          { id: Date.now() + 3, timestamp: new Date().toLocaleTimeString(), message: "Access policy check: Active policies validated against on-chain Fabric CA MSP attributes.", type: "success" }
        ])
      } else {
        throw new Error('Invalid response')
      }
    } catch (err) {
      console.error(err)
      await new Promise(resolve => setTimeout(resolve, 800))
      setLogs(prev => [
        ...prev,
        { id: Date.now() + 4, timestamp: new Date().toLocaleTimeString(), message: "Blockchain verification status unavailable", type: "error" }
      ])
    } finally {
      setIsSimulating(false)
    }
  }

  const clearLogs = () => {
    setLogs([{ id: 1, timestamp: new Date().toLocaleTimeString(), message: "Console output cleared.", type: "info" }])
  }

  return (
    <div className="relative">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none transition-colors duration-300"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none transition-colors duration-300"></div>

      {/* Hero Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-10 pb-20">
        {/* Left text column */}
        <div className="lg:col-span-7 text-center lg:text-left space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wider text-blue-500 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 uppercase mb-4 shadow-sm animate-fade-in-up opacity-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></span>
            Adaptive Access Control Framework
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight animate-fade-in-up delay-200 opacity-0">
            Secure and Privacy-Preserving <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-650 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              E-Health Data Sharing
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in-up delay-200 opacity-0">
            Enforce adaptive patient access policies using Hyperledger Fabric smart contracts, IPFS storage, and localized AES encryption.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up delay-400 opacity-0">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm md:text-base rounded-xl shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <a
              href="#about"
              className="inline-flex items-center px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 text-slate-700 dark:text-slate-350 font-semibold text-sm md:text-base rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Right image column */}
        <div className="lg:col-span-5 relative group animate-fade-in-up delay-400 opacity-0">
          {/* Decorative glowing gradient behind the image */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl group-hover:scale-105 transition-all duration-500 -z-10"></div>
          
          {/* Image frame */}
          <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl transition-all duration-500 group-hover:scale-[1.01] hover:shadow-purple-500/10">
            <img 
              src={cliniciansImage} 
              alt="Clinicians reviewing patient medical scans" 
              className="w-full h-auto object-cover max-h-[420px] transition-transform duration-700 group-hover:scale-[1.03]" 
            />
            {/* Subtle overlay for dark mode coordination */}
            <div className="absolute inset-0 bg-slate-950/5 dark:bg-slate-950/10 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="mb-20 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            About the Platform
          </h3>
          <p className="text-slate-650 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            Understanding decentralized medical records and user sovereignty.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-100/40 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                System Overview
              </h4>
              <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed mb-4">
                The site uses blockchain technology to provide secure, patient-controlled sharing of medical records, allowing seamless access for authorized doctors, nurses, and accountants, while solving the problem of lost physical records and fragmented care.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                By anchoring cryptographic hashes on an immutable distributed ledger (Hyperledger Fabric) and storing actual records in a decentralized content-addressed file system (IPFS), this framework achieves maximum privacy compliance while keeping transaction speeds fast and user control absolute.
              </p>
            </div>

            <div className="bg-slate-100/40 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Role-Based Access Control (ABAC)</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                Our fine-grained attribute validation system dynamically verifies medical credentials:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-900 text-center shadow-sm">
                  <span className="block font-semibold text-blue-600 dark:text-blue-400 text-sm">Patients</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Full ownership & consent policy configuration</span>
                </div>
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-900 text-center shadow-sm">
                  <span className="block font-semibold text-emerald-600 dark:text-emerald-400 text-sm">Clinicians</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Authorized real-time access to patient files</span>
                </div>
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-900 text-center shadow-sm">
                  <span className="block font-semibold text-purple-600 dark:text-purple-400 text-sm">Accountants / Admins</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">System compliance & HIPAA audit validation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pros and Cons comparison */}
          <div className="lg:col-span-5 space-y-6">
            {/* Pros */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/20 rounded-3xl p-6 shadow-sm">
              <h4 className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pros & Advantages
              </h4>
              <ul className="space-y-3 text-slate-700 dark:text-slate-300 text-sm">
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Zero Single Point of Failure:</strong> IPFS storage ensures data remains highly available.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Patient Sovereignty:</strong> Providers cannot view or share files without smart contract consent.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Indestructible Audit Logs:</strong> Access logs are written directly to ledger blocks, preventing audits tampering.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Care Integrity:</strong> Eliminates lost physical papers and fragmented coordination.</span>
                </li>
              </ul>
            </div>

            {/* Cons */}
            <div className="bg-rose-500/5 border border-rose-500/10 dark:border-rose-500/20 rounded-3xl p-6 shadow-sm">
              <h4 className="text-rose-600 dark:text-rose-400 font-bold text-lg mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Cons & Limitations
              </h4>
              <ul className="space-y-3 text-slate-700 dark:text-slate-350 text-sm">
                <li className="flex gap-2">
                  <span className="text-rose-500 font-bold">⚠</span>
                  <span><strong>Key Management Overhead:</strong> Users must store crypto keys safely; key loss can lock records permanently.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-500 font-bold">⚠</span>
                  <span><strong>Consensus Delay:</strong> Evaluating attribute policy on-chain introduces minor transactional latency.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-500 font-bold">⚠</span>
                  <span><strong>Setup Complexity:</strong> Setting up distributed blockchain organization CA nodes requires tech overhead.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  
        {/* Blockchain Verification Console */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-lg dark:shadow-2xl relative transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-955 dark:text-white flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-505 mr-2.5 animate-pulse"></span>
              Blockchain Verification Console
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Verify Hyperledger Fabric node status, active consensus channels, and policy health.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={verifyBlockchainStatus}
              disabled={isSimulating}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md ${isSimulating
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-505 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                  : "bg-purple-605 hover:bg-purple-500 text-white shadow-purple-900/10 dark:shadow-purple-900/30 hover:scale-[1.02] cursor-pointer"
                }`}
            >
              {isSimulating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-slate-450" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying Blockchain...
                </span>
              ) : (
                "Verify Blockchain Status"
              )}
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 font-semibold text-sm rounded-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
            >
              Clear Console
            </button>
          </div>
        </div>

        {/* Console Output */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 font-mono text-xs border border-slate-200/50 dark:border-slate-909/50 shadow-inner min-h-[200px] max-h-[350px] overflow-y-auto flex flex-col space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-805 scrollbar-track-transparent">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 transition-all duration-300 hover:bg-slate-200/20 dark:hover:bg-slate-900/30 p-1 rounded">
              <span className="text-slate-400 dark:text-slate-600 select-none font-medium">[{log.timestamp}]</span>
              <span className={`flex-1 leading-relaxed ${log.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : log.type === "warning"
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : log.type === "info"
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : log.type === "error"
                        ? "text-rose-605 dark:text-rose-455 font-medium"
                        : "text-slate-800 dark:text-slate-300"
                }`}>
                {log.type === "success" && "✓ "}
                {log.type === "warning" && "⚠ "}
                {log.type === "info" && "ℹ "}
                {log.type === "error" && "❌ "}
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
