import React, { useState, useMemo } from 'react';
import { FIELD_DEFINITIONS } from '../constants/fieldDefinitions';
import { getFieldTitle, getFieldDescription, getStatusBadge, getConfidenceBadge, extractPageNumber } from '../utils/formatters';
import { isFieldDifferent, computeComparisonStats } from '../utils/diffChecker';
import { 
  ArrowLeftIcon, 
  DownloadIcon, 
  ScaleIcon, 
  AlertTriangleIcon, 
  ChevronDownIcon, 
  CopyIcon, 
  BookOpenIcon,
  SearchIcon,
  CheckIcon
} from './Icons';

function PolicyCell({ data, policyLabel, isMobile }) {
  const [showClause, setShowClause] = useState(false);
  const [copied, setCopied] = useState(false);

  const status = data?.status || 'not_found';
  const page = extractPageNumber(data);
  const badge = getStatusBadge(status, page);
  const confidenceBadge = getConfidenceBadge(data?.confidence);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (data?.clause) {
      navigator.clipboard.writeText(data.clause);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2 text-left">
      {isMobile && (
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
          {policyLabel}
        </div>
      )}

      {/* Status & Page Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${badge.classes}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
          <span>{badge.label}</span>
        </span>

        {page && (
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">
            Page {page}
          </span>
        )}

        {confidenceBadge && status === 'verified' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${confidenceBadge.classes}`}>
            {data.confidence}
          </span>
        )}
      </div>

      {/* Value or Unverified Warning */}
      {status === 'verified' ? (
        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
          {data?.value}
        </p>
      ) : status === 'unverified' ? (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1">
          <div className="flex items-center space-x-1.5 font-medium text-amber-300">
            <AlertTriangleIcon className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
            <span>Could not verify. Check page {page || 'manually'}.</span>
          </div>
          {data?.value && (
            <p className="text-zinc-400 text-[11px] italic">
              Extracted: "{data.value}"
            </p>
          )}
        </div>
      ) : (
        <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-500 text-xs italic">
          Not found in policy text.
        </div>
      )}

      {/* Collapsible Clause Quote */}
      {data?.clause && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowClause(!showClause)}
            className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
          >
            <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showClause ? 'rotate-180' : ''}`} />
            <span>{showClause ? 'Hide exact clause' : 'Show exact clause'}</span>
          </button>

          {showClause && (
            <div className="mt-1.5 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-[11px] font-mono leading-relaxed relative">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Verbatim Quote</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-zinc-500 hover:text-zinc-300 text-[10px] flex items-center space-x-1"
                >
                  <CopyIcon className="w-3 h-3" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="italic text-zinc-300 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                "{data.clause}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompareScorecardView({ result, onReset }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'diff'
  const [searchQuery, setSearchQuery] = useState('');

  const policyA = result?.a || {};
  const policyB = result?.b || {};

  const nameA = policyA.filename || 'Policy A';
  const nameB = policyB.filename || 'Policy B';
  const pagesA = policyA.pages || 0;
  const pagesB = policyB.pages || 0;

  const scoreA = policyA.scorecard || {};
  const scoreB = policyB.scorecard || {};

  const fieldKeys = Object.keys(FIELD_DEFINITIONS);

  // Stats
  const stats = useMemo(() => {
    return computeComparisonStats(result);
  }, [result]);

  // Prepared comparison rows
  const comparisonRows = useMemo(() => {
    return fieldKeys.map((key) => {
      const dataA = scoreA[key] || null;
      const dataB = scoreB[key] || null;
      const differs = isFieldDifferent(key, dataA, dataB);

      return {
        key,
        title: getFieldTitle(key),
        description: getFieldDescription(key),
        dataA,
        dataB,
        differs,
      };
    });
  }, [fieldKeys, scoreA, scoreB]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return comparisonRows.filter((row) => {
      if (filterMode === 'diff' && !row.differs) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = row.title.toLowerCase().includes(q);
        const matchDesc = row.description.toLowerCase().includes(q);
        const matchValA = (row.dataA?.value || '').toLowerCase().includes(q);
        const matchValB = (row.dataB?.value || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchValA || matchValB;
      }
      return true;
    });
  }, [comparisonRows, filterMode, searchQuery]);

  // Export JSON
  const handleExportJson = () => {
    const exportPayload = {
      comparedAt: new Date().toISOString(),
      summary: stats,
      policyA: {
        filename: nameA,
        pages: pagesA,
        scorecard: scoreA,
      },
      policyB: {
        filename: nameB,
        pages: pagesB,
        scorecard: scoreB,
      },
      differences: comparisonRows.filter((r) => r.differs).map((r) => ({
        field: r.key,
        policyA: r.dataA?.value || 'not_found',
        policyB: r.dataB?.value || 'not_found',
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `policy-comparison-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
            title="Upload different policies"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center space-x-2">
              <ScaleIcon className="w-6 h-6 text-indigo-400" />
              <span>Policy Comparison Report</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
              <span className="font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                A: {nameA} ({pagesA} pgs)
              </span>
              <span className="text-zinc-600 font-bold">vs</span>
              <span className="font-medium text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                B: {nameB} ({pagesB} pgs)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition-colors flex items-center space-x-1.5"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Export Comparison</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-colors"
          >
            Compare Others
          </button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs font-medium text-zinc-400">Total Fields Compared</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1">{stats.totalCompared}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Checked across both policies</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
          <div className="text-xs font-medium text-amber-400 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Differing Terms</span>
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.differingCount}</div>
          <div className="text-[11px] text-amber-400/70 mt-0.5">
            {stats.differingCount} clauses differ between plans
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="text-xs font-medium text-zinc-400 flex items-center space-x-1">
            <AlertTriangleIcon className="w-3.5 h-3.5 text-zinc-500" />
            <span>Unverified / Not Found</span>
          </div>
          <div className="text-2xl font-bold text-zinc-400 mt-1">{stats.unverifiedCount}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Requires manual verification</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Difference Toggle Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Fields ({stats.totalCompared})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('diff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              filterMode === 'diff'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Only Differences ({stats.differingCount})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative sm:w-64">
          <SearchIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clauses or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Comparison Table (Desktop) / Cards (Mobile) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 border-b border-zinc-800 bg-zinc-900/90 text-xs font-semibold text-zinc-400">
          <div className="col-span-3 p-4">Policy Feature</div>
          <div className="col-span-4 p-4 border-l border-zinc-800/80 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span className="text-zinc-200 truncate">Policy A: {nameA}</span>
          </div>
          <div className="col-span-5 p-4 border-l border-zinc-800/80 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span className="text-zinc-200 truncate">Policy B: {nameB}</span>
          </div>
        </div>

        {/* Rows */}
        {filteredRows.length > 0 ? (
          <div className="divide-y divide-zinc-800/70">
            {filteredRows.map((row) => (
              <div
                key={row.key}
                className={`transition-colors ${
                  row.differs
                    ? 'border-l-4 border-l-amber-500/80 bg-amber-500/[0.03] hover:bg-amber-500/[0.06]'
                    : 'border-l-4 border-l-transparent hover:bg-zinc-800/20'
                }`}
              >
                {/* Desktop 3-column row */}
                <div className="hidden md:grid grid-cols-12 items-start p-4">
                  {/* Col 1: Field name + Differs tag */}
                  <div className="col-span-3 pr-4">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-zinc-100">{row.title}</h4>
                      {row.differs && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                          Differs
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {row.description}
                    </p>
                  </div>

                  {/* Col 2: Policy A */}
                  <div className="col-span-4 px-4 border-l border-zinc-800/80">
                    <PolicyCell data={row.dataA} policyLabel="Policy A" isMobile={false} />
                  </div>

                  {/* Col 3: Policy B */}
                  <div className="col-span-5 pl-4 border-l border-zinc-800/80">
                    <PolicyCell data={row.dataB} policyLabel="Policy B" isMobile={false} />
                  </div>
                </div>

                {/* Mobile stacked row */}
                <div className="md:hidden p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100">{row.title}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{row.description}</p>
                    </div>
                    {row.differs && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                        Differs
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <PolicyCell data={row.dataA} policyLabel={`Policy A: ${nameA}`} isMobile={true} />
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <PolicyCell data={row.dataB} policyLabel={`Policy B: ${nameB}`} isMobile={true} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-zinc-400">No matching fields found with current filter.</p>
            <button
              onClick={() => {
                setFilterMode('all');
                setSearchQuery('');
              }}
              className="mt-3 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
