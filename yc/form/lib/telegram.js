'use strict';

function createTelegramSender(options) {
  const token = options.token;
  const chatId = options.chatId;
  const doFetch = options.fetchImpl || fetch;
  const log = options.logger || console;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 6000;

  return async function sendMessage(text) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    let response;
    try {
      response = await doFetch(
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
          signal: controller.signal,
        }
      );
    } catch (error) {
      const cause = error && error.cause ? (error.cause.code || error.cause.message) : '';
      log.error(
        '[ArtKull] telegram request failed: ' +
        (error && error.name ? error.name + ': ' : '') +
        (error && error.message ? error.message : String(error)) +
        (cause ? ' | cause=' + cause : '')
      );
      return false;
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) {
      log.error('[ArtKull] telegram HTTP ' + response.status);
      return false;
    }
    const data = await response.json().catch(function () { return null; });
    if (!data || !data.ok) {
      log.error('[ArtKull] telegram responded not ok: ' + JSON.stringify(data));
      return false;
    }
    return true;
  };
}

module.exports = { createTelegramSender };
