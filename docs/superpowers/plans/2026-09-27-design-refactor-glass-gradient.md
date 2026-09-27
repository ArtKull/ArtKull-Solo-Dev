# Design Refactor — Glass / Gradient / Glow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести визуальный язык сайта на «стекло + градиент + свечение» из `reference.html`, сохранив структуру лендинга, содержимое и рабочую форму.

**Architecture:** Статический сайт без сборщика (HTML5 + CSS3 + vanilla JS). CSS остаётся разбит на 4 слоя (`tokens` → `base` → `components` → `sections`). Тема — через `data-theme` на `<html>`, старт от `prefers-color-scheme`, выбор в `localStorage`. Стекло — селективное: `backdrop-filter` только на шапке, hero-виджете и акцентных панелях, с fallback через `@supports`.

**Tech Stack:** HTML5, CSS3 (custom properties, backdrop-filter, mask-free двухслойный градиентный бордер), vanilla ES5-совместимый JS, Node.js (только для проверочного скрипта).

**Спека:** `docs/superpowers/specs/2026-09-27-design-refactor-glass-gradient-design.md`.

**Предусловия:**
- Node.js в PATH (есть: `node -v` → v24.x). Используется только для `tools/check-tokens.mjs`.
- PHP локально НЕ требуется для вёрстки; отправку формы локально не проверить (нужен хостинг с PHP). Визуальная проверка — открыть `index.html` в браузере напрямую (`file://`).
- Ассет `assets/logo.svg` содержит тёмные цвета и не читается в тёмной теме; в шапке используется инлайновый знак с `currentColor` (см. Task 4). Файл `assets/logo.svg` не трогаем.

---

## Файловая структура

| Файл | Ответственность |
|------|-----------------|
| `tools/check-tokens.mjs` | Проверка: нет необъявленных `var(--…)`; все обязательные токены определены |
| `css/tokens.css` | Все дизайн-токены: темы, градиент, glow, стекло, статусы, радиусы |
| `css/base.css` | Reset, фон-свечения, типографика, сетка bento, reveal, focus, утилиты |
| `css/components.css` | Шапка/навигация, меню, кнопки, бейджи, карточки, стекло, виджет, прогресс, поля, чипы, соцссылки |
| `css/sections.css` | Hero, тарифы, профиль, фичи, процесс/timeline, CTA-форма, контакты, баннер, футер, адаптив |
| `index.html` | Разметка липкой шапки; перенос переключателя темы; классы стекла |
| `js/app.js` | Состояние шапки, мобильное меню, активная ссылка, stagger-reveal (логика темы/формы не меняется) |
| `privacy.html` | Переоформление юридической страницы под новые токены |
| `DESIGN.md` | Переписанная дизайн-система |

---

## Task 1: Проверочный скрипт токенов

**Files:**
- Create: `tools/check-tokens.mjs`

- [ ] **Step 1: Создать `tools/check-tokens.mjs`**

```js
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'css';
const REQUIRED = [
  '--grad-accent',
  '--radius-window', '--radius-card', '--radius-el', '--radius-pill',
  '--header-h', '--ease', '--dur', '--dur-fast', '--dur-slow',
  '--bg', '--bg-glow-1', '--bg-glow-2',
  '--surface', '--surface-solid', '--surface-2', '--surface-hover',
  '--glass-bg', '--glass-border', '--glass-blur', '--inset-highlight',
  '--text', '--text-muted',
  '--accent', '--accent-hover', '--accent-solid', '--accent-solid-hover',
  '--accent-text', '--accent-soft', '--accent-glow',
  '--success', '--success-ring', '--warning', '--info', '--danger',
  '--border', '--border-hover',
  '--shadow', '--shadow-lifted', '--shadow-window', '--glow-primary',
  '--font-sans', '--font-mono', '--container'
];

const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
const defined = new Set();
const used = [];

for (const file of files) {
  const text = readFileSync(join(dir, file), 'utf8');
  for (const m of text.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);
  for (const m of text.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
    used.push({ file, token: m[1] });
  }
}

const missingDefs = used.filter((u) => !defined.has(u.token));
const missingRequired = REQUIRED.filter((t) => !defined.has(t));

let failed = false;
if (missingDefs.length) {
  failed = true;
  console.error('Необъявленные токены:');
  for (const m of missingDefs) console.error(`  ${m.token} (${m.file})`);
}
if (missingRequired.length) {
  failed = true;
  console.error('Отсутствуют обязательные токены:');
  for (const t of missingRequired) console.error(`  ${t}`);
}
if (failed) process.exit(1);
console.log(`OK: ${used.length} var()-ссылок, ${defined.size} токенов определено.`);
```

- [ ] **Step 2: Запустить проверку — ожидать падение**

Run:
```powershell
node tools/check-tokens.mjs
```
Expected: exit code != 0, в выводе «Отсутствуют обязательные токены:» со списком (`--grad-accent`, `--glass-bg`, …). Это «красный тест» — новые токены ещё не определены. **Не коммитить на этом шаге.**

---

## Task 2: Токены (`css/tokens.css`)

**Files:**
- Modify: `css/tokens.css` (перезаписать целиком)
- Test: `tools/check-tokens.mjs`

- [ ] **Step 1: Перезаписать `css/tokens.css`**

```css
:root {
  --radius-window: 24px;
  --radius-card: 16px;
  --radius-el: 10px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  --container: 1200px;
  --header-h: 64px;

  --ease: cubic-bezier(.22, .61, .36, 1);
  --dur-fast: 160ms;
  --dur: 240ms;
  --dur-slow: 320ms;
  --reveal-delay: 0ms;

  --grad-accent: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);

  --bg: #f0f4f8;
  --bg-glow-1: #bfdbfe;
  --bg-glow-2: #e0e7ff;

  --surface: rgba(255, 255, 255, .72);
  --surface-solid: #ffffff;
  --surface-2: rgba(255, 255, 255, .5);
  --surface-hover: rgba(255, 255, 255, .88);

  --glass-bg: rgba(255, 255, 255, .72);
  --glass-border: rgba(255, 255, 255, .6);
  --glass-blur: 20px;
  --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, .7);

  --text: #0f172a;
  --text-muted: #5b6b7f;

  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --accent-solid: #2563eb;
  --accent-solid-hover: #1d4ed8;
  --accent-text: #2563eb;
  --accent-soft: #eff6ff;
  --accent-glow: rgba(37, 99, 235, .28);

  --success: #059669;
  --success-ring: rgba(5, 150, 105, .18);
  --warning: #d97706;
  --info: #0891b2;
  --danger: #dc2626;

  --border: #e2e8f0;
  --border-hover: #cbd5e1;

  --shadow: 0 4px 20px rgba(0, 0, 0, .06);
  --shadow-lifted: 0 8px 30px rgba(0, 0, 0, .1);
  --shadow-window: 0 25px 60px rgba(0, 0, 0, .12);
  --glow-primary: 0 4px 15px rgba(37, 99, 235, .2);
}

[data-theme="dark"] {
  --bg: #0a0e27;
  --bg-glow-1: #1e3a8a;
  --bg-glow-2: #4c1d95;

  --surface: rgba(30, 41, 59, .6);
  --surface-solid: #0f172a;
  --surface-2: rgba(30, 41, 59, .5);
  --surface-hover: rgba(39, 53, 72, .75);

  --glass-bg: rgba(30, 41, 59, .6);
  --glass-border: rgba(255, 255, 255, .08);
  --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, .06);

  --text: #f8fafc;
  --text-muted: #94a3b8;

  --accent: #3b82f6;
  --accent-hover: #60a5fa;
  --accent-solid: #2563eb;
  --accent-solid-hover: #1d4ed8;
  --accent-text: #60a5fa;
  --accent-soft: rgba(59, 130, 246, .14);
  --accent-glow: rgba(59, 130, 246, .35);

  --success: #10b981;
  --success-ring: rgba(16, 185, 129, .18);
  --warning: #f59e0b;
  --info: #06b6d4;
  --danger: #ef4444;

  --border: rgba(255, 255, 255, .08);
  --border-hover: rgba(255, 255, 255, .15);

  --shadow: 0 4px 20px rgba(0, 0, 0, .3);
  --shadow-lifted: 0 4px 20px rgba(0, 0, 0, .3);
  --shadow-window: 0 25px 60px rgba(0, 0, 0, .5);
  --glow-primary: 0 0 20px rgba(59, 130, 246, .3);
}
```

- [ ] **Step 2: Запустить проверку — ожидать успех**

Run:
```powershell
node tools/check-tokens.mjs
```
Expected: `OK: <N> var()-ссылок, <M> токенов определено.` (exit code 0).

- [ ] **Step 3: Коммит**

```powershell
git add tools/check-tokens.mjs css/tokens.css
git commit -m "feat: add token audit and new glass/gradient design tokens"
```

---

## Task 3: База (`css/base.css`)

**Files:**
- Modify: `css/base.css` (перезаписать целиком)

- [ ] **Step 1: Перезаписать `css/base.css`**

```css
*, *::before, *::after { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.6;
  font-feature-settings: "ss01";
  -webkit-font-smoothing: antialiased;
  transition: background var(--dur-slow) var(--ease), color var(--dur-slow) var(--ease);
}

body::before {
  content: "";
  position: fixed;
  inset: -10%;
  z-index: -1;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 20% 30%, var(--bg-glow-1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, var(--bg-glow-2) 0%, transparent 50%);
  opacity: .9;
  animation: glow-drift 16s var(--ease) infinite alternate;
}

@keyframes glow-drift {
  from { transform: translate3d(0, 0, 0) scale(1); opacity: .75; }
  to { transform: translate3d(2%, -2%, 0) scale(1.05); opacity: .95; }
}

h1, h2, h3, h4 { margin: 0; line-height: 1.2; letter-spacing: -0.01em; }
p { margin: 0; }
a { color: inherit; text-decoration: none; }
ul, ol { margin: 0; padding: 0; list-style: none; }
img, svg { display: block; max-width: 100%; }
button { font: inherit; color: inherit; cursor: pointer; }

.mono { font-family: var(--font-mono); font-weight: 500; }

.container {
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--space-5);
}

.section {
  padding: var(--space-6) 0;
  scroll-margin-top: calc(var(--header-h) + var(--space-4));
}
.section--hero { position: relative; padding-top: var(--space-7); }

.bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}

.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
.col-4 { grid-column: span 4; }
.col-5 { grid-column: span 5; }
.col-6 { grid-column: span 6; }
.col-7 { grid-column: span 7; }
.col-8 { grid-column: span 8; }
.col-12 { grid-column: span 12; }

.divider {
  height: 1px;
  border: 0;
  background: var(--border);
  margin: var(--space-4) 0;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}

.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.js .reveal {
  opacity: 0;
  translate: 0 16px;
  transition:
    opacity var(--dur-slow) var(--ease) var(--reveal-delay, 0ms),
    translate var(--dur-slow) var(--ease) var(--reveal-delay, 0ms);
}
.js .reveal.is-visible { opacity: 1; translate: 0 0; }

@media (max-width: 1023px) {
  .bento { grid-template-columns: repeat(2, 1fr); }
  .col-2, .col-3, .col-4, .col-5, .col-6, .col-7, .col-8 { grid-column: span 1; }
  .col-12 { grid-column: span 2; }
}

@media (max-width: 639px) {
  .bento { grid-template-columns: 1fr; }
  .col-2, .col-3, .col-4, .col-5, .col-6, .col-7, .col-8, .col-12 { grid-column: auto; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
  body::before { animation: none; }
  .js .reveal { opacity: 1; translate: 0 0; }
}
```

- [ ] **Step 2: Проверить токены**

Run:
```powershell
node tools/check-tokens.mjs
```
Expected: `OK: ...` (exit 0).

- [ ] **Step 3: Коммит**

```powershell
git add css/base.css
git commit -m "feat: rebuild base layer with animated background glows and staggered reveal"
```

---

## Task 4: Разметка шапки (`index.html`)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Вставить липкую шапку первым элементом `<body>`**

Найти:
```html
<body>
  <main>
```
Заменить на:
```html
<body>
  <header class="site-header" data-header>
    <div class="container site-header__inner">
      <a class="brand" href="#hero" aria-label="ArtKull — в начало страницы">
        <svg class="brand__sign" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="8" y="8" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
          <rect x="25" y="8" width="14" height="14" rx="4" fill="#3b82f6"/>
          <rect x="42" y="8" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
          <rect x="8" y="25" width="14" height="14" rx="4" fill="#3b82f6"/>
          <rect x="25" y="25" width="14" height="14" rx="4" fill="#3b82f6"/>
          <rect x="42" y="25" width="14" height="14" rx="4" fill="#3b82f6"/>
          <rect x="8" y="42" width="14" height="14" rx="4" fill="#3b82f6"/>
          <rect x="25" y="42" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
          <rect x="42" y="42" width="14" height="14" rx="4" fill="#3b82f6"/>
        </svg>
        <span class="brand__name">Art<span class="brand__mark">Kull</span></span>
      </a>
      <nav class="site-nav" id="site-nav" aria-label="Основная навигация">
        <a class="site-nav__link" href="#services">Услуги</a>
        <a class="site-nav__link" href="#about">Почему я</a>
        <a class="site-nav__link" href="#process">Процесс</a>
        <a class="site-nav__link" href="#contacts">Связаться</a>
      </nav>
      <div class="site-header__actions">
        <button class="theme-toggle" type="button" aria-label="Переключить тему" aria-pressed="false">
          <svg class="icon theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
          <svg class="icon theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Открыть меню">
          <span class="menu-toggle__bar"></span>
          <span class="menu-toggle__bar"></span>
        </button>
      </div>
    </div>
  </header>

  <main>
```

- [ ] **Step 2: Удалить старую кнопку темы из hero**

Найти в секции `#hero`:
```html
      <button class="theme-toggle" type="button" aria-label="Переключить тему" aria-pressed="false">
        <svg class="icon theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        <svg class="icon theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

```
Удалить этот блок целиком (остаётся только `<div class="container bento">` внутри `#hero`).

- [ ] **Step 3: Проверить, что кнопка одна и шапка на месте**

Run:
```powershell
"header: " + (Select-String -Path index.html -Pattern 'class="site-header"' -SimpleMatch -Quiet); "toggles: " + ((Select-String -Path index.html -Pattern 'class="theme-toggle"' -SimpleMatch).Count)
```
Expected: `header: True`, `toggles: 1`.

- [ ] **Step 4: Коммит**

```powershell
git add index.html
git commit -m "feat: add sticky glass header and move theme toggle"
```

---

## Task 5: Компоненты (`css/components.css`)

**Files:**
- Modify: `css/components.css` (перезаписать целиком)

- [ ] **Step 1: Перезаписать `css/components.css`**

```css
.icon {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon--lg { width: 24px; height: 24px; }
.icon-brand { width: 24px; height: 24px; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 44px;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: var(--radius-el);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    transform var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease),
    filter var(--dur-fast) var(--ease);
}
.btn:active { transform: translateY(1px); }
.btn--primary {
  background: var(--grad-accent);
  color: #fff;
  box-shadow: var(--glow-primary);
}
.btn--primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow: 0 6px 22px var(--accent-glow);
}
.btn--primary:active { transform: translateY(0); }
.btn--outline {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}
.btn--outline:hover {
  border-color: var(--accent);
  background: var(--surface-hover);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.btn--ghost {
  height: auto;
  padding: 0;
  background: none;
  border-color: transparent;
  color: var(--accent-text);
}
.btn--ghost:hover { color: var(--accent-hover); text-decoration: underline; text-underline-offset: 3px; }
.btn--block { width: 100%; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 10px;
  border-radius: var(--radius-el);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.badge--neutral {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
}
.badge--accent {
  background: var(--accent-solid);
  color: #fff;
}

.status-dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: var(--radius-pill);
  background: var(--text-muted);
}
.status-dot--on {
  background: var(--success);
  box-shadow: 0 0 0 3px var(--success-ring);
  animation: dot-pulse 2.4s var(--ease) infinite;
}
@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 0 3px var(--success-ring); }
  50% { box-shadow: 0 0 0 5px var(--success-ring); }
}

.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--shadow), var(--inset-highlight);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass,
  .widget,
  .site-header,
  .footer { background: var(--surface-solid); }

  @media (max-width: 767px) {
    .site-nav { background: var(--surface-solid); }
  }
}

.card {
  position: relative;
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow), var(--inset-highlight);
  transition:
    transform var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    background var(--dur) var(--ease);
}
.card--hover:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: var(--shadow-lifted), var(--inset-highlight);
}
.card--accent {
  border: 1px solid transparent;
  background:
    linear-gradient(var(--surface-solid), var(--surface-solid)) padding-box,
    var(--grad-accent) border-box;
  box-shadow: var(--shadow-lifted), var(--glow-primary);
}
.card--accent.card--hover:hover {
  border-color: transparent;
  box-shadow: var(--shadow-lifted), var(--glow-primary);
}
.card--flat { box-shadow: none; }

.widget {
  position: relative;
  overflow: hidden;
  padding: var(--space-5);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-window);
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--shadow-window), var(--inset-highlight);
}
.widget::before {
  content: "";
  position: absolute;
  top: -70px;
  right: -70px;
  width: 240px;
  height: 240px;
  border-radius: var(--radius-pill);
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
  pointer-events: none;
}
.widget__head {
  position: relative;
  margin-bottom: var(--space-5);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.widget__grid {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}
.metric { display: flex; flex-direction: column; gap: var(--space-1); }
.metric__value {
  overflow-wrap: anywhere;
  font-family: var(--font-mono);
  font-size: 32px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -.01em;
}
@media (max-width: 1023px) {
  .metric__value { font-size: 26px; }
}
.metric__label {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.widget__status {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
  font-size: 14px;
  color: var(--text-muted);
}

.progress {
  flex: 1;
  height: 4px;
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  overflow: hidden;
}
.progress__bar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--grad-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 600ms var(--ease);
}

.field {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-el);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 14px;
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}
.field::placeholder { color: var(--text-muted); }
.field:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.checklist { display: flex; flex-direction: column; gap: var(--space-2); }
.check { display: flex; align-items: flex-start; gap: var(--space-2); font-size: 14px; }
.check__glyph { flex: none; color: var(--success); font-weight: 700; line-height: 1.5; }
.check--off { color: var(--text-muted); }
.check--off .check__glyph { color: var(--text-muted); }

.pill {
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  font-size: 14px;
  color: var(--text-muted);
}

.social-link {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius-el);
  color: var(--text-muted);
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}
.social-link:hover {
  color: var(--accent-text);
  border-color: var(--accent);
  background: var(--surface-hover);
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid transparent;
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
}
.site-header.is-scrolled {
  border-bottom-color: var(--border);
  box-shadow: var(--shadow);
}
.site-header__inner {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  height: var(--header-h);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -.01em;
}
.brand__sign { width: 26px; height: 26px; flex: none; }
.brand__mark { color: var(--accent-text); }
.site-nav {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin-left: auto;
}
.site-nav__link {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  transition: color var(--dur-fast) var(--ease);
}
.site-nav__link:hover,
.site-nav__link[aria-current="true"] { color: var(--accent-text); }
.site-header__actions { display: flex; align-items: center; gap: var(--space-2); }

.theme-toggle,
.menu-toggle {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius-el);
  background: var(--surface);
  color: var(--text);
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}
.theme-toggle:hover,
.menu-toggle:hover { border-color: var(--accent); color: var(--accent-text); }
.theme-toggle__moon { display: none; }
[data-theme="dark"] .theme-toggle__sun { display: none; }
[data-theme="dark"] .theme-toggle__moon { display: block; }

.menu-toggle { display: none; position: relative; }
.menu-toggle__bar {
  position: absolute;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: currentColor;
  transition: transform var(--dur-fast) var(--ease);
}
.menu-toggle__bar:nth-child(1) { transform: translateY(-4px); }
.menu-toggle__bar:nth-child(2) { transform: translateY(4px); }
.menu-toggle[aria-expanded="true"] .menu-toggle__bar:nth-child(1) { transform: rotate(45deg); }
.menu-toggle[aria-expanded="true"] .menu-toggle__bar:nth-child(2) { transform: rotate(-45deg); }

@media (max-width: 767px) {
  .menu-toggle { display: grid; }
  .site-nav {
    position: absolute;
    top: var(--header-h);
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    margin: 0;
    padding: var(--space-3);
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow);
    opacity: 0;
    transform: translateY(-8px);
    pointer-events: none;
    visibility: hidden;
    transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease), visibility var(--dur);
  }
  .site-nav.is-open { opacity: 1; transform: translateY(0); pointer-events: auto; visibility: visible; }
  .site-nav__link { padding: var(--space-3); border-radius: var(--radius-el); }
  .site-nav__link:hover { background: var(--surface-hover); }
}

@media (forced-colors: active) {
  .field:focus { outline: 2px solid; }
}

.footer {
  border-top: 1px solid var(--border);
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
}
.footer__inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
  font-size: 14px;
  color: var(--text-muted);
}
.footer a { text-decoration: underline; text-underline-offset: 3px; }
.footer a:hover { color: var(--accent-text); }
```

- [ ] **Step 2: Проверить токены и наличие ключевых селекторов**

Run:
```powershell
node tools/check-tokens.mjs
"card--accent: " + (Select-String -Path css/components.css -Pattern '\.card--accent' -SimpleMatch -Quiet)
"menu-toggle: " + (Select-String -Path css/components.css -Pattern '\.menu-toggle' -SimpleMatch -Quiet)
```
Expected: `OK: ...`, `card--accent: True`, `menu-toggle: True`.

- [ ] **Step 3: Коммит**

```powershell
git add css/components.css
git commit -m "feat: rebuild components with glass surfaces, gradient buttons and site header"
```

---

## Task 6: Секции (`css/sections.css`)

**Files:**
- Modify: `css/sections.css` (перезаписать целиком)

- [ ] **Step 1: Перезаписать `css/sections.css`**

```css
.section-header { margin-bottom: var(--space-6); }
.section-header h2 { font-size: 32px; font-weight: 700; letter-spacing: -.01em; }

.hero__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
}
.hero__title {
  font-size: 56px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -.02em;
}
.hero__title-tail { display: block; color: var(--accent-text); }
.hero__subtitle { max-width: 52ch; font-size: 18px; color: var(--text-muted); }
.hero__actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.hero__secondary-link {
  font-size: 14px;
  color: var(--text-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color var(--dur-fast) var(--ease);
}
.hero__secondary-link:hover { color: var(--accent-text); }

.price-card { display: flex; flex-direction: column; gap: var(--space-4); }
.price-card__title { font-size: 20px; font-weight: 600; }
.price-card__price { display: flex; align-items: baseline; gap: var(--space-2); font-size: 24px; }
.price-card__term { font-family: var(--font-sans); font-size: 14px; color: var(--text-muted); }
.price-card__features { display: flex; flex-direction: column; gap: var(--space-2); }
.price-card__includes { font-size: 13px; color: var(--text-muted); }
.price-card .btn { margin-top: auto; }
.price-card--featured { z-index: 1; }
@media (min-width: 1024px) {
  .price-card--featured { margin-top: -8px; }
  .profile { grid-row: span 2; }
}

.profile { display: flex; flex-direction: column; gap: var(--space-4); }
.profile__head { display: flex; align-items: center; gap: var(--space-3); }
.profile__avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex: none;
  border-radius: var(--radius-el);
  background: var(--grad-accent);
  color: #fff;
  font-weight: 700;
}
.profile__name { font-weight: 600; }
.profile__role { font-size: 14px; color: var(--text-muted); }
.profile__bio { font-size: 14px; color: var(--text-muted); }
.profile__tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.profile__scope {
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text-muted);
}

.feature { display: flex; flex-direction: column; gap: var(--space-3); }
.feature__icon { color: var(--accent); }
.feature__title { font-size: 20px; font-weight: 600; }
.feature__text { font-size: 14px; color: var(--text-muted); }

.process-card { border-radius: var(--radius-window); }
.process-card .section-header { margin-bottom: var(--space-5); }
.timeline {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-5);
}
.timeline__item { position: relative; }
.timeline__item::after {
  content: "";
  position: absolute;
  top: 18px;
  left: 44px;
  right: calc(var(--space-5) * -1);
  height: 1px;
  background: var(--border);
}
.timeline__item:last-child::after { display: none; }
.timeline__dot {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface-solid);
  font-family: var(--font-mono);
  font-size: 14px;
}
.timeline__body { margin-top: var(--space-3); }
.timeline__title { font-size: 15px; font-weight: 600; margin-bottom: var(--space-2); }
.timeline__text { font-size: 14px; color: var(--text-muted); }
.timeline__progress { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-3); }
.timeline__percent { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
.timeline__legend { margin-top: var(--space-5); font-size: 13px; color: var(--text-muted); }

.cta {
  grid-column: 1 / -1;
  position: relative;
  overflow: hidden;
  border: none;
  padding: var(--space-7);
  border-radius: var(--radius-window);
  background: var(--grad-accent);
  color: #fff;
  box-shadow: 0 20px 50px var(--accent-glow);
}
.cta__pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 85% 12%, rgba(255, 255, 255, .22) 0%, transparent 45%);
  pointer-events: none;
}
.cta h2 { position: relative; font-size: 32px; font-weight: 700; letter-spacing: -.01em; }
.cta__subtitle { position: relative; margin: var(--space-3) 0 var(--space-6); max-width: 60ch; color: rgba(255, 255, 255, .88); }
.cta__form { position: relative; display: grid; gap: var(--space-4); max-width: 560px; }
.cta__field { display: flex; flex-direction: column; gap: var(--space-2); }
.cta__label-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
.cta__label { font-size: 13px; font-weight: 500; color: rgba(255, 255, 255, .92); }
.cta .field {
  height: 48px;
  border-color: transparent;
  background: rgba(255, 255, 255, .95);
  color: #0f172a;
}
.cta .field::placeholder { color: #64748b; }
.cta .field:focus { border-color: #fff; box-shadow: 0 0 0 3px rgba(255, 255, 255, .85); }
.cta__field.is-invalid .field { border-color: #fff; box-shadow: 0 0 0 3px rgba(239, 68, 68, .7); }
.field-error { min-height: 18px; font-size: 13px; font-weight: 600; color: #fff; }
.field-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(255, 255, 255, .9);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}
.field-live.is-valid { opacity: 1; }
.field-live__check { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.cta .cta__submit {
  width: 100%;
  height: 48px;
  background: #fff;
  color: var(--accent-solid);
  box-shadow: none;
}
.cta .cta__submit:hover {
  transform: translateY(-1px);
  filter: none;
  background: rgba(255, 255, 255, .9);
  color: var(--accent-solid-hover);
}
.cta .cta__submit:focus-visible { outline-color: #fff; }
.cta__submit-spinner,
.cta__submit-check {
  display: none;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}
.cta__submit.is-busy .cta__submit-spinner { display: block; animation: spin 800ms linear infinite; }
.cta__submit.is-done .cta__submit-check { display: block; }
@keyframes spin { to { transform: rotate(360deg); } }
.cta__meter {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: 560px;
  margin-top: var(--space-4);
}
.cta__meter-track {
  flex: 1;
  height: 4px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, .28);
  overflow: hidden;
}
.cta__meter-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: #fff;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--dur) var(--ease);
}
.cta__meter-label { font-family: var(--font-mono); font-size: 12px; color: rgba(255, 255, 255, .88); }
.cta__message { position: relative; margin-top: var(--space-4); font-size: 14px; }
.cta__message:empty { display: none; }
.cta__message.is-success { color: #d1fae5; }
.cta__message.is-error { color: #fee2e2; }
.cta__note { position: relative; margin-top: var(--space-5); font-size: 14px; color: rgba(255, 255, 255, .88); }
.cta__note a { text-decoration: underline; text-underline-offset: 3px; }

.contacts-card { display: flex; flex-direction: column; gap: var(--space-4); }
.contacts-card__title { font-size: 20px; font-weight: 600; }
.contact-link--primary {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--accent);
  border-radius: var(--radius-el);
  background: var(--accent-soft);
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  transition: box-shadow var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}
.contact-link--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 0 3px var(--accent-soft), var(--glow-primary);
}
.contact-link__arrow { margin-left: auto; color: var(--accent-text); }
.contact-secondary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  font-size: 13px;
  color: var(--text-muted);
}
.contact-secondary a { text-decoration: underline; text-underline-offset: 3px; }
.contact-secondary a:hover { color: var(--accent-text); }
.socials { display: flex; gap: var(--space-2); }
.location { display: flex; align-items: flex-start; gap: var(--space-2); font-size: 14px; color: var(--text-muted); }
.location .icon { flex: none; margin-top: 2px; }

.banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
.banner__text { font-size: 15px; }

@media (max-width: 1023px) {
  .hero__title { font-size: 40px; }
  .hero__title-tail { display: inline; }
  .timeline { grid-template-columns: 1fr; gap: var(--space-5); }
  .timeline__item {
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: var(--space-4);
    align-items: start;
  }
  .timeline__item::after {
    top: 36px;
    left: 17px;
    right: auto;
    bottom: calc(var(--space-5) * -1);
    width: 1px;
    height: auto;
  }
  .timeline__body { margin-top: 0; }
}

@media (max-width: 639px) {
  .section-header h2 { font-size: 26px; }
  .hero__title { font-size: 34px; }
  .cta { padding: var(--space-5); }
  .cta h2 { font-size: 26px; }
}

@media (prefers-reduced-motion: reduce) {
  .card--hover:hover,
  .btn:active,
  .contact-link--primary:hover { transform: none; }
}
```

- [ ] **Step 2: Проверить токены**

Run:
```powershell
node tools/check-tokens.mjs
```
Expected: `OK: ...` (exit 0).

- [ ] **Step 3: Визуальная проверка в браузере**

Run:
```powershell
Start-Process index.html
```
Проверить вручную:
- Обе темы (кнопка в шапке) — фон со свечениями, стеклянная шапка, градиентные кнопки/CTA, фиолетовые оттенки.
- Шапка липнет при скролле, появляется нижняя граница.
- Переключение темы плавное, без мерцания.
- Секции появляются со stagger при скролле.

- [ ] **Step 4: Коммит**

```powershell
git add css/sections.css
git commit -m "feat: rebuild sections with gradient CTA, glass hero widget and glow accents"
```

---

## Task 7: Поведение шапки и анимации (`js/app.js`)

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Добавить stagger-задержку в блок появления секций**

Найти:
```js
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduce || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }
```
Заменить на:
```js
  function revealDelay(el) {
    var parent = el.parentElement;
    if (!parent) { return '0ms'; }
    var sibs = Array.prototype.filter.call(parent.children, function (c) {
      return c.classList.contains('reveal');
    });
    var idx = sibs.indexOf(el);
    return (idx > 0 ? idx * 60 : 0) + 'ms';
  }
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduce || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) {
      el.style.setProperty('--reveal-delay', revealDelay(el));
      io.observe(el);
    });
  }
```

- [ ] **Step 2: Добавить шапку, мобильное меню и активную ссылку**

Найти блок с прогресс-барами, заканчивающийся:
```js
  /* Форма заявки */
```
Перед ним вставить:
```js
  /* Шапка */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Мобильное меню */
  var menuToggle = document.querySelector('.menu-toggle');
  var siteNav = document.getElementById('site-nav');
  if (menuToggle && siteNav) {
    var setNavState = function (open) {
      siteNav.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    };
    var closeNav = function () { setNavState(false); };
    menuToggle.addEventListener('click', function () {
      setNavState(!siteNav.classList.contains('is-open'));
    });
    siteNav.addEventListener('click', function (e) {
      if (e.target.closest('.site-nav__link')) { closeNav(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteNav.classList.contains('is-open')) { closeNav(); }
    });
    if (window.matchMedia) {
      var mql = window.matchMedia('(min-width: 768px)');
      var onMql = function (e) { if (e.matches) { closeNav(); } };
      if (mql.addEventListener) { mql.addEventListener('change', onMql); }
      else if (mql.addListener) { mql.addListener(onMql); }
    }
  }

  /* Активная ссылка навигации */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link'));
  var navSections = navLinks
    .map(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#') { return null; }
      return document.getElementById(href.slice(1));
    })
    .filter(Boolean);
  if (navSections.length && hasIO) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        navLinks.forEach(function (a) {
          a.setAttribute('aria-current', a.getAttribute('href') === '#' + entry.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navSections.forEach(function (s) { navIo.observe(s); });
  }

```

- [ ] **Step 3: Проверить синтаксис файла**

Run:
```powershell
node --check js/app.js
```
Expected: пустой вывод (синтаксис ок).

- [ ] **Step 4: Ручная проверка в браузере**

Открыть `index.html`, проверить:
- При скролле шапка получает класс `is-scrolled` (в DevTools).
- На узком окне (≤767px) появляется бургер; меню открывается/закрывается, `aria-expanded` меняется, Escape закрывает.
- Активная ссылка в шапке подсвечивается при скролле к секции.

- [ ] **Step 5: Коммит**

```powershell
git add js/app.js
git commit -m "feat: add sticky header state, mobile menu, active nav link and stagger reveal"
```

---

## Task 8: Юридическая страница (`privacy.html`)

**Files:**
- Modify: `privacy.html`

- [ ] **Step 1: Заменить `<head>` (стили и подключение CSS)**

Найти:
```html
<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Политика обработки персональных данных</title><style>body{max-width:820px;margin:40px auto;padding:0 24px;color:#172033;font:16px/1.65 Georgia,serif}h1{text-align:center}h2{margin-top:30px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:8px 10px;border:1px solid #aaa;text-align:left}th:first-child,td:first-child{width:45px;text-align:center}</style></head><body>
```
Заменить на:
```html
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Политика обработки персональных данных — ArtKull</title>
<meta name="theme-color" content="#F0F4F8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0A0E27" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/legal.css">
<script>
  (function () {
    var theme = null;
    try { theme = localStorage.getItem('artkull-theme'); } catch (e) { theme = null; }
    if (theme !== 'light' && theme !== 'dark') {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('js');
    document.addEventListener('DOMContentLoaded', function () {
      if (!window.__artkullReady) {
        document.documentElement.classList.remove('js');
      }
    });
  })();
</script>
</head>
<body>
<header class="site-header">
  <div class="container site-header__inner">
    <a class="brand" href="index.html" aria-label="ArtKull — на главную">
      <svg class="brand__sign" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="8" y="8" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
        <rect x="25" y="8" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="42" y="8" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
        <rect x="8" y="25" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="25" y="25" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="42" y="25" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="8" y="42" width="14" height="14" rx="4" fill="#3b82f6"/>
        <rect x="25" y="42" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
        <rect x="42" y="42" width="14" height="14" rx="4" fill="#3b82f6"/>
      </svg>
      <span class="brand__name">Art<span class="brand__mark">Kull</span></span>
    </a>
    <div class="site-header__actions">
      <button class="theme-toggle" type="button" aria-label="Переключить тему" aria-pressed="false">
        <svg class="icon theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        <svg class="icon theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </div>
  </div>
</header>
<main class="container legal">
```

- [ ] **Step 2: Закрыть `main` и добавить футер с переключателем темы в конце**

Найти:
```html
</body></html>
```
Заменить на:
```html
</main>
<footer class="footer">
  <div class="container footer__inner">
    <span>© 2026 Артём Кульчинский · <a href="index.html">На главную</a></span>
    <span>Сайт сделан вручную. Без конструкторов. Без шаблонов.</span>
  </div>
</footer>
<script src="js/app.js" defer></script>
</body>
</html>
```

- [ ] **Step 3: Создать `css/legal.css`**

```css
.legal {
  max-width: 820px;
  margin: var(--space-7) auto;
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}
.legal h1 { font-size: 32px; font-weight: 700; letter-spacing: -.01em; }
.legal > p:first-of-type { margin-top: var(--space-2); color: var(--text-muted); font-size: 14px; }
.legal h2 { margin-top: var(--space-7); font-size: 20px; font-weight: 600; }
.legal h3 { margin-top: var(--space-5); font-size: 16px; font-weight: 600; }
.legal p { margin-top: var(--space-4); font-size: 14px; color: var(--text-muted); }
.legal a { color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
.legal table {
  width: 100%;
  margin: var(--space-4) 0;
  border-collapse: collapse;
  border: 1px solid var(--border);
}
.legal th, .legal td {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  text-align: left;
  font-size: 14px;
}
.legal th { background: var(--surface-2); font-weight: 600; }
.legal th:first-child, .legal td:first-child { width: 45px; text-align: center; }
```

- [ ] **Step 4: Проверить токены и разметку**

Run:
```powershell
node tools/check-tokens.mjs
"legal css linked: " + (Select-String -Path privacy.html -Pattern 'css/legal.css' -SimpleMatch -Quiet)
"inline style gone: " + (-not (Select-String -Path privacy.html -Pattern 'Georgia' -SimpleMatch -Quiet))
```
Expected: `OK: ...`, `legal css linked: True`, `inline style gone: True`.

- [ ] **Step 5: Визуальная проверка**

Открыть `privacy.html` в браузере. Проверить: тёмная/светлая темы, читаемость, таблицы, работу переключателя темы, ссылку «На главную».

- [ ] **Step 6: Коммит**

```powershell
git add privacy.html css/legal.css
git commit -m "feat: restyle privacy page with new design tokens"
```

---

## Task 9: Дизайн-система (`DESIGN.md`)

**Files:**
- Modify: `DESIGN.md` (перезаписать целиком)

- [ ] **Step 1: Перезаписать `DESIGN.md`**

```markdown
---
name: ArtKull
description: "Сайты под ключ — стекло, градиент, живой дашборд"
colors:
  bg: "#F0F4F8"
  bg-glow-1: "#BFDBFE"
  bg-glow-2: "#E0E7FF"
  surface: "rgba(255,255,255,.72)"
  surface-solid: "#FFFFFF"
  text: "#0F172A"
  text-muted: "#5B6B7F"
  accent: "#3B82F6"
  accent-solid: "#2563EB"
  accent-text: "#2563EB"
  accent-soft: "#EFF6FF"
  grad-accent: "linear-gradient(135deg,#2563EB 0%,#7C3AED 100%)"
  success: "#059669"
  warning: "#D97706"
  info: "#0891B2"
  danger: "#DC2626"
  border: "#E2E8F0"
dark:
  bg: "#0A0E27"
  bg-glow-1: "#1E3A8A"
  bg-glow-2: "#4C1D95"
  surface: "rgba(30,41,59,.6)"
  surface-solid: "#0F172A"
  text: "#F8FAFC"
  text-muted: "#94A3B8"
  accent: "#3B82F6"
  accent-text: "#60A5FA"
  success: "#10B981"
  warning: "#F59E0B"
  info: "#06B6D4"
  danger: "#EF4444"
  border: "rgba(255,255,255,.08)"
typography:
  display: { fontFamily: "Inter", fontSize: "56px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }
  headline: { fontFamily: "Inter", fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }
  title: { fontFamily: "Inter", fontSize: "20px", fontWeight: 600, lineHeight: 1.2 }
  body: { fontFamily: "Inter", fontSize: "16px", fontWeight: 400, lineHeight: 1.6 }
  small: { fontFamily: "Inter", fontSize: "14px", fontWeight: 400, lineHeight: 1.55 }
  label: { fontFamily: "JetBrains Mono", fontSize: "12px", fontWeight: 500, letterSpacing: "0.08em" }
  metric: { fontFamily: "JetBrains Mono", fontSize: "32px", fontWeight: 500, lineHeight: 1.1 }
rounded: { window: "24px", card: "16px", el: "10px", pill: "999px" }
---

# Design System: ArtKull

## Overview

**Creative North Star: «Стеклянный дашборд».**

ArtKull — работающий инструмент, а не брошюра, но теперь он светится: глубокий
градиентный фон со свечениями, полупрозрачные стеклянные панели, градиентный
акцент синий→фиолетовый. Метрики, статусы, прогресс и моноширинные числа
остаются языком бренда; стекло и свечение добавляют глубину и «технологичность».

Структура лендинга не меняется: bento-сетка, размер блока равен его значимости.
Анимация мягкая, но заметная: «дыхание» фоновых свечений, staggered-появление
секций, подъём карточек, пульс статус-точки.

### Key Characteristics
- Стеклянные поверхности (селективно) + градиентный фон со свечениями.
- Один фил-градиент `--grad-accent` (`#2563EB → #7C3AED`) для кнопок, CTA,
  прогресса, аватара профиля.
- Фиолетовый — декор и свечение, не текст.
- Две темы, старт от системной, плавная смена.
- Сдержанное движение; `prefers-reduced-motion` отключает всё лишнее.

## Colors

### Gradient
- **`--grad-accent`** — главная заливка под белым текстом: primary-кнопки,
  CTA-панель, прогресс, аватар профиля, градиентный бордер `card--accent`. Оба
  стопа (`#2563EB`, `#7C3AED`) дают ≥4.5:1 под белым.
- Фоновые свечения: `--bg-glow-1` — синий (`#BFDBFE` / `#1E3A8A`), `--bg-glow-2` —
  фиолетовый (`#E0E7FF` / `#4C1D95`); фиолетовый под текстом не используется.

### Accent
- `--accent` (#3B82F6) — границы, иконки, фокус, кольца.
- `--accent-solid` (#2563EB) — сплошная заливка под белым текстом.
- `--accent-text` (#2563EB светлая / #60A5FA тёмная) — мелкий акцентный текст и
  ссылки (AA).
- `--accent-soft` — мягкая акцентная подложка (hover-кольца, плитка MAX).

### Neutral
- `--bg` + `--bg-glow-1/2` — фон и его свечения.
- `--surface` (полупрозрачная), `--surface-solid`, `--surface-2` (вложенные),
  `--surface-hover`.
- `--text` / `--text-muted`.
- `--border` / `--border-hover`.

### Status
`--success`, `--warning`, `--info`, `--danger` + `--success-ring` для ореола
статус-точки.

### Named Rules
**Gradient-Is-Fill.** Градиент — только заливка или декор. Текст градиентом не
набирается.
**Solid-Text-On-Glass.** Текст на стекле — сплошным токеном, не полупрозрачным.
**One-Glow.** Не более двух светящихся элементов в зоне видимости; свечение —
акцент, не украшение.
**White-On-Dark-Stops.** Белый текст только на `--grad-accent` и
`--accent-solid`; `#3B82F6` и фиолетовый стоп `#7C3AED` под текстом запрещены.

## Typography

**Display/Body:** Inter. **Label/Metric:** JetBrains Mono.

- Display (700, 56px) — H1 hero; на планшете 40px, на мобильном 34px.
- Headline (700, 32px) — H2 секций; на мобильном 26px.
- Title (600, 20px) — карточки и тарифы; timeline 15px.
- Body (400, 16/1.6), Small (400, 14).
- Label (500 mono, 12px, uppercase, 0.08em) — бейджи, статусы.
- Metric (500 mono, 32px) — метрики виджета; цена 24px.

**Named Rule. Mono-For-Machine.** Числа, цены, статусы и технические лейблы —
только JetBrains Mono.

## Layout

Bento-grid 12 колонок, `gap` 16px, контейнер 1200px, паддинг 24px. Размер блока
равен значимости. Брейкпоинты: ≥1024 / 640–1023 / <640. Вертикальный отступ
секций — `--space-6` (32px) сверху и снизу, то есть 64px между секциями. У секций
`scroll-margin-top` под липкую шапку.

**Липкая шапка** (64px): стекло, логотип, якорные ссылки, переключатель темы.
При скролле — нижняя граница и тень. На мобильном — бургер и стеклянная панель.

## Elevation & Depth

- Светлая: тень покоя → `--shadow-lifted` + акцентная граница на hover.
- Тёмная: слабая тень + свечение как акцент; у primary-кнопки — цветная тень
  (`--glow-primary`, hover `--accent-glow`).
- Стекло: `--glass-bg` + `blur(20px)` + `--glass-border` + `--inset-highlight`.
  Только шапка, hero-виджет, мобильное меню и футер.
- Fallback: `@supports not (backdrop-filter)` → `--surface-solid`.

**Named Rule. Selective Glass.** Blur только на фиксированных/key-участках, не на
десятках карточек в потоке.

## Shapes

Радиусы: окно/панели 24px, карточки 16px, кнопки/поля 10px, пилюли 999px.
Контуры 1px, `--border`; на hover — акцентная граница, у выделенного тарифа —
градиентная (`card--accent`), у primary-ссылки MAX — акцентная.

## Components

### Buttons
Primary — `--grad-accent` + `--glow-primary`, белый текст; hover —
`brightness(1.08)`, `translateY(-1px)`; active — `translateY(0)`. Outline —
полупрозрачная поверхность (`--surface`), hover — акцентная граница + кольцо
`--accent-soft`.
Ghost — текст `--accent-text`. Высоты 44px (CTA 48px). В CTA кнопка инвертируется
в белую с текстом `--accent-solid`.

### Cards
`--surface` + `--border` + `--inset-highlight` + тень покоя. Hover — `-4px`,
`--shadow-lifted`, акцентная граница. `card--accent` — двухслойный градиентный
бордер, подъём, glow. `card--flat` — без тени. featured-тариф приподнят на
8px на десктопе.

### Hero widget
Настоящее стекло (`--radius-window`) + радиальное accent-свечение в углу +
статус-строка; сетка 2×2 метрик.

### Fields
`--surface`, высота 44px (CTA 48px), focus — акцентная граница + кольцо
`--accent-soft`. В CTA — белая полупрозрачная заливка, тёмный текст, белое
кольцо; ошибка — белая граница + красный ореол. В `forced-colors: active` фокус
поля сохраняется обводкой. Логика валидации не меняется.

### Timeline
Узлы 36px с mono-номерами, соединительная линия `--border`; на планшете —
вертикаль (нода слева, текст справа).

### CTA panel
Единственная крупная градиентная заливка + свечение, белый текст, стеклянные
поля, стеклянный meter заполнения.

### Contacts
MAX — единственный primary (акцентная подложка и граница); Telegram/email/телефон
— приглушённые ссылки; соцсети — иконки 44px.

## Motion

- Смена темы — transition фона/текста (320ms).
- Фон-свечения — «дыхание» 16s (лёгкий сдвиг и прозрачность).
- Reveal — `translateY(16px)` + opacity, 320ms, stagger по 60ms на соседей.
- Hover-подъём, `scaleX`-прогресс, пульс статус-точки 2.4s.
- Шапка — уплотнение при скролле, подсветка активной ссылки.
- `prefers-reduced-motion: reduce` — свечения/stagger/пульс отключены.

## Do's and Don'ts

### Do
- Держать один фил-градиент и ≤10% акцента на экран.
- Стекло — только там, где оно читается; текст на плотной подложке.
- Числа и статусы — JetBrains Mono.
- Сохранять `focus-visible` и `prefers-reduced-motion`.

### Don't
- Не набирать текст градиентом.
- Не использовать `#3B82F6`/`#7C3AED` под текстом.
- Не включать blur и свечения всюду — это разрушает и производительность, и
  иерархию.
- Не добавлять параллакс и более одного типа появления на элемент.
- Не вводить фотостоки и декоративные иллюстрации.
```

- [ ] **Step 2: Проверить, что старые правила-запреты обновлены**

Run:
```powershell
"gradient rule: " + (Select-String -Path DESIGN.md -Pattern 'Gradient-Is-Fill' -SimpleMatch -Quiet)
"no old blue-only rule: " + (-not (Select-String -Path DESIGN.md -Pattern 'Три акцентных токена' -SimpleMatch -Quiet))
```
Expected: `gradient rule: True`, `no old blue-only rule: True`.

- [ ] **Step 3: Коммит**

```powershell
git add DESIGN.md
git commit -m "docs: rewrite design system for glass, gradient and glow language"
```

---

## Task 10: Финальная верификация

**Files:**
- Verify: вся страница и оба документа

- [ ] **Step 1: Токен-аудит**

Run:
```powershell
node tools/check-tokens.mjs
```
Expected: `OK: ...` (exit 0).

- [ ] **Step 2: Синтаксис JS**

Run:
```powershell
node --check js/app.js
```
Expected: пустой вывод.

- [ ] **Step 3: Ручной чек-лист в браузере**

Открыть `index.html` и `privacy.html`. Проверить:
- Светлая и тёмная темы; старт по системной; без мерцания при загрузке.
- Три ширины: ≥1024 (12 колонок), 640–1023 (2 колонки, вертикальный timeline),
  <640 (1 колонка, бургер-меню).
- Клавиатурная навигация: по Tab виден `focus-visible` на всех интерактивных
  элементах; бургер открывается/закрывается, Escape закрывает.
- `prefers-reduced-motion: reduce` (эмуляция в DevTools → Rendering): свечения,
  stagger и пульс отключены, контент виден.
- Отключённый JS: контент читается (нет `html.js`, reveal не скрывает).
- Шапка липнет и уплотняется; активная ссылка подсвечивается.
- Форма: поля, live-статусы, счётчик 0/2, валидация; отправка на локальном
  `file://` не работает — проверяется на хостинге с PHP.

- [ ] **Step 4: Проверить отсутствие регрессий в контенте**

Run:
```powershell
git diff --stat HEAD~9 -- index.html
```
Expected: изменения только в разметке шапки/темы (без правок текстов, цен,
структуры секций). Если в diff появились изменения текстов — откатить их.

- [ ] **Step 5: Финальный коммит (если остались правки)**

```powershell
git status --short
git add -A
git commit -m "chore: final polish after design refactor verification"
```
Если правок нет — пропустить.

---

## Review-driven follow-ups (внесено в ходе ревью)

- **`theme-color` под новый фон.** В `index.html` и `privacy.html` две
  `<meta name="theme-color">` приведены к `#F0F4F8` (светлая) и `#0A0E27`
  (тёмная); в `js/app.js` `themeColors` обновлён на
  `{ light: '#f0f4f8', dark: '#0a0e27' }`. (В исходном плане не было учтено, что
  эти значения дублируют `--bg`.)
- **Футер — общий компонент.** Правила `.footer*` перенесены из `sections.css`
  в `components.css`, потому что `privacy.html` подключает `components.css`, но
  не `sections.css`.
- **A11y и мелочи:** в скрытом мобильном меню добавлен `visibility` (убирает
  ссылки из tab-order); `.field:focus` получил `forced-colors`-обводку;
  успех/ошибка формы различаются цветом; `.metric__value` не клипается на
  планшете; `.profile` снова занимает 2 строки на десктопе; ссылки навигации
  резолвятся через `getElementById` (без построения селекторов из `href`).

---

## Self-Review

**Покрытие спеки:**
- Цвет/градиент/стекло/свечение → Task 2, 5, 6.
- Типографика → Task 3 (база), Task 6 (размеры секций).
- Липкая шапка + мобильное меню → Task 4, 5, 7.
- Компоненты (кнопки, карточки, виджет, поля, timeline, CTA, контакты, футер) →
  Task 5, 6.
- Движение → Task 3 (свечения/reveal), Task 7 (stagger, шапка).
- Архитектура (4 CSS-файла, JS) → Task 2–6, 7.
- Производительность/fallback → Task 3 (слой вместо `background-attachment`),
  Task 5 (`@supports`).
- privacy.html → Task 8.
- DESIGN.md → Task 9.
- Верификация → Task 1, 10.

**Проверка на плейсхолдеры:** нет «TBD/TODO»; каждый шаг содержит код или точную
команду с ожидаемым результатом.

**Согласованность имён:** токены совпадают между `tokens.css`, `base.css`,
`components.css`, `sections.css`, `legal.css` и `tools/check-tokens.mjs`; классы
( `.site-header`, `.site-nav`, `.menu-toggle`, `.brand__sign`, `.card--accent`,
`.glass`, `.widget`, `.cta__*`, `.field*`, `.timeline__*`) совпадают между HTML,
CSS и JS.
