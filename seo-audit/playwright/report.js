'use strict';

function score(checks) {
  const items = Object.values(checks).flat();
  let pass = 0, warn = 0, fail = 0;
  function walk(obj) {
    if (typeof obj !== 'object' || obj === null) return;
    if ('note' in obj) {
      const n = obj.note;
      if (/^OK/i.test(n)) pass++;
      else if (/медленно|слишком|несколько|отсутств/i.test(n)) warn++;
      else if (/критично|не обнаруж|недоступ|не найден|нет/i.test(n)) fail++;
    }
    Object.values(obj).forEach(v => { if (typeof v === 'object') walk(v); });
  }
  items.forEach(walk);
  Object.values(checks).forEach(walk);
  const total = pass + warn + fail || 1;
  return { pass, warn, fail, score: Math.round((pass / total) * 100) };
}

function buildReport(url, checks) {
  const s = score(checks);
  return {
    url,
    audited_at: new Date().toISOString(),
    summary: s,
    grade: s.score >= 80 ? 'A' : s.score >= 60 ? 'B' : s.score >= 40 ? 'C' : 'D',
    checks,
  };
}

module.exports = { buildReport };
