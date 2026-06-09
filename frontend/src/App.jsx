import { useState } from 'react'

function App() {
  const [logs, setLogs] = useState([
    { id: 1, timestamp: new Date().toLocaleTimeString(), message: "System initialized successfully.", type: "success" }
  ])
  const [isSimulating, setIsSimulating] = useState(false)

  const simulatePolicyCheck = () => {
    setIsSimulating(true)
    
    // Step 1: Request access
    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: "Received access request from Dr. Sarah Miller (Role: Cardiologist) for Patient ID: PAT-8820.", type: "info" }
      ])
    }, 800)

    // Step 2: Policy Evaluation
    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        { id: Date.now() + 1, timestamp: new Date().toLocaleTimeString(), message: "Evaluating consensus policy: (Role = 'Cardiologist' AND Dept = 'Cardiology' AND Consent = 'Granted').", type: "warning" }
      ])
    }, 1800)

    // Step 3: Blockchain Transaction Successful
    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        { id: Date.now() + 2, timestamp: new Date().toLocaleTimeString(), message: "Access GRANTED. Transaction committed to Hyperledger Fabric Ledger (Block #412, Hash: 0x8f2d...e9a1).", type: "success" }
      ])
      setIsSimulating(false)
    }, 3000)
  }

  const clearLogs = () => {
    setLogs([{ id: 1, timestamp: new Date().toLocaleTimeString(), message: "System logs cleared.", type: "info" }])
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden relative">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                eHealth Access Control
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">BLOCKCHAIN SECURED</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Tailwind Active v4.0</span>
            </span>
            <span className="flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              <span>React + Vite Live</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {/* Hero Info */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            Adaptive Blockchain Access Control
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Secure, privacy-preserving e-Health data sharing platform built on Hyperledger Fabric 2.5 and React. Currently initializing Phase 1: Project Setup & Module Scaffold.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all duration-300"></div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">User Registration</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Cryptographic keys and attributes mapped to identities (Patient, Doctor, Admin) for decentralized access rights validation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Policy Evaluation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Smart contracts dynamically matching user attributes against patient-defined access consent policies before releasing files.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Immutable Audit Ledger</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              All data read and write requests are permanently logged in blockchain ledgers to ensure non-repudiation and strict compliance.
            </p>
          </div>
        </div>

        {/* Live Simulation Console */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-800 pb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2.5 animate-pulse"></span>
                Access Control Policy Simulator
              </h3>
              <p className="text-slate-400 text-xs mt-1">Test attribute-based access policy evaluation using local state updates.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={simulatePolicyCheck}
                disabled={isSimulating}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md ${
                  isSimulating 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30 hover:scale-[1.02] cursor-pointer"
                }`}
              >
                {isSimulating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Evaluating Smart Contract...
                  </span>
                ) : (
                  "Simulate Policy Check"
                )}
              </button>
              <button 
                onClick={clearLogs}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-all duration-300 border border-slate-700 hover:border-slate-600 cursor-pointer"
              >
                Clear Console
              </button>
            </div>
          </div>

          {/* Console Output */}
          <div className="bg-slate-950 rounded-2xl p-5 font-mono text-xs border border-slate-900/50 shadow-inner min-h-[200px] max-h-[350px] overflow-y-auto flex flex-col space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 transition-all duration-300 hover:bg-slate-900/30 p-1 rounded">
                <span className="text-slate-600 select-none font-medium">[{log.timestamp}]</span>
                <span className={`flex-1 leading-relaxed ${
                  log.type === "success" 
                    ? "text-emerald-400" 
                    : log.type === "warning" 
                      ? "text-amber-400" 
                      : log.type === "info" 
                        ? "text-blue-400" 
                        : "text-slate-300"
                }`}>
                  {log.type === "success" && "✓ "}
                  {log.type === "warning" && "⚠ "}
                  {log.type === "info" && "ℹ "}
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 mt-16 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs gap-4">
          <p>© {new Date().getFullYear()} Blockchain e-Health Access Control. Research Implementation.</p>
          <div className="flex space-x-6">
            <span className="hover:text-slate-400 transition-colors">Hyperledger Fabric 2.5</span>
            <span className="hover:text-slate-400 transition-colors">React 19</span>
            <span className="hover:text-slate-400 transition-colors">Vite 8</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

