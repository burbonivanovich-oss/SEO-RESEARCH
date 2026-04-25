'use strict';

const https = require('https');
const http = require('http');

function fetchHeaders(url, timeout = 8000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, { method: 'HEAD', timeout }, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function checkSecurity(url) {
  const res = await fetchHeaders(url);
  if (!res) return { error: 'Не удалось получить заголовки', score: 0, note: 'Ошибка соединения' };

  const h = res.headers;
  const checks = {};
  let score = 0;

  // HTTPS (25 баллов)
  const isHttps = url.startsWith('https');
  checks.https = { ok: isHttps, weight: 25, note: isHttps ? 'OK' : 'Сайт не на HTTPS' };
  if (isHttps) score += 25;

  // HSTS (20 баллов)
  const hsts = h['strict-transport-security'] || null;
  const hstsMaxAge = hsts ? parseInt((hsts.match(/max-age=(\d+)/) || [])[1] || '0') : 0;
  const hstsOk = hstsMaxAge >= 31536000;
  checks.hsts = {
    ok: hstsOk, value: hsts, max_age: hstsMaxAge, weight: 20,
    note: !hsts ? 'HSTS отсутствует'
      : !hstsOk ? `max-age слишком мал (${hstsMaxAge}), нужно ≥31536000`
      : 'OK',
  };
  if (hstsOk) score += 20;

  // X-Content-Type-Options (15 баллов)
  const xcto = h['x-content-type-options'] || null;
  checks.x_content_type = {
    ok: xcto === 'nosniff', value: xcto, weight: 15,
    note: xcto === 'nosniff' ? 'OK' : 'Отсутствует или неверное значение',
  };
  if (xcto === 'nosniff') score += 15;

  // X-Frame-Options (15 баллов)
  const xfo = h['x-frame-options'] || null;
  const xfoOk = xfo && /^(deny|sameorigin)$/i.test(xfo);
  checks.x_frame_options = {
    ok: !!xfoOk, value: xfo, weight: 15,
    note: xfoOk ? 'OK' : 'Отсутствует (риск clickjacking)',
  };
  if (xfoOk) score += 15;

  // Content-Security-Policy (15 баллов)
  const csp = h['content-security-policy'] || null;
  checks.csp = {
    ok: !!csp, value: csp ? csp.substring(0, 80) + '…' : null, weight: 15,
    note: csp ? 'OK' : 'CSP отсутствует',
  };
  if (csp) score += 15;

  // Referrer-Policy (10 баллов)
  const rp = h['referrer-policy'] || null;
  checks.referrer_policy = {
    ok: !!rp, value: rp, weight: 10,
    note: rp ? 'OK' : 'Referrer-Policy отсутствует',
  };
  if (rp) score += 10;

  const grade = score >= 85 ? 'A' : score >= 65 ? 'B' : score >= 45 ? 'C' : 'D';

  return {
    score,
    grade,
    checks,
    note: `Безопасность: ${score}/100 (${grade})`,
  };
}

module.exports = { checkSecurity };
