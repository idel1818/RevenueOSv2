import { Router } from 'express';
import { db, logActivity } from '../db.js';

const router = Router();

const MODEL = 'claude-sonnet-4-20250514';

async function callClaude({ system, user, maxTokens = 800 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error('ANTHROPIC_API_KEY not set');
    err.status = 503;
    throw err;
  }
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: user }]
  };
  if (system) body.system = system;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Claude API error ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  return json.content?.map((c) => c.text).join('\n').trim() || '';
}

// Extract a "SUBJECT: ..." line (first line of the reply) and strip it
// from the body. Falls back gracefully if the model omits it.
function splitSubjectAndBody(raw) {
  if (!raw) return { subject: '', body: '' };
  const lines = raw.split('\n');
  let subject = '';
  let startIdx = 0;
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const m = lines[i].match(/^\s*SUBJECT\s*:\s*(.+?)\s*$/i);
    if (m) {
      subject = m[1].trim().replace(/^["']|["']$/g, '');
      startIdx = i + 1;
      break;
    }
  }
  const body = lines.slice(startIdx).join('\n').trim();
  return { subject, body };
}

router.post('/compose', async (req, res) => {
  try {
    const { account_id, contact_title } = req.body;
    if (!account_id) return res.status(400).json({ error: 'account_id required' });
    const acct = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id);
    if (!acct) return res.status(404).json({ error: 'Account not found' });

    const title = contact_title || 'VP of Engineering';

    const system = `You are writing cold outreach on behalf of Idel Judanin, senior BD at Cognition — makers of Devin (autonomous AI software engineer) and Windsurf (AI-native IDE). Idel's style: direct, warm, specific, first-person. Never generic. Always leads with a specific insight about the prospect's engineering situation, connects to a concrete Devin use case, includes one real proof point, ends with a low-friction ask. Under 150 words. No subject line.`;

    const user = `Write a cold outreach message for: Company: ${acct.name}. Contact title: ${title}. Primary pain point: ${acct.pain_point}. Devin use case: ${acct.devin_use_case}. Territory: ${acct.territory}. Industry: ${acct.industry}. Engineering headcount: ${acct.eng_headcount}. Available proof points to choose from: Goldman Sachs 3-4x velocity on legacy Java modernisation. Nubank 12x throughput on ETL migration. Linktree shipped 6-month migration in 3 weeks with parallel Devins. Spotify engineers haven't written a line of code since December. All deployments run in customer VPC with full audit logs.

Also return a subject line of under 8 words on the first line prefixed with SUBJECT:`;

    const raw = await callClaude({ system, user, maxTokens: 400 });
    const { subject, body } = splitSubjectAndBody(raw);
    res.json({ subject, message: body, raw, model: MODEL });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.post('/research/:account_id', async (req, res) => {
  try {
    const acct = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.account_id);
    if (!acct) return res.status(404).json({ error: 'Account not found' });

    const user = `You are a GTM research analyst for Cognition (makers of Devin — the autonomous AI software engineer). Produce a ~150-word briefing for a first meeting with a senior engineering leader at ${acct.name}.

Cover:
1. Their likely engineering stack (based on public knowledge / reasonable inference for ${acct.industry} in ${acct.territory}).
2. The most likely Devin use cases for ${acct.name} (migration / security remediation / test coverage / parallel agents — pick the 1-2 that fit best and say why).
3. A concrete, senior-to-senior conversation opener Idel can use on a first call.

Tight, opinionated, no filler, no disclaimers. Use clean markdown with bold section headers.`;

    const analysis = await callClaude({ user, maxTokens: 300 });
    logActivity(acct.id, 'AI Research', `Research brief generated for ${acct.name}`);
    res.json({ analysis, model: MODEL });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.get('/status', (_req, res) => {
  res.json({ configured: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL });
});

export default router;
