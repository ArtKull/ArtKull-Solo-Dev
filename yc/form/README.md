# Cloud Function `artkull-form`

Принимает заявку с сайта ArtKull и отправляет её в Telegram.

## Состав

- `index.js` — точка входа (`index.handler`).
- `lib/validate.js` — валидация и текст сообщения.
- `lib/telegram.js` — отправка в Telegram Bot API.
- `lib/handler.js` — обработка события API Gateway.
- `test/` — юнит-тесты (`node --test`).

Зависимостей нет; требуется Node.js 18+.

## Тесты

```bash
npm test --prefix yc/form
```

## Переменные окружения

| Переменная | Пример | Назначение |
|---|---|---|
| `BOT_TOKEN` | `123:ABC` | токен бота (секрет) |
| `CHAT_ID` | `123456789` | получатель заявок |
| `ALLOWED_ORIGIN` | `https://artkull.ru` | CORS |
| `DRY_RUN` | `true` / `false` | без реальной отправки |
| `RATE_MAX` | `5` | лимит на IP в памяти функции |
| `RATE_WINDOW` | `600` | окно в секундах |

## Сборка ZIP для консоли

> Не используйте `Compress-Archive` из PowerShell 5.1: он пишет разделители как
> `lib\handler.js` (обратный слэш). Linux-рантайм YC не создаёт из такой записи
> папку `lib`, и функция падает с `Cannot find module './lib/handler'`.
> Используйте `tar` (входит в Windows 10+) — он пишет пути через `/`.

Готовый скрипт со сборкой и проверкой содержимого:

```powershell
powershell -ExecutionPolicy Bypass -File yc/form/build-zip.ps1
```

Вручную из каталога `yc/form` (содержимое, не сама папка; `index.js` в корне):

```powershell
tar -a -c -f ..\artkull-form.zip index.js package.json lib
tar -tf ..\artkull-form.zip
```

Ожидаемое содержимое архива (пути через прямой слэш):

```
index.js
package.json
lib/
lib/handler.js
lib/telegram.js
lib/validate.js
```

Загружайте `yc\artkull-form.zip`; точка входа при создании версии — `index.handler`.

## Быстрая проверка после деплоя

```bash
curl -i -X POST https://api.artkull.ru/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  --data "name=Тест&contact=test@example.com"
```

Ожидается `200` и `{"ok":true}` (при `DRY_RUN=true` — без Telegram).
