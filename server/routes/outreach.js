import { Router } from 'express';
import { db, logActivity } from '../db.js';

const router = Router();

function base() {
  return `
    SELECT o.*, a.name as account_name, a.industry, a.territory, c.name as contact_name, c.title as contact_title
    FROM outreach o
    JOIN accounts a ON a.id = o.account_id
    LEFT JOIN contacts c ON c.id = o.contact_id
  `;
}

router.get('/', (req, res) => {
  const { status, channel, territory, industry, search, since } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('o.status = ?'); params.push(status); }
  if (channel) { where.push('o.channel = ?'); params.push(channel); }
  if (territory) { where.push('a.territory = ?'); params.push(territory); }
  if (industry) { where.push('a.industry = ?'); params.push(industry); }
  if (search) {
    where.push('(a.name LIKE ? OR o.subject LIKE ? OR o.message LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (since) { where.push('COALESCE(o.date_sent, o.created_at) >= ?'); params.push(since); }
  const sql = `${base()} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY COALESCE(o.date_sent, o.created_at) DESC LIMIT 500`;
  res.json(db.prepare(sql).all(...params));
});

router.get('/followups', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const sql = `${base()} WHERE o.status IN ('Sent', 'Opened', 'No Response') AND o.follow_up_date IS NOT NULL AND o.follow_up_date <= ? ORDER BY o.follow_up_date ASC`;
  res.json(db.prepare(sql).all(today));
});

router.post('/', (req, res) => {
  const { account_id, contact_id, channel, date_sent, subject, message, status, response_notes, follow_up_date } = req.body;
  if (!account_id) return res.status(400).json({ error: 'account_id required' });
  const info = db.prepare(`
    INSERT INTO outreach (account_id, contact_id, channel, date_sent, subject, message, status, response_notes, follow_up_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(account_id, contact_id || null, channel || 'Email', date_sent || new Date().toISOString().slice(0, 10), subject, message, status || 'Sent', response_notes, follow_up_date);

  const acct = db.prepare('SELECT name, stage FROM accounts WHERE id = ?').get(account_id);
  logActivity(account_id, 'Reach Out Sent', `${channel || 'Email'} to ${acct?.name}${subject ? ' — ' + subject : ''}`);

  // Auto-advance from Uncontacted -> Reached Out
  if (acct && (acct.stage === 'Uncontacted' || acct.stage === 'Researched')) {
    db.prepare('UPDATE accounts SET stage = ?, updated_at = datetime(\'now\') WHERE id = ?').run('Reached Out', account_id);
    logActivity(account_id, 'Stage Changed', `${acct.name}: ${acct.stage} → Reached Out`);
  }

  if (contact_id) {
    db.prepare("UPDATE contacts SET last_contacted = datetime('now') WHERE id = ?").run(contact_id);
  }

  res.status(201).json(db.prepare(`${base()} WHERE o.id = ?`).get(info.lastInsertRowid));
});

router.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM outreach WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const fields = ['channel', 'date_sent', 'subject', 'message', 'status', 'response_notes', 'follow_up_date', 'contact_id'];
  const updates = [];
  const params = [];
  for (const f of fields) if (f in req.body) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  if (!updates.length) return res.json(row);
  params.push(req.params.id);
  db.prepare(`UPDATE outreach SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  if (req.body.status && req.body.status !== row.status) {
    const acct = db.prepare('SELECT name, stage FROM accounts WHERE id = ?').get(row.account_id);
    if (req.body.status === 'Responded') {
      logActivity(row.account_id, 'Response Received', `${acct?.name} responded to ${row.channel || 'outreach'}`);
    } else if (req.body.status === 'Meeting Booked') {
      logActivity(row.account_id, 'Meeting Booked', `${acct?.name} meeting booked`);
      if (acct && acct.stage !== 'Meeting Booked' && acct.stage !== 'Active' && acct.stage !== 'Closed Won') {
        db.prepare('UPDATE accounts SET stage = ?, updated_at = datetime(\'now\') WHERE id = ?').run('Meeting Booked', row.account_id);
        logActivity(row.account_id, 'Stage Changed', `${acct.name}: ${acct.stage} → Meeting Booked`);
      }
    }
  }

  res.json(db.prepare(`${base()} WHERE o.id = ?`).get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM outreach WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
