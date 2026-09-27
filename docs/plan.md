# ArtKull Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать одностраничный статический сайт ArtKull (HTML + CSS + vanilla JS) по спецификации `docs/spec.md` и дизайн-гайду `docs/design-guide.md`.

**Architecture:** Одна страница `index.html`; стили разбиты на `tokens.css` → `base.css` → `components.css` → `sections.css`; поведение — один `js/app.js` (тема, IntersectionObserver, счётчики, прогресс-бары, форма-заглушка). Тёмная тема через `[data-theme]` на `<html>` с анти-мерцанием инлайн-скриптом в `<head>`. Без сборки и зависимостей, кроме Google Fonts.

**Tech Stack:** HTML5, CSS3 (custom properties, grid), vanilla ES5-совместимый JS, Google Fonts (Inter, JetBrains Mono), инлайн-SVG.

**Проверка на каждом шаге:** открыть `index.html` в браузере (`Start-Process index.html`) и свериться с ожидаемым результатом; консоль без ошибок. Автотестов нет (статический сайт без тест-инфраструктуры).

---

## Файловая структура

| Файл | Ответственность |
|------|-----------------|
| `index.html` | Разметка страницы и семантические лендмарки |
| `css/tokens.css` | CSS-переменные, светлая и тёмная темы |
| `css/base.css` | Reset, типографика, контейнер, bento-сетка, reveal, a11y |
| `css/components.css` | card, badge, btn, check, pill, metric, progress, field, status-dot, theme-toggle, section-header, icon |
| `css/sections.css` | Стили секций: hero, услуги, о себе, этапы, CTA, контакты, футер + адаптив |
| `js/app.js` | Тема, reveal, счётчики, прогресс-бары, форма-заглушка |
| `assets/logo.svg` | Логотип: знак 3×3 + «ArtKull web development» |
| `assets/favicon.svg` | Знак 3×3 для favicon |

---

## Task 1: Токены дизайна

**Files:**
- Create: `css/tokens.css`

- [ ] **Step 1: Создать `css/tokens.css`**

```css
:root {
  --bg: #F4F5F7;
  --surface: #FFFFFF;
  --surface-2: #FAFAFB;
  --text: #1A1A2E;
  --text-muted: #6B7280;
  --accent: #3B82F6;
  --accent-hover: #2563EB;
  --accent-soft: #EFF6FF;
  --accent-solid: #2563EB;
  --accent-solid-hover: #1D4ED8;
  --accent-text: #2563EB;
  --success: #10B981;
  --border: #E5E7EB;

  --shadow: 0 1px 3px rgba(0, 0, 0, .04), 0 1px 2px rgba(0, 0, 0, .06);
  --shadow-lifted: 0 8px 24px rgba(0, 0, 0, .08);

  --radius-card: 16px;
  --radius-el: 8px;
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
}

[data-theme="dark"] {
  --bg: #0F1117;
  --surface: #1A1B26;
  --surface-2: #22232F;
  --text: #E4E4E7;
  --text-muted: #9CA3AF;
  --accent: #60A5FA;
  --accent-hover: #3B82F6;
  --accent-soft: #1E293B;
  --accent-solid: #2563EB;
  --accent-solid-hover: #1D4ED8;
  --accent-text: #60A5FA;
  --success: #34D399;
  --border: #2A2B3A;

  --shadow: none;
  --shadow-lifted: none;
}
```

- [ ] **Step 2: Проверить**

Открыть `css/tokens.css`, убедиться что нет синтаксических ошибок. Временно подключить файл в тестовую страницу или проверить позже на Task 5.

- [ ] **Step 3: Commit**

```bash
git add css/tokens.css
git commit -m "feat: add design tokens with light and dark themes"
```

---

## Task 2: База — reset, типографика, сетка

**Files:**
- Create: `css/base.css`

- [ ] **Step 1: Создать `css/base.css`**

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
  transition: background .3s ease, color .3s ease;
}

h1, h2, h3, h4 { margin: 0; line-height: 1.2; letter-spacing: -0.01em; }
p { margin: 0; }
a { color: inherit; text-decoration: none; }
ul, ol { margin: 0; padding: 0; list-style: none; }
img { max-width: 100%; display: block; }
button { font: inherit; color: inherit; cursor: pointer; }

.mono { font-family: var(--font-mono); font-weight: 500; }

.container {
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--space-5);
}

.section { padding: var(--space-6) 0; }
.section--hero { position: relative; padding-top: var(--space-5); }

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
  transition: opacity .4s cubic-bezier(.2, .7, .3, 1),
              translate .4s cubic-bezier(.2, .7, .3, 1),
              transform .2s ease,
              box-shadow .2s ease,
              border-color .2s ease;
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
  .js .reveal { opacity: 1; translate: 0 0; }
}
```

- [ ] **Step 2: Проверить**

Убедиться, что правила `.col-*` и медиа-запросы не имеют опечаток. Полная визуальная проверка — на Task 5.

- [ ] **Step 3: Commit**

```bash
git add css/base.css
git commit -m "feat: add base styles, grid, and reveal animations"
```

---

## Task 3: Компоненты

**Files:**
- Create: `css/components.css`

- [ ] **Step 1: Создать `css/components.css`**

```css
/* Card */
.card {
  background: var(--surface);
  border: 1px solid transparent;
  border-radius: var(--radius-card);
  padding: var(--space-5);
  box-shadow: var(--shadow);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.card--flat { box-shadow: none; border-color: var(--border); }
.card--accent { border-color: var(--accent); box-shadow: var(--shadow-lifted); }
.card--hover:hover { transform: translateY(-4px); box-shadow: var(--shadow-lifted); }
[data-theme="dark"] .card { border-color: var(--border); }
[data-theme="dark"] .card--accent { border-color: var(--accent); }

/* Badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-el);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
  line-height: 1.4;
}
.badge--neutral { background: var(--surface-2); color: var(--text-muted); border: 1px solid var(--border); }
.badge--accent { background: var(--accent-solid); color: #fff; }
.badge--outline { background: transparent; border: 1px solid var(--border); color: var(--text); }

/* Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 44px;
  padding: 0 20px;
  border-radius: var(--radius-el);
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: background .2s ease, transform .2s ease,
              border-color .2s ease, color .2s ease;
}
.btn:active { transform: translateY(1px); }
.btn--primary { background: var(--accent-solid); color: #fff; }
.btn--primary:hover { background: var(--accent-solid-hover); }
.btn--outline { background: transparent; border-color: var(--border); color: var(--text); }
.btn--outline:hover { border-color: var(--accent); background: var(--surface-2); }
.btn--ghost { background: transparent; color: var(--accent-text); padding: 0; height: auto; }
.btn--block { width: 100%; }

/* Checklist */
.checklist { display: flex; flex-direction: column; gap: var(--space-3); }
.check { display: flex; gap: var(--space-3); align-items: flex-start; font-size: 14px; line-height: 1.5; }
.check__glyph { flex: none; font-family: var(--font-mono); }
.check--on .check__glyph { color: var(--success); }
.check--off { color: var(--text-muted); }

/* Pill */
.pill {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  border: 1px solid var(--border);
  font-size: 12px;
  font-weight: 500;
  transition: border-color .2s ease;
}
.pill:hover { border-color: var(--accent); }

/* Metric */
.metric { display: flex; flex-direction: column; gap: 2px; }
.metric__value {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -.01em;
}
.metric__label {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-muted);
}

/* Progress */
.progress { height: 4px; border-radius: var(--radius-pill); background: var(--surface-2); overflow: hidden; }
.progress__bar {
  display: block;
  height: 100%;
  width: 0;
  background: var(--accent);
  border-radius: inherit;
  transition: width .6s cubic-bezier(.2, .7, .3, 1);
}

/* Field */
.field {
  height: 44px;
  width: 100%;
  padding: 0 14px;
  border-radius: var(--radius-el);
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 14px;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.field::placeholder { color: var(--text-muted); }
.field:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
  outline: none;
}
@media (forced-colors: active) {
  .field:focus-visible { outline: 2px solid; }
}

/* Status dot */
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); }
.status-dot--on { background: var(--success); box-shadow: 0 0 0 3px rgba(16, 185, 129, .18); }

/* Theme toggle */
.theme-toggle {
  position: absolute;
  top: var(--space-5);
  right: max(var(--space-5), calc((100% - var(--container)) / 2 + var(--space-5)));
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  z-index: 2;
  transition: border-color .2s ease, color .2s ease, transform .2s ease;
}
.theme-toggle:hover { border-color: var(--accent); color: var(--accent); }
.theme-toggle__moon { display: none; }
[data-theme="dark"] .theme-toggle__moon { display: block; }
[data-theme="dark"] .theme-toggle__sun { display: none; }

/* Section header */
.section-header { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-5); }
.section-header__label {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.section-header h2 { font-size: 32px; font-weight: 700; }

/* Icon */
.icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 1.5;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.icon--lg { width: 24px; height: 24px; }
.icon--sm { width: 16px; height: 16px; }
```

- [ ] **Step 2: Проверить**

Проверить синтаксис (парность фигурных скобок). Полная проверка — на Task 5–10.

- [ ] **Step 3: Commit**

```bash
git add css/components.css
git commit -m "feat: add UI components (card, button, badge, form, etc.)"
```

---

## Task 4: Логотип и favicon

**Files:**
- Create: `assets/logo.svg`
- Create: `assets/favicon.svg`

- [ ] **Step 1: Создать `assets/favicon.svg`**

Знак 3×3, скруглённые квадраты, закрашены: верх-центр, средняя строка целиком, низ-лево, низ-право (верх-лево, верх-право и низ-центр — контурные, паттерн как в логотипе).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="ArtKull">
  <rect width="64" height="64" rx="14" fill="#F4F5F7"/>
  <g>
    <rect x="8" y="8" width="14" height="14" rx="4" fill="none" stroke="#1A1A2E" stroke-width="2"/>
    <rect x="25" y="8" width="14" height="14" rx="4" fill="#3B82F6"/>
    <rect x="42" y="8" width="14" height="14" rx="4" fill="none" stroke="#1A1A2E" stroke-width="2"/>
    <rect x="8" y="25" width="14" height="14" rx="4" fill="#3B82F6"/>
    <rect x="25" y="25" width="14" height="14" rx="4" fill="#3B82F6"/>
    <rect x="42" y="25" width="14" height="14" rx="4" fill="#3B82F6"/>
    <rect x="8" y="42" width="14" height="14" rx="4" fill="#3B82F6"/>
    <rect x="25" y="42" width="14" height="14" rx="4" fill="none" stroke="#1A1A2E" stroke-width="2"/>
    <rect x="42" y="42" width="14" height="14" rx="4" fill="#3B82F6"/>
  </g>
</svg>
```

- [ ] **Step 2: Создать `assets/logo.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 96" width="420" height="96" role="img" aria-label="ArtKull — web development">
  <g>
    <rect x="8" y="16" width="18" height="18" rx="5" fill="none" stroke="#1A1A2E" stroke-width="2.5"/>
    <rect x="30" y="16" width="18" height="18" rx="5" fill="#3B82F6"/>
    <rect x="52" y="16" width="18" height="18" rx="5" fill="none" stroke="#1A1A2E" stroke-width="2.5"/>
    <rect x="8" y="38" width="18" height="18" rx="5" fill="#3B82F6"/>
    <rect x="30" y="38" width="18" height="18" rx="5" fill="#3B82F6"/>
    <rect x="52" y="38" width="18" height="18" rx="5" fill="#3B82F6"/>
    <rect x="8" y="60" width="18" height="18" rx="5" fill="#3B82F6"/>
    <rect x="30" y="60" width="18" height="18" rx="5" fill="none" stroke="#1A1A2E" stroke-width="2.5"/>
    <rect x="52" y="60" width="18" height="18" rx="5" fill="#3B82F6"/>
  </g>
  <text x="92" y="52" font-family="Inter, system-ui, sans-serif" font-size="38" font-weight="700" letter-spacing="-1" fill="#1A1A2E">Art<tspan fill="#3B82F6">Kull</tspan></text>
  <text x="94" y="74" font-family="'JetBrains Mono', monospace" font-size="14" letter-spacing="3" fill="#6B7280">web development</text>
</svg>
```

- [ ] **Step 3: Проверить**

Открыть `assets/logo.svg` и `assets/favicon.svg` в браузере: знак 3×3 и надпись «Art**Kull**» (Kull синим), теглайн серым.

- [ ] **Step 4: Commit**

```bash
git add assets/logo.svg assets/favicon.svg
git commit -m "feat: add vector logo and favicon"
```

---

## Task 5: Каркас `index.html`, head и секция Hero

**Files:**
- Create: `index.html`
- Create: `css/sections.css`
- Create: `js/app.js` (пустой каркас, наполняется в Task 11)

- [ ] **Step 1: Создать `index.html`**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ArtKull — сайты под ключ. Быстро. Чисто. Без переплат.</title>
  <meta name="description" content="Разработка и запуск сайтов для бизнеса: от лендинга до каталога. Один разработчик, полная ответственность, без агентских наценок.">
  <meta property="og:title" content="ArtKull — сайты под ключ">
  <meta property="og:description" content="Лендинг за 5 дней, сайт компании за 10. Один человек, полная ответственность, без агентских наценок.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="assets/logo.svg">
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/sections.css">
  <script>
    (function () {
      var theme = null;
      try {
        theme = localStorage.getItem('artkull-theme');
      } catch (e) {
        theme = null;
      }
      if (theme !== 'light' && theme !== 'dark') {
        theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
</head>
<body>
  <main>
    <section id="hero" class="section section--hero">
      <button class="theme-toggle" type="button" aria-label="Переключить тему" aria-pressed="false">
        <svg class="icon theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        <svg class="icon theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

      <div class="container bento">
        <div class="hero__text col-7 reveal">
          <span class="hero__label">
            <span class="status-dot status-dot--on" aria-hidden="true"></span>
            Доступен для заказа
          </span>
          <h1 class="hero__title">Сайты под ключ.<br>Быстро. Чисто. Без переплат.</h1>
          <p class="hero__subtitle">Разработка и запуск сайтов для бизнеса — от лендинга до каталога. Один человек, полная ответственность, никаких агентских наценок.</p>
          <div class="hero__actions">
            <a class="btn btn--primary" href="#contacts">Запустить проект</a>
            <a class="btn btn--outline" href="#services">Смотреть тарифы</a>
          </div>
        </div>

        <aside class="hero__widget col-5 reveal" aria-label="Профиль разработчика">
          <div class="widget">
            <div class="widget__head">Профиль разработчика</div>
            <div class="widget__grid">
              <div class="widget__cell">
                <div class="metric">
                  <span class="metric__value" data-count="47">47</span>
                  <span class="metric__label">проектов</span>
                </div>
              </div>
              <div class="widget__cell">
                <div class="metric">
                  <span class="metric__value">от 5 дней</span>
                  <span class="metric__label">срок</span>
                </div>
              </div>
              <div class="widget__cell">
                <div class="metric">
                  <span class="metric__value">от 5 000 ₽</span>
                  <span class="metric__label">бюджет</span>
                </div>
              </div>
              <div class="widget__cell">
                <div class="metric">
                  <span class="metric__value">100%</span>
                  <span class="metric__label">лично</span>
                </div>
              </div>
            </div>
            <div class="widget__status">
              <span class="status-dot status-dot--on" aria-hidden="true"></span>
              Онлайн · отвечает быстро
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
  <script src="js/app.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Создать `css/sections.css`** (пока только hero)

```css
/* Hero */
.hero__text { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-4); justify-content: center; }
.hero__label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.hero__title { font-size: 56px; font-weight: 700; letter-spacing: -.02em; }
.hero__subtitle { font-size: 18px; color: var(--text-muted); max-width: 52ch; }
.hero__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

.hero__widget { display: flex; }
.widget {
  position: relative;
  width: 100%;
  background: var(--surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow);
  border: 1px solid transparent;
  overflow: hidden;
}
[data-theme="dark"] .widget { border-color: var(--border); }
.widget::before {
  content: "";
  position: absolute;
  top: -70px;
  right: -70px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, var(--accent-soft), transparent 70%);
  pointer-events: none;
}
.widget__head {
  position: relative;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.widget__grid { position: relative; display: grid; grid-template-columns: 1fr 1fr; }
.widget__cell { padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border); }
.widget__cell:nth-child(odd) { border-right: 1px solid var(--border); }
.widget__status {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-size: 13px;
  color: var(--text-muted);
}

/* Стаггер метрик */
.js .hero__widget .widget__cell { opacity: 0; transform: translateY(8px); transition: opacity .35s ease, transform .35s ease; }
.js .hero__widget.is-visible .widget__cell { opacity: 1; transform: none; }
.js .hero__widget.is-visible .widget__cell:nth-child(1) { transition-delay: .05s; }
.js .hero__widget.is-visible .widget__cell:nth-child(2) { transition-delay: .13s; }
.js .hero__widget.is-visible .widget__cell:nth-child(3) { transition-delay: .21s; }
.js .hero__widget.is-visible .widget__cell:nth-child(4) { transition-delay: .29s; }
```

- [ ] **Step 3: Создать `js/app.js`** (заглушка, чтобы не было 404)

```js
(function () {
  // заполняется в Task 11
})();
```

- [ ] **Step 4: Проверить**

Run: `Start-Process index.html`
Ожидаемо: hero на две зоны, слева заголовок и кнопки, справа виджет «Профиль разработчика» с 4 метриками и статус-строкой; статус-точки зелёные; в правом верхнем углу — круглая кнопка темы. Консоль без ошибок (кроме возможных предупреждений Google Fonts офлайн).

- [ ] **Step 5: Commit**

```bash
git add index.html css/sections.css js/app.js
git commit -m "feat: add page shell, head, and hero section"
```

---

## Task 6: Секция «Услуги»

**Files:**
- Modify: `index.html` (добавить секцию после hero, внутри `<main>`)
- Modify: `css/sections.css` (добавить блок «Услуги»)

- [ ] **Step 1: Добавить разметку в `index.html`** после `</section>` секции hero

```html
    <section id="services" class="section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-header__label">Тарифы</span>
          <h2>Услуги</h2>
        </div>
        <div class="bento">
          <article class="card card--hover price-card col-4 reveal">
            <span class="badge badge--neutral">Базовый</span>
            <h3 class="price-card__title">Сайт-визитка / Лендинг</h3>
            <p class="price-card__price">
              <span class="mono">от 5 000 ₽</span>
              <span class="price-card__term">· срок от 5 дней</span>
            </p>
            <hr class="divider">
            <ul class="checklist">
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Персональный дизайн</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> HTML, CSS, JavaScript</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> SEO-оптимизация</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Бесплатный хостинг</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Адаптив под мобильные</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Форма обратной связи</li>
              <li class="check check--off"><span class="check__glyph" aria-hidden="true">○</span> Блог / CMS — не входит</li>
            </ul>
            <a class="btn btn--outline btn--block" href="#contacts">Выбрать<span class="sr-only"> тариф «Сайт-визитка / Лендинг»</span></a>
          </article>

          <article class="card card--accent card--hover price-card price-card--featured col-4 reveal">
            <span class="badge badge--accent">Популярный</span>
            <h3 class="price-card__title">Сайт компании</h3>
            <p class="price-card__price">
              <span class="mono">от 15 000 ₽</span>
              <span class="price-card__term">· срок от 10 дней</span>
            </p>
            <hr class="divider">
            <ul class="checklist">
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Всё из тарифа «Сайт-визитка»</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Многостраничная структура</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> CMS на выбор (Tilda / Astro / Craftum)</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Каталог услуг</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Интеграция с CRM/почтой</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Анимации и интерактив</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Настройка аналитики (Яндекс.Метрика)</li>
            </ul>
            <a class="btn btn--primary btn--block" href="#contacts">Выбрать<span class="sr-only"> тариф «Сайт компании»</span></a>
          </article>

          <article class="card card--hover price-card col-4 reveal">
            <span class="badge badge--neutral">Максимум</span>
            <h3 class="price-card__title">Интернет-магазин / Каталог</h3>
            <p class="price-card__price">
              <span class="mono">от 35 000 ₽</span>
              <span class="price-card__term">· срок от 14 дней</span>
            </p>
            <hr class="divider">
            <ul class="checklist">
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Всё из тарифа «Сайт компании»</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Каталог товаров с фильтрами</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Корзина и оформление заказа</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Платёжные системы</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Личный кабинет</li>
              <li class="check check--on"><span class="check__glyph" aria-hidden="true">✓</span> Интеграция со складом/1С</li>
              <li class="check check--off"><span class="check__glyph" aria-hidden="true">○</span> Мобильное приложение — отдельно</li>
            </ul>
            <a class="btn btn--outline btn--block" href="#contacts">Обсудить<span class="sr-only"> тариф «Интернет-магазин / Каталог»</span></a>
          </article>

          <div class="card card--flat banner col-12 reveal">
            <p class="banner__text"><strong>Нужно что-то нестандартное?</strong> Парсер, Telegram-бот, интеграция с API — обсудим.</p>
            <a class="btn btn--ghost" href="#contacts">Связаться →</a>
          </div>
        </div>
      </div>
    </section>
```

- [ ] **Step 2: Добавить CSS в конец `css/sections.css`**

```css
/* Услуги */
.price-card { display: flex; flex-direction: column; gap: var(--space-4); }
.price-card--featured { transform: translateY(-8px); align-self: start; }
.price-card--featured.card--hover:hover { transform: translateY(-12px); }
.price-card.price-card--featured .badge { align-self: center; }
.price-card__title { font-size: 20px; font-weight: 600; }
.price-card__price { display: flex; align-items: baseline; gap: var(--space-2); flex-wrap: wrap; }
.price-card__price .mono { font-size: 24px; }
.price-card__term { color: var(--text-muted); font-size: 14px; }
.price-card .btn { margin-top: auto; }
.price-card .badge { align-self: flex-start; }
.price-card .divider { margin: 0; }
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-4) var(--space-5);
}
.banner__text { font-size: 15px; color: var(--text-muted); }
.banner__text strong { color: var(--text); }
```

- [ ] **Step 3: Проверить**

Run: `Start-Process index.html`
Ожидаемо: три тарифные карточки в ряд; средняя приподнята, с синей рамкой и бейджем «Популярный» сверху по центру; чек-листы с зелёными ✓ и серыми ○; под карточками плашка «Связаться →». Клик по «Смотреть тарифы» скроллит к секции.

- [ ] **Step 4: Commit**

```bash
git add index.html css/sections.css
git commit -m "feat: add services/pricing section"
```

---

## Task 7: Секция «О себе» и преимущества

**Files:**
- Modify: `index.html` (после секции услуг)
- Modify: `css/sections.css` (добавить блок «О себе»)

- [ ] **Step 1: Добавить разметку в `index.html`**

```html
    <section id="about" class="section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-header__label">О себе</span>
          <h2>Почему я</h2>
        </div>
        <div class="bento">
          <article class="card profile col-6 reveal">
            <div class="profile__head">
              <div class="profile__avatar" aria-hidden="true">АФ</div>
              <div>
                <div class="profile__name">Имя Фамилия</div>
                <div class="profile__role">Веб-разработчик · фриланс</div>
              </div>
            </div>
            <p class="profile__bio">Делаю сайты с 2019 года. Работаю один — от первого брифа до запуска. Это значит, что ты общаешься напрямую с человеком, который пишет код, а не с менеджером, который передаёт задачу дальше.</p>
            <ul class="profile__tags">
              <li class="pill">HTML</li>
              <li class="pill">CSS</li>
              <li class="pill">JavaScript</li>
              <li class="pill">Astro</li>
              <li class="pill">React</li>
              <li class="pill">Tilda</li>
              <li class="pill">SEO</li>
              <li class="pill">Figma</li>
            </ul>
            <div class="profile__stats">
              <div class="metric">
                <span class="metric__value" data-count="47">47</span>
                <span class="metric__label">проектов запущено</span>
              </div>
              <div class="metric">
                <span class="metric__value">5 лет</span>
                <span class="metric__label">в разработке</span>
              </div>
            </div>
          </article>

          <article class="card card--hover feature col-2 reveal">
            <svg class="icon icon--lg feature__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <h3 class="feature__title">Один человек, полная ответственность</h3>
            <p class="feature__text">Никаких менеджеров и передачи между отделами. Ты говоришь с разработчиком напрямую — от идеи до запуска. Это быстрее и дешевле.</p>
          </article>

          <article class="card card--hover feature col-2 reveal">
            <svg class="icon icon--lg feature__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <circle cx="7" cy="7" r="1.5"/>
            </svg>
            <h3 class="feature__title">Цена без агентской наценки</h3>
            <p class="feature__text">У агентства 30–50% счёта — это зарплаты и аренда. У меня нет офиса и отдела продаж. Ты платишь за работу, а не за инфраструктуру.</p>
          </article>

          <article class="card card--hover feature col-4 reveal">
            <svg class="icon icon--lg feature__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/>
            </svg>
            <h3 class="feature__title">Скорость без потери качества</h3>
            <p class="feature__text">Лендинг — за 5 дней. Сайт компании — за 10. Не потому что «тяп-ляп», а потому что один человек не тратит время на согласования между тремя людьми.</p>
          </article>
        </div>
      </div>
    </section>
```

- [ ] **Step 2: Добавить CSS в конец `css/sections.css`**

```css
/* О себе */
.profile { display: flex; flex-direction: column; gap: var(--space-4); grid-row: span 2; }
.profile__head { display: flex; align-items: center; gap: var(--space-4); }
.profile__avatar {
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 16px;
}
.profile__name { font-size: 18px; font-weight: 600; }
.profile__role { font-size: 14px; color: var(--text-muted); }
.profile__bio { font-size: 14px; color: var(--text-muted); }
.profile__tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.profile__stats { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: auto; }

.feature { display: flex; flex-direction: column; gap: var(--space-3); }
.feature__icon { color: var(--accent); }
.feature__title { font-size: 16px; font-weight: 600; }
.feature__text { font-size: 14px; color: var(--text-muted); }
```

- [ ] **Step 3: Проверить**

Run: `Start-Process index.html`
Ожидаемо: слева профиль-карточка на 6 колонок (аватар-квадрат, имя, био, пилюли, статистика), справа две карточки преимуществ по 2 колонки в верхнем ряду и одна на 4 колонки в нижнем. Пилюли подсвечивают рамку при hover.

- [ ] **Step 4: Commit**

```bash
git add index.html css/sections.css
git commit -m "feat: add about and advantages section"
```

---

## Task 8: Секция «Этапы разработки»

**Files:**
- Modify: `index.html` (после секции «О себе»)
- Modify: `css/sections.css` (добавить блок «Этапы»)

- [ ] **Step 1: Добавить разметку в `index.html`**

```html
    <section id="process" class="section">
      <div class="container">
        <div class="card process-card reveal">
          <div class="section-header">
            <span class="section-header__label">Процесс</span>
            <h2>Как мы будем работать</h2>
          </div>
          <ol class="timeline">
            <li class="timeline__item">
              <span class="timeline__dot">1</span>
              <div class="timeline__body">
                <h3 class="timeline__title">Бриф</h3>
                <p class="timeline__text">Обсуждаем задачу, цели, сроки, бюджет. Ты заполняешь короткий бриф или мы созваниваемся. Бесплатно.</p>
                <div class="timeline__progress">
                  <div class="progress"><span class="progress__bar" data-value="10"></span></div>
                  <span class="timeline__percent">10%</span>
                </div>
              </div>
            </li>
            <li class="timeline__item">
              <span class="timeline__dot">2</span>
              <div class="timeline__body">
                <h3 class="timeline__title">Прототип и дизайн</h3>
                <p class="timeline__text">Собираю структуру страниц и визуал. Согласуем макеты в Figma. Правки до утверждения — без доплат.</p>
                <div class="timeline__progress">
                  <div class="progress"><span class="progress__bar" data-value="30"></span></div>
                  <span class="timeline__percent">30%</span>
                </div>
              </div>
            </li>
            <li class="timeline__item">
              <span class="timeline__dot">3</span>
              <div class="timeline__body">
                <h3 class="timeline__title">Разработка</h3>
                <p class="timeline__text">Пишу код, верстаю, подключаю скрипты и интеграции. Показываю прогресс — смотришь на тестовом адресе в реальном времени.</p>
                <div class="timeline__progress">
                  <div class="progress"><span class="progress__bar" data-value="40"></span></div>
                  <span class="timeline__percent">40%</span>
                </div>
              </div>
            </li>
            <li class="timeline__item">
              <span class="timeline__dot">4</span>
              <div class="timeline__body">
                <h3 class="timeline__title">Запуск</h3>
                <p class="timeline__text">Переносим на хостинг, подключаю домен, настраиваю SSL, аналитику, SEO. Сайт в эфире.</p>
                <div class="timeline__progress">
                  <div class="progress"><span class="progress__bar" data-value="10"></span></div>
                  <span class="timeline__percent">10%</span>
                </div>
              </div>
            </li>
            <li class="timeline__item">
              <span class="timeline__dot">5</span>
              <div class="timeline__body">
                <h3 class="timeline__title">Поддержка</h3>
                <p class="timeline__text">30 дней бесплатной поддержки после запуска. Дальше — по договорённости, без абонплаты.</p>
                <div class="timeline__progress">
                  <div class="progress"><span class="progress__bar" data-value="10"></span></div>
                  <span class="timeline__percent">10%</span>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
```

- [ ] **Step 2: Добавить CSS в конец `css/sections.css`**

```css
/* Этапы */
.process-card { padding: var(--space-5); }
.timeline {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-4);
  position: relative;
  margin: var(--space-6) 0 0;
}
.timeline::before {
  content: "";
  position: absolute;
  top: 18px;
  left: 18px;
  right: 18px;
  height: 1px;
  background: var(--border);
}
.timeline__item { position: relative; display: flex; flex-direction: column; gap: var(--space-3); }
.timeline__dot {
  position: relative;
  z-index: 1;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text);
}
.timeline__body { display: flex; flex-direction: column; gap: var(--space-2); height: 100%; }
.timeline__title { font-size: 15px; font-weight: 600; }
.timeline__text { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
.timeline__progress { margin-top: auto; display: flex; flex-direction: column; gap: 6px; padding-top: var(--space-3); }
.timeline__percent { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
```

- [ ] **Step 3: Проверить**

Run: `Start-Process index.html`
Ожидаемо: карточка на всю ширину, заголовок «Как мы будем работать» + лейбл «Процесс», 5 нод в ряд, соединённых тонкой линией, под каждой — микро-прогресс-бар и процент. Полосы заполняются при появлении в зоне видимости (после Task 11 — пока ширина 0). На этом шаге полосы могут быть пустыми — это нормально.

- [ ] **Step 4: Commit**

```bash
git add index.html css/sections.css
git commit -m "feat: add development process timeline section"
```

---

## Task 9: Секция CTA с формой

**Files:**
- Modify: `index.html` (после секции «Этапы»)
- Modify: `css/sections.css` (добавить блок «CTA»)

- [ ] **Step 1: Добавить разметку в `index.html`**

```html
    <section id="cta" class="section">
      <div class="container bento">
        <div class="card cta reveal">
          <span class="cta__pattern" aria-hidden="true"></span>
          <h2>Запустим твой проект</h2>
          <p class="cta__subtitle">Напиши — и в течение дня получишь оценку стоимости и сроков. Без обязательств.</p>
          <form class="cta__form" novalidate>
            <label class="sr-only" for="cta-name">Имя</label>
            <input class="field" id="cta-name" name="name" type="text" placeholder="Имя" autocomplete="name">
            <label class="sr-only" for="cta-contact">Телефон или email</label>
            <input class="field" id="cta-contact" name="contact" type="text" placeholder="Телефон или email" autocomplete="tel">
            <button class="btn btn--primary" type="submit">Отправить заявку →</button>
          </form>
          <p class="cta__message" role="status" aria-live="polite"></p>
          <p class="cta__note">Или напиши напрямую — <a href="#contacts">Telegram</a> · <a href="#contacts">WhatsApp</a> · <a href="#contacts">Email</a></p>
        </div>
      </div>
    </section>
```

- [ ] **Step 2: Добавить CSS в конец `css/sections.css`**

```css
/* CTA */
.cta {
  grid-column: 3 / span 8;
  position: relative;
  overflow: hidden;
  text-align: center;
  background: var(--accent-solid);
  color: #fff;
  border: none;
  padding: var(--space-7) var(--space-6);
}
.cta__pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, .18) 1px, transparent 1px);
  background-size: 16px 16px;
  -webkit-mask-image: linear-gradient(135deg, #000, transparent 60%);
  mask-image: linear-gradient(135deg, #000, transparent 60%);
  pointer-events: none;
}
.cta h2 { position: relative; font-size: 32px; font-weight: 700; }
.cta__subtitle { position: relative; margin-top: var(--space-3); font-size: 16px; color: rgba(255, 255, 255, .95); }
.cta__form { position: relative; margin-top: var(--space-5); display: flex; gap: var(--space-3); flex-wrap: wrap; }
.cta__form .field {
  flex: 1 1 180px;
  height: 48px;
  background: rgba(255, 255, 255, .12);
  border-color: rgba(255, 255, 255, .3);
  color: #fff;
}
.cta__form .field::placeholder { color: rgba(255, 255, 255, .7); }
.cta__form .field:focus { border-color: #fff; box-shadow: 0 0 0 3px rgba(255, 255, 255, .25); }
.cta__form .btn { height: 48px; }
.cta__form .btn--primary { background: #fff; color: var(--accent-solid); }
.cta__form .btn--primary:hover { background: rgba(255, 255, 255, .9); }
.cta__note { position: relative; margin-top: var(--space-4); font-size: 13px; color: rgba(255, 255, 255, .95); }
.cta__note a { text-decoration: underline; text-underline-offset: 2px; }
.cta__message { position: relative; margin-top: var(--space-3); font-size: 13px; color: #fff; min-height: 1.2em; }
```

- [ ] **Step 3: Проверить**

Run: `Start-Process index.html`
Ожидаемо: центрированная карточка на 8 колонок с синей заливкой, белым заголовком, двумя полями и кнопкой в строке, точечным узором в углу. Нажатие кнопки пока ничего не делает (логика — Task 11), страница не перезагружается нежелательно — пока перезагрузится, это ок.

- [ ] **Step 4: Commit**

```bash
git add index.html css/sections.css
git commit -m "feat: add CTA section with stub form"
```

---

## Task 10: Контакты и футер

**Files:**
- Modify: `index.html` (после секции CTA, закрыть `<main>`, добавить `<footer>`)
- Modify: `css/sections.css` (добавить блок «Контакты» и «Футер»)

- [ ] **Step 1: Добавить разметку в `index.html`** — секцию контактов внутри `<main>`, затем закрыть `</main>` и добавить `<footer>`

```html
    <section id="contacts" class="section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-header__label">Контакты</span>
          <h2>Связаться</h2>
        </div>
        <div class="bento">
          <article class="card contacts-card col-6 reveal">
            <h3 class="contacts-card__title">Связаться напрямую</h3>
            <div class="contact-links">
              <a class="contact-link" href="https://t.me/username" target="_blank" rel="noopener">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>
                Telegram
              </a>
              <a class="contact-link" href="https://wa.me/70000000000" target="_blank" rel="noopener">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                WhatsApp
              </a>
              <a class="contact-link" href="mailto:you@example.com">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                Email
              </a>
              <a class="contact-link" href="tel:+70000000000">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Телефон
              </a>
            </div>
          </article>

          <article class="card contacts-card col-3 reveal">
            <h3 class="contacts-card__title">Соцсети</h3>
            <div class="socials">
              <a class="social-link" href="https://github.com/username" target="_blank" rel="noopener" aria-label="GitHub">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              </a>
              <a class="social-link" href="https://vk.com/username" target="_blank" rel="noopener" aria-label="VK">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h2.5c.5 2.5 1.8 4.2 3 4.8V8h2.5v4.2c1-.2 2.2-1.8 2.6-4.2H16c-.4 2-1.3 3.6-2.4 4.6 1.3.9 2.6 2.4 3.3 4.4h-2.7c-.6-1.6-1.6-2.7-2.8-3v3H8.8c-3 0-5.3-2.8-5.8-8z"/></svg>
              </a>
              <a class="social-link" href="https://behance.net/username" target="_blank" rel="noopener" aria-label="Behance">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h6a3 3 0 0 1 0 6H3z"/><path d="M3 12h6.5a3 3 0 0 1 0 6H3z"/><path d="M14 8h6"/><path d="M14 16h6a3 3 0 0 0-6-1z"/></svg>
              </a>
            </div>
          </article>

          <article class="card contacts-card col-3 reveal">
            <h3 class="contacts-card__title">Локация</h3>
            <p class="location">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Тюмень. Работаю удалённо по всей России.
            </p>
          </article>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer__inner">
      <span>© 2026 Имя Фамилия · <a href="#" aria-disabled="true">Политика конфиденциальности</a></span>
      <span>Сайт сделан вручную. Без конструкторов. Без шаблонов.</span>
    </div>
  </footer>
```

- [ ] **Step 2: Добавить CSS в конец `css/sections.css`**

```css
/* Контакты */
.contacts-card { display: flex; flex-direction: column; gap: var(--space-4); }
.contacts-card__title { font-size: 16px; font-weight: 600; }
.contact-links { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.contact-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 14px;
  border-radius: var(--radius-el);
  border: 1px solid var(--border);
  background: var(--surface-2);
  font-size: 14px;
  transition: border-color .2s ease, transform .2s ease;
}
.contact-link:hover { border-color: var(--accent); transform: translateY(-2px); }
.contact-link .icon { color: var(--accent); flex: none; }

.socials { display: flex; gap: var(--space-3); }
.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-el);
  border: 1px solid var(--border);
  color: var(--text-muted);
  transition: color .2s ease, border-color .2s ease;
}
.social-link:hover { color: var(--accent); border-color: var(--accent); }

.location { display: flex; align-items: flex-start; gap: var(--space-3); font-size: 14px; color: var(--text-muted); }
.location .icon { flex: none; color: var(--accent); margin-top: 2px; }

/* Футер */
.footer { margin-top: var(--space-6); padding: var(--space-5) 0; border-top: 1px solid var(--border); }
.footer__inner { display: flex; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; font-size: 13px; color: var(--text-muted); }
.footer__inner a:hover { color: var(--accent-text); }
```

- [ ] **Step 3: Проверить**

Run: `Start-Process index.html`
Ожидаемо: три карточки 6/3/3 — контакты (4 плитки-ссылки в сетке 2×2), соцсети (3 круглые иконки), локация. Ниже тонкий футер с копирайтом и подписью. Пути ссылок ведут на плейсхолдеры `username`.

- [ ] **Step 4: Commit**

```bash
git add index.html css/sections.css
git commit -m "feat: add contacts section and footer"
```

---

## Task 11: Поведение — `js/app.js`

**Files:**
- Modify: `js/app.js` (заменить заглушку полной реализацией)

- [ ] **Step 1: Заменить содержимое `js/app.js`**

```js
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  /* Тема */
  var toggle = document.querySelector('.theme-toggle');
  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function syncToggle() {
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(currentTheme() === 'dark'));
    }
  }
  if (toggle) {
    syncToggle();
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('artkull-theme', next); } catch (e) {}
      syncToggle();
    });
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* Появление секций */
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

  /* Счётчики */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) { return; }
    if (reduce) { el.textContent = String(target); return; }
    var start = null;
    var duration = 900;
    function frame(ts) {
      if (start === null) { start = ts; }
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = String(Math.round(target * p));
      if (p < 1) { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
  }
  if (counters.length) {
    if (!hasIO) {
      counters.forEach(runCounter);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* Прогресс-бары */
  var bars = Array.prototype.slice.call(document.querySelectorAll('.progress__bar'));
  function runBar(el) {
    el.style.width = (el.getAttribute('data-value') || '0') + '%';
  }
  if (bars.length) {
    if (reduce || !hasIO) {
      bars.forEach(runBar);
    } else {
      var bio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runBar(entry.target);
            bio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      bars.forEach(function (el) { bio.observe(el); });
    }
  }

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
})();
```

- [ ] **Step 2: Проверить**

Run: `Start-Process index.html`
Ожидаемо:
- Кнопка темы переключает светлую/тёмную, иконка меняется, выбор сохраняется после перезагрузки (F5), при первом заходе тема — по системе.
- Секции плавно появляются при скролле; цифра «47» в hero анимируется от 0.
- Прогресс-бары этапов заполняются при появлении.
- Отправка формы показывает сообщение «Заявка не отправляется — это демо...», страница не перезагружается.
- Консоль без ошибок.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add theme toggle, reveals, counters, progress and form stub"
```

---

## Task 12: Адаптив, доступность и финальная проверка

**Files:**
- Modify: `css/sections.css` (адаптивные правила)
- Modify: `css/base.css` (при необходимости — финальные правки)

- [ ] **Step 1: Добавить адаптивные правила в конец `css/sections.css`**

```css
/* Адаптив */
@media (max-width: 1023px) {
  .hero__title { font-size: 40px; }
  .profile { grid-row: auto; }
  .price-card--featured { transform: none; }
  .cta { grid-column: span 2; }
  .timeline { grid-template-columns: 1fr; gap: 0; margin-top: var(--space-5); }
  .timeline::before { display: none; }
  .timeline__item {
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: var(--space-4);
    padding: var(--space-4) 0;
  }
  .timeline__item:not(:last-child)::after {
    content: "";
    position: absolute;
    left: 17.5px;
    top: 52px;
    bottom: 0;
    width: 1px;
    background: var(--border);
  }
  .timeline__body { grid-column: 2; }
}

@media (max-width: 639px) {
  .section { padding: var(--space-5) 0; }
  .hero__title { font-size: 34px; }
  .hero__subtitle { font-size: 16px; }
  .section-header h2 { font-size: 26px; }
  .cta { grid-column: auto; padding: var(--space-6) var(--space-5); }
  .cta h2 { font-size: 26px; }
  .cta__form .field { flex: 1 1 100%; }
  .contact-links { grid-template-columns: 1fr; }
  .banner { flex-direction: column; align-items: flex-start; }
}
```

- [ ] **Step 2: Проверить адаптив**

Run: `Start-Process index.html`
Уменьшить окно до ~380px и ~760px.
Ожидаемо: на планшете — 2 колонки, timeline вертикальный (номера слева, текст справа, соединительная линия между нодами), у выделенного тарифа убран подъём, CTA на всю ширину. На мобильном — одна колонка, контакты в один столбец, поля формы на всю ширину. Горизонтального скролла нет ни на одной ширине.

- [ ] **Step 3: Проверить доступность и консоль**

Проверить: Tab проходит по всем ссылкам/кнопкам/полям, видно кольцо фокуса; переключатель темы доступен с клавиатуры и озвучивается (`aria-pressed`); включить «Уменьшить движение» в ОС (или DevTools → Rendering → `prefers-reduced-motion: reduce`) — анимации и скролл-анимации отключаются, контент сразу виден. Консоль без ошибок.

- [ ] **Step 4: Проверить в тёмной теме**

Переключить на тёмную тему и пройти по всем секциям: карточки с границами без тени, текст читаем, акцент светло-синий, статус-точки видны. Свериться с `docs/design-guide.md` раздел 3.

- [ ] **Step 5: Commit**

```bash
git add css/sections.css css/base.css
git commit -m "feat: add responsive layout and finalize accessibility"
```

---

## Self-review плана

**Покрытие спецификации:** Hero (Task 5), Услуги (Task 6), О себе (Task 7), Этапы (Task 8), CTA (Task 9), Контакты + футер (Task 10), темы/анимации/форма (Task 11), адаптив/a11y (Task 12). Токены и компоненты — Tasks 1–3. Логотип/favicon — Task 4. Пункт 8 спецификации (Lighthouse ≥ 90) проверяется вручную в Task 12 Step 3/4 как часть финального QA.

**Плейсхолдеры:** реальных данных нет по решению — используются `username`, `Имя Фамилия`, `you@example.com`, `+7 000 000-00-00`.

**Согласованность:** классы `reveal`, `is-visible`, `progress__bar`/`data-value`, `data-count`, `cta__form`, `cta__message`, `.theme-toggle` совпадают между HTML, CSS и JS.
