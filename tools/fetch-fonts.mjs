import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const ALLOWED_SUBSETS = ['latin', 'cyrillic'];
const FONT_DIR = 'assets/fonts';
const CSS_OUT = 'css/fonts.css';

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

export function localFileName(face) {
  const slug = face.family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-${face.weight}-${face.subset}.woff2`;
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
          `  src: url('../${FONT_DIR}/${localFileName(face)}') format('woff2');`
        ];
        if (face.unicodeRange) lines.push(`  unicode-range: ${face.unicodeRange};`);
        lines.push('}');
        return lines.join('\n');
      })
      .join('\n\n') + '\n'
  );
}

async function fetchCss() {
  const res = await fetch(CSS_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    throw new Error('Не удалось получить CSS Google Fonts: ' + res.status);
  }
  return res.text();
}

async function main() {
  const css = await fetchCss();
  const faces = parseFontFaces(css, ALLOWED_SUBSETS);
  if (faces.length === 0) {
    throw new Error('Не найдено @font-face для: ' + ALLOWED_SUBSETS.join(', '));
  }
  mkdirSync(FONT_DIR, { recursive: true });
  for (const face of faces) {
    const file = join(FONT_DIR, localFileName(face));
    if (existsSync(file)) {
      console.log('skip ' + file);
      continue;
    }
    const bin = await fetch(face.url, { headers: { 'User-Agent': UA } });
    if (!bin.ok) {
      throw new Error('Не удалось скачать ' + face.url + ': ' + bin.status);
    }
    writeFileSync(file, Buffer.from(await bin.arrayBuffer()));
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
