/**
 * Prior-auth sample PDF — same lab requisition layout as sample-candidate.
 * Run: node scripts/gen-sample-candidate.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const generator = resolve(__dirname, 'gen-sample-candidate.mjs');

const result = spawnSync(process.execPath, [generator], { stdio: 'inherit' });
process.exit(result.status ?? 1);
