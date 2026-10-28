import React, { useState, useRef } from 'react';
import { UploadCloudIcon, FilePdfIcon, XIcon, ScaleIcon, AlertTriangleIcon, SparklesIcon } from './Icons';
import { formatFileSize } from '../utils/formatters';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function DropCard({ label, file, onSelect, onRemove, color = 'indigo' }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onSelect(e.target.files[0]);
    }
  };

  const badgeColor = color === 'indigo' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  const borderColor = dragActive ? (color === 'indigo' ? 'border-indigo-500 bg-indigo-500/10' : 'border-purple-500 bg-purple-500/10') : file ? 'border-zinc-700 bg-zinc-900/60' : 'border-zinc-800 bg-[#0f1420]/80 hover:border-zinc-700 hover:bg-[#121927]';

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed p-6 transition-all duration-200 text-center flex flex-col justify-between min-h-[260px] ${borderColor} ${file ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${badgeColor}`}>
          {label}
        </span>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
            title="Remove file"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {!file ? (
        <div className="py-4 flex flex-col items-center my-auto">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-3 shadow-inner">
            <UploadCloudIcon className={`w-7 h-7 ${color === 'indigo' ? 'text-indigo-400' : 'text-purple-400'}`} />
          </div>
          <h4 className="text-sm font-semibold text-zinc-200 mb-1">
            Drop {label} here
          </h4>
          <p className="text-xs text-zinc-400 max-w-[220px] mb-3">
            Select or drag PDF policy document
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-all shadow-sm"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="py-3 flex flex-col items-center justify-center my-auto">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
            <FilePdfIcon className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-zinc-100 max-w-[240px] truncate px-2" title={file.name}>
            {file.name}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {formatFileSize(file.size)} • Ready for comparison
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="mt-3 text-[11px] text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
          >
            Change PDF
          </button>
        </div>
      )}

      <div className="text-[11px] text-zinc-500 text-center pt-2 border-t border-zinc-800/60">
        Max 20MB • Searchable PDF
      </div>
    </div>
  );
}

export default function CompareUploadZone({ onCompare, isLoading, onLoadSamplePolicies }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [validationError, setValidationError] = useState('');

  const validate = (file) => {
    if (!file) return false;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setValidationError('Only PDF documents are supported.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setValidationError(`File size (${formatFileSize(file.size)}) exceeds the 20MB limit.`);
      return false;
    }
    if (file.size === 0) {
      setValidationError('The selected PDF file is empty (0 bytes).');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSelectA = (file) => {
    if (validate(file)) setFileA(file);
  };

  const handleSelectB = (file) => {
    if (validate(file)) setFileB(file);
  };

  const handleSubmit = () => {
    if (!fileA || !fileB) {
      setValidationError('Please select both Policy A and Policy B before comparing.');
      return;
    }
    onCompare(fileA, fileB);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError('')}
            className="text-rose-400 hover:text-rose-200 p-1"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <DropCard
          label="Policy A (e.g. Existing Plan)"
          file={fileA}
          onSelect={handleSelectA}
          onRemove={() => setFileA(null)}
          color="indigo"
        />

        <DropCard
          label="Policy B (e.g. Alternative Plan)"
          file={fileB}
          onSelect={handleSelectB}
          onRemove={() => setFileB(null)}
          color="purple"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!fileA || !fileB || isLoading}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
        >
          <ScaleIcon className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
          <span>Compare Both Policies Side-by-Side</span>
        </button>

        {onLoadSamplePolicies && (
          <button
            type="button"
            onClick={onLoadSamplePolicies}
            className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs border border-zinc-700 transition-colors flex items-center justify-center space-x-1.5"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample Comparison (SecureLife vs MediCare Plus)</span>
          </button>
        )}
      </div>

      {(!fileA || !fileB) && (
        <p className="text-center text-xs text-zinc-500">
          Upload both policies to unlock automated difference highlighting, waiting period checks, and co-payment contrasts.
        </p>
      )}
    </div>
  );
}
