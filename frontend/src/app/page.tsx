"use client";
import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Newspaper, 
  Globe, 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Terminal,
  Cpu,
  BarChart3,
  Percent,
  AlertCircle
} from 'lucide-react';

interface SentimentBreakdown {
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
}

interface TechnicalSignal {
  signal: "BULLISH" | "BEARISH" | "NEUTRAL";
  support_level: number;
  resistance_level: number;
  reasoning: string;
}

interface NewsSentiment {
  overall_sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  article_count: number;
  top_headlines: string[];
  sentiment_breakdown: SentimentBreakdown;
}

interface MacroSignal {
  index_performance_7d: number;
  correlation_signal: "HIGH" | "MODERATE" | "LOW";
  sector_context: string;
}

interface SynthesisReport {
  executive_summary: string;
  bull_case: string[];
  bear_case: string[];
  confidence_score: number;
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  time_horizon: "SHORT" | "MEDIUM" | "LONG";
  key_risks: string[];
}

interface AgentState {
  status: 'idle' | 'running' | 'success' | 'error';
  error?: string;
  data?: any;
}

interface LogEntry {
  text: string;
  type: 'info' | 'success' | 'error' | 'synthesis';
  timestamp: string;
}

export default function SearchPage() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [reportId, setReportId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({
    TechnicalAgent: { status: 'idle' },
    NewsSentimentAgent: { status: 'idle' },
    MacroContextAgent: { status: 'idle' },
    SynthesisAgent: { status: 'idle' },
  });

  const handleSSEEvent = (data: any) => {
    const timeStr = new Date().toLocaleTimeString();
    
    switch (data.event) {
      case 'started':
        setLogs(prev => [...prev, { text: `Initiated multi-agent analysis for ticker: ${data.ticker}`, type: 'info', timestamp: timeStr }]);
        break;
        
      case 'agent_started':
        setAgentStates(prev => ({
          ...prev,
          [data.agent]: { status: 'running' }
        }));
        setLogs(prev => [...prev, { text: `Spawning ${data.agent} execution thread...`, type: 'info', timestamp: timeStr }]);
        break;
        
      case 'agent_completed':
        setAgentStates(prev => ({
          ...prev,
          [data.agent]: { status: 'success', data: data.result }
        }));
        setLogs(prev => [...prev, { text: `[${data.agent}] Thread resolved successfully`, type: 'success', timestamp: timeStr }]);
        break;
        
      case 'error':
        setAgentStates(prev => ({
          ...prev,
          [data.agent]: { status: 'error', error: data.error }
        }));
        setLogs(prev => [...prev, { text: `[${data.agent}] Failed: ${data.error}`, type: 'error', timestamp: timeStr }]);
        break;
        
      case 'final_report':
        setAgentStates(prev => ({
          ...prev,
          SynthesisAgent: { status: 'success', data: data.report }
        }));
        setReportId(data.report_id);
        setLogs(prev => [...prev, { text: `Synthesis Report successfully compiled & saved (DB ID: ${data.report_id})`, type: 'synthesis', timestamp: timeStr }]);
        break;
        
      default:
        break;
    }
  };

  const startAnalysis = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setLogs([]);
    setErrorMsg(null);
    setReportId(null);
    setAgentStates({
      TechnicalAgent: { status: 'idle' },
      NewsSentimentAgent: { status: 'idle' },
      MacroContextAgent: { status: 'idle' },
      SynthesisAgent: { status: 'idle' },
    });

    try {
      const targetTicker = ticker.trim().toUpperCase();
      const response = await fetch(`http://localhost:8000/api/analyze/${targetTicker}`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Server response body stream is missing");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split by lines to robustly support \r\n (standard network HTTP format) and \n
        const lines = buffer.split(/\r?\n/);
        // Save back any partial line remaining
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.substring(6);
            try {
              const parsed = JSON.parse(dataStr);
              handleSSEEvent(parsed);
            } catch (e) {
              console.error("Failed to parse event JSON chunk:", dataStr, e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred connecting to the backend services.");
    } finally {
      setLoading(false);
    }
  };

  // Helper styling methods
  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">STRONG BUY</span>;
      case 'BUY':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">BUY</span>;
      case 'HOLD':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">HOLD</span>;
      case 'SELL':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25">SELL</span>;
      case 'STRONG_SELL':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">STRONG SELL</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/25">{rec}</span>;
    }
  };

  const getSignalBadge = (sig: string) => {
    switch (sig) {
      case 'BULLISH':
        return <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><TrendingUp size={14} /> BULLISH</span>;
      case 'BEARISH':
        return <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"><TrendingDown size={14} /> BEARISH</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20"><Activity size={14} /> NEUTRAL</span>;
    }
  };

  // State flags
  const tech = agentStates.TechnicalAgent;
  const news = agentStates.NewsSentimentAgent;
  const macro = agentStates.MacroContextAgent;
  const synth = agentStates.SynthesisAgent;
  const hasAnalysis = tech.status !== 'idle' || news.status !== 'idle' || macro.status !== 'idle';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Banner Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(8,145,178,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Global Wrapper */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-lg text-slate-950 shadow-lg shadow-cyan-500/10">
                <Cpu size={24} className="animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
                Antigravity Financial Research Suite
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Multi-Agent Quantitative & Qualitative Market Synthesis
            </p>
          </div>

          {/* Search Inputs */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={ticker} 
                onChange={e => setTicker(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startAnalysis()}
                placeholder="Ticker symbol (e.g. TSLA, AAPL)"
                className="w-full md:w-64 pl-10 pr-4 py-2 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all backdrop-blur-sm"
              />
            </div>
            <button 
              onClick={startAnalysis}
              disabled={loading || !ticker.trim()}
              className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing
                </>
              ) : (
                'Run Analysis'
              )}
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5 text-rose-400" size={18} />
            <div>
              <p className="font-semibold text-sm">Service Communication Failure</p>
              <p className="text-xs text-rose-400/90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!hasAnalysis ? (
          /* Empty / Landing State */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/20 border border-slate-800/40 rounded-3xl backdrop-blur-sm">
            <div className="bg-slate-900/60 p-4 rounded-full border border-slate-800/60 mb-4 text-slate-500">
              <BarChart3 size={40} className="stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">No Active Analysis</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-1">
              Enter a stock ticker above (e.g. AAPL, MSFT, TSLA) to trigger the parallel research agents.
            </p>
          </div>
        ) : (
          /* Dashboard Layout Grid */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar: Agents Execution Log & Status */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Agent Thread Statuses */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-sm shadow-sm">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Cpu size={16} className="text-cyan-400" />
                  Agent Execution Threads
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'TechnicalAgent', label: 'Technical Signal' },
                    { key: 'NewsSentimentAgent', label: 'News Sentiment' },
                    { key: 'MacroContextAgent', label: 'Macro context' },
                    { key: 'SynthesisAgent', label: 'Synthesis Report' }
                  ].map(item => {
                    const status = agentStates[item.key]?.status || 'idle';
                    return (
                      <div key={item.key} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{item.label}</span>
                        {status === 'idle' && (
                          <span className="text-slate-600 flex items-center gap-1 font-medium bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Idle</span>
                        )}
                        {status === 'running' && (
                          <span className="text-cyan-400 flex items-center gap-1 font-medium bg-cyan-950/20 border border-cyan-800/30 px-2 py-0.5 rounded animate-pulse">
                            <Loader2 size={10} className="animate-spin" />
                            Running
                          </span>
                        )}
                        {status === 'success' && (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/20 border border-emerald-800/30 px-2 py-0.5 rounded">
                            <CheckCircle2 size={10} />
                            Success
                          </span>
                        )}
                        {status === 'error' && (
                          <span className="text-rose-400 flex items-center gap-1 font-medium bg-rose-950/20 border border-rose-800/30 px-2 py-0.5 rounded">
                            <XCircle size={10} />
                            Failed
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Console log stream */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/50 pb-2">
                  <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal size={14} className="text-slate-400" />
                    Process Logs
                  </h3>
                  {loading && <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping" />}
                </div>
                <div className="h-48 overflow-y-auto space-y-2.5 font-mono text-[10px] scrollbar-thin scrollbar-thumb-slate-800 pr-1 text-slate-500">
                  {logs.length === 0 ? (
                    <div className="text-slate-600 italic">Waiting for analysis sequence...</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="leading-normal">
                        <span className="text-slate-600 mr-1.5">[{log.timestamp}]</span>
                        {log.type === 'success' && <span className="text-emerald-500/90">{log.text}</span>}
                        {log.type === 'error' && <span className="text-rose-400/90">{log.text}</span>}
                        {log.type === 'synthesis' && <span className="text-cyan-400/90 font-medium">{log.text}</span>}
                        {log.type === 'info' && <span>{log.text}</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Panel: Dashboard cards */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Synthesis Report Card (Top Dominant) */}
              <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-850 rounded-3xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
                
                <div className="flex justify-between items-start gap-4 mb-5 border-b border-slate-800/60 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      Synthesis Intelligence Report
                      {reportId && <span className="text-xs font-mono font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">ID: {reportId}</span>}
                    </h2>
                    <p className="text-xs text-slate-400">Consolidated outlook derived from Technical, News Sentiment, and Macro conditions</p>
                  </div>
                  {synth.status === 'success' && synth.data?.recommendation && (
                    <div className="flex items-center gap-2">
                      {getRecommendationBadge(synth.data.recommendation)}
                      {synth.data.time_horizon && (
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-400 border border-slate-700">{synth.data.time_horizon} HORIZON</span>
                      )}
                    </div>
                  )}
                </div>

                {synth.status === 'running' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="animate-spin text-cyan-400 mb-3" size={32} />
                    <p className="text-sm font-medium text-slate-300">Synthesizing intelligence inputs...</p>
                    <p className="text-xs text-slate-500 mt-0.5">Prompting OpenRouter deepseek-v4 model</p>
                  </div>
                )}

                {synth.status === 'idle' && (
                  <div className="py-12 text-center text-slate-500 text-sm italic">
                    Waiting for core agent feeds to resolve...
                  </div>
                )}

                {synth.status === 'error' && (
                  <div className="py-6 text-center border border-rose-500/10 rounded-xl bg-rose-500/5 text-rose-400 text-sm">
                    <AlertTriangle className="mx-auto text-rose-500 mb-2" size={24} />
                    <p className="font-semibold">Synthesis Agent Failed</p>
                    <p className="text-xs text-rose-400/80 mt-1">{synth.error || "Unknown synthesis error."}</p>
                  </div>
                )}

                {synth.status === 'success' && synth.data && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    
                    {/* Executive Summary & Cases (Left 3 columns) */}
                    <div className="md:col-span-3 space-y-5">
                      <div className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-xl leading-relaxed text-sm text-slate-200">
                        {synth.data.executive_summary}
                      </div>

                      {/* Bull / Bear Cases split */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Bull Case */}
                        <div className="bg-slate-900/30 border border-slate-800/30 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp size={14} />
                            Bull Factors
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {synth.data.bull_case?.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 font-bold shrink-0">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                            {(!synth.data.bull_case || synth.data.bull_case.length === 0) && (
                              <li className="text-slate-500 italic">No clear bullish triggers.</li>
                            )}
                          </ul>
                        </div>

                        {/* Bear Case */}
                        <div className="bg-slate-900/30 border border-slate-800/30 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-rose-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingDown size={14} />
                            Bear Factors
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {synth.data.bear_case?.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-rose-500 mt-0.5 font-bold shrink-0">×</span>
                                <span>{item}</span>
                              </li>
                            ))}
                            {(!synth.data.bear_case || synth.data.bear_case.length === 0) && (
                              <li className="text-slate-500 italic">No clear bearish triggers.</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Key Risks */}
                      {synth.data.key_risks && synth.data.key_risks.length > 0 && (
                        <div className="bg-slate-950/20 border border-amber-950/20 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-amber-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle size={14} />
                            Key Risk Vectors
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-300">
                            {synth.data.key_risks.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-amber-500 shrink-0 font-medium">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Confidence Score Dial (Right 1 column) */}
                    <div className="md:col-span-1 bg-slate-950/40 border border-slate-800/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                      <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Confidence Score</h4>
                      
                      {/* Circular Gauge */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          {/* Track */}
                          <circle 
                            cx="56" cy="56" r="48" 
                            className="stroke-slate-800" 
                            strokeWidth="8" fill="transparent" 
                          />
                          {/* Indicator */}
                          <circle 
                            cx="56" cy="56" r="48" 
                            className="stroke-cyan-500 transition-all duration-1000" 
                            strokeWidth="8" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 48}
                            strokeDashoffset={2 * Math.PI * 48 * (1 - (synth.data.confidence_score || 0) / 100)}
                          />
                        </svg>
                        <div className="text-center z-10">
                          <span className="text-3xl font-extrabold text-slate-100">{synth.data.confidence_score}%</span>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 mt-4 max-w-[120px] leading-normal">
                        Based on consistency of news context, macro weights, and technical parameters.
                      </p>
                    </div>

                  </div>
                )}
              </div>

              {/* Lower Section: 3 Columns Grid for base agents */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Technical Agent Card */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-sm shadow-md">
                  <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                    <Activity size={14} className="text-cyan-400" />
                    Technical Parameters
                  </h3>

                  {tech.status === 'running' && (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                      <Loader2 className="animate-spin text-cyan-400/80 mb-2" size={20} />
                      <p className="text-xs text-slate-500">Querying market metrics...</p>
                    </div>
                  )}

                  {tech.status === 'idle' && (
                    <div className="py-8 text-center text-slate-600 text-xs italic">Awaiting trigger...</div>
                  )}

                  {tech.status === 'error' && (
                    <div className="py-4 text-center bg-rose-950/20 border border-rose-800/20 rounded-xl text-xs text-rose-400">
                      <XCircle className="mx-auto text-rose-500 mb-1" size={16} />
                      <p className="font-semibold">Execution Failed</p>
                      <p className="text-[10px] text-rose-400/80 mt-0.5">{tech.error || "Error details unavailable."}</p>
                    </div>
                  )}

                  {tech.status === 'success' && tech.data && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Generated Signal</div>
                        <div className="mt-1">{getSignalBadge(tech.data.signal)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-950/40 border border-slate-800/40 p-2.5 rounded-xl">
                        <div>
                          <div className="text-[9px] text-slate-500 uppercase">Support</div>
                          <div className="text-sm font-bold text-slate-200 mt-0.5">${tech.data.support_level}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500 uppercase">Resistance</div>
                          <div className="text-sm font-bold text-slate-200 mt-0.5">${tech.data.resistance_level}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Analysis Reasoning</div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{tech.data.reasoning}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* News Sentiment Agent Card */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-sm shadow-md">
                  <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                    <Newspaper size={14} className="text-cyan-400" />
                    Sentiment Indexes
                  </h3>

                  {news.status === 'running' && (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                      <Loader2 className="animate-spin text-cyan-400/80 mb-2" size={20} />
                      <p className="text-xs text-slate-500">Scanning news indices...</p>
                    </div>
                  )}

                  {news.status === 'idle' && (
                    <div className="py-8 text-center text-slate-600 text-xs italic">Awaiting trigger...</div>
                  )}

                  {news.status === 'error' && (
                    <div className="py-4 text-center bg-rose-950/20 border border-rose-800/20 rounded-xl text-xs text-rose-400">
                      <XCircle className="mx-auto text-rose-500 mb-1" size={16} />
                      <p className="font-semibold">Execution Failed</p>
                      <p className="text-[10px] text-rose-400/80 mt-0.5">{news.error || "Error details unavailable."}</p>
                    </div>
                  )}

                  {news.status === 'success' && news.data && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Overall Sentiment</div>
                          <div className="mt-1">{getSignalBadge(news.data.overall_sentiment)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase">Articles</div>
                          <div className="text-sm font-bold text-slate-200 mt-1">{news.data.article_count} scanned</div>
                        </div>
                      </div>

                      {/* Visual Breakdown Bar */}
                      {news.data.sentiment_breakdown && (
                        <div>
                          <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                            <span>BULLISH ({news.data.sentiment_breakdown.bullish_count})</span>
                            <span>BEARISH ({news.data.sentiment_breakdown.bearish_count})</span>
                          </div>
                          
                          {/* Stacked bar */}
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                            {/* Bullish */}
                            <div 
                              className="bg-emerald-500 h-full" 
                              style={{ 
                                width: `${(news.data.sentiment_breakdown.bullish_count / Math.max(1, news.data.article_count)) * 100}%` 
                              }} 
                            />
                            {/* Neutral */}
                            <div 
                              className="bg-slate-500 h-full" 
                              style={{ 
                                width: `${(news.data.sentiment_breakdown.neutral_count / Math.max(1, news.data.article_count)) * 100}%` 
                              }} 
                            />
                            {/* Bearish */}
                            <div 
                              className="bg-rose-500 h-full" 
                              style={{ 
                                width: `${(news.data.sentiment_breakdown.bearish_count / Math.max(1, news.data.article_count)) * 100}%` 
                              }} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Headline List snippet */}
                      {news.data.top_headlines && news.data.top_headlines.length > 0 && (
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Featured Headlines</div>
                          <ul className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1 scrollbar-thin">
                            {news.data.top_headlines.slice(0, 3).map((headline: string, index: number) => (
                              <li key={index} className="text-[10px] text-slate-300 leading-snug border-l border-slate-800 pl-1.5 truncate">
                                {headline}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Macro Context Agent Card */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-sm shadow-md">
                  <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                    <Globe size={14} className="text-cyan-400" />
                    Macro Context
                  </h3>

                  {macro.status === 'running' && (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                      <Loader2 className="animate-spin text-cyan-400/80 mb-2" size={20} />
                      <p className="text-xs text-slate-500">Fetching macroeconomic contexts...</p>
                    </div>
                  )}

                  {macro.status === 'idle' && (
                    <div className="py-8 text-center text-slate-600 text-xs italic">Awaiting trigger...</div>
                  )}

                  {macro.status === 'error' && (
                    <div className="py-4 text-center bg-rose-950/20 border border-rose-800/20 rounded-xl text-xs text-rose-400">
                      <XCircle className="mx-auto text-rose-500 mb-1" size={16} />
                      <p className="font-semibold">Execution Failed</p>
                      <p className="text-[10px] text-rose-400/80 mt-0.5">{macro.error || "Error details unavailable."}</p>
                    </div>
                  )}

                  {macro.status === 'success' && macro.data && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Correlation Strength</div>
                          <div className="text-sm font-bold text-slate-200 mt-1 uppercase">
                            {macro.data.correlation_signal} CORRELATION
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase">Index Perf (7d)</div>
                          <div className={`text-sm font-bold mt-1 flex items-center justify-end gap-0.5 ${macro.data.index_performance_7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {macro.data.index_performance_7d >= 0 ? '+' : ''}{macro.data.index_performance_7d}%
                            {macro.data.index_performance_7d >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Sector Insights</div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{macro.data.sector_context}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
