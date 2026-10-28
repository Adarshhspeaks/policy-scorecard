import React from 'react';
import { ShieldCheckIcon } from './Icons';

export default function Navbar({ onReset, hasResults }) {
  return (
    <header className="border-b border-border bg-surface/90 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center space-x-3 text-left group focus-visible:ring-2 focus-visible:ring-accent rounded-btn p-1 -ml-1 transition-opacity"
          aria-label="Policy Scorecard home"
        >
          <div className="w-9 h-9 rounded-btn bg-surface-2 border border-border flex items-center justify-center text-accent">
            <ShieldCheckIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg font-semibold tracking-tight text-text">
                Policy Scorecard
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-text-muted leading-none hidden sm:block">
              Verbatim Health Insurance Verification
            </p>
          </div>
        </button>

        {hasResults && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-text-muted hover:text-text transition-colors min-h-[44px] px-3 inline-flex items-center focus-visible:ring-2 focus-visible:ring-accent rounded-btn"
          >
            ← Back to Upload
          </button>
        )}
      </div>
    </header>
  );
}
