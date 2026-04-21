import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const STAGES = ['Uncontacted', 'Researched', 'Reached Out', 'Meeting Booked', 'Active', 'Closed Won'];

router.get('/overview', (_req, res) => {
  const totals = db.prepare('SELECT COUNT(*) as total FROM accounts').get();
  const byHead = db.prepare(`
    SELECT
      SUM(CASE WHEN eng_headcount >= 3000 THEN 1 ELSE 0 END) as enterprise,
      SUM(CASE WHEN eng_headcount >= 500 AND eng_headcount < 3000 THEN 1 ELSE 0 END) as mid_market,
      SUM(CASE WHEN eng_headcount < 500 THEN 1 ELSE 0 END) as smb
    FROM accounts
  `).get();

  const pipelineValueRow = db.prepare("SELECT COALESCE(SUM(deal_value), 0) as total FROM accounts WHERE stage NOT IN ('Closed Won')").get();

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const reachWeek = db.prepare("SELECT COUNT(*) as c FROM outreach WHERE COALESCE(date_sent, created_at) >= ?").get(weekAgo).c;

  const sent = db.prepare("SELECT COUNT(*) as c FROM outreach").get().c;
  const responded = db.prepare("SELECT COUNT(*) as c FROM outreach WHERE status IN ('Responded', 'Meeting Booked')").get().c;
  const responseRate = sent ? (responded / sent) : 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const meetingsMonth = db.prepare("SELECT COUNT(*) as c FROM outreach WHERE status = 'Meeting Booked' AND COALESCE(date_sent, created_at) >= ?").get(monthStart.toISOString()).c;

  const territoryRows = db.prepare("SELECT territory, COUNT(*) as c FROM accounts WHERE territory IS NOT NULL GROUP BY territory").all();
  const byTerritory = { US: 0, UK: 0, DACH: 0, Israel: 0, 'Eastern Europe': 0 };
  for (const r of territoryRows) byTerritory[r.territory] = r.c;

  const stageRows = db.prepare('SELECT stage, COUNT(*) as c FROM accounts GROUP BY stage').all();
  const funnel = STAGES.map((stage) => ({
    stage,
    count: stageRows.find((r) => r.stage === stage)?.c || 0
  }));

  res.json({
    totalAccounts: totals.total,
    enterprise: byHead.enterprise || 0,
    midMarket: byHead.mid_market || 0,
    smb: byHead.smb || 0,
    pipelineValue: pipelineValueRow.total,
    reachWeek,
    totalReachOuts: sent,
    responseRate,
    meetingsMonth,
    byTerritory,
    funnel
  });
});

router.get('/outreach', (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM outreach').get().c;
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const week = db.prepare("SELECT COUNT(*) as c FROM outreach WHERE COALESCE(date_sent, created_at) >= ?").get(weekAgo).c;
  const responded = db.prepare("SELECT COUNT(*) as c FROM outreach WHERE status IN ('Responded', 'Meeting Booked')").get().c;
  const meetings = db.prepare("SELECT COUNT(*) as c FROM outreach WHERE status = 'Meeting Booked'").get().c;
  res.json({
    total,
    week,
    responded,
    responseRate: total ? responded / total : 0,
    meetings,
    meetingConversion: total ? meetings / total : 0
  });
});

export default router;
