'use strict';

const https = require('https');
const http = require('http');

function fetchText(url, timeout = 6000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout }, (res) => {
      if (res.statusCode !== 200) { resolve(null); return; }
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
  });
}

function parseLlmsTxt(content) {
  const lines = content.split('\n');
  const parsed = { title: null, description: null, sections: [], links: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('# ') && !parsed.title) {
      parsed.title = trimmed.slice(2).trim();
    } else if (trimmed.startsWith('## ')) {
      parsed.sections.push(trimmed.slice(3).trim());
    } else if (trimmed.startsWith('> ') && !parsed.description) {
      parsed.description = trimmed.slice(2).trim();
    } else if (/^\[.+\]\(.+\)/.test(trimmed)) {
      parsed.links.push(trimmed);
    }
  }
  return parsed;
}

function scoreLlms(parsed, content) {
  let score = 0;
  const details = [];

  if (parsed.title) { score += 20; details.push('Заголовок (+20)'); }
  else details.push('Нет заголовка (0)');

  if (parsed.description) { score += 20; details.push('Описание (+20)'); }
  else details.push('Нет описания (0)');

  if (parsed.sections.length > 0) { score += 20; details.push(`Секции x${parsed.sections.length} (+20)`); }
  else details.push('Нет секций (0)');

  if (parsed.links.length > 0) { score += 20; details.push(`Ссылки x${parsed.links.length} (+20)`); }
  else details.push('Нет ссылок (0)');

  if (content.length > 500) { score += 10; details.push('Объём >500 символов (+10)'); }
  if (content.length > 2000) { score += 10; details.push('Объём >2000 символов (+10)'); }

  return { score, details };
}

async function checkLlms(siteUrl) {
  const origin = new URL(siteUrl).origin;
  const content = await fetchText(`${origin}/llms.txt`);

  if (!content) {
    return {
      found: false,
      score: 0,
      note: 'llms.txt отсутствует — AI-поисковики (Perplexity, ChatGPT) не получат структурированный контекст',
    };
  }

  const parsed = parseLlmsTxt(content);
  const { score, details } = scoreLlms(parsed, content);

  return {
    found: true,
    size_chars: content.length,
    parsed,
    quality_score: score,
    quality_details: details,
    note: score >= 80 ? `OK — llms.txt качественный (${score}/100)`
      : score >= 40 ? `llms.txt есть, но неполный (${score}/100): ${details.filter(d => d.includes('(0)')).join(', ')}`
      : `llms.txt минимальный (${score}/100) — нужно доработать`,
  };
}

module.exports = { checkLlms };
