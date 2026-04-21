import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

function parse(row) {
  if (!row) return row;
  try { row.battlecard = row.battlecard_json ? JSON.parse(row.battlecard_json) : null; }
  catch { row.battlecard = null; }
  delete row.battlecard_json;
  return row;
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM competitors ORDER BY name ASC').all().map(parse);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(parse(row));
});

router.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const fields = ['valuation', 'arr', 'differentiator', 'vs_devin_status'];
  const updates = [];
  const params = [];
  for (const f of fields) if (f in req.body) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  if ('battlecard' in req.body) {
    updates.push('battlecard_json = ?');
    params.push(JSON.stringify(req.body.battlecard));
  }
  if (!updates.length) return res.json(parse(row));
  params.push(req.params.id);
  db.prepare(`UPDATE competitors SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM competitors WHERE id = ?').get(req.params.id);
  res.json(parse(updated));
});

export default router;
