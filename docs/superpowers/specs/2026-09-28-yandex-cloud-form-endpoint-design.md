# Спека: отправка формы через Yandex Cloud (API Gateway + Cloud Function)

- **Дата:** 2026-09-28
- **Статус:** утверждён дизайн, готово к планированию
- **Связанные документы:** `PRODUCT.md`, предыдущая спека
  `2026-09-27-contacts-and-telegram-form-design.md`

## 1. Цель

Сайт размещён на GitHub Pages и обновляется при каждом пуше. GitHub Pages
не исполняет PHP, поэтому текущий обработчик `send.php` (и `lib/submit.php`) на
проде недоступен и форма не работает. Нужно вынести приём и отправку заявки во
внешний сервис — Yandex Cloud — и обращаться к нему по публичной ссылке.

Успех: заявка из формы на `artkull.ru` доставляется в Telegram-чат; секреты
(токен бота) не попадают в клиентский код и в репозиторий; публичная точка входа
защищена от спама; пользователь видит понятную обратную связь, а при сбое —
fallback на прямые контакты.

## 2. Область

**Входит:**

- Cloud Function на Node.js, переносящая логику `lib/submit.php` / `send.php`
  (honeypot, валидация, время, IP/UA, отправка в Telegram, JSON-контракт).
- API Gateway перед функцией: маршрут, CORS, rate-limit, кастомный домен
  `api.artkull.ru` с TLS-сертификатом.
- Изменение фронтенда (`js/app.js`, `index.html`) на новый URL и тело запроса.
- Удаление PHP-бэкенда и связанных файлов из репозитория.
- Обновление `PRODUCT.md`, README деплоя функции и этой спеки.

**Не входит:**

- Метрики, цены/сроки тарифов, тексты — без изменений.
- Уведомления в MAX, аналитика, CMS, мультиязычность — без изменений.
- Капча (остаются honeypot + rate-limit).
- Автоматизированный CI/CD деплой функции (деплой — вручную через консоль/CLI;
  возможный следующий шаг, отдельная работа).

## 3. Архитектура и поток данных

```
artkull.ru (GitHub Pages, статика)
  │  fetch POST  application/x-www-form-urlencoded
  │  (simple request → preflight не требуется)
  ▼
api.artkull.ru  ──►  API Gateway (YC)
  │   • TLS: сертификат YC Certificate Manager (Let's Encrypt)
  │   • CORS: Access-Control-Allow-Origin строго для домена
  │   • rate-limit по IP
  ▼
Cloud Function «artkull-form» (Node.js 18+, без зависимостей)
  │   • honeypot → тихий ok (без отправки)
  │   • валидация name / contact
  │   • fetch → https://api.telegram.org/bot{TOKEN}/sendMessage
  │   • ответ {ok, error?} + HTTP-код
  ▼
Telegram-бот → чат (BOT_TOKEN, CHAT_ID — только в env функции)

Без JS: <form action="https://api.artkull.ru/" method="post">
  → API Gateway → функция возвращает HTML-страницу при Accept: text/html
```

Функция **не является публичной**: её может вызывать только сервисный аккаунт
API Gateway. Единственная публичная точка входа — домен `api.artkull.ru`,
к которому привязаны CORS и ограничение частоты.

## 4. Контракт API (фронт ↔ шлюз)

- **Метод:** `POST /` (корень домена).
- **Content-Type:** `application/x-www-form-urlencoded`.
  (Safelisted тип → запрос остаётся «simple», preflight не нужен.)
- **Поля тела:** `name`, `contact`, `website` (honeypot, пустой у людей).
- **Заголовки запроса:** `Accept: application/json` (при fetch) либо
  `text/html` (нативный POST без JS).
- **Успех:** `200`, `{"ok":true}`.
- **Ошибка:** `{"ok":false,"error":"<machine-code>"}` с кодами:

  | Код | Условие |
  |---|---|
  | `400` | `invalid_name_length` / `invalid_contact_length` / `invalid_contact_format` |
  | `405` | метод не `POST` |
  | `429` | превышен лимит частоты |
  | `500` | сбой Telegram / конфигурации |

- **CORS-ответ:** `Access-Control-Allow-Origin: https://artkull.ru`,
  `Access-Control-Allow-Methods: POST, OPTIONS`,
  `Access-Control-Allow-Headers: Content-Type, Accept`.
- Контракт совпадает с текущим PHP, поэтому обработка ошибок в `js/app.js`
  (`error === 'invalid_name_length'` и т.п.) остаётся без изменений.
- Через шлюз маршрутизируется только `POST`/`OPTIONS`, поэтому `GET` до функции
  не доходит (шлюз ответит `404`) — код `405` функция отдаёт лишь при прямом
  вызове (тесты, отладка). Для клиента это несущественно.

## 5. Cloud Function (Node.js)

**Файлы** (папка `yc/form/`):

- `index.js` — экспорт `module.exports.handler = async (event, context) => {...}`.
- `package.json` — имя, `engines.node >= 18`, без зависимостей.
- `README.md` — команды деплоя и список env-переменных.

**Вход** (событие API Gateway): `event.body` (строка, возможно base64 с флагом
`event.isBase64Encoded`), `event.headers`, `event.requestContext.identity.sourceIp`.

**Выход:** `{ statusCode, headers, body }`; функция сама выставляет
`Content-Type` и CORS-заголовки.

**Логика (перенос с PHP):**

1. `method`/`requestContext` → если не `POST` → `405`.
2. Разбор тела: base64 (если нужно) → `URLSearchParams`.
3. Honeypot `website` непусто → `200 {ok:true}` без отправки.
4. Валидация (источник истины — сервер):
   - `name`: trim, нормализация пробелов, 2–80 символов;
   - `contact`: trim, 5–120, и похож на email либо телефон (те же regex, что в
     `lib/submit.php:25`/`lib/submit.php:42`);
   - ошибки → `400` с кодом.
5. IP из `requestContext.identity.sourceIp`; `user-agent` из заголовков.
6. Время `Asia/Yekaterinburg` через `Intl.DateTimeFormat`.
7. Сборка текста сообщения с HTML-экранированием пользовательского ввода.
8. `DRY_RUN=true` → только `console.log`, вернуть `200 {ok:true}`.
9. Иначе `fetch` к Telegram Bot API (`parse_mode=HTML`,
   `disable_web_page_preview=true`); `ok:true` → `200`, иначе → `500`.
10. Если `Accept` содержит `text/html` — вернуть минимальную HTML-страницу
    подтверждения/ошибки со ссылкой на `/`, иначе JSON.

**Переменные окружения функции:**

| Переменная | Назначение |
|---|---|
| `BOT_TOKEN` | токен бота (секретная) |
| `CHAT_ID` | получатель заявок |
| `ALLOWED_ORIGIN` | `https://artkull.ru` (можно перечислить через запятую) |
| `DRY_RUN` | `true`/`false` |
| `RATE_MAX` | лимит заявок на IP для внутреннего счётчика функции |
| `RATE_WINDOW` | окно внутреннего счётчика в секундах |

Внутренний rate-limit — best-effort, в памяти тёплого экземпляра: нужен, чтобы
вернуть фронту machine-code `rate_limited` и показать понятный текст. Жёсткий
внешний предел задаётся на API Gateway (см. §6); вместе они дают двухуровневую
защиту. Значения по умолчанию: `RATE_MAX=5`, `RATE_WINDOW=600`.

## 6. API Gateway

- Спецификация OpenAPI (пример; точный синтаксис полей сверить в консоли):

```yaml
openapi: 3.0.0
info:
  title: ArtKull form
  version: 1.0.0
paths:
  /:
    post:
      operationId: submitForm
      x-yc-apigateway-integration:
        type: cloud-functions
        function_id: <FUNCTION_ID>
    options:
      operationId: corsPreflight
      x-yc-apigateway-integration:
        type: dummy
        http_code: 204
        http_headers:
          Access-Control-Allow-Origin: https://artkull.ru
          Access-Control-Allow-Methods: POST, OPTIONS
          Access-Control-Allow-Headers: Content-Type, Accept
      responses:
        '204':
          description: CORS preflight
```

- **Сервисный аккаунт шлюза:** роль `functions.invoke` на функцию.
- **Функция не публичная:** публичный вызов отключить, доступ — только сервисному
  аккаунту шлюза.
- **Rate-limit:** двухуровневый.
  - API Gateway — жёсткий внешний предел по IP (например, ~10 запросов/минуту).
    Точный синтаксис (поле спецификации либо настройка в консоли) уточняется на
    этапе настройки.
  - Функция — best-effort счётчик в памяти (см. §5), возвращает `429` с телом
    `{"ok":false,"error":"rate_limited"}`, чтобы фронт показал понятное
    сообщение. Если жёсткий предел шлюза срабатывает раньше, фронт получит
    не-JSON `429`; `js/app.js` уже обрабатывает это через `bad_response` и
    показывает общий текст ошибки — это допустимо.
- **Кастомный домен:** `api.artkull.ru` + сертификат Certificate Manager.

## 7. Домен, сертификат, DNS

1. В Certificate Manager выпустить сертификат на `api.artkull.ru`
   (Let's Encrypt, DNS-валидация).
2. Добавить у регистратора DNS CNAME-запись валидации, дождаться статуса
   `Issued`.
3. Привязать домен к API Gateway (указать сертификат и хост). YC выдаст
   CNAME-значение для домена.
4. Добавить CNAME `api` → выданное значение у регистратора.
5. Проверить `https://api.artkull.ru/` (ожидаемый ответ — невалидный метод/тело).

Записи apex/`www` для GitHub Pages не затрагиваются — поддомен независим.

## 8. Изменения в репозитории

| Файл | Изменение |
|---|---|
| `js/app.js` | URL отправки — константа с `https://api.artkull.ru/`; тело — `URLSearchParams` (`name`, `contact`, `website`) вместо `FormData`; логика состояний/валидации не меняется |
| `index.html` | `action="https://api.artkull.ru/"` (для деградации без JS), `method="post"` |
| `send.php` | удалить |
| `config.example.php` | удалить |
| `lib/submit.php` | удалить |
| `.htaccess` | удалить (GitHub Pages его игнорирует) |
| `tests/submit_test.php` | удалить (PHP-логики больше нет) |
| `yc/form/index.js` | добавить (обработчик Node.js) |
| `yc/form/package.json` | добавить |
| `yc/form/README.md` | добавить (деплой, env, проверка) |
| `PRODUCT.md` | описать новый бэкенд (YC), убрать упоминания PHP/хостинга |
| `.gitignore` | убрать упоминание `config.php`, если оно там было |

## 9. Безопасность

- Токен бота — только в env функции (помечается секретным в консоли),
  не логируется, не отдаётся клиенту.
- Публичный вход один — домен шлюза; функция вызывается только сервисным
  аккаунтом.
- CORS ограничен `https://artkull.ru`, поэтому сторонний сайт не сможет
  прочитать ответ; от автоматических POST защищают honeypot и rate-limit.
- `X-Content-Type-Options: nosniff` в ответах функции (как в текущем `send.php`).
- Опциональное ужесточение (вне scope): переместить `BOT_TOKEN` в Yandex
  Lockbox вместо env.

## 10. Прогрессивное улучшение (без JS)

Форма сохраняет `action` на URL шлюза. Без JS браузер делает нативный
кросс-доменный POST и показывает HTML-ответ функции (подтверждение или ошибку
со ссылкой «← На главную» → `https://artkull.ru/`). С включённым JS отправка
идёт через `fetch`, как сейчас.

## 11. Тестирование

1. **Локально/unit:** вызвать функцию с `DRY_RUN=true` и проверить: валидную
   заявку (`200 ok`), невалидные поля (`400`), honeypot (тихий `200`), GET
   (`405`).
2. **Через шлюз:** `curl` на `api.artkull.ru` — корректные коды и CORS-заголовки.
3. **Браузер на GitHub Pages:** реальная отправка из формы; в консоли нет
   CORS/сетевых ошибок; приходит сообщение в Telegram.
4. **Негативные сценарии:** невалидные данные, превышение rate-limit (`429`),
   оффлайн — фронт показывает error + fallback.
5. **Без JS:** отключить JS и отправить форму — увидеть HTML-подтверждение.

## 12. Стоимость и квоты

- Cloud Functions и API Gateway имеют бесплатный уровень; при ожидаемом объёме
  заявок (единицы в день) расходы близки к нулю.
- Certificate Manager — бесплатно для YC-сертификатов.
- Точные квоты и биллинг сверить в консоли перед деплоем.

## 13. Пошаговая инструкция для владельца (обзор)

Детализация будет в плане реализации. Крупные шаги:

1. Создать каталог (folder) в YC, при необходимости — платёжный аккаунт.
2. Создать сервисный аккаунт `artkull-form-gateway` с ролью `functions.invoke`.
3. Создать функцию `artkull-form` (Node.js 18), загрузить код из `yc/form/`,
   задать env-переменные (`BOT_TOKEN`, `CHAT_ID`, `ALLOWED_ORIGIN`, `DRY_RUN`).
4. Отключить публичный вызов функции; выдать права сервисному аккаунту.
5. Создать API Gateway со спецификацией, привязать сервисный аккаунт.
6. Выпустить сертификат на `api.artkull.ru`, подтвердить DNS-валидацию.
7. Привязать домен к API Gateway, добавить CNAME `api` у регистратора.
8. Прогнать тестовую заявку, затем переключить `DRY_RUN=false` и проверить
   боевую отправку в Telegram.

## 14. Риски и ограничения

- **Точный синтаксис YC** (rate-limit в спецификации, формат dummy-интеграции,
  привязка домена) может отличаться в консоли — уточнить на этапе настройки.
- **Публичный URL** без капчи: при росте спама — добавить капчу/очередь.
- **DNS-пропагация** сертификата и домена может занять от минут до часов.
- **Дубли:** двойная отправка исключена блокировкой кнопки на время запроса.
- **Кросс-доменный POST** технически возможен и с чужого сайта; защита —
  honeypot + rate-limit (как и раньше).
- **PHP-окружение** больше не требуется; после удаления файлов нужно убедиться,
  что GitHub Pages не ссылается на удалённые ресурсы.

## 15. Обновления документации

- `PRODUCT.md`: описать бэкенд на YC (API Gateway + Cloud Function), убрать
  упоминания PHP-хостинга; контакты/поведение формы без изменений.
- `yc/form/README.md`: команды деплоя функции, список env, тестовые `curl`.
- Этот файл спеки — источник истины для плана реализации.
