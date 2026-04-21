import { Router } from 'express';
import { db, logActivity } from '../db.js';

const router = Router();

router.post('/', (req, res) => {
  const { account_id, body } = req.body;
  if (!account_id || !body) return res.status(400).json({ error: 'account_id + body required' });
  const info = db.prepare('INSERT INTO notes (account_id, body) VALUES (?, ?)').run(account_id, body);
  const acct = db.prepare('SELECT name FROM accounts WHERE id = ?').get(account_id);
  logActivity(account_id, 'Note Added', `Note added to ${acct?.name || 'account'}`);
  res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
