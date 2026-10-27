import React, { useState, useEffect } from 'react';
import { FilePdfIcon, SparklesIcon } from './Icons';
import { formatFileSize } from '../utils/formatters';

const STEPS = [
  { label: 'Reading PDF pages & character stream...', duration: 2500 },
  { label: 'Scanning health policy conditions with Gemini AI...', duration: 4000 },
  { label: 'Extracting verbatim clauses & cited page numbers...', duration: 4000 },
  { label: 'Verifying quotes against extracted source pages...', duration: 5000 },
];

export default function LoadingAnalysis({ file }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let accumulatedTime = 0;
    const timeouts = STEPS.map((step, idx) => {
      accumulatedTime += step.duration;
      return setTimeout(() => {
        setCurrentStepIndex((prev) => Math.max(prev, idx));
      }, accumulatedTime);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto py-8">
      <div className="p-8 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-center shadow-2xl relative overflow-hidden">
        {/* Subtle glowing animated background highlight */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Central Animated Document Scanner */}
        <div className="relative w-20 h-24 mx-auto mb-6 rounded-xl bg-zinc-800/90 border border-zinc-700/80 p-3 shadow-inner flex flex-col justify-between overflow-hidden">
          {/* Mock document lines */}
          <div className="space-y-1.5 opacity-40">
            <div className="h-1.5 bg-zinc-400 rounded w-3/4"></div>
            <div className="h-1.5 bg-zinc-500 rounded w-full"></div>
            <div className="h-1.5 bg-zinc-400 rounded w-5/6"></div>
            <div className="h-1.5 bg-zinc-500 rounded w-1/2"></div>
            <div className="h-1.5 bg-zinc-400 rounded w-4/5"></div>
          </div>

          <div className="flex items-center justify-between text-indigo-400 opacity-80 pt-1">
            <SparklesIcon className="w-4 h-4 animate-spin text-indigo-400" />
            <span className="text-[9px] font-mono font-bold tracking-wider">AI SCAN</span>
          </div>

          {/* Glowing scanner line moving up and down */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_#818cf8] animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>

        <h3 className="text-xl font-bold text-zinc-100 mb-1 flex items-center justify-center space-x-2">
          <span>Analyzing Policy Document</span>
          <span className="flex space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
          </span>
        </h3>

        {file && (
          <p className="text-xs text-zinc-400 font-mono mb-6 truncate max-w-md mx-auto">
            {file.name} ({formatFileSize(file.size)})
          </p>
        )}

        {/* Dynamic step status */}
        <div className="w-full max-w-md mx-auto space-y-2.5 my-6">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={idx}
                className={`flex items-center space-x-3 text-xs px-3.5 py-2.5 rounded-lg transition-all duration-300 ${
                  isCurrent
                    ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                    : isDone
                    ? 'bg-zinc-800/40 border border-transparent text-zinc-400'
                    : 'opacity-40 text-zinc-500 border border-transparent'
                }`}
              >
                <div className="flex-shrink-0">
                  {isDone ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700"></div>
                  )}
                </div>
                <span className="font-medium text-left flex-1">{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-zinc-500 flex items-center justify-center space-x-2 mt-4">
          <span>Elapsed time: {secondsElapsed}s</span>
          <span>•</span>
          <span>This typically takes 5–15 seconds</span>
        </div>
      </div>
    </div>
  );
}
