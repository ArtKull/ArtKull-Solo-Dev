# AGENTS.md

## Язык

Отвечай пользователю на русском языке. Пользовательский текст, документация и
комментарии в коде — на русском (комментарии добавлять только по запросу).

## Проект

Статический одностраничный лендинг **ArtKull** — сайт персонального
веб-разработчика. Стек: чистый HTML5 + CSS3 + vanilla JS, **без сборщика и
фреймворков**. Целевое действие — заявка через форму (Cloud Function в Yandex
Cloud → MAX) или обращение в мессенджер.

Назначение, аудитория, бренд и жёсткие ограничения — в `PRODUCT.md`.
Визуальный язык и дизайн-токены — в `DESIGN.md`. Перед правками этих областей
прочитай соответствующий файл; спецификацию бренда/дизайна не пересматривай
самовольно.

## Node

Node.js **не добавлен в PATH**. Используй бандленный runtime:

```
C:\Users\kulchinskiy.ai\AppData\Local\OpenAI\Codex\runtimes\cua_node\03b1cdac8af3a530\bin\node.exe
```

В PowerShell удобно завести переменную на время сессии:

```powershell
$node = "C:\Users\kulchinskiy.ai\AppData\Local\OpenAI\Codex\runtimes\cua_node\03b1cdac8af3a530\bin\node.exe"
& $node --version   # v24.x
```

Если путь перестанет существовать — найди актуальный runtime в
`C:\Users\kulchinskiy.ai\AppData\Local\OpenAI\Codex\runtimes\cua_node\`.

## Команды

Из корня репозитория (`$node` — путь выше):

- **Тесты:** `& $node --test` — прогоняет `tests/` и `yc/form/test/`
  (фреймворк — встроенный `node:test`).
- **Проверка CSS-токенов:** `& $node tools/check-tokens.mjs` — падает, если в
  CSS есть неопределённые `var(--...)` или отсутствуют обязательные токены.
- **Иконки:** `& $node tools/make-icons.mjs` — пересобирает `favicon.ico` и PNG.
- **Шрифты:** `& $node tools/fetch-fonts.mjs` — скачивает Inter/JetBrains Mono в
  `assets/fonts` и пересобирает `css/fonts.css` (нужен интернет).
- **Сборка ZIP функции:** `powershell -ExecutionPolicy Bypass -File yc/form/build-zip.ps1`.

Перед завершением задачи выполняй релевантные проверки (`& $node --test`,
`& $node tools/check-tokens.mjs`) и опирайся на их вывод, а не на предположения.
Отдельного линтера/typecheck нет.

## Структура

- `index.html`, `privacy.html`, `404.html` — страницы (одна длинная страница,
  навигация якорями).
- `css/` — `tokens.css` (дизайн-токены), `base.css`, `components.css`,
  `sections.css`, `fonts.css`, `legal.css`.
- `js/` — `app.js` (UI, тема, форма), `consent.js` (cookie-согласие; UMD, чтобы
  импортироваться в тестах).
- `assets/` — логотип, favicon, шрифты.
- `tests/` — тесты на `node:test` (SEO, consent, инструменты).
- `tools/` — служебные Node-скрипты (`.mjs`).
- `yc/` — Cloud Function `artkull-form`, спецификация API Gateway и пошаговая
  инструкция по развёртыванию в `yc/SETUP.md`.
- `docs/` — спеки и планы; рабочие отчёты и диффы — в `.superpowers/`.

## Конвенции

- **Коммиты** — Conventional Commits на английском:
  `feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `test(scope): ...`,
  `refactor(scope): ...`.
- **Дизайн.** Соблюдай токены из `DESIGN.md`: текст градиентом не набирать,
  числа/цены/статусы — только JetBrains Mono, не более двух свечений в кадре,
  сохранять `focus-visible` и `prefers-reduced-motion`. Обязательный уровень —
  WCAG AA.
- **Честность.** Метрики, цены, отзывы, кейсы и портфолио **не выдумывать**:
  черновые значения помечать, отсутствующие факты не фабриковать (см.
  `PRODUCT.md`).
- **Сгенерированное не редактировать вручную** (`css/fonts.css`,
  `assets/fonts`, иконки) — пересобирай через `tools/`.
- **Секреты** (`MAX_TOKEN`, `TURNSTILE_SECRET` и пр.) — только в переменных
  окружения Cloud Function. Никогда не коммить их и не встраивать в клиентский
  код или репозиторий.
