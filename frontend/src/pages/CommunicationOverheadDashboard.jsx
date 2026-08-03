import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { Network, HardDrive, RefreshCw, AlertTriangle, Database, Download, Server, WifiHigh } from 'lucide-react';

const TRANSACTION_COUNTS = [100, 200, 300, 500, 700, 1000];

const generateMockData = () => {
  const data = [];
  TRANSACTION_COUNTS.forEach(count => {
    // Communication overhead typically scales roughly linearly with transactions
    // Adding some realistic network jitter and base connection overhead
    const baseOverheadKB = 150; 
    const perTxOverheadKB = 8.5; // ~8.5 KB per tx
    const jitter = (Math.random() * 200 - 100); 
    
    data.push({
      transactions: count,
      communicationKB: Math.round(baseOverheadKB + (count * perTxOverheadKB) + jitter)
    });
  });
  return data;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-slate-300 font-medium mb-3 border-b border-slate-700 pb-2 flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          {`${label} Transactions`}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Total Overhead:</span>
              <span className="text-lg font-bold" style={{ color: entry.color }}>
                {entry.value.toLocaleString()} KB
              </span>
              <span className="text-xs text-slate-500">
                (~{(entry.value / 1024).toFixed(2)} MB)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function CommunicationOverheadDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setUsingMockData(false);

    try {
      const response = await fetch('/api/performance/communication');
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const result = await response.json();
      
      let parsedData = [];
      if (Array.isArray(result)) {
        parsedData = result.flatMap(res => res.results || [res]);
      } else if (result.results) {
        parsedData = result.results;
      } else {
        parsedData = [result];
      }
      
      const mappedData = parsedData.map(r => ({
        transactions: r.transactions,
        communicationKB: r.communicationKB
      }));
      
      if (mappedData.length > 0) {
        setData(mappedData);
      } else {
        throw new Error("Empty dataset");
      }
    } catch (err) {
      console.warn("Backend API failed or returned empty. Using mock data.", err);
      setError("Failed to fetch real data. Showing simulated results.");
      setUsingMockData(true);
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    
    const headers = ['Transactions', 'Communication Overhead (KB)', 'Communication Overhead (MB)'];
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const mb = (row.communicationKB / 1024).toFixed(3);
      csvRows.push(`${row.transactions},${row.communicationKB},${mb}`);
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `communication-overhead-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sort data for chart
  const chartData = useMemo(() => {
    return [...data].sort((a, b) => a.transactions - b.transactions);
  }, [data]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0, total: 0 };
    
    const payloads = data.map(d => d.communicationKB);
    const avg = payloads.reduce((a, b) => a + b, 0) / payloads.length;
    const min = Math.min(...payloads);
    const max = Math.max(...payloads);
    const total = payloads.reduce((a, b) => a + b, 0);

    return {
      avg: Math.round(avg).toLocaleString(),
      min: Math.round(min).toLocaleString(),
      max: Math.round(max).toLocaleString(),
      total: Math.round(total).toLocaleString()
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 font-sans selection:bg-cyan-900 selection:text-cyan-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center gap-3">
              <Network className="w-8 h-8 text-cyan-400" />
              Communication Overhead
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Analysis of network bandwidth utilization and data payload transmission
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleExportCSV}
              disabled={loading || data.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-all border border-cyan-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Info / Error Banners */}
        {error && usingMockData && (
          <div className="flex items-center gap-3 bg-amber-900/20 border border-amber-500/30 text-amber-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {!error && !loading && !usingMockData && (
          <div className="flex items-center gap-3 bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <Database className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Live network telemetry synchronized.</p>
          </div>
        )}

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            icon={<WifiHigh className="w-5 h-5 text-cyan-400" />} 
            label="Avg Network Traffic" 
            value={kpis.avg} 
            unit="KB"
            loading={loading} 
          />
          <KPICard 
            icon={<Network className="w-5 h-5 text-emerald-400" />} 
            label="Max Network Traffic" 
            value={kpis.max} 
            unit="KB"
            loading={loading} 
          />
          <KPICard 
            icon={<HardDrive className="w-5 h-5 text-amber-400" />} 
            label="Min Network Traffic" 
            value={kpis.min} 
            unit="KB"
            loading={loading} 
          />
          <KPICard 
            icon={<Database className="w-5 h-5 text-indigo-400" />} 
            label="Total Data Transfer" 
            value={kpis.total} 
            unit="KB"
            loading={loading} 
            highlight
          />
        </div>

        {/* Chart Area */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-col min-h-[550px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Bandwidth Utilization Profile
            </h3>
          </div>
          
          <div className="flex-1 w-full relative">
            {loading && chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <span className="text-slate-400 font-medium animate-pulse">Computing Network Overhead...</span>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <Database className="w-8 h-8 opacity-20" />
                  <p>No communication data available.</p>
                </div>
              </div>
            ) : (
              <div className={`w-full h-[450px] transition-opacity duration-700 ${loading && chartData.length > 0 ? 'opacity-50' : 'opacity-100'}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      </linearGradient>
                      <linearGradient id="colorBarHover" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="transactions" 
                      stroke="#64748b" 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      tickLine={{ stroke: '#334155' }}
                      axisLine={{ stroke: '#334155' }}
                      label={{ value: 'Number of Transactions', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 13 }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      tickLine={{ stroke: '#334155' }}
                      axisLine={{ stroke: '#334155' }}
                      label={{ value: 'Communication Overhead (KB)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', fontSize: 13 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                    <Legend 
                      verticalAlign="top" 
                      height={40}
                      wrapperStyle={{ fontSize: '13px', color: '#cbd5e1' }}
                    />
                    <Bar 
                      name="Network Payload" 
                      dataKey="communicationKB" 
                      fill="url(#colorBar)"
                      radius={[6, 6, 0, 0]}
                      animationDuration={1500}
                      maxBarSize={60}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="url(#colorBar)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, unit, loading, highlight }) {
  return (
    <div className={`group p-5 rounded-2xl border shadow-lg transition-all duration-300 hover:-translate-y-1 ${
      highlight 
        ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30' 
        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <div className={`p-2.5 rounded-xl border ${
          highlight 
            ? 'bg-cyan-500/10 border-cyan-500/20' 
            : 'bg-slate-950 border-slate-800'
        }`}>
          {icon}
        </div>
      </div>
      
      <div>
        {loading ? (
          <div className="h-8 w-24 bg-slate-800 rounded animate-pulse"></div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100 tabular-nums tracking-tight">
              {value}
            </span>
            <span className="text-sm font-semibold text-slate-500">{unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}
