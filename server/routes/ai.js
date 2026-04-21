import { Router } from 'express';
import { db, logActivity } from '../db.js';

const router = Router();

const MODEL = 'claude-sonnet-4-20250514';

async function callClaude(prompt, maxTokens = 800) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error('ANTHROPIC_API_KEY not set');
    err.status = 503;
    throw err;
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
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

router.post('/compose', async (req, res) => {
  try {
    const { account_id, contact_title } = req.body;
    if (!account_id) return res.status(400).json({ error: 'account_id required' });
    const acct = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id);
    if (!acct) return res.status(404).json({ error: 'Account not found' });

    const title = contact_title || 'senior engineering leader';
    const prompt = `You are writing a cold outreach message on behalf of Idel Judanin, a senior BD operator at Cognition (makers of Devin AI and Windsurf). Idel's style is direct, warm, credible, and first-person. He never uses generic AI language. He leads with a specific insight about the prospect's engineering situation, connects it to a concrete Devin use case with a real proof point (Nubank 12x, Goldman 3-4x, Linktree parallel repos), and ends with a specific low-friction ask.

Write a cold outreach message for:
- Company: ${acct.name}
- Industry: ${acct.industry}
- Engineering headcount: ${acct.eng_headcount}
- Contact title: ${title}
- Primary pain point: ${acct.pain_point}
- Devin use case: ${acct.devin_use_case}

Keep it under 150 words. No subject line needed. Output only the message body.`;

    const message = await callClaude(prompt, 600);
    res.json({ message, model: MODEL });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.post('/research/:account_id', async (req, res) => {
  try {
    const acct = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.account_id);
    if (!acct) return res.status(404).json({ error: 'Account not found' });

    const prompt = `You are a GTM research analyst for Cognition (makers of Devin AI — an autonomous engineering agent).

Target company: ${acct.name}
Industry: ${acct.industry}
Territory: ${acct.territory}
Engineering headcount (approx): ${acct.eng_headcount}
Current internal hypothesis on pain: ${acct.pain_point}

Produce a tight, opinionated briefing for a first meeting with a senior engineering leader at ${acct.name}. Format as clean markdown with these sections:

## Where ${acct.name} likely hurts
Three specific bets on engineering pain — bounded, concrete, and testable in a 30-min call. No generic AI hype.

## Where Devin lands
Which lane to lead with (migration / security remediation / test coverage / parallel agents) and why, specific to ${acct.name}.

## Proof point to use
One of: Goldman 3-4x velocity on legacy Java; Nubank 12x throughput; Linktree 6-month migration in 3 weeks; Spotify platform engineering. Pick the most relevant and say why.

## Three questions to ask in the first 5 minutes
Tight, senior-to-senior questions that qualify in or out fast.

## Red flags to watch
Things that would kill this deal — political, technical, or commercial.

Be specific. No filler. No disclaimers.`;

    const analysis = await callClaude(prompt, 1200);
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
