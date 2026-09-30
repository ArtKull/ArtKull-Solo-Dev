'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { handleRequest } = require('../lib/handler');

function postEvent(fields, extra) {
  return Object.assign(
    {
      requestContext: { http: { method: 'POST' }, identity: { sourceIp: '10.0.0.1' } },
      headers: { 'user-agent': 'test-agent', accept: 'application/json' },
      body: new URLSearchParams(Object.assign({ consent: 'yes' }, fields)).toString(),
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
      verifyTurnstile: async () => true,
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

test('сбой отправки → 500 upstream_error', async () => {
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

test('отсутствие согласия → 400 invalid_consent', async () => {
  let called = false;
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co', consent: '' }),
    makeDeps({ sendMessage: async () => { called = true; return true; } })
  );
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error, 'invalid_consent');
  assert.equal(called, false);
});

test('согласие не подтверждено → 400 invalid_consent', async () => {
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co', consent: 'no' }),
    makeDeps()
  );
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error, 'invalid_consent');
});

test('подтверждённое согласие попадает в сообщение', async () => {
  let sent = null;
  await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co' }),
    makeDeps({ sendMessage: async (t) => { sent = t; return true; } })
  );
  assert.ok(sent.includes('Согласие на обработку ПД:'));
});

test('top-level httpMethod POST → 200', async () => {
  const event = {
    httpMethod: 'POST',
    requestContext: { identity: { sourceIp: '10.0.0.1' } },
    headers: { 'user-agent': 'test-agent', accept: 'application/json' },
    body: new URLSearchParams({ name: 'Артём', contact: 'a@b.co', consent: 'yes' }).toString(),
    isBase64Encoded: false,
  };
  const res = await handleRequest(event, makeDeps());
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).ok, true);
});

test('top-level httpMethod GET → 405 method_not_allowed', async () => {
  const event = {
    httpMethod: 'GET',
    requestContext: { identity: { sourceIp: '10.0.0.1' } },
    headers: { accept: 'application/json' },
    body: '',
    isBase64Encoded: false,
  };
  const res = await handleRequest(event, makeDeps());
  assert.equal(res.statusCode, 405);
  assert.equal(JSON.parse(res.body).error, 'method_not_allowed');
});

test('base64-кодированное тело → 200 и отправка', async () => {
  let sent = null;
  const event = {
    httpMethod: 'POST',
    requestContext: { identity: { sourceIp: '10.0.0.1' } },
    headers: { 'user-agent': 'test-agent', accept: 'application/json' },
    body: Buffer.from(
      new URLSearchParams({ name: 'Артём', contact: 'a@b.co', consent: 'yes' }).toString()
    ).toString('base64'),
    isBase64Encoded: true,
  };
  const res = await handleRequest(
    event,
    makeDeps({ sendMessage: async (t) => { sent = t; return true; } })
  );
  assert.equal(res.statusCode, 200);
  assert.ok(sent.includes('Артём'));
});

test('RATE_MAX abc → лимит по умолчанию 5', async () => {
  const deps = makeDeps({
    env: { ALLOWED_ORIGIN: 'https://artkull.ru', RATE_MAX: 'abc', RATE_WINDOW: '600' },
  });
  for (let i = 0; i < 5; i += 1) {
    const res = await handleRequest(postEvent({ name: 'Артём', contact: 'a@b.co' }), deps);
    assert.equal(res.statusCode, 200);
  }
  const res = await handleRequest(postEvent({ name: 'Артём', contact: 'a@b.co' }), deps);
  assert.equal(res.statusCode, 429);
  assert.equal(JSON.parse(res.body).error, 'rate_limited');
});

test('неизвестный Origin → первый из списка', async () => {
  const event = postEvent(
    { name: 'Артём', contact: 'a@b.co' },
    {
      headers: {
        'user-agent': 'test-agent',
        accept: 'application/json',
        origin: 'https://evil.example',
      },
    }
  );
  const res = await handleRequest(
    event,
    makeDeps({
      env: {
        ALLOWED_ORIGIN: 'https://artkull.ru,https://www.artkull.ru',
        RATE_MAX: '100',
        RATE_WINDOW: '600',
      },
    })
  );
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://artkull.ru');
});

test('совпадающий Origin отражается', async () => {
  const event = postEvent(
    { name: 'Артём', contact: 'a@b.co' },
    {
      headers: {
        'user-agent': 'test-agent',
        accept: 'application/json',
        origin: 'https://www.artkull.ru',
      },
    }
  );
  const res = await handleRequest(
    event,
    makeDeps({
      env: {
        ALLOWED_ORIGIN: 'https://artkull.ru,https://www.artkull.ru',
        RATE_MAX: '100',
        RATE_WINDOW: '600',
      },
    })
  );
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://www.artkull.ru');
});

test('вызов без deps не бросает → 403 (Turnstile не настроен, fail-closed)', async () => {
  const res = await handleRequest(postEvent({ name: 'Артём', contact: 'a@b.co' }));
  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(res.body).error, 'turnstile_failed');
});

test('Turnstile не пройден → 403 turnstile_failed без отправки', async () => {
  let sent = false;
  let received = null;
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co', 'cf-turnstile-response': 'tok' }),
    makeDeps({
      env: {
        ALLOWED_ORIGIN: 'https://artkull.ru',
        RATE_MAX: '100',
        RATE_WINDOW: '600',
        TURNSTILE_SECRET: 'sec',
        TURNSTILE_HOSTNAMES: 'artkull.ru',
      },
      verifyTurnstile: async (opts) => { received = opts; return false; },
      sendMessage: async () => { sent = true; return true; },
    })
  );
  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(res.body).error, 'turnstile_failed');
  assert.equal(sent, false);
  assert.equal(received.token, 'tok');
});

test('нет cf-turnstile-response → пустой токен в verify → 403', async () => {
  let received = null;
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co' }),
    makeDeps({ verifyTurnstile: async (opts) => { received = opts; return false; } })
  );
  assert.equal(res.statusCode, 403);
  assert.equal(received.token, undefined);
});

test('Turnstile пройден → заявка отправляется', async () => {
  let sent = null;
  const res = await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co', 'cf-turnstile-response': 'tok' }),
    makeDeps({ sendMessage: async (t) => { sent = t; return true; } })
  );
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).ok, true);
  assert.ok(sent.includes('Артём'));
});

test('verify получает secret/hostnames/action/remoteip из env', async () => {
  let received = null;
  await handleRequest(
    postEvent(
      { name: 'Артём', contact: 'a@b.co', 'cf-turnstile-response': 'tok' },
      { requestContext: { http: { method: 'POST' }, identity: { sourceIp: '203.0.113.7' } } }
    ),
    makeDeps({
      env: {
        ALLOWED_ORIGIN: 'https://artkull.ru',
        RATE_MAX: '100',
        RATE_WINDOW: '600',
        TURNSTILE_SECRET: 'sec',
        TURNSTILE_HOSTNAMES: 'artkull.ru, www.artkull.ru',
        TURNSTILE_ACTION: 'contact',
      },
      verifyTurnstile: async (opts) => { received = opts; return true; },
    })
  );
  assert.equal(received.secret, 'sec');
  assert.equal(received.expectedAction, 'contact');
  assert.deepEqual(received.hostnames, ['artkull.ru', 'www.artkull.ru']);
  assert.equal(received.remoteip, '203.0.113.7');
});

test('TURNSTILE_ACTION по умолчанию contact', async () => {
  let received = null;
  await handleRequest(
    postEvent({ name: 'Артём', contact: 'a@b.co', 'cf-turnstile-response': 'tok' }),
    makeDeps({ verifyTurnstile: async (opts) => { received = opts; return true; } })
  );
  assert.equal(received.expectedAction, 'contact');
});
