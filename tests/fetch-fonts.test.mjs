import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFontFaces, dedupeFaces, localFileName, buildFontsCss } from '../tools/fetch-fonts.mjs';

const SAMPLE = `/* cyrillic */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v13/cyr.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F;
}
/* latin */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v13/lat.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin-ext */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v13/latx.woff2) format('woff2');
  unicode-range: U+0100-024F;
}
`;

test('parseFontFaces оставляет только разрешённые подмножества', () => {
  const faces = parseFontFaces(SAMPLE, ['latin', 'cyrillic']);
  assert.equal(faces.length, 2);
  assert.deepEqual(faces.map((f) => f.subset), ['cyrillic', 'latin']);
});

test('parseFontFaces извлекает поля', () => {
  const [cyr] = parseFontFaces(SAMPLE, ['cyrillic']);
  assert.equal(cyr.family, 'Inter');
  assert.equal(cyr.weight, '400');
  assert.equal(cyr.url, 'https://fonts.gstatic.com/s/inter/v13/cyr.woff2');
  assert.equal(cyr.unicodeRange, 'U+0301, U+0400-045F');
});

test('localFileName даёт стабильные имена', () => {
  assert.equal(
    localFileName({ family: 'JetBrains Mono', weight: '500', subset: 'latin' }),
    'jetbrains-mono-500-latin.woff2'
  );
});

test('buildFontsCss ссылается на локальные файлы', () => {
  const css = buildFontsCss(parseFontFaces(SAMPLE, ['latin', 'cyrillic']));
  assert.match(css, /url\('\.\.\/assets\/fonts\/inter-400-cyrillic\.woff2'\)/);
  assert.match(css, /font-display: swap/);
  assert.match(css, /unicode-range: U\+0301, U\+0400-045F/);
});

test('dedupeFaces объединяет веса с общим URL в один диапазон', () => {
  const faces = [
    { subset: 'latin', family: 'Inter', style: 'normal', weight: '400', url: 'https://x/a.woff2', unicodeRange: 'U+0' },
    { subset: 'latin', family: 'Inter', style: 'normal', weight: '700', url: 'https://x/a.woff2', unicodeRange: 'U+0' }
  ];
  const deduped = dedupeFaces(faces);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].weight, '400 700');
  assert.equal(localFileName(deduped[0]), 'inter-latin.woff2');
});
