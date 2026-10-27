import React, { useState } from 'react';
import Navbar from './components/Navbar';
import UploadZone from './components/UploadZone';
import LoadingAnalysis from './components/LoadingAnalysis';
import ScorecardView from './components/ScorecardView';
import ErrorAlert from './components/ErrorAlert';
import { SparklesIcon } from './components/Icons';

// Mock sample for instant preview / testing
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
  }
};

export default function App() {
  const [analyzingFile, setAnalyzingFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzedFileName, setAnalyzedFileName] = useState('');

  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  const handleAnalyze = async (file) => {
    setIsLoading(true);
    setError(null);
    setAnalyzingFile(file);

    try {
      const formData = new FormData();
      formData.append('policy', file);

      const endpoint = `${apiUrl}/api/analyze`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error || `Server responded with status ${response.status}`;
        const err = new Error(errorMsg);
        err.status = response.status;
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

  const handleReset = () => {
    setAnalysisResult(null);
    setAnalyzedFileName('');
    setError(null);
    setIsLoading(false);
    setAnalyzingFile(null);
  };

  const handleLoadDemo = () => {
    setError(null);
    setAnalyzedFileName('Care_Advantage_Sample_Policy_2025.pdf');
    setAnalysisResult(SAMPLE_MOCK_RESULT);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-zinc-100 flex flex-col font-sans">
      <Navbar onReset={handleReset} hasResults={Boolean(analysisResult)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Error notification banner if any */}
        {error && (
          <ErrorAlert
            error={error}
            onDismiss={() => setError(null)}
            onRetry={analyzingFile ? () => handleAnalyze(analyzingFile) : handleReset}
          />
        )}

        {/* State 1: Loading view */}
        {isLoading && (
          <LoadingAnalysis file={analyzingFile} />
        )}

        {/* State 2: Results Scorecard view */}
        {!isLoading && analysisResult && (
          <ScorecardView
            result={analysisResult}
            fileName={analyzedFileName}
            onReset={handleReset}
          />
        )}

        {/* State 3: Upload Page view */}
        {!isLoading && !analysisResult && (
          <div className="py-4">
            {/* Hero Heading */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Zero-Hallucination Policy Verification</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Understand what your health policy{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
                  actually covers
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
                Upload your policy PDF to instantly extract critical clauses: waiting periods, room rent caps, co-pay rules, and exclusions with verbatim verified citations.
              </p>
            </div>

            {/* Upload Zone */}
            <UploadZone
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              error={error}
              onClearError={() => setError(null)}
            />

            {/* Demo / Sample Shortcut */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={handleLoadDemo}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4 transition-colors"
              >
                No PDF on hand? Try interactive preview with sample scorecard data →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-6 text-center text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Policy Scorecard — Verbatim Fact Verification Engine</span>
          <span className="text-zinc-400">
            Powered by Google Gemini & PDF Parse
          </span>
        </div>
      </footer>
    </div>
  );
}
