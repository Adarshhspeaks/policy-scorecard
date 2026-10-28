import React, { useState, useId } from 'react';

// Regex matching numbers with units: durations, currency, percentages, sub-limits
const FACT_REGEX = /(?:(?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakhs?|crores?|k))?|\b\d+(?:\.\d+)?%\s*(?:of\s+(?:the\s+)?(?:sum\s+insured|admissible\s+claim|claim\s+amount|basic\s+sum\s+insured))?|\b\d+\s*(?:calendar\s+)?(?:days?|months?|years?|weeks?|hours?)\b|\b(?:one|two|three|four|five|six|twenty-four|thirty|thirty-six|forty-eight)\s+(?:days?|months?|years?)\b|\b\d+\s*to\s*\d+\s*(?:days?|months?|years?)\b)/gi;

/**
 * Parses a string and wraps key facts (numbers with units, currency, percentages)
 * in a subtle bold + saffron accent span with JetBrains Mono.
 */
export function highlightKeyFacts(text) {
  if (!text || typeof text !== 'string') return text;

  const parts = [];
  let lastIndex = 0;
  let match;

  FACT_REGEX.lastIndex = 0;

  while ((match = FACT_REGEX.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];

    // Push preceding unhighlighted text
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    // Push highlighted token
    parts.push(
      <span
        key={`fact-${matchIndex}-${matchText}`}
        className="font-mono font-medium text-accent bg-accent/10 px-1 py-0.5 rounded-[4px]"
      >
        {matchText}
      </span>
    );

    lastIndex = matchIndex + matchText.length;
  }

  // Push remainder
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Clamps long plain-language values to ~4 lines with a clean "Read more" / "Read less" toggle.
 */
export function ClampedValue({ text, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();

  if (!text || typeof text !== 'string') return null;

  // Approximate 4 lines of text (~220 characters depending on width)
  const threshold = 200;
  const isLong = text.length > threshold;

  if (!isLong) {
    return (
      <p className={`text-text leading-relaxed text-sm ${className}`}>
        {highlightKeyFacts(text)}
      </p>
    );
  }

  const displayText = isExpanded ? text : text.slice(0, threshold).trim() + '...';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <p id={contentId} className="text-text leading-relaxed text-sm">
        {highlightKeyFacts(displayText)}
      </p>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="inline-flex items-center text-xs font-medium text-accent hover:underline focus-visible:ring-1 focus-visible:ring-accent min-h-[44px] py-1 cursor-pointer"
      >
        {isExpanded ? 'Read less' : 'Read more'}
      </button>
    </div>
  );
}
