import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 200);
  const rows = db.prepare(`
    SELECT act.*, a.name as account_name
    FROM activities act
    LEFT JOIN accounts a ON a.id = act.account_id
    ORDER BY act.id DESC
    LIMIT ?
  `).all(limit);
  res.json(rows);
});

export default router;
