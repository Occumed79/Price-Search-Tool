import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(process.cwd(), 'api-server/src/services/searchPipeline.ts');
const source = readFileSync(file, 'utf8');

const checks = [
  { label: 'isHighConfidenceUrl', regex: /function\s+isHighConfidenceUrl\s*\(/g, expected: 1 },
  { label: 'shouldSkipWeakSnippet', regex: /function\s+shouldSkipWeakSnippet\s*\(/g, expected: 1 },
  { label: 'providerNames variable', regex: /const\s+providerNames\s*=\s*providerTasks\.map\(/g, expected: 1 },
  { label: 'results variable', regex: /const\s+results\s*:\s*SearchHit\[\]\s*=\s*\[\]/g, expected: 1 },
];

const errors = [];
for (const check of checks) {
  const count = (source.match(check.regex) || []).length;
  if (count !== check.expected) {
    errors.push(`${check.label}: expected ${check.expected}, found ${count}`);
  }
}

if (errors.length > 0) {
  console.error('[merge-guard] searchPipeline duplicate/merge check failed');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[merge-guard] searchPipeline duplicate/merge check passed');
