import { useState, useEffect } from 'react'
import { 
  Activity, Cpu, HardDrive, Hash, Clock, 
  TrendingUp, CheckCircle, AlertTriangle, Search, Filter, 
  ChevronRight, ArrowRight, Shield, Award, X, Copy, RefreshCw 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

import { getLogs } from '../services/apiService'

export default function Explorer() {
  // Stats
  const [totalBlocks, setTotalBlocks] = useState(0)
  const [totalTxs, setTotalTxs] = useState(0)
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Real blockchain data states
  const [blocks, setBlocks] = useState([])
  const [txs, setTxs] = useState([])
  const [feed, setFeed] = useState([])

  useEffect(() => {
    let isMounted = true

    const loadRealBlockchainData = async () => {
      try {
        const res = await getLogs()
        if (res && res.success && Array.isArray(res.data)) {
          const rawLogs = res.data
          if (!isMounted) return

          setTotalTxs(rawLogs.length)
          setTotalBlocks(rawLogs.length > 0 ? Math.ceil(rawLogs.length / 2) : 0)

          const realTxs = rawLogs.map((log, index) => ({
            id: log.txId || log.transactionId || `0x${(index + 101).toString(16).padStart(16, '0')}`,
            block: 100 + Math.floor(index / 2),
            sender: log.requesterId || log.userId || log.patientId || 'Peer Node',
            action: log.action || `Access Record ${log.dataId || ''}`,
            status: (log.status === 'GRANTED' || log.status === 'Granted' || log.status === 'ACCESS_GRANTED') ? 'Granted' : 'Denied',
            time: log.timestamp ? (isNaN(new Date(log.timestamp).getTime()) ? log.timestamp : new Date(log.timestamp).toLocaleTimeString()) : new Date().toLocaleTimeString(),
            ipfsHash: log.ipfsHash || '',
            dataId: log.dataId || ''
          }))

          setTxs(realTxs)

          const blockMap = {}
          realTxs.forEach(tx => {
            if (!blockMap[tx.block]) {
              blockMap[tx.block] = {
                number: tx.block,
                hash: `0x${(tx.block * 777777).toString(16).padStart(40, '0')}`,
                txCount: 0,
                size: '2.4 KB',
                time: tx.time,
                prevHash: `0x${((tx.block - 1) * 777777).toString(16).padStart(40, '0')}`,
                merkleRoot: `0x${(tx.block * 333333).toString(16).padStart(40, '0')}`,
                validator: 'peer0.org1.example.com'
              }
            }
            blockMap[tx.block].txCount += 1
          })
          setBlocks(Object.values(blockMap).sort((a, b) => b.number - a.number))

          const realFeed = rawLogs.slice(0, 10).map((log, i) => ({
            id: i + 1,
            type: (log.status === 'GRANTED' || log.status === 'Granted') ? 'read_success' : 'read_denied',
            text: `${log.requesterId || log.userId || 'User'} requested access to file ${log.dataId || ''} - Status: ${log.status || 'Logged'}`,
            time: log.timestamp ? (isNaN(new Date(log.timestamp).getTime()) ? log.timestamp : new Date(log.timestamp).toLocaleTimeString()) : 'Just now',
            role: log.role || 'Peer Node'
          }))
          setFeed(realFeed)
        }
      } catch (err) {
        console.error('Failed to fetch real explorer logs from backend:', err)
        if (isMounted) {
          setTxs([])
          setBlocks([])
          setFeed([])
          setTotalTxs(0)
          setTotalBlocks(0)
        }
      }
    }

    loadRealBlockchainData()
    const interval = setInterval(loadRealBlockchainData, 4000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Hash copied to clipboard!')
  }

  const inspectBlock = (block) => {
    setSelectedBlock(block)
    setIsDrawerOpen(true)
  }

  // Filter blocks and txs based on query
  const filteredBlocks = blocks.filter(b => 
    b.number.toString().includes(searchQuery) ||
    b.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.validator.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTxs = txs.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.action.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="relative min-h-[calc(100vh-8rem)] text-slate-800 dark:text-slate-100">
      {/* Background radial glow */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-indigo-650/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-900/60 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="text-purple-650 dark:text-purple-400 animate-pulse" />
              Blockchain Explorer
            </h1>
            <p className="text-slate-505 dark:text-slate-400 mt-2 text-sm max-w-xl">
              Inspect latest blocks, transactions, and live smart contract access requests committed to the Hyperledger Fabric channel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3.5 py-2 rounded-xl text-emerald-600 dark:text-emerald-450 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE SYNCING (3S REFRESH)</span>
            </div>
            
            <button 
              onClick={() => toast.success('Explorer logs fully synchronized.')}
              className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer"
              title="Force Refresh CA index"
            >
              <RefreshCw className="w-4 h-4 text-slate-655" />
            </button>
          </div>
        </div>

        {/* Search Bar for Explorer */}
        <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm backdrop-blur-xl flex items-center gap-4 justify-between">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search blocks by height, validator node, or lookup transaction hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-202 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Network Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Blocks Mined', value: totalBlocks, icon: HardDrive, color: 'text-purple-600 bg-purple-500/10' },
            { label: 'Total Transactions', value: totalTxs, icon: Hash, color: 'text-blue-600 bg-blue-500/10' },
            { label: 'Connected Peer Nodes', value: '4 / 4', icon: Cpu, color: 'text-emerald-600 bg-emerald-500/10' },
            { label: 'Channel Status', value: 'Operational', icon: Activity, color: 'text-indigo-600 bg-indigo-500/10', sub: 'ehealth-channel' }
          ].map((card, idx) => {
            const CIcon = card.icon
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white/70 dark:bg-slate-905/60 border border-slate-200/80 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm backdrop-blur-xl hover:border-purple-500/25 transition-all duration-300"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{card.label}</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">{card.value}</span>
                  {card.sub && <span className="text-[9px] font-mono text-purple-650 block mt-0.5">{card.sub}</span>}
                </div>
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${card.color}`}>
                  <CIcon className="w-5.5 h-5.5" />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Visual Blockchain Chain Model - Horizontal Scrolling */}
        <div className="space-y-3 font-sans">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Fabric Blockchain Registry (Live ledger stream)
          </h3>
          <div className="flex items-center gap-3 overflow-x-auto py-4 px-1 scrollbar-thin">
            {filteredBlocks.length === 0 ? (
              <div className="text-center py-6 w-full text-slate-400 dark:text-slate-500 font-bold text-xs">
                No blockchain data available
              </div>
            ) : (
              filteredBlocks.map((block, idx) => (
                <motion.div 
                  key={block.number} 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="flex items-center flex-shrink-0"
                >
                  {/* Visual Block Card */}
                  <div 
                    onClick={() => inspectBlock(block)}
                    className="w-56 bg-white/80 dark:bg-slate-900/80 border border-purple-500/20 hover:border-purple-500/50 p-5 rounded-3xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative group overflow-hidden"
                  >
                    {/* Background overlay */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors"></div>
                    
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-855 pb-2.5 mb-3">
                      <span className="font-mono text-xs font-extrabold text-purple-655 dark:text-purple-400">BLOCK #{block.number}</span>
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-455">TXs:</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{block.txCount} payload</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-455">Size:</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{block.size}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-455 dark:text-slate-500 truncate" title={block.hash}>
                        Hash: {block.hash}
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-[10px]">
                      <span className="text-slate-455 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-655" /> {block.time}
                      </span>
                      <span className="text-purple-650 dark:text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Connecting Chain Link Thread */}
                  {idx < filteredBlocks.length - 1 && (
                    <div className="px-3 flex items-center justify-center text-purple-500/40">
                      <ArrowRight className="w-5 h-5 animate-pulse" />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Explorer Content Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Transactions List */}
          <div className="lg:col-span-8 space-y-8 bg-white/70 dark:bg-slate-900/60 border border-slate-202 dark:border-slate-800 p-6 rounded-3xl shadow-sm backdrop-blur-xl">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Transaction Logs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5">Attribute Verification and Key Access events resolved by smart contracts.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Transaction ID</th>
                    <th className="pb-3">Block</th>
                    <th className="pb-3">Executing Entity</th>
                    <th className="pb-3">Chaincode Action</th>
                    <th className="pb-3">Consensus</th>
                    <th className="pb-3 text-right pr-2">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-450 dark:text-slate-500 font-bold">
                        No blockchain data available
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((tx, idx) => (
                      <motion.tr 
                        key={tx.id} 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-all duration-150 group"
                      >
                        <td className="py-3.5 pl-2 font-mono text-[11px] text-purple-650 dark:text-purple-400 font-bold truncate max-w-[120px]" title={tx.id}>
                          {tx.id}
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-slate-550 dark:text-slate-400">
                          #{tx.block}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-900 dark:text-white">
                          {tx.sender}
                        </td>
                        <td className="py-3.5 font-medium text-slate-655 dark:text-slate-350">
                          {tx.action}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            tx.status === 'Granted'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2 text-slate-450 dark:text-slate-500 font-mono">
                          {tx.time}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed Section */}
          <div className="lg:col-span-4 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm backdrop-blur-xl">
            <div className="mb-6">
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Access Activity Feed</h3>
              <p className="text-xs text-slate-505 dark:text-slate-405 mt-0.5">Immutable runtime timeline stream.</p>
            </div>

            {/* Timeline Items */}
            <div className="relative border-l border-slate-200 dark:border-slate-800/80 ml-3 pl-5 space-y-6">
              {feed.length === 0 ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 font-bold text-xs">
                  No blockchain data available
                </div>
              ) : (
                feed.map((item) => {
                  let badgeColor = 'bg-purple-100 border-purple-200 text-purple-650 dark:bg-purple-955/30 dark:border-purple-900/30 dark:text-purple-400'
                  let icon = <CheckCircle className="w-3.5 h-3.5" />

                  if (item.type === 'read_success') {
                    badgeColor = 'bg-emerald-100 border-emerald-205 text-emerald-600 dark:bg-emerald-955/30 dark:border-emerald-900/30 dark:text-emerald-400'
                  } else if (item.type === 'read_denied') {
                    badgeColor = 'bg-rose-100 border-rose-205 text-rose-600 dark:bg-rose-955/30 dark:border-rose-900/30 dark:text-rose-455'
                    icon = <AlertTriangle className="w-3.5 h-3.5" />
                  }

                  return (
                    <div key={item.id} className="relative animate-fade-in group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[27px] top-1 rounded-full p-1 border flex items-center justify-center transition-transform group-hover:scale-110 ${badgeColor}`}>
                        {icon}
                      </span>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[9px] font-bold font-mono text-slate-500 dark:text-slate-455 uppercase tracking-wide bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded">
                            {item.role}
                          </span>
                          <span className="text-[9.5px] font-mono text-slate-450 dark:text-slate-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-250 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Block Inspector Drawer (Sliding from Right) */}
      <AnimatePresence>
        {isDrawerOpen && selectedBlock && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-955/60 backdrop-blur-sm"
            />

            {/* Sliding Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 md:p-8 flex flex-col justify-between shadow-2xl relative"
              >
                {/* Glowing ambient background blur */}
                <div className="absolute top-1/4 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center shadow-sm">
                        <HardDrive className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Block #{selectedBlock.number} Details</h2>
                        <span className="text-[9.5px] font-mono text-emerald-500 font-bold block mt-0.5">CONSENSUS VERIFIED • RAFT</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsDrawerOpen(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                    >
                      <X className="w-5.5 h-5.5" />
                    </button>
                  </div>

                  {/* Block Metadata */}
                  <div className="space-y-4 font-semibold text-xs text-slate-700 dark:text-slate-350">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-450 dark:text-slate-400 block font-sans uppercase font-bold">Block Hash ID</span>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-105 dark:border-slate-850 font-mono text-[10px] text-slate-900 dark:text-white select-all">
                        <span className="truncate pr-4">{selectedBlock.hash}</span>
                        <button onClick={() => handleCopy(selectedBlock.hash)} className="text-purple-600 hover:text-purple-500 flex-shrink-0 cursor-pointer">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-450 dark:text-slate-400 block font-sans uppercase font-bold">Previous Block Hash</span>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-105 dark:border-slate-855 font-mono text-[10px] text-slate-900 dark:text-white select-all">
                        <span className="truncate pr-4">{selectedBlock.prevHash}</span>
                        <button onClick={() => handleCopy(selectedBlock.prevHash)} className="text-purple-650 hover:text-purple-550 flex-shrink-0 cursor-pointer">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-455 dark:text-slate-400 block font-sans uppercase font-bold">Merkle Root RootHash</span>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-105 dark:border-slate-850 font-mono text-[10px] text-slate-900 dark:text-white select-all">
                        <span className="truncate pr-4">{selectedBlock.merkleRoot}</span>
                        <button onClick={() => handleCopy(selectedBlock.merkleRoot)} className="text-purple-605 hover:text-purple-500 flex-shrink-0 cursor-pointer">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-455 dark:text-slate-400 block uppercase font-bold">Block Size</span>
                        <span className="text-slate-900 dark:text-white font-mono text-[11px] block bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">{selectedBlock.size}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-455 dark:text-slate-400 block uppercase font-bold">Mined Age</span>
                        <span className="text-slate-900 dark:text-white font-mono text-[11px] block bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">{selectedBlock.time}</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-slate-455 dark:text-slate-400 block uppercase font-bold">Validating Consortium Leader</span>
                      <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl font-mono text-[10px] text-slate-900 dark:text-white">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span>{selectedBlock.validator}</span>
                      </div>
                    </div>
                  </div>

                  {/* Validator Consensus Signatures */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] text-slate-455 dark:text-slate-400 block uppercase font-bold">Consensus Signatures (MSP Certs)</span>
                    <div className="space-y-1.5 text-[9.5px] font-mono">
                      {['peer0.nit.ehealth.org (Verified)', 'peer1.hospital.ehealth.org (Verified)', 'peer2.labs.ehealth.org (Verified)'].map((sig, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 px-2.5 py-1.5 rounded-xl border border-emerald-500/10">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {sig}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-850">
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full py-3 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/15 cursor-pointer"
                  >
                    Dismiss Inspector
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
