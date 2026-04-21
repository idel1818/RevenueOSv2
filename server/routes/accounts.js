import { Router } from 'express';
import { db, logActivity } from '../db.js';

const router = Router();

function parseTags(row) {
  if (!row) return row;
  try {
    row.tags = row.tags ? JSON.parse(row.tags) : [];
  } catch {
    row.tags = [];
  }
  return row;
}

router.get('/', (req, res) => {
  const { search, territory, industry, stage, minIcp, maxIcp, sort } = req.query;
  const where = [];
  const params = [];

  if (search) {
    where.push('(a.name LIKE ? OR a.pain_point LIKE ? OR a.devin_use_case LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (territory) { where.push('a.territory = ?'); params.push(territory); }
  if (industry) { where.push('a.industry = ?'); params.push(industry); }
  if (stage) { where.push('a.stage = ?'); params.push(stage); }
  if (minIcp) { where.push('a.icp_score >= ?'); params.push(Number(minIcp)); }
  if (maxIcp) { where.push('a.icp_score <= ?'); params.push(Number(maxIcp)); }

  const sortMap = {
    'icp_score': 'a.icp_score DESC',
    'name': 'a.name ASC',
    'created_at': 'a.created_at DESC',
    'updated_at': 'a.updated_at DESC'
  };
  const orderBy = sortMap[sort] || 'a.icp_score DESC, a.name ASC';

  const sql = `
    SELECT a.*,
      (SELECT COUNT(*) FROM contacts c WHERE c.account_id = a.id) as contact_count,
      (SELECT COUNT(*) FROM outreach o WHERE o.account_id = a.id) as outreach_count,
      (SELECT MAX(created_at) FROM activities WHERE account_id = a.id) as last_activity,
      (SELECT c.name FROM contacts c WHERE c.account_id = a.id ORDER BY c.id ASC LIMIT 1) as primary_contact
    FROM accounts a
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${orderBy}
  `;
  const rows = db.prepare(sql).all(...params).map(parseTags);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(parseTags(row));
});

router.post('/', (req, res) => {
  const { name, industry, territory, eng_headcount, icp_score, stage, deal_value, pain_point, devin_use_case, opening_line, tags } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const tagsJson = JSON.stringify(tags || []);
  const info = db.prepare(`
    INSERT INTO accounts (name, industry, territory, eng_headcount, icp_score, stage, deal_value, pain_point, devin_use_case, opening_line, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, industry, territory, eng_headcount || 0, icp_score || 5, stage || 'Uncontacted', deal_value || 0, pain_point, devin_use_case, opening_line, tagsJson);
  logActivity(info.lastInsertRowid, 'Account Added', `${name} added to pipeline`);
  const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(parseTags(row));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const fields = ['name', 'industry', 'territory', 'eng_headcount', 'icp_score', 'stage', 'deal_value', 'pain_point', 'devin_use_case', 'opening_line'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (f in req.body) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }
  if ('tags' in req.body) {
    updates.push('tags = ?');
    params.push(JSON.stringify(req.body.tags || []));
  }
  if (!updates.length) return res.json(existing);
  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);
  db.prepare(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  if (req.body.stage && req.body.stage !== existing.stage) {
    logActivity(req.params.id, 'Stage Changed', `${existing.name}: ${existing.stage} → ${req.body.stage}`);
  }

  const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  res.json(parseTags(row));
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/bulk/stage', (req, res) => {
  const { ids, stage } = req.body;
  if (!Array.isArray(ids) || !stage) return res.status(400).json({ error: 'ids[] and stage required' });
  const upd = db.prepare('UPDATE accounts SET stage = ?, updated_at = datetime(\'now\') WHERE id = ?');
  const tx = db.transaction((list) => {
    for (const id of list) {
      const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
      if (existing) {
        upd.run(stage, id);
        logActivity(id, 'Stage Changed', `${existing.name}: ${existing.stage} → ${stage}`);
      }
    }
  });
  tx(ids);
  res.json({ ok: true, count: ids.length });
});

// Account-scoped sub-resource reads
router.get('/:id/contacts', (req, res) => {
  const rows = db.prepare('SELECT * FROM contacts WHERE account_id = ? ORDER BY id DESC').all(req.params.id);
  res.json(rows);
});
router.get('/:id/outreach', (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, c.name as contact_name
    FROM outreach o
    LEFT JOIN contacts c ON c.id = o.contact_id
    WHERE o.account_id = ?
    ORDER BY COALESCE(o.date_sent, o.created_at) DESC
  `).all(req.params.id);
  res.json(rows);
});
router.get('/:id/activities', (req, res) => {
  const rows = db.prepare('SELECT * FROM activities WHERE account_id = ? ORDER BY id DESC').all(req.params.id);
  res.json(rows);
});
router.get('/:id/notes', (req, res) => {
  const rows = db.prepare('SELECT * FROM notes WHERE account_id = ? ORDER BY id DESC').all(req.params.id);
  res.json(rows);
});

router.get('/export.csv', (_req, res) => {
  const rows = db.prepare('SELECT * FROM accounts ORDER BY icp_score DESC, name ASC').all();
  const header = ['id', 'name', 'industry', 'territory', 'eng_headcount', 'icp_score', 'stage', 'deal_value', 'pain_point', 'devin_use_case', 'opening_line'];
  const csv = [header.join(',')];
  for (const r of rows) {
    csv.push(header.map((h) => {
      const v = r[h] ?? '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(','));
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="accounts.csv"');
  res.send(csv.join('\n'));
});

export default router;
