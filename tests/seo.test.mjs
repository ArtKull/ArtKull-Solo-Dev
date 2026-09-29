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
