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

// Wrap a search term in quotes for Algolia exact-phrase matching.
// If the string already contains a quoted phrase, pass it through.
function quoteForExact(q) {
  const trimmed = String(q || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed;
  return `"${trimmed}"`;
}

// After HN returns hits, drop any where the company name string is not
// literally present in title or URL (case-insensitive). Prevents "SAP"
// matching Apple/SpaceX etc.
function filterByNameMatch(hits, name) {
  if (!name) return hits;
  const needle = name.toLowerCase();
  return hits.filter((h) => {
    const hay = `${h.title || ''} ${h.url || ''}`.toLowerCase();
    return hay.includes(needle);
  });
}

async function hnSearchRaw(query, hitsPerPage = 20) {
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

// Exact-phrase HN search for a company name + strict post-filter.
async function hnSearchCompany(name, hitsPerPage = 20) {
  const q = quoteForExact(name);
  const hits = await hnSearchRaw(q, hitsPerPage);
  return filterByNameMatch(hits, name);
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

// Generic sector-feed / free-text HN search — preserves raw query (no forced quoting).
// Callers can pass their own quoted phrases if they want exact match.
router.get('/hn', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.status(400).json({ error: 'q required' });
    const exact = String(req.query.exact || '') === '1';
    const limit = Number(req.query.limit) || 20;
    const searchQ = exact ? quoteForExact(query) : query;
    let hits = await cached(`hn:${searchQ}`, 5 * 60 * 1000, () => hnSearchRaw(searchQ, limit));
    if (exact) hits = filterByNameMatch(hits, query);
    res.json({ query, hits, refreshed_at: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Account-level trigger feed — always exact-phrase + strict post-filter.
router.get('/triggers', async (_req, res) => {
  try {
    const accounts = db.prepare('SELECT id, name FROM accounts ORDER BY icp_score DESC LIMIT 20').all();
    const all = [];
    await Promise.all(accounts.map(async (a) => {
      try {
        const hits = await cached(`hn:exact:${a.name}`, 5 * 60 * 1000, () => hnSearchCompany(a.name, 6));
        for (const h of hits) {
          all.push({ account_id: a.id, account_name: a.name, ...h });
        }
      } catch { /* noop */ }
    }));
    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ hits: all.slice(0, 40), refreshed_at: new Date().toISOString() });
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

// Hiring signals — Greenhouse boards filtered to leadership-only titles.
const LEADERSHIP_RE = /\b(vp|cto|chief|director|head of|principal|staff|engineering manager|platform lead|architect|architecture)\b/i;

// Map of public Greenhouse boards to a canonical account name so we can
// pre-populate the reach-out modal cleanly.
const GREENHOUSE_BOARDS = [
  { slug: 'stripe',               company: 'Stripe' },
  { slug: 'airbnb',               company: 'Airbnb' },
  { slug: 'netflix',              company: 'Netflix' },
  { slug: 'spotifyjobs',          company: 'Spotify' },
  { slug: 'palantirtechnologies', company: 'Palantir' },
  { slug: 'coinbase',             company: 'Coinbase' },
  { slug: 'figma',                company: 'Figma' },
  { slug: 'databricks',           company: 'Databricks' }
];

router.get('/hiring', async (_req, res) => {
  const results = [];
  await Promise.all(GREENHOUSE_BOARDS.map(async ({ slug, company }) => {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`;
      const r = await cached(`gh:${slug}`, 30 * 60 * 1000, async () => {
        const res = await fetch(url);
        if (!res.ok) return { jobs: [] };
        return res.json();
      });
      const jobs = (r.jobs || []).filter((j) => LEADERSHIP_RE.test(j.title || '')).slice(0, 6);
      results.push({
        board: slug,
        company,
        jobs: jobs.map((j) => ({
          title: j.title,
          location: j.location?.name,
          url: j.absolute_url,
          updated_at: j.updated_at
        }))
      });
    } catch { /* noop */ }
  }));
  res.json({ boards: results, filter: 'leadership', refreshed_at: new Date().toISOString() });
});

router.get('/competitor/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const hits = await cached(`hn:exact:${name}`, 10 * 60 * 1000, () => hnSearchCompany(name, 8));
    res.json({ name, hits });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
