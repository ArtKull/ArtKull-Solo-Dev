'use strict';

const { handleRequest } = require('./lib/handler');
const { createMaxSender } = require('./lib/max');

exports.handler = async function (event) {
  const env = process.env;
  return handleRequest(event, {
    env: env,
    now: function () {
      return new Date();
    },
    sendMessage: createMaxSender({
      token: env.MAX_TOKEN,
      userId: env.MAX_USER_ID,
      caPath: env.MAX_CA_PATH,
    }),
  });
};
