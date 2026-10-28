import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import ScorecardCard from './ScorecardCard';
import { 
  ArrowLeftIcon, 
  SearchIcon, 
  DownloadIcon, 
  CheckIcon, 
  AlertTriangleIcon, 
  HelpCircleIcon, 
  BookOpenIcon,
  ChevronDownIcon
} from './Icons';
import { FIELD_SECTIONS } from '../constants/fieldDefinitions';
import { getFieldTitle } from '../utils/formatters';

function AnimatedCounter({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    count.set(0);
    const controls = animate(count, value, { duration: 0.8, ease: 'easeOut' });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value]);

  return <span>{display}</span>;
}

export default function ScorecardView({ result, fileName, onReset }) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'verified' | 'unverified' | 'not_found'
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});

  const scorecard = result?.scorecard || {};
  const pages = result?.pages || 0;
  const model = result?.model || '';
  const isCached = Boolean(result?.cached);

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
    return { total, verified, unverified, notFound };
  }, [fieldEntries]);

  // Filter & Search
  const matchesSearch = (key, item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = getFieldTitle(key).toLowerCase();
    const val = (item?.value || '').toLowerCase();
    const clause = (item?.clause || '').toLowerCase();
    return title.includes(q) || val.includes(q) || clause.includes(q);
  };

  const matchesStatus = (item) => {
    if (filterStatus === 'all') return true;
    const s = item?.status || 'not_found';
    return s === filterStatus;
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${fileName || 'policy'}-scorecard.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filterOptions = [
    { id: 'all', label: `All (${stats.total})` },
    { id: 'verified', label: `Verified (${stats.verified})`, icon: CheckIcon, color: 'text-verified' },
    { id: 'unverified', label: `Unverified (${stats.unverified})`, icon: AlertTriangleIcon, color: 'text-unverified' },
    { id: 'not_found', label: `Not found (${stats.notFound})`, icon: HelpCircleIcon, color: 'text-not-found' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 overflow-hidden">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            type="button"
            onClick={onReset}
            className="p-2.5 rounded-btn bg-surface hover:bg-surface-2 text-text-muted hover:text-text border border-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer flex-shrink-0"
            title="Upload another document"
            aria-label="Upload another document"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-semibold text-text tracking-tight truncate">
              Policy Scorecard
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-0.5">
              <span className="font-medium text-text truncate max-w-[160px] sm:max-w-md">
                {fileName || 'Analyzed Document'}
              </span>
              <span>•</span>
              <span className="inline-flex items-center space-x-1">
                <BookOpenIcon className="w-3.5 h-3.5 text-text-muted" />
                <span>{pages} {pages === 1 ? 'page' : 'pages'} scanned</span>
              </span>
              {model && (
                <>
                  <span>•</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-[4px] font-mono text-[11px] border ${
                      isCached
                        ? 'bg-verified-bg text-verified border-verified/30'
                        : 'bg-surface-2 text-text-muted border-border'
                    }`}
                  >
                    {model} | {isCached ? 'cached' : 'fresh'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportJson}
          className="px-3.5 py-2 rounded-btn bg-surface hover:bg-surface-2 text-text text-xs font-medium border border-border transition-colors flex items-center space-x-1.5 self-start sm:self-auto min-h-[44px] cursor-pointer"
        >
          <DownloadIcon className="w-3.5 h-3.5 text-text-muted" />
          <span>Export JSON</span>
        </button>
      </div>

      {/* Clickable Stat Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-card bg-surface border text-left transition-all min-h-[44px] cursor-pointer ${
            filterStatus === 'all'
              ? 'border-accent ring-1 ring-accent'
              : 'border-border hover:border-border/80'
          }`}
        >
          <p className="text-xs font-medium text-text-muted">Total Checked</p>
          <p className="font-serif text-2xl font-semibold text-text mt-1">
            <AnimatedCounter value={stats.total} />
          </p>
          <p className="text-[11px] text-text-muted mt-1">Fixed IRDAI health fields</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('verified')}
          className={`p-4 rounded-card bg-surface border text-left transition-all min-h-[44px] cursor-pointer ${
            filterStatus === 'verified'
              ? 'border-verified ring-1 ring-verified'
              : 'border-border hover:border-border/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-verified">Verified</p>
            <CheckIcon className="w-4 h-4 text-verified" />
          </div>
          <p className="font-serif text-2xl font-semibold text-verified mt-1">
            <AnimatedCounter value={stats.verified} />
          </p>
          <p className="text-[11px] text-text-muted mt-1">Verbatim clause matched</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('unverified')}
          className={`p-4 rounded-card bg-surface border text-left transition-all min-h-[44px] cursor-pointer ${
            filterStatus === 'unverified'
              ? 'border-unverified ring-1 ring-unverified'
              : 'border-border hover:border-border/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-unverified">Unverified</p>
            <AlertTriangleIcon className="w-4 h-4 text-unverified" />
          </div>
          <p className="font-serif text-2xl font-semibold text-unverified mt-1">
            <AnimatedCounter value={stats.unverified} />
          </p>
          <p className="text-[11px] text-text-muted mt-1">Needs manual page check</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('not_found')}
          className={`p-4 rounded-card bg-surface border text-left transition-all min-h-[44px] cursor-pointer ${
            filterStatus === 'not_found'
              ? 'border-not-found ring-1 ring-not-found'
              : 'border-border hover:border-border/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-not-found">Not Found</p>
            <HelpCircleIcon className="w-4 h-4 text-not-found" />
          </div>
          <p className="font-serif text-2xl font-semibold text-not-found mt-1">
            <AnimatedCounter value={stats.notFound} />
          </p>
          <p className="text-[11px] text-text-muted mt-1">Absent from policy text</p>
        </button>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-20 bg-bg/95 py-3 border-y border-border backdrop-blur-none flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-full">
        {/* Filter Pills with shared layoutId */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 max-w-full min-w-0" role="tablist">
          {filterOptions.map((tab) => {
            const isActive = filterStatus === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilterStatus(tab.id)}
                className={`relative px-3 py-1.5 rounded-btn text-xs font-medium transition-colors flex items-center space-x-1.5 min-h-[40px] cursor-pointer flex-shrink-0 ${
                  isActive ? 'text-accent-ink font-semibold' : 'text-text-muted hover:text-text'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterTab"
                    className="absolute inset-0 bg-accent rounded-btn"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center space-x-1.5">
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <SearchIcon className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search keywords or clauses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-btn bg-surface border border-border text-xs text-text placeholder-text-muted focus-visible:outline-none focus-visible:border-accent min-h-[40px]"
          />
        </div>
      </div>

      {/* Grouped Sections: Waiting Periods, Coverage Limits, Exclusions, Claims */}
      <div className="space-y-6 pt-2">
        {FIELD_SECTIONS.map((section) => {
          const sectionFields = section.fields
            .filter((key) => Boolean(scorecard[key]))
            .filter((key) => matchesStatus(scorecard[key]))
            .filter((key) => matchesSearch(key, scorecard[key]));

          const isCollapsed = Boolean(collapsedSections[section.id]);

          if (sectionFields.length === 0 && (searchQuery || filterStatus !== 'all')) {
            return null; // hide empty section when filtering
          }

          return (
            <section
              key={section.id}
              className="rounded-card bg-surface/50 border border-border p-4 sm:p-5"
            >
              {/* Collapsible Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center justify-between text-left group min-h-[44px] cursor-pointer py-1"
              >
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="font-serif text-lg font-semibold text-text">
                      {section.title}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 text-text-muted border border-border">
                      {sectionFields.length}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {section.description}
                  </p>
                </div>
                <motion.span
                  animate={{ rotate: isCollapsed ? -90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-1 text-text-muted group-hover:text-text"
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </motion.span>
              </button>

              {/* Cards Grid */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-4 pt-4">
                      {sectionFields.length > 0 ? (
                        sectionFields.map((fieldKey) => (
                          <motion.div
                            key={fieldKey}
                            layout
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ScorecardCard
                              fieldKey={fieldKey}
                              data={scorecard[fieldKey]}
                            />
                          </motion.div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-text-muted">
                          No fields matching current criteria in this section.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="pt-6 pb-12 text-center border-t border-border">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-btn bg-surface hover:bg-surface-2 text-text border border-border text-xs font-medium transition-colors min-h-[44px] cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4 text-text-muted" />
          <span>Analyze Another Policy PDF</span>
        </button>
      </div>
    </div>
  );
}
