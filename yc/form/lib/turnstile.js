'use strict';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TOKEN_LENGTH = 2048;
const TIMEOUT_MS = 10000;

function parseHostnames(value) {
  return String(value == null ? '' : value)
    .split(',')
    .map(function (hostname) {
      return hostname.trim().toLowerCase();
    })
    .filter(function (hostname) {
      return hostname !== '';
    });
}

function isConfigured(opts) {
  return (
    typeof opts.token === 'string' &&
    opts.token.length > 0 &&
    opts.token.length <= MAX_TOKEN_LENGTH &&
    typeof opts.secret === 'string' &&
    opts.secret.length > 0 &&
    Array.isArray(opts.hostnames) &&
    opts.hostnames.length > 0
  );
}

async function verifyTurnstile(opts) {
  opts = opts || {};
  if (!isConfigured(opts)) {
    return false;
  }

  const fetchImpl = opts.fetchImpl || fetch;
  const body = new URLSearchParams({ secret: opts.secret, response: opts.token });
  if (opts.remoteip) {
    body.set('remoteip', opts.remoteip);
  }

  let result;
  try {
    const init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
    };
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      init.signal = AbortSignal.timeout(opts.timeoutMs || TIMEOUT_MS);
    }
    const response = await fetchImpl(SITEVERIFY_URL, init);
    if (!response.ok) {
      return false;
    }
    result = await response.json();
  } catch (e) {
    return false;
  }

  if (!result || result.success !== true) {
    return false;
  }
  if (opts.expectedAction && result.action !== opts.expectedAction) {
    return false;
  }
  const hostname = String(result.hostname || '').toLowerCase();
  return opts.hostnames.indexOf(hostname) !== -1;
}

module.exports = { verifyTurnstile, parseHostnames, SITEVERIFY_URL };
