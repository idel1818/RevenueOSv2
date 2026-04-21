import { Router } from 'express';
import { db, logActivity } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY id DESC').all());
});

router.post('/', (req, res) => {
  const { account_id, name, title, linkedin_url, email, phone, notes } = req.body;
  if (!account_id || !name) return res.status(400).json({ error: 'account_id + name required' });
  const info = db.prepare(`
    INSERT INTO contacts (account_id, name, title, linkedin_url, email, phone, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(account_id, name, title, linkedin_url, email, phone, notes);
  const acct = db.prepare('SELECT name FROM accounts WHERE id = ?').get(account_id);
  logActivity(account_id, 'Contact Added', `${name}${title ? ' (' + title + ')' : ''} at ${acct?.name || 'account'}`);
  res.status(201).json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(info.lastInsertRowid));
});

router.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const fields = ['name', 'title', 'linkedin_url', 'email', 'phone', 'notes', 'last_contacted'];
  const updates = [];
  const params = [];
  for (const f of fields) if (f in req.body) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  if (!updates.length) return res.json(row);
  params.push(req.params.id);
  db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
