import { useState, useEffect } from 'react'
import { 
  FiActivity, FiCpu, FiHardDrive, FiHash, 
  FiClock, FiTrendingUp, FiCheckCircle, FiAlertTriangle 
} from 'react-icons/fi'

// Helper names and files for live-updating data simulation
const doctors = ['Dr. Sarah Miller', 'Dr. James Watson', 'Dr. Helen Cho', 'Dr. Robert Carter', 'Dr. Emily Vance']
const patients = ['Alice Johnson', 'Bob Smith', 'Charlie Green', 'David Wright', 'Eva Adams']
const nurses = ['Nurse Kelly Smith', 'Nurse John Davis', 'Nurse Clara Barton']
const files = ['PAT-8820', 'PAT-3491', 'PAT-1092', 'PAT-5420', 'PAT-7731']

export default function Explorer() {
  // Stats
  const [totalBlocks, setTotalBlocks] = useState(412)
  const [totalTxs, setTotalTxs] = useState(1286)
  
  // Simulated initial blocks
  const [blocks, setBlocks] = useState([
    { number: 412, hash: '0x3f9e8a71c50b6912384a56c7d8e9f2b1d3c4a5b6', txCount: 2, size: '2.4 KB', time: '12s ago' },
    { number: 411, hash: '0x1a8f9c7b2d5e381049281a4b5d6e7f8a9b0c1d2e', txCount: 1, size: '1.2 KB', time: '15s ago' },
    { number: 410, hash: '0x8b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c', txCount: 3, size: '3.8 KB', time: '18s ago' },
    { number: 409, hash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e', txCount: 1, size: '1.1 KB', time: '21s ago' },
    { number: 408, hash: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d', txCount: 2, size: '2.5 KB', time: '24s ago' }
  ])

  // Simulated initial transactions
  const [txs, setTxs] = useState([
    { id: '0x9a8b7c6d5e4f3a2b', block: 412, sender: 'Dr. Sarah Miller', action: 'Doctor Viewed Record PAT-8820', status: 'Granted', time: '12:30:01 PM' },
    { id: '0x1a2b3c4d5e6f7a8b', block: 412, sender: 'Patient Alice Johnson', action: 'Uploaded File PAT-8820', status: 'Granted', time: '12:29:45 PM' },
    { id: '0x5e6f7a8b9c0d1e2f', block: 411, sender: 'Dr. James Watson', action: 'Doctor Viewed Record PAT-3491', status: 'Granted', time: '12:27:10 PM' },
    { id: '0x3a4b5c6d7e8f9a0b', block: 410, sender: 'Nurse Kelly Smith', action: 'Nurse Tried Record PAT-8820', status: 'Denied', time: '12:25:34 PM' }
  ])

  // Simulated initial activity feed
  const [feed, setFeed] = useState([
    { id: 1, type: 'read_success', text: 'Dr. Sarah Miller successfully accessed file PAT-8820', time: '12s ago', role: 'Doctor' },
    { id: 2, type: 'upload_success', text: 'Patient Alice Johnson uploaded case file PAT-8820', time: '13s ago', role: 'Patient' },
    { id: 3, type: 'read_denied', text: 'Access Denied: Nurse Kelly Smith tried reading file PAT-8820', time: '18s ago', role: 'Nurse' },
    { id: 4, type: 'register_success', text: 'New Doctor identity registered on Fabric ledger: Dr. Sarah Miller', time: '25s ago', role: 'Doctor' }
  ])



  useEffect(() => {
    // Refresh interval: run every 3 seconds
    const interval = setInterval(() => {
      // 1. Determine action types
      const types = ['read_success', 'read_denied', 'upload_success']
      const chosenType = types[Math.floor(Math.random() * types.length)]
      
      let eventText = ''
      let actionText = ''
      let sender = ''
      let status = 'Granted'

      if (chosenType === 'read_success') {
        sender = doctors[Math.floor(Math.random() * doctors.length)]
        const file = files[Math.floor(Math.random() * files.length)]
        actionText = `Doctor Viewed Record ${file}`
        eventText = `${sender} successfully accessed file ${file}`
      } else if (chosenType === 'read_denied') {
        sender = nurses[Math.floor(Math.random() * nurses.length)]
        const file = files[Math.floor(Math.random() * files.length)]
        actionText = `Nurse Tried Record ${file}`
        eventText = `Access Denied: ${sender} tried reading file ${file}`
        status = 'Denied'
      } else if (chosenType === 'upload_success') {
        sender = `Patient ${patients[Math.floor(Math.random() * patients.length)]}`
        const file = files[Math.floor(Math.random() * files.length)]
        actionText = `Uploaded File ${file}`
        eventText = `${sender} uploaded case file ${file}`
      }

      // 2. Increment stats
      const nextBlockNumber = blocks[0].number + 1
      const nextTxCount = Math.floor(Math.random() * 2) + 1 // 1 or 2 txs in block
      setTotalBlocks(nextBlockNumber)
      setTotalTxs(prev => prev + nextTxCount)

      // 3. Generate block hash
      const randomBlockHash = '0x' + Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')

      // 4. Generate transaction list for this block
      const newTransactions = []
      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      for (let i = 0; i < nextTxCount; i++) {
        const isPrimary = i === 0
        const currentTxSender = isPrimary ? sender : doctors[Math.floor(Math.random() * doctors.length)]
        const currentTxAction = isPrimary ? actionText : `Doctor Viewed Record ${files[Math.floor(Math.random() * files.length)]}`
        const currentTxStatus = isPrimary ? status : 'Granted'

        const randomTxId = '0x' + Array.from({ length: 16 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')

        newTransactions.push({
          id: randomTxId,
          block: nextBlockNumber,
          sender: currentTxSender,
          action: currentTxAction,
          status: currentTxStatus,
          time: timestampStr
        })
      }

      // 5. Prepend new Block
      const newBlock = {
        number: nextBlockNumber,
        hash: randomBlockHash,
        txCount: nextTxCount,
        size: `${(1.1 + Math.random() * 2).toFixed(1)} KB`,
        time: 'Just now'
      }

      // Update block list and transactions (limit arrays size to keep UI clean)
      setBlocks(prev => {
        const list = [newBlock, ...prev]
        return list.slice(0, 5)
      })

      setTxs(prev => {
        const list = [...newTransactions, ...prev]
        return list.slice(0, 6)
      })

      // Update timeline activity feed
      const newFeedItem = {
        id: Date.now(),
        type: chosenType,
        text: eventText,
        time: 'Just now',
        role: sender.includes('Nurse') ? 'Nurse' : sender.includes('Patient') ? 'Patient' : 'Doctor'
      }

      setFeed(prev => {
        const list = [newFeedItem, ...prev]
        return list.slice(0, 5)
      })

    }, 3000)

    return () => clearInterval(interval)
  }, [blocks])

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background radial glow */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-indigo-650/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-900/60 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <FiTrendingUp className="text-purple-650 dark:text-purple-400 animate-pulse" />
              Blockchain Explorer
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-xl">
              Inspect latest blocks, transactions, and live smart contract access requests committed to the Hyperledger Fabric channel.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3.5 py-2 rounded-xl text-emerald-600 dark:text-emerald-455 shadow-sm self-start md:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>LIVE SYNCING (3S REFRESH)</span>
          </div>
        </div>

        {/* Network Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 dark:hover:border-purple-900 transition-all duration-200">
            <div>
              <span className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider block">Total Blocks</span>
              <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1 block font-mono">{totalBlocks}</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FiHardDrive className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 dark:hover:border-purple-900 transition-all duration-200">
            <div>
              <span className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider block">Total Transactions</span>
              <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1 block font-mono">{totalTxs}</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FiHash className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 dark:hover:border-purple-900 transition-all duration-200">
            <div>
              <span className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider block">Connected Nodes</span>
              <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1 block font-mono">4 / 4</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FiCpu className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 dark:hover:border-purple-900 transition-all duration-200">
            <div>
              <span className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider block">Ledger Status</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-450 mt-1 block flex items-center gap-1.5 font-sans">
                <FiCheckCircle className="w-4 h-4 flex-shrink-0" />
                Operational
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center">
              <FiActivity className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Explorer Content Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Blocks & Transactions Tables */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Blocks Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none">
              <div className="mb-5 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Latest Block Commits</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5">Chronological record of mined blocks containing client cryptographic payloads.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 pl-2">Height</th>
                      <th className="pb-3">Block Hash</th>
                      <th className="pb-3">TXs</th>
                      <th className="pb-3">Size</th>
                      <th className="pb-3 text-right pr-2">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                    {blocks.map((block) => (
                      <tr key={block.number} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all group animate-fade-in">
                        <td className="py-3.5 pl-2 font-bold text-slate-950 dark:text-white font-mono">
                          #{block.number}
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-slate-550 dark:text-slate-400 max-w-[200px] truncate" title={block.hash}>
                          {block.hash}
                        </td>
                        <td className="py-3.5 text-slate-700 dark:text-slate-300 font-mono">
                          {block.txCount}
                        </td>
                        <td className="py-3.5 text-slate-700 dark:text-slate-305 font-mono">
                          {block.size}
                        </td>
                        <td className="py-3.5 text-right pr-2 text-slate-450 dark:text-slate-500 font-mono flex items-center justify-end gap-1">
                          <FiClock className="w-3 h-3 flex-shrink-0" />
                          {block.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none animate-slide-up">
              <div className="mb-5">
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Transaction Logs</h3>
                <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5">Attribute Verification and Key Access events resolved by smart contracts.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 pl-2">Transaction Hash</th>
                      <th className="pb-3">Block Number</th>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right pr-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                    {txs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all group animate-fade-in">
                        <td className="py-3.5 pl-2 font-mono text-[11px] text-purple-650 dark:text-purple-400 font-bold truncate max-w-[120px]" title={tx.id}>
                          {tx.id}
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-slate-650 dark:text-slate-400">
                          Block {tx.block}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {tx.sender}
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-350">
                          {tx.action}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            tx.status === 'Granted'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2 text-slate-450 dark:text-slate-500 font-mono">
                          {tx.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Activity Feed Section */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none h-full">
              <div className="mb-6">
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Access Activity Feed</h3>
                <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5">Immutable runtime timeline stream.</p>
              </div>

              {/* Timeline Items */}
              <div className="relative border-l border-slate-200 dark:border-slate-800/80 ml-3 pl-5 space-y-6">
                {feed.map((item) => {
                  let badgeColor = 'bg-purple-100 border-purple-200 text-purple-600 dark:bg-purple-950/30 dark:border-purple-900/30 dark:text-purple-400'
                  let icon = <FiCheckCircle className="w-3.5 h-3.5" />

                  if (item.type === 'read_success') {
                    badgeColor = 'bg-emerald-100 border-emerald-205 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/30 dark:text-emerald-400'
                  } else if (item.type === 'read_denied') {
                    badgeColor = 'bg-rose-100 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/30 dark:text-rose-400'
                    icon = <FiAlertTriangle className="w-3.5 h-3.5" />
                  }

                  return (
                    <div key={item.id} className="relative animate-fade-in">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[27px] top-1 rounded-full p-1 border flex items-center justify-center ${badgeColor}`}>
                        {icon}
                      </span>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[9px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wide bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded">
                            {item.role}
                          </span>
                          <span className="text-[9.5px] font-mono text-slate-450 dark:text-slate-500 flex items-center gap-0.5">
                            <FiClock className="w-2.5 h-2.5" />
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-250 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
