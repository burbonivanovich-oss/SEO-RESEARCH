'use strict';

const https = require('https');
const http = require('http');

function fetchText(url, timeout = 8000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve(data));
    }).on('error', () => resolve('')).on('timeout', () => resolve(''));
  });
}

async function checkTechnical(page, siteUrl, responses, loadMs) {
  const origin = new URL(siteUrl).origin;

  const [robotsTxt, sitemapXml, pageData] = await Promise.all([
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/sitemap.xml`),
    page.evaluate(() => {
      const title = document.title || '';
      const descEl = document.querySelector('meta[name="description"]');
      const canonical = document.querySelector('link[rel="canonical"]');
      const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim());
      const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()).slice(0, 10);
      const viewport = document.querySelector('meta[name="viewport"]');
      const charset = document.querySelector('meta[charset]');
      const imagesNoAlt = Array.from(document.querySelectorAll('img:not([alt])'))
        .map(img => img.src).filter(Boolean).slice(0, 20);
      const imagesEmptyAlt = Array.from(document.querySelectorAll('img[alt=""]'))
        .map(img => img.src).filter(Boolean).slice(0, 20);
      const internalLinks = Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href).filter(h => h.startsWith(window.location.origin)).length;
      const externalLinks = Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href).filter(h => h.startsWith('http') && !h.startsWith(window.location.origin)).length;
      return {
        title, desc: descEl?.getAttribute('content') || null,
        canonical: canonical?.getAttribute('href') || null,
        h1s, h2s, viewport: viewport?.getAttribute('content') || null,
        charset: charset?.getAttribute('charset') || null,
        imagesNoAlt, imagesEmptyAlt,
        internalLinks, externalLinks,
      };
    }),
  ]);

  // robots.txt — разбор по агентам
  const robotsLines = robotsTxt.split('\n').map(l => l.trim());
  const hasYandexBot = robotsLines.some(l => /^\s*user-agent\s*:\s*yandexbot/i.test(l));
  const cleanParam = robotsLines.filter(l => /^clean-param/i.test(l));
  const crawlDelay = robotsLines.find(l => /^crawl-delay/i.test(l));
  const sitemapDecl = robotsLines.filter(l => /^sitemap\s*:/i.test(l))
    .map(l => l.replace(/^sitemap\s*:\s*/i, '').trim());

  // Дополнительные директивы Яндекса
  const hostDirective = robotsLines.find(l => /^host\s*:/i.test(l));
  const noindexRules = robotsLines.filter(l => /noindex/i.test(l));

  // sitemap.xml
  const hasSitemap = sitemapXml.includes('<urlset') || sitemapXml.includes('<sitemapindex');
  const urlCount = (sitemapXml.match(/<url>/g) || []).length;
  const hasLastmod = sitemapXml.includes('<lastmod>');
  const hasPriority = sitemapXml.includes('<priority>');
  const hasChangefreq = sitemapXml.includes('<changefreq>');

  const titleLen = pageData.title.length;
  const descLen = pageData.desc ? pageData.desc.length : 0;

  // HTTP ошибки и 4xx/5xx
  const errors4xx = responses.filter(r => r.status >= 400 && r.status < 500);
  const errors5xx = responses.filter(r => r.status >= 500);

  return {
    load_time: {
      ms: loadMs,
      note: loadMs < 2000 ? 'OK' : loadMs < 4000 ? 'Медленно (2-4с)' : 'Критично медленно (>4с)',
    },
    title: {
      value: pageData.title,
      length: titleLen,
      note: titleLen >= 30 && titleLen <= 65 ? 'OK'
        : titleLen < 30 ? `Слишком короткий (${titleLen} < 30)` : `Слишком длинный (${titleLen} > 65)`,
    },
    description: {
      value: pageData.desc,
      length: descLen,
      note: descLen >= 100 && descLen <= 200 ? 'OK'
        : descLen === 0 ? 'Отсутствует'
        : descLen < 100 ? `Слишком короткое (${descLen} < 100)` : `Слишком длинное (${descLen} > 200)`,
    },
    h1: {
      count: pageData.h1s.length,
      values: pageData.h1s,
      note: pageData.h1s.length === 1 ? 'OK'
        : pageData.h1s.length === 0 ? 'H1 отсутствует'
        : `Несколько H1 (${pageData.h1s.length})`,
    },
    h2: { count: pageData.h2s.length, values: pageData.h2s },
    canonical: {
      value: pageData.canonical,
      note: pageData.canonical ? 'OK' : 'Canonical отсутствует',
    },
    charset: {
      value: pageData.charset,
      note: pageData.charset ? 'OK' : 'meta charset отсутствует',
    },
    viewport: {
      value: pageData.viewport,
      note: pageData.viewport ? 'OK' : 'Viewport meta отсутствует — мобильный трафик пострадает',
    },
    images: {
      no_alt: pageData.imagesNoAlt.length,
      empty_alt: pageData.imagesEmptyAlt.length,
      note: pageData.imagesNoAlt.length === 0 ? 'OK'
        : `${pageData.imagesNoAlt.length} изображений без alt`,
      samples_no_alt: pageData.imagesNoAlt.slice(0, 5),
    },
    links: {
      internal: pageData.internalLinks,
      external: pageData.externalLinks,
    },
    robots_txt: {
      found: robotsTxt.length > 0,
      has_yandexbot: hasYandexBot,
      clean_param: cleanParam,
      crawl_delay: crawlDelay || null,
      sitemap_declared: sitemapDecl,
      host_directive: hostDirective || null,
      noindex_rules: noindexRules,
      note: robotsTxt.length === 0 ? 'robots.txt недоступен'
        : hasYandexBot ? 'OK — есть секция YandexBot'
        : 'robots.txt есть, но нет явной секции YandexBot',
    },
    sitemap: {
      found: hasSitemap,
      url_count: urlCount,
      has_lastmod: hasLastmod,
      has_priority: hasPriority,
      has_changefreq: hasChangefreq,
      note: !hasSitemap ? 'sitemap.xml не найден'
        : `OK — ${urlCount} URL${!hasLastmod ? ', нет <lastmod>' : ''}`,
    },
    http_errors: {
      '4xx': errors4xx.slice(0, 10),
      '5xx': errors5xx.slice(0, 5),
      note: errors4xx.length + errors5xx.length === 0 ? 'OK'
        : `${errors4xx.length} ошибок 4xx, ${errors5xx.length} ошибок 5xx`,
    },
  };
}

module.exports = { checkTechnical };
