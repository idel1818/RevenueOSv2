import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Save, Swords, TrendingDown, TrendingUp, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty, Skeleton } from '../components/ui.jsx';
import { timeAgo } from '../lib/format.js';

export default function Competition() {
  const [competitors, setCompetitors] = useState(null);
  const [open, setOpen] = useState({});
  const [news, setNews] = useState({});
  const [active, setActive] = useState(null);

  function refresh() { api.get('/competitors').then(setCompetitors); }
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!competitors) return;
    competitors.forEach((c) => {
      api.get(`/news/competitor/${encodeURIComponent(c.name)}`)
        .then((r) => setNews((n) => ({ ...n, [c.name]: r })))
        .catch(() => setNews((n) => ({ ...n, [c.name]: { hits: [] } })));
    });
  }, [competitors]);

  function applyUpdate(updated) {
    setCompetitors((list) => (list || []).map((c) => (c.id === updated.id ? updated : c)));
    if (active?.id === updated.id) setActive(updated);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="section-title">Competition</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Competitive Intelligence</h1>
        <p className="mt-1 text-sm text-slate-400">Never walk into a meeting blind. Live positioning, battlecards, and HN news feed.</p>
      </div>

      {!competitors ? <Skeleton className="h-64" /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {competitors.map((c) => (
            <CompetitorCard
              key={c.id}
              c={c}
              news={news[c.name]}
              open={open[c.id]}
              onToggle={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}
              onOpen={() => setActive(c)}
              onUpdate={applyUpdate}
            />
          ))}
        </div>
      )}

      <CompetitorFeed news={news} />

      {active ? <BattlecardModal c={active} onClose={() => setActive(null)} onUpdate={applyUpdate} /> : null}
    </div>
  );
}

function badgeColor(badge = '', status) {
  const low = (badge || '').toLowerCase();
  if (low.startsWith('we win')) return 'bg-emerald-900/60 text-emerald-300';
  if (low.startsWith('they win')) return 'bg-amber-900/60 text-amber-300';
  if (low.startsWith('losing')) return 'bg-red-900/60 text-red-300';
  return status === 'winning' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300';
}

function CompetitorCard({ c, news, open, onToggle, onOpen, onUpdate }) {
  const b = c.battlecard || {};
  const badge = b.badge || (c.vs_devin_status === 'winning' ? 'We win' : 'They win');
  const winning = /we win/i.test(badge);
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-semibold text-white">{c.name}</div>
          <div className="mt-0.5 font-mono text-xs text-slate-500">{c.valuation} · {c.arr} ARR</div>
        </div>
        <span className={`pill ${badgeColor(badge, c.vs_devin_status)}`}>
          {winning ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {badge}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{c.differentiator}</p>
      {b.recent ? <p className="mt-2 text-xs font-medium text-amber-300">{b.recent}</p> : null}

      <button onClick={onToggle} className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-white">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Quick battlecard
      </button>
      {open ? (
        <div className="mt-2 space-y-2 rounded-md border border-navy-600 bg-navy-700/40 p-3 text-xs">
          {b.strength ? <div><span className="font-mono uppercase text-emerald-300">Strength · </span><span className="text-slate-200">{b.strength}</span></div> : null}
          {b.weakness ? <div><span className="font-mono uppercase text-red-300">Weakness · </span><span className="text-slate-200">{b.weakness}</span></div> : null}
          {b.one_liner ? <div><span className="font-mono uppercase text-electric">Say this · </span><span className="italic text-slate-100">“{b.one_liner}”</span></div> : null}
          {!(b.strength || b.weakness || b.one_liner) ? (
            <ul className="list-disc space-y-1 pl-4 text-slate-300">
              {(b.objections || []).slice(0, 3).map((o, i) => <li key={i}><span className="text-white">{o.objection}</span> — {o.response}</li>)}
            </ul>
          ) : null}
        </div>
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

function BattlecardModal({ c, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => initForm(c));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  function reset() { setForm(initForm(c)); setEditing(false); setErr(null); }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const updated = await api.patch(`/competitors/${c.id}`, {
        valuation: form.valuation,
        arr: form.arr,
        differentiator: form.differentiator,
        battlecard: {
          ...(c.battlecard || {}),
          badge: form.badge,
          strength: form.strength,
          weakness: form.weakness,
          one_liner: form.one_liner,
          recent: form.recent,
          strengths: c.battlecard?.strengths || [],
          weaknesses: c.battlecard?.weaknesses || [],
          objections: c.battlecard?.objections || []
        }
      });
      onUpdate(updated);
      setEditing(false);
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const b = c.battlecard || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card max-h-[90vh] w-full max-w-4xl overflow-auto p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="section-title">Battlecard</div>
            <h3 className="text-2xl font-semibold tracking-tight text-white">{c.name}</h3>
            <div className="mt-1 font-mono text-xs text-slate-400">{c.valuation} · {c.arr} ARR</div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-outline"><Edit3 size={14} /> Edit</button>
            ) : (
              <>
                <button onClick={reset} className="btn-ghost"><X size={14} /> Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary"><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
              </>
            )}
            <button onClick={onClose} className="btn-ghost">Close</button>
          </div>
        </div>

        {err ? <div className="mt-3 rounded-md border border-red-900 bg-red-900/20 px-3 py-2 text-sm text-red-200">{err}</div> : null}

        {editing ? (
          <div className="mt-4 space-y-3">
            <Row label="Valuation" value={form.valuation} onChange={(v) => setForm({ ...form, valuation: v })} />
            <Row label="ARR" value={form.arr} onChange={(v) => setForm({ ...form, arr: v })} />
            <Row label="Differentiator" value={form.differentiator} onChange={(v) => setForm({ ...form, differentiator: v })} multiline />
            <Row label="Badge" value={form.badge} onChange={(v) => setForm({ ...form, badge: v })} />
            <Row label="Recent news (one line)" value={form.recent} onChange={(v) => setForm({ ...form, recent: v })} />
            <Row label="Key strength" value={form.strength} onChange={(v) => setForm({ ...form, strength: v })} multiline />
            <Row label="Fatal weakness vs Devin" value={form.weakness} onChange={(v) => setForm({ ...form, weakness: v })} multiline />
            <Row label="One-sentence response when prospect raises them" value={form.one_liner} onChange={(v) => setForm({ ...form, one_liner: v })} multiline />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {b.recent ? <div className="rounded-md border border-amber-900/60 bg-amber-900/10 p-3 text-sm text-amber-200">{b.recent}</div> : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SlotCard title="Their key strength" value={b.strength} tone="emerald" />
              <SlotCard title="Their fatal weakness vs Devin" value={b.weakness} tone="red" />
              <SlotCard title="Say this when they bring them up" value={b.one_liner} tone="electric" italic />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="card p-3">
                <div className="section-title mb-2">Their strengths</div>
                <ul className="list-disc space-y-1 pl-4 text-sm text-slate-300">{(b.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div className="card p-3">
                <div className="section-title mb-2">Their weaknesses</div>
                <ul className="list-disc space-y-1 pl-4 text-sm text-slate-300">{(b.weaknesses || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            </div>
            <div className="mt-1 space-y-3">
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
        )}
      </div>
    </div>
  );
}

function SlotCard({ title, value, tone, italic }) {
  const toneMap = {
    emerald: 'border-emerald-900/60 text-emerald-300',
    red: 'border-red-900/60 text-red-300',
    electric: 'border-electric/60 text-electric'
  };
  return (
    <div className={`card border ${toneMap[tone] || ''} p-3`}>
      <div className="section-title mb-1">{title}</div>
      {value ? (
        <div className={`text-sm text-slate-100 ${italic ? 'italic' : ''}`}>{italic ? `“${value}”` : value}</div>
      ) : (
        <div className="text-xs text-slate-500">Not set — click Edit to fill this in.</div>
      )}
    </div>
  );
}

function Row({ label, value, onChange, multiline }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">{label}</div>
      {multiline ? (
        <textarea rows={2} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function initForm(c) {
  const b = c.battlecard || {};
  return {
    valuation: c.valuation || '',
    arr: c.arr || '',
    differentiator: c.differentiator || '',
    badge: b.badge || '',
    recent: b.recent || '',
    strength: b.strength || '',
    weakness: b.weakness || '',
    one_liner: b.one_liner || ''
  };
}

function CompetitorFeed({ news }) {
  const all = useMemo(() => {
    const items = Object.entries(news).flatMap(([name, r]) => (r?.hits || []).map((h) => ({ ...h, name })));
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return items;
  }, [news]);
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
