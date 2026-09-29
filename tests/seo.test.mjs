import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (p) =>
  readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/^\uFEFF/, '')
const exists = (p) => existsSync(new URL('../' + p, import.meta.url))
const indexHtml = () => read('index.html')
const privacyHtml = () => read('privacy.html')

test('robots.txt: разрешает всё, закрывает privacy, указывает sitemap', () => {
  const t = read('robots.txt')
  assert.match(t, /User-agent:\s*\*/)
  assert.match(t, /Allow:\s*\//)
  assert.match(t, /Disallow:\s*\/privacy\*/)
  assert.doesNotMatch(t, /Disallow:\s*\/\s*$/m, 'блокировки всего сайта нет')
  assert.doesNotMatch(t, /Disallow:\s*\/[^\s]*(css|js|assets)/i, 'ассеты не закрыты')
  assert.match(t, /Sitemap:\s*https:\/\/artkull\.ru\/sitemap\.xml/)
})

test('sitemap.xml: только главная, абсолютный loc, корректный lastmod', () => {
  const t = read('sitemap.xml')
  assert.match(t, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/)
  assert.match(t, /<loc>https:\/\/artkull\.ru\/<\/loc>/)
  assert.equal((t.match(/<loc>/g) || []).length, 1, 'в карте ровно одна страница')
  assert.match(t, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
})

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
  assert.match(t, /^# ArtKull/m)
  assert.match(t, /^> /m)
  const h = indexHtml()
  for (const s of ['+79222698446', 'artkull@gmail.com']) {
    assert.ok(h.includes(s), `index.html должен содержать «${s}»`)
  }
})

test('manifest.webmanifest: валидный JSON с иконками 192/512', () => {
  const m = JSON.parse(read('manifest.webmanifest'))
  assert.equal(m.name, 'ArtKull')
  assert.equal(m.start_url, '/')
  assert.equal(m.display, 'standalone')
  assert.equal(m.lang, 'ru')
  assert.equal(m.theme_color, '#0A0E27')
  const sizes = m.icons.map((i) => i.sizes)
  assert.ok(sizes.includes('192x192'))
  assert.ok(sizes.includes('512x512'))
  for (const icon of m.icons) {
    assert.ok(
      exists(icon.src.replace(/^\//, '')),
      `иконка ${icon.src} не существует`
    )
  }
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

test('index.html: canonical, robots, og:url, абсолютный og:image', () => {
  const h = indexHtml().replace(/\s+/g, ' ')
  assert.match(h, /<link rel="canonical" href="https:\/\/artkull\.ru\/" \/>/)
  assert.match(h, /<meta name="robots" content="index, follow" \/>/)
  assert.match(h, /<meta property="og:url" content="https:\/\/artkull\.ru\/" \/>/)
  assert.match(
    h,
    /<meta property="og:image" content="https:\/\/artkull\.ru\/assets\/og-image\.png" \/>/
  )
})

test('index.html: preload кириллицы и латиницы Inter с crossorigin', () => {
  const h = indexHtml().replace(/\s+/g, ' ')
  for (const font of ['inter-cyrillic.woff2', 'inter-latin.woff2']) {
    assert.match(
      h,
      new RegExp(
        `<link rel="preload" href="assets/fonts/${font.replace('.', '\\.')}" as="font" type="font/woff2" crossorigin \\/>`
      )
    )
  }
})

test('index.html: ссылки на иконки и manifest', () => {
  const h = indexHtml().replace(/\s+/g, ' ')
  assert.match(h, /rel="apple-touch-icon" href="\/assets\/apple-touch-icon\.png"/)
  assert.match(h, /rel="manifest" href="\/manifest\.webmanifest"/)
  assert.match(h, /rel="icon" href="\/assets\/favicon\.ico" sizes="any"/)
})

test('index.html: новый Title и Description с гео, сроком и ценой', () => {
  const h = indexHtml()
  assert.match(h, /<title>Разработка сайтов под ключ по всей России — ArtKull<\/title>/)
  assert.match(h, /по всей России/)
  assert.match(h, /от 5 000 ₽/)
})

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

test('privacy.html: noindex, canonical, description и унифицированные ссылки', () => {
  const h = privacyHtml()
  assert.match(h, /<meta name="robots" content="noindex, follow">/)
  assert.match(
    h,
    /<link rel="canonical" href="https:\/\/artkull\.ru\/privacy\.html">/
  )
  assert.match(h, /<meta name="description"/)
  assert.match(h, /href="https:\/\/artkull\.ru\/privacy\.html"/)
  assert.doesNotMatch(h, /href="[^"]*\/privacy(?!\.html)"/, 'ссылка без .html не остаётся')
})

test('privacy.html: ссылки на иконки и manifest', () => {
  const h = privacyHtml().replace(/\s+/g, ' ')
  assert.match(h, /rel="apple-touch-icon" href="\/assets\/apple-touch-icon\.png"/)
  assert.match(h, /rel="manifest" href="\/manifest\.webmanifest"/)
  assert.match(h, /rel="icon" href="\/assets\/favicon\.ico" sizes="any"/)
})
