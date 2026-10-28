import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  SearchIcon, 
  DownloadIcon, 
  CopyIcon,
  CheckIcon as CopiedCheckIcon,
  ChevronDownIcon, 
  AlertTriangleIcon,
  CheckIcon,
  HelpCircleIcon
} from './Icons';
import { FIELD_DEFINITIONS, FIELD_SECTIONS } from '../constants/fieldDefinitions';
import { getFieldTitle, getStatusBadge, extractPageNumber } from '../utils/formatters';
import { isDifferent } from '../utils/diffChecker';
import { ClampedValue } from '../utils/factHighlighter';

function ClauseDrawer({ clause, page }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!clause) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(clause);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2.5 pt-2 border-t border-border/80">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="text-[11px] font-medium text-text-muted hover:text-text flex items-center space-x-1.5 transition-colors min-h-[36px] py-1 cursor-pointer focus-visible:ring-1 focus-visible:ring-accent rounded-btn"
      >
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          <ChevronDownIcon className="w-3.5 h-3.5" />
        </motion.span>
        <span>{isOpen ? 'Hide verbatim quote' : 'Show verbatim quote'}</span>
        {page && (
          <span className="font-mono text-[10px] text-accent bg-accent/10 px-1 py-0.2 rounded border border-accent/20">
            p. {page}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 p-3 rounded-btn bg-surface-2 border-l-2 border-accent border-y border-r border-border font-mono text-xs text-text leading-relaxed relative">
              <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-border text-[10px] text-text-muted font-sans uppercase tracking-wider">
                <span>Verbatim Citation {page ? `(p. ${page})` : ''}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-surface hover:bg-border text-text-muted hover:text-text min-h-[28px] cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CopiedCheckIcon className="w-3 h-3 text-verified" />
                      <span className="text-verified">Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="italic text-text">"{clause}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PolicyCell({ data, policyLabel, isMobile = false }) {
  const status = data?.status || 'not_found';
  const page = extractPageNumber(data);
  const badge = getStatusBadge(status, page);

  const renderIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckIcon className="w-3.5 h-3.5 text-verified flex-shrink-0" />;
      case 'unverified':
        return <AlertTriangleIcon className="w-3.5 h-3.5 text-unverified flex-shrink-0" />;
      default:
        return <HelpCircleIcon className="w-3.5 h-3.5 text-not-found flex-shrink-0" />;
    }
  };

  return (
    <div className="space-y-2 text-left">
      {isMobile && (
        <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider font-semibold">
          {policyLabel}
        </div>
      )}

      {/* Status Badge */}
      <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-[4px] text-xs font-medium border"
        style={{
          color: status === 'verified' ? '#8DB580' : status === 'unverified' ? '#E0894B' : '#8A867A',
          backgroundColor: status === 'verified' ? '#1A2318' : status === 'unverified' ? '#261C14' : '#1F1E1A',
          borderColor: status === 'verified' ? 'rgba(141, 181, 128, 0.3)' : status === 'unverified' ? 'rgba(224, 137, 75, 0.3)' : '#2E2D25'
        }}
      >
        {renderIcon()}
        <span>{badge.label}</span>
      </div>

      {/* Auto-highlighted Value with Clamp */}
      {data?.value ? (
        <ClampedValue text={data.value} />
      ) : (
        <p className="text-xs text-not-found italic">Not found in policy text.</p>
      )}

      {/* Verbatim quote drawer */}
      <ClauseDrawer clause={data?.clause} page={page} />
    </div>
  );
}

export default function CompareScorecardView({ result, onReset }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'diff'
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [copiedSummary, setCopiedSummary] = useState(false);

  const policyA = result?.a || {};
  const policyB = result?.b || {};

  const nameA = policyA.filename || 'Policy A';
  const nameB = policyB.filename || 'Policy B';
  const pagesA = policyA.pages || 0;
  const pagesB = policyB.pages || 0;

  const scoreA = policyA.scorecard || {};
  const scoreB = policyB.scorecard || {};

  const fieldKeys = Object.keys(FIELD_DEFINITIONS);

  // Compute differences
  const comparisonRows = useMemo(() => {
    return fieldKeys.map((key) => {
      const dataA = scoreA[key] || { status: 'not_found' };
      const dataB = scoreB[key] || { status: 'not_found' };
      const differs = isDifferent(key, dataA, dataB);
      const section = FIELD_DEFINITIONS[key]?.section || 'waiting_periods';

      return {
        key,
        title: getFieldTitle(key),
        description: FIELD_DEFINITIONS[key]?.description || '',
        section,
        dataA,
        dataB,
        differs,
      };
    });
  }, [fieldKeys, scoreA, scoreB]);

  const differingRows = useMemo(() => {
    return comparisonRows.filter((r) => r.differs);
  }, [comparisonRows]);

  // Copy plain text summary of differences
  const handleCopySummary = () => {
    const lines = [];
    lines.push(`POLICY COMPARISON SUMMARY`);
    lines.push(`Policy A: ${nameA} (${pagesA} pages)`);
    lines.push(`Policy B: ${nameB} (${pagesB} pages)`);
    lines.push(`Total Checked: ${comparisonRows.length} fields | Differing: ${differingRows.length} fields\n`);

    if (differingRows.length === 0) {
      lines.push(`No critical differences detected across standard health fields.`);
    } else {
      lines.push(`DIFFERING CLAUSES:`);
      differingRows.forEach((r, idx) => {
        lines.push(`${idx + 1}. ${r.title}`);
        lines.push(`   • Policy A: ${r.dataA.value || 'Not found'} (Page ${r.dataA.page || 'N/A'})`);
        lines.push(`   • Policy B: ${r.dataB.value || 'Not found'} (Page ${r.dataB.page || 'N/A'})`);
      });
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const scrollToRow = (key) => {
    const el = document.getElementById(`compare-row-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-differs');
      setTimeout(() => el.classList.remove('ring-2', 'ring-differs'), 1500);
    }
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleExportJson = () => {
    const payload = {
      policyA: { filename: nameA, pages: pagesA, scorecard: scoreA },
      policyB: { filename: nameB, pages: pagesB, scorecard: scoreB },
      differences: differingRows.map((r) => ({
        field: r.key,
        policyA: r.dataA?.value || 'not_found',
        policyB: r.dataB?.value || 'not_found',
      })),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `policy-comparison-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 overflow-hidden">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            type="button"
            onClick={onReset}
            className="p-2.5 rounded-btn bg-surface hover:bg-surface-2 text-text-muted hover:text-text border border-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer flex-shrink-0"
            title="Upload different policies"
            aria-label="Upload different policies"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-semibold text-text tracking-tight truncate">
              Policy Comparison Report
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-1 max-w-full">
              <span className="font-medium text-text bg-surface-2 px-2.5 py-1 rounded-[6px] border border-border inline-flex items-center gap-2 max-w-full overflow-hidden">
                <span className="truncate max-w-[200px] sm:max-w-xs">A: {nameA} ({pagesA} pgs)</span>
                {policyA?.model && (
                  <span className="font-mono text-[10px] text-text-muted hidden sm:inline">
                    • {policyA.model} | {policyA.cached ? 'cached' : 'fresh'}
                  </span>
                )}
              </span>
              <span className="text-text-muted font-bold text-xs">vs</span>
              <span className="font-medium text-text bg-surface-2 px-2.5 py-1 rounded-[6px] border border-border inline-flex items-center gap-2 max-w-full overflow-hidden">
                <span className="truncate max-w-[200px] sm:max-w-xs">B: {nameB} ({pagesB} pgs)</span>
                {policyB?.model && (
                  <span className="font-mono text-[10px] text-text-muted hidden sm:inline">
                    • {policyB.model} | {policyB.cached ? 'cached' : 'fresh'}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportJson}
          className="px-3.5 py-2 rounded-btn bg-surface hover:bg-surface-2 text-text text-xs font-medium border border-border transition-colors flex items-center space-x-1.5 self-start sm:self-auto min-h-[44px] cursor-pointer"
        >
          <DownloadIcon className="w-3.5 h-3.5 text-text-muted" />
          <span>Export Comparison</span>
        </button>
      </div>

      {/* "Differs" Summary at Top: list of differing fields with scroll-to & plain text copy */}
      <div className="p-4 rounded-card bg-surface border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/80">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-differs inline-block flex-shrink-0" />
            <h3 className="font-serif text-base font-semibold text-text">
              Differences Summary ({differingRows.length})
            </h3>
            <span className="text-xs text-text-muted">
              — {differingRows.length === 0 ? 'No differing terms detected' : 'Click a term to jump to comparison'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-btn bg-surface-2 hover:bg-border text-xs font-medium text-text border border-border transition-colors min-h-[40px] cursor-pointer self-start sm:self-auto"
          >
            {copiedSummary ? (
              <>
                <CopiedCheckIcon className="w-3.5 h-3.5 text-verified" />
                <span className="text-verified">Copied Summary</span>
              </>
            ) : (
              <>
                <CopyIcon className="w-3.5 h-3.5 text-text-muted" />
                <span>Copy Summary (Plain Text)</span>
              </>
            )}
          </button>
        </div>

        {differingRows.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {differingRows.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => scrollToRow(r.key)}
                className="px-2.5 py-1 rounded-[6px] text-xs font-medium bg-differs-bg text-differs border border-differs/30 hover:border-differs transition-all cursor-pointer min-h-[36px] flex items-center space-x-1"
              >
                <span>{r.title}</span>
                <span className="text-[10px] opacity-75">↓</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted italic pt-1">
            Both policies have identical or matching terms across all analyzed clauses.
          </p>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="sticky top-16 z-20 bg-bg/95 py-3 border-y border-border backdrop-blur-none flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filterMode === 'all'}
            onClick={() => setFilterMode('all')}
            className={`relative px-3 py-1.5 rounded-btn text-xs font-medium transition-colors min-h-[40px] cursor-pointer ${
              filterMode === 'all' ? 'text-accent-ink font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            {filterMode === 'all' && (
              <motion.div
                layoutId="compareFilterPill"
                className="absolute inset-0 bg-accent rounded-btn"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">All Fields ({comparisonRows.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterMode === 'diff'}
            onClick={() => setFilterMode('diff')}
            className={`relative px-3 py-1.5 rounded-btn text-xs font-medium transition-colors min-h-[40px] cursor-pointer ${
              filterMode === 'diff' ? 'text-accent-ink font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            {filterMode === 'diff' && (
              <motion.div
                layoutId="compareFilterPill"
                className="absolute inset-0 bg-accent rounded-btn"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${filterMode === 'diff' ? 'bg-accent-ink' : 'bg-differs'}`} />
              <span>Only Differences ({differingRows.length})</span>
            </span>
          </button>
        </div>

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

      {/* Comparison Sections */}
      <div className="space-y-6">
        {FIELD_SECTIONS.map((section) => {
          const sectionRows = comparisonRows
            .filter((r) => section.fields.includes(r.key))
            .filter((r) => (filterMode === 'diff' ? r.differs : true))
            .filter((r) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                r.title.toLowerCase().includes(q) ||
                (r.dataA?.value || '').toLowerCase().includes(q) ||
                (r.dataB?.value || '').toLowerCase().includes(q)
              );
            });

          const isCollapsed = Boolean(collapsedSections[section.id]);

          if (sectionRows.length === 0 && (searchQuery || filterMode === 'diff')) {
            return null;
          }

          return (
            <div
              key={section.id}
              className="rounded-card bg-surface border border-border overflow-hidden"
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={!isCollapsed}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left border-b border-border hover:bg-surface-2 transition-colors cursor-pointer min-h-[44px]"
              >
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="font-serif text-lg font-semibold text-text">
                      {section.title}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 text-text-muted border border-border">
                      {sectionRows.length}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {section.description}
                  </p>
                </div>
                <motion.span
                  animate={{ rotate: isCollapsed ? -90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-1 text-text-muted"
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {/* Desktop Comparison Table (Sticky header + Sticky first column) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-surface-2 text-xs font-semibold text-text-muted sticky top-32 z-20">
                            <th className="p-4 w-1/4 sticky left-0 z-30 bg-surface-2 border-r border-border">
                              Policy Feature
                            </th>
                            <th className="p-4 w-3/8 border-r border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-text font-medium">Policy A: {nameA}</span>
                                <span className="font-mono text-[10px] text-text-muted">
                                  {policyA.cached ? 'cached' : 'fresh'}
                                </span>
                              </div>
                            </th>
                            <th className="p-4 w-3/8">
                              <div className="flex items-center justify-between">
                                <span className="text-text font-medium">Policy B: {nameB}</span>
                                <span className="font-mono text-[10px] text-text-muted">
                                  {policyB.cached ? 'cached' : 'fresh'}
                                </span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70 text-xs">
                          {sectionRows.map((row) => (
                            <tr
                              id={`compare-row-${row.key}`}
                              key={row.key}
                              className={`relative transition-colors ${
                                row.differs ? 'bg-differs-bg/25 hover:bg-differs-bg/40' : 'hover:bg-surface-2/40'
                              }`}
                            >
                              {/* Sticky first column (Field name) */}
                              <td className="p-4 align-top sticky left-0 z-10 bg-surface border-r border-border relative">
                                {row.differs && (
                                  <motion.div
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-differs origin-top"
                                  />
                                )}
                                <div className="space-y-1 pl-1">
                                  <h4 className="font-serif text-sm font-semibold text-text">
                                    {row.title}
                                  </h4>
                                  <p className="text-[11px] text-text-muted leading-relaxed">
                                    {row.description}
                                  </p>
                                  {row.differs && (
                                    <span className="inline-block px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-differs-bg text-differs border border-differs/30 uppercase tracking-wider">
                                      Differs
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Policy A column */}
                              <td className="p-4 align-top border-r border-border">
                                <PolicyCell data={row.dataA} />
                              </td>

                              {/* Policy B column */}
                              <td className="p-4 align-top">
                                <PolicyCell data={row.dataB} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Comparison Cards (360px compatible) */}
                    <div className="md:hidden divide-y divide-border">
                      {sectionRows.map((row) => (
                        <div
                          id={`compare-row-${row.key}`}
                          key={row.key}
                          className={`p-4 space-y-4 relative ${
                            row.differs ? 'bg-differs-bg/20' : ''
                          }`}
                        >
                          {row.differs && (
                            <motion.div
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ duration: 0.3 }}
                              className="absolute left-0 top-0 bottom-0 w-1 bg-differs origin-top"
                            />
                          )}
                          <div className="flex items-start justify-between gap-2 pl-1">
                            <div>
                              <h4 className="font-serif text-sm font-semibold text-text">
                                {row.title}
                              </h4>
                              <p className="text-[11px] text-text-muted mt-0.5">
                                {row.description}
                              </p>
                            </div>
                            {row.differs && (
                              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-differs-bg text-differs border border-differs/30 uppercase tracking-wider flex-shrink-0">
                                Differs
                              </span>
                            )}
                          </div>

                          <div className="space-y-3 pt-1">
                            <div className="p-3 rounded-btn bg-surface-2 border border-border">
                              <PolicyCell data={row.dataA} policyLabel={`Policy A: ${nameA}`} isMobile={true} />
                            </div>
                            <div className="p-3 rounded-btn bg-surface-2 border border-border">
                              <PolicyCell data={row.dataB} policyLabel={`Policy B: ${nameB}`} isMobile={true} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
          <span>Upload Different Policies</span>
        </button>
      </div>
    </div>
  );
}
