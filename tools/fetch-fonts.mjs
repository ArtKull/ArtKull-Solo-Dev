import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const ALLOWED_SUBSETS = ['latin', 'cyrillic'];
const FONT_SUBDIR = 'assets/fonts';
const FONT_DIR = join(ROOT, FONT_SUBDIR);
const CSS_OUT = join(ROOT, 'css', 'fonts.css');
const TIMEOUT_MS = 30000;

export function parseFontFaces(css, allowedSubsets) {
  const allowed = new Set(allowedSubsets);
  const faces = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
  let match;
  while ((match = re.exec(css)) !== null) {
    const subset = match[1];
    if (!allowed.has(subset)) continue;
    const block = match[2];
    const familyMatch = block.match(/font-family:\s*['"]?([^;'"]+)['"]?\s*;/);
    const weightMatch = block.match(/font-weight:\s*([^;]+);/);
    const styleMatch = block.match(/font-style:\s*([^;]+);/);
    const urlMatch = block.match(/url\(([^)]+)\)/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);
    if (!familyMatch || !urlMatch) continue;
    faces.push({
      subset: subset,
      family: familyMatch[1].trim(),
      weight: weightMatch ? weightMatch[1].trim() : '400',
      style: styleMatch ? styleMatch[1].trim() : 'normal',
      url: urlMatch[1].trim().replace(/^['"]|['"]$/g, ''),
      unicodeRange: rangeMatch ? rangeMatch[1].trim() : ''
    });
  }
  return faces;
}

export function dedupeFaces(faces) {
  const groups = new Map();
  for (const face of faces) {
    const key = [face.family, face.style, face.subset, face.url].join('|');
    if (!groups.has(key)) {
      groups.set(key, { face: face, weights: [] });
    }
    groups.get(key).weights.push(face.weight);
  }
  const out = [];
  for (const group of groups.values()) {
    const weights = [];
    for (const raw of group.weights) {
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n) && weights.indexOf(n) === -1) {
        weights.push(n);
      }
    }
    weights.sort((a, b) => a - b);
    let weight = group.weights[0];
    if (weights.length > 1) {
      weight = weights[0] + ' ' + weights[weights.length - 1];
    } else if (weights.length === 1) {
      weight = String(weights[0]);
    }
    out.push({
      subset: group.face.subset,
      family: group.face.family,
      style: group.face.style,
      weight: weight,
      url: group.face.url,
      unicodeRange: group.face.unicodeRange
    });
  }
  return out;
}

export function localFileName(face) {
  const slug = face.family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const weightPart = /\s/.test(String(face.weight)) ? '' : '-' + face.weight;
  return slug + weightPart + '-' + face.subset + '.woff2';
}

export function buildFontsCss(faces) {
  return (
    faces
      .map((face) => {
        const lines = [
          '@font-face {',
          `  font-family: '${face.family}';`,
          `  font-style: ${face.style};`,
          `  font-weight: ${face.weight};`,
          '  font-display: swap;',
          `  src: url('../${FONT_SUBDIR}/${localFileName(face)}') format('woff2');`
        ];
        if (face.unicodeRange) lines.push(`  unicode-range: ${face.unicodeRange};`);
        lines.push('}');
        return lines.join('\n');
      })
      .join('\n\n') + '\n'
  );
}

async function fetchWithTimeout(url) {
  return fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
}

async function main() {
  const res = await fetchWithTimeout(CSS_URL);
  if (!res.ok) {
    throw new Error('Не удалось получить CSS Google Fonts: ' + res.status);
  }
  const css = await res.text();
  const faces = dedupeFaces(parseFontFaces(css, ALLOWED_SUBSETS));
  if (faces.length === 0) {
    throw new Error('Не найдено @font-face для: ' + ALLOWED_SUBSETS.join(', '));
  }
  if (existsSync(FONT_DIR)) {
    rmSync(FONT_DIR, { recursive: true, force: true });
  }
  mkdirSync(FONT_DIR, { recursive: true });
  for (const face of faces) {
    const bin = await fetchWithTimeout(face.url);
    if (!bin.ok) {
      throw new Error('Не удалось скачать ' + face.url + ': ' + bin.status);
    }
    const buf = Buffer.from(await bin.arrayBuffer());
    if (buf.subarray(0, 4).toString('latin1') !== 'wOF2') {
      throw new Error('Файл не похож на woff2: ' + face.url);
    }
    const file = join(FONT_DIR, localFileName(face));
    writeFileSync(file, buf);
    console.log('saved ' + file);
  }
  writeFileSync(CSS_OUT, buildFontsCss(faces));
  console.log('written ' + CSS_OUT + ' (' + faces.length + ' @font-face)');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
