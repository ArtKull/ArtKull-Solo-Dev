# Real Contacts + Telegram Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить черновые плейсхолдеры контактов/идентичности реальными данными и сделать форму заявки рабочей (POST → PHP → Telegram-бот), храня токен только на сервере.

**Architecture:** Статический фронтенд остаётся прежним (HTML/CSS/vanilla JS, без сборки). Добавляется тонкий PHP-слой: `send.php` (entrypoint) + `lib/submit.php` (чистая логика: honeypot, валидация, rate-limit, сборка текста) + `config.php` (секреты, вне git). Форма работает через `fetch` (прогрессивное улучшение: нативный POST при выключенном JS).

**Tech Stack:** HTML5, CSS3, vanilla ES5-совместимый JS, PHP 7.4+ (curl, json), Telegram Bot API.

**Спека:** `docs/superpowers/specs/2026-09-27-contacts-and-telegram-form-design.md`.

**Предусловия для локальной проверки:** установленный PHP 7.4+ в PATH. Если PHP локально нет — задачи с `php`-проверкой выполнять на хостинге. Фронтенд-проверки — PowerShell + браузер.

---

## Файловая структура

| Файл | Ответственность |
|------|-----------------|
| `index.html` | Реальные контакты/имя; иконка MAX; ссылки CTA; атрибуты формы + honeypot |
| `css/components.css` | Класс `.icon-brand` (цветной логотип MAX) |
| `css/sections.css` | Скрытый honeypot `.hp`; веса сообщений формы |
| `js/app.js` | Перехват submit, клиентская валидация, состояния, fallback |
| `lib/submit.php` | Чистые функции: honeypot, валидация, rate-limit, сборка сообщения |
| `send.php` | Entrypoint: метод, honeypot, валидация, rate-limit, cURL в Telegram, ответ |
| `config.example.php` | Образец конфига с инструкцией (коммитится) |
| `config.php` | Реальные секреты (в `.gitignore`, на сервере) |
| `.gitignore` | Игнор `config.php` |
| `.htaccess` | Запрет доступа к `config.php` |
| `tests/submit_test.php` | CLI-тесты чистой логики (только из командной строки) |
| `PRODUCT.md` | Реальные контакты; scope; WhatsApp → MAX |

---

## Task 1: Реальные контакты и идентичность в `index.html`

**Files:**
- Modify: `index.html`
- Modify: `css/components.css`

- [ ] **Step 1: Проверить, что реальных данных ещё нет (падающая проверка)**

Run:
```powershell
(Select-String -Path index.html -Pattern 't\.me/ArtKull' -Quiet)
```
Expected: `False` (ссылки ещё нет).

- [ ] **Step 2: Профиль — имя и инициалы**

Найти в `index.html`:
```html
              <div class="profile__avatar" aria-hidden="true">АФ</div>
              <div>
                <div class="profile__name">Имя Фамилия</div>
```
Заменить на:
```html
              <div class="profile__avatar" aria-hidden="true">АК</div>
              <div>
                <div class="profile__name">Артём Кульчинский</div>
```

- [ ] **Step 3: Футер — имя правообладателя**

Найти:
```html
      <span>© 2026 Имя Фамилия · <a href="#" aria-disabled="true">Политика конфиденциальности</a></span>
```
Заменить на:
```html
      <span>© 2026 Артём Кульчинский · <a href="#" aria-disabled="true">Политика конфиденциальности</a></span>
```

- [ ] **Step 4: CTA-примечание — прямые ссылки**

Найти:
```html
          <p class="cta__note">Или напиши напрямую — <a href="#contacts">Telegram</a> · <a href="#contacts">WhatsApp</a> · <a href="#contacts">Email</a></p>
```
Заменить на:
```html
          <p class="cta__note">Или напиши напрямую — <a href="https://t.me/ArtKull" target="_blank" rel="noopener">Telegram</a> · <a href="https://max.ru/u/f9LHodD0cOJMGPWR8xV1d-TSf36Dx8PhEkonW4tXJrbJpAuOaM8cLKAT7lU" target="_blank" rel="noopener">MAX</a> · <a href="mailto:artkull@gmail.com">Email</a></p>
```

- [ ] **Step 5: Плитки контактов — Telegram / MAX / Email / Телефон**

Найти блок `<div class="contact-links"> … </div>` в секции `#contacts` (четыре `a.contact-link`) и заменить целиком на:
```html
            <div class="contact-links">
              <a class="contact-link" href="https://t.me/ArtKull" target="_blank" rel="noopener">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>
                Telegram
              </a>
              <a class="contact-link" href="https://max.ru/u/f9LHodD0cOJMGPWR8xV1d-TSf36Dx8PhEkonW4tXJrbJpAuOaM8cLKAT7lU" target="_blank" rel="noopener">
                <img class="icon-brand" src="assets/max.svg" alt="" width="20" height="20">
                MAX
              </a>
              <a class="contact-link" href="mailto:artkull@gmail.com">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                Email
              </a>
              <a class="contact-link" href="tel:+79222698446">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                +7 922 269-84-46
              </a>
            </div>
```

- [ ] **Step 6: Соцсети — VK + GitHub (Behance убрать)**

Найти блок `<div class="socials"> … </div>` и заменить целиком на:
```html
            <div class="socials">
              <a class="social-link" href="https://github.com/ArtKull" target="_blank" rel="noopener" aria-label="GitHub">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              </a>
              <a class="social-link" href="https://vk.ru/kulchinsky" target="_blank" rel="noopener" aria-label="VK">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h2.5c.5 2.5 1.8 4.2 3 4.8V8h2.5v4.2c1-.2 2.2-1.8 2.6-4.2H16c-.4 2-1.3 3.6-2.4 4.6 1.3.9 2.6 2.4 3.3 4.4h-2.7c-.6-1.6-1.6-2.7-2.8-3v3H8.8c-3 0-5.3-2.8-5.8-8z"/></svg>
              </a>
            </div>
```

- [ ] **Step 7: Стиль бренд-иконки MAX**

В `css/components.css`, сразу после блока `.icon--sm { … }` (конец файла), добавить:
```css

.icon-brand {
  width: 20px;
  height: 20px;
  flex: none;
  object-fit: contain;
  border-radius: 4px;
}
```

- [ ] **Step 8: Проверить результат**

Run:
```powershell
(Select-String -Path index.html -Pattern 't\.me/ArtKull' -Quiet); (Select-String -Path index.html -Pattern 'wa\.me|/username|you@example\.com|behance|Имя Фамилия|>АФ<' -Quiet)
```
Expected: первая строка `True`; вторая `False` (плейсхолдеров не осталось).

- [ ] **Step 9: Визуальная проверка**

Run: `Start-Process index.html`
Ожидаемо: в профиле «Артём Кульчинский» и «АК»; плитки контактов Telegram/MAX/Email/Телефон ведут на реальные адреса; цветная иконка MAX; соцсети — только GitHub и VK; футер «© 2026 Артём Кульчинский».

- [ ] **Step 10: Commit**

```bash
git add index.html css/components.css
git commit -m "feat: replace contact placeholders with real data, add MAX link"
```

---

## Task 2: Чистая логика backend — `lib/submit.php` (TDD)

**Files:**
- Create: `lib/submit.php`
- Test: `tests/submit_test.php`

- [ ] **Step 1: Написать падающий тест**

Создать `tests/submit_test.php`:
```php
<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../lib/submit.php';

$pass = 0;
$fail = 0;
function check(string $label, bool $cond): void
{
    global $pass, $fail;
    if ($cond) {
        $pass++;
        echo "PASS $label\n";
    } else {
        $fail++;
        echo "FAIL $label\n";
    }
}

/* honeypot */
check('honeypot empty -> false', artkull_is_honeypot(['website' => '']) === false);
check('honeypot missing -> false', artkull_is_honeypot([]) === false);
check('honeypot filled -> true', artkull_is_honeypot(['website' => 'spam']) === true);

/* validate: email / phone */
$r = artkull_validate(['name' => 'Артём', 'contact' => 'artkull@gmail.com']);
check('valid email ok', $r['ok'] === true);
$r = artkull_validate(['name' => 'Артём', 'contact' => '+7 922 269-84-46']);
check('valid phone ok', $r['ok'] === true);
$r = artkull_validate(['name' => 'A', 'contact' => 'artkull@gmail.com']);
check('short name rejected', $r['ok'] === false && $r['errors']['name'] === 'name_length');
$r = artkull_validate(['name' => 'Артём', 'contact' => 'abc']);
check('bad contact rejected', $r['ok'] === false && $r['errors']['contact'] === 'contact_format');
$r = artkull_validate(['name' => 'Артём', 'contact' => str_repeat('a', 121) . '@x.io']);
check('long contact rejected', $r['ok'] === false);

/* rate limit: deterministic with injected $now */
$dir = sys_get_temp_dir() . '/artkull_rl_test_' . uniqid();
check('rl 1st allowed', artkull_rate_limit($dir, '1.2.3.4', 2, 600, 1000) === true);
check('rl 2nd allowed', artkull_rate_limit($dir, '1.2.3.4', 2, 600, 1001) === true);
check('rl 3rd blocked', artkull_rate_limit($dir, '1.2.3.4', 2, 600, 1002) === false);
check('rl window expiry allows', artkull_rate_limit($dir, '1.2.3.4', 2, 600, 2000) === true);
array_map('unlink', glob($dir . '/*'));
@rmdir($dir);

/* message building escapes HTML */
$msg = artkull_build_message(
    ['name' => '<b>Злой</b>', 'contact' => 'x@y.io'],
    '10.0.0.1',
    'UA<test>',
    '2026-09-27 12:00'
);
check('message escapes name', strpos($msg, '&lt;b&gt;') !== false && strpos($msg, '<b>Злой</b>') === false);
check('message has contact', strpos($msg, 'x@y.io') !== false);

echo "\n$pass passed, $fail failed\n";
exit($fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `php tests/submit_test.php`
Expected: FAIL — `Call to undefined function artkull_is_honeypot()` (или фатальная ошибка включения `lib/submit.php`).

- [ ] **Step 3: Реализовать `lib/submit.php`**

Создать `lib/submit.php`:
```php
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
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `php tests/submit_test.php`
Expected: все `PASS`, финальная строка `N passed, 0 failed`; код выхода 0.

- [ ] **Step 5: Commit**

```bash
git add lib/submit.php tests/submit_test.php
git commit -m "feat: add form submission logic with tests"
```

---

## Task 3: Entrypoint `send.php` + конфиг и защита

**Files:**
- Create: `send.php`
- Create: `config.example.php`
- Create: `.gitignore`
- Create: `.htaccess`

- [ ] **Step 1: Создать `config.example.php`**

```php
<?php
// Скопируйте этот файл в config.php на сервере и заполните реальными значениями.
// config.php НЕ коммитится (см. .gitignore) и закрыт .htaccess.

// 1) Токен бота от @BotFather (/newbot)
const BOT_TOKEN = 'PASTE_BOT_TOKEN_HERE';
// 2) chat_id получателя: https://api.telegram.org/bot<TOKEN>/getUpdates → message.chat.id
//    (или напишите @userinfobot). Для группы id отрицательный, бота сделать админом.
const CHAT_ID = 'PASTE_CHAT_ID_HERE';
// 3) true — заявки не уходят в Telegram, а пишутся в error_log (для локальной проверки)
const DRY_RUN = true;
// 4) Ограничение частоты
const RATE_MAX = 5;
const RATE_WINDOW = 600;
// 5) При желании — свой каталог для счётчиков rate-limit (вне web-root):
// const RATE_DIR = '/path/outside/webroot/artkull-rate';
```

- [ ] **Step 2: Создать `.gitignore`**

```gitignore
config.php
tmp/
```

- [ ] **Step 3: Создать `.htaccess`**

```apache
# Запрет прямого доступа к секретам и служебным файлам
<FilesMatch "^(config\.php|config\.example\.php)$">
  Require all denied
</FilesMatch>
```

- [ ] **Step 4: Создать `send.php`**

```php
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
```

- [ ] **Step 5: Проверить синтаксис PHP**

Run:
```powershell
php -l send.php; php -l lib/submit.php; php -l config.example.php
```
Expected: три строки `No syntax errors detected in …`.

- [ ] **Step 6: Commit**

```bash
git add send.php config.example.php .gitignore .htaccess
git commit -m "feat: add Telegram form endpoint and config scaffold"
```

---

## Task 4: Подключить форму во фронтенде

**Files:**
- Modify: `index.html`
- Modify: `css/sections.css`
- Modify: `js/app.js`

- [ ] **Step 1: Атрибуты формы и honeypot в `index.html`**

Найти:
```html
          <form class="cta__form" novalidate>
            <label class="sr-only" for="cta-name">Имя</label>
            <input class="field" id="cta-name" name="name" type="text" placeholder="Имя" autocomplete="name">
            <label class="sr-only" for="cta-contact">Телефон или email</label>
            <input class="field" id="cta-contact" name="contact" type="text" placeholder="Телефон или email" autocomplete="tel">
            <button class="btn btn--primary" type="submit">Отправить заявку →</button>
          </form>
```
Заменить на:
```html
          <form class="cta__form" action="send.php" method="post" novalidate>
            <label class="sr-only" for="cta-name">Имя</label>
            <input class="field" id="cta-name" name="name" type="text" placeholder="Имя" autocomplete="name">
            <label class="sr-only" for="cta-contact">Телефон или email</label>
            <input class="field" id="cta-contact" name="contact" type="text" placeholder="Телефон или email" autocomplete="tel">
            <div class="hp" aria-hidden="true">
              <label for="cta-website">Не заполняйте это поле</label>
              <input class="field" id="cta-website" name="website" type="text" tabindex="-1" autocomplete="off">
            </div>
            <button class="btn btn--primary" type="submit">Отправить заявку →</button>
          </form>
```

- [ ] **Step 2: Стили honeypot и сообщений в `css/sections.css`**

В конце файла (перед блоком `/* Адаптив */` или в конце) добавить:
```css

/* Honeypot — вне экрана, но в DOM */
.hp {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.cta__message.is-success,
.cta__message.is-error { font-weight: 600; }
```

- [ ] **Step 3: Заменить обработчик формы в `js/app.js`**

Найти (конец файла):
```js
  /* Форма-заглушка */
  var form = document.querySelector('.cta__form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.querySelector('.cta__message');
      if (msg) {
        msg.textContent = 'Заявка не отправляется — это демо. Напиши в мессенджер из блока контактов.';
      }
    });
  }
```
Заменить на:
```js
  /* Форма заявки */
  var form = document.querySelector('.cta__form');
  if (form) {
    var msg = document.querySelector('.cta__message');
    var submitBtn = form.querySelector('button[type="submit"]');
    var nameField = form.querySelector('#cta-name');
    var contactField = form.querySelector('#cta-contact');

    function setMessage(text, kind) {
      if (!msg) { return; }
      msg.textContent = text;
      msg.classList.remove('is-error', 'is-success');
      if (kind) { msg.classList.add('is-' + kind); }
    }
    function validName(v) { return v.length >= 2 && v.length <= 80; }
    function validContact(v) {
      if (v.length < 5 || v.length > 120) { return false; }
      var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      var isPhone = /^[+]?[0-9\s\-()]{5,}$/.test(v) && v.replace(/\D/g, '').length >= 5;
      return isEmail || isPhone;
    }
    function finish() {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      }
      if (msg && msg.focus) {
        msg.setAttribute('tabindex', '-1');
        msg.focus();
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameField ? nameField.value.trim() : '';
      var contact = contactField ? contactField.value.trim() : '';

      if (!validName(name)) {
        setMessage('Укажите имя (2–80 символов).', 'error');
        if (nameField) { nameField.focus(); }
        return;
      }
      if (!validContact(contact)) {
        setMessage('Укажите телефон или email.', 'error');
        if (contactField) { contactField.focus(); }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
      }
      setMessage('Отправляем…', null);

      var controller = ('AbortController' in window) ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, 10000) : null;

      fetch(form.getAttribute('action') || 'send.php', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return { ok: false }; });
      }).then(function (data) {
        if (data && data.ok) {
          form.reset();
          setMessage('✓ Спасибо! Заявка отправлена — отвечу в течение дня.', 'success');
          return;
        }
        throw new Error('failed');
      }).catch(function () {
        setMessage('⚠ Не удалось отправить — напишите в Telegram или MAX из строки ниже.', 'error');
      }).then(function () {
        if (timer) { clearTimeout(timer); }
        finish();
      });
    });
  }
```

- [ ] **Step 4: Проверить разметку и синтаксис JS**

Run:
```powershell
(Select-String -Path index.html -Pattern 'action="send.php"|name="website"' -Quiet); node --check js/app.js
```
Expected: `True`; `node --check` — без вывода и с кодом 0 (если Node нет — пропустить вторую команду и проверить в браузере).

- [ ] **Step 5: Проверить форму в браузере (dry-run)**

Предусловие: `config.php` создан из образца (`Copy-Item config.example.php config.php`, `DRY_RUN = true`).
Run: `php -S localhost:8000` (отдельное окно), затем `Start-Process http://localhost:8000/`
Ожидаемо: пустая отправка → «Укажите имя…»; заполненная → «✓ Спасибо!…», поля очищены; в консоли PHP — запись `[ArtKull DRY_RUN]`.
Проверить honeypot: добавить `?website=x` в данные невозможно вручную — проверить через Task 6.

- [ ] **Step 6: Commit**

```bash
git add index.html css/sections.css js/app.js
git commit -m "feat: wire contact form to send.php with states and fallback"
```

---

## Task 5: Обновить `PRODUCT.md`

**Files:**
- Modify: `PRODUCT.md`

- [ ] **Step 1: Реальные контакты в Product Purpose/Evidence**

В разделе `## Evidence on Hand` найти строку:
```
- Подтверждённых реальных данных нет: имя, контакты, соцсети, метрики
  (47 проектов, «с 2019 года», «5 лет»), цены и сроки — черновые плейсхолдеры
  под замену. Структуру сохранять, конкретные факты не выдумывать.
```
Заменить на:
```
- Подтверждённые реальные данные: имя Артём Кульчинский; Telegram
  (t.me/ArtKull); MAX; email artkull@gmail.com; телефон +7 922 269-84-46;
  VK и GitHub. Метрики (47 проектов, «с 2019 года», «5 лет») и цены/сроки
  тарифов остаются черновыми плейсхолдерами. Структуру сохранять, конкретные
  факты не выдумывать.
```

- [ ] **Step 2: Форма и scope в Capabilities and Constraints**

Найти:
```
- Форма обратной связи — визуальная заглушка без отправки и без бэкенда. Это
  осознанное решение, а не незавершённость.
```
Заменить на:
```
- Форма обратной связи реально отправляет заявку: POST на `send.php` (PHP),
  который пересылает её в Telegram-бот. Токен бота хранится только на сервере
  (`config.php`, вне git), не в клиентском коде.
```

И найти в том же разделе строку про вне scope:
```
- Вне scope: реальная отправка формы и бэкенд, CMS/блог, мультиязычность,
```
Заменить на:
```
- Вне scope: CMS/блог, мультиязычность,
```

- [ ] **Step 3: WhatsApp → MAX**

Найти в `## Capabilities and Constraints`:
```
- Целевое действие: обращение в мессенджер (Telegram/WhatsApp/Email/телефон)
  как основной путь; демо-форма — вторичный путь.
```
Заменить на:
```
- Целевое действие: обращение в мессенджер (Telegram/MAX/Email/телефон)
  как основной путь; форма заявки — вторичный путь.
```

- [ ] **Step 4: Проверить**

Run:
```powershell
(Select-String -Path PRODUCT.md -Pattern 'WhatsApp|визуальная заглушка|реальная отправка формы и бэкенд' -Quiet)
```
Expected: `False`.

- [ ] **Step 5: Commit**

```bash
git add PRODUCT.md
git commit -m "docs: update PRODUCT.md for real contacts and working form"
```

---

## Task 6: Сквозная проверка (dry-run) и чек-лист бота

**Files:** (без изменений кода; проверка)

- [ ] **Step 1: Проверить backend напрямую через CLI-сервер**

Предусловие: `config.php` с `DRY_RUN = true`.
Run (окно 1): `php -S localhost:8000`
Run (окно 2):
```powershell
curl.exe -s -X POST -H "Accept: application/json" -d "name=Тест&contact=artkull@gmail.com" http://localhost:8000/send.php; echo ""
curl.exe -s -o NUL -w "%{http_code}`n" -X POST -H "Accept: application/json" -d "name=Тест&contact=artkull@gmail.com" http://localhost:8000/send.php
curl.exe -s -o NUL -w "%{http_code}`n" -X POST -H "Accept: application/json" -d "name=A&contact=artkull@gmail.com" http://localhost:8000/send.php
curl.exe -s -o NUL -w "%{http_code}`n" -X POST -H "Accept: application/json" -d "name=Тест&contact=x&website=bot" http://localhost:8000/send.php
curl.exe -s -o NUL -w "%{http_code}`n" -X GET http://localhost:8000/send.php
```
Expected: тело `{"ok":true}`; коды по порядку `200` (валидно), `400` (короткое имя), `200` (honeypot — тихий успех), `405` (GET). Повторить валидный POST 6 раз подряд → 6-й даёт `429`.

- [ ] **Step 2: Проверить контактные ссылки**

Run: `Start-Process index.html`
Ожидаемо (клик): Telegram → `t.me/ArtKull`; MAX → `max.ru/u/…`; Email → почтовый клиент; Телефон → `tel:`; GitHub/VK → профили.

- [ ] **Step 3: Чек-лист боевой настройки бота**

1. Telegram → `@BotFather` → `/newbot` → имя и username → получить токен.
2. Написать своему боту сообщение (или добавить в целевой чат/группу; для группы — сделать бота админом).
3. Открыть `https://api.telegram.org/bot<TOKEN>/getUpdates` → взять `message.chat.id` (для группы — отрицательный), либо написать `@userinfobot`.
4. На сервере: `cp config.example.php config.php`, вписать `BOT_TOKEN`, `CHAT_ID`, поставить `DRY_RUN = false`.
5. Убедиться, что `config.php` не отдаётся вебом (`https://<домен>/config.php` → 403) и отсутствует в git (`git status` — не видит).
6. Отправить тестовую заявку с сайта → сообщение пришло в чат.

- [ ] **Step 4: Финальный commit (если были правки конфигов-примеров)**

```bash
git add -A
git commit -m "chore: finalize telegram form integration"
```

---

## Самопроверка плана

- **Покрытие спеки:** контакты/имя/иконка/CTA (§3) → Task 1; архитектура и поток (§4) → Tasks 2–3, 4; фронтенд (§5) → Task 4; backend (§6) → Task 3; конфиг/секреты (§7) → Task 3; инструкция бота (§8) → Task 6; обработка ошибок (§9) → Tasks 3–4; доступность (§10) → Task 4 (aria-live/фокус/aria-busy); тестирование (§11) → Tasks 2, 4, 6; файлы (§12) → все задачи; документация (§13) → Task 5; риски (§14) → учтены в Task 3/6.
- **Placeholder-скан:** заглушек «TBD/TODO» нет; в `config.example.php` строки `PASTE_BOT_TOKEN_HERE` — намеренные образцы, не пропуски.
- **Согласованность имён:** функции `artkull_*` и константы `BOT_TOKEN`/`CHAT_ID`/`DRY_RUN`/`RATE_MAX`/`RATE_WINDOW`/`RATE_DIR` совпадают во всех задачах и в спеке.
- **Уточнение к спеке:** чистая логика вынесена в `lib/submit.php` + CLI-тест `tests/submit_test.php` (runtime-зависимостей не добавилось; тест не выполняется по HTTP — guard `PHP_SAPI !== 'cli'`). Иконка MAX — цветной `assets/max.svg` (спека обновлена).
