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
