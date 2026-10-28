import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloudIcon, FilePdfIcon, CheckIcon, XIcon, ArrowRightIcon } from './Icons';
import { formatFileSize } from '../utils/formatters';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function UploadZone({ onAnalyze, isLoading, error, onClearError }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    setValidationError(null);
    if (onClearError) onClearError();

    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setValidationError('Please select a valid PDF file (.pdf only).');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError('File size exceeds the 20MB limit.');
      return;
    }

    setSelectedFile(file);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile && !isLoading) {
      onAnalyze(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Drag & Drop Area with Framer Motion hover/drag response */}
      <motion.div
        animate={{
          scale: dragActive ? 1.01 : 1,
          borderColor: dragActive ? '#E8A33D' : selectedFile ? '#2E2D25' : '#2E2D25',
          backgroundColor: dragActive ? '#1C1B16' : '#1C1B16',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`relative border border-dashed rounded-card p-4 sm:p-10 text-center transition-colors ${
          dragActive ? 'bg-surface-2' : 'bg-surface'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />

        {!selectedFile ? (
          <div className="space-y-4 cursor-pointer">
            <div className="w-14 h-14 mx-auto rounded-card bg-surface-2 border border-border flex items-center justify-center text-accent">
              <UploadCloudIcon className="w-7 h-7 text-accent" />
            </div>

            <div>
              <p className="font-serif text-lg font-medium text-text">
                Drop your health policy PDF here
              </p>
              <p className="text-xs text-text-muted mt-1">
                or <span className="text-accent underline underline-offset-2">browse your computer</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-text-muted pt-2 border-t border-border">
              <span>PDF documents up to 20MB</span>
              <span>•</span>
              <span>IRDAI standard policies</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-btn bg-surface-2 border border-border flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-btn bg-surface border border-border flex items-center justify-center text-accent flex-shrink-0">
                  <FilePdfIcon className="w-5 h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate max-w-sm">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-text-muted font-mono">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isLoading}
                className="p-2 rounded-btn text-text-muted hover:text-text hover:bg-surface transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Remove file"
                aria-label="Remove selected PDF"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full sm:w-auto px-6 py-3 rounded-btn bg-accent text-accent-ink font-semibold text-sm transition-opacity hover:opacity-95 flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[44px] cursor-pointer"
              >
                <span>Extract & Verify Scorecard</span>
                <ArrowRightIcon className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Validation warning */}
      {validationError && (
        <div className="p-3 rounded-btn bg-unverified-bg border border-unverified/30 text-xs text-unverified flex items-center space-x-2">
          <XIcon className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
