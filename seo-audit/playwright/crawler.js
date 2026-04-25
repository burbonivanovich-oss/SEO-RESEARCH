#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const { checkYandex } = require('./checks/yandex');
const { checkTechnical } = require('./checks/technical');
const { checkRedirects } = require('./checks/redirect');
const { checkIndexNow } = require('./checks/indexnow');
const { checkSecurity } = require('./checks/security');
const { checkLlms } = require('./checks/llms');
const { buildReport } = require('./report');
const fs = require('fs');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node crawler.js <url>');
  process.exit(1);
}

(async () => {
  // HTTP-based checks run before browser (don't need rendered page)
  const [redirects, security, llms] = await Promise.all([
    checkRedirects(url),
    checkSecurity(url),
    checkLlms(url),
  ]);

  const finalUrl = redirects.final_url || url;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  });
  const page = await context.newPage();

  const responses = [];
  page.on('response', r => responses.push({ url: r.url(), status: r.status() }));

  const t0 = Date.now();
  await page.goto(finalUrl, { waitUntil: 'networkidle', timeout: 30000 });
  const loadMs = Date.now() - t0;

  const [yandex, technical, indexnow] = await Promise.all([
    checkYandex(page, finalUrl),
    checkTechnical(page, finalUrl, responses, loadMs),
    checkIndexNow(page, finalUrl),
  ]);

  await browser.close();

  const report = buildReport(url, { redirects, security, llms, yandex, technical, indexnow });

  const outPath = `seo-report-${Date.now()}.json`;
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`\nReport saved: ${outPath}`);
})();
