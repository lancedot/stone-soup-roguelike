import { spawnSync } from 'node:child_process';
import path from 'node:path';

const scripts = [
  path.resolve('scripts/normalize-img2-hero-sheets.py'),
  path.resolve('scripts/normalize-img2-static-assets.py'),
];
const candidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python'];

let lastResult = null;
let pythonCommand = null;
for (const command of candidates) {
  const probe = spawnSync(command, ['--version'], { stdio: 'ignore', shell: false });
  if (probe.status === 0) {
    pythonCommand = command;
    break;
  }
  lastResult = probe;
}

if (!pythonCommand) {
  console.error('Failed to find Python. Install Python with Pillow, then rerun node scripts/generate-assets.mjs.');
  process.exit(lastResult?.status ?? 1);
}

for (const script of scripts) {
  const result = spawnSync(pythonCommand, [script], { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    console.error(`Failed while running ${script}.`);
    process.exit(result.status ?? 1);
  }
}
