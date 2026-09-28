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
