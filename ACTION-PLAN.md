# План действий: SEO-исправления Контур.Маркет
**Основан на:** FULL-AUDIT-REPORT.md  
**Приоритеты:** 🔴 Критично (≤2 нед) → 🟡 Важно (1 мес) → 🟢 Улучшение (квартал)

---

## 🔴 ПРИОРИТЕТ 1: SSR / Гидратация (критично для Яндекса)

**Проблема:** Весь контент рендерится JS. Яндекс при первом сканировании видит 5–99 слов вместо 900–4400.

**Что сделать:**
1. Включить **Server-Side Rendering (SSR)** или **Static Site Generation (SSG)** для ключевых страниц
2. Если миграция на SSR невозможна — добавить **prerender-сервис** (например, Prerender.io или собственный headless Chrome в кеше)
3. Минимум — вынести в статический HTML: H1, meta description, первые 2-3 абзаца текста, цены, ключевые CTA

**Страницы в приоритете:** `/market`, `/market/gossistemy`, `/market/features`, `/market/ofd`

**Проверка результата:** После внедрения — `curl -A "YandexBot" https://kontur.ru/market | wc -w` должен показывать >500 слов.

---

## 🔴 ПРИОРИТЕТ 2: Schema Markup

### /market/responses — AggregateRating (упущенные звёзды в SERP)

Добавить в `<head>` или в конец `<body>`:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Контур.Маркет",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "1200",
    "bestRating": "5",
    "worstRating": "1"
  },
  "url": "https://kontur.ru/market"
}
```

> Взять реальные данные рейтинга из CRM / агрегатора отзывов. Без реальных данных — не добавлять.

### /market/ofd — SoftwareApplication + Offer

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Контур.ОФД",
  "applicationCategory": "BusinessApplication",
  "description": "Оператор фискальных данных для онлайн-касс",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "RUB",
    "description": "3 месяца бесплатно"
  },
  "url": "https://kontur.ru/market/ofd-directoru"
}
```

### /market/gossistemy — ItemList для госсистем

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Госсистемы для бизнеса",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "ЕГАИС", "url": "https://kontur.ru/market/features/egais"},
    {"@type": "ListItem", "position": 2, "name": "Честный Знак", "url": "https://kontur.ru/market/features/marking"},
    {"@type": "ListItem", "position": 3, "name": "Меркурий", "url": "https://kontur.ru/market/features/mercury"}
  ]
}
```

### /market — исправить пустой блок

Текущий `<script type="application/ld+json"></script>` — пустой. Либо заполнить:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Контур.Маркет",
  "url": "https://kontur.ru/market",
  "logo": "https://s.kontur.ru/common-v2/icons-products/market/avatar/market-avatar-512.png",
  "description": "Автоматизация малого и среднего бизнеса — управление бизнесом через сервис",
  "sameAs": [
    "https://vk.com/konturmarket",
    "https://t.me/konturmarket"
  ]
}
```

### /market/kkt — заменить FAQPage на Product

FAQPage с авг 2023 не даёт rich snippets для коммерческих сайтов. Заменить:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Онлайн-касса с Контур.Маркет",
  "description": "Купить онлайн-кассу для ИП. Готовые комплекты от 18600 руб.",
  "brand": {"@type": "Brand", "name": "Контур.Маркет"},
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "18600",
    "priceCurrency": "RUB",
    "offerCount": "15"
  }
}
```

---

## 🔴 ПРИОРИТЕТ 3: Meta Description — 3 страницы

### /market/features
```html
<meta name="description" content="Полный набор инструментов для розницы: товарный учёт, касса, ЕГАИС, Честный Знак, аналитика продаж. Попробуйте бесплатно 14 дней.">
```
(143 символа ✅)

### /market/gossistemy
```html
<meta name="description" content="Работайте с ЕГАИС, Честным Знаком и Меркурием в одном окне. Контур.Маркет автоматически передаёт данные во все госсистемы. Попробуйте 14 дней бесплатно.">
```
(159 символов ✅)

### /market/ofd (слишком короткий — 78 символов)
```html
<meta name="description" content="Оператор фискальных данных Контур.ОФД: передача чеков в ФНС, отчёты, уведомления об ошибках. 3 месяца бесплатно. Подключение за 5 минут.">
```
(138 символов ✅)

### /market/responses (слишком короткий — 49 символов)
```html
<meta name="description" content="Отзывы реальных клиентов о Контур.Маркет: розница, общепит, сфера услуг. Более 1200 отзывов о работе с кассой, учётом и госсистемами.">
```
(135 символов ✅)

---

## 🔴 ПРИОРИТЕТ 4: Title — 2 страницы

### /market (74 символа → нужно ≤60)
**Текущий:** «Автоматизация малого и среднего бизнеса — управление бизнесом через сервис»  
**Предлагаемый:** «Контур.Маркет — автоматизация бизнеса: касса, ОФД, учёт»  
(54 символа ✅)

### /market/kkt (67 символов → нужно ≤60)
**Текущий:** «Купить онлайн‑кассу для ИП | Стоимость от 18600 руб — Контур.Маркет»  
**Предлагаемый:** «Онлайн-касса для ИП от 18 600 руб — Контур.Маркет»  
(51 символ ✅)

---

## 🔴 ПРИОРИТЕТ 5: Исправить сломанное изображение

**Страница:** /market  
**URL:** `https://kontur.ru/Files/userfiles/image/products/market/mark-kassa.png`  
**Статус:** 403  
**Действие:** Проверить права доступа к файлу на сервере или заменить на актуальный путь.

---

## 🟡 ПРИОРИТЕТ 6: Редиректы и Canonical

### /market/features → /market/capabilities/roznitsa
**Проблема:** Внешние ссылки и упоминания используют `/features`, но canonical ведёт на `/capabilities/roznitsa`.

**Варианты решения:**
1. **Лучший:** Сделать `/market/features` — хабом-обзором всех возможностей (розница/общепит/услуги), а `/capabilities/roznitsa` — дочерней страницей. Тогда canonical каждой страницы будет самоссылающимся.
2. **Минимум:** Добавить на `/market/capabilities/roznitsa` canonical `https://kontur.ru/market/capabilities/roznitsa` — уже есть. Убедиться что 301-редирект постоянный, а не 302.

### /market/ofd → /market/ofd-directoru
**Проблема:** Slug `/ofd-directoru` — непрозрачный, ломает ссылки с внешних материалов.

**Действие:** Убедиться что 301 (не 302). Рассмотреть переименование в `/market/ofd` с канонизацией.

---

## 🟡 ПРИОРИТЕТ 7: Open Graph — все страницы

### Исправить og:type
Все страницы используют `og:type="article"` — неверно.

| Страница | Правильный og:type |
|---|---|
| /market | `website` |
| /features | `website` |
| /kkt | `product` |
| /ofd | `product` |
| /responses | `website` |
| /gossistemy | `website` |

### Добавить og:description там, где отсутствует

**/market/features:**
```html
<meta property="og:description" content="Полный набор инструментов для розничного бизнеса: касса, учёт, ЕГАИС, аналитика. Попробуйте 14 дней бесплатно.">
```

**/market/gossistemy:**
```html
<meta property="og:description" content="ЕГАИС, Честный Знак и Меркурий в одном интерфейсе. Передача данных в госсистемы автоматически — без двойного ввода.">
```

### Добавить twitter:title на все страницы
```html
<meta name="twitter:title" content="[то же, что og:title]">
<meta name="twitter:description" content="[то же, что og:description]">
```

### Уникальные og:image для разделов
Текущее состояние: все страницы используют один и тот же логотип-аватар.  
Предлагается:
- /market/kkt → скриншот кассы или фото оборудования
- /market/responses → коллаж отзывов / рейтинговый баннер
- /market/gossistemy → интерфейс с тремя госсистемами

---

## 🟡 ПРИОРИТЕТ 8: Alt-теги для изображений

**Масштаб проблемы:** 70–88% изображений на всех страницах без полезного alt.

**Шаблон для продуктовых изображений (/kkt):**
```html
<!-- Вместо: -->
<img src="mspos-f20.jpg" alt="">
<!-- Должно быть: -->
<img src="mspos-f20.jpg" alt="Онлайн-касса MSPOS-F20-Ф для малого бизнеса">
```

**Шаблон для отзывов (/responses):**
```html
<!-- Вместо: -->
<img class="review-author__image" src="logo-company.png" alt="">
<!-- Должно быть: -->
<img class="review-author__image" src="logo-company.png" alt="Логотип компании [Название]">
```

**Приоритет страниц:** /kkt (91 img, торговый каталог) → /responses (136 img) → остальные.

---

## 🟡 ПРИОРИТЕТ 9: hreflang

Добавить на все страницы в `<head>`:

```html
<link rel="alternate" hreflang="ru" href="https://kontur.ru/market">
<link rel="alternate" hreflang="x-default" href="https://kontur.ru/market">
```

Для каждой страницы заменить URL на соответствующий canonical URL страницы.

---

## 🟡 ПРИОРИТЕТ 10: IndexNow — быстрая индексация Яндекса

**Текущее состояние:** IndexNow не настроен ни на одной странице.

**Настройка за 30 минут:**

1. Сгенерировать ключ: `python3 -c "import uuid; print(uuid.uuid4().hex)"`
2. Создать файл `https://kontur.ru/<key>.txt` с содержимым — этот же ключ
3. Добавить на главную:
```html
<meta name="indexnow-key" content="<ваш-ключ>">
```
4. При публикации новых материалов / изменении страниц — POST на `https://yandex.com/indexnow`:
```json
{
  "host": "kontur.ru",
  "key": "<ваш-ключ>",
  "urlList": ["https://kontur.ru/market/kkt", "https://kontur.ru/market/ofd-directoru"]
}
```

---

## 🟢 ПРИОРИТЕТ 11: llms.txt — AI Search Readiness

**Текущее состояние:** llms.txt отсутствует → оценка 0/100 от обоих агентов.

Создать `https://kontur.ru/llms.txt`:

```
# Контур.Маркет

> Сервис автоматизации малого и среднего бизнеса: онлайн-касса, ОФД, товарный учёт, работа с госсистемами (ЕГАИС, Честный Знак, Меркурий).

## Основные разделы

- [Главная](https://kontur.ru/market): обзор возможностей
- [Онлайн-кассы](https://kontur.ru/market/kkt): каталог касс и оборудования
- [ОФД](https://kontur.ru/market/ofd-directoru): оператор фискальных данных
- [Госсистемы](https://kontur.ru/market/gossistemy): ЕГАИС, Честный Знак, Меркурий
- [Отзывы](https://kontur.ru/market/responses): отзывы клиентов
- [Цены](https://kontur.ru/market/price-group): тарифы

## О продукте

Контур.Маркет — облачный сервис для розницы, общепита и сферы услуг. Решает задачи: соответствие 54-ФЗ, передача данных в ЕГАИС/Меркурий/Честный Знак, управление товарным учётом и аналитика продаж.
```

---

## 🟢 ПРИОРИТЕТ 12: H1 оптимизация для ключевых страниц

| Страница | Текущий H1 | Рекомендуемый H1 |
|---|---|---|
| /market | «Сохраняем ваше спокойствие в работе с кассой и госсистемами» | «Контур.Маркет — автоматизация бизнеса для розницы и общепита» |
| /features | «Для розницы» | «Возможности Контур.Маркет для розничного бизнеса» |
| /ofd | «Оператор фискальных данных» | «ОФД Контур.Маркет — оператор фискальных данных» |

---

## 🟢 ПРИОРИТЕТ 13: Контентные улучшения

### /market/ofd — выделить API в отдельную страницу
Раздел «API для крупного бизнеса и арендодателей» в HTML заслуживает URL `/market/ofd-api` — отдельная аудитория с другим поисковым интентом.

### /market/responses — добавить текстовый контент
4437 слов в DOM, но Яндекс-бот видит 99. После SSR — добавить вводный текст: «Более 1200 клиентов выбрали Контур.Маркет для...» (200–300 слов) перед блоком с отзывами.

### /market/gossistemy — разделить на подстраницы
Три разные темы (ЕГАИС + Честный Знак + Меркурий) конкурируют за разные поисковые запросы. Рассмотреть:
- `/market/features/egais` — уже существует
- `/market/features/marking` — уже существует  
- `/market/features/mercury` — уже существует

Но `/market/gossistemy` не ссылается на них как на дочерние — исправить навигацию и добавить breadcrumb.

---

## Роадмап по срокам

| Срок | Задачи | Ожидаемый эффект |
|---|---|---|
| **Неделя 1** | SSR для /market + /gossistemy + /features (хотя бы критический контент) | Яндекс перестаёт видеть пустые страницы |
| **Неделя 1** | Исправить title на /market и /kkt | Улучшение CTR в SERP |
| **Неделя 1** | Добавить meta desc на /features и /gossistemy | Сниппеты в выдаче |
| **Неделя 2** | Schema: AggregateRating на /responses, Organization на /market | Звёзды в SERP |
| **Неделя 2** | Schema: Product+Offer на /kkt и /ofd | Rich snippets для коммерческих страниц |
| **Неделя 2** | Исправить сломанный 403-образ на /market | Нет ошибок CLS |
| **Месяц 1** | Alt-теги для всех изображений /kkt (91 img) | Яндекс.Картинки |
| **Месяц 1** | og:type, og:description, twitter:title на всех страницах | Шаринг в соцсетях |
| **Месяц 1** | IndexNow настройка | Быстрая индексация обновлений |
| **Квартал** | hreflang на всех страницах | Базовый стандарт |
| **Квартал** | llms.txt | AI Search Readiness |
| **Квартал** | SSR на /kkt и /ofd | Полное покрытие |

---

## Измерение результатов

После каждого этапа проверять:

```bash
# JS-контент: сколько слов видит бот
curl -s -A "Mozilla/5.0 (compatible; YandexBot/3.0)" https://kontur.ru/market | python3 -c "
import sys, re
html = sys.stdin.read()
text = re.sub(r'<[^>]+>', ' ', html)
words = [w for w in text.split() if len(w) > 2]
print(f'Words visible to YandexBot: {len(words)}')
"

# Schema валидность
curl -s https://kontur.ru/market | python3 validate_schema.py /dev/stdin

# Title длина
curl -s https://kontur.ru/market | grep -oP '(?<=<title>)[^<]+'
```

Целевые KPI через 3 месяца:
- Средняя оценка по всем страницам: **≥65/100**
- JS-thin content: **>300 слов** при YandexBot UA
- Alt coverage: **>70%** изображений с описательным alt
- Schema coverage: **6/6 страниц** с релевантным типом schema
