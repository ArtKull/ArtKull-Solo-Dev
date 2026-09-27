<?php
declare(strict_types=1);

/**
 * Чистая логика обработки заявки. Без побочных эффектов и без секретов,
 * поэтому файл безопасно включать из тестов.
 */

function artkull_normalize(string $value): string
{
    return trim((string)preg_replace('/\s+/u', ' ', $value));
}

function artkull_len(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}

function artkull_is_honeypot(array $input): bool
{
    return trim((string)($input['website'] ?? '')) !== '';
}

/** Возвращает 'email', 'phone' или null. */
function artkull_contact_kind(string $contact): ?string
{
    if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
        return 'email';
    }
    if (preg_match('/^[+]?[0-9\s\-()]{5,}$/', $contact)) {
        $digits = preg_replace('/\D/', '', $contact);
        if (strlen($digits) >= 5 && strlen($digits) <= 15) {
            return 'phone';
        }
    }
    return null;
}

/**
 * @return array{ok:bool, errors:array{name:?string, contact:?string}, values:array{name:string, contact:string}}
 */
function artkull_validate(array $input): array
{
    $name = artkull_normalize((string)($input['name'] ?? ''));
    $contact = artkull_normalize((string)($input['contact'] ?? ''));

    $errors = ['name' => null, 'contact' => null];

    $nameLen = artkull_len($name);
    if ($nameLen < 2 || $nameLen > 80) {
        $errors['name'] = 'name_length';
    }

    $contactLen = artkull_len($contact);
    if ($contactLen < 5 || $contactLen > 120) {
        $errors['contact'] = 'contact_length';
    } elseif (artkull_contact_kind($contact) === null) {
        $errors['contact'] = 'contact_format';
    }

    return [
        'ok' => $errors['name'] === null && $errors['contact'] === null,
        'errors' => $errors,
        'values' => ['name' => $name, 'contact' => $contact],
    ];
}

/** true — запрос разрешён; false — лимит исчерпан. */
function artkull_rate_limit(string $dir, string $ip, int $max, int $window, ?int $now = null): bool
{
    $now = $now ?? time();
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $file = rtrim($dir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR
        . 'artkull_rl_' . hash('sha256', $ip) . '.json';

    $hits = [];
    if (is_file($file)) {
        $decoded = json_decode((string)@file_get_contents($file), true);
        if (is_array($decoded)) {
            $hits = $decoded;
        }
    }

    $hits = array_values(array_filter($hits, static function ($t) use ($now, $window): bool {
        return is_int($t) && $t > $now - $window;
    }));

    if (count($hits) >= $max) {
        return false;
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
    return true;
}

function artkull_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function artkull_build_message(array $values, string $ip, string $ua, string $time): string
{
    $lines = [];
    $lines[] = '<b>Новая заявка с сайта ArtKull</b>';
    $lines[] = '';
    $lines[] = '<b>Имя:</b> ' . artkull_escape((string)$values['name']);
    $lines[] = '<b>Контакт:</b> ' . artkull_escape((string)$values['contact']);
    $lines[] = '';
    $lines[] = '<b>Время:</b> ' . artkull_escape($time);
    $lines[] = '<b>IP:</b> ' . artkull_escape($ip);
    if ($ua !== '') {
        $lines[] = '<b>UA:</b> ' . artkull_escape(substr($ua, 0, 200));
    }
    return implode("\n", $lines);
}
