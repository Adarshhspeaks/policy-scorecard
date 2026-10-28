import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckIcon, 
  AlertTriangleIcon, 
  HelpCircleIcon, 
  ChevronDownIcon, 
  CopyIcon,
  CheckIcon as CopiedCheckIcon
} from './Icons';
import { getFieldTitle, getFieldDescription, getStatusBadge, getConfidenceBadge, extractPageNumber } from '../utils/formatters';
import { ClampedValue } from '../utils/factHighlighter';

export default function ScorecardCard({ fieldKey, data, isExpandedDefault = false }) {
  const [showClause, setShowClause] = useState(isExpandedDefault);
  const [copied, setCopied] = useState(false);

  const title = getFieldTitle(fieldKey);
  const description = getFieldDescription(fieldKey);

  const status = data?.status || 'not_found';
  const page = extractPageNumber(data);
  const badge = getStatusBadge(status, page);
  const confidenceBadge = getConfidenceBadge(data?.confidence);

  const handleCopyClause = (e) => {
    e.stopPropagation();
    if (data?.clause) {
      navigator.clipboard.writeText(data.clause);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckIcon className="w-3.5 h-3.5 text-verified flex-shrink-0" />;
      case 'unverified':
        return <AlertTriangleIcon className="w-3.5 h-3.5 text-unverified flex-shrink-0" />;
      case 'not_found':
      default:
        return <HelpCircleIcon className="w-3.5 h-3.5 text-not-found flex-shrink-0" />;
    }
  };

  return (
    <motion.div
      layout="position"
      className="rounded-card bg-surface border border-border p-5 flex flex-col justify-between transition-colors hover:border-border/80"
    >
      <div>
        {/* Card Header: Title & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-serif text-base font-semibold text-text tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-text-muted mt-0.5 leading-normal">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start">
            {/* Status Badge: Icon + Text (Color is never only indicator) */}
            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium border ${badge.classes}`}
            >
              {renderStatusIcon()}
              <span>{badge.label}</span>
            </span>

            {/* Optional confidence tag */}
            {confidenceBadge && status !== 'not_found' && (
              <span className={`px-2 py-0.5 rounded-[4px] border ${confidenceBadge.classes}`}>
                {confidenceBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Card Body: Plain-Language Value with Key Facts Auto-Highlighted & Line Clamping */}
        <div className="mt-3">
          {data?.value ? (
            <ClampedValue text={data.value} />
          ) : (
            <p className="text-sm text-not-found italic">
              Not explicitly stated or found in document.
            </p>
          )}

          {status === 'unverified' && data?.note && (
            <div className="mt-2.5 p-2.5 rounded-btn bg-unverified-bg border border-unverified/30 text-xs text-unverified flex items-start space-x-2">
              <AlertTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-unverified" />
              <span>{data.note}</span>
            </div>
          )}
        </div>
      </div>

      {/* Monospace Quote Drawer for Exact Verbatim Clause */}
      {data?.clause && (
        <div className="mt-4 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => setShowClause(!showClause)}
            aria-expanded={showClause}
            className="w-full flex items-center justify-between text-xs font-medium text-text-muted hover:text-text transition-colors min-h-[44px] py-2 cursor-pointer focus-visible:ring-1 focus-visible:ring-accent rounded-btn"
          >
            <span className="flex items-center space-x-1.5">
              <span>{showClause ? 'Hide verbatim quote' : 'Show verbatim quote'}</span>
              {page && (
                <span className="font-mono text-[11px] text-accent bg-accent/10 px-1.5 py-0.2 rounded border border-accent/20">
                  p. {page}
                </span>
              )}
            </span>
            <motion.span
              animate={{ rotate: showClause ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              <ChevronDownIcon className="w-4 h-4 text-text-muted" />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {showClause && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3.5 rounded-btn bg-surface-2 border-l-2 border-accent border-y border-r border-border font-mono text-xs text-text leading-relaxed relative">
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-border/80 text-[11px] text-text-muted">
                    <span className="font-sans font-medium uppercase tracking-wider text-[10px]">
                      VERBATIM CITATION {page ? `(PAGE ${page})` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyClause}
                      className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-surface hover:bg-border text-text-muted hover:text-text transition-colors min-h-[32px] cursor-pointer"
                      title="Copy exact clause"
                    >
                      {copied ? (
                        <>
                          <CopiedCheckIcon className="w-3 h-3 text-verified" />
                          <span className="text-verified">Copied</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3 h-3 text-text-muted" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <blockquote className="italic font-mono text-text">
                    "{data.clause}"
                  </blockquote>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
