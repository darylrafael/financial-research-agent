"use client";
import React, { useState } from 'react';

interface SentimentBreakdown { bullish_count: number; bearish_count: number; neutral_count: number; }
interface TechnicalSignal { signal: string; support_level: number; resistance_level: number; reasoning: string; }
interface NewsSentiment { overall_sentiment: string; article_count: number; top_headlines: string[]; sentiment_breakdown: SentimentBreakdown; }
interface MacroSignal { index_performance_7d: number; correlation_signal: string; sector_context: string; }
interface SynthesisReport { executive_summary: string; bull_case: string[]; bear_case: string[]; confidence_score: number; recommendation: string; time_horizon: string; key_risks: string[]; }

type AgentResult = TechnicalSignal | NewsSentiment | MacroSignal;

type SSEEvent = 
  | { event: 'started'; ticker: string; timestamp: string }
  | { event: 'agent_started'; agent: string; timestamp: string }
  | { event: 'agent_completed'; agent: string; result: AgentResult }
  | { event: 'error'; agent: string; error: string }
  | { event: 'final_report'; agent: string; report: SynthesisReport; report_id: number };

export default function SearchPage() {
  const [ticker, setTicker] = useState("");
  const [logs, setLogs] = useState<SSEEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const startAnalysis = async () => {
    setLoading(true);
    setLogs([]);
    
    const response = await fetch(`http://localhost:8000/api/analyze/${ticker}`, {
      method: "POST"
    });
    
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          
          if (chunk.startsWith("data: ")) {
            const dataStr = chunk.substring(6);
            try {
              const data = JSON.parse(dataStr) as SSEEvent;
              setLogs(prev => [...prev, data]);
            } catch (e) {}
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Financial Agent Analysis</h1>
      <div className="flex gap-4 mb-8">
        <input 
          type="text" 
          value={ticker} 
          onChange={e => setTicker(e.target.value)}
          placeholder="Ticker (e.g. AAPL)"
          className="border border-slate-300 p-2 rounded w-64 text-black bg-white"
        />
        <button 
          onClick={startAnalysis}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      
      <div className="space-y-4">
        {logs.map((log, i) => {
          switch (log.event) {
            case 'started':
              return <div key={i} className="p-4 border border-slate-200 rounded bg-slate-50 text-black font-bold shadow-sm">Started analysis for {log.ticker}</div>;
            case 'agent_started':
              return <div key={i} className="p-4 border border-slate-200 rounded bg-slate-50 text-black shadow-sm">Started {log.agent}...</div>;
            case 'agent_completed':
              return <div key={i} className="p-4 border border-green-200 rounded bg-green-50 text-green-800 font-bold shadow-sm">{log.agent} Completed</div>;
            case 'error':
              return <div key={i} className="p-4 border border-red-200 rounded bg-red-50 text-red-800 shadow-sm">Error in {log.agent}: {log.error}</div>;
            case 'final_report':
              return (
                <div key={i} className="p-6 border-2 border-blue-400 rounded-lg bg-blue-50 text-blue-900 shadow-md">
                  <h2 className="font-bold text-2xl mb-4 text-blue-950">Synthesis Complete (Report ID: {log.report_id})</h2>
                  <div className="bg-white p-4 rounded border border-blue-100 shadow-inner">
                    <p className="text-lg leading-relaxed">{log.report.executive_summary}</p>
                  </div>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
