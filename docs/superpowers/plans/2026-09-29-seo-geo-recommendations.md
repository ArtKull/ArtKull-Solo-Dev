# SEO/GEO-фундамент — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Закрыть 10 задач технического SEO/GEO из раздела 6 аудита (статус «В работе»): robots.txt, sitemap.xml, canonical/robots/ссылки, OG-теги, Schema.org, preload шрифтов, favicon/apple-touch/manifest, брендированную 404, llms.txt, правки `privacy.html` и Title/Description главной.

**Architecture:** Статический сайт на GitHub Pages без сборщика. Все артефакты — обычные файлы в корне репозитория или в `assets/`. Растровые иконки генерируются dependency-free Node-скриптом `tools/make-icons.mjs` (встроенный `zlib`, никаких npm-пакетов) и коммитятся. Проверка автоматизирована через `node:test` в `tests/seo.test.mjs` и `tests/make-icons.test.mjs`.

**Tech Stack:** HTML/CSS (без изменений логики), Node.js 24 (встроенные `node:test`, `node:zlib`), GitHub Pages, схема Schema.org JSON-LD.

**Spec:** `docs/superpowers/specs/2026-09-29-seo-geo-recommendations-design.md`

## Global Constraints

- **Без внешних зависимостей**: только стандартная библиотека Node.js; тесты — встроенный `node:test` (`import test from 'node:test'`), никаких npm-пакетов и `npm install`.
- **Без сборщика**: файлы отдаются как есть; JS/HTML не транспилируются.
- **Домен захардкожен**: `https://artkull.ru` (из `CNAME`). Все абсолютные URL — на него.
- **Не менять логику формы заявки, темы, мобильного меню и cookie-баннера.**
- Тексты интерфейса — на русском. Кодировка файлов — UTF-8. Переводы строк — как в соседних файлах (в репозитории CRLF/`LF` смешаны из-за `.gitattributes`-эффекта; не переформатировать целые файлы).
- **Стиль правок `index.html`**: файл использует табы, атрибуты разносятся по строкам как в соседних мета-тегах. Правки `privacy.html`: файл «плоский» (без отступов) — сохранять этот стиль.
- Коммиты — conventional commits (`feat:`, `test:`, `chore:`, `docs:`), как в истории репозитория.
- Команды запуска тестов: `node --test tests/make-icons.test.mjs` и `node --test tests/seo.test.mjs`.
- Проверка токенов (регресс): `node tools/check-tokens.mjs`.

---

## File Structure

**Создаются:**

- `tools/make-icons.mjs` — dependency-free генератор PNG (192/512/180) и ICO (16/32/48) из геометрии `favicon.svg`; чистые функции экспортируются для тестов.
- `tests/make-icons.test.mjs` — юнит-тесты генератора (`node:test`).
- `tests/seo.test.mjs` — проверка всех статических SEO-артефактов (`node:test`), растёт по задачам.
- `robots.txt`, `sitemap.xml`, `llms.txt`, `manifest.webmanifest`, `404.html` — в корне.
- `assets/icon-192.png`, `assets/icon-512.png`, `assets/apple-touch-icon.png`, `assets/favicon.ico` — сгенерированные иконки.

**Изменяются:**

- `index.html` — canonical, `meta robots`, OG/Twitter, JSON-LD, preload шрифтов, link-теги иконок/manifest, Title/Description.
- `privacy.html` — canonical, `noindex`, description, унификация ссылок, link-теги иконок/manifest.

**Не трогаются:** `css/*`, `js/*`, `yc/*`, `PRODUCT.md` (вне области спеки).

---

## Task 1: Генератор иконок (чистые функции)

**Files:**
- Create: `tools/make-icons.mjs`
- Test: `tests/make-icons.test.mjs`

**Interfaces:**
- Consumes: ничего.
- Produces (экспорт через `export`):
  - `inRoundRect(ux, uy, x, y, w, h, r): boolean`
  - `renderRGBA(size: number): Buffer` — RGBA-пиксели `size*size*4`.
  - `encodePNG(size: number, rgba: Buffer): Buffer`
  - `encodeICO(entries: { size: number, png: Buffer }[]): Buffer`
  - `main(): void` (запускается только при прямом вызове файла)

- [ ] **Step 1: Написать падающий тест**

Создать `tests/make-icons.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { inRoundRect, renderRGBA, encodePNG, encodeICO } from '../tools/make-icons.mjs'

test('inRoundRect: центр внутри, далёкий угол снаружи', () => {
  assert.ok(inRoundRect(32, 32, 0, 0, 64, 64, 14))
  assert.ok(!inRoundRect(1, 1, 0, 0, 64, 64, 14))
})

test('renderRGBA: размер буфера, центр синий, угол прозрачный', () => {
  const buf = renderRGBA(512)
  assert.equal(buf.length, 512 * 512 * 4)
  const center = (256 * 512 + 256) * 4
  assert.ok(buf[center] < 120, 'R центра < 120')
  assert.ok(buf[center + 1] > 90, 'G центра > 90')
  assert.ok(buf[center + 2] > 200, 'B центра > 200')
  assert.equal(buf[3], 0, 'левый верхний угол прозрачный')
})

test('encodePNG: сигнатура и IHDR-размеры', () => {
  const png = encodePNG(16, renderRGBA(16))
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.readUInt32BE(16), 16)
  assert.equal(png.readUInt32BE(20), 16)
  assert.equal(png[25], 6, 'color type RGBA')
})

test('encodeICO: три записи, первая 16x16', () => {
  const ico = encodeICO([
    { size: 16, png: encodePNG(16, renderRGBA(16)) },
    { size: 32, png: encodePNG(32, renderRGBA(32)) },
    { size: 48, png: encodePNG(48, renderRGBA(48)) }
  ])
  assert.equal(ico.readUInt16LE(2), 1, 'тип ICO')
  assert.equal(ico.readUInt16LE(4), 3, 'число записей')
  assert.equal(ico[6], 16, 'ширина первой записи')
  assert.equal(ico[7], 16, 'высота первой записи')
})
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test tests/make-icons.test.mjs`
Expected: FAIL — `Cannot find module '../tools/make-icons.mjs'`.

- [ ] **Step 3: Реализовать генератор**

Создать `tools/make-icons.mjs`:

```js
import { deflateSync, crc32 } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const SS = 4
const BG = [0xf4, 0xf5, 0xf7, 255]
const BLUE = [0x3b, 0x82, 0xf6, 255]
const INK = [0x1a, 0x1a, 0x2e, 255]

const CELLS = [
  { x: 8, y: 8, stroke: true },
  { x: 25, y: 8, stroke: false },
  { x: 42, y: 8, stroke: true },
  { x: 8, y: 25, stroke: false },
  { x: 25, y: 25, stroke: false },
  { x: 42, y: 25, stroke: false },
  { x: 8, y: 42, stroke: false },
  { x: 25, y: 42, stroke: true },
  { x: 42, y: 42, stroke: false }
]

export function inRoundRect(ux, uy, x, y, w, h, r) {
  if (ux < x || uy < y || ux > x + w || uy > y + h) return false
  const cx = Math.min(Math.max(ux, x + r), x + w - r)
  const cy = Math.min(Math.max(uy, y + r), y + h - r)
  const dx = ux - cx
  const dy = uy - cy
  return dx * dx + dy * dy <= r * r
}

function sampleColor(ux, uy) {
  if (!inRoundRect(ux, uy, 0, 0, 64, 64, 14)) return [0, 0, 0, 0]
  let col = BG
  for (const c of CELLS) {
    if (c.stroke) {
      if (
        inRoundRect(ux, uy, c.x - 1, c.y - 1, 16, 16, 5) &&
        !inRoundRect(ux, uy, c.x + 1, c.y + 1, 12, 12, 3)
      ) {
        col = INK
      }
    } else if (inRoundRect(ux, uy, c.x, c.y, 14, 14, 4)) {
      col = BLUE
    }
  }
  return col
}

export function renderRGBA(size) {
  const scale = size / 64
  const out = Buffer.alloc(size * size * 4)
  const total = SS * SS
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (px + (sx + 0.5) / SS) / scale
          const uy = (py + (sy + 0.5) / SS) / scale
          const c = sampleColor(ux, uy)
          r += c[0] * c[3]
          g += c[1] * c[3]
          b += c[2] * c[3]
          a += c[3]
        }
      }
      const i = (py * size + px) * 4
      if (a === 0) {
        out[i] = 0
        out[i + 1] = 0
        out[i + 2] = 0
        out[i + 3] = 0
      } else {
        out[i] = Math.round(r / a)
        out[i + 1] = Math.round(g / a)
        out[i + 2] = Math.round(b / a)
        out[i + 3] = Math.round(a / total)
      }
    }
  }
  return out
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

export function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

export function encodeICO(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = 6 + dir.length
  const blobs = []
  entries.forEach((e, i) => {
    const b = i * 16
    dir[b] = e.size >= 256 ? 0 : e.size
    dir[b + 1] = e.size >= 256 ? 0 : e.size
    dir.writeUInt16LE(1, b + 4)
    dir.writeUInt16LE(32, b + 6)
    dir.writeUInt32LE(e.png.length, b + 8)
    dir.writeUInt32LE(offset, b + 12)
    offset += e.png.length
    blobs.push(e.png)
  })
  return Buffer.concat([header, dir, ...blobs])
}

function png(size) {
  return encodePNG(size, renderRGBA(size))
}

export function main() {
  const out = new URL('../assets/', import.meta.url)
  writeFileSync(new URL('icon-192.png', out), png(192))
  writeFileSync(new URL('icon-512.png', out), png(512))
  writeFileSync(new URL('apple-touch-icon.png', out), png(180))
  writeFileSync(
    new URL('favicon.ico', out),
    encodeICO([
      { size: 16, png: png(16) },
      { size: 32, png: png(32) },
      { size: 48, png: png(48) }
    ])
  )
  console.log('icons written: icon-192.png, icon-512.png, apple-touch-icon.png, favicon.ico')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
```

- [ ] **Step 4: Убедиться, что тест проходит**

Run: `node --test tests/make-icons.test.mjs`
Expected: PASS — 4 теста, 4 pass, 0 fail.

- [ ] **Step 5: Коммит**

```powershell
git add tools/make-icons.mjs tests/make-icons.test.mjs
git commit -m "feat(seo): add dependency-free icon generator with tests"
```

---

## Task 2: Сгенерировать и закоммитить иконки

**Files:**
- Create: `assets/icon-192.png`, `assets/icon-512.png`, `assets/apple-touch-icon.png`, `assets/favicon.ico`

- [ ] **Step 1: Запустить генератор**

Run: `node tools/make-icons.mjs`
Expected: `icons written: icon-192.png, icon-512.png, apple-touch-icon.png, favicon.ico`

- [ ] **Step 2: Проверить размеры и типы**

Run:
```powershell
node -e "const fs=require('node:fs');const p=fs.readFileSync('assets/icon-192.png');console.log('png192', p.readUInt32BE(16), p.readUInt32BE(20));const i=fs.readFileSync('assets/favicon.ico');console.log('ico', i.readUInt16LE(4), i[6]+'x'+i[7]);"
```
Expected: `png192 192 192` и `ico 3 16x16`.

- [ ] **Step 3: Визуальная проверка**

Открыть в браузере `assets/icon-512.png` и `assets/favicon.ico`. Ожидание: светлый квадрат со скруглением, синие квадраты 3×3, три ячейки — контурные. Фон вне скругления прозрачный.

- [ ] **Step 4: Коммит**

```powershell
git add assets/icon-192.png assets/icon-512.png assets/apple-touch-icon.png assets/favicon.ico
git commit -m "chore(seo): add generated favicon, apple-touch and manifest icons"
```

---

## Task 3: `robots.txt`, `sitemap.xml` и каркас SEO-теста

**Files:**
- Create: `tests/seo.test.mjs`
- Create: `robots.txt`
- Create: `sitemap.xml`

**Interfaces:**
- Produces (общие помощники теста, используются всеми последующими задачами):
  - `read(p: string): string` — UTF-8 содержимое пути относительно корня репозитория.
  - `exists(p: string): boolean`
  - `indexHtml(): string`, `privacyHtml(): string`

- [ ] **Step 1: Написать падающий тест**

Создать `tests/seo.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const exists = (p) => existsSync(new URL('../' + p, import.meta.url))
const indexHtml = () => read('index.html')
const privacyHtml = () => read('privacy.html')

test('robots.txt: разрешает всё, закрывает privacy, указывает sitemap', () => {
  const t = read('robots.txt')
  assert.match(t, /User-agent:\s*\*/)
  assert.match(t, /Allow:\s*\//)
  assert.match(t, /Disallow:\s*\/privacy\*/)
  assert.match(t, /Sitemap:\s*https:\/\/artkull\.ru\/sitemap\.xml/)
})

test('sitemap.xml: только главная, абсолютный loc, корректный lastmod', () => {
  const t = read('sitemap.xml')
  assert.match(t, /<urlset[^>]*sitemaps\.org/)
  assert.match(t, /<loc>https:\/\/artkull\.ru\/<\/loc>/)
  assert.equal((t.match(/<loc>/g) || []).length, 1, 'в карте ровно одна страница')
  assert.match(t, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
})
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test tests/seo.test.mjs`
Expected: FAIL — `ENOENT` на `robots.txt`.

- [ ] **Step 3: Создать `robots.txt`**

Создать `robots.txt` в корне:

```
User-agent: *
Allow: /
Disallow: /privacy*
Sitemap: https://artkull.ru/sitemap.xml
```

- [ ] **Step 4: Создать `sitemap.xml`**

Создать `sitemap.xml` в корне (дату `lastmod` подставить фактической датой коммита):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://artkull.ru/</loc>
    <lastmod>2026-09-29</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 5: Убедиться, что тест проходит**

Run: `node --test tests/seo.test.mjs`
Expected: PASS — 2 теста.

- [ ] **Step 6: Коммит**

```powershell
git add tests/seo.test.mjs robots.txt sitemap.xml
git commit -m "feat(seo): add robots.txt and sitemap.xml with checker test"
```

---

## Task 4: `llms.txt`

**Files:**
- Create: `llms.txt`
- Modify: `tests/seo.test.mjs` (добавить тест в конец)

- [ ] **Step 1: Дописать падающий тест**

Добавить в конец `tests/seo.test.mjs`:

```js
test('llms.txt: услуги, цены и контакты', () => {
  const t = read('llms.txt')
  for (const s of [
    'ArtKull',
    '5 000',
    '15 000',
    '35 000',
    'artkull@gmail.com',
    '+7 922 269-84-46',
    'Тюмень'
  ]) {
    assert.ok(t.includes(s), `llms.txt должен содержать «${s}»`)
  }
})
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test tests/seo.test.mjs`
Expected: FAIL — `ENOENT` на `llms.txt` (2 предыдущих теста pass).

- [ ] **Step 3: Создать `llms.txt`**

Создать `llms.txt` в корне:

```markdown
# ArtKull

> ArtKull — разработка сайтов под ключ. Один разработчик (Артём Кульчинский),
> без агентских наценок. Работа удалённо по всей России из Тюмени.

## Услуги и цены

- Сайт-визитка / Лендинг — от 5 000 ₽, срок от 5 дней. Персональный дизайн,
  HTML/CSS/JavaScript, SEO-оптимизация, адаптив, форма обратной связи.
- Сайт компании — от 15 000 ₽, срок от 10 дней. Многостраничная структура, CMS
  на выбор, каталог услуг, интеграция с CRM/почтой, аналитика.
- Интернет-магазин / Каталог — от 35 000 ₽, срок от 14 дней. Каталог с
  фильтрами, корзина, оплата, личный кабинет, интеграция со складом/1С.

## Гео

Тюмень, дистанционно по всей России.

## Контакты

- Телефон: +7 922 269-84-46
- E-mail: artkull@gmail.com
- Telegram: https://t.me/ArtKull
- GitHub: https://github.com/ArtKull
- VK: https://vk.ru/kulchinsky

## Ссылки

- Главная: https://artkull.ru/
- Политика обработки персональных данных: https://artkull.ru/privacy.html
```

- [ ] **Step 4: Убедиться, что тест проходит**

Run: `node --test tests/seo.test.mjs`
Expected: PASS — 3 теста.

- [ ] **Step 5: Коммит**

```powershell
git add llms.txt tests/seo.test.mjs
git commit -m "feat(seo): add llms.txt for generative engine optimization"
```

---

## Task 5: `manifest.webmanifest`

**Files:**
- Create: `manifest.webmanifest`
- Modify: `tests/seo.test.mjs` (добавить тесты в конец)

- [ ] **Step 1: Дописать падающий тест**

Добавить в конец `tests/seo.test.mjs`:

```js
test('manifest.webmanifest: валидный JSON с иконками 192/512', () => {
  const m = JSON.parse(read('manifest.webmanifest'))
  assert.equal(m.name, 'ArtKull')
  assert.equal(m.start_url, '/')
  const sizes = m.icons.map((i) => i.sizes)
  assert.ok(sizes.includes('192x192'))
  assert.ok(sizes.includes('512x512'))
})

test('растровые иконки существуют', () => {
  for (const f of [
    'assets/favicon.ico',
    'assets/apple-touch-icon.png',
    'assets/icon-192.png',
    'assets/icon-512.png'
  ]) {
    assert.ok(exists(f), `${f} отсутствует`)
  }
})
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test tests/seo.test.mjs`
Expected: FAIL — `ENOENT` на `manifest.webmanifest` (тест иконок при этом pass, т.к. Task 2 выполнен).

- [ ] **Step 3: Создать `manifest.webmanifest`**

Создать `manifest.webmanifest` в корне:

```json
{
  "name": "ArtKull",
  "short_name": "ArtKull",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F0F4F8",
  "theme_color": "#0A0E27",
  "icons": [
    { "src": "/assets/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 4: Убедиться, что тест проходит**

Run: `node --test tests/seo.test.mjs`
Expected: PASS — 5 тестов.

- [ ] **Step 5: Коммит**

```powershell
git add manifest.webmanifest tests/seo.test.mjs
git commit -m "feat(seo): add web app manifest"
```

---

## Task 6: `index.html` — canonical, robots, OG/Twitter, preload, иконки, Title/Description

**Files:**
- Modify: `index.html`
- Modify: `tests/seo.test.mjs` (добавить тесты в конец)

- [ ] **Step 1: Дописать падающие тесты**

Добавить в конец `tests/seo.test.mjs`:

```js
test('index.html: canonical, robots, og:url, абсолютный og:image', () => {
  const h = indexHtml()
  assert.match(h, /<link rel="canonical" href="https:\/\/artkull\.ru\/" \/>/)
  assert.match(h, /<meta name="robots" content="index, follow" \/>/)
  assert.match(h, /<meta property="og:url" content="https:\/\/artkull\.ru\/" \/>/)
  assert.match(
    h,
    /<meta property="og:image" content="https:\/\/artkull\.ru\/assets\/og-image\.png" \/>/
  )
})

test('index.html: preload кириллицы и латиницы Inter с crossorigin', () => {
  const h = indexHtml()
  assert.match(h, /rel="preload"[\s\S]*?inter-cyrillic\.woff2/)
  assert.match(h, /rel="preload"[\s\S]*?inter-latin\.woff2/)
  assert.match(h, /rel="preload"[^>]*crossorigin/)
})

test('index.html: ссылки на иконки и manifest', () => {
  const h = indexHtml()
  assert.match(h, /rel="apple-touch-icon" href="assets\/apple-touch-icon\.png"/)
  assert.match(h, /rel="manifest" href="\/manifest\.webmanifest"/)
  assert.match(h, /rel="icon" href="\/favicon\.ico" sizes="any"/)
})

test('index.html: новый Title и Description с гео, сроком и ценой', () => {
  const h = indexHtml()
  assert.match(h, /<title>Разработка сайтов под ключ по всей России — ArtKull<\/title>/)
  assert.match(h, /по всей России/)
  assert.match(h, /от 5 000 ₽/)
})
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `node --test tests/seo.test.mjs`
Expected: FAIL на 4 новых тестах (первые 5 pass).

- [ ] **Step 3: Заменить Title и Description**

В `index.html` заменить строку 6:

```html
		<title>ArtKull — сайты под ключ. Быстро. Чисто. Без переплат.</title>
```

на:

```html
		<title>Разработка сайтов под ключ по всей России — ArtKull</title>
```

Заменить блок description (строки 7–10):

```html
		<meta
			name="description"
			content="Разработка и запуск сайтов для бизнеса: от лендинга до каталога. Один разработчик, полная ответственность, без агентских наценок."
		/>
```

на:

```html
		<meta
			name="description"
			content="Разработка сайтов под ключ по всей России: лендинг от 5 000 ₽ за 5 дней, сайт компании за 10 дней, интернет-магазин. Один разработчик, без агентских наценок."
		/>
```

- [ ] **Step 4: Добавить canonical и meta robots**

После строки с `<meta name="viewport" ... />` (строка 5) добавить:

```html
		<link rel="canonical" href="https://artkull.ru/" />
		<meta name="robots" content="index, follow" />
```

- [ ] **Step 5: Обновить OG/Twitter-блок**

Заменить:

```html
		<meta property="og:image" content="assets/og-image.png" />
```

на:

```html
		<meta property="og:image" content="https://artkull.ru/assets/og-image.png" />
```

После `<meta property="og:type" content="website" />` добавить:

```html
		<meta property="og:url" content="https://artkull.ru/" />
		<meta property="og:site_name" content="ArtKull" />
```

После `<meta name="twitter:card" content="summary_large_image" />` добавить:

```html
		<meta name="twitter:image" content="https://artkull.ru/assets/og-image.png" />
```

- [ ] **Step 6: Добавить preload шрифтов и link-теги иконок/manifest**

Заменить строку 37:

```html
		<link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
```

на:

```html
		<link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
		<link rel="icon" href="/favicon.ico" sizes="any" />
		<link rel="apple-touch-icon" href="assets/apple-touch-icon.png" />
		<link rel="manifest" href="/manifest.webmanifest" />
		<link
			rel="preload"
			href="assets/fonts/inter-cyrillic.woff2"
			as="font"
			type="font/woff2"
			crossorigin
		/>
		<link
			rel="preload"
			href="assets/fonts/inter-latin.woff2"
			as="font"
			type="font/woff2"
			crossorigin
		/>
```

- [ ] **Step 7: Убедиться, что тесты проходят**

Run: `node --test tests/seo.test.mjs`
Expected: PASS — 9 тестов.

- [ ] **Step 8: Коммит**

```powershell
git add index.html tests/seo.test.mjs
git commit -m "feat(seo): add canonical, robots, OG, font preload and icons to homepage"
```

---

## Task 7: `index.html` — JSON-LD Schema.org

**Files:**
- Modify: `index.html`
- Modify: `tests/seo.test.mjs` (добавить тест в конец)

- [ ] **Step 1: Дописать падающий тест**

Добавить в конец `tests/seo.test.mjs`:

```js
test('index.html: JSON-LD с ProfessionalService, Person и тремя Service', () => {
  const h = indexHtml()
  const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  assert.ok(m, 'JSON-LD блок не найден')
  const data = JSON.parse(m[1])
  const nodes = data['@graph']
  const types = nodes.map((n) => n['@type'])
  assert.ok(types.includes('ProfessionalService'))
  assert.ok(types.includes('Person'))
  assert.equal(types.filter((t) => t === 'Service').length, 3)

  const biz = nodes.find((n) => n['@type'] === 'ProfessionalService')
  assert.equal(biz.name, 'ArtKull')
  assert.equal(biz.address.addressLocality, 'Тюмень')
  assert.equal(biz.address.streetAddress, undefined, 'адрес квартиры не публикуется')
  assert.equal(biz.areaServed.name, 'Россия')

  const prices = nodes
    .filter((n) => n['@type'] === 'Service')
    .map((s) => s.offers.price)
  assert.deepEqual(prices.sort(), ['15000', '35000', '5000'])
})
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test tests/seo.test.mjs`
Expected: FAIL — `JSON-LD блок не найден`.

- [ ] **Step 3: Вставить JSON-LD**

В `index.html` после добавленных в Task 6 link-тегов иконок/preload, перед `<script>` с темой (после закрывающего `/>` последнего preload), вставить блок (отступ — табы):

```html
		<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@graph": [
					{
						"@type": "ProfessionalService",
						"@id": "https://artkull.ru/#business",
						"name": "ArtKull",
						"url": "https://artkull.ru/",
						"logo": "https://artkull.ru/assets/logo.svg",
						"image": "https://artkull.ru/assets/og-image.png",
						"description": "Разработка и запуск сайтов для бизнеса: от лендинга до каталога. Один разработчик, полная ответственность, без агентских наценок.",
						"telephone": "+79222698446",
						"email": "artkull@gmail.com",
						"address": {
							"@type": "PostalAddress",
							"addressLocality": "Тюмень",
							"addressCountry": "RU"
						},
						"areaServed": { "@type": "Country", "name": "Россия" },
						"sameAs": [
							"https://github.com/ArtKull",
							"https://vk.ru/kulchinsky",
							"https://t.me/ArtKull"
						],
						"founder": { "@id": "https://artkull.ru/#person" },
						"makesOffer": [
							{
								"@type": "Offer",
								"itemOffered": { "@type": "Service", "name": "Сайт-визитка / Лендинг" },
								"price": "5000",
								"priceCurrency": "RUB"
							},
							{
								"@type": "Offer",
								"itemOffered": { "@type": "Service", "name": "Сайт компании" },
								"price": "15000",
								"priceCurrency": "RUB"
							},
							{
								"@type": "Offer",
								"itemOffered": { "@type": "Service", "name": "Интернет-магазин / Каталог" },
								"price": "35000",
								"priceCurrency": "RUB"
							}
						]
					},
					{
						"@type": "Person",
						"@id": "https://artkull.ru/#person",
						"name": "Артём Кульчинский",
						"jobTitle": "Веб-разработчик",
						"url": "https://artkull.ru/",
						"knowsAbout": [
							"HTML",
							"CSS",
							"JavaScript",
							"Python",
							"React",
							"FastAPI",
							"SEO",
							"Figma"
						],
						"sameAs": [
							"https://github.com/ArtKull",
							"https://vk.ru/kulchinsky",
							"https://t.me/ArtKull"
						],
						"worksFor": { "@id": "https://artkull.ru/#business" }
					},
					{
						"@type": "Service",
						"@id": "https://artkull.ru/#service-landing",
						"name": "Сайт-визитка / Лендинг",
						"provider": { "@id": "https://artkull.ru/#business" },
						"areaServed": { "@type": "Country", "name": "Россия" },
						"offers": {
							"@type": "Offer",
							"price": "5000",
							"priceCurrency": "RUB",
							"availability": "https://schema.org/InStock"
						}
					},
					{
						"@type": "Service",
						"@id": "https://artkull.ru/#service-company",
						"name": "Сайт компании",
						"provider": { "@id": "https://artkull.ru/#business" },
						"areaServed": { "@type": "Country", "name": "Россия" },
						"offers": {
							"@type": "Offer",
							"price": "15000",
							"priceCurrency": "RUB",
							"availability": "https://schema.org/InStock"
						}
					},
					{
						"@type": "Service",
						"@id": "https://artkull.ru/#service-shop",
						"name": "Интернет-магазин / Каталог",
						"provider": { "@id": "https://artkull.ru/#business" },
						"areaServed": { "@type": "Country", "name": "Россия" },
						"offers": {
							"@type": "Offer",
							"price": "35000",
							"priceCurrency": "RUB",
							"availability": "https://schema.org/InStock"
						}
					}
				]
			}
		</script>
```

- [ ] **Step 4: Убедиться, что тест проходит**

Run: `node --test tests/seo.test.mjs`
Expected: PASS — 10 тестов.

- [ ] **Step 5: Валидировать разметку вручную**

Открыть `index.html` локально, скопировать содержимое `application/ld+json` и вставить в `https://validator.schema.org/` (или Rich Results Test). Ожидание: 0 ошибок; распознаны `ProfessionalService`, `Person`, `Service`.

- [ ] **Step 6: Коммит**

```powershell
git add index.html tests/seo.test.mjs
git commit -m "feat(seo): add Schema.org JSON-LD (business, person, services)"
```

---

## Task 8: `privacy.html` — noindex, canonical, description, унификация ссылок

**Files:**
- Modify: `privacy.html`
- Modify: `tests/seo.test.mjs` (добавить тест в конец)

- [ ] **Step 1: Дописать падающий тест**

Добавить в конец `tests/seo.test.mjs`:

```js
test('privacy.html: noindex, canonical, description и унифицированные ссылки', () => {
  const h = privacyHtml()
  assert.match(h, /<meta name="robots" content="noindex, follow">/)
  assert.match(
    h,
    /<link rel="canonical" href="https:\/\/artkull\.ru\/privacy\.html">/
  )
  assert.match(h, /<meta name="description"/)
  assert.match(h, /href="https:\/\/artkull\.ru\/privacy\.html"/)
  assert.doesNotMatch(h, /https:\/\/artkull\.ru\/privacy"/, 'ссылка без .html не остаётся')
})

test('privacy.html: ссылки на иконки и manifest', () => {
  const h = privacyHtml()
  assert.match(h, /rel="apple-touch-icon" href="assets\/apple-touch-icon\.png"/)
  assert.match(h, /rel="manifest" href="\/manifest\.webmanifest"/)
  assert.match(h, /rel="icon" href="\/favicon\.ico" sizes="any"/)
})
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `node --test tests/seo.test.mjs`
Expected: FAIL на 2 новых тестах (предыдущие 10 pass).

- [ ] **Step 3: Добавить canonical, robots и description**

В `privacy.html` после строки 5 (`<meta name="viewport" content="width=device-width, initial-scale=1">`) добавить:

```html
<link rel="canonical" href="https://artkull.ru/privacy.html">
<meta name="robots" content="noindex, follow">
<meta name="description" content="Политика обработки персональных данных оператора Кульчинский Артём Иванович (ArtKull): цели, состав, сроки обработки и защиты данных, права субъекта.">
```

- [ ] **Step 4: Добавить link-теги иконок и manifest**

Заменить строку 9:

```html
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
```

на:

```html
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
```

- [ ] **Step 5: Унифицировать ссылки**

Заменить строку 35:

```html
    <a class="brand" href="index.html" aria-label="ArtKull — на главную">
```

на:

```html
    <a class="brand" href="/" aria-label="ArtKull — на главную">
```

Заменить строку 157:

```html
<p>Актуальная редакция Политики публикуется на сайте <a href="https://artkull.ru/privacy">https://artkull.ru/privacy</a> и действует до ее замены новой редакцией.</p>
```

на:

```html
<p>Актуальная редакция Политики публикуется на сайте <a href="https://artkull.ru/privacy.html">https://artkull.ru/privacy.html</a> и действует до ее замены новой редакцией.</p>
```

- [ ] **Step 6: Убедиться, что тесты проходят**

Run: `node --test tests/seo.test.mjs`
Expected: PASS — 12 тестов.

- [ ] **Step 7: Коммит**

```powershell
git add privacy.html tests/seo.test.mjs
git commit -m "feat(seo): noindex privacy page and unify policy links"
```

---

## Task 9: Брендированная `404.html`

**Files:**
- Create: `404.html`
- Modify: `tests/seo.test.mjs` (добавить тест в конец)

- [ ] **Step 1: Дописать падающий тест**

Добавить в конец `tests/seo.test.mjs`:

```js
test('404.html: брендированная страница с абсолютными путями и ссылкой на главную', () => {
  const h = read('404.html')
  assert.match(h, /<html lang="ru">/)
  assert.match(h, /<title>404 — страница не найдена — ArtKull<\/title>/)
  assert.match(h, /href="\/css\/base\.css"/)
  assert.match(h, /href="\/css\/components\.css"/)
  assert.match(h, /<a class="btn btn--primary" href="\/">/)
})
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test tests/seo.test.mjs`
Expected: FAIL — `ENOENT` на `404.html`.

- [ ] **Step 3: Создать `404.html`**

Создать `404.html` в корне (все пути к ресурсам — абсолютные):

```html
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 — страница не найдена — ArtKull</title>
<meta name="robots" content="noindex, follow">
<meta name="theme-color" content="#F0F4F8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0A0E27" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/css/fonts.css">
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/components.css">
<script>
  (function () {
    var theme = null;
    try { theme = localStorage.getItem('artkull-theme'); } catch (e) { theme = null; }
    if (theme !== 'light' && theme !== 'dark') {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('js');
    document.addEventListener('DOMContentLoaded', function () {
      if (!window.__artkullReady) {
        document.documentElement.classList.remove('js');
      }
    });
  })();
</script>
</head>
<body>
<header class="site-header">
  <div class="container site-header__inner">
    <a class="brand" href="/" aria-label="ArtKull — на главную">
      <svg class="brand__sign" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="8" y="8" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
        <rect x="25" y="8" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="42" y="8" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
        <rect x="8" y="25" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="25" y="25" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="42" y="25" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="8" y="42" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="25" y="42" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
        <rect x="42" y="42" width="14" height="14" rx="4" fill="#3b82f6"/>
      </svg>
      <span class="brand__name">Art<span class="brand__mark">Kull</span></span>
    </a>
    <div class="site-header__actions">
      <button class="theme-toggle" type="button" aria-label="Переключить тему" aria-pressed="false">
        <svg class="icon theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        <svg class="icon theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </div>
  </div>
</header>
<main>
  <section class="section">
    <div class="container">
      <h1>404 — страница не найдена</h1>
      <p>Возможно, ссылка устарела или страница была удалена.</p>
      <p><a class="btn btn--primary" href="/">На главную</a></p>
    </div>
  </section>
</main>
<script src="/js/app.js" defer></script>
</body>
</html>
```

- [ ] **Step 4: Убедиться, что тест проходит**

Run: `node --test tests/seo.test.mjs`
Expected: PASS — 13 тестов.

- [ ] **Step 5: Проверить локально**

Запустить локальный сервер из корня (`python -m http.server 8080`), открыть `http://localhost:8080/404.html`. Проверить: тема светлая/тёмная переключается, шрифты и стили подгружаются, кнопка «На главную» ведёт на `/`, в консоли нет ошибок.

- [ ] **Step 6: Коммит**

```powershell
git add 404.html tests/seo.test.mjs
git commit -m "feat(seo): add branded 404 page"
```

---

## Task 10: Финальная проверка и деплой

**Files:**
- Не изменяются (проверка).

- [ ] **Step 1: Полный прогон тестов**

Run:
```powershell
node --test tests/make-icons.test.mjs tests/seo.test.mjs
```
Expected: PASS — 4 + 13 = 17 тестов, 0 fail.

- [ ] **Step 2: Регресс токенов и логики согласия**

Run:
```powershell
node tools/check-tokens.mjs
node --test tests/consent.test.js tests/consent-gating.test.js
```
Expected: `check-tokens` без ошибок; consent-тесты pass.

- [ ] **Step 3: Проверить все артефакты локально**

Run:
```powershell
python -m http.server 8080
```
(в отдельном терминале, из корня репозитория) затем:

```powershell
curl -I http://localhost:8080/robots.txt
curl -I http://localhost:8080/sitemap.xml
curl -I http://localhost:8080/llms.txt
curl -I http://localhost:8080/manifest.webmanifest
curl -I http://localhost:8080/assets/favicon.ico
```
Expected: все `200 OK`.

- [ ] **Step 4: Проверить OG-превью и JSON-LD**

Открыть `http://localhost:8080/`, скопировать `application/ld+json` в `https://validator.schema.org/` (0 ошибок). Открыть `https://artkull.ru/assets/og-image.png` в браузере — 200, картинка 1200×630.

- [ ] **Step 5: Задеплоить (git push) и проверить на живом сайте**

```powershell
git push origin main
```

Подождать обновления GitHub Pages, затем:

```powershell
curl -I https://artkull.ru/robots.txt
curl -I https://artkull.ru/sitemap.xml
curl -I https://artkull.ru/assets/og-image.png
curl -I https://artkull.ru/nonexistent-page
```
Expected: первый три — `200`; последний — `404` (отдаёт кастомную `404.html`; проверить в браузере содержимое). Если `/robots.txt` ещё 404 — подождать сборку Pages/кэш CDN и повторить.

- [ ] **Step 6: Обновить статус в аудите**

Отметить статусы задач в `docs/seo/2026-09-28-seo-geo-audit.md` (раздел 6) выполненными и закоммитить:

```powershell
git add docs/seo/2026-09-28-seo-geo-audit.md
git commit -m "docs(seo): mark completed in-progress items in audit"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- §4 robots.txt → Task 3. §5 sitemap.xml → Task 3. §6 canonical/robots/ссылки → Tasks 6, 8.
- §7 OG/Twitter → Task 6. §8 Schema.org → Task 7. §9 preload → Task 6.
- §10 favicon/manifest → Tasks 1, 2, 5, 6, 8. §11 404 → Task 9. §12 llms.txt → Task 4.
- §13 Title/Description → Task 6. §14 проверка → Task 10. §15 файлы → все задачи.
- §16 риски (MIME manifest, абсолютные пути 404, `/privacy` дубль) → учтены в проверках Tasks 9, 10.

**Placeholder scan:** TODO/TBD нет; весь код и команды приведены целиком.
**Type consistency:** имена экспортов (`inRoundRect`, `renderRGBA`, `encodePNG`, `encodeICO`, `main`) совпадают в Task 1 и его тестах; URL/цены/контакты совпадают между Tasks 4, 6, 7.
