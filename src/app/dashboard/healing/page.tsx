'use client';

import React, { useEffect, useState } from 'react';

interface HealingEvent {
  id: string;
  timestamp: string;
  filePath: string;
  analysis: string;
  visualContext: boolean;
  status: string;
}

export default function HealMonitoring() {
  const [history, setHistory] = useState<HealingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const checkAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = await fetch('/api/ai/history', {
      headers: { 'x-specs-access-code': passcode }
    });
    if (res.ok) {
      const data = await res.json();
      setHistory(data);
      setIsAuthorized(true);
      setLoading(false);
      localStorage.setItem('specs_admin_token', passcode);
    } else {
      setError('Invalid Access Code');
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('specs_admin_token');
    if (savedToken) {
      setPasscode(savedToken);
      // Auto-check if token exists
      fetch('/api/ai/history', { headers: { 'x-specs-access-code': savedToken } })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          setHistory(data);
          setIsAuthorized(true);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-gray-500 font-mono">INITIALIZING ADMIN CORE...</div>;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111115] border border-[#23232a] p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto text-blue-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2 text-white">Admin Access Only</h1>
          <p className="text-gray-500 text-center text-sm mb-8">Enter your SpecsAI access code to monitor resilience.</p>
          <form onSubmit={checkAuth} className="space-y-4">
            <input 
              type="password" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Access Code"
              className="w-full bg-[#0a0a0c] border border-[#23232a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all text-center tracking-widest"
            />
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95">
              Unlock Resilience Center
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalHealed = history.length;
  const hoursSaved = (totalHealed * 1.5).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Heal Monitoring Center
            </h1>
            <p className="text-gray-400 mt-2 italic">Admin Mode: Active Control</p>
          </div>
          <div className="flex gap-4">
            {/* Resilience Chart */}
            <div className="bg-[#16161a] border border-[#23232a] p-4 rounded-xl flex items-end gap-1 h-[84px]">
               <div className="w-2 bg-blue-500/20 h-full rounded-t-sm"></div>
               <div className="w-2 bg-blue-500/40 h-3/4 rounded-t-sm"></div>
               <div className="w-2 bg-blue-500/60 h-1/2 rounded-t-sm"></div>
               <div className="w-2 bg-blue-500/80 h-5/6 rounded-t-sm"></div>
               <div className="w-2 bg-blue-500 h-full rounded-t-sm animate-pulse"></div>
               <div className="ml-2">
                 <div className="text-[10px] text-gray-500 uppercase font-bold leading-tight">System<br/>Resilience</div>
                 <div className="text-lg font-mono font-bold text-blue-400 leading-none">94.2%</div>
               </div>
            </div>
            <div className="bg-[#16161a] border border-[#23232a] p-4 rounded-xl min-w-[140px]">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Healed</div>
              <div className="text-2xl font-mono font-bold text-blue-400">{totalHealed}</div>
            </div>
            <div className="bg-[#16161a] border border-[#23232a] p-4 rounded-xl min-w-[140px]">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hours Reclaimed</div>
              <div className="text-2xl font-mono font-bold text-green-400">{hoursSaved}h</div>
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse text-lg">
              Synchronizing with Autonomous Agents...
            </div>
          ) : history.length === 0 ? (
            <div className="bg-[#111115] border border-dashed border-[#23232a] rounded-2xl p-20 text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-medium text-gray-300">System is Resilient</h3>
              <p className="text-gray-500 mt-2">No failures detected. Autonomous agents are on standby.</p>
            </div>
          ) : (
            history.map((event) => (
              <div 
                key={event.id}
                className="bg-[#111115] border border-[#23232a] rounded-2xl p-6 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                        Self-Healing Patch: {event.filePath.split('/').pop()}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono uppercase tracking-tighter">
                        {new Date(event.timestamp).toLocaleString()} • {event.filePath}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.visualContext && (
                      <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-1 rounded-full border border-purple-500/20 uppercase font-bold">
                        Vision AI Enabled
                      </span>
                    )}
                    <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-1 rounded-full border border-green-500/20 uppercase font-bold">
                      Verified Fix
                    </span>
                  </div>
                </div>

                <div className="bg-[#0a0a0c] rounded-xl p-5 border border-[#1b1b20]">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
                    Root Cause Analysis
                  </h4>
                  <div className="text-gray-300 text-sm leading-relaxed prose prose-invert max-w-none">
                    {event.analysis.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-4">
                  <button className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Diff
                  </button>
                  <button className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">
                    View Pull Request →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
