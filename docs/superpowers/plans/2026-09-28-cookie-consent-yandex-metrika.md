# Согласие на Яндекс.Метрику + самохостинг шрифтов — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Не загружать Яндекс.Метрику (и не ставить её cookie) до явного согласия посетителя, дать отозвать согласие, и убрать обращения к Google Fonts через самохостинг шрифтов.

**Architecture:** Статический сайт без сборщика. Новый модуль `js/consent.js` (vanilla JS, без зависимостей) хранит решение в `localStorage`, показывает немодальный баннер и только после согласия вставляет тег Метрики. Чистая логика модуля покрыта юнит-тестами через встроенный `node:test`; браузерная часть проверяется вручную. Шрифты скачиваются тем же Node.js в `assets/fonts/` скриптом `tools/fetch-fonts.mjs`.

**Tech Stack:** HTML/CSS/JavaScript (ES5-совместимый), Node.js 18+ (`node:test`, глобальный `fetch`), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-28-cookie-consent-yandex-metrika-design.md`

## Global Constraints

- **Ноль внешних зависимостей**: только стандартная библиотека Node.js; тесты —
  встроенный `node:test`, никаких npm-пакетов.
- **Без сборщика и препроцессоров**: файлы отдаются как есть; JS — совместимый с
  браузерами без транспиляции (стиль существующего `js/app.js`: `var`, функции).
- **Без комментариев в новом коде** (стиль проекта; комментарии по-русски не
  добавлять).
- Аналитика не должна грузиться до согласия. После выполнения всех задач в
  проекте не остаётся обращений к `fonts.googleapis.com` / `fonts.gstatic.com`.
- `webvisor` **не** используется.
- Тексты интерфейса — на русском.
- Не менять логику формы заявки, темы и мобильного меню.
- Тесты запускаются командами `node --test tests/consent.test.js` и
  `node --test tests/fetch-fonts.test.mjs`.

---

## File Structure

**Создаются:**

- `js/consent.js` — чистые функции согласия (экспортируются для тестов) +
  браузерная обвязка: баннер, загрузка Метрики, отзыв.
- `tests/consent.test.js` — юнит-тесты чистой логики (`node:test`).
- `tools/fetch-fonts.mjs` — скачивание `woff2` (latin + cyrillic) и генерация
  `css/fonts.css`; чистые функции экспортируются.
- `tests/fetch-fonts.test.mjs` — юнит-тесты парсера/генератора.
- `css/fonts.css` — сгенерированный файл `@font-face` (коммитится).
- `assets/fonts/*.woff2`, `assets/fonts/OFL.txt` — файлы шрифтов и лицензия
  (коммитятся).

**Изменяются:**

- `index.html` — удалить счётчик и `<noscript>`; добавить баннер, кнопку
  «Настройки cookie», `js/consent.js`; убрать Google Fonts, подключить
  `css/fonts.css`.
- `css/components.css` — стили `.cookie-banner` и `.footer__link`.
- `privacy.html` — абзац о согласии и отзыве; убрать Google Fonts, подключить
  `css/fonts.css`.
- `PRODUCT.md` — аналитика с согласием; убрать исключение «кроме Google Fonts».

---

## Task 1: Чистая логика согласия

**Files:**
- Create: `js/consent.js`
- Test: `tests/consent.test.js`

**Interfaces:**
- Consumes: ничего.
- Produces (экспорт через `module.exports`):
  - `CONSENT_STORAGE_KEY: string` = `'artkull-consent'`
  - `CONSENT_VERSION: number` = `1`
  - `METRIKA_ID: number` = `113122431`
  - `METRIKA_SRC: string`
  - `parseConsent(raw: unknown): { value: 'granted'|'denied', ts: string } | null`
  - `serializeConsent(value: 'granted'|'denied', date?: Date): string`
  - `readConsent(storage: Storage|null): { value, ts } | null`
  - `writeConsent(storage: Storage|null, value, date?: Date): boolean`
  - `initialAction(record: { value } | null): 'load' | 'show' | 'ignore'`
  - `isMetrikaCookie(name: unknown): boolean`

- [ ] **Step 1: Write the failing test**

`tests/consent.test.js`:

```js
'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const consent = require('../js/consent.js')

function fakeStorage(initial) {
  const map = new Map(Object.entries(initial || {}))
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null },
    setItem(key, value) { map.set(key, String(value)) },
    removeItem(key) { map.delete(key) }
  }
}

test('parseConsent: корректная запись', () => {
  const rec = consent.parseConsent('{"v":1,"value":"granted","ts":"2026-09-28T12:00:00.000Z"}')
  assert.deepEqual(rec, { value: 'granted', ts: '2026-09-28T12:00:00.000Z' })
})

test('parseConsent: мусор и неверная версия → null', () => {
  assert.equal(consent.parseConsent(null), null)
  assert.equal(consent.parseConsent(''), null)
  assert.equal(consent.parseConsent('{'), null)
  assert.equal(consent.parseConsent('{"v":2,"value":"granted"}'), null)
  assert.equal(consent.parseConsent('{"v":1,"value":"maybe"}'), null)
})

test('serializeConsent: пишет версию и ISO-время', () => {
  const iso = consent.serializeConsent('denied', new Date('2026-09-28T12:00:00.000Z'))
  assert.equal(iso, '{"v":1,"value":"denied","ts":"2026-09-28T12:00:00.000Z"}')
})

test('serializeConsent/parseConsent: round-trip', () => {
  const iso = consent.serializeConsent('granted', new Date('2026-01-02T03:04:05.000Z'))
  assert.deepEqual(consent.parseConsent(iso), {
    value: 'granted',
    ts: '2026-01-02T03:04:05.000Z'
  })
})

test('readConsent/writeConsent работают с хранилищем', () => {
  const store = fakeStorage()
  assert.equal(consent.readConsent(store), null)
  assert.equal(consent.writeConsent(store, 'granted', new Date('2026-09-28T12:00:00.000Z')), true)
  assert.deepEqual(consent.readConsent(store), {
    value: 'granted',
    ts: '2026-09-28T12:00:00.000Z'
  })
})

test('readConsent/writeConsent терпят сбой хранилища', () => {
  const broken = {
    getItem() { throw new Error('blocked') },
    setItem() { throw new Error('blocked') }
  }
  assert.equal(consent.readConsent(broken), null)
  assert.equal(consent.writeConsent(broken, 'granted'), false)
})

test('initialAction по записи', () => {
  assert.equal(consent.initialAction(null), 'show')
  assert.equal(consent.initialAction({ value: 'granted' }), 'load')
  assert.equal(consent.initialAction({ value: 'denied' }), 'ignore')
})

test('isMetrikaCookie распознаёт cookie Метрики', () => {
  assert.equal(consent.isMetrikaCookie('_ym_uid'), true)
  assert.equal(consent.isMetrikaCookie('_ym_d'), true)
  assert.equal(consent.isMetrikaCookie('ymex'), true)
  assert.equal(consent.isMetrikaCookie('yandexuid'), true)
  assert.equal(consent.isMetrikaCookie('sessionid'), false)
  assert.equal(consent.isMetrikaCookie(''), false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/consent.test.js`
Expected: FAIL — `Cannot find module '../js/consent.js'`.

- [ ] **Step 3: Write minimal implementation**

`js/consent.js`:

```js
;(function () {
  var CONSENT_STORAGE_KEY = 'artkull-consent'
  var CONSENT_VERSION = 1
  var METRIKA_ID = 113122431
  var METRIKA_SRC = 'https://mc.yandex.ru/metrika/tag.js?id=' + METRIKA_ID
  var METRIKA_COOKIE_EXACT = ['ymex', 'yandexuid', 'yuidss', 'i']

  function parseConsent(raw) {
    if (typeof raw !== 'string' || raw === '') {
      return null
    }
    var data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      return null
    }
    if (!data || typeof data !== 'object') {
      return null
    }
    if (data.v !== CONSENT_VERSION) {
      return null
    }
    if (data.value !== 'granted' && data.value !== 'denied') {
      return null
    }
    return { value: data.value, ts: typeof data.ts === 'string' ? data.ts : '' }
  }

  function serializeConsent(value, date) {
    var when = date instanceof Date ? date : new Date()
    return JSON.stringify({ v: CONSENT_VERSION, value: value, ts: when.toISOString() })
  }

  function readConsent(storage) {
    if (!storage) {
      return null
    }
    var raw
    try {
      raw = storage.getItem(CONSENT_STORAGE_KEY)
    } catch (e) {
      return null
    }
    return parseConsent(raw)
  }

  function writeConsent(storage, value, date) {
    if (!storage) {
      return false
    }
    try {
      storage.setItem(CONSENT_STORAGE_KEY, serializeConsent(value, date))
      return true
    } catch (e) {
      return false
    }
  }

  function initialAction(record) {
    if (!record) {
      return 'show'
    }
    return record.value === 'granted' ? 'load' : 'ignore'
  }

  function isMetrikaCookie(name) {
    var n = String(name == null ? '' : name).replace(/^\s+|\s+$/g, '').toLowerCase()
    if (n === '') {
      return false
    }
    if (n.indexOf('_ym') === 0) {
      return true
    }
    return METRIKA_COOKIE_EXACT.indexOf(n) !== -1
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONSENT_STORAGE_KEY: CONSENT_STORAGE_KEY,
      CONSENT_VERSION: CONSENT_VERSION,
      METRIKA_ID: METRIKA_ID,
      METRIKA_SRC: METRIKA_SRC,
      parseConsent: parseConsent,
      serializeConsent: serializeConsent,
      readConsent: readConsent,
      writeConsent: writeConsent,
      initialAction: initialAction,
      isMetrikaCookie: isMetrikaCookie
    }
  }
})()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/consent.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add js/consent.js tests/consent.test.js
git commit -m "feat(consent): add pure consent logic with tests"
```

---

## Task 2: Браузерная обвязка согласия

**Files:**
- Modify: `js/consent.js`

**Interfaces:**
- Consumes: экспортированные функции Task 1.
- Produces (в браузере, не экспортируется): `loadMetrika()`, `deleteMetrikaCookies()`,
  `initConsent()`; точки входа — элементы `#cookie-banner`, `[data-consent]`,
  `[data-consent-settings]`.

- [ ] **Step 1: Заменить содержимое `js/consent.js` на полную версию**

Полный итоговый файл (чистая часть из Task 1 сохраняется без изменений, ниже —
полный текст для однозначности):

```js
;(function () {
  var CONSENT_STORAGE_KEY = 'artkull-consent'
  var CONSENT_VERSION = 1
  var METRIKA_ID = 113122431
  var METRIKA_SRC = 'https://mc.yandex.ru/metrika/tag.js?id=' + METRIKA_ID
  var METRIKA_COOKIE_EXACT = ['ymex', 'yandexuid', 'yuidss', 'i']

  function parseConsent(raw) {
    if (typeof raw !== 'string' || raw === '') {
      return null
    }
    var data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      return null
    }
    if (!data || typeof data !== 'object') {
      return null
    }
    if (data.v !== CONSENT_VERSION) {
      return null
    }
    if (data.value !== 'granted' && data.value !== 'denied') {
      return null
    }
    return { value: data.value, ts: typeof data.ts === 'string' ? data.ts : '' }
  }

  function serializeConsent(value, date) {
    var when = date instanceof Date ? date : new Date()
    return JSON.stringify({ v: CONSENT_VERSION, value: value, ts: when.toISOString() })
  }

  function readConsent(storage) {
    if (!storage) {
      return null
    }
    var raw
    try {
      raw = storage.getItem(CONSENT_STORAGE_KEY)
    } catch (e) {
      return null
    }
    return parseConsent(raw)
  }

  function writeConsent(storage, value, date) {
    if (!storage) {
      return false
    }
    try {
      storage.setItem(CONSENT_STORAGE_KEY, serializeConsent(value, date))
      return true
    } catch (e) {
      return false
    }
  }

  function initialAction(record) {
    if (!record) {
      return 'show'
    }
    return record.value === 'granted' ? 'load' : 'ignore'
  }

  function isMetrikaCookie(name) {
    var n = String(name == null ? '' : name).replace(/^\s+|\s+$/g, '').toLowerCase()
    if (n === '') {
      return false
    }
    if (n.indexOf('_ym') === 0) {
      return true
    }
    return METRIKA_COOKIE_EXACT.indexOf(n) !== -1
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONSENT_STORAGE_KEY: CONSENT_STORAGE_KEY,
      CONSENT_VERSION: CONSENT_VERSION,
      METRIKA_ID: METRIKA_ID,
      METRIKA_SRC: METRIKA_SRC,
      parseConsent: parseConsent,
      serializeConsent: serializeConsent,
      readConsent: readConsent,
      writeConsent: writeConsent,
      initialAction: initialAction,
      isMetrikaCookie: isMetrikaCookie
    }
  }

  if (typeof document === 'undefined') {
    return
  }

  function safeStorage() {
    try {
      return window.localStorage
    } catch (e) {
      return null
    }
  }

  function loadMetrika() {
    if (window.__artkullMetrikaLoaded) {
      return
    }
    window.__artkullMetrikaLoaded = true
    ;(function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          ;(m[i].a = m[i].a || []).push(arguments)
        }
      m[i].l = 1 * new Date()
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) {
          return
        }
      }
      ;((k = e.createElement(t)),
        (a = e.getElementsByTagName(t)[0]),
        (k.async = 1),
        (k.src = r),
        a.parentNode.insertBefore(k, a))
    })(window, document, 'script', METRIKA_SRC, 'ym')

    window.ym(METRIKA_ID, 'init', {
      ssr: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    })
  }

  function deleteMetrikaCookies() {
    var hostname = window.location.hostname
    var cookies = String(document.cookie || '').split(';')
    for (var i = 0; i < cookies.length; i += 1) {
      var name = cookies[i].split('=')[0].replace(/^\s+|\s+$/g, '')
      if (!isMetrikaCookie(name)) {
        continue
      }
      document.cookie = name + '=; Max-Age=0; path=/'
      if (hostname) {
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + hostname
      }
    }
  }

  function showBanner(banner) {
    if (banner) {
      banner.hidden = false
    }
  }

  function hideBanner(banner) {
    if (banner) {
      banner.hidden = true
    }
  }

  function initConsent() {
    var storage = safeStorage()
    var banner = document.getElementById('cookie-banner')
    var record = readConsent(storage)
    var action = initialAction(record)

    function apply(value) {
      if (value === 'granted') {
        writeConsent(storage, 'granted', new Date())
        hideBanner(banner)
        loadMetrika()
        return
      }
      var previous = readConsent(storage)
      var wasGranted =
        (previous && previous.value === 'granted') || window.__artkullMetrikaLoaded
      writeConsent(storage, 'denied', new Date())
      hideBanner(banner)
      if (wasGranted) {
        deleteMetrikaCookies()
        window.location.reload()
      }
    }

    if (banner) {
      var buttons = banner.querySelectorAll('[data-consent]')
      for (var i = 0; i < buttons.length; i += 1) {
        buttons[i].addEventListener('click', function (e) {
          apply(e.currentTarget.getAttribute('data-consent'))
        })
      }
    }

    var settings = document.querySelector('[data-consent-settings]')
    if (settings) {
      settings.addEventListener('click', function () {
        showBanner(banner)
      })
    }

    if (action === 'load') {
      loadMetrika()
      return
    }
    if (action === 'show') {
      showBanner(banner)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsent)
  } else {
    initConsent()
  }
})()
```

- [ ] **Step 2: Убедиться, что чистые тесты не сломались**

Run: `node --test tests/consent.test.js`
Expected: PASS (8 tests) — `document` в Node не определён, обвязка не выполняется.

- [ ] **Step 3: Проверить синтаксис загрузки модуля**

Run: `node -e "require('./js/consent.js'); console.log('ok')"`
Expected: вывод `ok` без ошибок.

- [ ] **Step 4: Commit**

```bash
git add js/consent.js
git commit -m "feat(consent): add browser banner and gated Metrika loader"
```

---

## Task 3: Разметка в `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Удалить инлайн-счётчик и `<noscript>`**

Удалить в `index.html` весь блок от `<!-- Yandex.Metrika counter -->` до
`<!-- /Yandex.Metrika counter -->` (строки 72–118, вместе с обоими маркерами).
После удаления между закрывающим `</script>` скрипта темы и `</head>` не
остаётся ничего.

- [ ] **Step 2: Добавить разметку баннера**

В конец `<body>`, сразу после закрывающего тега `</footer>`, перед
`<script src="js/app.js" defer></script>`, добавить:

```html
		<div
			class="cookie-banner"
			id="cookie-banner"
			role="region"
			aria-label="Уведомление об использовании cookie"
			hidden
		>
			<div class="container cookie-banner__inner">
				<p class="cookie-banner__text">
					Используем файлы cookie для работы сайта, а Яндекс.Метрику — для
					улучшения сервиса. Вы согласны на сбор аналитических данных?
					Ознакомьтесь с
					<a href="privacy.html" target="_blank" rel="noopener"
						>Политикой конфиденциальности</a
					>.
				</p>
				<div class="cookie-banner__actions">
					<button type="button" class="btn btn--primary" data-consent="granted">
						Да, согласен
					</button>
					<button type="button" class="btn btn--ghost" data-consent="denied">
						Нет, спасибо
					</button>
				</div>
			</div>
		</div>
```

- [ ] **Step 3: Подключить `js/consent.js`**

После `<script src="js/app.js" defer></script>` добавить:

```html
		<script src="js/consent.js" defer></script>
```

- [ ] **Step 4: Добавить кнопку «Настройки cookie» в подвал**

Заменить блок `<span>© 2026 Артём Кульчинский · <a href="privacy.html">…</a></span>`
на:

```html
				<span
					>© 2026 Артём Кульчинский ·
					<a href="privacy.html"
						>Политика обработки персональных данных</a
					>
					·
					<button type="button" class="footer__link" data-consent-settings>
						Настройки cookie
					</button></span
				>
```

- [ ] **Step 5: Verify no counter remains and banner is wired**

Run: `git grep -n -E "Yandex.Metrika counter|mc\.yandex\.ru|noscript" -- index.html`
Expected: пусто.

Run: `git grep -n -E "cookie-banner|data-consent|js/consent\.js" -- index.html`
Expected: строка баннера, кнопки `data-consent`, кнопка `data-consent-settings`,
подключение `js/consent.js`.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(consent): gate Metrika behind consent banner in markup"
```

---

## Task 4: Стили баннера и кнопки подвала

**Files:**
- Modify: `css/components.css`

- [ ] **Step 1: Добавить стили в конец `css/components.css`**

```css
.cookie-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 120;
  padding: var(--space-3) 0;
  background: var(--surface-solid);
  border-top: 1px solid var(--border);
  box-shadow: var(--shadow-lifted);
  animation: cookie-banner-in var(--dur) var(--ease) both;
}
.cookie-banner[hidden] { display: none; }
.cookie-banner__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-4);
}
.cookie-banner__text {
  flex: 1 1 320px;
  font-size: 14px;
  color: var(--text-muted);
}
.cookie-banner__text a {
  color: var(--accent-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.cookie-banner__text a:hover { color: var(--accent-hover); }
.cookie-banner__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}
@keyframes cookie-banner-in {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@media (max-width: 639px) {
  .cookie-banner__inner { flex-direction: column; align-items: stretch; }
  .cookie-banner__actions { justify-content: flex-start; }
}

.footer__link {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.footer__link:hover { color: var(--accent-text); }
```

- [ ] **Step 2: Проверить токены**

Run: `node tools/check-tokens.mjs`
Expected: `OK: …` без ошибок (все `var(--…)` объявлены).

- [ ] **Step 3: Commit**

```bash
git add css/components.css
git commit -m "feat(consent): style cookie banner and footer link"
```

---

## Task 5: Политика и `PRODUCT.md` (согласие)

**Files:**
- Modify: `privacy.html`
- Modify: `PRODUCT.md`

- [ ] **Step 1: Добавить абзац в `privacy.html`**

После абзаца раздела 4 «Передача данных таким лицам ограничивается объёмом…»
(строка 146) добавить:

```html
<p>Согласие на использование аналитических cookie запрашивается у посетителя через баннер на сайте. Согласие можно отозвать в любой момент кнопкой «Настройки cookie» в подвале сайта; после отзыва сбор аналитических данных прекращается.</p>
```

- [ ] **Step 2: Обновить `PRODUCT.md`**

В списке «Вне scope» убрать `аналитика и счётчики` (строка начинается с
`- Вне scope: CMS/блог, мультиязычность,`, продолжается на двух строках).
Итоговый пункт:

```
- Вне scope: CMS/блог, мультиязычность,
  портфолио/кейсы, страница политики конфиденциальности,
  сборщик и препроцессоры, SEO-страницы под запросы.
```

Добавить новый пункт о аналитике (после пункта про форму):

```
- Аналитика: Яндекс.Метрика (счётчик 113122431) загружается только после
  явного согласия посетителя через cookie-баннер; `webvisor` отключён; согласие
  можно отозвать кнопкой «Настройки cookie» в подвале.
```

- [ ] **Step 3: Verify**

Run: `git grep -n "Вне scope" -- PRODUCT.md`
Expected: в пункте больше нет «аналитика и счётчики».

Run: `git grep -n "Настройки cookie" -- privacy.html PRODUCT.md`
Expected: совпадения в обоих файлах.

- [ ] **Step 4: Commit**

```bash
git add privacy.html PRODUCT.md
git commit -m "docs(consent): document consent and revocation"
```

---

## Task 6: Утилита самохостинга шрифтов

**Files:**
- Create: `tools/fetch-fonts.mjs`
- Test: `tests/fetch-fonts.test.mjs`

**Interfaces:**
- Consumes: ничего.
- Produces (экспорт ES-модуля):
  - `parseFontFaces(css: string, allowedSubsets: string[]): FontFace[]`
    где `FontFace = { subset, family, weight, style, url, unicodeRange }`
  - `localFileName(face: FontFace): string`
  - `buildFontsCss(faces: FontFace[]): string`
- Побочный эффект при запуске (`node tools/fetch-fonts.mjs`): скачивает
  `assets/fonts/*.woff2` и пишет `css/fonts.css`.

- [ ] **Step 1: Write the failing test**

`tests/fetch-fonts.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFontFaces, localFileName, buildFontsCss } from '../tools/fetch-fonts.mjs';

const SAMPLE = `/* cyrillic */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v13/cyr.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F;
}
/* latin */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v13/lat.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin-ext */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v13/latx.woff2) format('woff2');
  unicode-range: U+0100-024F;
}
`;

test('parseFontFaces оставляет только разрешённые подмножества', () => {
  const faces = parseFontFaces(SAMPLE, ['latin', 'cyrillic']);
  assert.equal(faces.length, 2);
  assert.deepEqual(faces.map((f) => f.subset), ['cyrillic', 'latin']);
});

test('parseFontFaces извлекает поля', () => {
  const [cyr] = parseFontFaces(SAMPLE, ['cyrillic']);
  assert.equal(cyr.family, 'Inter');
  assert.equal(cyr.weight, '400');
  assert.equal(cyr.url, 'https://fonts.gstatic.com/s/inter/v13/cyr.woff2');
  assert.equal(cyr.unicodeRange, 'U+0301, U+0400-045F');
});

test('localFileName даёт стабильные имена', () => {
  assert.equal(
    localFileName({ family: 'JetBrains Mono', weight: '500', subset: 'latin' }),
    'jetbrains-mono-500-latin.woff2'
  );
});

test('buildFontsCss ссылается на локальные файлы', () => {
  const css = buildFontsCss(parseFontFaces(SAMPLE, ['latin', 'cyrillic']));
  assert.match(css, /url\('\.\.\/assets\/fonts\/inter-400-cyrillic\.woff2'\)/);
  assert.match(css, /font-display: swap/);
  assert.match(css, /unicode-range: U\+0400-045F/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/fetch-fonts.test.mjs`
Expected: FAIL — `Cannot find module '../tools/fetch-fonts.mjs'`.

- [ ] **Step 3: Write minimal implementation**

`tools/fetch-fonts.mjs`:

```js
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const ALLOWED_SUBSETS = ['latin', 'cyrillic'];
const FONT_DIR = 'assets/fonts';
const CSS_OUT = 'css/fonts.css';

export function parseFontFaces(css, allowedSubsets) {
  const allowed = new Set(allowedSubsets);
  const faces = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
  let match;
  while ((match = re.exec(css)) !== null) {
    const subset = match[1];
    if (!allowed.has(subset)) continue;
    const block = match[2];
    const familyMatch = block.match(/font-family:\s*['"]?([^;'"]+)['"]?\s*;/);
    const weightMatch = block.match(/font-weight:\s*([^;]+);/);
    const styleMatch = block.match(/font-style:\s*([^;]+);/);
    const urlMatch = block.match(/url\(([^)]+)\)/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);
    if (!familyMatch || !urlMatch) continue;
    faces.push({
      subset: subset,
      family: familyMatch[1].trim(),
      weight: weightMatch ? weightMatch[1].trim() : '400',
      style: styleMatch ? styleMatch[1].trim() : 'normal',
      url: urlMatch[1].trim().replace(/^['"]|['"]$/g, ''),
      unicodeRange: rangeMatch ? rangeMatch[1].trim() : ''
    });
  }
  return faces;
}

export function localFileName(face) {
  const slug = face.family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-${face.weight}-${face.subset}.woff2`;
}

export function buildFontsCss(faces) {
  return (
    faces
      .map((face) => {
        const lines = [
          '@font-face {',
          `  font-family: '${face.family}';`,
          `  font-style: ${face.style};`,
          `  font-weight: ${face.weight};`,
          '  font-display: swap;',
          `  src: url('../${FONT_DIR}/${localFileName(face)}') format('woff2');`
        ];
        if (face.unicodeRange) lines.push(`  unicode-range: ${face.unicodeRange};`);
        lines.push('}');
        return lines.join('\n');
      })
      .join('\n\n') + '\n'
  );
}

async function fetchCss() {
  const res = await fetch(CSS_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    throw new Error('Не удалось получить CSS Google Fonts: ' + res.status);
  }
  return res.text();
}

async function main() {
  const css = await fetchCss();
  const faces = parseFontFaces(css, ALLOWED_SUBSETS);
  if (faces.length === 0) {
    throw new Error('Не найдено @font-face для: ' + ALLOWED_SUBSETS.join(', '));
  }
  mkdirSync(FONT_DIR, { recursive: true });
  for (const face of faces) {
    const file = join(FONT_DIR, localFileName(face));
    if (existsSync(file)) {
      console.log('skip ' + file);
      continue;
    }
    const bin = await fetch(face.url, { headers: { 'User-Agent': UA } });
    if (!bin.ok) {
      throw new Error('Не удалось скачать ' + face.url + ': ' + bin.status);
    }
    writeFileSync(file, Buffer.from(await bin.arrayBuffer()));
    console.log('saved ' + file);
  }
  writeFileSync(CSS_OUT, buildFontsCss(faces));
  console.log('written ' + CSS_OUT + ' (' + faces.length + ' @font-face)');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/fetch-fonts.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Скачать шрифты и сгенерировать `css/fonts.css`**

Run: `node tools/fetch-fonts.mjs`
Expected: строки `saved assets/fonts/…` (около 10 файлов: Inter 400/500/600/700
× latin/cyrillic + JetBrains Mono 500 × latin/cyrillic) и
`written css/fonts.css (N @font-face)`.

Если сети нет — повторить позже; шаг обязателен до Task 7.

- [ ] **Step 6: Добавить лицензию шрифтов**

Оба шрифта распространяются по лицензии **SIL OFL 1.1**. Скачать текст лицензии
из официальных репозиториев (`rsms/inter` — файл `LICENSE.txt`,
`JetBrains/JetBrainsMono` — файл `OFL.txt`) и сохранить объединённый текст в
`assets/fonts/OFL.txt`. Без этого файла распространять шрифты нельзя.

- [ ] **Step 7: Verify assets**

Run: `Get-ChildItem assets\fonts | Select-Object Name`
Expected: `*.woff2` (не менее 5) и `OFL.txt`.

- [ ] **Step 8: Commit**

```bash
git add tools/fetch-fonts.mjs tests/fetch-fonts.test.mjs assets/fonts css/fonts.css
git commit -m "feat(fonts): self-host Inter and JetBrains Mono"
```

---

## Task 7: Подключить локальные шрифты вместо Google Fonts

**Files:**
- Modify: `index.html`
- Modify: `privacy.html`
- Modify: `PRODUCT.md`

- [ ] **Step 1: Заменить шрифтовые ссылки в `index.html`**

Заменить блок (строки 38–44):

```html
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link
			href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap"
			rel="stylesheet"
		/>
		<link rel="stylesheet" href="css/tokens.css" />
```

на:

```html
		<link rel="stylesheet" href="css/fonts.css" />
		<link rel="stylesheet" href="css/tokens.css" />
```

- [ ] **Step 2: Заменить шрифтовые ссылки в `privacy.html`**

Заменить блок (строки 10–13):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/tokens.css">
```

на:

```html
<link rel="stylesheet" href="css/fonts.css">
<link rel="stylesheet" href="css/tokens.css">
```

- [ ] **Step 3: Обновить `PRODUCT.md`**

Заменить строку `- Только русский язык. Без CDN-библиотек, кроме Google Fonts.`
на:

```
- Только русский язык. Без CDN-библиотек и внешних шрифтов: Inter и
  JetBrains Mono раздаются с сайта (`assets/fonts`, `css/fonts.css`).
```

- [ ] **Step 4: Verify no external font calls remain**

Run: `git grep -n -E "fonts\.googleapis|fonts\.gstatic|googleapis" -- index.html privacy.html PRODUCT.md`
Expected: пусто.

Run: `git grep -n "css/fonts.css" -- index.html privacy.html`
Expected: по одному совпадению в каждом файле.

- [ ] **Step 5: Commit**

```bash
git add index.html privacy.html PRODUCT.md
git commit -m "feat(fonts): load self-hosted fonts instead of Google Fonts"
```

---

## Task 8: Финальная верификация

**Files:** без изменений (только проверки).

- [ ] **Step 1: Все юнит-тесты**

Run:
```bash
node --test tests/consent.test.js; node --test tests/fetch-fonts.test.mjs; node tools/check-tokens.mjs
```
Expected: PASS (8 + 4 тестов), `check-tokens` — `OK`.

- [ ] **Step 2: Счётчик удалён из разметки**

Run: `git grep -n -E "mc\.yandex\.ru|Yandex\.Metrika counter|webvisor" -- index.html js/`
Expected: совпадение только `mc.yandex.ru`/tag.js внутри `js/consent.js`
(`METRIKA_SRC`) и `webvisor` отсутствует.

- [ ] **Step 3: Ручной чек-лист в браузере** (открыть `index.html` через локальный
  сервер, например `npx serve .` или `python -m http.server`, чтобы `localStorage`
  работал на `http://`):

1. DevTools → Application → Clear storage: баннер виден снизу; во вкладке
   Network нет ни одного запроса к `mc.yandex.ru`.
2. Клик «Да, согласен»: баннер скрыт; появился запрос `tag.js?id=113122431`;
   в `localStorage` запись `artkull-consent` с `value: "granted"` и `ts`.
3. Reload: баннер не показывается; счётчик грузится сразу.
4. Очистка storage, reload, клик «Нет, спасибо»: баннер скрыт, запросов к
   `mc.yandex.ru` нет, запись `value: "denied"`.
5. Reload: баннер не показывается, запросов нет.
6. Клик «Настройки cookie» в подвале при `denied`: баннер открывается снова.
7. При `granted`: «Настройки cookie» → «Нет, спасибо» — cookie `_ym*` удалены
   (DevTools → Application → Cookies), страница перезагрузилась, запросов к
   `mc.yandex.ru` нет.
8. Приватный режим (или заблокированный `localStorage`): баннер виден,
   Метрика не грузится до клика; после «Да» работает без ошибок в консоли.
9. Доступность: Tab фокусирует кнопки баннера; скринридер читает
   `aria-label`; при системном «уменьшить движение` анимации нет.
10. Регресс: тема, мобильное меню и отправка формы работают как раньше.
11. Шрифты: во вкладке Network нет запросов к `fonts.googleapis.com` /
    `fonts.gstatic.com`; `woff2` отдаются с домена сайта; вид текста и
    моноширинных акцентов не изменился.

- [ ] **Step 4: Commit (если были правки по итогам проверки)**

```bash
git add -A
git commit -m "fix(consent): address manual verification findings"
```

Если правок не было — шаг пропускается.

---

## Self-Review

**1. Покрытие спеки:**

| Раздел спеки | Задача |
|---|---|
| §3 Модель согласия и хранение | Task 1 (`parseConsent`/`serializeConsent`/`readConsent`/`writeConsent`/`initialAction`) |
| §4 Баннер: разметка | Task 3 |
| §5 Баннер: стили | Task 4 |
| §6 Загрузка Метрики | Task 2 (`loadMetrika`, без `webvisor`), Task 3 (удаление счётчика/noscript) |
| §7 Изменение и отзыв согласия | Task 2 (`apply`, `deleteMetrikaCookies`, `reload`), Task 3 (кнопка настроек) |
| §8 Доступность | Task 3 (`role`/`aria-label`, нативные кнопки), Task 4 (фокус-стили наследуются) |
| §9 `privacy.html` | Task 5 |
| §10 Тестирование | Task 1, 6 (unit), Task 8 (ручной чек-лист) |
| §11 Файлы (дельта) | Task 3, 4, 5 |
| §12 Самохостинг шрифтов | Task 6, 7 |
| §13 Риски | Учтены: `webvisor` off, reload при отзыве, префикс `_ym` в `isMetrikaCookie` |

**2. Placeholders:** намеренных заглушек нет. `<FUNCTION_ID>` не используется.
Зависимость от сети в Task 6 Step 5 оговорена с указанием обязательности.

**3. Типы/имена:** `CONSENT_STORAGE_KEY`, `initialAction`, `readConsent`,
`writeConsent`, `isMetrikaCookie`, `loadMetrika`, `deleteMetrikaCookies`,
`initConsent`, `parseFontFaces`, `localFileName`, `buildFontsCss` совпадают во
всех задачах и тестах. Ключ хранения — `artkull-consent`; ID счётчика —
`113122431`; селекторы — `#cookie-banner`, `[data-consent]`,
`[data-consent-settings]`.
