'use strict';

const https = require('https');
const http = require('http');

function fetchText(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout: 8000 }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
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
      const viewport = document.querySelector('meta[name="viewport"]');
      const imagesNoAlt = Array.from(document.querySelectorAll('img:not([alt])'))
        .map(img => img.src).slice(0, 20);
      const imagesEmptyAlt = Array.from(document.querySelectorAll('img[alt=""]'))
        .map(img => img.src).slice(0, 20);
      return { title, desc: descEl?.getAttribute('content') || null,
        canonical: canonical?.getAttribute('href') || null,
        h1s, viewport: viewport?.getAttribute('content') || null,
        imagesNoAlt, imagesEmptyAlt };
    }),
  ]);

  // robots.txt анализ
  const robotsLines = robotsTxt.split('\n').map(l => l.trim()).filter(Boolean);
  const hasYandexBot = robotsLines.some(l => /yandexbot/i.test(l));
  const cleanParam = robotsLines.filter(l => /clean-param/i.test(l));
  const crawlDelay = robotsLines.find(l => /crawl-delay/i.test(l));
  const sitemapLine = robotsLines.find(l => /^sitemap:/i.test(l));

  // sitemap.xml
  const hasSitemap = sitemapXml.includes('<urlset') || sitemapXml.includes('<sitemapindex');
  const urlCount = (sitemapXml.match(/<url>/g) || []).length;

  // заголовки
  const titleLen = pageData.title.length;
  const descLen = pageData.desc ? pageData.desc.length : 0;

  return {
    load_time: {
      ms: loadMs,
      note: loadMs < 2000 ? 'OK' : loadMs < 4000 ? 'Медленно' : 'Критично медленно',
    },
    title: {
      value: pageData.title,
      length: titleLen,
      note: titleLen >= 30 && titleLen <= 65 ? 'OK'
        : titleLen < 30 ? 'Слишком короткий (< 30)' : 'Слишком длинный (> 65)',
    },
    description: {
      value: pageData.desc,
      length: descLen,
      note: descLen >= 100 && descLen <= 200 ? 'OK'
        : descLen === 0 ? 'Отсутствует'
        : descLen < 100 ? 'Слишком короткое (< 100)' : 'Слишком длинное (> 200)',
    },
    h1: {
      count: pageData.h1s.length,
      values: pageData.h1s,
      note: pageData.h1s.length === 1 ? 'OK'
        : pageData.h1s.length === 0 ? 'H1 отсутствует'
        : `Несколько H1 (${pageData.h1s.length})`,
    },
    canonical: {
      value: pageData.canonical,
      note: pageData.canonical ? 'OK' : 'Canonical отсутствует',
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
      samples: pageData.imagesNoAlt.slice(0, 5),
    },
    robots_txt: {
      found: robotsTxt.length > 0,
      has_yandexbot: hasYandexBot,
      clean_param: cleanParam,
      crawl_delay: crawlDelay || null,
      sitemap_declared: !!sitemapLine,
      note: robotsTxt.length > 0 ? (hasYandexBot ? 'OK, есть секция YandexBot'
        : 'robots.txt есть, но нет секции YandexBot') : 'robots.txt недоступен',
    },
    sitemap: {
      found: hasSitemap,
      url_count: urlCount,
      note: hasSitemap ? `OK, ${urlCount} URL` : 'sitemap.xml не найден или пустой',
    },
    http_errors: responses.filter(r => r.status >= 400).slice(0, 10),
  };
}

module.exports = { checkTechnical };
