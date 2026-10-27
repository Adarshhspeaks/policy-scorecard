import React, { useState, useMemo } from 'react';
import ScorecardCard from './ScorecardCard';
import { 
  ArrowLeftIcon, 
  SearchIcon, 
  DownloadIcon, 
  CheckIcon, 
  AlertTriangleIcon, 
  HelpCircleIcon, 
  BookOpenIcon 
} from './Icons';
import { getFieldTitle } from '../utils/formatters';

export default function ScorecardView({ result, fileName, onReset }) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'verified' | 'unverified' | 'not_found'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  const scorecard = result?.scorecard || {};
  const pages = result?.pages || 0;
  const fieldEntries = useMemo(() => Object.entries(scorecard), [scorecard]);

  // Statistics
  const stats = useMemo(() => {
    let verified = 0;
    let unverified = 0;
    let notFound = 0;

    fieldEntries.forEach(([_, item]) => {
      const status = item?.status;
      if (status === 'verified') verified++;
      else if (status === 'unverified') unverified++;
      else notFound++;
    });

    const total = fieldEntries.length;
    const verifiedPercent = total > 0 ? Math.round((verified / total) * 100) : 0;

    return { total, verified, unverified, notFound, verifiedPercent };
  }, [fieldEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return fieldEntries.filter(([key, item]) => {
      // Status filter
      if (filterStatus !== 'all') {
        const itemStatus = item?.status || 'not_found';
        if (itemStatus !== filterStatus) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = getFieldTitle(key).toLowerCase();
        const value = (item?.value || '').toLowerCase();
        const clause = (item?.clause || '').toLowerCase();
        const note = (item?.note || '').toLowerCase();
        return title.includes(q) || value.includes(q) || clause.includes(q) || note.includes(q);
      }

      return true;
    });
  }, [fieldEntries, filterStatus, searchQuery]);

  // Export JSON functionality
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${fileName || 'policy'}-scorecard.json`);
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
            title="Upload another document"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center space-x-2">
              <span>Policy Scorecard</span>
            </h2>
            <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-0.5">
              <span className="font-medium text-zinc-300 truncate max-w-xs sm:max-w-md">
                {fileName || 'Analyzed Document'}
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <BookOpenIcon className="w-3.5 h-3.5 text-zinc-500" />
                <span>{pages} {pages === 1 ? 'page' : 'pages'} scanned</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition-colors flex items-center space-x-1.5"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-colors"
          >
            Analyze Another PDF
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs font-medium text-zinc-400">Total Fields</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1">{stats.total}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Checked against policy</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
          <div className="text-xs font-medium text-emerald-400 flex items-center space-x-1">
            <CheckIcon className="w-3.5 h-3.5" />
            <span>Verified Clauses</span>
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.verified}</div>
          <div className="text-[11px] text-emerald-400/70 mt-0.5">{stats.verifiedPercent}% verification rate</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
          <div className="text-xs font-medium text-amber-400 flex items-center space-x-1">
            <AlertTriangleIcon className="w-3.5 h-3.5" />
            <span>Unverified</span>
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.unverified}</div>
          <div className="text-[11px] text-amber-400/70 mt-0.5">Manual check advised</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="text-xs font-medium text-zinc-400 flex items-center space-x-1">
            <HelpCircleIcon className="w-3.5 h-3.5" />
            <span>Not Found</span>
          </div>
          <div className="text-2xl font-bold text-zinc-400 mt-1">{stats.notFound}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">No clause cited</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === 'verified'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            Verified ({stats.verified})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('unverified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === 'unverified'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            Unverified ({stats.unverified})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('not_found')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === 'not_found'
                ? 'bg-zinc-800 text-zinc-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Not Found ({stats.notFound})
          </button>
        </div>

        {/* Search Input & Expand/Collapse Toggle */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <SearchIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search fields or terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setExpandAll((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap"
          >
            {expandAll ? 'Collapse Clauses' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {filteredEntries.map(([key, data]) => (
            <ScorecardCard
              key={`${key}-${expandAll}`}
              fieldKey={key}
              data={data}
              isDefaultExpanded={expandAll}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <HelpCircleIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-zinc-300">No matching fields found</h4>
          <p className="text-xs text-zinc-500 mt-1">
            Try adjusting your search query or switching the status filter tab.
          </p>
          <button
            onClick={() => {
              setFilterStatus('all');
              setSearchQuery('');
            }}
            className="mt-3 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
