import { useEffect, useState } from 'react'
import {
  FiActivity, FiCpu, FiHardDrive, FiHash,
  FiClock, FiTrendingUp, FiCheckCircle, FiAlertTriangle
} from 'react-icons/fi'
import { getLogs } from '../services/apiService'

const TEST_PREFIXES = ['doctor_paper_', 'doctor_full_', 'doctor_bgw_', 'record_paper_', 'record_full_', 'data_bgw_']

function isTestArtifact(value = '') {
  const text = String(value).toLowerCase()
  return TEST_PREFIXES.some(prefix => text.startsWith(prefix)) || ['doctor1', 'record1'].includes(text)
}

function statusFromAction(action = '') {
  return String(action).toUpperCase() === 'GRANTED' ? 'Granted' : 'Denied'
}

function timeLabel(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function buildBlockRows(logs) {
  const grouped = logs.reduce((acc, log) => {
    const day = log.time ? new Date(log.time).toISOString().slice(0, 10) : 'ledger'
    acc.set(day, [...(acc.get(day) || []), log])
    return acc
  }, new Map())

  return Array.from(grouped.entries()).map(([day, dayLogs], index) => ({
    number: day,
    hash: dayLogs[0]?.txId || `${dayLogs[0]?.requesterId || 'ledger'}:${dayLogs[0]?.dataId || index}`,
    txCount: dayLogs.length,
    size: `${JSON.stringify(dayLogs).length} B`,
    time: day === 'ledger' ? 'N/A' : new Date(day).toLocaleDateString()
  }))
}

export default function Explorer() {
  const [txs, setTxs] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)
      try {
        const response = await getLogs()
        if (response.success && Array.isArray(response.data)) {
          const realLogs = response.data
            .filter(log => !isTestArtifact(log.requesterId) && !isTestArtifact(log.dataId))
            .sort((a, b) => new Date(b.time) - new Date(a.time))

          setTxs(realLogs.map((log, index) => ({
            id: log.txId || `${log.requesterId}-${log.dataId}-${index}`,
            block: log.blockNumber || 'Fabric',
            sender: log.requesterId,
            requesterLevel: log.requesterLevel,
            dataLevel: log.dataLevel,
            action: `${log.action} ${log.dataId}`,
            status: statusFromAction(log.action),
            time: timeLabel(log.time),
            role: log.requesterRole || 'Member'
          })))
          setBlocks(buildBlockRows(realLogs))
        }
      } catch (err) {
        console.error('Failed to load blockchain logs', err)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  const feed = txs.slice(0, 5).map(tx => ({
    id: `${tx.id}-feed`,
    type: tx.status === 'Granted' ? 'read_success' : 'read_denied',
    text: `${tx.sender} ${tx.status.toLowerCase()} for ${tx.action.replace(/^GRANTED |^DENIED /, '')}`,
    time: tx.time,
    role: tx.role
  }))

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-900/60 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <FiTrendingUp className="text-purple-650 dark:text-purple-400" />
              Blockchain Explorer
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-xl">
              Inspect smart-contract access events committed by the Hyperledger Fabric channel.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3.5 py-2 rounded-xl text-emerald-600 dark:text-emerald-455 shadow-sm self-start md:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{loading ? 'SYNCING LEDGER' : 'LEDGER VIEW READY'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <MetricCard label="Ledger Groups" value={blocks.length} icon={FiHardDrive} tone="purple" />
          <MetricCard label="Access Transactions" value={txs.length} icon={FiHash} tone="blue" />
          <MetricCard label="Connected Nodes" value="4 / 4" icon={FiCpu} tone="emerald" />
          <MetricCard label="Ledger Status" value="Operational" icon={FiActivity} tone="indigo" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <ExplorerTable
              title="Latest Ledger Commit Groups"
              description="Access log entries grouped by commit date."
              empty="No ledger access entries are available yet."
              headers={['Height', 'Block Hash', 'TXs', 'Size', 'Age']}
              rows={blocks.map(block => [
                `#${block.number}`,
                block.hash,
                block.txCount,
                block.size,
                block.time
              ])}
            />

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none animate-slide-up">
              <div className="mb-5">
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Transaction Logs</h3>
                <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5">Attribute verification and BGW key access events resolved by smart contracts.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 pl-2">Transaction Hash</th>
                      <th className="pb-3">Block</th>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Req Level</th>
                      <th className="pb-3">Data Level</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right pr-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                    {txs.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-6 text-center text-slate-450 dark:text-slate-500">
                          No real application transactions are available yet.
                        </td>
                      </tr>
                    )}
                    {txs.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all group">
                        <td className="py-3.5 pl-2 font-mono text-[11px] text-purple-650 dark:text-purple-400 font-bold truncate max-w-[120px]" title={tx.id}>{tx.id}</td>
                        <td className="py-3.5 font-mono text-[11px] text-slate-650 dark:text-slate-400">{tx.block}</td>
                        <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">{tx.sender}</td>
                        <td className="py-3.5 font-mono">{tx.requesterLevel || 'N/A'}</td>
                        <td className="py-3.5 font-mono">{tx.dataLevel || 'N/A'}</td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-350">{tx.action}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            tx.status === 'Granted'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2 text-slate-450 dark:text-slate-500 font-mono">{tx.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none h-full">
              <div className="mb-6">
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Access Activity Feed</h3>
                <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5">Recent immutable runtime events.</p>
              </div>

              <div className="relative border-l border-slate-200 dark:border-slate-800/80 ml-3 pl-5 space-y-6">
                {feed.length === 0 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">No access activity has been committed yet.</div>
                )}
                {feed.map(item => {
                  const denied = item.type === 'read_denied'
                  const badgeColor = denied
                    ? 'bg-rose-100 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/30 dark:text-rose-400'
                    : 'bg-emerald-100 border-emerald-205 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/30 dark:text-emerald-400'
                  const icon = denied ? <FiAlertTriangle className="w-3.5 h-3.5" /> : <FiCheckCircle className="w-3.5 h-3.5" />

                  return (
                    <div key={item.id} className="relative animate-fade-in">
                      <span className={`absolute -left-[27px] top-1 rounded-full p-1 border flex items-center justify-center ${badgeColor}`}>
                        {icon}
                      </span>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[9px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wide bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded">{item.role}</span>
                          <span className="text-[9.5px] font-mono text-slate-450 dark:text-slate-500 flex items-center gap-0.5">
                            <FiClock className="w-2.5 h-2.5" />
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-250 leading-relaxed">{item.text}</p>
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

function MetricCard({ label, value, icon: Icon, tone }) {
  const tones = {
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    indigo: 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 dark:hover:border-purple-900 transition-all duration-200">
      <div>
        <span className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider block">{label}</span>
        <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1 block font-mono">{value}</span>
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className="w-5.5 h-5.5" />
      </div>
    </div>
  )
}

function ExplorerTable({ title, description, headers, rows, empty }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm dark:shadow-none">
      <div className="mb-5">
        <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
              {headers.map(header => <th key={header} className="pb-3 pl-2">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="py-6 text-center text-slate-450 dark:text-slate-500">{empty}</td>
              </tr>
            )}
            {rows.map(row => (
              <tr key={row.join('-')} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all group">
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`} className="py-3.5 pl-2 font-mono text-[11px] text-slate-650 dark:text-slate-400 max-w-[220px] truncate" title={String(cell)}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
