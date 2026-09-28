'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { handleRequest } = require('../lib/handler');

function postEvent(fields, extra) {
  return Object.assign(
    {
      requestContext: { http: { method: 'POST' }, identity: { sourceIp: '10.0.0.1' } },
      headers: { 'user-agent': 'test-agent', accept: 'application/json' },
      body: new URLSearchParams(fields).toString(),
      isBase64Encoded: false,
    },
    extra || {}
  );
}

function makeDeps(overrides) {
  return Object.assign(
    {
      env: { ALLOWED_ORIGIN: 'https://artkull.ru', RATE_MAX: '100', RATE_WINDOW: '600' },
      now: () => new Date('2026-09-28T09:30:00Z'),
      sendMessage: async () => true,
      rateStore: new Map(),
    },
    overrides || {}
  );
}

test('валидная заявка → 200 и отправка', async () => {
  let sent = null;
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co' }),
    makeDeps({ sendMessage: async (t) => { sent = t; return true; } })
  );
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).ok, true);
  assert.ok(sent.includes('Артём'));
});

test('honeypot → 200 без отправки', async () => {
  let called = false;
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co', website: 'x' }),
    makeDeps({ sendMessage: async () => { called = true; return true; } })
  );
  assert.equal(res.statusCode, 200);
  assert.equal(called, false);
});

test('короткое имя → 400 invalid_name_length', async () => {
  const res = await handleRequest(postEvent({ name: 'A', contact: 'a@b.co' }), makeDeps());
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error, 'invalid_name_length');
});

test('GET → 405', async () => {
  const event = postEvent(
    {},
    { requestContext: { http: { method: 'GET' }, identity: { sourceIp: '10.0.0.1' } }, body: '' }
  );
  const res = await handleRequest(event, makeDeps());
  assert.equal(res.statusCode, 405);
  assert.equal(JSON.parse(res.body).error, 'method_not_allowed');
});

test('сбой Telegram → 500 upstream_error', async () => {
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co' }),
    makeDeps({ sendMessage: async () => false })
  );
  assert.equal(res.statusCode, 500);
  assert.equal(JSON.parse(res.body).error, 'upstream_error');
});

test('превышение лимита → 429 rate_limited', async () => {
  const deps = makeDeps({
    env: { ALLOWED_ORIGIN: 'https://artkull.ru', RATE_MAX: '1', RATE_WINDOW: '600' },
  });
  await handleRequest(postEvent({ name: 'Артём', contact: 'a@b.co' }), deps);
  const res = await handleRequest(postEvent({ name: 'Артём', contact: 'a@b.co' }), deps);
  assert.equal(res.statusCode, 429);
  assert.equal(JSON.parse(res.body).error, 'rate_limited');
});

test('Accept text/html → HTML-ответ', async () => {
  const event = postEvent({ name: 'Артём', contact: 'a@b.co' }, { headers: { accept: 'text/html' } });
  const res = await handleRequest(event, makeDeps());
  assert.match(res.headers['Content-Type'], /text\/html/);
  assert.match(res.body, /Спасибо/);
});

test('DRY_RUN не шлёт, но отвечает ok', async () => {
  let called = false;
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co' }),
    makeDeps({
      env: { ALLOWED_ORIGIN: 'https://artkull.ru', DRY_RUN: 'true', RATE_MAX: '100', RATE_WINDOW: '600' },
      sendMessage: async () => { called = true; return true; },
    })
  );
  assert.equal(res.statusCode, 200);
  assert.equal(called, false);
});

test('ответ содержит CORS и nosniff', async () => {
  const res = await handleRequest(postEvent({ name: 'Артём', contact: 'a@b.co' }), makeDeps());
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://artkull.ru');
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
});

test('исключение отправки → 500 upstream_error', async () => {
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co' }),
    makeDeps({ sendMessage: async () => { throw new Error('x'); } })
  );
  assert.equal(res.statusCode, 500);
  assert.equal(JSON.parse(res.body).error, 'upstream_error');
});

test('короткий контакт → 400 invalid_contact_length', async () => {
  const res = await handleRequest(postEvent({ name: 'Артём', contact: 'zzz' }), makeDeps());
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error, 'invalid_contact_length');
});

test('неверный формат контакта → 400 invalid_contact_format', async () => {
  const res = await handleRequest(postEvent({ name: 'Артём', contact: 'abcdef' }), makeDeps());
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error, 'invalid_contact_format');
});
