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
 * Returns formatted status badge attributes
 */
export function getStatusBadge(status, page) {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified',
        classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        type: 'verified',
      };
    case 'unverified':
      return {
        label: page ? `Unverified - check page ${page}` : 'Unverified - check page manually',
        classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-400',
        type: 'unverified',
      };
    case 'not_found':
    default:
      return {
        label: 'Not found',
        classes: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
        dotClass: 'bg-zinc-500',
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
        classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
      };
    case 'medium':
      return {
        label: 'Medium confidence',
        classes: 'bg-yellow-950/80 text-yellow-300 border-yellow-800/50',
      };
    case 'low':
      return {
        label: 'Low confidence',
        classes: 'bg-rose-950/80 text-rose-300 border-rose-800/50',
      };
    default:
      return {
        label: `${confidence} confidence`,
        classes: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      };
  }
}
