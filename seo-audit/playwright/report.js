'use strict';

// Категории и их вес в итоговом скоре
const CATEGORY_WEIGHTS = {
  redirects:  5,
  security:  15,
  llms:       5,
  yandex:    35,
  technical: 30,
  indexnow:  10,
};

function scoreCategory(key, data) {
  if (!data || typeof data !== 'object') return { score: 0, max: 100, issues: [] };

  // security уже имеет свой score
  if (key === 'security' && typeof data.score === 'number') {
    return { score: data.score, max: 100, issues: data.checks
      ? Object.values(data.checks).filter(c => !c.ok).map(c => c.note) : [] };
  }

  // llms уже имеет quality_score
  if (key === 'llms') {
    if (!data.found) return { score: 0, max: 100, issues: ['llms.txt отсутствует'] };
    return { score: data.quality_score || 0, max: 100, issues: [] };
  }

  // Для остальных — считаем по note-полям
  const issues = [];
  let pass = 0, total = 0;

  function walk(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;
    if (typeof obj.note === 'string') {
      total++;
      if (/^OK/i.test(obj.note)) pass++;
      else issues.push(obj.note);
    }
    Object.values(obj).forEach(v => { if (v && typeof v === 'object' && !Array.isArray(v)) walk(v); });
  }
  walk(data);

  return { score: total > 0 ? Math.round((pass / total) * 100) : 100, max: 100, issues };
}

function buildReport(url, checks) {
  const categories = {};
  let weightedSum = 0;
  let totalWeight = 0;
  const allIssues = [];

  for (const [key, data] of Object.entries(checks)) {
    const { score, issues } = scoreCategory(key, data);
    const weight = CATEGORY_WEIGHTS[key] || 10;
    categories[key] = { score, weight };
    weightedSum += score * weight;
    totalWeight += weight;
    issues.forEach(i => allIssues.push({ category: key, issue: i }));
  }

  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const grade = overallScore >= 80 ? 'A' : overallScore >= 60 ? 'B' : overallScore >= 40 ? 'C' : 'D';

  // Топ-проблемы по важным категориям
  const topIssues = allIssues
    .filter(i => ['yandex', 'technical', 'security', 'indexnow'].includes(i.category))
    .slice(0, 10);

  return {
    url,
    audited_at: new Date().toISOString(),
    summary: {
      score: overallScore,
      grade,
      categories,
      top_issues: topIssues,
    },
    checks,
  };
}

module.exports = { buildReport };
