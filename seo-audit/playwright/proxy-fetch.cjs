'use strict';
const { chromium } = require('playwright');
const fs = require('fs');

const [,, url, outHtml, outMeta] = process.argv;
if (!url || !outHtml || !outMeta) {
  console.error('Usage: node proxy-fetch.cjs <url> <out.html> <out.meta.json>');
  process.exit(1);
}

// Detect challenge pages by title patterns
const CHALLENGE_TITLES = ['checking device', 'just a moment', 'attention required', 'ddos', 'cloudflare'];
function isChallengePage(title) {
  return CHALLENGE_TITLES.some(t => title.toLowerCase().includes(t));
}

(async () => {
  const browser = await chromium.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    extraHTTPHeaders: {
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
    viewport: { width: 1440, height: 900 },
  });

  // Intercept anti-bot API checks — inject required custom headers
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const reqUrl = req.url();
    const extraHeaders = {};

    // Goldapple Plaid challenge headers
    if (reqUrl.includes('/web/api/v1/settings')) {
      const host = new URL(reqUrl).hostname;
      const storeId = host.split('.').pop(); // 'ru', 'by', etc.
      extraHeaders['plaid-platform'] = 'web';
      extraHeaders['plaid-version'] = '1.0.0';
      extraHeaders['plaid-store-id'] = storeId;
      extraHeaders['x-requested-with'] = 'XMLHttpRequest';
    }

    await route.continue({ headers: { ...req.headers(), ...extraHeaders } });
  });

  const page = await ctx.newPage();

  // Remove webdriver flag
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const httpErrors = [];
  page.on('response', r => {
    if (r.status() >= 400) httpErrors.push({ url: r.url(), status: r.status() });
  });

  let html, title, finalUrl;

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
    title = await page.title();

    // If challenge page detected — wait up to 20s for reload after challenge resolves
    if (isChallengePage(title)) {
      console.error(`Challenge detected: "${title}" — waiting for reload...`);
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 });
        title = await page.title();
        console.error(`After reload: "${title}"`);
      } catch (e) {
        console.error('Challenge did not resolve, capturing as-is');
      }
    }
  } catch (e) {
    console.error('Navigation warning:', e.message);
  }

  html = await page.content();
  title = await page.title();
  finalUrl = page.url();

  fs.writeFileSync(outHtml, html, 'utf8');

  const meta = {
    url,
    final_url: finalUrl,
    title,
    fetched_at: new Date().toISOString(),
    size_bytes: Buffer.byteLength(html, 'utf8'),
    http_errors: httpErrors.slice(0, 20),
    challenge_detected: isChallengePage(title),
  };
  fs.writeFileSync(outMeta, JSON.stringify(meta, null, 2), 'utf8');

  console.log(`title: ${title}`);
  console.log(`size:  ${meta.size_bytes} bytes`);
  console.log(`url:   ${finalUrl}`);
  if (meta.challenge_detected) console.log('WARNING: challenge page returned');

  await browser.close();
})();
