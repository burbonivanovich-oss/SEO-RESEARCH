'use strict';

async function checkYandex(page, siteUrl) {
  return page.evaluate((baseUrl) => {
    const results = {};

    // --- Яндекс.Метрика ---
    const scripts = Array.from(document.querySelectorAll('script'));
    const scriptText = scripts.map(s => s.textContent || s.src).join('\n');
    const metrikaCounter = scriptText.match(/ym\s*\(\s*(\d+)\s*,\s*['"]init['"]/);
    results.metrika = {
      found: !!metrikaCounter,
      counter: metrikaCounter ? metrikaCounter[1] : null,
      note: metrikaCounter ? 'OK' : 'Счётчик Яндекс.Метрики не обнаружен',
    };

    // --- Верификация Яндекс.Вебмастера ---
    const yaMeta = document.querySelector('meta[name="yandex-verification"]');
    results.webmaster_verification = {
      found: !!yaMeta,
      content: yaMeta ? yaMeta.getAttribute('content') : null,
      note: yaMeta ? 'OK' : 'Тег yandex-verification отсутствует',
    };

    // --- Турбо-страницы ---
    const turbo = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
    results.turbo = {
      found: !!turbo,
      href: turbo ? turbo.getAttribute('href') : null,
      note: turbo ? 'Турбо-фид найден' : 'Турбо-страницы не подключены',
    };

    // --- hreflang для RU-рынка ---
    const hreflangs = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'))
      .map(el => ({ lang: el.getAttribute('hreflang'), href: el.getAttribute('href') }));
    const hasRu = hreflangs.some(h => h.lang && h.lang.startsWith('ru'));
    results.hreflang = {
      tags: hreflangs,
      has_ru: hasRu,
      note: hasRu ? 'OK' : 'hreflang для ru отсутствует',
    };

    // --- lang атрибут документа ---
    const docLang = document.documentElement.getAttribute('lang') || '';
    results.doc_lang = {
      value: docLang,
      is_ru: docLang.startsWith('ru'),
      note: docLang.startsWith('ru') ? 'OK' : `lang="${docLang}" — не русскоязычная разметка`,
    };

    // --- Open Graph (VK, ОК) ---
    const ogTags = {};
    ['og:title', 'og:description', 'og:image', 'og:type', 'og:url'].forEach(prop => {
      const el = document.querySelector(`meta[property="${prop}"]`);
      ogTags[prop] = el ? el.getAttribute('content') : null;
    });
    const ogMissing = Object.entries(ogTags).filter(([, v]) => !v).map(([k]) => k);
    results.open_graph = {
      tags: ogTags,
      missing: ogMissing,
      note: ogMissing.length === 0 ? 'OK' : `Отсутствуют: ${ogMissing.join(', ')}`,
    };

    // --- Schema.org (типы, важные для Яндекса) ---
    const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
      .filter(Boolean);
    const schemaTypes = schemas.map(s => s['@type']).flat().filter(Boolean);
    const yandexUseful = ['Organization', 'LocalBusiness', 'Product', 'BreadcrumbList',
      'Article', 'NewsArticle', 'Review', 'Recipe', 'VideoObject', 'FAQPage'];
    const foundUseful = schemaTypes.filter(t => yandexUseful.includes(t));
    results.schema = {
      types_found: schemaTypes,
      yandex_useful: foundUseful,
      note: foundUseful.length > 0
        ? `Найдено: ${foundUseful.join(', ')}`
        : 'Нет полезных для Яндекса типов schema.org',
    };

    // --- Robots meta (noindex для Яндекса) ---
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const yandexMeta = document.querySelector('meta[name="yandex"]');
    results.robots_meta = {
      robots: robotsMeta ? robotsMeta.getAttribute('content') : null,
      yandex: yandexMeta ? yandexMeta.getAttribute('content') : null,
      indexed: !(robotsMeta && /noindex/i.test(robotsMeta.getAttribute('content') || '')),
    };

    // --- Favicon (Яндекс показывает в поиске) ---
    const favicon = document.querySelector('link[rel~="icon"]');
    results.favicon = {
      found: !!favicon,
      href: favicon ? favicon.getAttribute('href') : null,
      note: favicon ? 'OK' : 'Favicon отсутствует',
    };

    return results;
  }, siteUrl);
}

module.exports = { checkYandex };
