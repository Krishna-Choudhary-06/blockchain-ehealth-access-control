import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Activity, Zap, Network, Cpu, TrendingUp, BarChart2, 
  Settings, Download, FileText, RefreshCw, Server, CheckCircle, Clock
} from 'lucide-react';

// Import all experimentation modules
import TransactionLatencyDashboard from './TransactionLatencyDashboard';
import TransactionThroughputDashboard from './TransactionThroughputDashboard';
import CommunicationOverheadDashboard from './CommunicationOverheadDashboard';
import ComputationOverheadDashboard from './ComputationOverheadDashboard';
import ScalabilityDashboard from './ScalabilityDashboard';
import BenchmarkComparisonDashboard from './BenchmarkComparisonDashboard';

const TABS = [
  { id: 'overview', label: 'System Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'latency', label: 'Latency', icon: <Activity className="w-4 h-4" /> },
  { id: 'throughput', label: 'Throughput', icon: <Zap className="w-4 h-4" /> },
  { id: 'communication', label: 'Communication', icon: <Network className="w-4 h-4" /> },
  { id: 'computation', label: 'Computation', icon: <Cpu className="w-4 h-4" /> },
  { id: 'scalability', label: 'Scalability', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'benchmark', label: 'Benchmarks', icon: <BarChart2 className="w-4 h-4" /> },
];

export default function PerformanceEvaluationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    // Simulate a global refresh delay
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1500);
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // 30s auto-refresh for overview
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handlePDFExport = () => {
    window.print();
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'latency': return <TransactionLatencyDashboard />;
      case 'throughput': return <TransactionThroughputDashboard />;
      case 'communication': return <CommunicationOverheadDashboard />;
      case 'computation': return <ComputationOverheadDashboard />;
      case 'scalability': return <ScalabilityDashboard />;
      case 'benchmark': return <BenchmarkComparisonDashboard />;
      case 'overview':
      default:
        return <OverviewTab lastUpdated={lastUpdated} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans print:bg-white print:text-black">
      
      {/* Global Dashboard Navigation / Header */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 print:hidden">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 gap-4">
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">Performance Evaluation Suite</h1>
                <p className="text-xs text-slate-400 font-medium">Blockchain eHealth Access Control System</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 mr-4 text-xs font-medium text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
              
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                  autoRefresh 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              
              <button 
                onClick={handleRefreshAll}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-all border border-slate-800"
                title="Refresh All Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              
              <button 
                onClick={handlePDFExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-all border border-slate-800 text-sm font-medium"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto hide-scrollbar pb-px border-b border-slate-800">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="print:p-0">
        {renderActiveTab()}
      </div>

    </div>
  );
}

// Sub-component for the Overview Tab
function OverviewTab({ lastUpdated }) {
  // Generate some realistic summary stats for the overview
  const quickStats = [
    { label: 'Avg Network TPS', value: '342', unit: 'TPS', trend: '+12%', positive: true },
    { label: 'Consensus Latency', value: '4.2', unit: 's', trend: '-0.8s', positive: true },
    { label: 'Active Nodes', value: '24', unit: 'Peers', trend: 'Stable', positive: true },
    { label: 'Network Overhead', value: '1.2', unit: 'MB/s', trend: '+0.1MB/s', positive: false },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <div key={i} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
            <p className="text-sm font-semibold text-slate-400">{stat.label}</p>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-100 tracking-tight">{stat.value}</span>
                <span className="text-sm font-semibold text-slate-500">{stat.unit}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${stat.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Health Widget */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              System Health Matrix
            </h3>
            <div className="space-y-5">
              <HealthBar label="Blockchain API Gateway" value={98} color="bg-emerald-500" />
              <HealthBar label="Hyperledger Fabric Network" value={100} color="bg-emerald-500" />
              <HealthBar label="IPFS Storage Cluster" value={85} color="bg-indigo-500" />
              <HealthBar label="Consensus Nodes (Raft)" value={92} color="bg-emerald-500" />
              <HealthBar label="Metrics Telemetry Agent" value={76} color="bg-amber-500" />
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Experiment Timeline
            </h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
              <TimelineItem time="10 mins ago" title="Scalability Stress Test" desc="Completed 1000 concurrent user simulation." success />
              <TimelineItem time="1 hour ago" title="Benchmark Matrix" desc="Compiled comparisons against MedShare." success />
              <TimelineItem time="3 hours ago" title="Network Overhead Spike" desc="High payload detected during block 4092." warning />
              <TimelineItem time="5 hours ago" title="System Initialized" desc="Telemetry agent online and capturing data." success />
            </div>
          </div>
        </div>

        {/* Recent Experiment Runs & Latest Benchmark Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Recent Experiment Runs
              </h3>
              <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">View All Logs</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Experiment ID</th>
                    <th className="pb-3 font-semibold">Module</th>
                    <th className="pb-3 font-semibold">Duration</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <TableRow id="EXP-8429" module="Transaction Latency" duration="45s" status="Completed" date="Today, 10:42 AM" />
                  <TableRow id="EXP-8428" module="Scalability (500 Users)" duration="12m 30s" status="Completed" date="Today, 09:15 AM" />
                  <TableRow id="EXP-8427" module="Computation Overhead" duration="3m 12s" status="Completed" date="Yesterday, 16:30 PM" />
                  <TableRow id="EXP-8426" module="Throughput Stress" duration="--:--" status="Failed" date="Yesterday, 14:05 PM" failed />
                  <TableRow id="EXP-8425" module="Baseline Benchmark" duration="8m 45s" status="Completed" date="Oct 24, 08:00 AM" />
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              Latest Benchmark Highlights
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BenchmarkHighlight title="Proposed vs MedRec (Latency)" winner="Proposed" improvement="62% Faster" />
              <BenchmarkHighlight title="Proposed vs MedShare (TPS)" winner="Proposed" improvement="38% Higher" />
              <BenchmarkHighlight title="Proposed vs MedChain (Network)" winner="Proposed" improvement="45% Less Overhead" />
              <BenchmarkHighlight title="Crypto Computation" winner="Proposed" improvement="Optimized Signature Ver." />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function HealthBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-xs font-bold text-slate-500">{value}%</span>
      </div>
      <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
        <div className={`h-2 rounded-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function TimelineItem({ time, title, desc, success, warning }) {
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
        success ? 'bg-emerald-500' : warning ? 'bg-amber-500' : 'bg-slate-500'
      }`}></div>
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 shadow">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-slate-200 text-sm">{title}</h4>
          <span className="text-xs font-semibold text-slate-500">{time}</span>
        </div>
        <p className="text-sm text-slate-400 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

function TableRow({ id, module, duration, status, date, failed }) {
  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
      <td className="py-3 font-mono text-xs text-indigo-400">{id}</td>
      <td className="py-3 font-medium text-slate-200">{module}</td>
      <td className="py-3 text-slate-400 text-xs">{duration}</td>
      <td className="py-3">
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
          failed ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          {status}
        </span>
      </td>
      <td className="py-3 text-right text-xs text-slate-500">{date}</td>
    </tr>
  );
}

function BenchmarkHighlight({ title, winner, improvement }) {
  return (
    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="flex justify-between items-end">
        <span className="text-lg font-bold text-slate-200">{winner}</span>
        <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-right">
          {improvement}
        </span>
      </div>
    </div>
  );
}
