'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'js', 'consent.js'), 'utf8')

function makeStorage(initial) {
  const map = new Map(Object.entries(initial || {}))
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null },
    setItem(key, value) { map.set(key, String(value)) },
    removeItem(key) { map.delete(key) }
  }
}

function makeElement(attrs) {
  const listeners = {}
  return {
    hidden: true,
    getAttribute(name) { return attrs && name in attrs ? attrs[name] : null },
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn) },
    dispatch(type) { (listeners[type] || []).forEach((fn) => fn({ currentTarget: this })) }
  }
}

function grantedRecord() {
  return JSON.stringify({ v: 1, value: 'granted', ts: '2026-09-28T12:00:00.000Z' })
}

function deniedRecord() {
  return JSON.stringify({ v: 1, value: 'denied', ts: '2026-09-28T12:00:00.000Z' })
}

function bootstrap(stored) {
  const buttons = [
    makeElement({ 'data-consent': 'granted' }),
    makeElement({ 'data-consent': 'denied' })
  ]
  const settings = makeElement({ 'data-consent-settings': '' })
  const banner = makeElement({})
  banner.querySelectorAll = (sel) => (sel === '[data-consent]' ? buttons : [])

  const storage = makeStorage(stored ? { 'artkull-consent': stored } : {})
  const ymCalls = []
  const reloads = []
  const cookieWrites = []
  let cookieValue = '_ym_uid=1; _ym_d=2; other=3'

  const document = {
    readyState: 'complete',
    scripts: [],
    get cookie() { return cookieValue },
    set cookie(value) { cookieWrites.push(value); cookieValue = value },
    getElementById(id) { return id === 'cookie-banner' ? banner : null },
    querySelector(sel) { return sel === '[data-consent-settings]' ? settings : null },
    querySelectorAll() { return [] },
    createElement() { return { async: 0, src: '' } },
    getElementsByTagName() { return [{ parentNode: { insertBefore() {} } }] },
    addEventListener() {}
  }

  const location = {
    href: 'https://artkull.ru/',
    hostname: 'artkull.ru',
    reload() { reloads.push(Date.now()) }
  }

  const window = { localStorage: storage, location }
  window.ym = function () { ymCalls.push(Array.prototype.slice.call(arguments)) }

  const sandbox = { window, document, location, console }
  sandbox.globalThis = sandbox
  vm.createContext(sandbox)
  vm.runInContext(SOURCE, sandbox, { filename: 'js/consent.js' })

  return { window, banner, buttons, settings, storage, ymCalls, reloads, cookieWrites, document, location }
}

test('без записи: баннер показан, Метрика не загружена', () => {
  const env = bootstrap(null)
  assert.equal(env.ymCalls.length, 0)
  assert.equal(env.window.__artkullMetrikaLoaded, undefined)
  assert.equal(env.banner.hidden, false)
})

test('granted: Метрика грузится без webvisor, баннер скрыт', () => {
  const env = bootstrap(grantedRecord())
  assert.equal(env.ymCalls.length, 1)
  assert.equal(env.ymCalls[0][0], 113122431)
  assert.equal(env.ymCalls[0][1], 'init')
  assert.equal('webvisor' in env.ymCalls[0][2], false)
  assert.equal(env.banner.hidden, true)
  assert.equal(env.window.__artkullMetrikaLoaded, true)
})

test('denied: Метрика не грузится, баннер скрыт', () => {
  const env = bootstrap(deniedRecord())
  assert.equal(env.ymCalls.length, 0)
  assert.equal(env.window.__artkullMetrikaLoaded, undefined)
  assert.equal(env.banner.hidden, true)
})

test('клик «Да» в баннере грузит Метрику и пишет согласие', () => {
  const env = bootstrap(null)
  env.buttons[0].dispatch('click')
  assert.equal(env.ymCalls.length, 1)
  assert.equal(env.banner.hidden, true)
  const saved = JSON.parse(env.storage.getItem('artkull-consent'))
  assert.equal(saved.value, 'granted')
  assert.equal(typeof saved.ts, 'string')
})

test('клик «Нет» в баннере не грузит Метрику и пишет отказ', () => {
  const env = bootstrap(null)
  env.buttons[1].dispatch('click')
  assert.equal(env.ymCalls.length, 0)
  const saved = JSON.parse(env.storage.getItem('artkull-consent'))
  assert.equal(saved.value, 'denied')
  assert.equal(env.reloads.length, 0)
})

test('отзыв согласия удаляет cookie Метрики и перезагружает страницу', () => {
  const env = bootstrap(grantedRecord())
  env.buttons[1].dispatch('click')
  assert.equal(JSON.parse(env.storage.getItem('artkull-consent')).value, 'denied')
  assert.equal(env.reloads.length, 1)
  assert.ok(env.cookieWrites.some((c) => c.indexOf('_ym_uid=') === 0 && c.indexOf('Max-Age=0') !== -1))
  assert.ok(env.cookieWrites.some((c) => c.indexOf('_ym_d=') === 0))
  assert.equal(env.cookieWrites.some((c) => c.indexOf('other=') === 0), false)
})

test('«Настройки cookie» при отказе снова открывают баннер', () => {
  const env = bootstrap(deniedRecord())
  assert.equal(env.banner.hidden, true)
  env.settings.dispatch('click')
  assert.equal(env.banner.hidden, false)
})
