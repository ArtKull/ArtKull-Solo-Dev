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
