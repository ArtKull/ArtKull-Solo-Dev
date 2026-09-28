'use strict';

const https = require('https');
const fs = require('fs');

function httpsTransport(options) {
  const ca = options.ca;
  return function request(url, request) {
    return new Promise(function (resolve, reject) {
      const req = https.request(
        url,
        {
          method: request.method,
          headers: request.headers,
          timeout: request.timeoutMs,
          ca: ca,
        },
        function (res) {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', function (chunk) { data += chunk; });
          res.on('end', function () {
            resolve({ statusCode: res.statusCode, body: data });
          });
        }
      );
      req.on('timeout', function () { req.destroy(new Error('timeout')); });
      req.on('error', reject);
      req.write(request.body);
      req.end();
    });
  };
}

function createMaxSender(options) {
  const token = options.token;
  const userId = options.userId;
  const log = options.logger || console;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 6000;

  let ca = options.ca;
  const caPath = options.caPath || process.env.MAX_CA_PATH;
  if (!ca && caPath) {
    try {
      ca = fs.readFileSync(caPath);
    } catch (error) {
      log.error('[ArtKull] MAX CA read failed: ' + (error && error.message ? error.message : String(error)));
    }
  }

  const request = options.requestImpl || httpsTransport({ ca: ca });

  return async function sendMessage(text) {
    const url = 'https://platform-api2.max.ru/messages?user_id=' + encodeURIComponent(userId);
    const body = JSON.stringify({
      text: text,
      format: 'html',
      disable_link_preview: true,
    });
    let response;
    try {
      response = await request(url, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        body: body,
        timeoutMs: timeoutMs,
      });
    } catch (error) {
      log.error('[ArtKull] MAX request failed: ' + (error && error.message ? error.message : String(error)));
      return false;
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      log.error('[ArtKull] MAX HTTP ' + response.statusCode + ': ' + String(response.body).slice(0, 300));
      return false;
    }
    return true;
  };
}

module.exports = { createMaxSender, httpsTransport };
