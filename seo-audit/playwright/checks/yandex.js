'use strict';

const https = require('https');
const http = require('http');

function fetchText(url, timeout = 6000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve(data));
    }).on('error', () => resolve('')).on('timeout', () => resolve(''));
  });
}

async function checkYandex(page, siteUrl) {
  const origin = new URL(siteUrl).origin;
  const robotsTxt = await fetchText(`${origin}/robots.txt`);

  const results = await page.evaluate((robotsTxtContent) => {
    const out = {};

    // --- Яндекс.Метрика ---
    const scripts = Array.from(document.querySelectorAll('script'));
    const scriptText = scripts.map(s => s.textContent || s.src).join('\n');
    const metrikaMatch = scriptText.match(/ym\s*\(\s*(\d+)\s*,\s*['"]init['"]/);
    out.metrika = {
      found: !!metrikaMatch,
      counter: metrikaMatch ? metrikaMatch[1] : null,
      note: metrikaMatch ? `OK — счётчик ${metrikaMatch[1]}` : 'Счётчик Яндекс.Метрики не обнаружен',
    };

    // --- Верификация Яндекс.Вебмастера ---
    const yaMeta = document.querySelector('meta[name="yandex-verification"]');
    out.webmaster_verification = {
      found: !!yaMeta,
      content: yaMeta ? yaMeta.getAttribute('content') : null,
      note: yaMeta ? 'OK' : 'Тег yandex-verification отсутствует',
    };

    // --- Турбо-страницы ---
    const turbo = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
    out.turbo = {
      found: !!turbo,
      href: turbo ? turbo.getAttribute('href') : null,
      note: turbo ? 'Турбо-фид найден' : 'Турбо-страницы не подключены',
    };

    // --- hreflang: 8 проверок (по мотивам Bhanunamikaze) ---
    const hreflangEls = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'));
    const hreflangs = hreflangEls.map(el => ({
      lang: el.getAttribute('hreflang'),
      href: el.getAttribute('href'),
    }));

    const hasRu = hreflangs.some(h => h.lang && h.lang.startsWith('ru'));
    const hasXDefault = hreflangs.some(h => h.lang === 'x-default');
    const hasSelf = hreflangs.some(h => {
      try { return new URL(h.href).href === window.location.href; } catch { return false; }
    });

    const VALID_LANGS = new Set(['ru', 'en', 'uk', 'be', 'kk', 'de', 'fr', 'es', 'it', 'pt',
      'zh', 'ja', 'ko', 'ar', 'tr', 'pl', 'nl', 'sv', 'da', 'fi', 'nb', 'cs', 'sk', 'hu',
      'ro', 'bg', 'hr', 'sr', 'sl', 'et', 'lv', 'lt', 'x-default']);
    const invalidLangs = hreflangs.filter(h => {
      if (!h.lang) return true;
      const base = h.lang.split('-')[0].toLowerCase();
      return !VALID_LANGS.has(base) && h.lang !== 'x-default';
    });

    // Протокол консистентность
    const protocols = hreflangs.map(h => { try { return new URL(h.href).protocol; } catch { return null; } });
    const uniqueProtocols = [...new Set(protocols.filter(Boolean))];
    const protocolConsistent = uniqueProtocols.length <= 1;

    // Canonical совпадение
    const canonical = document.querySelector('link[rel="canonical"]');
    const canonicalHref = canonical ? canonical.getAttribute('href') : null;
    const canonicalAligned = !canonicalHref || hreflangs.some(h => {
      try { return new URL(h.href).href === new URL(canonicalHref, window.location.href).href; } catch { return false; }
    });

    const hreflangIssues = [];
    if (hreflangs.length > 0) {
      if (!hasSelf) hreflangIssues.push('Нет self-referencing тега');
      if (!hasXDefault) hreflangIssues.push('Нет x-default');
      if (!hasRu) hreflangIssues.push('Нет hreflang="ru"');
      if (invalidLangs.length > 0) hreflangIssues.push(`Невалидные коды: ${invalidLangs.map(h => h.lang).join(', ')}`);
      if (!protocolConsistent) hreflangIssues.push('Смешаны HTTP и HTTPS в href');
      if (!canonicalAligned) hreflangIssues.push('Canonical не входит в hreflang-набор');
    }

    out.hreflang = {
      count: hreflangs.length,
      tags: hreflangs,
      has_ru: hasRu,
      has_x_default: hasXDefault,
      has_self_ref: hasSelf,
      protocol_consistent: protocolConsistent,
      canonical_aligned: canonicalAligned,
      invalid_codes: invalidLangs,
      issues: hreflangIssues,
      note: hreflangs.length === 0 ? 'hreflang теги отсутствуют'
        : hreflangIssues.length === 0 ? 'OK'
        : hreflangIssues.join('; '),
    };

    // --- lang атрибут документа ---
    const docLang = document.documentElement.getAttribute('lang') || '';
    out.doc_lang = {
      value: docLang,
      is_ru: docLang.startsWith('ru'),
      note: docLang.startsWith('ru') ? 'OK' : `lang="${docLang || 'не задан'}" — не русскоязычная разметка`,
    };

    // --- Open Graph с проверкой длин (как в social_meta.py) ---
    const ogGet = (prop) => {
      const el = document.querySelector(`meta[property="${prop}"]`);
      return el ? el.getAttribute('content') : null;
    };
    const ogTitle = ogGet('og:title');
    const ogDesc = ogGet('og:description');
    const ogImage = ogGet('og:image');
    const ogType = ogGet('og:type');
    const ogUrl = ogGet('og:url');

    const ogIssues = [];
    if (!ogTitle) ogIssues.push('og:title отсутствует');
    else if (ogTitle.length < 10) ogIssues.push(`og:title слишком короткий (${ogTitle.length} < 10)`);
    else if (ogTitle.length > 60) ogIssues.push(`og:title слишком длинный (${ogTitle.length} > 60)`);

    if (!ogDesc) ogIssues.push('og:description отсутствует');
    else if (ogDesc.length < 50) ogIssues.push(`og:description слишком короткий (${ogDesc.length} < 50)`);
    else if (ogDesc.length > 200) ogIssues.push(`og:description слишком длинный (${ogDesc.length} > 200)`);

    if (!ogImage) ogIssues.push('og:image отсутствует');
    if (!ogType) ogIssues.push('og:type отсутствует');
    if (!ogUrl) ogIssues.push('og:url отсутствует');

    out.open_graph = {
      tags: { 'og:title': ogTitle, 'og:description': ogDesc, 'og:image': ogImage, 'og:type': ogType, 'og:url': ogUrl },
      issues: ogIssues,
      note: ogIssues.length === 0 ? 'OK' : ogIssues.join('; '),
    };

    // --- Schema.org ---
    const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
      .filter(Boolean);
    const schemaTypes = schemas.flatMap(s => [].concat(s['@type'])).filter(Boolean);
    const yandexUseful = ['Organization', 'LocalBusiness', 'Product', 'BreadcrumbList',
      'Article', 'NewsArticle', 'Review', 'Recipe', 'VideoObject', 'FAQPage', 'Event'];
    const foundUseful = schemaTypes.filter(t => yandexUseful.includes(t));
    const hasPlaceholders = schemas.some(s => JSON.stringify(s).includes('[Business Name]') ||
      JSON.stringify(s).includes('[INSERT'));
    out.schema = {
      types_found: schemaTypes,
      yandex_useful: foundUseful,
      has_placeholders: hasPlaceholders,
      note: hasPlaceholders ? 'Найдены placeholder-значения в schema!'
        : foundUseful.length > 0 ? `OK — найдено: ${foundUseful.join(', ')}`
        : 'Нет полезных для Яндекса типов schema.org',
    };

    // --- Robots meta ---
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const yandexMeta = document.querySelector('meta[name="yandex"]');
    const robotsContent = robotsMeta ? robotsMeta.getAttribute('content') : '';
    out.robots_meta = {
      robots: robotsContent || null,
      yandex: yandexMeta ? yandexMeta.getAttribute('content') : null,
      noindex: /noindex/i.test(robotsContent),
      note: /noindex/i.test(robotsContent) ? 'ВНИМАНИЕ: страница noindex!' : 'OK',
    };

    // --- Favicon ---
    const favicon = document.querySelector('link[rel~="icon"]');
    out.favicon = {
      found: !!favicon,
      href: favicon ? favicon.getAttribute('href') : null,
      note: favicon ? 'OK' : 'Favicon отсутствует',
    };

    // --- AI-краулеры в robots.txt ---
    const aiCrawlers = ['YandexBot', 'GPTBot', 'ClaudeBot', 'PerplexityBot',
      'Google-Extended', 'Applebot', 'CCBot'];
    const robotsLines = robotsTxtContent.split('\n').map(l => l.trim());

    let currentAgents = [];
    const agentRules = {};
    for (const line of robotsLines) {
      if (/^user-agent:/i.test(line)) {
        currentAgents = [line.replace(/^user-agent:\s*/i, '').trim()];
      } else if (/^disallow:/i.test(line)) {
        currentAgents.forEach(a => {
          if (!agentRules[a]) agentRules[a] = { disallow: [], allow: [] };
          agentRules[a].disallow.push(line.replace(/^disallow:\s*/i, '').trim());
        });
      } else if (/^allow:/i.test(line)) {
        currentAgents.forEach(a => {
          if (!agentRules[a]) agentRules[a] = { disallow: [], allow: [] };
          agentRules[a].allow.push(line.replace(/^allow:\s*/i, '').trim());
        });
      } else if (line === '') {
        currentAgents = [];
      }
    }

    const crawlerStatus = {};
    for (const crawler of aiCrawlers) {
      const rules = agentRules[crawler] || agentRules['*'] || null;
      if (!agentRules[crawler]) {
        crawlerStatus[crawler] = 'наследует *';
      } else if (rules && rules.disallow.includes('/')) {
        crawlerStatus[crawler] = 'полностью заблокирован';
      } else if (rules && rules.disallow.length > 0) {
        crawlerStatus[crawler] = `частично ограничен (${rules.disallow.length} правил)`;
      } else {
        crawlerStatus[crawler] = 'разрешён явно';
      }
    }

    out.ai_crawlers = {
      status: crawlerStatus,
      yandexbot_explicit: !!agentRules['YandexBot'],
      yandexbot_blocked: agentRules['YandexBot']
        ? agentRules['YandexBot'].disallow.includes('/') : false,
      note: agentRules['YandexBot']
        ? (agentRules['YandexBot'].disallow.includes('/') ? 'YandexBot заблокирован!' : 'OK — YandexBot имеет явные правила')
        : 'YandexBot не имеет явных правил (наследует *)',
    };

    return out;
  }, robotsTxt);

  return results;
}

module.exports = { checkYandex };
