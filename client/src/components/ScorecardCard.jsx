import React, { useState } from 'react';
import { 
  CheckIcon, 
  AlertTriangleIcon, 
  HelpCircleIcon, 
  ChevronDownIcon, 
  CopyIcon, 
  BookOpenIcon, 
  QuoteIcon 
} from './Icons';
import { 
  snakeToTitleCase, 
  getFieldTitle, 
  getFieldDescription, 
  extractPageNumber, 
  getStatusBadge, 
  getConfidenceBadge 
} from '../utils/formatters';

export default function ScorecardCard({ fieldKey, data, isDefaultExpanded = false }) {
  const [isClauseExpanded, setIsClauseExpanded] = useState(isDefaultExpanded);
  const [copied, setCopied] = useState(false);

  const status = data?.status || 'not_found';
  const page = extractPageNumber(data);
  const statusBadge = getStatusBadge(status, page);
  const confidenceBadge = getConfidenceBadge(data?.confidence);
  const title = getFieldTitle(fieldKey);
  const description = getFieldDescription(fieldKey);

  const handleCopyClause = (e) => {
    e.stopPropagation();
    if (!data?.clause) return;
    navigator.clipboard.writeText(data.clause);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasClause = Boolean(data?.clause && data.clause.trim().length > 0);

  return (
    <div className="rounded-xl bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700/80 transition-all duration-200 p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:shadow-indigo-500/5 group">
      <div>
        {/* Top bar: Status badge & Page number / Confidence */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.classes}`}
            >
              {status === 'verified' && <CheckIcon className="w-3.5 h-3.5" />}
              {status === 'unverified' && <AlertTriangleIcon className="w-3.5 h-3.5" />}
              {status === 'not_found' && <HelpCircleIcon className="w-3.5 h-3.5" />}
              <span>{statusBadge.label}</span>
            </span>
          </div>

          {/* Right badges: Page number & Confidence */}
          <div className="flex items-center space-x-2">
            {page && (
              <span className="inline-flex items-center space-x-1 text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                <BookOpenIcon className="w-3 h-3 text-zinc-400" />
                <span>Page {page}</span>
              </span>
            )}

            {confidenceBadge && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${confidenceBadge.classes}`}
              >
                {confidenceBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Human-readable field title (snake_case to Title Case) */}
        <div className="mb-2">
          <h4 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1" title={description}>
              {description}
            </p>
          )}
        </div>

        {/* Plain-Language Value */}
        <div className="mt-3">
          {status === 'not_found' ? (
            <p className="text-sm text-zinc-400 italic bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/60">
              Not specified or no matching clause found in the policy document.
            </p>
          ) : data?.value ? (
            <div className="text-sm text-zinc-200 leading-relaxed font-normal bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/70">
              {data.value}
            </div>
          ) : (
            <div className="text-sm text-amber-300/90 bg-amber-950/30 p-3 rounded-lg border border-amber-900/30">
              {data?.note || `Could not verify quote. Check page ${page || 'manually'}.`}
            </div>
          )}
        </div>

        {/* Note if unverified and value exists */}
        {status === 'unverified' && data?.value && data?.note && (
          <div className="mt-2 text-xs text-amber-400/90 flex items-center space-x-1.5 px-2">
            <AlertTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{data.note}</span>
          </div>
        )}
      </div>

      {/* Collapsible Exact Clause Section */}
      {hasClause && (
        <div className="mt-4 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setIsClauseExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors py-1 group/btn"
          >
            <span className="flex items-center space-x-1.5">
              <QuoteIcon className="w-3.5 h-3.5 text-indigo-400 opacity-80" />
              <span>{isClauseExpanded ? 'Hide exact clause' : 'Show exact clause'}</span>
            </span>
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                isClauseExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isClauseExpanded && (
            <div className="mt-2.5 p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 relative group/clause animate-fadeIn">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Verbatim Policy Citation
                </span>
                <button
                  type="button"
                  onClick={handleCopyClause}
                  className="inline-flex items-center space-x-1 text-[11px] font-medium text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
                  title="Copy verbatim clause"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <blockquote className="italic text-zinc-300 leading-relaxed font-serif pl-2 border-l-2 border-indigo-500/50">
                "{data.clause}"
              </blockquote>

              {page && (
                <div className="mt-2 text-right text-[10px] text-zinc-500 font-mono">
                  Cited on Page {page}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
