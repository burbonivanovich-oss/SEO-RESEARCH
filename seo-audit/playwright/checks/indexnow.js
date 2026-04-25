'use strict';

const https = require('https');
const http = require('http');

function fetchHead(url, timeout = 6000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, { method: 'HEAD', timeout }, (res) => {
      resolve({ status: res.statusCode });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

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

async function checkIndexNow(page, siteUrl) {
  const origin = new URL(siteUrl).origin;

  // Ищем ключ IndexNow в мета-тегах страницы
  const keyFromMeta = await page.evaluate(() => {
    const el = document.querySelector(
      'meta[name="indexnow-key"], meta[name="indexnow"], meta[name="yandex-indexnow"]'
    );
    return el ? el.getAttribute('content') : null;
  });

  // Ищем ключ в robots.txt
  const robotsTxt = await fetchText(`${origin}/robots.txt`);
  const keyFromRobots = (robotsTxt.match(/indexnow[^:]*:\s*([a-f0-9]{8,})/i) || [])[1] || null;

  const key = keyFromMeta || keyFromRobots;

  // Проверяем key-файл если ключ найден
  let keyFileStatus = null;
  if (key) {
    const res = await fetchHead(`${origin}/${key}.txt`);
    keyFileStatus = res ? res.status : null;
  }

  // Проверяем поддержку Яндекса (endpoint)
  const yandexEndpoint = 'https://yandex.com/indexnow';

  const issues = [];
  if (!key) issues.push('IndexNow ключ не найден (ни в мета, ни в robots.txt)');
  if (key && keyFileStatus !== 200) issues.push(`Key-файл /${key}.txt недоступен (HTTP ${keyFileStatus})`);
  if (key && !keyFromRobots) issues.push('IndexNow ключ не объявлен в robots.txt');

  return {
    key_found: !!key,
    key,
    key_source: keyFromMeta ? 'meta' : keyFromRobots ? 'robots.txt' : null,
    key_file_status: keyFileStatus,
    key_file_ok: keyFileStatus === 200,
    yandex_endpoint: yandexEndpoint,
    issues,
    note: issues.length === 0
      ? `OK — IndexNow настроен, ключ: ${key}`
      : issues.join('; '),
  };
}

module.exports = { checkIndexNow };
