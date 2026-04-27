import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const MODEL = 'claude-sonnet-4-20250514';

function attachSpeakers(conf) {
  if (!conf) return conf;
  const speakers = db.prepare(
    'SELECT * FROM conference_speakers WHERE conference_id = ? ORDER BY is_competitor DESC, is_target_account DESC, id ASC'
  ).all(conf.id);
  return { ...conf, speakers };
}

function attachAllSpeakers(list) {
  if (!list.length) return list;
  const ids = list.map((c) => c.id);
  const placeholders = ids.map(() => '?').join(',');
  const speakers = db.prepare(
    `SELECT * FROM conference_speakers WHERE conference_id IN (${placeholders}) ORDER BY id ASC`
  ).all(...ids);
  const byConf = new Map();
  for (const s of speakers) {
    if (!byConf.has(s.conference_id)) byConf.set(s.conference_id, []);
    byConf.get(s.conference_id).push(s);
  }
  return list.map((c) => ({ ...c, speakers: byConf.get(c.id) || [] }));
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM conferences ORDER BY dates ASC').all();
  res.json(attachAllSpeakers(rows));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM conferences WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(attachSpeakers(row));
});

router.post('/', (req, res) => {
  const {
    name, dates, location, city, country, vertical,
    attendees, website, description, relevance_score
  } = req.body;
  if (!name || !dates) return res.status(400).json({ error: 'name and dates required' });
  const info = db.prepare(`
    INSERT INTO conferences (name, dates, location, city, country, vertical, attendees, website, description, relevance_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, dates, location || null, city || null, country || null,
    vertical || null, Number(attendees) || 0, website || null,
    description || null, Number(relevance_score) || 5
  );
  const row = db.prepare('SELECT * FROM conferences WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(attachSpeakers(row));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM conferences WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const fields = [
    'name', 'dates', 'location', 'city', 'country', 'vertical',
    'attendees', 'website', 'description', 'relevance_score',
    'attending_status', 'notes'
  ];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (f in req.body) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }
  if (!updates.length) return res.json(attachSpeakers(existing));
  params.push(req.params.id);
  db.prepare(`UPDATE conferences SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const row = db.prepare('SELECT * FROM conferences WHERE id = ?').get(req.params.id);
  res.json(attachSpeakers(row));
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM conferences WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM conference_speakers WHERE conference_id = ?').run(req.params.id);
  db.prepare('DELETE FROM conferences WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/speakers', (req, res) => {
  const conf = db.prepare('SELECT * FROM conferences WHERE id = ?').get(req.params.id);
  if (!conf) return res.status(404).json({ error: 'Conference not found' });
  const {
    name, title, company, company_type, topic,
    session_date, linkedin_url, is_competitor, is_target_account, notes
  } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const info = db.prepare(`
    INSERT INTO conference_speakers (conference_id, name, title, company, company_type, topic, session_date, linkedin_url, is_competitor, is_target_account, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    conf.id, name, title || null, company || null, company_type || null,
    topic || null, session_date || null, linkedin_url || null,
    is_competitor ? 1 : 0, is_target_account ? 1 : 0, notes || null
  );
  const row = db.prepare('SELECT * FROM conference_speakers WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id/speakers/:speakerId', (req, res) => {
  const speaker = db.prepare('SELECT * FROM conference_speakers WHERE id = ? AND conference_id = ?').get(req.params.speakerId, req.params.id);
  if (!speaker) return res.status(404).json({ error: 'Speaker not found' });
  const fields = ['name', 'title', 'company', 'company_type', 'topic', 'session_date', 'linkedin_url', 'is_competitor', 'is_target_account', 'notes'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (f in req.body) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }
  if (!updates.length) return res.json(speaker);
  params.push(req.params.speakerId);
  db.prepare(`UPDATE conference_speakers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const row = db.prepare('SELECT * FROM conference_speakers WHERE id = ?').get(req.params.speakerId);
  res.json(row);
});

router.delete('/:id/speakers/:speakerId', (req, res) => {
  const row = db.prepare('SELECT * FROM conference_speakers WHERE id = ? AND conference_id = ?').get(req.params.speakerId, req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM conference_speakers WHERE id = ?').run(req.params.speakerId);
  res.json({ ok: true });
});

router.post('/:id/discover-speakers', async (req, res) => {
  const conf = db.prepare('SELECT * FROM conferences WHERE id = ?').get(req.params.id);
  if (!conf) return res.status(404).json({ error: 'Conference not found' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'ANTHROPIC_API_KEY not set' });

  const year = (conf.dates || '').slice(0, 4) || new Date().getFullYear();
  const prompt = `List 5 likely speakers at ${conf.name} in ${year} based on the conference topic ${conf.vertical || 'tech'}. For each: name, title, company, likely session topic. Flag if any work at: Cursor, GitHub, OpenAI, Google DeepMind, Anthropic, Factory, Augment Code, Replit. Format as JSON array with fields: name, title, company, topic, is_competitor (0 or 1). Output only the JSON array, no commentary.`;

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!aiRes.ok) {
      const text = await aiRes.text();
      return res.status(aiRes.status).json({ error: `Claude API error: ${text}` });
    }
    const json = await aiRes.json();
    const raw = json.content?.map((c) => c.text).join('\n').trim() || '';
    const match = raw.match(/\[[\s\S]*\]/);
    let parsed = [];
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { parsed = []; }
    }
    res.json({ suggestions: parsed, raw, model: MODEL });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
