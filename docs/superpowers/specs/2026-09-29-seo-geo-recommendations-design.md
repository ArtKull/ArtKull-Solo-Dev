# Спека: реализация SEO/GEO-рекомендаций аудита (раздел 6, статус «В работе»)

- **Дата:** 2026-09-29
- **Статус:** утверждён дизайн, готово к планированию
- **Связанные документы:** `docs/seo/2026-09-28-seo-geo-audit.md`, `privacy.html`, `index.html`, `DESIGN.md`

## 1. Цель

Закрыть технический SEO/GEO-фундамент сайта `https://artkull.ru/` по рекомендациям
аудита от 28.09.2026 — только задачи со статусом **«В работе»** в разделе 6.

Успех:
- Поисковики получают `robots.txt` и `sitemap.xml` (сейчас оба 404).
- У главной и политики есть `canonical`; дубли `/` vs `/index.html` и
  `/privacy` vs `/privacy.html` консолидированы; ссылки на политику унифицированы.
- OG-превью отдаётся с абсолютным URL существующего `og-image.png`.
- На главной присутствует JSON-LD Schema.org (`ProfessionalService` + `Person` +
  `Service`×3), формирующий сущность для поиска и ИИ.
- Шрифты не блокируют первую отрисовку (`preload`).
- Закладки/PWA видны корректно (`favicon.ico`, `apple-touch-icon`, `manifest`).
- Служебный `privacy.html` закрыт от индекса; есть брендированная `404.html`.
- Есть `/llms.txt` для GEO.

## 2. Область

**Входит (11 строк раздела 6 со статусом «В работе» → 10 задач):**
1. `robots.txt` (🔴 критический).
2. `sitemap.xml` (🔴 критический).
3. `canonical` + `meta robots` + унификация ссылок (🔴 критический).
4. OG-изображение — абсолютный URL + `og:url` (🔴 критический).
5. Schema.org JSON-LD (🔴 критический).
6. `preload` шрифтов (🟠 высокий).
7. `favicon.ico` + `apple-touch-icon.png` + `manifest.webmanifest` (🟡 средний).
8. Брендированная `404.html` (🟡 средний).
9. `llms.txt` (🟡 средний).
10. `privacy.html`: `meta description` + `noindex` (🟡 средний) и Title/Description
    главной (🟢 низкий).

**Не входит:**
- **Security-заголовки** (HSTS/CSP/X-Content-Type-Options/Referrer-Policy) — не
  реализуемы средствами GitHub Pages, требуют Cloudflare-прокси. Исключены из
  спеки осознанно.
- Все пункты раздела 6 со статусом **«Отложено»**: FAQ + `FAQPage`, посадочные
  под услуги, страница «О себе», Яндекс.Бизнес / Google Business Profile, отзывы
  и кейсы с гео. Реализуются отдельными циклами spec → plan позже.
- Минификация/объединение CSS и инлайн critical CSS — выбрана минимальная
  оптимизация (только `preload`).
- Юридическая экспертиза формулировок и тексты политики (кроме техправок
  `head`).

## 3. Жёсткие константы

- Домен: `https://artkull.ru` (из `CNAME`).
- Главная: `https://artkull.ru/`. Политика: `https://artkull.ru/privacy.html`.
- Контакты (из `index.html`): телефон `+7 922 269-84-46`, e-mail
  `artkull@gmail.com`, Telegram `https://t.me/ArtKull`, GitHub
  `https://github.com/ArtKull`, VK `https://vk.ru/kulchinsky`, MAX-ссылка из
  `#contacts`.
- Автор: Артём Кульчинский, «Веб-разработчик · фриланс».
- Стек для `knowsAbout`: HTML, CSS, JavaScript, Python, React, FastAPI, SEO, Figma.
- Тарифы: «Сайт-визитка / Лендинг» от 5 000 ₽ / от 5 дней; «Сайт компании»
  от 15 000 ₽ / от 10 дней; «Интернет-магазин / Каталог» от 35 000 ₽ /
  от 14 дней.
- Локация: Тюмень, удалённо по всей России (`areaServed: RU`).

## 4. `robots.txt`

Новый файл в корне репозитория (отдаётся как `https://artkull.ru/robots.txt`):

```
User-agent: *
Allow: /
Disallow: /privacy*
Sitemap: https://artkull.ru/sitemap.xml
```

- `Disallow: /privacy*` закрывает и `/privacy`, и `/privacy.html`.
- Явных `Disallow` для `assets`/`css`/`js` нет — не мешаем обходу, дублей
  контента там не создаётся.

## 5. `sitemap.xml`

Новый файл в корне:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://artkull.ru/</loc>
    <lastmod>2026-09-29</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- Только главная: `privacy.html` помечен `noindex` и закрыт в `robots.txt`,
  включать его в карту нельзя.
- `<lastmod>` задаётся датой изменения главной при коммите (YYYY-MM-DD).
- При появлении внутренних разделов (из «Отложено») карта расширяется — вне
  текущей спеки.

## 6. `canonical`, `meta robots` и унификация ссылок

**`index.html`** — в `<head>` (после `<meta name="viewport">`) добавить:

```html
<link rel="canonical" href="https://artkull.ru/" />
<meta name="robots" content="index, follow" />
```

**`privacy.html`** — в `<head>` (после `<meta name="viewport">`) добавить:

```html
<link rel="canonical" href="https://artkull.ru/privacy.html" />
<meta name="robots" content="noindex, follow" />
<meta name="description" content="Политика обработки персональных данных оператора Кульчинский Артём Иванович (ArtKull): цели, состав, сроки обработки и защиты данных, права субъекта." />
```

**Унификация ссылок на политику:**
- `privacy.html:157` — заменить `https://artkull.ru/privacy` на
  `https://artkull.ru/privacy.html` (текст редакции политики).
- `privacy.html:35` — в шапке ссылку `href="index.html"` заменить на `href="/"`
  (консистентно с canonical главной).
- Ссылки на политику внутри `index.html` (`:676`, `:799`, `:823`) уже ведут на
  `privacy.html` — не меняются.
- На `privacy.html` дубль `/privacy` остаётся доступным на хостинге, но
  `noindex` + `canonical` + `Disallow` убирают его из выдачи.

## 7. OG-изображение и Twitter-карточка

В `<head>` `index.html`:

- Заменить
  `<meta property="og:image" content="assets/og-image.png" />` на
  `<meta property="og:image" content="https://artkull.ru/assets/og-image.png" />`.
- Добавить `<meta property="og:url" content="https://artkull.ru/" />`.
- Добавить `<meta property="og:site_name" content="ArtKull" />`.
- Добавить `<meta name="twitter:image" content="https://artkull.ru/assets/og-image.png" />`.

Файл `assets/og-image.png` (1200×630) уже в репозитории; изменение касается
только абсолютного URL. Существующие `og:image:type/width/height/alt` и
`twitter:card` сохраняются. `og:image:alt` дополняется при необходимости.

## 8. Schema.org JSON-LD

Один блок в `<head>` `index.html`, **без** `FAQPage` и `BreadcrumbList`
(запланированы в «Отложено»). Структура:

- `ProfessionalService`:
  - `@id`: `https://artkull.ru/#business`, `name`: `ArtKull`, `url`:
    `https://artkull.ru/`, `image`/`logo`: `https://artkull.ru/assets/og-image.png`
    и `https://artkull.ru/assets/logo.svg`, `telephone`: `+79222698446`,
    `email`: `artkull@gmail.com`, `description` — из `meta description`.
  - `address`: `PostalAddress` с `addressLocality: "Тюмень"` и
    `addressCountry: "RU"` — **без** улицы и квартиры.
  - `areaServed`: `{ "@type": "Country", "name": "Россия" }`.
  - `sameAs`: GitHub, VK, Telegram.
  - `founder`: `{ "@id": "https://artkull.ru/#person" }`.
  - `makesOffer`: список `Offer` из `Service` (см. ниже).
- `Person` (ссылка `#person`): `name`: Артём Кульчинский, `jobTitle`:
  Веб-разработчик, `knowsAbout`: стек из §3, `sameAs`: GitHub, VK, Telegram,
  `url`: `https://artkull.ru/`, `worksFor`: `#business`.
- `Service` ×3 (для трёх тарифов): `name`, `provider` → `#business`,
  `areaServed`: RU, `offers`: `Offer` с `price` (5000/15000/35000),
  `priceCurrency: "RUB"`, `availability`: `InStock`.

Значения берутся строго из §3; вымышленных данных не добавляем. Валидация —
Rich Results Test / Schema.org Validator.

## 9. `preload` шрифтов

В `<head>` `index.html` (до `css/fonts.css`) добавить:

```html
<link rel="preload" href="assets/fonts/inter-cyrillic.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
```

- Основной трафик — РФ, поэтому приоритет кириллице; латиница предзагружается
  второй как крупнейший файл (48 КБ).
- JetBrains Mono не предзагружаем (моноширинные акценты, не критичен для LCP).
- `crossorigin` обязателен для `as="font"` (иначе двойная загрузка).
- В `privacy.html` `preload` не добавляем (служебная страница, `noindex`).

## 10. Favicon, apple-touch-icon, manifest

Растровые иконки генерируются из `assets/favicon.svg` (агенерация на этапе
реализации, файлы коммитятся):

- `assets/favicon.ico` (16/32/48).
- `assets/apple-touch-icon.png` (180×180).
- `assets/icon-192.png`, `assets/icon-512.png`.
- `manifest.webmanifest` в корне: `name`/`short_name` `ArtKull`,
  `start_url` `/`, `display` `standalone`, `theme_color` `#0A0E27`
  (тёмная тема) / `background_color` `#F0F4F8`, набор `icons` (192/512,
  `purpose: "any maskable"`).

В `<head>` обеих страниц (`index.html`, `privacy.html`) после существующего
`<link rel="icon" type="image/svg+xml" ...>` добавить:

```html
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
```

## 11. Брендированная `404.html`

Новый файл в корне (GitHub Pages отдаёт его автоматически для несуществующих
путей). Требования:

- Та же оболочка, что у `privacy.html`: doctype, `lang="ru"`, theme-скрипт,
  шапка с брендом и переключателем темы, подключение
  `css/fonts|tokens|base|components`.
- Контент в `<main class="container legal">`: заголовок «404», текст «Страница
  не найдена», ссылка/кнопка «На главную» на `/`.
- Пути к ресурсам в `404.html` задаются **абсолютными** (`/css/...`,
  `/assets/...`): страница отдаётся для произвольного, в том числе вложенного,
  URL, и относительные пути на них сломались бы.

## 12. `llms.txt`

Новый файл в корне `llms.txt` (text/markdown, `https://artkull.ru/llms.txt`) —
краткое структурированное описание для ИИ-поиска:

- Кто: Артём Кульчинский, веб-разработчик-фрилансер (ArtKull).
- Что: разработка сайтов под ключ — лендинги, сайты компаний, интернет-магазины.
- Цены/сроки: три тарифа из §3.
- Гео: Тюмень, удалённо по всей России.
- Контакты: телефон, e-mail, Telegram, MAX, GitHub, VK.
- Ссылки: главная, политика, og-изображение.

Данные берутся из §3 (без вымышленных фактов, без стажа/ИНН — их пока нет).

## 13. Title/Description главной

`index.html` `<head>`:

- `<title>` → `Разработка сайтов под ключ по всей России — ArtKull`.
- `meta description` → с гео, сроками и минимальной ценой, например:
  `Разработка сайтов под ключ по всей России: лендинг от 5 000 ₽ за 5 дней, сайт компании за 10 дней, интернет-магазин. Один разработчик, без агентских наценок.`
- `og:title` оставляем коротким: `ArtKull — сайты под ключ` (для соцсетей
  важнее бренд, чем длинный SEO-ключ).

## 14. Проверка

Автотестов на HTML нет. Порядок проверки:

1. **Регресс:** `node tools/check-tokens.mjs`; прогон существующих тестов
   (`tests/`, `yc/form/`) — не должны падать.
2. **Локально** (`python -m http.server` / `npx serve`):
   - `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/manifest.webmanifest`,
     `/favicon.ico`, `/404.html` отдаются 200.
   - JSON-LD валиден (Schema.org Validator / Rich Results Test), без ошибок.
   - OG-превью: проверить через отладчик соцсетей (абсолютный URL картинки
     открывается).
   - В Network нет запроса к `fonts.googleapis.com`; шрифты грузятся с сайта.
   - В `head` главной: 1 `canonical`, `meta robots index,follow`; в политике —
     `noindex,follow`.
   - 404: открыть несуществующий путь (напр. `/nonexistent`) — при локальном
     сервере проверить сам файл напрямую.
3. **После деплоя** (GitHub Pages):
   - `curl -I https://artkull.ru/robots.txt` и `/sitemap.xml` → 200.
   - `curl -I https://artkull.ru/nonexistent` → 404 отдаёт кастомную страницу.
   - `https://artkull.ru/assets/og-image.png` → 200.
   - Проверить главную в валидаторах; кэш/CDN может задержать обновление.

## 15. Файлы (дельта)

| Файл | Изменение |
|---|---|
| `robots.txt` | новый файл (корень) |
| `sitemap.xml` | новый файл (корень) |
| `llms.txt` | новый файл (корень) |
| `manifest.webmanifest` | новый файл (корень) |
| `404.html` | новый файл (корень), оболочка по образцу `privacy.html`, абсолютные пути |
| `assets/favicon.ico` | новый (из `favicon.svg`) |
| `assets/apple-touch-icon.png` | новый (180×180) |
| `assets/icon-192.png` | новый |
| `assets/icon-512.png` | новый |
| `index.html` | canonical, `meta robots`, `og:url/site_name/twitter:image`, absolute `og:image`, JSON-LD, `preload` шрифтов, favicon/apple/manifest link-теги, новый Title/Description |
| `privacy.html` | canonical, `noindex, follow`, `meta description`, унификация ссылок (`:157`, `:35`), favicon/apple/manifest link-теги |

## 16. Риски и ограничения

- **Абсолютные URL привязаны к `artkull.ru`.** При смене домена нужны правки в
  `robots.txt`, `sitemap.xml`, canonical, OG и JSON-LD.
- **GitHub Pages не даёт кастомных HTTP-заголовков** — security-заголовки
  остаются вне области (см. §2).
- **`/privacy` дубль** физически останется доступным (200), но `noindex` +
  `canonical` + `Disallow` исключают его из выдачи. Полностью убрать нельзя без
  редиректов на стороне хостинга.
- **Растровые иконки** генерируются вручную/скриптом из SVG: качество зависит от
  инструмента; нужно проверить вид в закладках и на iOS.
- **`lastmod` в sitemap** вручную синхронизируется с датой изменения главной —
  легко забыть; при появлении внутренних страниц потребуется автоматизация.
- **`404.html` с абсолютными путями** должен работать на вложенных
  несуществующих URL (проверка обязательна).
- **MIME `manifest.webmanifest`** на GitHub Pages может отдаваться как
  `application/octet-stream`; часть браузеров это игнорирует. Проверить в
  DevTools → Application → Manifest; при проблеме — переименовать в
  `manifest.json` или добавить `type="application/manifest+json"`.
