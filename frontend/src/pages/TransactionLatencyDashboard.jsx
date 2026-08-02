import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Activity, Clock, Layers, Hash, AlertTriangle, RefreshCw, Database } from 'lucide-react';

const BLOCK_SIZES = ['All', 5, 10, 15, 20];
const TRANSACTION_COUNTS = ['All', 100, 200, 300, 500, 700, 1000];

const generateMockData = (bSize, tCount) => {
  const data = [];
  const bSizesToGenerate = bSize === 'All' ? [5, 10, 15, 20] : [parseInt(bSize)];
  const tCountsToGenerate = tCount === 'All' ? [100, 200, 300, 500, 700, 1000] : [parseInt(tCount)];

  bSizesToGenerate.forEach(size => {
    tCountsToGenerate.forEach(count => {
      // Mock latency calculation based on typical blockchain scaling behavior
      const baseLatency = size * 0.5;
      const countFactor = (count / 100) * (size > 10 ? 1.5 : 1.2);
      // Introduce some random jitter for realism
      const jitter = (Math.random() * 2 - 1); 
      
      data.push({
        blockSize: size,
        transactions: count,
        latency: Number((baseLatency + countFactor + jitter).toFixed(2))
      });
    });
  });

  return data;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm">
        <p className="text-slate-300 font-medium mb-2">{`${label} Transactions`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            Block Size {entry.name.split('_')[1]}: {entry.value}s
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TransactionLatencyDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [blockSize, setBlockSize] = useState('All');
  const [transactionCount, setTransactionCount] = useState('All');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setUsingMockData(false);

    try {
      // Construct query params
      const params = new URLSearchParams();
      if (blockSize !== 'All') params.append('blockSize', blockSize);
      if (transactionCount !== 'All') params.append('transactions', transactionCount);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/performance/latency${queryString}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const result = await response.json();
      
      let parsedData = [];
      if (Array.isArray(result)) {
        // Handle array of results if backend supports it
        parsedData = result.flatMap(res => 
          res.results.map(r => ({
            blockSize: res.blockSize,
            transactions: r.transactions,
            latency: r.latency
          }))
        );
      } else if (result.blockSize && result.results) {
        // Handle single object response
        parsedData = result.results.map(r => ({
          blockSize: result.blockSize,
          transactions: r.transactions,
          latency: r.latency
        }));
      }
      
      if (parsedData.length > 0) {
        setData(parsedData);
      } else {
        throw new Error("Empty dataset");
      }
    } catch (err) {
      console.warn("Backend API failed or returned empty. Using mock data.", err);
      setError("Failed to fetch real data. Showing simulated results.");
      setUsingMockData(true);
      setData(generateMockData(blockSize, transactionCount));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [blockSize, transactionCount]);

  // Transform data for Recharts (grouping by transactions)
  const chartData = useMemo(() => {
    const grouped = {};
    data.forEach(item => {
      if (!grouped[item.transactions]) {
        grouped[item.transactions] = { transactions: item.transactions };
      }
      grouped[item.transactions][`blockSize_${item.blockSize}`] = item.latency;
    });
    return Object.values(grouped).sort((a, b) => a.transactions - b.transactions);
  }, [data]);

  // Extract unique block sizes present in the data for chart lines
  const availableBlockSizes = useMemo(() => {
    const sizes = new Set();
    data.forEach(d => sizes.add(d.blockSize));
    return Array.from(sizes).sort((a, b) => a - b);
  }, [data]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0, totalTx: 0 };
    
    const latencies = data.map(d => d.latency);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const totalTx = data.reduce((sum, d) => sum + d.transactions, 0);

    return {
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      totalTx: totalTx.toLocaleString()
    };
  }, [data]);

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans selection:bg-cyan-900 selection:text-cyan-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-sm">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-3">
              <Activity className="w-8 h-8 text-cyan-400" />
              Transaction Latency Analysis
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Performance metrics for block validation and consensus propagation
            </p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl transition-all border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Info / Error Banners */}
        {error && usingMockData && (
          <div className="flex items-center gap-3 bg-amber-900/20 border border-amber-900/50 text-amber-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {!error && !loading && !usingMockData && (
          <div className="flex items-center gap-3 bg-emerald-900/20 border border-emerald-900/50 text-emerald-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <Database className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Live data connected successfully.</p>
          </div>
        )}

        {/* Filters & KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Filters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Block Size</label>
                  <select 
                    value={blockSize}
                    onChange={(e) => setBlockSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                  >
                    {BLOCK_SIZES.map(size => (
                      <option key={size} value={size}>{size === 'All' ? 'All Sizes' : size}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Transaction Count</label>
                  <select 
                    value={transactionCount}
                    onChange={(e) => setTransactionCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                  >
                    {TRANSACTION_COUNTS.map(count => (
                      <option key={count} value={count}>{count === 'All' ? 'All Counts' : count}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <KPICard 
                icon={<Clock className="w-5 h-5 text-cyan-400" />} 
                label="Avg Latency" 
                value={`${kpis.avg}s`} 
                loading={loading} 
              />
              <KPICard 
                icon={<Activity className="w-5 h-5 text-emerald-400" />} 
                label="Min Latency" 
                value={`${kpis.min}s`} 
                loading={loading} 
              />
              <KPICard 
                icon={<AlertTriangle className="w-5 h-5 text-rose-400" />} 
                label="Max Latency" 
                value={`${kpis.max}s`} 
                loading={loading} 
              />
              <KPICard 
                icon={<Hash className="w-5 h-5 text-indigo-400" />} 
                label="Total Measured Tx" 
                value={kpis.totalTx} 
                loading={loading} 
              />
            </div>
          </div>

          {/* Chart Area */}
          <div className="lg:col-span-3 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-sm flex flex-col min-h-[500px]">
            <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Latency Overview
            </h3>
            
            <div className="flex-1 w-full relative">
              {loading && chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
                    <span className="text-slate-400 font-medium animate-pulse">Analyzing Performance Data...</span>
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  No data available for the selected filters.
                </div>
              ) : (
                <div className={`w-full h-[400px] transition-opacity duration-500 ${loading ? 'opacity-40' : 'opacity-100'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="transactions" 
                        stroke="#64748b" 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Number of Transactions', position: 'insideBottom', offset: -15, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Latency (seconds)', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '14px', color: '#cbd5e1' }}
                      />
                      {availableBlockSizes.map((size, index) => (
                        <Line
                          key={size}
                          type="monotone"
                          name={`Block Size ${size}`}
                          dataKey={`blockSize_${size}`}
                          stroke={colors[index % colors.length]}
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          animationDuration={1500}
                        />
                      ))}
                    </LineChart>
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

function KPICard({ icon, label, value, loading }) {
  return (
    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:bg-slate-800/80">
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        {loading ? (
          <div className="h-6 w-16 bg-slate-800 rounded animate-pulse mt-1"></div>
        ) : (
          <p className="text-xl font-bold text-slate-100">{value}</p>
        )}
      </div>
    </div>
  );
}
