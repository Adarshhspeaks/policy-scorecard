import React, { useState, useRef } from 'react';
import { UploadCloudIcon, FilePdfIcon, XIcon, SparklesIcon, AlertTriangleIcon } from './Icons';
import { formatFileSize } from '../utils/formatters';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export default function UploadZone({ onAnalyze, isLoading, error, onClearError }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setValidationError('Please upload a valid PDF file. Only .pdf files are supported.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(`File size (${formatFileSize(file.size)}) exceeds the maximum limit of 20MB.`);
      return false;
    }

    if (file.size === 0) {
      setValidationError('The selected PDF file is empty (0 bytes).');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (onClearError) onClearError();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (onClearError) onClearError();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setValidationError('Please select or drop a PDF file first.');
      return;
    }
    onAnalyze(selectedFile);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Validation alert if local validation fails */}
      {validationError && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError('')}
            className="text-rose-400 hover:text-rose-200 transition-colors p-1"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drag & Drop Card */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-8 transition-all duration-200 text-center cursor-pointer ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-xl shadow-indigo-500/10'
            : selectedFile
            ? 'border-zinc-700 bg-zinc-900/60 cursor-default'
            : 'border-zinc-800 bg-[#0f1420]/80 hover:border-zinc-700 hover:bg-[#121927]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="policy-file-input"
        />

        {!selectedFile ? (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-4 group-hover:scale-105 transition-transform shadow-inner">
              <UploadCloudIcon className="w-8 h-8 text-indigo-400" />
            </div>

            <h3 className="text-lg font-semibold text-zinc-100 mb-1">
              Drop your insurance policy PDF here
            </h3>
            <p className="text-sm text-zinc-400 mb-4 max-w-sm">
              Drag & drop your health policy document or click to browse from your computer.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium border border-zinc-700/80 transition-all shadow-sm"
            >
              Select PDF File
            </button>

            <div className="mt-6 flex items-center space-x-4 text-xs text-zinc-500">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>PDF format only</span>
              </span>
              <span>•</span>
              <span>Max file size: 20MB</span>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <div className="p-4 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-between text-left mb-6 shadow-sm">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                  <FilePdfIcon className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate pr-2">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {formatFileSize(selectedFile.size)} • PDF Document
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                  title="Remove file"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                <SparklesIcon className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
                <span>Analyze Policy Scorecard</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium text-sm border border-zinc-700 transition-colors"
              >
                Choose different file
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info features below upload */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Exact Clause Citations
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Verbatim quotes from the policy text are verified against cited document pages.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Strict Factuality
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Zero guessing. If conditions aren't stated or cannot be confirmed, they are flagged unverified.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Plain Language
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Complex insurance jargon broken down into clear, plain-language summaries.
          </p>
        </div>
      </div>
    </div>
  );
}
