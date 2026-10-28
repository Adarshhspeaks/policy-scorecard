import React, { useState, useEffect } from 'react';
import { ScaleIcon, SparklesIcon } from './Icons';

const COMPARE_STEPS = [
  { label: 'Reading PDF pages for both policies in parallel...', duration: 2500 },
  { label: 'Extracting key terms with Google Gemini AI...', duration: 4500 },
  { label: 'Cross-verifying clauses against cited pages...', duration: 4000 },
  { label: 'Highlighting differences & waiting period contrasts...', duration: 3000 },
];

export default function LoadingCompare({ fileA, fileB }) {
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
    const timeouts = COMPARE_STEPS.map((step, idx) => {
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
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Central Compare Animation */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {/* Policy A doc icon */}
          <div className="w-16 h-20 rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-2 shadow-inner flex flex-col justify-between relative overflow-hidden animate-pulse">
            <div className="space-y-1 opacity-50">
              <div className="h-1 bg-indigo-300 rounded w-3/4"></div>
              <div className="h-1 bg-indigo-400 rounded w-full"></div>
              <div className="h-1 bg-indigo-300 rounded w-1/2"></div>
            </div>
            <span className="text-[9px] font-bold text-indigo-300 tracking-wider">DOC A</span>
          </div>

          {/* Scale comparison icon */}
          <div className="w-12 h-12 rounded-full bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-indigo-400 shadow-md">
            <ScaleIcon className="w-6 h-6 animate-bounce" />
          </div>

          {/* Policy B doc icon */}
          <div className="w-16 h-20 rounded-xl bg-purple-950/40 border border-purple-500/30 p-2 shadow-inner flex flex-col justify-between relative overflow-hidden animate-pulse">
            <div className="space-y-1 opacity-50">
              <div className="h-1 bg-purple-300 rounded w-3/4"></div>
              <div className="h-1 bg-purple-400 rounded w-full"></div>
              <div className="h-1 bg-purple-300 rounded w-1/2"></div>
            </div>
            <span className="text-[9px] font-bold text-purple-300 tracking-wider">DOC B</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-zinc-100 mb-1 flex items-center justify-center space-x-2">
          <span>Comparing Both Policies</span>
          <span className="flex space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
          </span>
        </h3>

        <div className="flex items-center justify-center space-x-2 text-xs text-zinc-400 font-mono mb-6 truncate max-w-md mx-auto">
          <span className="text-indigo-300 truncate max-w-[150px]">{fileA?.name || 'Policy A'}</span>
          <span className="text-zinc-600 font-bold">vs</span>
          <span className="text-purple-300 truncate max-w-[150px]">{fileB?.name || 'Policy B'}</span>
        </div>

        {/* Steps progress */}
        <div className="w-full max-w-md mx-auto space-y-2.5 my-6">
          {COMPARE_STEPS.map((step, idx) => {
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
          <span>Simultaneous dual verification</span>
        </div>
      </div>
    </div>
  );
}
