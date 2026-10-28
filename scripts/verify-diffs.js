import { isFieldDifferent } from '../client/src/utils/diffChecker.js';
import { FIELD_DEFINITIONS } from '../client/src/constants/fieldDefinitions.js';
import fs from 'node:fs';

const log = fs.readFileSync('C:/Users/adars/.gemini/antigravity-ide/brain/3f5a3825-370c-493f-87df-27294007e5bb/.system_generated/tasks/task-797.log', 'utf8');
const jsonMatch = log.match(/\{"a":\{.*"b":\{.*\}\}\}/);
if (!jsonMatch) {
  console.error('No JSON match found in log');
  process.exit(1);
}

const data = JSON.parse(jsonMatch[0]);
console.log('--- Comparison Verification ---');

let diffCount = 0;
const expectedDiffKeys = ['waiting_period_preexisting', 'room_rent_cap', 'copay', 'sub_limits'];

for (const [key, def] of Object.entries(FIELD_DEFINITIONS)) {
  const itemA = data.a.scorecard[key];
  const itemB = data.b.scorecard[key];
  const diff = isFieldDifferent(key, itemA, itemB);
  if (diff) diffCount++;

  const label = diff ? 'DIFFERS ' : 'IDENTICAL';
  console.log(`[${label}] ${def.title} (${key})`);
  console.log(`   Policy A: ${itemA?.value}`);
  console.log(`   Policy B: ${itemB?.value}`);
}

console.log(`\nTotal differing fields: ${diffCount} of 8`);
console.log(`Expected differences match: ${diffCount === 4 ? 'YES' : 'NO'}`);
