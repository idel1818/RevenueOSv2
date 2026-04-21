import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const cache = new Map();
function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value);
  return Promise.resolve(fn()).then((value) => {
    cache.set(key, { at: Date.now(), value });
    return value;
  });
}

async function hnSearch(query, hitsPerPage = 20) {
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${hitsPerPage}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HN ${res.status}`);
  const json = await res.json();
  return (json.hits || []).map((h) => ({
    id: h.objectID,
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    source: 'Hacker News',
    author: h.author,
    points: h.points,
    num_comments: h.num_comments,
    created_at: h.created_at,
    query
  }));
}

async function newsApi(query, pageSize = 20) {
  const key = process.env.NEWS_API_KEY;
  if (!key) return { disabled: true, articles: [] };
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=${pageSize}`;
  const res = await fetch(url, { headers: { 'X-Api-Key': key } });
  if (!res.ok) {
    const text = await res.text();
    return { error: `NewsAPI ${res.status}: ${text}`, articles: [] };
  }
  const json = await res.json();
  return {
    articles: (json.articles || []).map((a) => ({
      title: a.title,
      url: a.url,
      source: a.source?.name || 'NewsAPI',
      author: a.author,
      description: a.description,
      created_at: a.publishedAt
    }))
  };
}

router.get('/hn', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.status(400).json({ error: 'q required' });
    const hits = await cached(`hn:${query}`, 5 * 60 * 1000, () => hnSearch(query, Number(req.query.limit) || 20));
    res.json({ query, hits });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/triggers', async (_req, res) => {
  try {
    const accounts = db.prepare('SELECT id, name FROM accounts ORDER BY icp_score DESC LIMIT 20').all();
    const all = [];
    await Promise.all(accounts.map(async (a) => {
      try {
        const hits = await cached(`hn:${a.name}`, 5 * 60 * 1000, () => hnSearch(a.name, 3));
        for (const h of hits) {
          all.push({ account_id: a.id, account_name: a.name, ...h });
        }
      } catch { /* noop */ }
    }));
    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ hits: all.slice(0, 40) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/ma', async (_req, res) => {
  try {
    const queries = ['streaming merger', 'studio acquisition', 'tech acquisition engineering', 'private equity software'];
    const results = await Promise.all(queries.map(async (q) => {
      const na = await cached(`na:${q}`, 15 * 60 * 1000, () => newsApi(q, 10));
      return { query: q, ...na };
    }));
    res.json({ results, newsapi_configured: Boolean(process.env.NEWS_API_KEY) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/hiring', async (_req, res) => {
  // Greenhouse public boards don't expose a search endpoint — we query a small set of known boards.
  const boards = ['stripe', 'airbnb', 'netflix', 'spotifyjobs', 'palantirtechnologies', 'coinbase', 'figma', 'databricks'];
  const results = [];
  await Promise.all(boards.map(async (b) => {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${b}/jobs?content=true`;
      const r = await cached(`gh:${b}`, 30 * 60 * 1000, async () => {
        const res = await fetch(url);
        if (!res.ok) return { jobs: [] };
        return res.json();
      });
      const jobs = (r.jobs || []).filter((j) => /\b(vp|head|director|chief|staff|principal|platform|engineering manager)\b/i.test(j.title)).slice(0, 6);
      results.push({ board: b, jobs: jobs.map((j) => ({ title: j.title, location: j.location?.name, url: j.absolute_url, updated_at: j.updated_at })) });
    } catch { /* noop */ }
  }));
  res.json({ boards: results });
});

router.get('/competitor/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const hits = await cached(`hn:${name}`, 10 * 60 * 1000, () => hnSearch(name, 8));
    res.json({ name, hits });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
