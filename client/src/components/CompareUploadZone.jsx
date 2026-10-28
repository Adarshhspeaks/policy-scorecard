import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloudIcon, FilePdfIcon, ScaleIcon, XIcon, ArrowRightIcon } from './Icons';
import { formatFileSize } from '../utils/formatters';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function DropCard({ label, file, onSelect, onRemove, indicatorLetter }) {
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
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onSelect(e.target.files[0]);
    }
  };

  return (
    <motion.div
      animate={{
        scale: dragActive ? 1.01 : 1,
        borderColor: dragActive ? '#E8A33D' : '#2E2D25',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`relative border border-dashed rounded-card p-4 sm:p-6 flex flex-col justify-between transition-colors min-h-[200px] ${
        dragActive ? 'bg-surface-2' : 'bg-surface'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleChange}
      />

      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded-[4px] bg-surface-2 border border-border text-accent font-mono text-[11px] font-semibold flex items-center justify-center">
            {indicatorLetter}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-text">
            {label}
          </span>
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="p-1 text-text-muted hover:text-text rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            aria-label={`Remove ${label}`}
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {!file ? (
        <div className="py-6 text-center cursor-pointer space-y-2">
          <UploadCloudIcon className="w-7 h-7 mx-auto text-text-muted" />
          <p className="font-serif text-sm font-medium text-text">
            Drop {label} PDF here
          </p>
          <p className="text-[11px] text-text-muted">
            or <span className="text-accent underline underline-offset-2">browse computer</span>
          </p>
        </div>
      ) : (
        <div className="py-4 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-btn bg-surface-2 border border-border flex items-center justify-center text-accent flex-shrink-0">
              <FilePdfIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text truncate">
                {file.name}
              </p>
              <p className="text-[11px] text-text-muted font-mono">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-[10px] text-text-muted text-center pt-2 border-t border-border/80">
        PDF documents up to 20MB
      </div>
    </motion.div>
  );
}

export default function CompareUploadZone({ onCompare, isLoading, onLoadSamplePolicies }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSelectA = (file) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Policy A must be a PDF document.');
      return;
    }
    setErrorMsg(null);
    setFileA(file);
  };

  const handleSelectB = (file) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Policy B must be a PDF document.');
      return;
    }
    setErrorMsg(null);
    setFileB(file);
  };

  const handleCompareClick = () => {
    if (fileA && fileB && !isLoading) {
      onCompare(fileA, fileB);
    }
  };

  const canCompare = Boolean(fileA && fileB && !isLoading);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Dual Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DropCard
          label="Policy A"
          indicatorLetter="A"
          file={fileA}
          onSelect={handleSelectA}
          onRemove={() => setFileA(null)}
        />
        <DropCard
          label="Policy B"
          indicatorLetter="B"
          file={fileB}
          onSelect={handleSelectB}
          onRemove={() => setFileB(null)}
        />
      </div>

      {errorMsg && (
        <div className="p-3 rounded-btn bg-unverified-bg border border-unverified/30 text-xs text-unverified flex items-center space-x-2">
          <XIcon className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onLoadSamplePolicies}
          className="text-xs text-text-muted hover:text-text underline underline-offset-4 min-h-[44px] cursor-pointer whitespace-normal break-words text-center sm:text-left"
        >
          Load 2 Sample Benchmark Policies →
        </button>

        <motion.button
          type="button"
          onClick={handleCompareClick}
          disabled={!canCompare}
          whileHover={canCompare ? { y: -1 } : {}}
          whileTap={canCompare ? { scale: 0.98 } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full sm:w-auto px-7 py-3 rounded-btn bg-accent text-accent-ink font-semibold text-sm transition-opacity hover:opacity-95 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] cursor-pointer"
        >
          <ScaleIcon className="w-4 h-4" />
          <span>Compare Both Policies</span>
        </motion.button>
      </div>
    </div>
  );
}
