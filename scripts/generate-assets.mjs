import { spawnSync } from 'node:child_process';
import path from 'node:path';

const script = path.resolve('scripts/generate-png-assets.py');
const candidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python'];

let result = null;
for (const command of candidates) {
  result = spawnSync(command, [script], { stdio: 'inherit', shell: false });
  if (result.status === 0) process.exit(0);
  if (result.error?.code !== 'ENOENT') break;
}

console.error('Failed to generate PNG assets. Install Python with Pillow, then rerun node scripts/generate-assets.mjs.');
process.exit(result?.status ?? 1);
