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
- Мобильное меню — плотнее: `--glass-nav` (≈96% светлая / 94% тёмная) вместо
  `--glass-bg`, чтобы пункты читались над содержимым секции; blur сохраняется
  для остальных стеклянных поверхностей.
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
`--accent-glow`. В CTA — белая полупрозрачная заливка, тёмный текст, белое
кольцо; ошибка — белая граница + красный ореол. В `forced-colors: active` фокус
поля сохраняется обводкой. Логика валидации не меняется.

### Timeline
Узлы 36px с mono-номерами, соединительная линия `--border`; на планшете —
вертикаль (нода слева, текст справа).

### CTA panel
Единственная крупная градиентная заливка + свечение, белый текст, белые
поля и белый meter заполнения.

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
