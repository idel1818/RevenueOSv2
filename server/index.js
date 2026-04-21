import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { db } from './db.js';
import './seed.js';
import accountsRouter from './routes/accounts.js';
import contactsRouter from './routes/contacts.js';
import outreachRouter from './routes/outreach.js';
import activitiesRouter from './routes/activities.js';
import notesRouter from './routes/notes.js';
import competitorsRouter from './routes/competitors.js';
import statsRouter from './routes/stats.js';
import aiRouter from './routes/ai.js';
import newsRouter from './routes/news.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    accounts: db.prepare('SELECT COUNT(*) as c FROM accounts').get().c,
    anthropic_configured: Boolean(process.env.ANTHROPIC_API_KEY),
    newsapi_configured: Boolean(process.env.NEWS_API_KEY),
    time: new Date().toISOString()
  });
});

app.use('/api/accounts', accountsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/outreach', outreachRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/notes', notesRouter);
app.use('/api/competitors', competitorsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/news', newsRouter);

// Serve built client in production
const distPath = resolve(ROOT, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(resolve(distPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error('[api error]', err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

app.listen(PORT, () => {
  console.log(`[server] Cognition Revenue OS API on http://localhost:${PORT}`);
});
