// Copies the Bryntum dark theme CSS from node_modules to public/ so it can be
// loaded on demand via a <link> tag when the user toggles dark mode.
// The light theme (gantt.css) is still statically bundled via BryntumGanttWrapper.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'node_modules/@bryntum/gantt/stockholm-dark.css');
const destDir = resolve(root, 'public/bryntum');
const dest = resolve(destDir, 'stockholm-dark.css');

if (!existsSync(src)) {
  console.warn(`[sync-bryntum-theme] Source not found: ${src}. Skipping.`);
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[sync-bryntum-theme] Copied ${src} -> ${dest}`);
