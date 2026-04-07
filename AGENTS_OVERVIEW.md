# SEO Agents - Полный Обзор

## Интегрированные Агенты

В этом проекте интегрировано **10 специализированных SEO-агентов**, которые работают вместе для комплексного анализа и оптимизации сайтов и репозиториев GitHub.

---

## 🎯 10 Specialist Agents

### 1. **Technical SEO Agent** 
**Область:** Техническая оптимизация сайта
**Возможности:**
- Анализ доступности для краулеров (crawlability)
- Проверка индексируемости страниц (indexability)
- Анализ безопасности (HTTPS, SSL)
- Проверка мобильной совместимости
- Оценка рендеринга JavaScript
- Проверка robots.txt и crawlability障碍
- Анализ редиректов и ошибок

**Используемые скрипты:** `robots_checker.py`, `fetch_page.py`, `parse_html.py`, `redirect_checker.py`

---

### 2. **Content Quality Agent**
**Область:** Качество контента и E-E-A-T
**Возможности:**
- Оценка Experience, Expertise, Authoritativeness, Trustworthiness (E-E-A-T)
- Обнаружение AI-сгенерированного контента
- Анализ оригинальности и уникальности текста
- Проверка соответствия Sept 2025 QRG (Quality Rater Guidelines)
- Проверка наличия авторских данных и контактов
- Минимальные требования к объему контента

**Используемые скрипты:** `article_seo.py`, `duplicate_content.py`, `social_meta.py`

---

### 3. **Performance Agent**
**Область:** Core Web Vitals и скорость загрузки
**Возможности:**
- Анализ LCP (Largest Contentful Paint) - время загрузки основного контента
- Анализ INP (Interaction to Next Paint) - отзывчивость интерфейса
- Анализ CLS (Cumulative Layout Shift) - стабильность макета
- Проверка PageSpeed Insights метрик
- Рекомендации по улучшению производительности
- Анализ серверного времени отклика

**Используемые скрипты:** `pagespeed.py`

---

### 4. **Schema Markup Agent**
**Область:** Структурированные данные (JSON-LD, Schema.org)
**Возможности:**
- Обнаружение всех типов schema на странице
- Валидация JSON-LD структуры
- Проверка соответствия Schema.org типам
- Генерация недостающих schema разметок
- Поддержка: Organization, Product, Article, LocalBusiness, Event, FAQ и др.
- Проверка структурированных данных для rich snippets

**Используемые скрипты:** `validate_schema.py`, `entity_checker.py`

---

### 5. **Sitemap Agent**
**Область:** Карты сайта (XML сitemaps)
**Возможности:**
- Валидация XML sitemap структуры
- Проверка наличия sitemap.xml
- Анализ охвата страниц в sitemap
- Проверка приоритетов (priority) и частоты обновлений (changefreq)
- Валидация URL форматов
- Обнаружение орфанных страниц
- Согласованность sitemap с фактической структурой сайта
- Регистрация в IndexNow и Google Search Console

**Используемые скрипты:** `indexnow_checker.py`, `internal_links.py`

---

### 6. **Visual Analysis Agent**
**Область:** Визуальная оценка и скриншоты
**Возможности:**
- Захват скриншотов страниц (desktop, mobile, tablet)
- Оценка дизайна и user experience
- Проверка "above the fold" содержимого
- Анализ отзывчивости (responsiveness)
- Проверка визуальной иерархии контента
- Оценка CLS на скриншотах
- Использует Playwright для точных скриншотов

**Используемые скрипты:** `analyze_visual.py`

---

### 7. **GitHub Analyst Agent**
**Область:** SEO оптимизация GitHub репозиториев
**Возможности:**
- Анализ метаданных репозитория (название, описание)
- Оценка качества README файла
- Проверка GitHub Topics релевантности
- Анализ сообщества (issues, discussions, community profile)
- Оценка доверительности проекта (stars, contributors, activity)
- Проверка лицензии и документации
- Стратегия заголовков для дискриминируемости

**Используемые скрипты:** `github_repo_audit.py`, `github_readme_lint.py`, `github_community_health.py`

---

### 8. **GitHub Benchmark Agent**
**Область:** Конкурентный анализ GitHub репозиториев
**Возможности:**
- Анализ рейтинга в поиске GitHub
- Исследование конкурирующих репозиториев
- Сравнение метрик похожих проектов
- Выявление gaps в функциональности
- Анализ популярных keywords в нише
- Рекомендации для улучшения видимости
- Изучение trends в похожих repos

**Используемые скрипты:** `github_competitor_research.py`, `github_seo_report.py`

---

### 9. **GitHub Data Agent**
**Область:** Управление данными и резервное копирование GitHub
**Возможности:**
- Управление API аутентификацией (fallbacks)
- Архивирование данных трафика репозитория
- Резервная копия analytics и insights
- Обработка API rate limits
- Обновление и синхронизация данных
- Логирование и мониторинг

**Используемые скрипты:** (встроенная функциональность)

---

### 10. **Global Verifier Agent**
**Область:** Финальная верификация и дедупликация
**Возможности:**
- Удаление дублирующихся найденных проблем
- Разрешение противоречивых результатов
- Консолидация данных из разных агентов
- Финальная верификация рекомендаций
- Приоритизация findings
- Применение confidence labels (Confirmed, Likely, Hypothesis)
- Выходной контроль качества

**Используемые скрипты:** `finding_verifier.py`

---

## 📊 16 Sub-Skills (Подумки)

| Sub-Skill | Фокус | Основной Agent |
|-----------|-------|-----------------|
| `seo audit` | Полный аудит сайта со скорингом | Technical, Content, Performance |
| `seo page` | Глубокий анализ отдельной страницы | Все агенты |
| `seo technical` | Техническая оптимизация | Technical SEO |
| `seo content` | Качество контента и E-E-A-T | Content Quality |
| `seo schema` | Schema.org разметка | Schema Markup |
| `seo sitemap` | XML сitemaps | Sitemap |
| `seo images` | Оптимизация изображений | Visual, Technical |
| `seo geo` | Generative Engine Optimization (AI search) | Content Quality |
| `seo aeo` | Answer Engine Optimization (FAQs, snippets) | Content Quality |
| `seo links` | Анализ ссылок и линк профиля | Technical, Sitemap |
| `seo programmatic` | Programmatic SEO safeguards | Technical, Content |
| `seo competitors` | Анализ и генерация страниц конкурентов | GitHub Benchmark |
| `seo hreflang` | Международный SEO / hreflang | Technical |
| `seo plan` | Стратегическое планирование SEO | Все агенты |
| `seo github` | SEO репозиториев GitHub | GitHub Analyst, GitHub Benchmark, GitHub Data |
| `seo article` | Данные статей и оптимизация контента | Content Quality |

---

## 🔧 33 Supporting Scripts

Проект содержит 33 Python-скрипта, которые используются как "evidence collectors" для сбора данных:

### Категории скриптов:

**Технические проверки:**
- `robots_checker.py` - проверка robots.txt
- `redirect_checker.py` - валидация редиректов
- `broken_links.py` - поиск broken links
- `internal_links.py` - анализ внутренних ссылок
- `fetch_page.py` - получение контента страницы
- `parse_html.py` - парсинг HTML структуры

**Контент и качество:**
- `article_seo.py` - анализ SEO статей
- `duplicate_content.py` - обнаружение дублей
- `social_meta.py` - проверка социальных тегов
- `entity_checker.py` - обнаружение сущностей

**Performance:**
- `pagespeed.py` - анализ Core Web Vitals

**Schema и разметка:**
- `validate_schema.py` - валидация JSON-LD

**Visual:**
- `analyze_visual.py` - скриншоты и анализ дизайна

**GitHub специфичные:**
- `github_repo_audit.py` - аудит репозитория
- `github_readme_lint.py` - проверка README
- `github_community_health.py` - анализ сообщества
- `github_competitor_research.py` - конкурентный анализ
- `github_seo_report.py` - генерация отчета
- `github_contributor_insights.py` - анализ контрибьюторов

**Утилиты:**
- `indexnow_checker.py` - регистрация в IndexNow
- `finding_verifier.py` - верификация findings
- `generate_report.py` - генерация HTML отчетов
- И другие...

---

## 🚀 Workflow (Как это работает)

### LLM-First Подход

1. **Сбор данных (Evidence Collection)**
   - Скрипты собирают данные о сайте
   - Используется `read_url_content` для основного анализа

2. **Анализ с LLM**
   - Агенты анализируют собранные данные
   - Каждый finding должен иметь явное доказательство

3. **Confidence Labeling**
   - `Confirmed` - проверено и доказано
   - `Likely` - высокая вероятность
   - `Hypothesis` - предположение, требует проверки

4. **Приоритизация**
   - По влиянию на SEO
   - По сложности исправления

5. **Выходной отчет**
   - `FULL-AUDIT-REPORT.md` - детальные findings
   - `ACTION-PLAN.md` - приоритизированный план действий
   - `SEO-REPORT.html` - красивый HTML отчет

---

## 📋 Reference Data (Feb 2026)

Проект содержит актуальные данные:
- Core Web Vitals пороги (INP заменил FID)
- E-E-A-T framework (Sept 2025 QRG + Dec 2025 core update)
- Schema.org типы (active, deprecated)
- Google SEO Quick Reference
- LLM audit rubric для консистентных выводов

---

## 📌 Возможные Use Cases

1. **Полный SEO аудит** - анализ всех аспектов сайта
2. **Техническая оптимизация** - crawlability, performance, mobile
3. **Контент стратегия** - E-E-A-T, оригинальность, quality gates
4. **Международный SEO** - hreflang, гео-таргетинг
5. **GitHub оптимизация** - репозитории становятся более видимыми в поиске
6. **Конкурентный анализ** - benchmarking против похожих проектов
7. **AI Search Optimization** - подготовка контента для AI engines (ChatGPT, Perplexity)

---

## 🎓 Как использовать

```bash
# Полный аудит сайта
seo audit https://example.com

# Техническая проверка
seo technical https://example.com

# Анализ контента
seo content https://example.com

# GitHub репо оптимизация
seo github https://github.com/username/repo

# Одна страница
seo page https://example.com/article

# Глубокий анализ с план действий
seo plan https://example.com
```

---

## ✅ Стандартный Rubric

Все аудиты следуют `resources/references/llm-audit-rubric.md`:
- **Finding** - описание проблемы
- **Evidence** - доказательство (скриншот, лог, тест)
- **Impact** - влияние на SEO (Critical, Warning, Pass, Info)
- **Fix** - как исправить
- **Confidence** - уровень уверенности

Это обеспечивает консистентность и проверяемость всех findings.
