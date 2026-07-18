const SITE_ORIGIN = 'https://chzhangtud.github.io';

export function createMemoryStore() {
  const quotas = new Map();
  const feedback = [];
  return {
    async consumeQuota(key, limit) { const count = (quotas.get(key) || 0) + 1; if (count > limit) return false; quotas.set(key, count); return true; },
    async save(entry) { feedback.push(entry); },
    async list(article) { return feedback.filter((entry) => entry.article === article); },
  };
}

export function createHandler({ store, rateLimitSalt, commentLimit = 2, likeLimit = 1 }) {
  return { async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    const url = new URL(request.url);
    if (url.pathname !== '/v1/ai-feedback') return json({ error: 'Not found' }, 404);
    if (request.method === 'GET') return json({ feedback: await store.list(normalizeArticle(url.searchParams.get('article'))) });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const article = normalizeArticle(body.article);
    const type = body.type;
    const agent = String(body.agent || '').trim().slice(0, 120);
    const comment = String(body.comment || '').trim().slice(0, 1200);
    if (!article || !['like', 'comment'].includes(type) || !agent || (type === 'comment' && !comment)) return json({ error: 'Invalid feedback payload' }, 400);
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const hash = await sha256(`${rateLimitSalt}:${ip}`);
    const day = new Date().toISOString().slice(0, 10);
    const allowed = await store.consumeQuota(`${hash}:${article}:${type}:${day}`, type === 'comment' ? commentLimit : likeLimit);
    if (!allowed) return json({ error: 'Daily feedback limit reached' }, 429);
    await store.save({ article, type, agent, comment, status: 'unverified', createdAt: new Date().toISOString() });
    return json({ feedback: { type, status: 'unverified' } }, 201);
  }};
}

function normalizeArticle(value) { try { const url = new URL(value); return url.origin === SITE_ORIGIN ? `${url.origin}${url.pathname}` : null; } catch { return null; } }
async function sha256(value) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }
function cors() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Content-Type': 'application/json' }; }
function json(value, status = 200) { return new Response(JSON.stringify(value), { status, headers: cors() }); }

export default { fetch(request, env) { return createHandler({ store: createD1Store(env.DB), rateLimitSalt: env.RATE_LIMIT_SALT, commentLimit: Number(env.COMMENT_LIMIT_PER_IP_PER_ARTICLE_PER_DAY || 2), likeLimit: Number(env.LIKE_LIMIT_PER_IP_PER_ARTICLE_PER_DAY || 1) }).fetch(request); } };

function createD1Store(db) { return {
  async consumeQuota(key, limit) { const row = await db.prepare('INSERT INTO ai_feedback_quotas (quota_key, count) VALUES (?1, 1) ON CONFLICT(quota_key) DO UPDATE SET count = count + 1 WHERE count < ?2 RETURNING count').bind(key, limit).first(); return Boolean(row); },
  async save(entry) { await db.prepare('INSERT INTO ai_feedback (article, type, agent, comment, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)').bind(entry.article, entry.type, entry.agent, entry.comment, entry.status, entry.createdAt).run(); },
  async list(article) { if (!article) return []; const result = await db.prepare("SELECT type, agent, comment, status, created_at AS createdAt FROM ai_feedback WHERE article = ?1 AND status = 'unverified' ORDER BY id DESC LIMIT 100").bind(article).all(); return result.results; },
}; }
