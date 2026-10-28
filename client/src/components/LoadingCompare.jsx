import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScaleIcon } from './Icons';

export default function LoadingCompare({ fileA, fileB }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "Reading Policy Documents", desc: "Parsing text streams from Policy A & Policy B in parallel" },
    { title: "Extracting Comparable Terms", desc: "Aligning waiting periods, room caps, and sub-limits" },
    { title: "Detecting Discrepancies", desc: "Cross-validating exact clauses and computing differences" },
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setCurrentStep(1), 1400);
    const t2 = setTimeout(() => setCurrentStep(2), 2900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-8 space-y-8">
      {/* Document Meta Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-card bg-surface border border-border flex items-center justify-center text-accent">
          <ScaleIcon className="w-6 h-6 text-accent" />
        </div>
        <h2 className="font-serif text-xl font-medium text-text">
          Comparing Two Policies
        </h2>
        <div className="flex items-center justify-center space-x-2 text-xs font-mono text-text-muted">
          <span className="truncate max-w-[160px] text-text">{fileA?.name || 'Policy A'}</span>
          <span>vs</span>
          <span className="truncate max-w-[160px] text-text">{fileB?.name || 'Policy B'}</span>
        </div>
      </div>

      {/* Progress Steps List */}
      <div className="p-5 rounded-card bg-surface border border-border divide-y divide-border/80">
        {steps.map((step, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx;

          return (
            <div
              key={step.title}
              className={`py-3.5 first:pt-0 last:pb-0 flex items-start space-x-3 transition-opacity ${
                isDone || isCurrent ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                {isDone ? (
                  <svg className="w-3.5 h-3.5 text-verified" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                      d="M20 6 9 17 4 12"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                  </svg>
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-accent" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-text">
                    {step.title}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.2 rounded border border-accent/20">
                      In progress
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skeletons Preview */}
      <div className="space-y-3 pt-2">
        <p className="text-xs font-mono uppercase tracking-wider text-text-muted text-center">
          Building 3-Column Comparison Matrix
        </p>
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="p-4 rounded-card bg-surface/50 border border-border grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <div className="h-10 bg-surface-2 rounded" />
              <div className="h-10 bg-surface-2/60 rounded" />
              <div className="h-10 bg-surface-2/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
