'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const consent = require('../js/consent.js')

function fakeStorage(initial) {
  const map = new Map(Object.entries(initial || {}))
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null },
    setItem(key, value) { map.set(key, String(value)) },
    removeItem(key) { map.delete(key) }
  }
}

test('parseConsent: корректная запись', () => {
  const rec = consent.parseConsent('{"v":1,"value":"granted","ts":"2026-09-28T12:00:00.000Z"}')
  assert.deepEqual(rec, { value: 'granted', ts: '2026-09-28T12:00:00.000Z' })
})

test('parseConsent: мусор и неверная версия → null', () => {
  assert.equal(consent.parseConsent(null), null)
  assert.equal(consent.parseConsent(''), null)
  assert.equal(consent.parseConsent('{'), null)
  assert.equal(consent.parseConsent('{"v":2,"value":"granted"}'), null)
  assert.equal(consent.parseConsent('{"v":1,"value":"maybe"}'), null)
})

test('serializeConsent: пишет версию и ISO-время', () => {
  const iso = consent.serializeConsent('denied', new Date('2026-09-28T12:00:00.000Z'))
  assert.equal(iso, '{"v":1,"value":"denied","ts":"2026-09-28T12:00:00.000Z"}')
})

test('serializeConsent/parseConsent: round-trip', () => {
  const iso = consent.serializeConsent('granted', new Date('2026-01-02T03:04:05.000Z'))
  assert.deepEqual(consent.parseConsent(iso), {
    value: 'granted',
    ts: '2026-01-02T03:04:05.000Z'
  })
})

test('readConsent/writeConsent работают с хранилищем', () => {
  const store = fakeStorage()
  assert.equal(consent.readConsent(store), null)
  assert.equal(consent.writeConsent(store, 'granted', new Date('2026-09-28T12:00:00.000Z')), true)
  assert.deepEqual(consent.readConsent(store), {
    value: 'granted',
    ts: '2026-09-28T12:00:00.000Z'
  })
})

test('readConsent/writeConsent терпят сбой хранилища', () => {
  const broken = {
    getItem() { throw new Error('blocked') },
    setItem() { throw new Error('blocked') }
  }
  assert.equal(consent.readConsent(broken), null)
  assert.equal(consent.writeConsent(broken, 'granted'), false)
})

test('initialAction по записи', () => {
  assert.equal(consent.initialAction(null), 'show')
  assert.equal(consent.initialAction({ value: 'granted' }), 'load')
  assert.equal(consent.initialAction({ value: 'denied' }), 'ignore')
})

test('isMetrikaCookie распознаёт cookie Метрики', () => {
  assert.equal(consent.isMetrikaCookie('_ym_uid'), true)
  assert.equal(consent.isMetrikaCookie('_ym_d'), true)
  assert.equal(consent.isMetrikaCookie('ymex'), true)
  assert.equal(consent.isMetrikaCookie('yandexuid'), true)
  assert.equal(consent.isMetrikaCookie('sessionid'), false)
  assert.equal(consent.isMetrikaCookie(''), false)
})
