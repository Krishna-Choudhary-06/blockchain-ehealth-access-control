import { useState } from 'react'
import { Link } from 'react-router-dom'
import cliniciansImage from '../assets/clinicians.jpg'

export default function Home() {
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
              href="#features"
              className="inline-flex items-center px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 text-slate-700 dark:text-slate-300 font-semibold text-sm md:text-base rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
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
                The site uses blockchain technology to provide secure, patient-controlled sharing of medical records, allowing seamless access for authorized doctors, nurses, and administrative staff, while solving the problem of lost physical records and fragmented care.
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
                  <span className="block font-semibold text-purple-600 dark:text-purple-400 text-sm">Staff / Admins</span>
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

      {/* Features Heading */}
      <div id="features" className="text-center max-w-2xl mx-auto mb-10 pt-4 scroll-mt-24">
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Key Security Features
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
          Ensuring absolute compliance and safety through advanced ledger auditing.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Card 1: Blockchain Security */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 relative group overflow-hidden shadow-sm dark:shadow-none flex items-start gap-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/10 dark:border-blue-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1.5">Blockchain Security</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Leverages Hyperledger Fabric 2.5 smart contracts to provide immutable access validation policies.
            </p>
          </div>
        </div>

        {/* Card 2: IPFS Storage */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 relative group overflow-hidden shadow-sm dark:shadow-none flex items-start gap-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
          <div className="h-12 w-12 rounded-xl bg-emerald-550/10 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/10 dark:border-emerald-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1.5">IPFS Storage</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Records are encrypted and hashed before being stored in decentralized IPFS nodes, reducing database bottlenecks.
            </p>
          </div>
        </div>

        {/* Card 3: Access Control */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300 relative group overflow-hidden shadow-sm dark:shadow-none flex items-start gap-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all duration-300"></div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/10 dark:border-amber-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11a3 3 0 11-6 0 3 3 0 016 0zm0 0v2.5a.5.5 0 00.5.5h1.5a.5.5 0 00.5-.5v-1a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1.5a.5.5 0 00.5.5h1.5a.5.5 0 00.5-.5V11" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1.5">Access Control</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Fine-grained attribute-based access control (ABAC) dynamically verifies credentials before granting visibility.
            </p>
          </div>
        </div>

        {/* Card 4: Audit Logs */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 hover:border-rose-500/30 transition-all duration-300 relative group overflow-hidden shadow-sm dark:shadow-none flex items-start gap-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all duration-300"></div>
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 border border-rose-500/10 dark:border-rose-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1.5">Audit Logs</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Every medical access attempt (allowed or denied) is immutably logged on-chain for verification audits.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works / Data Lifecycle Workflow */}
      <div id="how-it-works" className="mb-16 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Data Lifecycle Workflow
          </h3>
          <p className="text-slate-650 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            Visual lifecycle flow of medical information exchange between a Patient and their Clinician.
          </p>
        </div>

        {/* Workflow Container */}
        <div className="bg-slate-100/40 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Step 1: Patient */}
            <div className="w-full md:flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-500/30 transition-all duration-300 shadow-sm">
              <div className="h-12 w-12 rounded-full border border-blue-500/30 dark:border-blue-500/20 bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Patient</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Generates medical details</p>
            </div>

            {/* Connector Arrow 1 */}
            <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 shrink-0 my-2 md:my-0 rotate-90 md:rotate-0">
              <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800/60 flex items-center justify-center bg-white dark:bg-slate-950 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Step 2: Encrypt */}
            <div className="w-full md:flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-500/30 transition-all duration-300 shadow-sm">
              <div className="h-12 w-12 rounded-full border border-blue-500/30 dark:border-blue-500/20 bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Encrypt</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">AES-256 local encryption</p>
            </div>

            {/* Connector Arrow 2 */}
            <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 shrink-0 my-2 md:my-0 rotate-90 md:rotate-0">
              <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800/60 flex items-center justify-center bg-white dark:bg-slate-950 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Step 3: IPFS */}
            <div className="w-full md:flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-500/30 transition-all duration-300 shadow-sm">
              <div className="h-12 w-12 rounded-full border border-blue-500/30 dark:border-blue-500/20 bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">IPFS</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Decentralized hash storage</p>
            </div>

            {/* Connector Arrow 3 */}
            <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 shrink-0 my-2 md:my-0 rotate-90 md:rotate-0">
              <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800/60 flex items-center justify-center bg-white dark:bg-slate-950 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Step 4: Blockchain */}
            <div className="w-full md:flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-500/30 transition-all duration-300 shadow-sm">
              <div className="h-12 w-12 rounded-full border border-blue-500/30 dark:border-blue-500/20 bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Blockchain</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Access policy anchoring</p>
            </div>

            {/* Connector Arrow 4 */}
            <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 shrink-0 my-2 md:my-0 rotate-90 md:rotate-0">
              <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800/60 flex items-center justify-center bg-white dark:bg-slate-950 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Step 5: Doctor */}
            <div className="w-full md:flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-500/30 transition-all duration-300 shadow-sm">
              <div className="h-12 w-12 rounded-full border border-blue-500/30 dark:border-blue-500/20 bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM18 9l1 1 3-3" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Doctor</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Decrypted EMR rendering</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Simulation Console */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-lg dark:shadow-2xl relative transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-955 dark:text-white flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2.5 animate-pulse"></span>
              Access Control Policy Simulator
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Test attribute-based access policy evaluation using local state updates.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={simulatePolicyCheck}
              disabled={isSimulating}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md ${isSimulating
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/10 dark:shadow-purple-900/30 hover:scale-[1.02] cursor-pointer"
                }`}
            >
              {isSimulating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
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
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
            >
              Clear Console
            </button>
          </div>
        </div>

        {/* Console Output */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 font-mono text-xs border border-slate-200/50 dark:border-slate-900/50 shadow-inner min-h-[200px] max-h-[350px] overflow-y-auto flex flex-col space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 transition-all duration-300 hover:bg-slate-200/20 dark:hover:bg-slate-900/30 p-1 rounded">
              <span className="text-slate-400 dark:text-slate-600 select-none font-medium">[{log.timestamp}]</span>
              <span className={`flex-1 leading-relaxed ${log.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : log.type === "warning"
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : log.type === "info"
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : "text-slate-800 dark:text-slate-300"
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
    </div>
  )
}
