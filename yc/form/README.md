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

Из каталога `yc/form` сложить содержимое (не саму папку) так, чтобы
`index.js` был в корне архива:

```powershell
Compress-Archive -Path index.js, package.json, lib -DestinationPath ..\artkull-form.zip -Force
```

Точка входа при создании версии — `index.handler`.

## Быстрая проверка после деплоя

```bash
curl -i -X POST https://api.artkull.ru/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  --data "name=Тест&contact=test@example.com"
```

Ожидается `200` и `{"ok":true}` (при `DRY_RUN=true` — без Telegram).
