'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyTurnstile, parseHostnames, SITEVERIFY_URL } = require('../lib/turnstile');

function makeFetch(responder) {
  const calls = [];
  const fn = async function (url, init) {
    calls.push({ url: url, init: init });
    return responder(url, init);
  };
  fn.calls = calls;
  fn.body = function () {
    return new URLSearchParams(calls[0].init.body);
  };
  return fn;
}

function jsonResponse(obj, ok) {
  return {
    ok: ok !== false,
    status: ok === false ? 500 : 200,
    json: async function () {
      return obj;
    },
  };
}

function baseOpts(overrides) {
  return Object.assign(
    {
      token: 'TOKEN',
      secret: 'SECRET',
      expectedAction: 'contact',
      hostnames: ['artkull.ru'],
      remoteip: '10.0.0.1',
    },
    overrides || {}
  );
}

test('parseHostnames: делит, обрезает, приводит к нижнему регистру, убирает пустые', () => {
  assert.deepEqual(parseHostnames(' artkull.ru , WWW.ArtKull.ru , , '), [
    'artkull.ru',
    'www.artkull.ru',
  ]);
  assert.deepEqual(parseHostnames(''), []);
  assert.deepEqual(parseHostnames(undefined), []);
});

test('verifyTurnstile: успешный ответ → true и корректный запрос', async () => {
  const fetchImpl = makeFetch(() =>
    jsonResponse({ success: true, action: 'contact', hostname: 'artkull.ru' })
  );
  const ok = await verifyTurnstile(baseOpts({ fetchImpl: fetchImpl }));
  assert.equal(ok, true);
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].url, SITEVERIFY_URL);
  assert.equal(fetchImpl.calls[0].init.method, 'POST');
  const body = fetchImpl.body();
  assert.equal(body.get('secret'), 'SECRET');
  assert.equal(body.get('response'), 'TOKEN');
  assert.equal(body.get('remoteip'), '10.0.0.1');
});

test('verifyTurnstile: remoteip необязателен', async () => {
  const fetchImpl = makeFetch(() =>
    jsonResponse({ success: true, action: 'contact', hostname: 'artkull.ru' })
  );
  await verifyTurnstile(baseOpts({ fetchImpl: fetchImpl, remoteip: '' }));
  assert.equal(fetchImpl.body().has('remoteip'), false);
});

test('verifyTurnstile: несовпадение action → false', async () => {
  const fetchImpl = makeFetch(() =>
    jsonResponse({ success: true, action: 'signup', hostname: 'artkull.ru' })
  );
  const ok = await verifyTurnstile(baseOpts({ fetchImpl: fetchImpl }));
  assert.equal(ok, false);
});

test('verifyTurnstile: hostname не в allowlist → false', async () => {
  const fetchImpl = makeFetch(() =>
    jsonResponse({ success: true, action: 'contact', hostname: 'evil.example' })
  );
  const ok = await verifyTurnstile(baseOpts({ fetchImpl: fetchImpl }));
  assert.equal(ok, false);
});

test('verifyTurnstile: hostname сравнивается без учёта регистра', async () => {
  const fetchImpl = makeFetch(() =>
    jsonResponse({ success: true, action: 'contact', hostname: 'ARTKULL.RU' })
  );
  const ok = await verifyTurnstile(baseOpts({ fetchImpl: fetchImpl }));
  assert.equal(ok, true);
});

test('verifyTurnstile: success !== true → false', async () => {
  const fetchImpl = makeFetch(() =>
    jsonResponse({ success: false, 'error-codes': ['invalid-input-response'] })
  );
  const ok = await verifyTurnstile(baseOpts({ fetchImpl: fetchImpl }));
  assert.equal(ok, false);
});

test('verifyTurnstile: HTTP-ошибка siteverify → false', async () => {
  const fetchImpl = makeFetch(() => jsonResponse({ success: true }, false));
  const ok = await verifyTurnstile(baseOpts({ fetchImpl: fetchImpl }));
  assert.equal(ok, false);
});

test('verifyTurnstile: сеть недоступна/таймаут → false', async () => {
  const fetchImpl = async function () {
    throw new Error('timeout');
  };
  const ok = await verifyTurnstile(baseOpts({ fetchImpl: fetchImpl }));
  assert.equal(ok, false);
});

test('verifyTurnstile: пустой токен → false без запроса', async () => {
  const fetchImpl = makeFetch(() => jsonResponse({ success: true }));
  const ok = await verifyTurnstile(baseOpts({ token: '', fetchImpl: fetchImpl }));
  assert.equal(ok, false);
  assert.equal(fetchImpl.calls.length, 0);
});

test('verifyTurnstile: слишком длинный токен → false без запроса', async () => {
  const fetchImpl = makeFetch(() => jsonResponse({ success: true }));
  const ok = await verifyTurnstile(
    baseOpts({ token: 'x'.repeat(2049), fetchImpl: fetchImpl })
  );
  assert.equal(ok, false);
  assert.equal(fetchImpl.calls.length, 0);
});

test('verifyTurnstile: нет секрета → false без запроса', async () => {
  const fetchImpl = makeFetch(() => jsonResponse({ success: true }));
  const ok = await verifyTurnstile(baseOpts({ secret: '', fetchImpl: fetchImpl }));
  assert.equal(ok, false);
  assert.equal(fetchImpl.calls.length, 0);
});

test('verifyTurnstile: пустой список hostname → false без запроса', async () => {
  const fetchImpl = makeFetch(() => jsonResponse({ success: true }));
  const ok = await verifyTurnstile(baseOpts({ hostnames: [], fetchImpl: fetchImpl }));
  assert.equal(ok, false);
  assert.equal(fetchImpl.calls.length, 0);
});
