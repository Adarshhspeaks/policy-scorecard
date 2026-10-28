import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import UploadZone from './components/UploadZone';
import CompareUploadZone from './components/CompareUploadZone';
import LoadingAnalysis from './components/LoadingAnalysis';
import LoadingCompare from './components/LoadingCompare';
import ScorecardView from './components/ScorecardView';
import CompareScorecardView from './components/CompareScorecardView';
import ErrorAlert from './components/ErrorAlert';
import { ScaleIcon, BookOpenIcon, FilePdfIcon, CheckIcon } from './components/Icons';

// Mock sample for instant preview / testing single analysis
const SAMPLE_MOCK_RESULT = {
  pages: 14,
  scorecard: {
    waiting_period_initial: {
      status: "verified",
      value: "A 30-day waiting period applies to all illnesses from the policy inception date, excluding accidental injuries.",
      page: 4,
      clause: "A waiting period of thirty (30) days from the inception date of this Policy shall apply to all medical and surgical treatments, except in case of accidental bodily injury occurring during the policy period.",
      confidence: "high"
    },
    waiting_period_preexisting: {
      status: "verified",
      value: "Pre-existing diseases (PED) are covered after 36 months (3 years) of continuous coverage with the company.",
      page: 5,
      clause: "Pre-Existing Diseases and their direct complications shall not be covered until 36 continuous months of health insurance coverage have elapsed since the inception of the first policy.",
      confidence: "high"
    },
    waiting_period_specific: {
      status: "verified",
      value: "Specific illnesses including cataract, hernia, joint replacement, and kidney stones have a 24-month waiting period.",
      page: 6,
      clause: "The expenses on treatment of the following specified illnesses/procedures: cataract, hernia, hydrocele, joint replacement surgery, and calculus diseases shall be payable only after a waiting period of 24 months of continuous coverage.",
      confidence: "high"
    },
    room_rent_cap: {
      status: "verified",
      value: "Single private air-conditioned room, or maximum 1% of Sum Insured per day. Proportionate deductions apply if exceeded.",
      page: 7,
      clause: "Daily Room Rent, boarding and nursing expenses up to 1% of Sum Insured subject to a maximum of Single Private AC Room per day. If higher category room is occupied, proportionate deductions will apply to associated medical expenses.",
      confidence: "high"
    },
    copay: {
      status: "unverified",
      value: "A 10% co-payment applies for treatments availed at non-network hospitals in Tier 1 metropolitan zones.",
      page: 8,
      note: "Could not verify quote. Check page 8 manually.",
      confidence: "medium"
    },
    sub_limits: {
      status: "verified",
      value: "Cataract surgery limit of ₹40,000 per eye; robotic surgery covered up to 50% of Sum Insured.",
      page: 9,
      clause: "Expenses related to Cataract surgery shall be capped at Rs. 40,000 per eye. Robotic / Cyberknife surgeries are covered up to a sub-limit of 50% of the total Sum Insured.",
      confidence: "high"
    },
    exclusions: {
      status: "verified",
      value: "Permanent exclusions include cosmetic surgeries, gender reassignment, non-allopathic treatments without registration, and alcohol or substance abuse.",
      page: 11,
      clause: "The following conditions are permanently excluded: treatment for alcoholism, drug abuse, self-inflicted injury, aesthetic or cosmetic treatments, weight reduction surgeries, and hazardous sports unless endorsed.",
      confidence: "high"
    },
    claim_conditions: {
      status: "not_found"
    }
  },
  model: "gemini-3.5-flash-lite",
  cached: true,
  calls_used: 0
};

// Mock sample for instant preview / testing compare view
const SAMPLE_COMPARE_RESULT = {
  a: {
    filename: 'Care_Advantage_Large_Policy.pdf',
    pages: 14,
    scorecard: SAMPLE_MOCK_RESULT.scorecard,
    model: 'gemini-3.5-flash-lite',
    cached: true,
    calls_used: 0,
  },
  b: {
    filename: 'Star_Comprehensive_Health_Policy.pdf',
    pages: 8,
    scorecard: {
      waiting_period_initial: {
        status: 'verified',
        value: 'A standard 30-day waiting period applies to all treatments except accidental bodily injuries.',
        page: 2,
        clause: 'A waiting period of thirty (30) days from the inception date of this Policy shall apply to all medical and surgical treatments, except in case of accidental bodily injury.',
        confidence: 'high',
      },
      waiting_period_preexisting: {
        status: 'verified',
        value: 'Pre-existing diseases are covered after 24 continuous months (2 years) under this plan.',
        page: 3,
        clause: 'Pre-Existing Diseases and their direct complications shall not be covered until 24 continuous months of health insurance coverage have elapsed since the inception of the first policy.',
        confidence: 'high',
      },
      waiting_period_specific: {
        status: 'verified',
        value: 'A 24-month waiting period applies to specified procedures: cataract, hernia, and joint surgery.',
        page: 3,
        clause: 'Expenses related to specified illnesses/procedures shall be payable only after a waiting period of 24 months of continuous coverage.',
        confidence: 'high',
      },
      room_rent_cap: {
        status: 'verified',
        value: 'No room rent cap. Policyholder is entitled to any single private AC room or higher without deduction.',
        page: 4,
        clause: 'Room Rent, Boarding and Nursing Expenses as provided by the Hospital without any sub-limit or cap.',
        confidence: 'high',
      },
      copay: {
        status: 'verified',
        value: 'Zero co-payment for entry age below 60. A 20% co-payment applies for insured members aged 61 and above.',
        page: 5,
        clause: 'A co-payment of 20% shall apply on each and every admissible claim for persons whose entry age into the policy is 61 years and above.',
        confidence: 'high',
      },
      sub_limits: {
        status: 'verified',
        value: 'Cataract surgery capped at ₹25,000 per eye. Modern treatments covered up to 50% of Sum Insured.',
        page: 6,
        clause: 'Cataract surgery expenses are subject to a sub-limit of Rs. 25,000 per eye. Modern treatment methods covered up to 50% of the Sum Insured.',
        confidence: 'high',
      },
      exclusions: {
        status: 'verified',
        value: 'Permanent exclusions include cosmetic surgeries, gender reassignment, and self-inflicted injuries.',
        page: 7,
        clause: 'The following conditions are permanently excluded: treatment for alcoholism, drug abuse, self-inflicted injury, aesthetic or cosmetic treatments.',
        confidence: 'high',
      },
      claim_conditions: {
        status: 'not_found',
      },
    },
    model: 'gemini-3.5-flash-lite',
    cached: true,
    calls_used: 0,
  },
};

export default function App() {
  // Synchronous URL query parameter inspection
  const getInitialState = () => {
    if (typeof window === 'undefined') return { mode: 'single', view: null };
    try {
      const p = new URLSearchParams(window.location.search);
      return {
        view: p.get('view'),
        mode: p.get('mode') === 'compare' || p.get('view') === 'compare' ? 'compare' : 'single',
      };
    } catch {
      return { mode: 'single', view: null };
    }
  };

  const initial = getInitialState();

  const [mode, setMode] = useState(initial.mode); // 'single' | 'compare'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(() =>
    initial.view === 'error'
      ? { status: 422, message: 'Looks like a scanned PDF (19 chars). OCR not supported yet.' }
      : null
  );

  // Single analysis state
  const [analyzingFile, setAnalyzingFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(() =>
    initial.view === 'single' ? SAMPLE_MOCK_RESULT : null
  );
  const [analyzedFileName, setAnalyzedFileName] = useState(() =>
    initial.view === 'single' ? 'Care_Advantage_Sample_Policy.pdf' : ''
  );

  // Compare mode state
  const [comparingFiles, setComparingFiles] = useState(null);
  const [compareResult, setCompareResult] = useState(() =>
    initial.view === 'compare' ? SAMPLE_COMPARE_RESULT : null
  );

  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  // 1. Single analysis handler
  const handleAnalyze = async (file) => {
    setIsLoading(true);
    setError(null);
    setAnalyzingFile(file);

    try {
      const formData = new FormData();
      formData.append('policy', file);

      const endpoint = `${apiUrl}/api/analyze`;
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
      } catch (fetchErr) {
        if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
          try {
            response = await fetch('/api/analyze', {
              method: 'POST',
              body: formData,
            });
          } catch (retryErr) {
            throw fetchErr;
          }
        } else {
          throw fetchErr;
        }
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Server responded with status ${response.status}`;
        const err = new Error(errorMsg);
        err.status = data?.status || response.status;
        throw err;
      }

      if (!data || !data.scorecard) {
        throw new Error('Invalid response structure received from scorecard API.');
      }

      setAnalysisResult(data);
      setAnalyzedFileName(file.name);
    } catch (err) {
      console.error('Analysis error:', err);
      setError({
        status: err.status || 0,
        message: err.message || 'An unexpected error occurred while communicating with the server.',
      });
    } finally {
      setIsLoading(false);
      setAnalyzingFile(null);
    }
  };

  // 2. Dual comparison handler
  const handleCompare = async (fileA, fileB) => {
    setIsLoading(true);
    setError(null);
    setComparingFiles({ fileA, fileB });

    try {
      const formData = new FormData();
      formData.append('policyA', fileA);
      formData.append('policyB', fileB);

      const endpoint = `${apiUrl}/api/compare`;
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
      } catch (fetchErr) {
        if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
          try {
            response = await fetch('/api/compare', {
              method: 'POST',
              body: formData,
            });
          } catch (retryErr) {
            throw fetchErr;
          }
        } else {
          throw fetchErr;
        }
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Server responded with status ${response.status}`;
        const err = new Error(errorMsg);
        err.status = data?.status || response.status;
        throw err;
      }

      if (!data || !data.a || !data.b) {
        throw new Error('Invalid comparison structure returned by the server.');
      }

      setCompareResult(data);
    } catch (err) {
      console.error('Compare error:', err);
      setError({
        status: err.status || 0,
        message: err.message || 'An unexpected error occurred while analyzing the comparison.',
      });
    } finally {
      setIsLoading(false);
      setComparingFiles(null);
    }
  };

  // 3. Load Sample Demo
  const handleLoadDemo = () => {
    setError(null);
    setAnalyzedFileName('Care_Advantage_Sample_Policy.pdf');
    setAnalysisResult(SAMPLE_MOCK_RESULT);
  };

  // 4. Load Sample Policies for Comparison
  const handleLoadSamplePolicies = async () => {
    setIsLoading(true);
    setError(null);
    setComparingFiles({
      fileA: { name: 'Care_Advantage_Policy.pdf' },
      fileB: { name: 'Star_Comprehensive_Policy.pdf' },
    });

    try {
      const [resA, resB] = await Promise.all([
        fetch('/sample-policies/Care_Advantage_Large_Policy.pdf').catch(() => null),
        fetch('/sample-policies/Star_Comprehensive_Health_Policy.pdf').catch(() => null),
      ]);

      if (resA && resB && resA.ok && resB.ok) {
        const [blobA, blobB] = await Promise.all([resA.blob(), resB.blob()]);
        const fileA = new File([blobA], 'Care_Advantage_Large_Policy.pdf', { type: 'application/pdf' });
        const fileB = new File([blobB], 'Star_Comprehensive_Health_Policy.pdf', { type: 'application/pdf' });
        await handleCompare(fileA, fileB);
        return;
      }

      setCompareResult(SAMPLE_COMPARE_RESULT);
    } catch (err) {
      console.error('Failed to load sample policies:', err);
      setError({
        status: 0,
        message: 'Could not load sample benchmark policies. Please upload your own PDF files.',
      });
    } finally {
      setIsLoading(false);
      setComparingFiles(null);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAnalyzedFileName('');
    setCompareResult(null);
    setError(null);
  };

  const hasActiveResults = Boolean(analysisResult || compareResult);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text font-sans w-full max-w-full overflow-x-hidden">
      <Navbar onReset={handleReset} hasResults={hasActiveResults} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 overflow-hidden">
        {/* Error notification banner */}
        {error && (
          <ErrorAlert
            error={error}
            onDismiss={() => setError(null)}
            onRetry={handleReset}
          />
        )}

        {/* View Transitions using Framer Motion AnimatePresence mode="wait", fade + 8px y-shift */}
        <AnimatePresence mode="wait">
          {/* View 1: Loading Single Analysis */}
          {isLoading && mode === 'single' && (
            <motion.div
              key="loading-single"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <LoadingAnalysis file={analyzingFile} />
            </motion.div>
          )}

          {/* View 2: Loading Comparison */}
          {isLoading && mode === 'compare' && (
            <motion.div
              key="loading-compare"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <LoadingCompare fileA={comparingFiles?.fileA} fileB={comparingFiles?.fileB} />
            </motion.div>
          )}

          {/* View 3: Single Scorecard Results */}
          {!isLoading && analysisResult && mode === 'single' && (
            <motion.div
              key="result-single"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <ScorecardView
                result={analysisResult}
                fileName={analyzedFileName}
                onReset={handleReset}
              />
            </motion.div>
          )}

          {/* View 4: Comparison Scorecard Results */}
          {!isLoading && compareResult && mode === 'compare' && (
            <motion.div
              key="result-compare"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <CompareScorecardView
                result={compareResult}
                onReset={handleReset}
              />
            </motion.div>
          )}

          {/* View 5: Upload / Home Screen */}
          {!isLoading && !analysisResult && !compareResult && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="py-4 w-full max-w-full overflow-hidden"
            >
              {/* Mode Switcher with shared layoutId pill */}
              <div className="w-full flex items-center justify-center mb-8 px-2">
                <div className="w-full max-w-[310px] sm:max-w-sm p-1 rounded-btn bg-surface border border-border grid grid-cols-2 gap-1" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'single'}
                    onClick={() => {
                      setMode('single');
                      setError(null);
                    }}
                    className={`relative px-2 sm:px-4 py-2 rounded-btn text-xs sm:text-sm font-medium transition-colors flex items-center justify-center space-x-1.5 min-h-[44px] cursor-pointer ${
                      mode === 'single' ? 'text-accent-ink font-semibold' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {mode === 'single' && (
                      <motion.div
                        layoutId="activeModePill"
                        className="absolute inset-0 bg-accent rounded-btn"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center space-x-1.5 truncate">
                      <BookOpenIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Analyze Single</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'compare'}
                    onClick={() => {
                      setMode('compare');
                      setError(null);
                    }}
                    className={`relative px-2 sm:px-4 py-2 rounded-btn text-xs sm:text-sm font-medium transition-colors flex items-center justify-center space-x-1.5 min-h-[44px] cursor-pointer ${
                      mode === 'compare' ? 'text-accent-ink font-semibold' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {mode === 'compare' && (
                      <motion.div
                        layoutId="activeModePill"
                        className="absolute inset-0 bg-accent rounded-btn"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center space-x-1.5 truncate">
                      <ScaleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Compare Two</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Hero Heading: Editorial Typography (Fraunces), tight tracking */}
              <div className="text-center max-w-2xl mx-auto mb-10 px-2">
                <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-semibold text-text tracking-tight leading-tight break-words">
                  {mode === 'single' ? (
                    <>
                      Understand what your policy{' '}
                      <span className="italic font-normal text-accent">
                        actually covers
                      </span>
                    </>
                  ) : (
                    <>
                      Compare two health policies{' '}
                      <span className="italic font-normal text-accent">
                        side-by-side
                      </span>
                    </>
                  )}
                </h1>
                <p className="mt-3 text-sm sm:text-base text-text-muted leading-relaxed">
                  {mode === 'single'
                    ? 'Upload your policy PDF to extract critical clauses: waiting periods, room rent caps, co-pay rules, and exclusions with verbatim page citations.'
                    : 'Upload two policy PDFs to automatically identify differing waiting periods, room rent caps, patient co-payments, and procedure sub-limits.'}
                </p>
              </div>

              {/* Upload interface */}
              {mode === 'single' ? (
                <>
                  <UploadZone
                    onAnalyze={handleAnalyze}
                    isLoading={isLoading}
                    error={error}
                    onClearError={() => setError(null)}
                  />

                  <div className="mt-6 text-center px-4 max-w-full">
                    <button
                      type="button"
                      onClick={handleLoadDemo}
                      className="text-xs text-text-muted hover:text-text underline underline-offset-4 transition-colors min-h-[44px] cursor-pointer whitespace-normal break-words max-w-full text-center inline-block"
                    >
                      No PDF on hand? Try interactive preview with sample scorecard data →
                    </button>
                  </div>
                </>
              ) : (
                <CompareUploadZone
                  onCompare={handleCompare}
                  isLoading={isLoading}
                  onLoadSamplePolicies={handleLoadSamplePolicies}
                />
              )}

              {/* Visible Trust Note (Requirement 5) */}
              <div className="mt-10 p-4 rounded-card bg-surface border border-border text-center max-w-xl w-full mx-auto text-xs text-text-muted leading-relaxed">
                <span className="font-semibold text-text">Trust Note: </span>
                Every answer is checked against the exact clause in your PDF. If it cannot be verified, we tell you.
              </div>

              {/* 3-Step "How It Works" Section (Requirement 5) */}
              <div className="mt-12 pt-10 border-t border-border">
                <div className="text-center mb-6">
                  <h3 className="font-serif text-lg font-semibold text-text">
                    How Policy Scorecard Works
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    Three transparent steps from raw document to verified facts
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left w-full">
                  <div className="p-4 sm:p-5 rounded-card bg-surface border border-border space-y-2 overflow-hidden break-words">
                    <div className="w-8 h-8 rounded-btn bg-surface-2 border border-border flex items-center justify-center text-accent">
                      <FilePdfIcon className="w-4 h-4 text-accent" />
                    </div>
                    <h4 className="font-serif text-sm font-semibold text-text">1. Upload Policy</h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Drag & drop standard PDF policy wording documents up to 20MB.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-card bg-surface border border-border space-y-2 overflow-hidden break-words">
                    <div className="w-8 h-8 rounded-btn bg-surface-2 border border-border flex items-center justify-center text-accent">
                      <CheckIcon className="w-4 h-4 text-accent" />
                    </div>
                    <h4 className="font-serif text-sm font-semibold text-text">2. Extract & Verify</h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Plain-language answers matched verbatim to clause text & page citations.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-card bg-surface border border-border space-y-2 overflow-hidden break-words">
                    <div className="w-8 h-8 rounded-btn bg-surface-2 border border-border flex items-center justify-center text-accent">
                      <ScaleIcon className="w-4 h-4 text-accent" />
                    </div>
                    <h4 className="font-serif text-sm font-semibold text-text">3. Compare & Decide</h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Compare two policies side-by-side with differing clauses highlighted.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer with Mandatory Disclaimer (Requirement 5) */}
      <footer className="border-t border-border py-6 text-xs text-text-muted mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>Policy Scorecard — Verbatim Health Insurance Verification</span>
          <span className="text-text-muted/80">Informational only, not insurance or legal advice.</span>
        </div>
      </footer>
    </div>
  );
}
