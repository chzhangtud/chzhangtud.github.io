const DEFAULT_SOURCE_URL = 'https://s01.flagcounter.com/countries/TSy/';

const CHINA_SOURCE_CODES = new Set(['cn', 'hk', 'mo', 'tw']);

export function parseFlagCounterCountries(html) {
  const rows = [];
  const rowPattern = /<a\s+href=(["']?)\/flag_details\/([a-z]{2})\/[^>]*\1[^>]*>[\s\S]*?<a\s+href=(["']?)\/factbook\/\2\/[^>]*\3[^>]*>\s*<u>([^<]+)<\/u>[\s\S]*?<td[^>]*>\s*(?:<[^>]+>\s*)*(\d+)(?:\s*<\/[^>]+>)*\s*<\/td>/gi;
  for (const match of html.matchAll(rowPattern)) {
    rows.push({
      sourceCode: match[2].toLowerCase(),
      name: decodeEntities(match[4].trim()),
      visitors: Number(match[5]),
    });
  }
  if (!rows.length) throw new Error('No country rows found');
  return rows;
}

export function normalizeCountries(rows) {
  const countries = [];
  let chinaInsertIndex = -1;
  let chinaVisitors = 0;

  rows.forEach((row) => {
    const sourceCode = String(row.sourceCode).toLowerCase();
    if (CHINA_SOURCE_CODES.has(sourceCode)) {
      if (chinaInsertIndex === -1) chinaInsertIndex = countries.length;
      chinaVisitors += row.visitors;
      return;
    }
    countries.push({ ...row, sourceCode, label: sourceCode.toUpperCase(), flagCode: sourceCode });
  });

  if (chinaInsertIndex !== -1) {
    countries.splice(chinaInsertIndex, 0, {
      sourceCode: 'cn',
      name: 'China',
      visitors: chinaVisitors,
      label: 'CN',
      flagCode: 'cn',
    });
  }
  return countries;
}

export function createHandler({ fetchImpl = fetch, sourceUrl = DEFAULT_SOURCE_URL } = {}) {
  return {
    async fetch(request) {
      const headers = corsHeaders();
      if (request.method === 'OPTIONS') return new Response(null, { headers });
      const url = new URL(request.url);
      if (url.pathname !== '/v1/country-stats') return json({ error: 'Not found' }, 404, headers);
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, headers);

      let upstream;
      try {
        upstream = await fetchImpl(sourceUrl);
      } catch {
        return json({ error: 'Country statistics source unavailable' }, 502, headers);
      }
      if (!upstream.ok) return json({ error: 'Country statistics source unavailable' }, 502, headers);

      try {
        const countries = normalizeCountries(parseFlagCounterCountries(await upstream.text()));
        headers.set('Cache-Control', 'public, max-age=300');
        return json({ countries, updatedAt: new Date().toISOString() }, 200, headers);
      } catch {
        return json({ error: 'Country statistics source format invalid' }, 502, headers);
      }
    },
  };
}

function decodeEntities(value) {
  return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&nbsp;/gi, ' ');
}

function corsHeaders() {
  return new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  });
}

function json(value, status, headers) {
  return new Response(JSON.stringify(value), { status, headers });
}

export default {
  fetch(request, env) {
    return createHandler({ sourceUrl: env.FLAG_COUNTER_DETAILS_URL || DEFAULT_SOURCE_URL }).fetch(request);
  },
};
