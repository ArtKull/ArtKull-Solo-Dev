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
