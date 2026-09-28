'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createMaxSender } = require('../lib/max');

const silent = { error: function () {} };

test('отправляет корректный запрос в MAX', async () => {
  let captured = null;
  const requestImpl = async (url, request) => {
    captured = { url, request };
    return { statusCode: 200, body: '{"message":{"body":{"text":"ok"}}}' };
  };
  const send = createMaxSender({
    token: 'TOKEN',
    userId: '12345',
    requestImpl: requestImpl,
    logger: silent,
  });

  const result = await send('<b>hello</b>');

  assert.equal(result, true);
  assert.equal(captured.url, 'https://platform-api2.max.ru/messages?user_id=12345');
  assert.equal(captured.request.method, 'POST');
  assert.equal(captured.request.headers.Authorization, 'TOKEN');
  assert.equal(captured.request.headers['Content-Type'], 'application/json');
  const payload = JSON.parse(captured.request.body);
  assert.equal(payload.text, '<b>hello</b>');
  assert.equal(payload.format, 'html');
  assert.equal(payload.disable_link_preview, true);
});

test('возвращает false при ошибке HTTP', async () => {
  const requestImpl = async () => ({ statusCode: 401, body: '{"code":"verify.token"}' });
  const send = createMaxSender({ token: 'T', userId: '1', requestImpl: requestImpl, logger: silent });

  assert.equal(await send('hello'), false);
});

test('возвращает false при сетевой ошибке', async () => {
  const requestImpl = async () => { throw new Error('network'); };
  const send = createMaxSender({ token: 'T', userId: '1', requestImpl: requestImpl, logger: silent });

  assert.equal(await send('hello'), false);
});

test('возвращает false по таймауту транспортного запроса', async () => {
  const requestImpl = async () => { throw new Error('timeout'); };
  const send = createMaxSender({
    token: 'T',
    userId: '1',
    requestImpl: requestImpl,
    logger: silent,
    timeoutMs: 20,
  });

  assert.equal(await send('hello'), false);
});
