import { FIELD_DEFINITIONS } from '../constants/fieldDefinitions';

/**
 * Converts snake_case string to Title Case.
 * Example: 'waiting_period_initial' -> 'Waiting Period Initial'
 */
export function snakeToTitleCase(str) {
  if (!str) return '';
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Returns human friendly title for a field key, using FIELD_DEFINITIONS if available
 * or falling back to snakeToTitleCase.
 */
export function getFieldTitle(key) {
  if (FIELD_DEFINITIONS[key]?.title) {
    return FIELD_DEFINITIONS[key].title;
  }
  return snakeToTitleCase(key);
}

/**
 * Returns human friendly description for a field key.
 */
export function getFieldDescription(key) {
  return FIELD_DEFINITIONS[key]?.description || '';
}

/**
 * Formats byte size into human readable string.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extracts page number from field data, either directly from .page or parsed from .note
 */
export function extractPageNumber(fieldData) {
  if (!fieldData) return null;
  if (fieldData.page !== undefined && fieldData.page !== null) {
    return fieldData.page;
  }
  if (typeof fieldData.note === 'string') {
    const match = fieldData.note.match(/page\s+(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

/**
 * Returns formatted status badge attributes conforming to the strict editorial palette:
 * - verified: #8DB580 (moss green)
 * - unverified: #E0894B (burnt orange)
 * - not-found: #8A867A (stone grey)
 */
export function getStatusBadge(status, page) {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified',
        classes: 'bg-verified-bg text-verified border-verified/30',
        dotClass: 'bg-verified',
        type: 'verified',
      };
    case 'unverified':
      return {
        label: page ? `Unverified - check page ${page}` : 'Unverified - check manually',
        classes: 'bg-unverified-bg text-unverified border-unverified/30',
        dotClass: 'bg-unverified',
        type: 'unverified',
      };
    case 'not_found':
    default:
      return {
        label: 'Not found',
        classes: 'bg-not-found-bg text-not-found border-border',
        dotClass: 'bg-not-found',
        type: 'not_found',
      };
  }
}

/**
 * Returns confidence tag styling
 */
export function getConfidenceBadge(confidence) {
  if (!confidence) return null;
  const level = confidence.toLowerCase();
  switch (level) {
    case 'high':
      return {
        label: 'High confidence',
        classes: 'bg-surface text-text-muted border-border font-mono text-[11px]',
      };
    case 'medium':
      return {
        label: 'Medium confidence',
        classes: 'bg-surface text-text-muted border-border font-mono text-[11px]',
      };
    case 'low':
      return {
        label: 'Low confidence',
        classes: 'bg-surface text-unverified border-border font-mono text-[11px]',
      };
    default:
      return {
        label: `${confidence} confidence`,
        classes: 'bg-surface text-text-muted border-border font-mono text-[11px]',
      };
  }
}
