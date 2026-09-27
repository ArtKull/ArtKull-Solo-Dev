---
name: ArtKull
description: "Сайты под ключ — живой дашборд, а не брошюра"
colors:
  bg: "#F4F5F7"
  surface: "#FFFFFF"
  surface-2: "#FAFAFB"
  text: "#1A1A2E"
  text-muted: "#667085"
  accent: "#3B82F6"
  accent-hover: "#2563EB"
  accent-soft: "#EFF6FF"
  accent-solid: "#2563EB"
  accent-solid-hover: "#1D4ED8"
  accent-text: "#2563EB"
  success: "#10B981"
  border: "#E5E7EB"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  button:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 600
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.08em"
  metric:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
rounded:
  card: "16px"
  el: "8px"
  pill: "999px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "24px"
  space-6: "32px"
  space-7: "48px"
  space-8: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent-solid}"
    textColor: "#FFFFFF"
    typography: "{typography.button}"
    rounded: "{rounded.el}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-solid-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.el}"
    height: "44px"
    padding: "0 20px"
  button-outline-hover:
    backgroundColor: "{colors.surface-2}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "24px"
  badge-accent:
    backgroundColor: "{colors.accent-solid}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.el}"
    padding: "4px 10px"
  badge-neutral:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.el}"
    padding: "4px 10px"
  field:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.small}"
    rounded: "{rounded.el}"
    height: "44px"
    padding: "0 14px"
  pill:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.small}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    size: "40px"
---

# Design System: ArtKull

## Overview

**Creative North Star: "Живой дашборд"**

ArtKull выглядит как работающий рабочий инструмент, а не как маркетинговая
брошюра. Метрики, статус-точки, прогресс-бары, бейджи и моноширинные числа
создают ощущение живого продукта и профессиональной инженерной культуры.
Посетитель не читает рекламу — он смотрит на панель, которая уже работает.

Плотность и ритм задаёт bento-сетка: размер блока равен его значимости, а
сильнейшее сообщение бренда — «один человек, полная ответственность» — занимает
больше всего места. Система сдержанна: один акцент, один линейный набор иконок,
минимум движения. Взаимодействия тактильные и уверенные, но не демонстративные:
лёгкий подъём карточки на hover, мягкая тень в покое, отклик на нажатие.

Подтверждённые отказы: никаких «бумажных» агентских обещаний и стоковых
обещаний-иллюстраций, никаких градиентных заливок текста, никакой второй
палитры или второго набора иконок, никакого параллакса и анимаций на
скролл-скрутку.

**Key Characteristics:**
- Дашборд-эстетика: метрики, статусы, прогресс, бейджи — язык бренда, а не декор.
- Bento-grid на 12 колонок; размер блока = его приоритет.
- Единственный акцент — «Рабочий синий»; крупная заливка только в CTA и primary-кнопке.
- Inter для всего текста, JetBrains Mono для чисел, цен и микро-лейблов.
- Две темы (светлая основная, тёмная) с ручным переключателем.
- Тактильные, но сдержанные состояния; поддержка `prefers-reduced-motion`.

## Colors

Палитра держится на холодных нейтралях и одном рабочем синем; смысл несёт не
цвет, а его роль — три отдельных акцентных токена под три разных контрастных
задачи.

### Primary
- **Рабочий синий** (#3B82F6): бренд-цвет для границ, иконок, фокуса, заливки
  прогресс-баров и крупных декоративных элементов. Живёт на светлом фоне, под
  белым текстом не используется.
- **Плотный синий** (#2563EB): только заливки под белым текстом — primary-кнопка,
  бейдж «Популярный», фон CTA. Белый текст на нём даёт 5.1:1.
- **Синий текст** (#2563EB): мелкий акцентный текст и ссылки, где нужно AA.
- **Синяя дымка** (#EFF6FF): мягкая подложка под акцент — свечение в углу
  hero-виджета, кольцо фокуса у поля.

### Neutral
- **Светлый фон** (#F4F5F7): фон страницы, как в современных админках.
- **Поверхность** (#FFFFFF): фон карточек и виджетов.
- **Утопленная поверхность** (#FAFAFB): вложенные блоки, hover-фон полей и
  secondary-кнопок.
- **Чернила** (#1A1A2E): основной текст; почти чёрный, но холоднее.
- **Приглушённый текст** (#667085): вторичный текст, лейблы, подписи (AA на фоне).
- **Граница** (#E5E7EB): границы, разделители внутри карточек, соединительные
  линии timeline.

### Тёмная тема (переопределения)
Тёмная тема — не инверсия, а отдельный набор значений: фон **#0F1117**,
поверхности **#1A1B26** / **#22232F**, текст **#E4E4E7**, приглушённый **#9CA3AF**,
граница **#2A2B3A**. Акцент светлеет до **#60A5FA** (границы, иконки, текст),
плотная заливка остаётся **#2563EB** под белым текстом, успех — **#34D399**.
Тени в тёмной теме отключены: слои различаются только границей.

### Named Rules
**The Three Accents Rule.** Три акцентных токена не взаимозаменяемы: `--accent`
— границы, иконки, прогресс; `--accent-solid` — только заливка под белым текстом;
`--accent-text` — мелкий текст и ссылки. Белый текст на `--accent` запрещён.

**The One Voice Rule.** Акцент занимает не более ~10% площади любого экрана. Его
редкость и есть приём; крупная заливка — только CTA и primary-кнопка.

## Typography

**Display Font:** Inter (system-ui, -apple-system, 'Segoe UI', sans-serif)
**Body Font:** Inter (system-ui, -apple-system, 'Segoe UI', sans-serif)
**Label/Mono Font:** JetBrains Mono (ui-monospace, SFMono-Regular, Menlo, monospace)

**Character:** Один нейтральный гротеск отвечает за всю читаемую речь, а
моноширинный шрифт — за «дев-вайб»: он маркирует всё машинное (числа, цены,
статусы, микро-лейблы) и делает интерфейс похожим на консоль. Контраст между
двумя ролями — вся типографическая интрига; третьего шрифта нет.

### Hierarchy
- **Display** (700, 56px / 1.2, −0.02em): только H1 hero; на мобильном падает до 34px.
- **Headline** (700, 32px / 1.2, −0.01em): H2 секций; на мобильном — 26px.
- **Title** (600, 20px): заголовки карточек и тарифов; таймлайн — 15px огранки.
- **Body** (400, 16px / 1.6): основной текст; подзаголовок hero — 18px при max 52ch.
- **Small** (400, 14px / 1.55): текст карточек, поля, кнопки-ссылки.
- **Label** (500 JetBrains Mono, 12px, uppercase, 0.08em): микро-лейблы секций,
  бейджи, статус-строки. Всегда uppercase.
- **Metric** (500 JetBrains Mono, 32px / 1.1, −0.01em): числа метрик; цена — 24px.

### Named Rules
**The Mono-For-Machine Rule.** Любое число, цена и технический лейбл набираются
JetBrains Mono. Пропорциональным Inter числа в интерфейсе не набираются.

## Layout

Пространственная модель — **bento-grid**: 12 колонок, `gap` 16px, контейнер
`max-width: 1200px` и боковой паддинг 24px. Внутри карточек паддинг 24px
(на мобильном 20px). Размер блока равен его приоритету: hero — текст 7 колонок
плюс виджет 5; тарифы — три по 4; профиль — 6 с растяжкой на два ряда.

Брейкпоинты: десктоп ≥ 1024px (12 колонок), планшет 640–1023px (2 колонки),
мобильный < 640px (одна колонка). Шкала отступов: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
Вертикальный ритм секций — 64px на десктопе и 40px на мобильном. Контейнер
центрируется; на планшете featured-карточка теряет подъём, timeline
разворачивается в вертикаль (ноды слева, текст справа).

## Elevation & Depth

Глубина строится по-разному в двух темах. В **светлой** поверхность в покое несёт
едва заметную тень, а hover её усиливает и приподнимает элемент на 4px —
физичность лёгкая, не сценическая. В **тёмной** тени отключены полностью: слои
различаются только однопиксельной границей `--border`. Гибрид осознанный: свет
даёт объём, тьма даёт контур.

### Shadow Vocabulary
- **Состояние покоя карточки** (`0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06)`):
  базовая тень всех карточек и виджета в светлой теме.
- **Приподнятый слой** (`0 8px 24px rgba(0,0,0,.08)`): hover карточки и выделенный
  тариф (`card--accent`).
- **Ореол статуса** (`0 0 0 3px rgba(16,185,129,.18)`): мягкое свечение вокруг
  зелёной статус-точки «онлайн».

### Named Rules
**The Border-in-Dark Rule.** В тёмной теме `box-shadow` не используется никогда.
Разделение слоёв — исключительно границей `--border`.

## Shapes

Формальная речь построена на скруглениях трёх уровней. Крупные поверхности —
**16px** (`--radius-card`): карточки, виджеты, CTA. Интерактивные элементы —
**8px** (`--radius-el`): кнопки, поля, бейджи, плитки контактов, аватар профиля.
Пилюли и круглые элементы — **999px** (`--radius-pill`): теги навыков,
прогресс-бары, круглая кнопка темы. Контуры — 1px, всегда `--border`, с
акцентной границей на hover или у выделенного тарифа. Никаких острых углов,
скошенных срезов или «неоморфных» выпуклостей.

## Components

### Buttons
- **Shape:** прямоугольные с 8px-скруглением (`--radius-el`), высота 44px (в CTA — 48px).
- **Primary:** заливка «Плотный синий» (`--accent-solid`), белый текст, Inter 14/600,
  паддинг 0 20px; hover — `--accent-solid-hover`.
- **Hover / Focus:** переход 200ms ease; `:active` даёт `translateY(1px)`;
  `focus-visible` — кольцо 2px `--accent` с offset 2px. Внутри CTA кольцо белое.
- **Outline:** прозрачный фон, граница `--border`, текст «Чернила»; hover —
  фон `--surface-2` и акцентная граница.
- **Ghost:** без фона и границы, текст `--accent-text`; только для текстовых
  действий вроде «Связаться →».

### Cards / Containers
- **Corner Style:** 16px (`--radius-card`).
- **Background:** `--surface`; CTA — заливка «Плотный синий».
- **Shadow Strategy:** мягкая тень в покое, `--shadow-lifted` на hover и у
  `card--accent` (см. Elevation & Depth); в тёмной теме — только граница.
- **Border:** 1px `transparent` в светлой теме; `card--accent` — граница `--accent`;
  `card--flat` — без тени, только `--border`.
- **Internal Padding:** 24px.
- **Behavior:** `card--hover` поднимается на 4px; `price-card--featured` стоит
  выше на 8px и содержит бейдж «Популярный» по центру.

### Inputs / Fields
- **Style:** высота 44px (48px в CTA), фон `--surface-2`, граница `--border`,
  скругление 8px, паддинг 0 14px, placeholder «Приглушённый текст».
- **Focus:** граница `--accent` плюс кольцо `0 0 0 3px var(--accent-soft)`;
  в CTA кольцо белое полупрозрачное.
- **CTA variant:** белая полупрозрачная заливка `rgba(255,255,255,.95)` с тёмным
  текстом — единственное поле на акцентном фоне.

### Navigation
Навигация — якорная, без липкой шапки: секции связаны `scroll-behavior: smooth`,
кнопки hero ведут к `#services` и `#contacts`. Роль «шапки» играет круглая
кнопка переключения темы (40px, `--surface`, граница `--border`) в правом верхнем
углу hero; hover — акцентная граница и акцентный цвет иконки. На мобильном она
остаётся единственным навигационным контролом.

### Signature Components
- **Виджет-профиль (hero):** мини-дашборд, задающий всю эстетику. Шапка-лейбл,
  сетка 2×2 метрик, нижняя статус-строка с зелёной точкой. В углу — радиальное
  свечение «Синей дымки».
- **Metric:** моноширинное число 32px над uppercase-лейблом 12px; вертикальная
  раскладка.
- **Status dot:** точка 8px; зелёная `--success` с ореолом для «онлайн/готово»,
  серая `--text-muted` для «не входит».
- **Progress bar:** полоса 4px, фон `--surface-2`, заливка `--accent`,
  анимация ширины 600ms; несёт долю этапа в сроках.
- **Timeline:** пять узлов-кружков 36px с номерами (моно), соединённых линией 1px;
  на планшете сворачивается в вертикаль.
- **Icon:** инлайн-SVG, `stroke-width: 1.5`, `fill: none`, `currentColor`; размеры
  16 / 20 / 24px; единый линейный набор в стиле Lucide.

## Do's and Don'ts

### Do:
- **Do** держать размер блока пропорциональным его значимости: главное сообщение —
  самый крупный блок.
- **Do** набирать числа, цены и статусы JetBrains Mono, а текст — Inter
  (`font-feature-settings: "ss01"`).
- **Do** использовать `--accent-solid` только под белым текстом, а `--accent` —
  для границ, иконок и прогресса (Three Accents Rule).
- **Do** оставлять акценту ≤10% площади экрана; крупная заливка — только CTA.
- **Do** отключать тени в тёмной теме и разводить слои границей.
- **Do** сохранять `focus-visible` на всех интерактивных элементах и уважать
  `prefers-reduced-motion`.

### Don't:
- **Don't** набирать белым текстом на `--accent` или мелким акцентным текстом на
  светлом фоне — контраст ниже AA.
- **Don't** смешивать наборы иконок или добавлять второй акцентный цвет.
- **Don't** заменять тени на цветные «неоновые» свечения или градиентные заливки
  поверхностей.
- **Don't** добавлять параллакс, анимации на скролл-скрутку или более одного
  типа появления на элемент.
- **Don't** вводить фотостоки и декоративные иллюстрации — носителем смысла
  служит интерфейсная деталь, а не картинка.
