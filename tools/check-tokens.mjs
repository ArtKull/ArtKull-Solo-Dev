import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'css';
const REQUIRED = [
  '--grad-accent',
  '--radius-window', '--radius-card', '--radius-el', '--radius-pill',
  '--header-h', '--ease', '--dur', '--dur-fast', '--dur-slow',
  '--bg', '--bg-glow-1', '--bg-glow-2',
  '--surface', '--surface-solid', '--surface-2', '--surface-hover',
  '--glass-bg', '--glass-border', '--glass-blur', '--inset-highlight',
  '--text', '--text-muted',
  '--accent', '--accent-hover', '--accent-solid', '--accent-solid-hover',
  '--accent-text', '--accent-soft', '--accent-glow', '--violet', '--violet-deep',
  '--success', '--success-ring', '--warning', '--info', '--danger',
  '--border', '--border-hover',
  '--shadow', '--shadow-lifted', '--shadow-window', '--glow-primary',
  '--font-sans', '--font-mono', '--container'
];

const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
const defined = new Set();
const used = [];

for (const file of files) {
  const text = readFileSync(join(dir, file), 'utf8');
  for (const m of text.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);
  for (const m of text.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
    used.push({ file, token: m[1] });
  }
}

const missingDefs = used.filter((u) => !defined.has(u.token));
const missingRequired = REQUIRED.filter((t) => !defined.has(t));

let failed = false;
if (missingDefs.length) {
  failed = true;
  console.error('Необъявленные токены:');
  for (const m of missingDefs) console.error(`  ${m.token} (${m.file})`);
}
if (missingRequired.length) {
  failed = true;
  console.error('Отсутствуют обязательные токены:');
  for (const t of missingRequired) console.error(`  ${t}`);
}
if (failed) process.exit(1);
console.log(`OK: ${used.length} var()-ссылок, ${defined.size} токенов определено.`);
