#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const { checkYandex } = require('./checks/yandex');
const { checkTechnical } = require('./checks/technical');
const { buildReport } = require('./report');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node crawler.js <url>');
  process.exit(1);
}

(async () => {
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
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  const loadMs = Date.now() - t0;

  const [yandex, technical] = await Promise.all([
    checkYandex(page, url),
    checkTechnical(page, url, responses, loadMs),
  ]);

  await browser.close();

  const report = buildReport(url, { yandex, technical });
  const fs = require('fs');
  const outPath = `seo-report-${Date.now()}.json`;
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`\nReport saved: ${outPath}`);
})();
