import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Users, Activity, Zap, Network, RefreshCw, AlertTriangle, Database, TrendingUp } from 'lucide-react';

const USER_COUNTS = [10, 50, 100, 200, 300, 500];

const generateMockData = () => {
  return USER_COUNTS.map(users => {
    // Latency increases as user load increases
    const latency = Math.round(5 + (users * 0.4) + (Math.random() * 4 - 2));
    
    // Throughput increases initially, then hits a ceiling/bottleneck
    const throughput = Math.round(users <= 100 ? 50 + (users * 0.8) : 130 + (Math.random() * 10 - 5));
    
    // Communication overhead scales linearly or super-linearly
    const communication = Math.round(1000 + (users * 120) + (Math.random() * 500));

    return {
      users,
      latency,
      throughput,
      communication
    };
  });
};

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-slate-300 font-medium mb-3 border-b border-slate-700 pb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          {`${label} Concurrent Users`}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center gap-4">
              <span className="text-sm text-slate-400">{entry.name}:</span>
              <span className="text-md font-bold" style={{ color: entry.color }}>
                {entry.value.toLocaleString()} {unit || entry.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function ScalabilityDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setUsingMockData(false);

    try {
      const response = await fetch('/api/performance/scalability');
      
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
        users: r.users,
        latency: r.latency,
        throughput: r.throughput,
        communication: r.communication || r.communicationKB // handle potential field name mismatch
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

  // Ensure data is sorted by users for the charts
  const chartData = useMemo(() => {
    return [...data].sort((a, b) => a.users - b.users);
  }, [data]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (data.length === 0) return { maxUsers: 0, avgLatency: 0, peakThroughput: 0, totalComm: 0 };
    
    const users = data.map(d => d.users);
    const latencies = data.map(d => d.latency);
    const throughputs = data.map(d => d.throughput);
    const comms = data.map(d => d.communication);

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const peakThroughput = Math.max(...throughputs);
    const totalComm = comms.reduce((a, b) => a + b, 0);
    const maxUsers = Math.max(...users);

    return {
      maxUsers: maxUsers.toLocaleString(),
      avgLatency: Math.round(avgLatency).toLocaleString(),
      peakThroughput: Math.round(peakThroughput).toLocaleString(),
      totalComm: Math.round(totalComm).toLocaleString()
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans selection:bg-indigo-900 selection:text-indigo-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-indigo-400" />
              Multi-User Scalability Analysis
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Comprehensive stress-testing metrics across concurrent user loads
            </p>
          </div>
          
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all border border-indigo-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>

        {/* Info / Error Banners */}
        {error && usingMockData && (
          <div className="flex items-center gap-3 bg-amber-900/20 border border-amber-500/30 text-amber-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {!error && !loading && !usingMockData && (
          <div className="flex items-center gap-3 bg-indigo-900/20 border border-indigo-500/30 text-indigo-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <Database className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Live scalability telemetry synchronized.</p>
          </div>
        )}

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KPICard 
            icon={<Users className="w-5 h-5 text-indigo-400" />} 
            label="Max Concurrent Users" 
            value={kpis.maxUsers} 
            unit="Users"
            loading={loading} 
            highlight
          />
          <KPICard 
            icon={<Activity className="w-5 h-5 text-cyan-400" />} 
            label="Average Latency" 
            value={kpis.avgLatency} 
            unit="sec"
            loading={loading} 
          />
          <KPICard 
            icon={<Zap className="w-5 h-5 text-emerald-400" />} 
            label="Peak Throughput" 
            value={kpis.peakThroughput} 
            unit="TPS"
            loading={loading} 
          />
          <KPICard 
            icon={<Network className="w-5 h-5 text-pink-400" />} 
            label="Total Overhead" 
            value={kpis.totalComm} 
            unit="KB"
            loading={loading} 
          />
        </div>

        {/* Charts Grid */}
        {loading && chartData.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
              <span className="text-slate-400 font-medium animate-pulse">Aggregating User Metrics...</span>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500">
            <p>No scalability data available.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-700 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            
            {/* Chart 1: Users vs Latency */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-col h-[400px]">
              <h3 className="text-md font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Latency Scaling (Users vs sec)
              </h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="users" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={{ stroke: '#334155' }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={{ stroke: '#334155' }} />
                    <Tooltip content={<CustomTooltip unit="sec" />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" name="Latency" dataKey="latency" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', stroke: '#22d3ee', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Users vs Throughput */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-col h-[400px]">
              <h3 className="text-md font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Throughput Scaling (Users vs TPS)
              </h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="users" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={{ stroke: '#334155' }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={{ stroke: '#334155' }} />
                    <Tooltip content={<CustomTooltip unit="TPS" />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" name="Throughput" dataKey="throughput" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTps)" animationDuration={1500} activeDot={{ r: 6, fill: '#0f172a', stroke: '#10b981', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Users vs Communication Overhead */}
            <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-col h-[450px]">
              <h3 className="text-md font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Network className="w-4 h-4 text-pink-400" />
                Network Burden (Users vs KB)
              </h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#db2777" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="users" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={{ stroke: '#334155' }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={{ stroke: '#334155' }} />
                    <Tooltip content={<CustomTooltip unit="KB" />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar name="Comm Overhead" dataKey="communication" fill="url(#colorComm)" radius={[4, 4, 0, 0]} maxBarSize={80} animationDuration={1500}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="url(#colorComm)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, unit, loading, highlight }) {
  return (
    <div className={`group p-5 rounded-2xl border shadow-lg transition-all duration-300 hover:-translate-y-1 ${
      highlight 
        ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/40' 
        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <div className={`p-2.5 rounded-xl border ${
          highlight 
            ? 'bg-indigo-500/20 border-indigo-500/30' 
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
