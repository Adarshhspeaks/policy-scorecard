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
            <h4 className="font-semibold text-rose-100 text-base flex items-center space-x-2">
              <span>
                {isNetworkError
                  ? 'Cannot Connect to Backend Server'
                  : isInvalidApiKey
                  ? 'Invalid Gemini API Key in .env'
                  : 'Analysis Request Failed'}
              </span>
              {error.status ? (
                <span className="text-xs px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800/80 text-rose-300 font-mono">
                  HTTP {error.status}
                </span>
              ) : null}
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

          <p className="text-sm text-rose-200/90 mt-1.5 leading-relaxed break-words">
            {isNetworkError
              ? `Unable to communicate with the API server at ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}. Make sure your Node.js backend is running with "npm start".`
              : cleanMessage || 'An unexpected error occurred while analyzing the document.'}
          </p>

          {error.status === 503 && (
            <p className="text-xs text-amber-300/90 mt-2 font-mono bg-amber-950/40 p-2 rounded border border-amber-900/40">
              Note: The Gemini service is temporarily experiencing high traffic spikes. Please wait a few seconds and click "Try Again".
            </p>
          )}

          {isInvalidApiKey && (
            <div className="mt-3 text-xs text-rose-300 bg-rose-950/60 p-3.5 rounded-xl border border-rose-900/60 space-y-2">
              <div className="font-semibold text-rose-200">How to fix this error:</div>
              <p className="text-rose-300/90 leading-relaxed">
                Google returned <code className="bg-rose-900/40 px-1 py-0.5 rounded text-rose-100 font-mono">ACCESS_TOKEN_TYPE_UNSUPPORTED</code>. This occurs when an <code className="bg-rose-900/40 px-1 py-0.5 rounded text-rose-100 font-mono">AQ.</code> key is created in an existing Google Cloud project where the Generative Language API is not yet enabled.
              </p>
              <div className="space-y-1.5 pl-1">
                <div>
                  <strong className="text-rose-100">Option A (Fastest):</strong> In{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-indigo-300 hover:text-indigo-200 font-medium"
                  >
                    Google AI Studio
                  </a>
                  , click <strong>Create API key</strong> and choose <strong>"Create API key in new project"</strong>. New projects have all required APIs enabled automatically.
                </div>
                <div>
                  <strong className="text-rose-100">Option B:</strong> If using your existing project, enable the{' '}
                  <a
                    href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-indigo-300 hover:text-indigo-200 font-medium"
                  >
                    Generative Language API in Google Cloud Console
                  </a>
                  .
                </div>
              </div>
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
