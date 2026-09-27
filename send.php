<?php
declare(strict_types=1);

require __DIR__ . '/lib/submit.php';

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    artkull_respond(false, 'server_config', true, 500);
    exit;
}
require $configPath;

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
$json = strpos($accept, 'application/json') !== false;

header('X-Content-Type-Options: nosniff');

if ($method !== 'POST') {
    artkull_respond(false, 'method_not_allowed', $json, 405);
    exit;
}

$input = $_POST;

if (artkull_is_honeypot($input)) {
    artkull_respond(true, '', $json, 200);
    exit;
}

$validated = artkull_validate($input);
if (!$validated['ok']) {
    $code = $validated['errors']['name'] ?? $validated['errors']['contact'] ?? 'invalid';
    artkull_respond(false, 'invalid_' . $code, $json, 400);
    exit;
}

$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$rateDir = defined('RATE_DIR') ? (string)RATE_DIR : sys_get_temp_dir();
if (!artkull_rate_limit($rateDir, $ip, (int)RATE_MAX, (int)RATE_WINDOW)) {
    artkull_respond(false, 'rate_limited', $json, 429);
    exit;
}

$time = (new DateTimeImmutable('now', new DateTimeZone('Asia/Yekaterinburg')))->format('Y-m-d H:i');
$ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
$text = artkull_build_message($validated['values'], $ip, $ua, $time);

if (defined('DRY_RUN') && DRY_RUN) {
    @error_log('[ArtKull DRY_RUN] ' . str_replace("\n", ' | ', strip_tags($text)));
    artkull_respond(true, '', $json, 200);
    exit;
}

$ch = curl_init('https://api.telegram.org/bot' . BOT_TOKEN . '/sendMessage');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_POSTFIELDS => http_build_query([
        'chat_id' => CHAT_ID,
        'text' => $text,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => 'true',
    ]),
]);
$response = curl_exec($ch);
$errno = curl_errno($ch);
curl_close($ch);

if ($errno !== 0) {
    artkull_respond(false, 'upstream_unreachable', $json, 500);
    exit;
}

$decoded = json_decode((string)$response, true);
if (!is_array($decoded) || empty($decoded['ok'])) {
    artkull_respond(false, 'upstream_error', $json, 500);
    exit;
}

artkull_respond(true, '', $json, 200);

/**
 * Отправляет ответ в JSON (для fetch) или простую HTML-страницу (нативный POST).
 */
function artkull_respond(bool $ok, string $error, bool $json, int $status): void
{
    http_response_code($status);
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        $payload = ['ok' => $ok];
        if (!$ok) {
            $payload['error'] = $error;
        }
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        return;
    }
    header('Content-Type: text/html; charset=utf-8');
    $message = $ok
        ? 'Спасибо! Заявка отправлена.'
        : 'Не удалось отправить заявку. Напишите напрямую: https://t.me/ArtKull';
    echo '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<title>ArtKull</title></head><body style="font-family:system-ui,sans-serif;padding:40px">'
        . '<p>' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p><a href="/">← На главную</a></p></body></html>';
}
