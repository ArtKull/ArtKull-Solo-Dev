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
    'Vary': 'Origin',
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
  const env = (deps || {}).env || {};
  const headers = lowerHeaders(event.headers);
  const wantsHtml = String(headers['accept'] || '').includes('text/html');
  const configured = String(
    deps && deps.origin ? deps.origin : (env.ALLOWED_ORIGIN || 'https://artkull.ru')
  )
    .split(',')
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s !== ''; });
  const requestOrigin = String(headers['origin'] || '');
  const origin = configured.indexOf(requestOrigin) !== -1 ? requestOrigin : configured[0];
  const now = deps && deps.now ? deps.now() : new Date();
  const store = (deps && deps.rateStore) || rateStore;
  const sendMessage = deps && deps.sendMessage;

  if (getMethod(event) !== 'POST') {
    return respond(false, 'method_not_allowed', wantsHtml, 405, origin);
  }

  const input = parseBody(event);

  if (isHoneypot(input)) {
    return respond(true, '', wantsHtml, 200, origin);
  }

  const validated = validate(input);
  if (!validated.ok) {
    const code =
      validated.errors.name || validated.errors.contact || validated.errors.consent || 'invalid';
    return respond(false, 'invalid_' + code, wantsHtml, 400, origin);
  }

  const ip = getIp(event);
  const ua = String(headers['user-agent'] || '');
  const max = Number(env.RATE_MAX) > 0 ? Number(env.RATE_MAX) : 5;
  const windowSec = Number(env.RATE_WINDOW) > 0 ? Number(env.RATE_WINDOW) : 600;
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
