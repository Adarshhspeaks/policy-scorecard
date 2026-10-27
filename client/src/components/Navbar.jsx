import React from 'react';
import { ShieldCheckIcon } from './Icons';

export default function Navbar({ onReset, hasResults }) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <header className="border-b border-zinc-800/80 bg-[#0d121d]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div 
          onClick={onReset}
          className="flex items-center space-x-3 cursor-pointer group"
          role="button"
          tabIndex={0}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-zinc-100 tracking-tight group-hover:text-white transition-colors">
                Policy Scorecard
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Verifier
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Verbatim clause extraction & citation validation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {hasResults && (
            <button
              onClick={onReset}
              className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <span>+ Upload New PDF</span>
            </button>
          )}

          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-zinc-400 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-zinc-500">API:</span>
            <span className="text-zinc-300 truncate max-w-[150px]">{apiUrl}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
