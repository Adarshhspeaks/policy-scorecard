import { FIELD_DEFINITIONS } from '../constants/fieldDefinitions.js';

/**
 * Normalizes text for comparison: lowercase, trim, collapses spaces
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts waiting period duration in normalized units (e.g. '30d', '36m')
 */
function extractWaitingDuration(normText) {
  const daysMatch = normText.match(/\b(\d+)\s*(?:day|days)\b/);
  if (daysMatch) return `${daysMatch[1]}d`;

  const monthsMatch = normText.match(/\b(\d+)\s*(?:month|months)\b/);
  if (monthsMatch) return `${monthsMatch[1]}m`;

  const yearsMatch = normText.match(/\b(\d+)\s*(?:year|years)\b/);
  if (yearsMatch) return `${parseInt(yearsMatch[1], 10) * 12}m`;

  const uniqueNums = Array.from(new Set(normText.match(/\b\d+\b/g) || [])).sort().join(',');
  return uniqueNums;
}

/**
 * Checks if two policy field values differ
 */
export function isFieldDifferent(fieldKey, fieldA, fieldB) {
  if (!fieldA && !fieldB) return false;
  if (!fieldA || !fieldB) return true;

  const statusA = fieldA.status || 'not_found';
  const statusB = fieldB.status || 'not_found';

  // If both not found, they agree on not being found
  if (statusA === 'not_found' && statusB === 'not_found') return false;
  // If one is not found and the other is found
  if (statusA === 'not_found' || statusB === 'not_found') return true;

  const valA = (fieldA.value || '').trim();
  const valB = (fieldB.value || '').trim();

  if (!valA && !valB) return false;
  if (!valA || !valB) return true;

  const normA = normalizeText(valA);
  const normB = normalizeText(valB);

  if (normA === normB) return false;

  // 1. Waiting periods: compare durations (e.g. '30d' vs '30d', '36m' vs '48m')
  if (fieldKey.includes('waiting_period')) {
    const durA = extractWaitingDuration(normA);
    const durB = extractWaitingDuration(normB);
    if (durA && durB) {
      return durA !== durB;
    }
  }

  // 2. Room rent: check cap vs no cap, or percentages
  if (fieldKey === 'room_rent_cap') {
    const noCapA = normA.includes('no cap') || normA.includes('no limit') || normA.includes('without any capping') || normA.includes('without proportionate');
    const noCapB = normB.includes('no cap') || normB.includes('no limit') || normB.includes('without any capping') || normB.includes('without proportionate');
    if (noCapA !== noCapB) return true;

    const pctA = normA.match(/\b\d+%/)?.[0];
    const pctB = normB.match(/\b\d+%/)?.[0];
    if (pctA && pctB && pctA !== pctB) return true;
    if (pctA !== pctB) return true;
  }

  // 3. Co-pay: check 0% / none vs percentage
  if (fieldKey === 'copay') {
    const isZeroA = normA.includes('no co payment') || normA.includes('zero co payment') || normA.includes('0%') || normA.includes('none') || normA.includes('no copay');
    const isZeroB = normB.includes('no co payment') || normB.includes('zero co payment') || normB.includes('0%') || normB.includes('none') || normB.includes('no copay');
    if (isZeroA !== isZeroB) return true;

    const pctA = normA.match(/\b\d+%/)?.[0];
    const pctB = normB.match(/\b\d+%/)?.[0];
    if (pctA && pctB && pctA !== pctB) return true;
  }

  // 4. Sub-limits: check monetary amounts (e.g. 40,000 vs 25,000)
  if (fieldKey === 'sub_limits') {
    const amountsA = Array.from(new Set(normA.match(/\b\d[\d,]*\b/g) || [])).sort().join(',');
    const amountsB = Array.from(new Set(normB.match(/\b\d[\d,]*\b/g) || [])).sort().join(',');
    if (amountsA && amountsB && amountsA !== amountsB) return true;
  }

  // 5. Claim conditions: check notification hours / days (48, 24, 30)
  if (fieldKey === 'claim_conditions') {
    const numsA = Array.from(new Set(normA.match(/\b\d+\b/g) || [])).sort().join(',');
    const numsB = Array.from(new Set(normB.match(/\b\d+\b/g) || [])).sort().join(',');
    if (numsA && numsB && numsA === numsB) return false;
  }

  // 6. Exclusions: check key phrases
  if (fieldKey === 'exclusions') {
    const keywords = ['alcohol', 'cosmetic', 'suicide', 'self-inflicted', 'hazardous', 'weight'];
    const countA = keywords.filter((k) => normA.includes(k)).length;
    const countB = keywords.filter((k) => normB.includes(k)).length;
    if (countA >= 2 && countB >= 2) return false;
  }

  return normA !== normB;
}

/**
 * Computes comparison stats for policy A and B
 */
export function computeComparisonStats(comparisonResult) {
  const scoreA = comparisonResult?.a?.scorecard || {};
  const scoreB = comparisonResult?.b?.scorecard || {};

  const fieldKeys = Object.keys(FIELD_DEFINITIONS);

  let totalCompared = fieldKeys.length;
  let differingCount = 0;
  let unverifiedCount = 0;

  fieldKeys.forEach((key) => {
    const itemA = scoreA[key];
    const itemB = scoreB[key];

    const differs = isFieldDifferent(key, itemA, itemB);
    if (differs) differingCount++;

    const isUnverifiedA = itemA?.status === 'unverified' || itemA?.status === 'not_found';
    const isUnverifiedB = itemB?.status === 'unverified' || itemB?.status === 'not_found';
    if (isUnverifiedA || isUnverifiedB) {
      unverifiedCount++;
    }
  });

  return {
    totalCompared,
    differingCount,
    unverifiedCount,
  };
}

export const isDifferent = isFieldDifferent;
