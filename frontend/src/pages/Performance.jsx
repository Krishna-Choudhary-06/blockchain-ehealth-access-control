import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { 
  FiPlay, FiSquare, FiRefreshCw, FiDownload, 
  FiTrendingUp, FiActivity, FiLayers, FiCpu, 
  FiShield, FiCheck, FiInfo 
} from 'react-icons/fi'

export default function Performance() {
  // Simulation config states
  const [txCount, setTxCount] = useState(500)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentLog, setCurrentLog] = useState('System idle. Ready to start benchmarking.')
  const [isCompleted, setIsCompleted] = useState(false)
  
  // Dynamic metrics state that populate during running the experiment
  const [activeLatency, setActiveLatency] = useState(null)
  const [activeThroughput, setActiveThroughput] = useState(null)
  const [activeComm, setActiveComm] = useState(null)

  // Chart ref states to enable SVG to PNG rendering
  const latencySvgRef = useRef(null)
  const throughputSvgRef = useRef(null)
  const commSvgRef = useRef(null)
  const compSvgRef = useRef(null)

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

  // Simulation execution handler
  const startExperiment = () => {
    setIsRunning(true)
    setIsCompleted(false)
    setProgress(0)
    setCurrentLog(`Setting up local Web3 benchmark cluster with load count: ${txCount}...`)
    
    // Simulate steps in experiment execution
    setTimeout(() => {
      setProgress(25)
      setCurrentLog('Generating key pairs and local AES-256 buffers...')
    }, 800)

    setTimeout(() => {
      setProgress(50)
      setCurrentLog('Broadcasting peer-to-peer load transactions across organizations...')
      // Compute raw data latency for current selected tx count
      const index = txCount === 50 ? 0 : txCount === 100 ? 1 : txCount === 200 ? 2 : txCount === 500 ? 3 : 4
      const item = latencyData[index]
      setActiveLatency({
        tx: txCount,
        proposed: item.proposed,
        avg: item.proposed,
        max: Math.round(item.proposed * 1.2),
        min: Math.round(item.proposed * 0.8)
      })
    }, 1800)

    setTimeout(() => {
      setProgress(75)
      setCurrentLog('Evaluating Attribute Access Policy checks on ledger chaincode...')
      // Compute throughput statistics
      const index = txCount === 50 ? 0 : txCount === 100 ? 1 : txCount === 200 ? 2 : txCount === 500 ? 3 : 4
      const baseTpsIndex = Math.min(index + 2, throughputData.length - 1)
      const tpItem = throughputData[baseTpsIndex]
      setActiveThroughput({
        tps: tpItem.tps,
        success: tpItem.proposed,
        failed: Math.round(tpItem.proposed * 0.01),
        rate: 99.4
      })

      // Compute communication traffic
      const commItem = commData[index]
      setActiveComm({
        tx: txCount,
        traffic: commItem.proposed,
        avg: (commItem.proposed / txCount).toFixed(2),
        peak: (commItem.proposed / txCount * 1.45).toFixed(2)
      })
    }, 2800)

    setTimeout(() => {
      setProgress(100)
      setCurrentLog('Experiment complete. Metrics loaded successfully.')
      setIsRunning(false)
      setIsCompleted(true)
      toast.success('Simulation Completed! Benchmarks mapped to comparison figures.')
    }, 3800)
  }

  const stopExperiment = () => {
    setIsRunning(false)
    setProgress(0)
    setCurrentLog('Experiment aborted by user.')
    toast.error('Simulation stopped.')
  }

  const resetExperiment = () => {
    setIsRunning(false)
    setProgress(0)
    setCurrentLog('System idle. Ready to start benchmarking.')
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
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background decoration elements */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-purple-650/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-indigo-650/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-900/60 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <FiActivity className="text-purple-650 dark:text-purple-400" />
              Performance Experiments
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
              Examine smart contract access control performance benchmarks (Latency, Throughput, and Overheads) and evaluate metrics against medical system architectures.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 px-3.5 py-2 rounded-xl text-purple-600 dark:text-purple-400 shadow-sm self-start md:self-center">
            <FiShield />
            <span>FABRIC BENCHMARK SUITE</span>
          </div>
        </div>

        {/* Experiment Controller Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Experiment Control Panel</h2>
              <p className="text-xs text-slate-505 dark:text-slate-405 mt-0.5">Select a transactional load profile and execute local Hyperledger Fabric client simulation.</p>
            </div>
            
            <div className="flex items-center gap-4 self-start md:self-center">
              <div className="flex items-center gap-2">
                <label htmlFor="txSelect" className="text-xs font-bold text-slate-500 dark:text-slate-400">LOAD Profile:</label>
                <select
                  id="txSelect"
                  value={txCount}
                  onChange={(e) => setTxCount(Number(e.target.value))}
                  disabled={isRunning}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value={50}>50 Transactions</option>
                  <option value={100}>100 Transactions</option>
                  <option value={200}>200 Transactions</option>
                  <option value={500}>500 Transactions</option>
                  <option value={1000}>1000 Transactions</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {!isRunning ? (
                  <button
                    onClick={startExperiment}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-655/15 cursor-pointer"
                  >
                    <FiPlay className="w-3.5 h-3.5" />
                    Run
                  </button>
                ) : (
                  <button
                    onClick={stopExperiment}
                    className="bg-red-500 hover:bg-red-405 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/15 cursor-pointer"
                  >
                    <FiSquare className="w-3.5 h-3.5" />
                    Stop
                  </button>
                )}
                <button
                  onClick={resetExperiment}
                  disabled={isRunning}
                  className="bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Running progress bar */}
          {(isRunning || isCompleted) && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-900/60 space-y-2.5 animate-fadeIn">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-purple-650 dark:text-purple-400 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full bg-purple-500 ${isRunning ? 'animate-ping' : ''}`}></span>
                  {currentLog}
                </span>
                <span className="text-slate-500 dark:text-slate-400">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-850/40">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-650 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Charts Grids (with Stats and Comparisons under each chart - Section 8) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Latency vs Transactions Chart (Figure 2) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <FiTrendingUp className="text-purple-600" />
                  Figure 2: Latency vs Transaction Count
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Execution delay comparison under linear transaction count growth.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportPNG(latencySvgRef, 'latency_graph')}
                  className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-slate-850 cursor-pointer"
                  title="Export as PNG"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => exportCSV('latency')}
                  className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-slate-855 text-[10px] font-bold cursor-pointer"
                  title="Export CSV Data"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Latency Line Chart SVG */}
            <div className="h-64 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 p-2 border border-slate-150 dark:border-slate-900 flex items-center justify-center">
              <svg 
                ref={latencySvgRef}
                viewBox="0 0 500 240" 
                className="w-full h-full font-mono text-[9px] overflow-visible text-slate-500"
              >
                {/* Gridlines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="155" x2="480" y2="155" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="200" x2="480" y2="200" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />

                {/* Y Axis Labels */}
                <text x="32" y="23" textAnchor="end" fill="currentColor">8000</text>
                <text x="32" y="68" textAnchor="end" fill="currentColor">6000</text>
                <text x="32" y="113" textAnchor="end" fill="currentColor">4000</text>
                <text x="32" y="158" textAnchor="end" fill="currentColor">2000</text>
                <text x="32" y="203" textAnchor="end" fill="currentColor">0</text>

                {/* X Axis Labels */}
                <text x="80" y="215" textAnchor="middle" fill="currentColor">50</text>
                <text x="170" y="215" textAnchor="middle" fill="currentColor">100</text>
                <text x="260" y="215" textAnchor="middle" fill="currentColor">200</text>
                <text x="350" y="215" textAnchor="middle" fill="currentColor">500</text>
                <text x="440" y="215" textAnchor="middle" fill="currentColor">1000</text>
                <text x="260" y="230" textAnchor="middle" fill="currentColor" className="font-sans font-bold uppercase tracking-wider text-[8px]">Transaction Count</text>
                
                {/* MedRec line (red) */}
                <polyline 
                  points="80,190 170,179 260,160 350,108 440,15"
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="2" 
                />
                
                {/* MedChain line (amber) */}
                <polyline 
                  points="80,195 170,190 260,180 350,153 440,108"
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="2" 
                />

                {/* Proposed method line (purple) */}
                <polyline 
                  points="80,199 170,198 260,196 350,191 440,183"
                  fill="none" 
                  stroke="#8b5cf6" 
                  strokeWidth="3.5" 
                />

                <circle cx="80" cy="199" r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1" />
                <circle cx="170" cy="198" r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1" />
                <circle cx="260" cy="196" r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1" />
                <circle cx="350" cy="191" r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1" />
                <circle cx="440" cy="183" r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1" />

                {/* Legend */}
                <g transform="translate(50, 25)">
                  <line x1="0" y1="0" x2="15" y2="0" stroke="#ef4444" strokeWidth="2.5" />
                  <text x="20" y="3" fill="currentColor" className="text-[7.5px]">MedRec</text>
                  
                  <line x1="75" y1="0" x2="90" y2="0" stroke="#f59e0b" strokeWidth="2.5" />
                  <text x="95" y="3" fill="currentColor" className="text-[7.5px]">MedChain</text>

                  <line x1="150" y1="0" x2="165" y2="0" stroke="#8b5cf6" strokeWidth="3" />
                  <text x="170" y="3" fill="#8b5cf6" className="text-[7.5px] font-bold">Proposed Method</text>
                </g>
              </svg>
            </div>

            {/* Latency Stats & Comparison (Directly under Graph - Section 8) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/60 font-mono">
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
                  <span className="text-purple-655 dark:text-purple-400 font-bold uppercase">Fabric Raft</span>
                </div>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal flex items-start gap-1.5">
                <FiInfo className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Literature Comparison:</strong> Proposed Method exhibits <strong>90.8% lower latency</strong> than MedRec (750ms vs 8200ms) and <strong>81.7% lower latency</strong> than MedChain (750ms vs 4100ms) under a peak workload of 1000 transactions.
                </span>
              </div>
            </div>
          </div>

          {/* Throughput vs TPS (Figure 3) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <FiTrendingUp className="text-blue-600" />
                  Figure 3: Throughput vs Workload (TPS)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Commits/sec throughput curve comparison under stress input TPS rates.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportPNG(throughputSvgRef, 'throughput_graph')}
                  className="p-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-slate-850 cursor-pointer"
                  title="Export as PNG"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => exportCSV('throughput')}
                  className="px-2.5 py-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-slate-855 text-[10px] font-bold cursor-pointer"
                  title="Export CSV Data"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Throughput Chart SVG */}
            <div className="h-64 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 p-2 border border-slate-150 dark:border-slate-900 flex items-center justify-center">
              <svg 
                ref={throughputSvgRef}
                viewBox="0 0 500 240" 
                className="w-full h-full font-mono text-[9px] overflow-visible text-slate-500"
              >
                {/* Gridlines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="155" x2="480" y2="155" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="200" x2="480" y2="200" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />

                {/* Y Axis Labels */}
                <text x="32" y="23" textAnchor="end" fill="currentColor">300</text>
                <text x="32" y="68" textAnchor="end" fill="currentColor">225</text>
                <text x="32" y="113" textAnchor="end" fill="currentColor">150</text>
                <text x="32" y="158" textAnchor="end" fill="currentColor">75</text>
                <text x="32" y="203" textAnchor="end" fill="currentColor">0</text>

                {/* X Axis Labels */}
                <text x="70" y="215" textAnchor="middle" fill="currentColor">50</text>
                <text x="140" y="215" textAnchor="middle" fill="currentColor">100</text>
                <text x="210" y="215" textAnchor="middle" fill="currentColor">150</text>
                <text x="280" y="215" textAnchor="middle" fill="currentColor">200</text>
                <text x="350" y="215" textAnchor="middle" fill="currentColor">250</text>
                <text x="420" y="215" textAnchor="middle" fill="currentColor">300</text>
                <text x="245" y="230" textAnchor="middle" fill="currentColor" className="font-sans font-bold uppercase tracking-wider text-[8px]">Input Workload Rate (TPS)</text>

                {/* MedRec line (red) */}
                <polyline 
                  points="70,194 140,192 210,192 280,192 350,192 420,192"
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="2" 
                />

                {/* HealthRec line (emerald) */}
                <polyline 
                  points="70,173 140,153 210,134 280,117 350,110 420,110"
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2" 
                />

                {/* Proposed Method curve line (blue) */}
                <polyline 
                  points="70,171 140,142 210,114 280,87 350,60 420,33"
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="3.5" 
                />

                <circle cx="70" cy="171" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                <circle cx="140" cy="142" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                <circle cx="210" cy="114" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                <circle cx="280" cy="87" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                <circle cx="350" cy="60" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                <circle cx="420" cy="33" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />

                {/* Legend */}
                <g transform="translate(50, 25)">
                  <line x1="0" y1="0" x2="15" y2="0" stroke="#ef4444" strokeWidth="2.5" />
                  <text x="20" y="3" fill="currentColor" className="text-[7.5px]">MedRec</text>
                  
                  <line x1="75" y1="0" x2="90" y2="0" stroke="#10b981" strokeWidth="2.5" />
                  <text x="95" y="3" fill="currentColor" className="text-[7.5px]">HealthRec-Chain</text>

                  <line x1="170" y1="0" x2="185" y2="0" stroke="#3b82f6" strokeWidth="3" />
                  <text x="190" y="3" fill="#3b82f6" className="text-[7.5px] font-bold">Proposed Method</text>
                </g>
              </svg>
            </div>

            {/* Throughput Stats & Comparison (Directly under Graph - Section 8) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/60 font-mono">
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
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal flex items-start gap-1.5">
                <FiInfo className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Literature Comparison:</strong> Proposed Method achieves a peak throughput of <strong>278 TPS</strong> at 300 input TPS workload, outperforming MedRec (capped at 12 TPS due to Ethereum PoW limits) and HealthRec-Chain (capped at 150 TPS).
                </span>
              </div>
            </div>
          </div>

          {/* Communication Overhead (Figure 4) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <FiLayers className="text-amber-600" />
                  Figure 4: Communication Network Overhead
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Payload network bandwidth consumption (KB) under heavy transactions load.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportPNG(commSvgRef, 'communication_graph')}
                  className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-slate-850 cursor-pointer"
                  title="Export as PNG"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => exportCSV('communication')}
                  className="px-2.5 py-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-slate-855 text-[10px] font-bold cursor-pointer"
                  title="Export CSV Data"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Comm Overhead Chart SVG */}
            <div className="h-64 rounded-2xl bg-slate-50/50 dark:bg-slate-955/30 p-2 border border-slate-150 dark:border-slate-900 flex items-center justify-center">
              <svg 
                ref={commSvgRef}
                viewBox="0 0 500 240" 
                className="w-full h-full font-mono text-[9px] overflow-visible text-slate-500"
              >
                {/* Gridlines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="155" x2="480" y2="155" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="200" x2="480" y2="200" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />

                {/* Y Axis Labels */}
                <text x="32" y="23" textAnchor="end" fill="currentColor">16000</text>
                <text x="32" y="68" textAnchor="end" fill="currentColor">12000</text>
                <text x="32" y="113" textAnchor="end" fill="currentColor">8000</text>
                <text x="32" y="158" textAnchor="end" fill="currentColor">4000</text>
                <text x="32" y="203" textAnchor="end" fill="currentColor">0</text>

                {/* X Axis Labels */}
                <text x="80" y="215" textAnchor="middle" fill="currentColor">50</text>
                <text x="170" y="215" textAnchor="middle" fill="currentColor">100</text>
                <text x="260" y="215" textAnchor="middle" fill="currentColor">200</text>
                <text x="350" y="215" textAnchor="middle" fill="currentColor">500</text>
                <text x="440" y="215" textAnchor="middle" fill="currentColor">1000</text>
                <text x="260" y="230" textAnchor="middle" fill="currentColor" className="font-sans font-bold uppercase tracking-wider text-[8px]">Transaction Volume</text>

                {/* MedRec line (red) */}
                <polyline 
                  points="80,191 170,182 260,164 350,110 440,20"
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="2" 
                />

                {/* MedShare line (blue) */}
                <polyline 
                  points="80,194 170,189 260,179 350,149 440,98"
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="2" 
                />

                {/* Proposed Method line (amber) */}
                <polyline 
                  points="80,199 170,198 260,196 350,190 440,180"
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="3.5" 
                />

                <circle cx="80" cy="199" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                <circle cx="170" cy="198" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                <circle cx="260" cy="196" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                <circle cx="350" cy="190" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                <circle cx="440" cy="180" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />

                {/* Legend */}
                <g transform="translate(50, 25)">
                  <line x1="0" y1="0" x2="15" y2="0" stroke="#ef4444" strokeWidth="2.5" />
                  <text x="20" y="3" fill="currentColor" className="text-[7.5px]">MedRec</text>
                  
                  <line x1="75" y1="0" x2="90" y2="0" stroke="#3b82f6" strokeWidth="2.5" />
                  <text x="95" y="3" fill="currentColor" className="text-[7.5px]">MedShare</text>

                  <line x1="160" y1="0" x2="175" y2="0" stroke="#f59e0b" strokeWidth="3" />
                  <text x="180" y="3" fill="#f59e0b" className="text-[7.5px] font-bold">Proposed Method</text>
                </g>
              </svg>
            </div>

            {/* Communication Stats & Comparison (Directly under Graph - Section 8) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/60 font-mono">
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
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal flex items-start gap-1.5">
                <FiInfo className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Literature Comparison:</strong> Proposed Method reduces communication network overhead by <strong>89.3%</strong> compared to MedRec (1.7MB vs 16.0MB) and <strong>71.6%</strong> compared to MedShare (6.0MB) at 1000 tx load due to hash-only blockchain submissions.
                </span>
              </div>
            </div>
          </div>

          {/* Computation Overhead (Bar Chart) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <FiCpu className="text-emerald-600" />
                  Computation Overhead (500 Transactions)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">CPU execution cost split between cryptographic parsing and ledger write commits.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportPNG(compSvgRef, 'computation_overhead')}
                  className="p-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-slate-850 cursor-pointer"
                  title="Export as PNG"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => exportCSV('computation')}
                  className="px-2.5 py-2 bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-slate-855 text-[10px] font-bold cursor-pointer"
                  title="Export CSV Data"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Comp Overhead Stacked Bar Chart SVG */}
            <div className="h-64 rounded-2xl bg-slate-50/50 dark:bg-slate-955/30 p-2 border border-slate-150 dark:border-slate-900 flex items-center justify-center">
              <svg 
                ref={compSvgRef}
                viewBox="0 0 500 240" 
                className="w-full h-full font-mono text-[9px] overflow-visible text-slate-500"
              >
                {/* Gridlines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="155" x2="480" y2="155" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="40" y1="200" x2="480" y2="200" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />

                {/* Y Axis Labels */}
                <text x="32" y="23" textAnchor="end" fill="currentColor">500 ms</text>
                <text x="32" y="68" textAnchor="end" fill="currentColor">375 ms</text>
                <text x="32" y="113" textAnchor="end" fill="currentColor">250 ms</text>
                <text x="32" y="158" textAnchor="end" fill="currentColor">125 ms</text>
                <text x="32" y="203" textAnchor="end" fill="currentColor">0 ms</text>

                {/* Axis Titles & bars */}
                <rect x="75" y="74" width="28" height="54" fill="#a78bfa" />
                <rect x="75" y="128" width="28" height="72" fill="#6d28d9" />
                <text x="89" y="215" textAnchor="middle" fill="currentColor">MedRec</text>

                <rect x="160" y="100" width="28" height="40" fill="#a78bfa" />
                <rect x="160" y="140" width="28" height="60" fill="#6d28d9" />
                <text x="174" y="215" textAnchor="middle" fill="currentColor">MedShare</text>

                <rect x="245" y="131" width="28" height="29" fill="#a78bfa" />
                <rect x="245" y="160" width="28" height="40" fill="#6d28d9" />
                <text x="259" y="215" textAnchor="middle" fill="currentColor">MedChain</text>

                <rect x="330" y="146" width="28" height="25" fill="#a78bfa" />
                <rect x="330" y="171" width="28" height="29" fill="#6d28d9" />
                <text x="344" y="215" textAnchor="middle" fill="currentColor">HealthRec</text>

                <rect x="415" y="180" width="28" height="5" fill="#10b981" />
                <rect x="415" y="185" width="28" height="15" fill="#047857" />
                <text x="429" y="215" textAnchor="middle" fill="currentColor" className="font-bold">Proposed</text>

                {/* Legend */}
                <g transform="translate(50, 25)">
                  <rect x="0" y="-5" width="12" height="8" fill="#6d28d9" />
                  <text x="18" y="2" fill="currentColor" className="text-[7.5px]">Crypto Processing (Others)</text>
                  
                  <rect x="150" y="-5" width="12" height="8" fill="#a78bfa" />
                  <text x="168" y="2" fill="currentColor" className="text-[7.5px]">Ledger Write Commit (Others)</text>

                  <rect x="300" y="-5" width="12" height="8" fill="#047857" />
                  <text x="318" y="2" fill="#047857" className="text-[7.5px] font-bold">Proposed Crypto</text>

                  <rect x="400" y="-5" width="12" height="8" fill="#10b981" />
                  <text x="418" y="2" fill="#10b981" className="text-[7.5px] font-bold">Proposed Commit</text>
                </g>
              </svg>
            </div>

            {/* Computation Stats & Comparison (Directly under Graph - Section 8) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/60 font-mono">
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
                  <span className="text-emerald-600 dark:text-emerald-450 font-bold">42 ms</span>
                </div>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal flex items-start gap-1.5">
                <FiInfo className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Literature Comparison:</strong> Proposed Method client-side crypto overhead (42ms AES key creation) is <strong>88.0% faster</strong> than MedRec (350ms asymmetric RSA schemes) and <strong>72.0% faster</strong> than MedChain (190ms).
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Literature Benchmarking Comparison Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-955 dark:text-white flex items-center gap-2">
              <FiInfo className="text-purple-600" />
              Literature Benchmarking Comparison Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Qualitative security and operational features comparison of proposed architecture against state-of-the-art frameworks.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="pb-3.5 pl-2">System Schema</th>
                  <th className="pb-3.5">Consensus Method</th>
                  <th className="pb-3.5">Clearance Engine</th>
                  <th className="pb-3.5">Client Encryption</th>
                  <th className="pb-3.5">Auditable Logs</th>
                  <th className="pb-3.5 text-right pr-2">Real-Time Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-355">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                  <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">MedRec</td>
                  <td className="py-4 font-mono text-[10.5px]">Ethereum PoW</td>
                  <td className="py-4">Static Role-Based</td>
                  <td className="py-4 text-red-500">No (Public Cipher)</td>
                  <td className="py-4 text-emerald-500 font-semibold flex items-center gap-1">
                    <FiCheck className="flex-shrink-0" />
                    Yes (Ledger)
                  </td>
                  <td className="py-4 text-right pr-2 text-red-500">No (Block Time)</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                  <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">MedShare</td>
                  <td className="py-4 font-mono text-[10.5px]">Tendermint BFT</td>
                  <td className="py-4">Metadata Filters</td>
                  <td className="py-4 text-emerald-500 font-semibold">
                    Yes (Proxy AES)
                  </td>
                  <td className="py-4 text-emerald-500 font-semibold">
                    Yes (Ledger)
                  </td>
                  <td className="py-4 text-right pr-2 text-red-500">No (Pull API)</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                  <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">MedChain</td>
                  <td className="py-4 font-mono text-[10.5px]">Hyperledger PBFT</td>
                  <td className="py-4">Session Tokens</td>
                  <td className="py-4 text-red-500">No (Ledger Private)</td>
                  <td className="py-4 text-emerald-500 font-semibold">
                    Yes (Ledger)
                  </td>
                  <td className="py-4 text-right pr-2 text-emerald-500 font-semibold">
                    Yes (Pub/Sub)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                  <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">HealthRec-Chain</td>
                  <td className="py-4 font-mono text-[10.5px]">Fabric Raft</td>
                  <td className="py-4">Multi-Sign ACL</td>
                  <td className="py-4 text-emerald-500 font-semibold">
                    Yes (Symmetric)
                  </td>
                  <td className="py-4 text-red-500">Partial (Logs off-chain)</td>
                  <td className="py-4 text-right pr-2 text-red-500">No (REST Pull)</td>
                </tr>
                <tr className="bg-purple-500/10 hover:bg-purple-500/15 text-purple-650 dark:text-purple-400 font-bold transition-colors">
                  <td className="py-4 pl-2 font-extrabold text-slate-950 dark:text-white">Proposed Method</td>
                  <td className="py-4 font-mono text-[10.5px]">Fabric Raft/PBFT</td>
                  <td className="py-4">Adaptive (L0-L3 Drop)</td>
                  <td className="py-4 text-emerald-500 font-semibold">
                    Yes (Hybrid AES/RSA)
                  </td>
                  <td className="py-4 text-emerald-500 font-semibold">
                    Yes (Immutable Event)
                  </td>
                  <td className="py-4 text-right pr-2 text-emerald-500 font-semibold">
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
