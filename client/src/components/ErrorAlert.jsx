import React from 'react';
import { AlertTriangleIcon, ScanAlertIcon, XIcon, RefreshCwIcon } from './Icons';

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
      <div className="w-full max-w-2xl mx-auto mb-6 p-5 rounded-card bg-unverified-bg border border-unverified/30 text-text relative">
        <div className="flex items-start space-x-3.5">
          <div className="w-9 h-9 rounded-btn bg-surface border border-border text-unverified flex items-center justify-center flex-shrink-0 mt-0.5">
            <ScanAlertIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-base font-semibold text-text">
                Scanned PDF Detected (OCR Not Supported)
              </h4>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-text-muted hover:text-text p-2 rounded-btn transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  aria-label="Dismiss message"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              This document contains fewer than 500 extractable characters and appears to be a scanned image. The analyzer requires a digital PDF with selectable text.
            </p>
            <div className="mt-3.5 flex items-center space-x-3">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-xs font-semibold px-4 py-2 rounded-btn bg-accent text-accent-ink hover:opacity-95 transition-opacity min-h-[44px] cursor-pointer"
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
    <div className="w-full max-w-2xl mx-auto mb-6 p-5 rounded-card bg-surface border border-unverified/40 text-text relative">
      <div className="flex items-start space-x-3.5">
        <div className="w-9 h-9 rounded-btn bg-surface-2 border border-border text-unverified flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangleIcon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-base font-semibold text-text flex items-center space-x-2">
              <span>
                {isNetworkError
                  ? 'Cannot Connect to Backend Server'
                  : isInvalidApiKey
                  ? 'Invalid API Key Configuration'
                  : 'Analysis Request Failed'}
              </span>
              {error.status ? (
                <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-surface-2 border border-border text-text-muted">
                  HTTP {error.status}
                </span>
              ) : null}
            </h4>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-text-muted hover:text-text p-2 rounded-btn transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Dismiss error"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-xs text-text-muted mt-1.5 leading-relaxed break-words">
            {isNetworkError
              ? `Unable to communicate with the API server at ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}. Make sure your Node.js backend is running with "npm start".`
              : cleanMessage || 'An unexpected error occurred while analyzing the document.'}
          </p>

          <div className="mt-4 flex items-center space-x-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-btn bg-accent text-accent-ink text-xs font-semibold hover:opacity-95 transition-opacity min-h-[44px] cursor-pointer"
              >
                <RefreshCwIcon className="w-3.5 h-3.5 text-accent-ink" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
