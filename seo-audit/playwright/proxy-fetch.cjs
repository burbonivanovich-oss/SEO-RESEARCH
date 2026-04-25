'use strict';
const { chromium } = require('playwright');
const fs = require('fs');

const [,, url, outHtml, outMeta] = process.argv;
if (!url || !outHtml || !outMeta) {
  console.error('Usage: node proxy-fetch.cjs <url> <out.html> <out.meta.json>');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ru-RU',
    extraHTTPHeaders: { 'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8' },
  });

  const page = await ctx.newPage();
  const httpErrors = [];
  page.on('response', r => { if (r.status() >= 400) httpErrors.push({ url: r.url(), status: r.status() }); });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
  } catch (e) {
    console.error('Navigation warning:', e.message);
  }

  const html = await page.content();
  const title = await page.title();
  const finalUrl = page.url();

  fs.writeFileSync(outHtml, html, 'utf8');

  const meta = {
    url,
    final_url: finalUrl,
    title,
    fetched_at: new Date().toISOString(),
    size_bytes: Buffer.byteLength(html, 'utf8'),
    http_errors: httpErrors.slice(0, 20),
  };
  fs.writeFileSync(outMeta, JSON.stringify(meta, null, 2), 'utf8');

  console.log(`title: ${title}`);
  console.log(`size:  ${meta.size_bytes} bytes`);
  console.log(`url:   ${finalUrl}`);

  await browser.close();
})();
