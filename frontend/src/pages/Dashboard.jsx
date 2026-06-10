import { useAuth } from '../hooks/useAuth'
import { FiFileText, FiUserCheck, FiCpu, FiUsers, FiHardDrive, FiActivity } from 'react-icons/fi'

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role || 'Patient'

  // Dynamic status card configurations based on active role
  const statCards = {
    Patient: [
      { id: 1, label: 'My Enrolled Files', value: '14', icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' },
      { id: 2, label: 'Authorized Doctors', value: '3', icon: FiUserCheck, color: 'text-blue-600 bg-blue-500/10' },
      { id: 3, label: 'Active Access Requests', value: '1 Pending', icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' }
    ],
    Doctor: [
      { id: 1, label: 'Assigned Patients', value: '42', icon: FiUsers, color: 'text-blue-600 bg-blue-500/10' },
      { id: 2, label: 'Requests Pending', value: '2', icon: FiActivity, color: 'text-amber-600 bg-amber-500/10' },
      { id: 3, label: 'Successful File Reads', value: '128', icon: FiFileText, color: 'text-purple-600 bg-purple-500/10' }
    ],
    Admin: [
      { id: 1, label: 'Peer Nodes Connected', value: '4 / 4', icon: FiCpu, color: 'text-emerald-600 bg-emerald-500/10' },
      { id: 2, label: 'Registered Network Users', value: '156', icon: FiUsers, color: 'text-purple-600 bg-purple-500/10' },
      { id: 3, label: 'Total Blocks Mined', value: '412', icon: FiHardDrive, color: 'text-blue-600 bg-blue-500/10' }
    ]
  }

  const activeStats = statCards[role] || statCards.Patient

  // Access Logs Table mock data
  const accessLogs = [
    { id: 1, user: 'Dr. Sarah Miller', role: 'Doctor', action: 'Read File PAT-8820', status: 'Granted', timestamp: '2026-06-10 13:42:01' },
    { id: 2, user: 'Nurse Kelly Smith', role: 'Nurse', action: 'Read File PAT-8820', status: 'Denied', timestamp: '2026-06-10 13:40:15' },
    { id: 3, user: 'Patient Alex Carter', role: 'Patient', action: 'Read File PAT-1092', status: 'Granted', timestamp: '2026-06-10 13:12:44' },
    { id: 4, user: 'Dr. James Watson', role: 'Doctor', action: 'Write File PAT-3491', status: 'Granted', timestamp: '2026-06-10 12:44:59' },
    { id: 5, user: 'Unknown Peer', role: 'Doctor', action: 'Read File PAT-8820', status: 'Denied', timestamp: '2026-06-10 12:01:10' }
  ]

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Context */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Workspace Overview</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Real-time ledger updates and attribute evaluation audit trail.</p>
      </div>

      {/* Dynamic Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {activeStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 flex items-center justify-between shadow-sm dark:shadow-none hover:shadow-md dark:hover:border-slate-800 transition-all duration-200"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">{stat.label}</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Access Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-3xl p-6 shadow-sm dark:shadow-none">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Consensus Access Logs</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Immutable transaction audit trail committed to Hyperledger Fabric.</p>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                <th className="pb-3.5 pl-2">User</th>
                <th className="pb-3.5">System Role</th>
                <th className="pb-3.5">Action Request</th>
                <th className="pb-3.5">Status</th>
                <th className="pb-3.5 text-right pr-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
              {accessLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pl-2 font-semibold text-slate-900 dark:text-white">{log.user}</td>
                  <td className="py-4 font-mono text-[10px] uppercase">{log.role}</td>
                  <td className="py-4">{log.action}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      log.status === 'Granted'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        log.status === 'Granted' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}></span>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
