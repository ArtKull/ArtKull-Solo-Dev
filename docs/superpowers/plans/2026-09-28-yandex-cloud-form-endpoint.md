# Отправка формы ArtKull через Yandex Cloud — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить недоступный на GitHub Pages PHP-обработчик формы на Node.js
Cloud Function в Yandex Cloud, доступную через API Gateway на `api.artkull.ru`.

**Architecture:** Форма на статическом сайте шлёт `POST`
`application/x-www-form-urlencoded` на API Gateway; шлюз (CORS + rate-limit)
вызывает приватную Cloud Function, которая валидирует заявку и отправляет её в
Telegram Bot API; секреты живут только в переменных окружения функции.

**Tech Stack:** Node.js 18+ (без зависимостей, встроенный `fetch`, `node:test`),
Yandex Cloud Functions, Yandex API Gateway, Yandex Certificate Manager,
исходная статика GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-28-yandex-cloud-form-endpoint-design.md`

## Global Constraints

- Среда функции — Node.js 18+; **ноль внешних зависимостей** (только стандартная
  библиотека и глобальный `fetch`).
- Функция **приватная**: публичный вызов выключен, вызывает только сервисный
  аккаунт API Gateway с ролью `functions.invoke`.
- Публичный адрес — `https://api.artkull.ru/`; CORS ограничен
  `https://artkull.ru`.
- Тело запроса — `application/x-www-form-urlencoded`, поля `name`, `contact`,
  `website` (honeypot).
- Контракт ответа: JSON `{"ok":true}` либо `{"ok":false,"error":"<machine-code>"}`;
  коды `200/400/405/429/500`; при `Accept: text/html` — HTML-страница.
- Machine-codes сохранить как в текущем PHP: `invalid_name_length`,
  `invalid_contact_length`, `invalid_contact_format`, `method_not_allowed`,
  `rate_limited`, `upstream_error`.
- Секреты (`BOT_TOKEN`, `CHAT_ID`) — только в переменных окружения функции, не в
  коде, не в логах, не в репозитории.
- Тексты сообщений и HTML-ответов — на русском языке.
- В новом коде **не добавлять комментарии** (стиль задачи).
- Node.js локально не установлен: шаги запуска тестов выполнимы в любой
  Node-среде (после установки Node, в CI и т.п.). Основная сквозная верификация —
  Task 9 через `curl` и браузер.

---

## File Structure

**Создаются:**

- `yc/form/index.js` — точка входа функции, связывает env, время и Telegram.
- `yc/form/lib/validate.js` — чистая логика: нормализация, honeypot, валидация,
  экранирование, сборка текста сообщения.
- `yc/form/lib/telegram.js` — клиент отправки в Telegram Bot API.
- `yc/form/lib/handler.js` — обработка события API Gateway → HTTP-ответ.
- `yc/form/package.json` — метаданные и `npm test`.
- `yc/form/test/validate.test.js`, `yc/form/test/telegram.test.js`,
  `yc/form/test/handler.test.js` — юнит-тесты на `node:test`.
- `yc/form/README.md` — сборка ZIP, env, деплой, проверка.
- `yc/gateway/openapi.yaml` — спецификация API Gateway.
- `yc/SETUP.md` — пошаговая инструкция для владельца в консоли Yandex Cloud.

**Изменяются:**

- `js/app.js` — endpoint и тело запроса (`URLSearchParams`).
- `index.html` — `action` формы.
- `.gitignore` — убрать `config.php`, добавить `yc/form/node_modules/`.
- `PRODUCT.md` — описание нового бэкенда.

**Удаляются:**

- `send.php`, `config.example.php`, `lib/submit.php`, `tests/submit_test.php`,
  `.htaccess`.

---

## Task 1: Чистая логика функции

**Files:**
- Create: `yc/form/lib/validate.js`
- Test: `yc/form/test/validate.test.js`

**Interfaces:**
- Consumes: ничего.
- Produces:
  - `normalize(value: unknown): string`
  - `charLength(value: unknown): number`
  - `isHoneypot(input: Record<string, unknown>): boolean`
  - `contactKind(contact: string): 'email' | 'phone' | null`
  - `validate(input): { ok: boolean, errors: { name: string|null, contact: string|null }, values: { name: string, contact: string } }`
  - `escapeHtml(value: unknown): string`
  - `buildMessage(values, ip: string, ua: string, time: string): string`

- [ ] **Step 1: Write the failing test**

`yc/form/test/validate.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalize,
  isHoneypot,
  contactKind,
  validate,
  buildMessage,
} = require('../lib/validate');

test('normalize схлопывает пробелы и обрезает края', () => {
  assert.equal(normalize('  Иван   Петров  '), 'Иван Петров');
  assert.equal(normalize(undefined), '');
});

test('isHoneypot: пустое поле — не бот', () => {
  assert.equal(isHoneypot({}), false);
  assert.equal(isHoneypot({ website: '' }), false);
  assert.equal(isHoneypot({ website: '   ' }), false);
});

test('isHoneypot: заполненное поле — бот', () => {
  assert.equal(isHoneypot({ website: 'spam' }), true);
});

test('contactKind распознаёт email и телефон', () => {
  assert.equal(contactKind('a@b.co'), 'email');
  assert.equal(contactKind('+7 922 269-84-46'), 'phone');
  assert.equal(contactKind('просто текст'), null);
});

test('validate: валидная заявка', () => {
  const r = validate({ name: 'Артём', contact: 'a@b.co' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.values, { name: 'Артём', contact: 'a@b.co' });
});

test('validate: короткое имя', () => {
  const r = validate({ name: 'A', contact: 'a@b.co' });
  assert.equal(r.ok, false);
  assert.equal(r.errors.name, 'name_length');
});

test('validate: короткий контакт', () => {
  const r = validate({ name: 'Артём', contact: 'zzz' });
  assert.equal(r.errors.contact, 'contact_length');
});

test('validate: неверный формат контакта', () => {
  const r = validate({ name: 'Артём', contact: 'abcdef' });
  assert.equal(r.errors.contact, 'contact_format');
});

test('buildMessage экранирует HTML и включает контакт', () => {
  const msg = buildMessage(
    { name: '<b>x</b>', contact: 'a@b.co' },
    '1.1.1.1',
    'UA',
    '2026-01-01 10:00'
  );
  assert.ok(msg.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(msg.includes('a@b.co'));
  assert.ok(msg.includes('1.1.1.1'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test yc/form/test/validate.test.js`
Expected: FAIL — `Cannot find module '../lib/validate'`.

- [ ] **Step 3: Write minimal implementation**

`yc/form/lib/validate.js`:

```js
'use strict';

function normalize(value) {
  return String(value == null ? '' : value).replace(/\s+/gu, ' ').trim();
}

function charLength(value) {
  return Array.from(String(value == null ? '' : value)).length;
}

function isHoneypot(input) {
  return String(input.website == null ? '' : input.website).trim() !== '';
}

function contactKind(contact) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    return 'email';
  }
  if (/^[+]?[0-9\s\-()]{5,}$/.test(contact)) {
    const digits = contact.replace(/\D/g, '');
    if (digits.length >= 5 && digits.length <= 15) {
      return 'phone';
    }
  }
  return null;
}

function validate(input) {
  const name = normalize(input.name);
  const contact = normalize(input.contact);
  const errors = { name: null, contact: null };

  const nameLen = charLength(name);
  if (nameLen < 2 || nameLen > 80) {
    errors.name = 'name_length';
  }

  const contactLen = charLength(contact);
  if (contactLen < 5 || contactLen > 120) {
    errors.contact = 'contact_length';
  } else if (contactKind(contact) === null) {
    errors.contact = 'contact_format';
  }

  return {
    ok: errors.name === null && errors.contact === null,
    errors,
    values: { name, contact },
  };
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMessage(values, ip, ua, time) {
  const lines = [];
  lines.push('<b>Новая заявка с сайта ArtKull</b>');
  lines.push('');
  lines.push('<b>Имя:</b> ' + escapeHtml(values.name));
  lines.push('<b>Контакт:</b> ' + escapeHtml(values.contact));
  lines.push('');
  lines.push('<b>Время:</b> ' + escapeHtml(time));
  lines.push('<b>IP:</b> ' + escapeHtml(ip));
  if (ua !== '') {
    lines.push('<b>UA:</b> ' + escapeHtml(String(ua).slice(0, 200)));
  }
  return lines.join('\n');
}

module.exports = {
  normalize,
  charLength,
  isHoneypot,
  contactKind,
  validate,
  escapeHtml,
  buildMessage,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test yc/form/test/validate.test.js`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add yc/form/lib/validate.js yc/form/test/validate.test.js
git commit -m "feat(form): add pure validation logic for YC function"
```

---

## Task 2: Клиент Telegram

**Files:**
- Create: `yc/form/lib/telegram.js`
- Test: `yc/form/test/telegram.test.js`

**Interfaces:**
- Consumes: ничего.
- Produces: `createTelegramSender({ token: string, chatId: string, fetchImpl?: Function }): (text: string) => Promise<boolean>`

- [ ] **Step 1: Write the failing test**

`yc/form/test/telegram.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTelegramSender } = require('../lib/telegram');

test('отправляет корректный запрос в Telegram', async () => {
  let captured = null;
  const fakeFetch = async (url, opts) => {
    captured = { url, opts };
    return { ok: true, json: async () => ({ ok: true }) };
  };
  const send = createTelegramSender({ token: 'T', chatId: '42', fetchImpl: fakeFetch });

  const result = await send('hello');

  assert.equal(result, true);
  assert.equal(captured.url, 'https://api.telegram.org/botT/sendMessage');
  const payload = JSON.parse(captured.opts.body);
  assert.equal(payload.chat_id, '42');
  assert.equal(payload.text, 'hello');
  assert.equal(payload.parse_mode, 'HTML');
  assert.equal(payload.disable_web_page_preview, true);
});

test('возвращает false при ошибке Telegram', async () => {
  const fakeFetch = async () => ({ ok: false, json: async () => ({ ok: false }) });
  const send = createTelegramSender({ token: 'T', chatId: '42', fetchImpl: fakeFetch });

  assert.equal(await send('hello'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test yc/form/test/telegram.test.js`
Expected: FAIL — `Cannot find module '../lib/telegram'`.

- [ ] **Step 3: Write minimal implementation**

`yc/form/lib/telegram.js`:

```js
'use strict';

function createTelegramSender(options) {
  const token = options.token;
  const chatId = options.chatId;
  const doFetch = options.fetchImpl || fetch;

  return async function sendMessage(text) {
    const response = await doFetch(
      'https://api.telegram.org/bot' + token + '/sendMessage',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    );
    if (!response.ok) {
      return false;
    }
    const data = await response.json().catch(function () { return null; });
    return !!(data && data.ok);
  };
}

module.exports = { createTelegramSender };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test yc/form/test/telegram.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add yc/form/lib/telegram.js yc/form/test/telegram.test.js
git commit -m "feat(form): add Telegram Bot API sender"
```

---

## Task 3: Обработчик запроса

**Files:**
- Create: `yc/form/lib/handler.js`
- Test: `yc/form/test/handler.test.js`

**Interfaces:**
- Consumes: `lib/validate.js` (Task 1).
- Produces:
  - `handleRequest(event, deps): Promise<{ statusCode: number, headers: Record<string,string>, body: string }>`
    где `deps = { env, now?: () => Date, sendMessage: (text: string) => Promise<boolean>, rateStore?: Map, origin?: string }`.
  - `rateStore: Map<string, number[]>`
  - Внутренние (не экспортируются наружу контракта): `formatTime`, `getMethod`,
    `getIp`, `parseBody`, `lowerHeaders`, `respond`.

- [ ] **Step 1: Write the failing test**

`yc/form/test/handler.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test yc/form/test/handler.test.js`
Expected: FAIL — `Cannot find module '../lib/handler'`.

- [ ] **Step 3: Write minimal implementation**

`yc/form/lib/handler.js`:

```js
'use strict';

const { isHoneypot, validate, buildMessage } = require('./validate');

const rateStore = new Map();

function lowerHeaders(headers) {
  const out = {};
  Object.keys(headers || {}).forEach(function (key) {
    out[String(key).toLowerCase()] = headers[key];
  });
  return out;
}

function getMethod(event) {
  const rc = event.requestContext || {};
  if (rc.http && rc.http.method) {
    return rc.http.method;
  }
  return event.httpMethod || 'GET';
}

function getIp(event) {
  const rc = event.requestContext || {};
  if (rc.identity && rc.identity.sourceIp) {
    return rc.identity.sourceIp;
  }
  const fwd = lowerHeaders(event.headers)['x-forwarded-for'];
  if (fwd) {
    return String(fwd).split(',')[0].trim();
  }
  return '0.0.0.0';
}

function parseBody(event) {
  let body = event.body || '';
  if (event.isBase64Encoded) {
    body = Buffer.from(body, 'base64').toString('utf8');
  }
  const out = {};
  new URLSearchParams(body).forEach(function (value, key) {
    out[key] = value;
  });
  return out;
}

function formatTime(date) {
  return date.toLocaleString('sv-SE', {
    timeZone: 'Asia/Yekaterinburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function rateLimited(store, ip, max, windowSec, nowMs) {
  const now = Math.floor(nowMs / 1000);
  const hits = (store.get(ip) || []).filter(function (t) {
    return t > now - windowSec;
  });
  if (hits.length >= max) {
    store.set(ip, hits);
    return true;
  }
  hits.push(now);
  store.set(ip, hits);
  return false;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'X-Content-Type-Options': 'nosniff',
  };
}

function respond(ok, error, wantsHtml, status, origin) {
  if (wantsHtml) {
    const message = ok
      ? 'Спасибо! Заявка отправлена.'
      : 'Не удалось отправить заявку. Напишите напрямую: https://t.me/ArtKull';
    return {
      statusCode: status,
      headers: Object.assign(corsHeaders(origin), {
        'Content-Type': 'text/html; charset=utf-8',
      }),
      body:
        '<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<title>ArtKull</title></head><body style="font-family:system-ui,sans-serif;padding:40px">' +
        '<p>' + message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>' +
        '<p><a href="https://artkull.ru/">← На главную</a></p></body></html>',
    };
  }
  const payload = { ok: ok };
  if (!ok) {
    payload.error = error;
  }
  return {
    statusCode: status,
    headers: Object.assign(corsHeaders(origin), {
      'Content-Type': 'application/json; charset=utf-8',
    }),
    body: JSON.stringify(payload),
  };
}

async function handleRequest(event, deps) {
  const env = deps.env || {};
  const origin = deps.origin || env.ALLOWED_ORIGIN || 'https://artkull.ru';
  const now = deps.now ? deps.now() : new Date();
  const store = deps.rateStore || rateStore;
  const sendMessage = deps.sendMessage;

  const headers = lowerHeaders(event.headers);
  const wantsHtml = String(headers['accept'] || '').includes('text/html');

  if (getMethod(event) !== 'POST') {
    return respond(false, 'method_not_allowed', wantsHtml, 405, origin);
  }

  const input = parseBody(event);

  if (isHoneypot(input)) {
    return respond(true, '', wantsHtml, 200, origin);
  }

  const validated = validate(input);
  if (!validated.ok) {
    const code = validated.errors.name || validated.errors.contact || 'invalid';
    return respond(false, 'invalid_' + code, wantsHtml, 400, origin);
  }

  const ip = getIp(event);
  const ua = String(headers['user-agent'] || '');
  const max = Number(env.RATE_MAX || 5);
  const windowSec = Number(env.RATE_WINDOW || 600);
  if (rateLimited(store, ip, max, windowSec, now.getTime())) {
    return respond(false, 'rate_limited', wantsHtml, 429, origin);
  }

  const text = buildMessage(validated.values, ip, ua, formatTime(now));

  if (String(env.DRY_RUN) === 'true') {
    console.log('[ArtKull DRY_RUN] ' + text.replace(/\n/g, ' | '));
    return respond(true, '', wantsHtml, 200, origin);
  }

  let ok = false;
  try {
    ok = await sendMessage(text);
  } catch (e) {
    ok = false;
  }
  if (!ok) {
    return respond(false, 'upstream_error', wantsHtml, 500, origin);
  }
  return respond(true, '', wantsHtml, 200, origin);
}

module.exports = { handleRequest, rateStore };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test yc/form/test/handler.test.js`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add yc/form/lib/handler.js yc/form/test/handler.test.js
git commit -m "feat(form): add API Gateway request handler"
```

---

## Task 4: Точка входа и метаданные функции

**Files:**
- Create: `yc/form/index.js`
- Create: `yc/form/package.json`

**Interfaces:**
- Consumes: `handleRequest` (Task 3), `createTelegramSender` (Task 2).
- Produces: экспорт `handler(event, context)`, который вызывает YC Node.js runtime
  (точка входа `index.handler`).

- [ ] **Step 1: Write minimal implementation**

`yc/form/index.js`:

```js
'use strict';

const { handleRequest } = require('./lib/handler');
const { createTelegramSender } = require('./lib/telegram');

exports.handler = async function (event) {
  const env = process.env;
  return handleRequest(event, {
    env: env,
    now: function () {
      return new Date();
    },
    sendMessage: createTelegramSender({
      token: env.BOT_TOKEN,
      chatId: env.CHAT_ID,
    }),
  });
};
```

`yc/form/package.json`:

```json
{
  "name": "artkull-form",
  "version": "1.0.0",
  "private": true,
  "description": "Cloud Function: приём заявки с сайта ArtKull и отправка в Telegram",
  "main": "index.js",
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "test": "node --test test/"
  }
}
```

- [ ] **Step 2: Verify the module loads**

Run: `node -e "require('./yc/form/index.js'); console.log('ok')"`
Expected: вывод `ok` (без ошибок загрузки). Если Node недоступен — шаг
выполняется после установки Node; синтаксис проверить визуально.

- [ ] **Step 3: Run all tests**

Run: `npm test --prefix yc/form`
Expected: PASS (все тесты Task 1–3, 20 штук).

- [ ] **Step 4: Commit**

```bash
git add yc/form/index.js yc/form/package.json
git commit -m "feat(form): add function entrypoint and package metadata"
```

---

## Task 5: Фронтенд — endpoint и тело запроса

**Files:**
- Modify: `js/app.js:312-321`
- Modify: `index.html:584`

**Interfaces:**
- Consumes: публичный URL `https://api.artkull.ru/` (Task 6/9 артефакты).
- Produces: отправка `application/x-www-form-urlencoded` с полями `name`,
  `contact`, `website` на API Gateway.

- [ ] **Step 1: Change the form action**

В `index.html:584` заменить:

```html
<form class="cta__form" action="send.php" method="post">
```

на:

```html
<form class="cta__form" action="https://api.artkull.ru/" method="post">
```

- [ ] **Step 2: Change the fetch call to send urlencoded body**

В `js/app.js` заменить блок:

```js
      fetch(form.getAttribute('action') || 'send.php', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
```

на:

```js
      var payload = new URLSearchParams();
      payload.set('name', name);
      payload.set('contact', contact);
      var honeypot = form.querySelector('#cta-website');
      if (honeypot) { payload.set('website', honeypot.value); }

      fetch(form.getAttribute('action') || 'https://api.artkull.ru/', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: payload,
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
```

(Переменные `name` и `contact` уже определены выше в обработчике submit —
`js/app.js:287-288`.)

- [ ] **Step 3: Verify no stale reference remains**

Run: `git grep -n "send.php" -- index.html js/`
Expected: пусто (нет совпадений).

- [ ] **Step 4: Commit**

```bash
git add index.html js/app.js
git commit -m "feat(form): post form data to YC API Gateway endpoint"
```

---

## Task 6: Удаление PHP-бэкенда

**Files:**
- Delete: `send.php`, `config.example.php`, `lib/submit.php`,
  `tests/submit_test.php`, `.htaccess`
- Modify: `.gitignore`

- [ ] **Step 1: Delete PHP files**

```bash
git rm send.php config.example.php lib/submit.php tests/submit_test.php .htaccess
```

- [ ] **Step 2: Update `.gitignore`**

Заменить строку `config.php` на `yc/form/node_modules/` (секретов в репозитории
больше нет, локальных зависимостей у функции нет, но каталог исключаем на
случай установки). Итоговое содержимое:

```
yc/form/node_modules/
tmp/

# Локальные конфиги инструментов разработки
.obsidian/
.opencode/
.impeccable/

# Рабочие превью ассетов
logo_preview.png
```

- [ ] **Step 3: Verify no live references to removed files**

Run: `git grep -n -E "send\.php|config\.example\.php|submit\.php" -- . ":!docs/"`
Expected: пусто, кроме упоминаний в документации/спеке (их не трогаем).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(form): remove PHP backend superseded by YC function"
```

---

## Task 7: Артефакты деплоя и инструкция владельцу

**Files:**
- Create: `yc/gateway/openapi.yaml`
- Create: `yc/form/README.md`
- Create: `yc/SETUP.md`

- [ ] **Step 1: Create the API Gateway spec**

`yc/gateway/openapi.yaml`:

```yaml
openapi: 3.0.0
info:
  title: ArtKull form
  version: 1.0.0
paths:
  /:
    post:
      operationId: submitForm
      responses:
        '200':
          description: Заявка принята
        '400':
          description: Невалидные данные
        '429':
          description: Слишком много запросов
        '500':
          description: Ошибка отправки
      x-yc-apigateway-integration:
        type: cloud-functions
        function_id: <FUNCTION_ID>
    options:
      operationId: corsPreflight
      responses:
        '204':
          description: CORS preflight
      x-yc-apigateway-integration:
        type: dummy
        http_code: 204
        http_headers:
          Access-Control-Allow-Origin: https://artkull.ru
          Access-Control-Allow-Methods: POST, OPTIONS
          Access-Control-Allow-Headers: Content-Type, Accept
```

- [ ] **Step 2: Create the function deploy README**

`yc/form/README.md`:

```markdown
# Cloud Function `artkull-form`

Принимает заявку с сайта ArtKull и отправляет её в Telegram.

## Состав

- `index.js` — точка входа (`index.handler`).
- `lib/validate.js` — валидация и текст сообщения.
- `lib/telegram.js` — отправка в Telegram Bot API.
- `lib/handler.js` — обработка события API Gateway.
- `test/` — юнит-тесты (`node --test`).

Зависимостей нет; требуется Node.js 18+.

## Тесты

```bash
npm test --prefix yc/form
```

## Переменные окружения

| Переменная | Пример | Назначение |
|---|---|---|
| `BOT_TOKEN` | `123:ABC` | токен бота (секрет) |
| `CHAT_ID` | `123456789` | получатель заявок |
| `ALLOWED_ORIGIN` | `https://artkull.ru` | CORS |
| `DRY_RUN` | `true` / `false` | без реальной отправки |
| `RATE_MAX` | `5` | лимит на IP в памяти функции |
| `RATE_WINDOW` | `600` | окно в секундах |

## Сборка ZIP для консоли

Из каталога `yc/form` сложить содержимое (не саму папку) так, чтобы
`index.js` был в корне архива:

```powershell
Compress-Archive -Path index.js, package.json, lib -DestinationPath ..\artkull-form.zip -Force
```

Точка входа при создании версии — `index.handler`.

## Быстрая проверка после деплоя

```bash
curl -i -X POST https://api.artkull.ru/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  --data "name=Тест&contact=test@example.com"
```

Ожидается `200` и `{"ok":true}` (при `DRY_RUN=true` — без Telegram).
```

- [ ] **Step 3: Create the owner setup runbook**

`yc/SETUP.md`:

```markdown
# Настройка Yandex Cloud для формы ArtKull

Все шаги — в консоли https://console.yandex.cloud. Значения из таблицы ниже
подставляйте по мере получения.

| Что | Где взять | Значение |
|---|---|---|
| Folder ID | консоль, каталог | ______ |
| Function ID | после создания функции | ______ |
| Служебный домен шлюза | после создания API Gateway | ______ |
| CNAME для `api` | после привязки домена | ______ |

## 1. Каталог и биллинг

1. Войдите в консоль, выберите облако и создайте/выберите каталог
   (например `artkull`). Скопируйте **Folder ID**.
2. Если платёжный аккаунт не привязан — привяжите. Бесплатных лимитов хватает,
   но аккаунт нужен.

## 2. Сервисный аккаунт

1. `IAM` → **Сервисные аккаунты** → **Создать**.
2. Имя: `artkull-form-gateway`.
3. Добавьте роль `functions.invoke`.
4. Создайте.

## 3. Функция

1. `Cloud Functions` → **Создать функцию**, имя `artkull-form`.
2. `Создать версию`:
   - Среда выполнения: **Node.js 18**.
   - Способ загрузки: **ZIP-архив** — соберите его по `yc/form/README.md`.
   - Точка входа: `index.handler`.
   - Таймаут: `10` секунд, память: `128 МБ`.
   - Переменные окружения:
     - `BOT_TOKEN` = токен бота (включите отметку «секрет»);
     - `CHAT_ID` = ваш chat id;
     - `ALLOWED_ORIGIN` = `https://artkull.ru`;
     - `DRY_RUN` = `true` (на время настройки);
     - `RATE_MAX` = `5`;
     - `RATE_WINDOW` = `600`.
   - Создайте версию.
3. Скопируйте **Function ID**.
4. Убедитесь, что публичный доступ к функции **не** включён.
5. Вкладка «Тестирование»: проверьте вызовом события из `yc/gateway`-примера
   (тело `name=Тест&contact=test@example.com`), ожидается `200` и `ok: true`.

## 4. API Gateway

1. `API Gateway` → **Создать**, имя `artkull-form-gw`.
2. Вставьте спецификацию из `yc/gateway/openapi.yaml`, заменив
   `<FUNCTION_ID>` на ID из шага 3.
3. В настройках шлюза укажите сервисный аккаунт `artkull-form-gateway`.
4. (Опционально) включите лимит частоты по IP, например 10 запросов/минуту.
5. Создайте шлюз. Скопируйте **служебный домен** вида
   `xxxxxxxx.apigw.yandexcloud.net`.
6. Проверьте:

   ```bash
   curl -i -X POST https://<служебный-домен>/ \
     -H "Content-Type: application/x-www-form-urlencoded" \
     --data "name=Тест&contact=test@example.com"
   ```

   Ожидается `200` и `{"ok":true}`.

## 5. Сертификат

1. `Certificate Manager` → **Выпустить сертификат** → Let's Encrypt.
2. Домен: `api.artkull.ru`.
3. Выберите DNS-валидацию; консоль покажет CNAME-запись для подтверждения.
4. Добавьте её в DNS у регистратора домена `artkull.ru` и дождитесь статуса
   **Issued**.

## 6. Домен для API Gateway

1. `API Gateway` → ваш шлюз → **Домены** → **Добавить**.
2. Домен: `api.artkull.ru`, сертификат — созданный в шаге 5.
3. Консоль покажет CNAME-значение. Добавьте у регистратора запись
   `api` → это значение.
4. Дождитесь статуса домена **Готов**.

## 7. Боевой тест

1. В функции измените `DRY_RUN` на `false`, создайте новую версию.
2. Откройте `https://artkull.ru/`, отправьте тестовую заявку.
3. Убедитесь, что сообщение пришло в Telegram, а на сайте показан успех.
4. Проверьте негативный сценарий: пустые поля → инлайн-ошибка; частые отправки →
   сообщение о лимите.

## 8. Обновление кода функции

Повторите сборку ZIP и создайте новую версию функции (измените `DRY_RUN` обратно
при необходимости). Шлюз и домен менять не нужно.
```

- [ ] **Step 4: Verify YAML parses**

Run: `node -e "const s=require('fs').readFileSync('yc/gateway/openapi.yaml','utf8'); if(!s.includes('cloud-functions')) process.exit(1); console.log('ok')"`
Expected: `ok` (без Node — визуальная проверка отступов).

- [ ] **Step 5: Commit**

```bash
git add yc/gateway/openapi.yaml yc/form/README.md yc/SETUP.md
git commit -m "docs(form): add YC deploy artifacts and owner setup runbook"
```

---

## Task 8: Обновление PRODUCT.md

**Files:**
- Modify: `PRODUCT.md`

- [ ] **Step 1: Find backend-related statements**

Run: `git grep -n -i -E "php|бэкенд|backend|send\.php|хостинг" -- PRODUCT.md`
Expected: список строк, которые нужно актуализировать. Сохраните его для
следующего шага.

- [ ] **Step 2: Update the statements**

Замените описание бэкенда формы на: «Форма отправляется на приватную Cloud
Function в Yandex Cloud через публичный API Gateway на `api.artkull.ru`
(CORS, rate-limit); функция валидирует заявку и отправляет её в Telegram.
Секреты хранятся в переменных окружения функции». Уберите упоминания PHP,
`send.php` и требований к PHP-хостингу. Контакты и UX формы не меняются.

- [ ] **Step 3: Verify no stale backend references**

Run: `git grep -n -i -E "php|send\.php" -- PRODUCT.md`
Expected: пусто.

- [ ] **Step 4: Commit**

```bash
git add PRODUCT.md
git commit -m "docs: describe YC form backend in PRODUCT"
```

---

## Task 9: Ручная настройка Yandex Cloud и боевая проверка

Это шаги владельца (не правки в репозитории) — выполняются по
`yc/SETUP.md`. Ветка считается завершённой, когда пройден чек-лист.

- [ ] **Step 1: Каталог, биллинг, сервисный аккаунт** — разделы 1–2 `yc/SETUP.md`.
- [ ] **Step 2: Функция + env + отключённый публичный доступ** — раздел 3.
- [ ] **Step 3: API Gateway со спецификацией и сервисным аккаунтом** — раздел 4.
- [ ] **Step 4: Проверка через `curl` на служебном домене** — `200 {"ok":true}`.
- [ ] **Step 5: Сертификат + CNAME валидации** — раздел 5.
- [ ] **Step 6: Домен `api.artkull.ru` + CNAME у регистратора** — раздел 6.
- [ ] **Step 7: `curl` на `https://api.artkull.ru/`** — `200 {"ok":true}`.
- [ ] **Step 8: Тест с `DRY_RUN=true` из браузера на `artkull.ru`** — успех, в
  логах функции строка `[ArtKull DRY_RUN]`.
- [ ] **Step 9: `DRY_RUN=false`, новая версия, боевая заявка** — сообщение пришло
  в Telegram.
- [ ] **Step 10: Негативные проверки** — пустые поля (`400`/инлайн-ошибка),
  частые отправки (`429`/сообщение о лимите), отключённая сеть (fallback-текст).

---

## Self-Review

**1. Покрытие спеки:**

| Раздел спеки | Задача |
|---|---|
| §3 Архитектура/поток | Task 4, 5, 9 |
| §4 Контракт API | Task 3 (коды/JSON), Task 5 (urlencoded) |
| §5 Cloud Function + env + DRY_RUN | Task 1–4, 7, 9 |
| §6 API Gateway (spec/CORS/rate-limit/SA) | Task 7 (`openapi.yaml`), Task 9 |
| §7 Домен/сертификат/DNS | Task 9 (`yc/SETUP.md`) |
| §8 Изменения в репозитории | Task 5, 6, 7, 8 |
| §9 Безопасность | Global Constraints, Task 3 (nosniff), Task 9 (приватность) |
| §10 Прогрессивное улучшение | Task 3 (`wantsHtml`), Task 5 (`action`) |
| §11 Тестирование | Task 1–3 (unit), Task 9 (curl/браузер) |
| §12 Стоимость/квоты | Task 9 (раздел 1 SETUP) |
| §13 Инструкция владельцу | Task 7 (`yc/SETUP.md`), Task 9 |
| §14 Риски | Отражены в README/SETUP и Global Constraints |
| §15 Документация | Task 7, 8 |

**2. Placeholders:** единственный плейсхолдер — `<FUNCTION_ID>` в спецификации;
он намеренный (подставляется владельцем в Task 9) и описан в README/SETUP.
TBD/TODO отсутствуют.

**3. Типы/имена:** `handleRequest`, `rateStore`, `createTelegramSender`,
`validate`, `isHoneypot`, `buildMessage`, `contactKind` совпадают во всех
задачах и тестах. Коды ошибок в handler (`invalid_name_length` и т.д.) совпадают
с разбором в `js/app.js:335-349`.
