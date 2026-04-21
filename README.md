# Cognition Revenue OS

Internal GTM intelligence + CRM for Cognition's enterprise sales team — purpose-built for selling Devin and Windsurf to engineering leaders at large companies.

> Bloomberg Terminal meets Salesforce, built for a scrappy but sophisticated sales team.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3) — file-based, persistent
- **AI:** Anthropic Claude (`claude-sonnet-4-20250514`) for outreach composer + account research
- **Live data:** Hacker News Algolia (no key), NewsAPI (free tier), Greenhouse

## Setup

```bash
npm install
cp .env.example .env   # (optional) add ANTHROPIC_API_KEY + NEWS_API_KEY
npm run dev
```

The app runs without API keys — AI-dependent features show clear empty states until keys are provided.

- Backend: `http://localhost:3000`
- Frontend (dev): `http://localhost:5173` (proxies `/api` to backend)

### Production

```bash
npm run build
npm start
```

Express serves the built client on port `3000`.

## Project layout

```
server/            Express API + SQLite + seed data
client/            React app (Vite + Tailwind)
data/cognition.db  SQLite database (auto-created, gitignored)
```

## Sections

1. **Command** — operational dashboard with live metrics, pipeline funnel, activity feed, and trigger alerts
2. **Accounts** — full account database with filtering, detail panel, contacts, outreach history, AI research
3. **Outreach** — lightweight CRM with log table, AI composer, follow-up tracker, kanban view
4. **Intelligence** — Bloomberg-style terminal with sector feed, account signals, M&A radar, hiring signals
5. **Competition** — live competitor battlecards + news
6. **Sales Kit** — selling points, ROI calculator, objection handler, proof stories, email templates

## Pre-seeded accounts

On first launch the database is seeded with ~65 real accounts across Entertainment, Financial Services, DACH Enterprise, Israeli Tech, and US Enterprise — each with industry-specific pain points and mapped Devin use cases.
