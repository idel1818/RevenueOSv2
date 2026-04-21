import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Swords, TrendingDown, TrendingUp } from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty, Skeleton } from '../components/ui.jsx';
import { timeAgo } from '../lib/format.js';

export default function Competition() {
  const [competitors, setCompetitors] = useState(null);
  const [open, setOpen] = useState({});
  const [news, setNews] = useState({});
  const [active, setActive] = useState(null);

  useEffect(() => { api.get('/competitors').then(setCompetitors); }, []);
  useEffect(() => {
    if (!competitors) return;
    competitors.forEach((c) => {
      api.get(`/news/competitor/${encodeURIComponent(c.name)}`)
        .then((r) => setNews((n) => ({ ...n, [c.name]: r })))
        .catch(() => setNews((n) => ({ ...n, [c.name]: { hits: [] } })));
    });
  }, [competitors]);

  return (
    <div className="space-y-5">
      <div>
        <div className="section-title">Competition</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Competitive Intelligence</h1>
        <p className="mt-1 text-sm text-slate-400">Never walk into a meeting blind. Live competitor positioning, battlecards, and news.</p>
      </div>

      {!competitors ? <Skeleton className="h-64" /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {competitors.map((c) => (
            <CompetitorCard key={c.id} c={c} news={news[c.name]} open={open[c.id]} onToggle={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))} onOpen={() => setActive(c)} />
          ))}
        </div>
      )}

      <CompetitorFeed news={news} />

      {active ? <BattlecardModal c={active} onClose={() => setActive(null)} /> : null}
    </div>
  );
}

function CompetitorCard({ c, news, open, onToggle, onOpen }) {
  const winning = c.vs_devin_status === 'winning';
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold text-white">{c.name}</div>
          <div className="mt-0.5 font-mono text-xs text-slate-500">{c.valuation} · {c.arr} ARR</div>
        </div>
        <span className={`pill ${winning ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
          {winning ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {winning ? 'We win' : 'They win'}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{c.differentiator}</p>

      <button onClick={onToggle} className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-white">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Quick battlecard
      </button>
      {open && c.battlecard ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
          {(c.battlecard.objections || []).slice(0, 3).map((o, i) => (
            <li key={i}><span className="text-white">{o.objection}</span> — {o.response}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 border-t border-navy-600 pt-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Recent HN</div>
        {!news ? <Skeleton className="mt-1 h-8 w-full" /> : !news.hits?.length ? (
          <div className="mt-1 text-xs text-slate-500">No recent activity.</div>
        ) : (
          <ul className="mt-1 space-y-1">
            {news.hits.slice(0, 3).map((h) => (
              <li key={h.id}>
                <a href={h.url} target="_blank" rel="noopener noreferrer" className="line-clamp-1 text-xs text-slate-300 hover:text-electric">{h.title}</a>
                <div className="font-mono text-[10px] text-slate-500">{timeAgo(h.created_at)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={onOpen} className="btn-outline mt-3 w-full justify-center text-xs"><Swords size={14} /> Open full battlecard</button>
    </div>
  );
}

function BattlecardModal({ c, onClose }) {
  const b = c.battlecard || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card max-h-[90vh] w-full max-w-4xl overflow-auto p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="section-title">Battlecard</div>
            <h3 className="text-2xl font-semibold tracking-tight text-white">{c.name}</h3>
          </div>
          <button onClick={onClose} className="btn-ghost">Close</button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card p-3">
            <div className="section-title mb-2">Their strengths</div>
            <ul className="list-disc space-y-1 pl-4 text-sm text-slate-300">{(b.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div className="card p-3">
            <div className="section-title mb-2">Their weaknesses</div>
            <ul className="list-disc space-y-1 pl-4 text-sm text-slate-300">{(b.weaknesses || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="section-title">Objections & responses</div>
          {(b.objections || []).map((o, i) => (
            <div key={i} className="card p-3">
              <div className="text-sm font-medium text-white">“{o.objection}”</div>
              <div className="mt-2 text-sm text-slate-300">{o.response}</div>
              {o.proof ? <div className="mt-2 rounded bg-electric/10 p-2 text-xs text-electric">Proof: {o.proof}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompetitorFeed({ news }) {
  const all = Object.entries(news).flatMap(([name, r]) => (r?.hits || []).map((h) => ({ ...h, name })));
  all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return (
    <div className="card p-4">
      <div className="section-title mb-3">Competitor News Feed · 48h</div>
      {!all.length ? <Empty title="No recent competitor news" /> : (
        <ul className="divide-y divide-navy-600">
          {all.slice(0, 20).map((h, i) => (
            <li key={`${h.id}-${i}`} className="py-2">
              <div className="flex items-start gap-2">
                <span className="pill bg-electric/15 text-electric">{h.name}</span>
                <div className="flex-1">
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-200 hover:text-electric">{h.title}</a>
                  <div className="font-mono text-[11px] text-slate-500">{timeAgo(h.created_at)}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
