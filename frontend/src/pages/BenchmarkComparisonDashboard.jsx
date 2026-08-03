import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, Download, Image as ImageIcon, RefreshCw, AlertTriangle, Database, BarChart2 } from 'lucide-react';

const TRANSACTION_COUNTS = [100, 200, 300, 500, 700, 1000];

const generateMockData = () => {
  const mockData = {
    proposed: [],
    medrec: [],
    medshare: [],
    medchain: []
  };

  TRANSACTION_COUNTS.forEach(count => {
    // Proposed: Best performance
    mockData.proposed.push({
      transactions: count,
      latency: Math.round(5 + (count * 0.04)),
      throughput: Math.round(count <= 300 ? 50 + (count * 0.8) : 250 + (Math.random() * 20 - 10)),
      communication: Math.round(150 + (count * 10)),
      computation: Math.round(50 + Math.pow(count/100, 1.2) * 50)
    });

    // MedRec: High computation, low throughput
    mockData.medrec.push({
      transactions: count,
      latency: Math.round(15 + (count * 0.1)),
      throughput: Math.round(count <= 200 ? 30 + (count * 0.4) : 100 + (Math.random() * 10 - 5)),
      communication: Math.round(200 + (count * 12)),
      computation: Math.round(100 + Math.pow(count/100, 1.5) * 80)
    });

    // MedShare: Moderate performance
    mockData.medshare.push({
      transactions: count,
      latency: Math.round(10 + (count * 0.07)),
      throughput: Math.round(count <= 300 ? 40 + (count * 0.6) : 180 + (Math.random() * 15 - 7)),
      communication: Math.round(180 + (count * 15)),
      computation: Math.round(80 + Math.pow(count/100, 1.3) * 60)
    });

    // MedChain: High communication overhead
    mockData.medchain.push({
      transactions: count,
      latency: Math.round(12 + (count * 0.08)),
      throughput: Math.round(count <= 300 ? 45 + (count * 0.65) : 190 + (Math.random() * 15 - 7)),
      communication: Math.round(300 + (count * 25)),
      computation: Math.round(70 + Math.pow(count/100, 1.25) * 55)
    });
  });

  return mockData;
};

const FRAMEWORKS = [
  { key: 'proposed', name: 'Proposed Framework', color: '#10b981' }, // Emerald
  { key: 'medrec', name: 'MedRec', color: '#ef4444' },               // Red
  { key: 'medshare', name: 'MedShare', color: '#3b82f6' },           // Blue
  { key: 'medchain', name: 'MedChain', color: '#f59e0b' }            // Amber
];

const METRICS = [
  { id: 'latency', title: 'Latency Comparison', unit: 'sec', yLabel: 'Latency (s)', icon: <Activity className="w-4 h-4" /> },
  { id: 'throughput', title: 'Throughput Comparison', unit: 'TPS', yLabel: 'Throughput (TPS)', icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'communication', title: 'Communication Overhead Comparison', unit: 'KB', yLabel: 'Overhead (KB)', icon: <Database className="w-4 h-4" /> },
  { id: 'computation', title: 'Computation Overhead Comparison', unit: 'min', yLabel: 'Time (min)', icon: <Activity className="w-4 h-4" /> }
];

export default function BenchmarkComparisonDashboard() {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // Toggle line visibility state
  const [visibleLines, setVisibleLines] = useState({
    proposed: true,
    medrec: true,
    medshare: true,
    medchain: true
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setUsingMockData(false);

    try {
      const response = await fetch('/api/performance/comparison');
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.proposed && result.medrec && result.medshare && result.medchain) {
        setRawData(result);
      } else {
        throw new Error("Invalid benchmark dataset structure");
      }
    } catch (err) {
      console.warn("Backend API failed or returned invalid data. Using mock data.", err);
      setError("Failed to fetch real benchmark data. Showing simulated research results.");
      setUsingMockData(true);
      setRawData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Transform raw data (grouped by framework) into Recharts format (grouped by transaction count)
  const chartData = useMemo(() => {
    if (!rawData) return [];
    
    // Collect all unique transaction counts
    const txSet = new Set();
    FRAMEWORKS.forEach(fw => {
      if (rawData[fw.key]) {
        rawData[fw.key].forEach(d => txSet.add(d.transactions));
      }
    });
    
    const sortedTx = Array.from(txSet).sort((a, b) => a - b);
    
    return sortedTx.map(tx => {
      const point = { transactions: tx };
      FRAMEWORKS.forEach(fw => {
        const fwData = rawData[fw.key]?.find(d => d.transactions === tx);
        if (fwData) {
          METRICS.forEach(metric => {
            point[`${fw.key}_${metric.id}`] = fwData[metric.id];
          });
        }
      });
      return point;
    });
  }, [rawData]);

  const toggleLine = (frameworkKey) => {
    setVisibleLines(prev => ({
      ...prev,
      [frameworkKey]: !prev[frameworkKey]
    }));
  };

  const handleExportCSV = () => {
    if (!rawData) return;
    
    let csvString = 'Transactions,Metric,Framework,Value\n';
    
    FRAMEWORKS.forEach(fw => {
      if (rawData[fw.key]) {
        rawData[fw.key].forEach(row => {
          METRICS.forEach(metric => {
            if (row[metric.id] !== undefined) {
              csvString += `${row.transactions},${metric.id},${fw.name},${row[metric.id]}\n`;
            }
          });
        });
      }
    });
    
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `benchmark-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = (chartId, title) => {
    const svgElement = document.querySelector(`#${chartId} svg`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const svgSize = svgElement.getBoundingClientRect();
    
    // Scale up for better resolution
    const scale = 2;
    canvas.width = svgSize.width * scale;
    canvas.height = svgSize.height * scale;
    
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      // Background color matches theme
      ctx.fillStyle = "#0f172a"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const canvasUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.download = `benchmark-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      a.href = canvasUrl;
      a.click();
    };
    
    // SVG processing
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans selection:bg-indigo-900 selection:text-indigo-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 flex items-center gap-3">
              <BarChart2 className="w-8 h-8 text-blue-400" />
              Benchmark Comparison
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Empirical evaluation against state-of-the-art frameworks (MedRec, MedShare, MedChain)
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={handleExportCSV}
              disabled={loading || !rawData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all border border-indigo-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Info Banners */}
        {error && usingMockData && (
          <div className="flex items-center gap-3 bg-amber-900/20 border border-amber-500/30 text-amber-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {!error && !loading && !usingMockData && (
          <div className="flex items-center gap-3 bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <Database className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Live benchmark telemetry synchronized.</p>
          </div>
        )}

        {/* Global Interactive Legend (Toggle Line Visibility) */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-center gap-4 md:gap-8">
          <span className="text-sm font-semibold text-slate-400 mr-2 w-full text-center md:w-auto md:text-left">Toggle Frameworks:</span>
          {FRAMEWORKS.map(fw => (
            <button
              key={fw.key}
              onClick={() => toggleLine(fw.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                visibleLines[fw.key] 
                  ? 'bg-slate-800/80 ring-1 ring-slate-700' 
                  : 'opacity-40 grayscale hover:opacity-70'
              }`}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: fw.color }}></span>
              <span className="text-sm font-medium text-slate-200">{fw.name}</span>
            </button>
          ))}
        </div>

        {/* Charts Grid */}
        {loading && chartData.length === 0 ? (
          <div className="h-[600px] flex items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
              <span className="text-slate-400 font-medium animate-pulse">Computing Matrix Comparisons...</span>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[600px] flex items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500">
            <p>No benchmark data available.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-700 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            
            {METRICS.map(metric => (
              <div key={metric.id} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-col h-[420px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2">
                    <span className="p-1.5 bg-slate-800 rounded-md text-blue-400">
                      {metric.icon}
                    </span>
                    {metric.title}
                  </h3>
                  <button
                    onClick={() => handleExportPNG(`chart-${metric.id}`, metric.title)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Export as PNG"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div id={`chart-${metric.id}`} className="flex-1 w-full bg-slate-900/50 rounded-xl p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="transactions" 
                        stroke="#64748b" 
                        tick={{ fill: '#64748b', fontSize: 11 }} 
                        tickLine={{ stroke: '#334155' }} 
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Transactions', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        tick={{ fill: '#64748b', fontSize: 11 }} 
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: metric.yLabel, angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '0.75rem', color: '#f1f5f9' }}
                        itemStyle={{ fontWeight: 600 }}
                        formatter={(value, name) => {
                          const fw = FRAMEWORKS.find(f => `${f.key}_${metric.id}` === name);
                          return [`${value} ${metric.unit}`, fw ? fw.name : name];
                        }}
                        labelFormatter={(label) => `${label} Transactions`}
                      />
                      
                      {FRAMEWORKS.map(fw => (
                        visibleLines[fw.key] && (
                          <Line 
                            key={`${fw.key}_${metric.id}`}
                            type="monotone" 
                            name={`${fw.key}_${metric.id}`}
                            dataKey={`${fw.key}_${metric.id}`} 
                            stroke={fw.color} 
                            strokeWidth={3} 
                            dot={{ r: 3, fill: '#0f172a', stroke: fw.color, strokeWidth: 2 }} 
                            activeDot={{ r: 6 }} 
                            animationDuration={1500} 
                          />
                        )
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
            
          </div>
        )}
      </div>
    </div>
  );
}
