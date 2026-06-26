import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { 
  Play, Square, RefreshCw, Download, 
  TrendingUp, Activity, Layers, Cpu, 
  Shield, Check, Info, Zap, Terminal, Server
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Performance() {
  // Simulation config states
  const [txCount, setTxCount] = useState(500)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentLog, setCurrentLog] = useState('System idle. Ready to start benchmarking.')
  const [isCompleted, setIsCompleted] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState([])
  
  // Interactive tooltips state
  const [hoveredLatencyIndex, setHoveredLatencyIndex] = useState(null)
  const [hoveredThroughputIndex, setHoveredThroughputIndex] = useState(null)
  const [hoveredCommIndex, setHoveredCommIndex] = useState(null)
  const [hoveredCompIndex, setHoveredCompIndex] = useState(null)

  // Dynamic metrics state that populate during running the experiment
  const [activeLatency, setActiveLatency] = useState(null)
  const [activeThroughput, setActiveThroughput] = useState(null)
  const [activeComm, setActiveComm] = useState(null)

  // Chart ref states to enable SVG to PNG rendering
  const latencySvgRef = useRef(null)
  const throughputSvgRef = useRef(null)
  const commSvgRef = useRef(null)
  const compSvgRef = useRef(null)
  
  const terminalEndRef = useRef(null)
  const simulationIntervalRef = useRef(null)

  // Latency vs Transactions Baseline data (Figure 2)
  const latencyData = [
    { tx: 50, medRec: 450, medShare: 320, medChain: 210, healthRec: 180, proposed: 45 },
    { tx: 100, medRec: 920, medShare: 680, medChain: 440, healthRec: 360, proposed: 82 },
    { tx: 200, medRec: 1800, medShare: 1300, medChain: 890, healthRec: 710, proposed: 160 },
    { tx: 500, medRec: 4100, medShare: 2900, medChain: 2100, healthRec: 1600, proposed: 390 },
    { tx: 1000, medRec: 8200, medShare: 5800, medChain: 4100, healthRec: 3205, proposed: 750 }
  ]

  // Throughput vs TPS baseline data (Figure 3)
  const throughputData = [
    { tps: 50, medRec: 10, medShare: 30, medChain: 48, healthRec: 45, proposed: 48 },
    { tps: 100, medRec: 12, medShare: 45, medChain: 82, healthRec: 78, proposed: 96 },
    { tps: 150, medRec: 12, medShare: 50, medChain: 95, healthRec: 110, proposed: 142 },
    { tps: 200, medRec: 12, medShare: 50, medChain: 95, healthRec: 138, proposed: 188 },
    { tps: 250, medRec: 12, medShare: 50, medChain: 95, healthRec: 150, proposed: 232 },
    { tps: 300, medRec: 12, medShare: 50, medChain: 95, healthRec: 150, proposed: 278 }
  ]

  // Communication Overhead (KB) baseline data (Figure 4)
  const commData = [
    { tx: 50, medRec: 800, medShare: 450, medChain: 300, healthRec: 200, proposed: 85 },
    { tx: 100, medRec: 1600, medShare: 900, medChain: 600, healthRec: 400, proposed: 170 },
    { tx: 200, medRec: 3200, medShare: 1800, medChain: 1200, healthRec: 800, proposed: 340 },
    { tx: 500, medRec: 8000, medShare: 4500, medChain: 3000, healthRec: 2000, proposed: 850 },
    { tx: 1000, medRec: 16000, medShare: 9000, medChain: 6000, healthRec: 4000, proposed: 1700 }
  ]

  // Computation Overhead (ms) baseline data
  const compData = [
    { name: 'MedRec', crypto: 350, ledger: 150 },
    { name: 'MedShare', crypto: 280, ledger: 110 },
    { name: 'MedChain', crypto: 190, ledger: 80 },
    { name: 'HealthRec', crypto: 150, ledger: 70 },
    { name: 'Proposed', crypto: 42, ledger: 15 }
  ]

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current && typeof terminalEndRef.current.scrollIntoView === 'function') {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [terminalLogs])

  // Cleanup simulation interval on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current)
    }
  }, [])

  // Simulation execution handler
  const startExperiment = () => {
    setIsRunning(true)
    setIsCompleted(false)
    setProgress(0)
    setTerminalLogs([])
    setCurrentLog('Starting simulation initialization...')

    const index = txCount === 50 ? 0 : txCount === 100 ? 1 : txCount === 200 ? 2 : txCount === 500 ? 3 : 4
    const latItem = latencyData[index]
    const tpItem = throughputData[Math.min(index + 2, throughputData.length - 1)]
    const commItem = commData[index]

    const calculatedLatency = {
      tx: txCount,
      proposed: latItem.proposed,
      avg: latItem.proposed,
      max: Math.round(latItem.proposed * 1.25),
      min: Math.round(latItem.proposed * 0.75)
    }

    const calculatedThroughput = {
      tps: tpItem.tps,
      success: tpItem.proposed,
      failed: Math.round(tpItem.proposed * 0.01),
      rate: 99.4
    }

    const calculatedComm = {
      tx: txCount,
      traffic: commItem.proposed,
      avg: (commItem.proposed / txCount).toFixed(2),
      peak: (commItem.proposed / txCount * 1.45).toFixed(2)
    }

    const logSteps = [
      { prg: 5, log: "[system] Initializing Hyperledger Fabric client runner...", act: () => {} },
      { prg: 10, log: "[system] Connection gateway established using user context (Org1MSP admin).", act: () => {} },
      { prg: 18, log: "[peer0.org1] Established connection to peer0.org1.ehealth-consortium.org (127.0.0.1:7051)", act: () => {} },
      { prg: 25, log: "[peer0.org2] Established connection to peer0.org2.ehealth-consortium.org (127.0.0.2:7051)", act: () => {} },
      { prg: 32, log: "[ca] Verifying X.509 cryptographic attributes for role authorization...", act: () => {} },
      { prg: 40, log: "[client] Initiating AES-256/RSA-3072 hybrid key pair generation...", act: () => {} },
      { prg: 50, log: "[client] Cryptographic keys generated successfully. Client overhead: 42ms.", act: () => {
        setActiveLatency(calculatedLatency)
      }},
      { prg: 62, log: `[workload] Generating linear batch load of ${txCount} transactions...`, act: () => {} },
      { prg: 70, log: "[chaincode] Calling smart contract method 'evaluateAccessPolicy' on channel 'ehealth-channel'...", act: () => {} },
      { prg: 78, log: "[peer0.org1] Access token verified. Signature endorsement generated.", act: () => {} },
      { prg: 85, log: "[peer0.org2] Access token verified. Signature endorsement generated.", act: () => {
        setActiveThroughput(calculatedThroughput)
      }},
      { prg: 90, log: "[orderer] Broadcasting endorsed transaction block to Raft consensus nodes...", act: () => {
        setActiveComm(calculatedComm)
      }},
      { prg: 95, log: "[ledger] Write-lock acquired. Updating world state key-values (CouchDB)...", act: () => {} },
      { prg: 100, log: `[benchmark] Completed simulation. Latency: ${calculatedLatency.avg}ms | Throughput: ${calculatedThroughput.success} TPS | Network Comm: ${calculatedComm.traffic} KB.`, act: () => {} }
    ]

    let currentStepIndex = 0
    const interval = setInterval(() => {
      if (currentStepIndex < logSteps.length) {
        const step = logSteps[currentStepIndex]
        setProgress(step.prg)
        setCurrentLog(step.log)
        setTerminalLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${step.log}`])
        step.act()
        currentStepIndex++
      } else {
        clearInterval(interval)
        setIsRunning(false)
        setIsCompleted(true)
        toast.success('Simulation Completed! Benchmarks mapped to comparison figures.')
      }
    }, 280) // 14 steps * 280ms ≈ 3.9 seconds

    simulationIntervalRef.current = interval
  }

  const stopExperiment = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
    }
    setIsRunning(false)
    setProgress(0)
    setCurrentLog('Experiment aborted by user.')
    setTerminalLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [system] ERROR: Benchmark aborted by user.`])
    toast.error('Simulation stopped.')
  }

  const resetExperiment = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
    }
    setIsRunning(false)
    setProgress(0)
    setCurrentLog('System idle. Ready to start benchmarking.')
    setTerminalLogs([])
    setIsCompleted(false)
    setActiveLatency(null)
    setActiveThroughput(null)
    setActiveComm(null)
    toast.success('Metrics reset.')
  }

  // Export dataset to CSV utility
  const exportCSV = (dataType) => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    
    if (dataType === 'latency') {
      csvContent += 'Transactions,MedRec (ms),MedShare (ms),MedChain (ms),HealthRec-Chain (ms),Proposed Method (ms)\r\n'
      latencyData.forEach(d => {
        csvContent += `${d.tx},${d.medRec},${d.medShare},${d.medChain},${d.healthRec},${d.proposed}\r\n`
      })
    } else if (dataType === 'throughput') {
      csvContent += 'Workload (TPS),MedRec (TPS),MedShare (TPS),MedChain (TPS),HealthRec-Chain (TPS),Proposed Method (TPS)\r\n'
      throughputData.forEach(d => {
        csvContent += `${d.tps},${d.medRec},${d.medShare},${d.medChain},${d.healthRec},${d.proposed}\r\n`
      })
    } else if (dataType === 'communication') {
      csvContent += 'Transactions,MedRec (KB),MedShare (KB),MedChain (KB),HealthRec-Chain (KB),Proposed Method (KB)\r\n'
      commData.forEach(d => {
        csvContent += `${d.tx},${d.medRec},${d.medShare},${d.medChain},${d.healthRec},${d.proposed}\r\n`
      })
    } else if (dataType === 'computation') {
      csvContent += 'Method,Crypto Computation (ms),Ledger Commit (ms)\r\n'
      compData.forEach(d => {
        csvContent += `${d.name},${d.crypto},${d.ledger}\r\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${dataType}_experiment_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`${dataType.toUpperCase()} dataset exported to CSV!`)
  }

  // Export SVG graphic as PNG utility
  const exportPNG = (svgRef, filename) => {
    if (!svgRef.current) return
    try {
      const svgElement = svgRef.current
      const svgString = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const URL = window.URL || window.webkitURL || window
      const blobURL = URL.createObjectURL(svgBlob)
      
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = svgElement.clientWidth || 500
        canvas.height = svgElement.clientHeight || 300
        const context = canvas.getContext('2d')
        
        // Render white background for export visibility
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        
        context.drawImage(image, 0, 0)
        const pngURL = canvas.toDataURL('image/png')
        
        const downloadLink = document.createElement('a')
        downloadLink.href = pngURL
        downloadLink.download = `${filename}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(blobURL)
      }
      image.src = blobURL
      toast.success(`${filename.toUpperCase()} graph exported to PNG!`)
    } catch {
      toast.error('PNG export failed. Please check browser support.')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] px-2 md:px-4 py-2">
      {/* Background glow graphics */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-purple-500/10 dark:bg-purple-650/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-650/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <Activity className="text-purple-650 dark:text-purple-400 w-8 h-8" />
              Performance Experiments
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
              Examine smart contract access control performance benchmarks (Latency, Throughput, and Overheads) and evaluate metrics against medical system architectures.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 px-3.5 py-2 rounded-xl text-purple-650 dark:text-purple-400 shadow-sm self-start md:self-center">
            <Shield className="w-3.5 h-3.5" />
            <span>FABRIC BENCHMARK SUITE</span>
          </div>
        </div>

        {/* Qualitative Comparison Efficiency Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Latency */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm hover:border-purple-500/30 dark:hover:border-purple-500/30 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-8 -mt-8 -z-10"></div>
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Latency Reduction</span>
                <h4 className="text-2xl font-extrabold text-purple-650 dark:text-purple-400 group-hover:scale-105 transition-transform duration-300">90.8%</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Faster than traditional MedRec ledger writes under peak workload</p>
              </div>
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-650 dark:text-purple-400">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Throughput */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-8 -mt-8 -z-10"></div>
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Throughput Gain</span>
                <h4 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-300">22.1x</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Higher peak transactions/sec capacity (278 vs 12 TPS)</p>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-450">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          {/* Card 3: Bandwidth */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm hover:border-amber-500/30 dark:hover:border-amber-500/30 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-8 -mt-8 -z-10"></div>
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Network Bandwidth</span>
                <h4 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform duration-300">89.3%</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Lower communication footprint due to hash-only anchoring</p>
              </div>
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          {/* Card 4: CPU Computation */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-8 -mt-8 -z-10"></div>
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">CPU Processing Cost</span>
                <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-450 group-hover:scale-105 transition-transform duration-300">88.0%</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Reduced cryptographic processing overhead (42ms vs 350ms)</p>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-650 dark:text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Experiment Controller Panel & Terminal Console Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controller - Span 5 */}
          <div className="lg:col-span-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm dark:shadow-none flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-purple-650 dark:text-purple-400" />
                  Experiment Control Panel
                </h2>
                <p className="text-xs text-slate-500 mt-1">Select a transactional load profile and execute local Hyperledger Fabric client simulation.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="txSelect" className="text-xs font-bold text-slate-400 uppercase tracking-wide">LOAD Profile Size</label>
                  <select
                    id="txSelect"
                    value={txCount}
                    onChange={(e) => setTxCount(Number(e.target.value))}
                    disabled={isRunning}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
                  >
                    <option value={50}>50 Transactions workload</option>
                    <option value={100}>100 Transactions workload</option>
                    <option value={200}>200 Transactions workload</option>
                    <option value={500}>500 Transactions workload</option>
                    <option value={1000}>1000 Transactions workload</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  {!isRunning ? (
                    <button
                      onClick={startExperiment}
                      className="flex-1 bg-purple-600 hover:bg-purple-550 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Execute Benchmark
                    </button>
                  ) : (
                    <button
                      onClick={stopExperiment}
                      className="flex-1 bg-rose-500 hover:bg-rose-450 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition cursor-pointer animate-pulse"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      Abort Execution
                    </button>
                  )}
                  <button
                    onClick={resetExperiment}
                    disabled={isRunning}
                    className="bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 font-bold text-xs px-3.5 py-3 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Running progress bar */}
            {(isRunning || isCompleted) && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2.5">
                <div className="flex justify-between text-xs font-bold font-mono">
                  <span className="text-purple-650 dark:text-purple-400 flex items-center gap-1.5 max-w-[85%] truncate">
                    <span className={`w-2.5 h-2.5 rounded-full bg-purple-500 ${isRunning ? 'animate-ping' : ''}`}></span>
                    {currentLog}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{progress}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-650 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Console - Span 7 */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-64 lg:h-auto overflow-hidden">
            {/* Console Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-[10px] text-slate-500 font-mono ml-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  blockchain-benchmark-console
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE
              </div>
            </div>
            
            {/* Console Logs Area */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-[10px] text-purple-300 space-y-2 min-h-[160px] custom-scrollbar scroll-smooth">
              {terminalLogs.length === 0 ? (
                <div className="text-slate-500 italic py-2">Console idle. Execute benchmark to capture active peer validation streams...</div>
              ) : (
                terminalLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 hover:bg-slate-900/40 py-0.5 px-1 rounded transition-colors duration-150">
                    <span className="text-slate-600 select-none">[{i+1}]</span>
                    <span className="whitespace-pre-wrap">{log}</span>
                  </div>
                ))
              )}
              {isRunning && (
                <div className="flex items-center gap-1 text-[10px] text-purple-400 animate-pulse font-mono pl-1">
                  <span>&gt; Simulating blockchain network transaction workload...</span>
                  <span className="w-1.5 h-3 bg-purple-400 animate-ping"></span>
                </div>
              )}
              <div ref={terminalEndRef}></div>
            </div>
          </div>

        </div>

        {/* Charts Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Latency vs Transactions Chart (Figure 2) */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4 relative">
            
            {/* Tooltip Overlay */}
            <AnimatePresence>
              {hoveredLatencyIndex !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute z-10 p-3.5 bg-slate-950/95 backdrop-blur-lg border border-purple-500/30 rounded-2xl shadow-2xl text-white text-[11px] pointer-events-none space-y-2 transition-all duration-200 w-56"
                  style={{
                    left: `${Math.min(Math.max(10, 8 + hoveredLatencyIndex * 18), 85)}%`,
                    top: '20%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-bold border-b border-slate-800 pb-1.5 text-slate-300 flex justify-between items-center">
                    <span>Transactions</span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono font-bold text-[10px]">{latencyData[hoveredLatencyIndex].tx}</span>
                  </div>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px]">Proposed Method:</span>
                      <span className="font-extrabold text-purple-450">{latencyData[hoveredLatencyIndex].proposed} ms</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">MedChain:</span>
                      <span className="text-amber-500">{latencyData[hoveredLatencyIndex].medChain} ms</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">MedRec:</span>
                      <span className="text-rose-500">{latencyData[hoveredLatencyIndex].medRec} ms</span>
                    </div>
                  </div>
                  <div className="text-[9.5px] text-purple-300 border-t border-slate-800/80 pt-1.5 font-semibold text-center">
                    Proposed is {(100 - (latencyData[hoveredLatencyIndex].proposed / latencyData[hoveredLatencyIndex].medRec * 100)).toFixed(1)}% faster than MedRec
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="text-purple-600 dark:text-purple-400 w-4 h-4" />
                  Figure 2: Latency vs Transaction Count
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Execution delay comparison under linear transaction count growth.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportPNG(latencySvgRef, 'latency_graph')}
                  className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 cursor-pointer transition"
                  title="Export as PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => exportCSV('latency')}
                  className="px-2.5 py-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[10px] font-bold cursor-pointer transition"
                  title="Export CSV Data"
                >
                  CSV
                </button>
              </div>
            </div>            {/* Latency Line Chart SVG */}
            <div className="h-64 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 p-2 border border-slate-150 dark:border-slate-900/60 flex items-center justify-center relative select-none">
              <svg 
                ref={latencySvgRef}
                viewBox="0 0 500 240" 
                className="w-full h-full font-mono text-[9px] overflow-visible text-slate-650 dark:text-slate-300"
              >
                <defs>
                  <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Gridlines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="155" x2="480" y2="155" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="200" x2="480" y2="200" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />

                {/* Y Axis Labels */}
                <text x="32" y="23" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">8000</text>
                <text x="32" y="68" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">6000</text>
                <text x="32" y="113" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">4000</text>
                <text x="32" y="158" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">2000</text>
                <text x="32" y="203" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">0</text>

                {/* X Axis Labels */}
                <text x="80" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">50</text>
                <text x="170" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">100</text>
                <text x="260" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">200</text>
                <text x="350" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">500</text>
                <text x="440" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">1000</text>
                <text x="260" y="230" textAnchor="middle" fill="currentColor" className="font-sans font-bold uppercase tracking-wider text-[8px] opacity-90 dark:opacity-100">Transaction Count</text>
                
                {/* MedRec line (red) */}
                <polyline 
                  points="80,190 170,179 260,160 350,108 440,15"
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  opacity="0.65"
                />
                
                {/* MedChain line (amber) */}
                <polyline 
                  points="80,195 170,190 260,180 350,153 440,108"
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="1.5" 
                  opacity="0.75"
                />

                {/* Proposed method line (purple - glowing) */}
                <polyline 
                  points="80,199 170,198 260,196 350,191 440,183"
                  fill="none" 
                  stroke="#a78bfa" 
                  strokeWidth="3" 
                  filter="url(#glow-purple)"
                />

                {/* Proposed method point dots */}
                <circle cx="80" cy="199" r="3.5" fill="#a78bfa" stroke="#ffffff" strokeWidth="1" />
                <circle cx="170" cy="198" r="3.5" fill="#a78bfa" stroke="#ffffff" strokeWidth="1" />
                <circle cx="260" cy="196" r="3.5" fill="#a78bfa" stroke="#ffffff" strokeWidth="1" />
                <circle cx="350" cy="191" r="3.5" fill="#a78bfa" stroke="#ffffff" strokeWidth="1" />
                <circle cx="440" cy="183" r="3.5" fill="#a78bfa" stroke="#ffffff" strokeWidth="1" />

                {/* Legend */}
                <g transform="translate(50, 22)">
                  <line x1="0" y1="0" x2="12" y2="0" stroke="#ef4444" strokeWidth="2" opacity="0.7"/>
                  <text x="16" y="3" fill="currentColor" className="text-[7px] opacity-90 dark:opacity-100">MedRec</text>
                  
                  <line x1="65" y1="0" x2="77" y2="0" stroke="#fbbf24" strokeWidth="2" opacity="0.8"/>
                  <text x="81" y="3" fill="currentColor" className="text-[7px] opacity-90 dark:opacity-100">MedChain</text>

                  <line x1="135" y1="0" x2="147" y2="0" stroke="#a78bfa" strokeWidth="3" filter="url(#glow-purple)" />
                  <text x="151" y="3" fill="#a78bfa" className="text-[7px] font-bold">Proposed Method</text>
                </g>

                {/* Interactive hovered vertical indicator line */}
                {hoveredLatencyIndex !== null && (
                  <line 
                    x1={80 + hoveredLatencyIndex * 90} 
                    y1="20" 
                    x2={80 + hoveredLatencyIndex * 90} 
                    y2="200" 
                    stroke="#a78bfa" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                    opacity="0.6"
                  />
                )}

                {/* Hover trigger rectangles */}
                {latencyData.map((d, i) => (
                  <rect
                    key={i}
                    x={80 + i * 90 - 20}
                    y="20"
                    width="40"
                    height="180"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredLatencyIndex(i)}
                    onMouseLeave={() => setHoveredLatencyIndex(null)}
                  />
                ))}
              </svg>
            </div>

            {/* Latency Stats & Comparison */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 font-mono">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Avg Latency</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeLatency ? `${activeLatency.avg} ms` : '285 ms'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Max Latency</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeLatency ? `${activeLatency.max} ms` : '750 ms'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Min Latency</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeLatency ? `${activeLatency.min} ms` : '45 ms'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Clearance Mode</span>
                  <span className="text-purple-650 dark:text-purple-400 font-bold uppercase">Fabric Raft</span>
                </div>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Literature Comparison:</strong> Proposed Method exhibits <strong>90.8% lower latency</strong> than MedRec (750ms vs 8200ms) and <strong>81.7% lower latency</strong> than MedChain (750ms vs 4100ms) under a peak workload of 1000 transactions.
                </span>
              </div>
            </div>
          </div>

          {/* Throughput vs TPS (Figure 3) */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4 relative">
            
            {/* Tooltip Overlay */}
            <AnimatePresence>
              {hoveredThroughputIndex !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute z-10 p-3.5 bg-slate-950/95 backdrop-blur-lg border border-blue-500/30 rounded-2xl shadow-2xl text-white text-[11px] pointer-events-none space-y-2 transition-all duration-200 w-56"
                  style={{
                    left: `${Math.min(Math.max(10, 8 + hoveredThroughputIndex * 14), 85)}%`,
                    top: '20%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-bold border-b border-slate-800 pb-1.5 text-slate-300 flex justify-between items-center">
                    <span>Input Workload</span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-mono font-bold text-[10px]">{throughputData[hoveredThroughputIndex].tps} TPS</span>
                  </div>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px]">Proposed Method:</span>
                      <span className="font-extrabold text-blue-400">{throughputData[hoveredThroughputIndex].proposed} TPS</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-505">HealthRec-Chain:</span>
                      <span className="text-emerald-500">{throughputData[hoveredThroughputIndex].healthRec} TPS</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-505">MedRec:</span>
                      <span className="text-rose-500">{throughputData[hoveredThroughputIndex].medRec} TPS</span>
                    </div>
                  </div>
                  <div className="text-[9.5px] text-blue-300 border-t border-slate-800/80 pt-1.5 font-semibold text-center">
                    Proposed throughput is {(throughputData[hoveredThroughputIndex].proposed / Math.max(1, throughputData[hoveredThroughputIndex].medRec)).toFixed(0)}x MedRec
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="text-blue-600 dark:text-blue-400 w-4 h-4" />
                  Figure 3: Throughput vs Workload (TPS)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Commits/sec throughput curve comparison under stress input TPS rates.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportPNG(throughputSvgRef, 'throughput_graph')}
                  className="p-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 cursor-pointer transition"
                  title="Export as PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => exportCSV('throughput')}
                  className="px-2.5 py-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[10px] font-bold cursor-pointer transition"
                  title="Export CSV Data"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Throughput Chart SVG */}
            <div className="h-64 rounded-2xl bg-slate-50/50 dark:bg-slate-955/30 p-2 border border-slate-150 dark:border-slate-900/60 flex items-center justify-center relative select-none">
              <svg 
                ref={throughputSvgRef}
                viewBox="0 0 500 240" 
                className="w-full h-full font-mono text-[9px] overflow-visible text-slate-650 dark:text-slate-300"
              >
                <defs>
                  <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Gridlines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="155" x2="480" y2="155" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="200" x2="480" y2="200" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />

                {/* Y Axis Labels */}
                <text x="32" y="23" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">300</text>
                <text x="32" y="68" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">225</text>
                <text x="32" y="113" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">150</text>
                <text x="32" y="158" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">75</text>
                <text x="32" y="203" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">0</text>

                {/* X Axis Labels */}
                <text x="70" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">50</text>
                <text x="140" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">100</text>
                <text x="210" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">150</text>
                <text x="280" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">200</text>
                <text x="350" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">250</text>
                <text x="420" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">300</text>
                <text x="245" y="230" textAnchor="middle" fill="currentColor" className="font-sans font-bold uppercase tracking-wider text-[8px] opacity-90 dark:opacity-100">Input Workload Rate (TPS)</text>

                {/* MedRec line (red) */}
                <polyline 
                  points="70,194 140,192 210,192 280,192 350,192 420,192"
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  opacity="0.65"
                />

                {/* HealthRec line (emerald) */}
                <polyline 
                  points="70,173 140,153 210,134 280,117 350,110 420,110"
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="1.5" 
                  opacity="0.75"
                />

                {/* Proposed Method curve line (blue - glowing) */}
                <polyline 
                  points="70,171 140,142 210,114 280,87 350,60 420,33"
                  fill="none" 
                  stroke="#60a5fa" 
                  strokeWidth="3" 
                  filter="url(#glow-blue)"
                />

                {/* Proposed method points */}
                <circle cx="70" cy="171" r="3.5" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
                <circle cx="140" cy="142" r="3.5" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
                <circle cx="210" cy="114" r="3.5" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
                <circle cx="280" cy="87" r="3.5" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
                <circle cx="350" cy="60" r="3.5" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
                <circle cx="420" cy="33" r="3.5" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />

                {/* Legend */}
                <g transform="translate(50, 22)">
                  <line x1="0" y1="0" x2="12" y2="0" stroke="#ef4444" strokeWidth="2" opacity="0.7"/>
                  <text x="16" y="3" fill="currentColor" className="text-[7px] opacity-90 dark:opacity-100">MedRec</text>
                  
                  <line x1="65" y1="0" x2="77" y2="0" stroke="#10b981" strokeWidth="2" opacity="0.8"/>
                  <text x="81" y="3" fill="currentColor" className="text-[7px] opacity-90 dark:opacity-100">HealthRec-Chain</text>

                  <line x1="155" y1="0" x2="167" y2="0" stroke="#60a5fa" strokeWidth="3" filter="url(#glow-blue)" />
                  <text x="171" y="3" fill="#60a5fa" className="text-[7px] font-bold">Proposed Method</text>
                </g>

                {/* Interactive hovered vertical indicator line */}
                {hoveredThroughputIndex !== null && (
                  <line 
                    x1={70 + hoveredThroughputIndex * 70} 
                    y1="20" 
                    x2={70 + hoveredThroughputIndex * 70} 
                    y2="200" 
                    stroke="#60a5fa" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                    opacity="0.6"
                  />
                )}

                {/* Hover trigger zones */}
                {throughputData.map((d, i) => (
                  <rect
                    key={i}
                    x={70 + i * 70 - 20}
                    y="20"
                    width="40"
                    height="180"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredThroughputIndex(i)}
                    onMouseLeave={() => setHoveredThroughputIndex(null)}
                  />
                ))}
              </svg>
            </div>

            {/* Throughput Stats & Comparison */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-880 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 font-mono">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Avg Throughput</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeThroughput ? `${activeThroughput.success} TPS` : '164 TPS'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Max Throughput</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeThroughput ? `${activeThroughput.success} TPS` : '278 TPS'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Min Throughput</span>
                  <span className="text-slate-900 dark:text-white font-bold">48 TPS</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Success Rate</span>
                  <span className="text-emerald-600 dark:text-emerald-450 font-bold">{activeThroughput ? `${activeThroughput.rate}%` : '99.7%'}</span>
                </div>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Literature Comparison:</strong> Proposed Method achieves a peak throughput of <strong>278 TPS</strong> at 300 input TPS workload, outperforming MedRec (capped at 12 TPS due to Ethereum PoW limits) and HealthRec-Chain (capped at 150 TPS).
                </span>
              </div>
            </div>
          </div>

          {/* Communication Overhead (Figure 4) */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4 relative">
            
            {/* Tooltip Overlay */}
            <AnimatePresence>
              {hoveredCommIndex !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute z-10 p-3.5 bg-slate-955/95 backdrop-blur-lg border border-amber-500/30 rounded-2xl shadow-2xl text-white text-[11px] pointer-events-none space-y-2 transition-all duration-200 w-56"
                  style={{
                    left: `${Math.min(Math.max(10, 8 + hoveredCommIndex * 18), 85)}%`,
                    top: '20%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-bold border-b border-slate-800 pb-1.5 text-slate-300 flex justify-between items-center">
                    <span>Transactions</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono font-bold text-[10px]">{commData[hoveredCommIndex].tx}</span>
                  </div>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px]">Proposed Method:</span>
                      <span className="font-extrabold text-amber-500">{commData[hoveredCommIndex].proposed} KB</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">MedShare:</span>
                      <span className="text-blue-500">{commData[hoveredCommIndex].medShare} KB</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-505">MedRec:</span>
                      <span className="text-rose-500">{commData[hoveredCommIndex].medRec} KB</span>
                    </div>
                  </div>
                  <div className="text-[9.5px] text-amber-350 border-t border-slate-800/80 pt-1.5 font-semibold text-center">
                    Proposed saves {(100 - (commData[hoveredCommIndex].proposed / commData[hoveredCommIndex].medRec * 100)).toFixed(1)}% network payload bandwidth vs MedRec
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="text-amber-600 dark:text-amber-400 w-4 h-4" />
                  Figure 4: Communication Network Overhead
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Payload network bandwidth consumption (KB) under heavy transactions load.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportPNG(commSvgRef, 'communication_graph')}
                  className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 cursor-pointer transition"
                  title="Export as PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => exportCSV('communication')}
                  className="px-2.5 py-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[10px] font-bold cursor-pointer transition"
                  title="Export CSV Data"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Comm Overhead Chart SVG */}
            <div className="h-64 rounded-2xl bg-slate-50/50 dark:bg-slate-955/30 p-2 border border-slate-150 dark:border-slate-900/60 flex items-center justify-center relative select-none">
              <svg 
                ref={commSvgRef}
                viewBox="0 0 500 240" 
                className="w-full h-full font-mono text-[9px] overflow-visible text-slate-650 dark:text-slate-300"
              >
                <defs>
                  <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Gridlines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="155" x2="480" y2="155" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="200" x2="480" y2="200" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />

                {/* Y Axis Labels */}
                <text x="32" y="23" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">16000</text>
                <text x="32" y="68" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">12000</text>
                <text x="32" y="113" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">8000</text>
                <text x="32" y="158" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">4000</text>
                <text x="32" y="203" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">0</text>

                {/* X Axis Labels */}
                <text x="80" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">50</text>
                <text x="170" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">100</text>
                <text x="260" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">200</text>
                <text x="350" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">500</text>
                <text x="440" y="215" textAnchor="middle" fill="currentColor" className="opacity-90 dark:opacity-100">1000</text>
                <text x="260" y="230" textAnchor="middle" fill="currentColor" className="font-sans font-bold uppercase tracking-wider text-[8px] opacity-90 dark:opacity-100">Transaction Volume</text>

                {/* MedRec line (red) */}
                <polyline 
                  points="80,191 170,182 260,164 350,110 440,20"
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  opacity="0.65"
                />

                {/* MedShare line (blue) */}
                <polyline 
                  points="80,194 170,189 260,179 350,149 440,98"
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="1.5" 
                  opacity="0.75"
                />

                {/* Proposed Method line (amber - glowing) */}
                <polyline 
                  points="80,199 170,198 260,196 350,190 440,180"
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="3" 
                  filter="url(#glow-amber)"
                />

                {/* Proposed dots */}
                <circle cx="80" cy="199" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
                <circle cx="170" cy="198" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
                <circle cx="260" cy="196" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
                <circle cx="350" cy="190" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
                <circle cx="440" cy="180" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />

                {/* Legend */}
                <g transform="translate(50, 22)">
                  <line x1="0" y1="0" x2="12" y2="0" stroke="#ef4444" strokeWidth="2" opacity="0.7"/>
                  <text x="16" y="3" fill="currentColor" className="text-[7px] opacity-90 dark:opacity-100">MedRec</text>
                  
                  <line x1="65" y1="0" x2="77" y2="0" stroke="#3b82f6" strokeWidth="2" opacity="0.8"/>
                  <text x="81" y="3" fill="currentColor" className="text-[7px] opacity-90 dark:opacity-100">MedShare</text>

                  <line x1="145" y1="0" x2="157" y2="0" stroke="#fbbf24" strokeWidth="3" filter="url(#glow-amber)" />
                  <text x="161" y="3" fill="#fbbf24" className="text-[7px] font-bold">Proposed Method</text>
                </g>

                {/* Interactive hovered vertical indicator line */}
                {hoveredCommIndex !== null && (
                  <line 
                    x1={80 + hoveredCommIndex * 90} 
                    y1="20" 
                    x2={80 + hoveredCommIndex * 90} 
                    y2="200" 
                    stroke="#fbbf24" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                    opacity="0.6"
                  />
                )}

                {/* Hover zones */}
                {commData.map((d, i) => (
                  <rect
                    key={i}
                    x={80 + i * 90 - 20}
                    y="20"
                    width="40"
                    height="180"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCommIndex(i)}
                    onMouseLeave={() => setHoveredCommIndex(null)}
                  />
                ))}
              </svg>
            </div>

            {/* Communication Stats & Comparison */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-100 dark:border-slate-805/50 font-mono">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Avg Traffic</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeComm ? `${activeComm.traffic} KB` : '629 KB'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Peak Traffic</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeComm ? `${Math.round(activeComm.traffic * 1.45)} KB` : '1700 KB'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Min Traffic</span>
                  <span className="text-slate-900 dark:text-white font-bold">85 KB</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Bytes / Tx</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{activeComm ? `${activeComm.avg} KB` : '1.7 KB'}</span>
                </div>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-505 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Literature Comparison:</strong> Proposed Method reduces communication network overhead by <strong>89.3%</strong> compared to MedRec (1.7MB vs 16.0MB) and <strong>71.6%</strong> compared to MedShare (6.0MB) at 1000 tx load due to hash-only blockchain submissions.
                </span>
              </div>
            </div>
          </div>

          {/* Computation Overhead (Bar Chart) */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4 relative">
            
            {/* Tooltip Overlay */}
            <AnimatePresence>
              {hoveredCompIndex !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute z-10 p-3.5 bg-slate-950/95 backdrop-blur-lg border border-emerald-500/30 rounded-2xl shadow-2xl text-white text-[11px] pointer-events-none space-y-2 transition-all duration-200 w-60"
                  style={{
                    left: `${Math.min(Math.max(10, 8 + hoveredCompIndex * 17), 85)}%`,
                    top: '20%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-bold border-b border-slate-800 pb-1.5 text-slate-350 flex justify-between items-center">
                    <span>Architecture</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-350 rounded font-mono font-bold text-[10px]">{compData[hoveredCompIndex].name}</span>
                  </div>
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Crypto Processing:</span>
                      <span className="font-bold text-purple-300">{compData[hoveredCompIndex].crypto} ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Ledger Commit:</span>
                      <span className="font-bold text-indigo-300">{compData[hoveredCompIndex].ledger} ms</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800/80 mt-1 pt-1 font-bold text-slate-200">
                      <span>Total CPU Cost:</span>
                      <span className="text-emerald-400">{compData[hoveredCompIndex].crypto + compData[hoveredCompIndex].ledger} ms</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-emerald-400 border-t border-slate-800/80 pt-1.5 font-semibold text-center">
                    {compData[hoveredCompIndex].name === 'Proposed' 
                      ? 'Proposed is 88.6% faster' 
                      : `Proposed is ${(100 - (57 / (compData[hoveredCompIndex].crypto + compData[hoveredCompIndex].ledger) * 100)).toFixed(1)}% faster`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="text-emerald-600 dark:text-emerald-400 w-4 h-4" />
                  Computation Overhead (500 Transactions)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">CPU execution cost split between cryptographic parsing and ledger write commits.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportPNG(compSvgRef, 'computation_overhead')}
                  className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 cursor-pointer transition"
                  title="Export as PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => exportCSV('computation')}
                  className="px-2.5 py-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[10px] font-bold cursor-pointer transition"
                  title="Export CSV Data"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Comp Overhead Stacked Bar Chart SVG */}
            <div className="h-64 rounded-2xl bg-slate-50/50 dark:bg-slate-955/30 p-2 border border-slate-150 dark:border-slate-900/60 flex items-center justify-center relative select-none">
              <svg 
                ref={compSvgRef}
                viewBox="0 0 500 240" 
                className="w-full h-full font-mono text-[9px] overflow-visible text-slate-650 dark:text-slate-300"
              >
                <defs>
                  <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Gridlines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="155" x2="480" y2="155" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
                <line x1="40" y1="200" x2="480" y2="200" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />

                {/* Y Axis Labels */}
                <text x="32" y="23" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">500 ms</text>
                <text x="32" y="68" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">375 ms</text>
                <text x="32" y="113" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">250 ms</text>
                <text x="32" y="158" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">125 ms</text>
                <text x="32" y="203" textAnchor="end" fill="currentColor" className="opacity-90 dark:opacity-100">0 ms</text>

                {/* Bars */}
                {/* MedRec */}
                <rect x="75" y="74" width="28" height="54" fill="#818cf8" opacity="0.8" />
                <rect x="75" y="128" width="28" height="72" fill="#4f46e5" opacity="0.9" />
                <text x="89" y="215" textAnchor="middle" fill="currentColor">MedRec</text>

                {/* MedShare */}
                <rect x="160" y="100" width="28" height="40" fill="#818cf8" opacity="0.8" />
                <rect x="160" y="140" width="28" height="60" fill="#4f46e5" opacity="0.9" />
                <text x="174" y="215" textAnchor="middle" fill="currentColor">MedShare</text>

                {/* MedChain */}
                <rect x="245" y="131" width="28" height="29" fill="#818cf8" opacity="0.8" />
                <rect x="245" y="160" width="28" height="40" fill="#4f46e5" opacity="0.9" />
                <text x="259" y="215" textAnchor="middle" fill="currentColor">MedChain</text>

                {/* HealthRec */}
                <rect x="330" y="146" width="28" height="25" fill="#818cf8" opacity="0.8" />
                <rect x="330" y="171" width="28" height="29" fill="#4f46e5" opacity="0.9" />
                <text x="344" y="215" textAnchor="middle" fill="currentColor">HealthRec</text>

                {/* Proposed - glowing emerald */}
                <rect x="415" y="180" width="28" height="5" fill="#34d399" filter="url(#glow-emerald)" />
                <rect x="415" y="185" width="28" height="15" fill="#059669" filter="url(#glow-emerald)" />
                <text x="429" y="215" textAnchor="middle" fill="currentColor" className="font-bold">Proposed</text>

                {/* Legend */}
                <g transform="translate(50, 22)">
                  <rect x="0" y="-4" width="10" height="7" fill="#4f46e5" opacity="0.9"/>
                  <text x="14" y="2" fill="currentColor" className="text-[7px] opacity-90 dark:opacity-100">Crypto Processing (Others)</text>
                  
                  <rect x="135" y="-4" width="10" height="7" fill="#818cf8" opacity="0.8"/>
                  <text x="149" y="2" fill="currentColor" className="text-[7px] opacity-90 dark:opacity-100">Ledger Commit (Others)</text>

                  <rect x="270" y="-4" width="10" height="7" fill="#059669" filter="url(#glow-emerald)" />
                  <text x="284" y="2" fill="#059669" className="text-[7px] font-bold">Proposed Crypto</text>

                  <rect x="375" y="-4" width="10" height="7" fill="#34d399" filter="url(#glow-emerald)" />
                  <text x="389" y="2" fill="#34d399" className="text-[7px] font-bold">Proposed Commit</text>
                </g>

                {/* Hover line indicator */}
                {hoveredCompIndex !== null && (
                  <line 
                    x1={89 + hoveredCompIndex * 85} 
                    y1="20" 
                    x2={89 + hoveredCompIndex * 85} 
                    y2="200" 
                    stroke="#10b981" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                    opacity="0.6"
                  />
                )}

                {/* Hover zones */}
                {compData.map((d, i) => (
                  <rect
                    key={i}
                    x={89 + i * 85 - 25}
                    y="20"
                    width="50"
                    height="180"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCompIndex(i)}
                    onMouseLeave={() => setHoveredCompIndex(null)}
                  />
                ))}
              </svg>
            </div>

            {/* Computation Stats & Comparison */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 font-mono">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Avg CPU Cost</span>
                  <span className="text-slate-900 dark:text-white font-bold">57 ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Max (MedRec)</span>
                  <span className="text-slate-900 dark:text-white font-bold">500 ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Min (Proposed)</span>
                  <span className="text-slate-900 dark:text-white font-bold">57 ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Crypto Cost</span>
                  <span className="text-emerald-600 dark:text-emerald-450 font-bold font-mono">42 ms</span>
                </div>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Literature Comparison:</strong> Proposed Method client-side crypto overhead (42ms AES key creation) is <strong>88.0% faster</strong> than MedRec (350ms asymmetric RSA schemes) and <strong>72.0% faster</strong> than MedChain (190ms).
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Literature Benchmarking Comparison Grid */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="text-purple-650 dark:text-purple-400 w-5 h-5" />
              Literature Benchmarking Comparison Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-1">Qualitative security and operational features comparison of proposed architecture against state-of-the-art frameworks.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-150 dark:border-slate-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] bg-slate-50/50 dark:bg-slate-950/40 uppercase tracking-wider font-bold select-none">
                  <th className="py-4 pl-4">System Schema</th>
                  <th className="py-4">Consensus Method</th>
                  <th className="py-4">Clearance Engine</th>
                  <th className="py-4">Client Encryption</th>
                  <th className="py-4">Auditable Logs</th>
                  <th className="py-4 text-right pr-4">Real-Time Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-sans">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pl-4 font-bold text-slate-900 dark:text-white">MedRec</td>
                  <td className="py-4 font-mono text-[10.5px]">Ethereum PoW</td>
                  <td className="py-4 text-slate-500 dark:text-slate-450">Static Role-Based</td>
                  <td className="py-4 text-rose-500 dark:text-rose-400 font-semibold">No (Public Cipher)</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-450 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Yes (Ledger)
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4 text-rose-500 dark:text-rose-400 font-semibold">No (Block Time)</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pl-4 font-bold text-slate-900 dark:text-white">MedShare</td>
                  <td className="py-4 font-mono text-[10.5px]">Tendermint BFT</td>
                  <td className="py-4 text-slate-500 dark:text-slate-450">Metadata Filters</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-450 font-semibold">
                    Yes (Proxy AES)
                  </td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-450 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Yes (Ledger)
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4 text-rose-500 dark:text-rose-400 font-semibold">No (Pull API)</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pl-4 font-bold text-slate-900 dark:text-white">MedChain</td>
                  <td className="py-4 font-mono text-[10.5px]">Hyperledger PBFT</td>
                  <td className="py-4 text-slate-500 dark:text-slate-450">Session Tokens</td>
                  <td className="py-4 text-rose-500 dark:text-rose-400 font-semibold">No (Ledger Private)</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-450 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Yes (Ledger)
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4 text-emerald-600 dark:text-emerald-450 font-semibold">
                    Yes (Pub/Sub)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pl-4 font-bold text-slate-900 dark:text-white">HealthRec-Chain</td>
                  <td className="py-4 font-mono text-[10.5px]">Fabric Raft</td>
                  <td className="py-4 text-slate-500 dark:text-slate-450">Multi-Sign ACL</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-450 font-semibold">
                    Yes (Symmetric)
                  </td>
                  <td className="py-4 text-rose-500 dark:text-rose-400 font-semibold">Partial (Logs off-chain)</td>
                  <td className="py-4 text-right pr-4 text-rose-500 dark:text-rose-400 font-semibold">No (REST Pull)</td>
                </tr>
                <tr className="bg-purple-500/5 hover:bg-purple-500/10 text-purple-650 dark:text-purple-400 font-bold transition-all relative">
                  <td className="py-4 pl-4 font-extrabold text-slate-950 dark:text-white border-l-2 border-purple-500">Proposed Method</td>
                  <td className="py-4 font-mono text-[10.5px]">Fabric Raft/PBFT</td>
                  <td className="py-4 text-purple-650 dark:text-purple-400 font-bold">Adaptive (L0-L3 Drop)</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-450 font-extrabold">
                    Yes (Hybrid AES/RSA)
                  </td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-450 font-extrabold">
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      Yes (Immutable Event)
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4 text-emerald-600 dark:text-emerald-450 font-extrabold">
                    Yes (Real-time Live Sync)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
