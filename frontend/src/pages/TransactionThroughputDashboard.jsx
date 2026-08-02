import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Activity, Zap, Maximize2, Minimize2, AlertTriangle, RefreshCw, Database, Clock } from 'lucide-react';

const BLOCK_SIZES = ['All', 5, 10, 15, 20];
const TRANSACTION_COUNTS = ['All', 100, 200, 300, 500, 700, 1000];
const AUTO_REFRESH_INTERVALS = [0, 5000, 10000, 30000, 60000]; // 0 means off

const generateMockData = (bSize, tCount) => {
  const data = [];
  const bSizesToGenerate = bSize === 'All' ? [5, 10, 15, 20] : [parseInt(bSize)];
  const tCountsToGenerate = tCount === 'All' ? [100, 200, 300, 500, 700, 1000] : [parseInt(tCount)];

  bSizesToGenerate.forEach(size => {
    tCountsToGenerate.forEach(count => {
      // Mock throughput calculation
      // Larger blocks allow more tx per block, potentially increasing TPS up to a network limit
      const baseTps = 40 + (size * 3);
      // Under higher tx load, throughput might peak then stabilize or degrade slightly
      const loadFactor = count <= 300 ? 1 : count <= 700 ? 1.2 : 1.1;
      const jitter = (Math.random() * 8 - 4);
      
      data.push({
        blockSize: size,
        transactions: count,
        throughput: Math.max(10, Math.floor((baseTps * loadFactor) + jitter))
      });
    });
  });

  return data;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm">
        <p className="text-slate-300 font-medium mb-3 border-b border-slate-700 pb-2">{`${label} Transactions`}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <span className="text-sm text-slate-400">Block Size {entry.name.split('_')[1]}:</span>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                {entry.value} TPS
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function TransactionThroughputDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [blockSize, setBlockSize] = useState('All');
  const [transactionCount, setTransactionCount] = useState('All');
  const [autoRefreshMs, setAutoRefreshMs] = useState(0);

  const fetchData = useCallback(async (isAuto = false) => {
    if (!isAuto) setLoading(true);
    setError(null);
    setUsingMockData(false);

    try {
      const params = new URLSearchParams();
      if (blockSize !== 'All') params.append('blockSize', blockSize);
      if (transactionCount !== 'All') params.append('transactions', transactionCount);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/performance/throughput${queryString}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const result = await response.json();
      
      let parsedData = [];
      if (Array.isArray(result)) {
        parsedData = result.flatMap(res => 
          res.results.map(r => ({
            blockSize: res.blockSize || 'N/A',
            transactions: r.transactions,
            throughput: r.throughput
          }))
        );
      } else if (result.results) {
        parsedData = result.results.map(r => ({
          blockSize: result.blockSize || 'N/A',
          transactions: r.transactions,
          throughput: r.throughput
        }));
      }
      
      if (parsedData.length > 0) {
        setData(parsedData);
      } else {
        throw new Error("Empty dataset");
      }
    } catch (err) {
      if (!isAuto) console.warn("Backend API failed or returned empty. Using mock data.", err);
      setError("Failed to fetch real data. Showing simulated results.");
      setUsingMockData(true);
      setData(generateMockData(blockSize, transactionCount));
    } finally {
      setLoading(false);
    }
  }, [blockSize, transactionCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle auto-refresh interval
  useEffect(() => {
    if (autoRefreshMs === 0) return;
    
    const interval = setInterval(() => {
      fetchData(true);
    }, autoRefreshMs);
    
    return () => clearInterval(interval);
  }, [autoRefreshMs, fetchData]);

  // Transform data for Recharts (grouping by transactions)
  const chartData = useMemo(() => {
    const grouped = {};
    data.forEach(item => {
      if (!grouped[item.transactions]) {
        grouped[item.transactions] = { transactions: item.transactions };
      }
      grouped[item.transactions][`blockSize_${item.blockSize}`] = item.throughput;
    });
    return Object.values(grouped).sort((a, b) => a.transactions - b.transactions);
  }, [data]);

  // Extract unique block sizes present in the data for chart lines
  const availableBlockSizes = useMemo(() => {
    const sizes = new Set();
    data.forEach(d => sizes.add(d.blockSize));
    return Array.from(sizes).sort((a, b) => {
      if (a === 'N/A') return -1;
      if (b === 'N/A') return 1;
      return a - b;
    });
  }, [data]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0, current: 0 };
    
    const throughputs = data.map(d => d.throughput);
    const avg = throughputs.reduce((a, b) => a + b, 0) / throughputs.length;
    const min = Math.min(...throughputs);
    const max = Math.max(...throughputs);
    
    // Simulate 'current' as the last data point's throughput
    const sortedData = [...data].sort((a, b) => a.transactions - b.transactions);
    const current = sortedData[sortedData.length - 1].throughput;

    return {
      avg: Math.round(avg),
      min: min,
      max: max,
      current: current
    };
  }, [data]);

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const gradientIds = colors.map((_, i) => `colorTps${i}`);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans selection:bg-purple-900 selection:text-purple-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center gap-3">
              <Zap className="w-8 h-8 text-purple-400" />
              Transaction Throughput
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Real-time monitoring of transactions processed per second (TPS)
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <Clock className="w-4 h-4 text-slate-400" />
              <select
                value={autoRefreshMs}
                onChange={(e) => setAutoRefreshMs(Number(e.target.value))}
                className="bg-transparent text-sm text-slate-300 outline-none cursor-pointer"
              >
                <option value={0}>Auto Refresh: Off</option>
                <option value={5000}>Every 5s</option>
                <option value={10000}>Every 10s</option>
                <option value={30000}>Every 30s</option>
                <option value={60000}>Every 1m</option>
              </select>
            </div>
            
            <button 
              onClick={() => fetchData(false)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all border border-indigo-500/20 disabled:opacity-50 ml-auto md:ml-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Info / Error Banners */}
        {error && usingMockData && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {!error && !loading && !usingMockData && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <Database className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Live backend telemetry synchronized.</p>
          </div>
        )}

        {/* Filters & KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
              <h3 className="text-lg font-semibold text-slate-200 mb-5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Data Controls
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Block Size Parameter</label>
                  <div className="relative">
                    <select 
                      value={blockSize}
                      onChange={(e) => setBlockSize(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none"
                    >
                      {BLOCK_SIZES.map(size => (
                        <option key={size} value={size}>{size === 'All' ? 'Aggregate All Sizes' : `Block Size ${size}`}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Transaction Load</label>
                  <div className="relative">
                    <select 
                      value={transactionCount}
                      onChange={(e) => setTransactionCount(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none"
                    >
                      {TRANSACTION_COUNTS.map(count => (
                        <option key={count} value={count}>{count === 'All' ? 'All Load Vectors' : `${count} Transactions`}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <KPICard 
                icon={<Activity className="w-5 h-5 text-purple-400" />} 
                label="Average TPS" 
                value={kpis.avg} 
                unit="TPS"
                loading={loading} 
              />
              <KPICard 
                icon={<Maximize2 className="w-5 h-5 text-emerald-400" />} 
                label="Maximum TPS" 
                value={kpis.max} 
                unit="TPS"
                loading={loading} 
              />
              <KPICard 
                icon={<Minimize2 className="w-5 h-5 text-amber-400" />} 
                label="Minimum TPS" 
                value={kpis.min} 
                unit="TPS"
                loading={loading} 
              />
              <KPICard 
                icon={<Zap className="w-5 h-5 text-sky-400" />} 
                label="Current TPS Peak" 
                value={kpis.current} 
                unit="TPS"
                loading={loading} 
                highlight
              />
            </div>
          </div>

          {/* Chart Area */}
          <div className="lg:col-span-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-col min-h-[550px]">
            <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Throughput Curve
            </h3>
            
            <div className="flex-1 w-full relative">
              {loading && chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-slate-800 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <span className="text-slate-400 font-medium animate-pulse">Syncing Telemetry...</span>
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Database className="w-8 h-8 opacity-20" />
                    <p>No throughput data available for selected filters.</p>
                  </div>
                </div>
              ) : (
                <div className={`w-full h-[450px] transition-opacity duration-700 ${loading && chartData.length > 0 ? 'opacity-50' : 'opacity-100'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <defs>
                        {availableBlockSizes.map((size, index) => (
                          <linearGradient key={`gradient_${size}`} id={gradientIds[index % gradientIds.length]} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="transactions" 
                        stroke="#64748b" 
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Transaction Count (Load)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 13 }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Throughput (TPS)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', fontSize: 13 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="top" 
                        height={40}
                        iconType="rect"
                        wrapperStyle={{ fontSize: '13px', color: '#cbd5e1' }}
                      />
                      {availableBlockSizes.map((size, index) => (
                        <Area
                          key={size}
                          type="monotone"
                          name={`Block Size ${size}`}
                          dataKey={`blockSize_${size}`}
                          stroke={colors[index % colors.length]}
                          strokeWidth={3}
                          fillOpacity={1}
                          fill={`url(#${gradientIds[index % gradientIds.length]})`}
                          activeDot={{ r: 6, strokeWidth: 2, fill: '#0f172a', stroke: colors[index % colors.length] }}
                          animationDuration={1500}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
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
        ? 'bg-gradient-to-br from-indigo-900/50 to-slate-900/50 border-indigo-500/30' 
        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <div className={`p-2.5 rounded-xl border ${
          highlight 
            ? 'bg-indigo-500/10 border-indigo-500/20' 
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
