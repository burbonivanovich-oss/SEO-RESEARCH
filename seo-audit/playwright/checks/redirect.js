'use strict';

const http = require('http');
const https = require('https');

function request(url, timeout = 8000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, { method: 'HEAD', timeout }, (res) => {
      resolve({ status: res.statusCode, location: res.headers['location'] || null });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

function resolveUrl(base, location) {
  if (!location) return null;
  try { return new URL(location, base).href; } catch { return location; }
}

async function checkRedirects(url) {
  const chain = [];
  const visited = new Set();
  let current = url;
  const MAX_HOPS = 10;

  while (chain.length < MAX_HOPS) {
    if (visited.has(current)) {
      return { chain, loop: true, final_url: current, issues: ['Redirect loop detected'] };
    }
    visited.add(current);

    const t0 = Date.now();
    const res = await request(current);
    const ms = Date.now() - t0;

    if (!res) {
      chain.push({ url: current, status: null, ms, note: 'Request failed' });
      break;
    }

    chain.push({ url: current, status: res.status, ms, location: res.location });

    if (res.status < 300 || res.status >= 400) break;
    if (!res.location) { chain.push({ note: 'Missing Location header' }); break; }

    current = resolveUrl(current, res.location);
  }

  const issues = [];
  const hops = chain.filter(h => h.status >= 300 && h.status < 400).length;

  if (hops > 2) issues.push(`Длинная цепочка редиректов (${hops} хопов) — замедляет краулинг`);

  const hasHttp = chain.some(h => h.url && h.url.startsWith('http:'));
  const hasHttps = chain.some(h => h.url && h.url.startsWith('https:'));
  if (hasHttp && hasHttps) issues.push('Смешанный HTTP/HTTPS в цепочке');

  const hasTemp = chain.some(h => h.status === 302 || h.status === 307);
  if (hasTemp) issues.push('Временный редирект (302/307) — для SEO лучше 301');

  const final = chain[chain.length - 1];
  const startsHttp = url.startsWith('http:');
  const endsHttps = final && final.url && final.url.startsWith('https:');
  if (startsHttp && !endsHttps) issues.push('HTTP не редиректит на HTTPS');

  return {
    hops,
    chain,
    final_url: final ? final.url : url,
    issues,
    note: issues.length === 0
      ? (hops === 0 ? 'OK, без редиректов' : `OK, ${hops} хоп(ов)`)
      : issues.join('; '),
  };
}

module.exports = { checkRedirects };
