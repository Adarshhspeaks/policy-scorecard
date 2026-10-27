import React from 'react';
import { AlertTriangleIcon, ScanAlertIcon, XIcon } from './Icons';

function parseErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return '';
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) {
      return parsed.error.message;
    }
    if (parsed.message) {
      return parsed.message;
    }
  } catch {}
  return msg;
}

export default function ErrorAlert({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const rawMessage = error.message || '';
  const cleanMessage = parseErrorMessage(rawMessage);
  const isInvalidApiKey = cleanMessage.toLowerCase().includes('api key not valid') || rawMessage.toLowerCase().includes('api_key_invalid');
  const isScannedPdf = error.status === 422 || rawMessage.toLowerCase().includes('scanned pdf') || cleanMessage.toLowerCase().includes('scanned pdf');
  const isNetworkError = rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError') || rawMessage.includes('ECONNREFUSED');

  if (isScannedPdf) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 shadow-xl relative animate-fadeIn">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ScanAlertIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-amber-100 text-base">
                Scanned PDF Detected (OCR Not Supported)
              </h4>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-amber-400 hover:text-amber-200 p-1 rounded-lg transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-amber-200/90 mt-1.5 leading-relaxed">
              This document contains fewer than 500 extractable text characters and appears to be a scanned image or bitmap PDF. The current analyzer requires a digital PDF with selectable text.
            </p>
            <div className="mt-3 flex items-center space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-colors"
                >
                  Upload another PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 shadow-xl relative animate-fadeIn">
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangleIcon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-rose-100 text-base">
              {isNetworkError
                ? 'Cannot Connect to Backend Server'
                : isInvalidApiKey
                ? 'Invalid Gemini API Key in .env'
                : 'Analysis Request Failed'}
            </h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-rose-400 hover:text-rose-200 p-1 rounded-lg transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-sm text-rose-200/90 mt-1.5 leading-relaxed">
            {isNetworkError
              ? `Unable to communicate with the API server at ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}. Make sure your Node.js backend is running with "npm start".`
              : cleanMessage || 'An unexpected error occurred while analyzing the document.'}
          </p>

          {isInvalidApiKey && (
            <div className="mt-3 text-xs text-rose-300 bg-rose-950/60 p-3 rounded-xl border border-rose-900/60 space-y-1.5">
              <div className="font-semibold text-rose-200">How to fix your API key:</div>
              <ul className="list-disc pl-4 space-y-1 text-rose-300/90">
                <li>
                  Your key in <code className="bg-rose-900/40 px-1 py-0.5 rounded text-rose-100 font-mono">.env</code> starts with <code className="bg-rose-900/40 px-1 py-0.5 rounded text-rose-100 font-mono">AQ.</code>, which is an OAuth or internal session token, not a Google AI Studio API key.
                </li>
                <li>
                  A valid Gemini API key starts with <code className="bg-rose-900/40 px-1 py-0.5 rounded text-rose-100 font-mono">AIzaSy...</code>
                </li>
                <li>
                  Get a free key at{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-indigo-300 hover:text-indigo-200 font-medium"
                  >
                    https://aistudio.google.com/app/apikey
                  </a>
                  , paste it in <code className="bg-rose-900/40 px-1 py-0.5 rounded text-rose-100 font-mono">.env</code>, and restart with <code className="bg-rose-900/40 px-1 py-0.5 rounded text-rose-100 font-mono">npm start</code>.
                </li>
              </ul>
            </div>
          )}

          {!isInvalidApiKey && error.status === 500 && (
            <p className="text-xs text-rose-300/80 mt-2 font-mono bg-rose-950/40 p-2 rounded border border-rose-900/40">
              Tip: Verify that GEMINI_API_KEY is configured in your backend .env file.
            </p>
          )}

          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
