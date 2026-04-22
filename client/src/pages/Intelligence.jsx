import React, { useEffect, useState } from 'react';
import { Briefcase, Radio, Search, Send, TrendingUp } from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty, Skeleton, Tabs } from '../components/ui.jsx';
import { timeAgo } from '../lib/format.js';
import OutreachComposer from '../components/OutreachComposer.jsx';

const PRESETS = [
  'streaming engineering',
  'fintech legacy migration',
  'AI developer tools',
  'defense tech',
  'enterprise software'
];

export default function Intelligence() {
  const [tab, setTab] = useState('sector');

  return (
    <div className="space-y-5">
      <div>
        <div className="section-title">Intelligence</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Intelligence Terminal</h1>
        <p className="mt-1 text-sm text-slate-400">Bloomberg-style live market intelligence across engineering news, accounts, M&A, and hiring signals.</p>
      </div>

      <Tabs
        tabs={[
          { key: 'sector', label: 'Sector Feed' },
          { key: 'account', label: 'Account Signals' },
          { key: 'ma', label: 'M&A Radar' },
          { key: 'hiring', label: 'Hiring Signals' }
        ]}
        current={tab}
        onChange={setTab}
      />

      {tab === 'sector' ? <SectorFeed /> : null}
      {tab === 'account' ? <AccountSignals /> : null}
      {tab === 'ma' ? <MARadar /> : null}
      {tab === 'hiring' ? <HiringSignals /> : null}
    </div>
  );
}

function SectorFeed() {
  const [query, setQuery] = useState('Devin coding agent');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function search(q) {
    setLoading(true);
    setResults(null);
    try {
      const r = await api.get(`/news/hn?q=${encodeURIComponent(q)}&limit=30`);
      setResults(r);
    } catch (e) {
      setResults({ hits: [], error: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { search('software engineering AI'); }, []);

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); search(query); }} className="card flex items-center gap-2 p-3">
        <Search size={16} className="text-slate-500" />
        <input className="input terminal" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Query: company / industry / topic…" />
        <button type="submit" className="btn-primary text-xs">Search</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => { setQuery(p); search(p); }} className="pill bg-navy-700 text-slate-200 hover:bg-electric/20 hover:text-electric">{p}</button>
        ))}
      </div>
      <TerminalFeed results={results} loading={loading} title={`HN · ${query}`} />
    </div>
  );
}

function AccountSignals() {
  const [data, setData] = useState(null);
  async function load() {
    try { setData(await api.get('/news/triggers')); }
    catch (e) { setData({ hits: [], error: e.message }); }
  }
  useEffect(() => {
    load();
    const i = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="section-title flex items-center gap-1.5"><Radio size={12} /> Top-20 accounts · Hacker News</div>
        <span className="font-mono text-[10px] text-slate-500">AUTO 10m</span>
      </div>
      {!data ? <Skeleton className="h-64" /> : !data.hits?.length ? <Empty title="No signals" hint="Top-20 accounts are quiet on HN right now." /> : (
        <ul className="card divide-y divide-navy-600">
          {data.hits.map((h, i) => (
            <li key={`${h.id}-${i}`} className="p-3">
              <div className="flex items-start gap-2">
                <span className="pill bg-electric/15 text-electric">{h.account_name}</span>
                <div className="flex-1">
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-sm text-slate-200 hover:text-electric">{h.title}</a>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="source-pill source-pill-accent">{h.source || 'HN'}</span>
                    <span>· {timeAgo(h.created_at)} · {h.points || 0} pts</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MARadar() {
  const [data, setData] = useState(null);
  const [mapping, setMapping] = useState({ open: false, article: null });
  const [accounts, setAccounts] = useState([]);

  async function load() {
    try { setData(await api.get('/news/ma')); } catch (e) { setData({ results: [], error: e.message }); }
  }
  useEffect(() => { load(); api.get('/accounts').then(setAccounts).catch(() => {}); }, []);

  async function mapToAccount(article, accountId) {
    await api.post('/notes', { account_id: accountId, body: `M&A signal: ${article.title}\n${article.url}\nSource: ${article.source}` });
    alert('Mapped to account as a note.');
    setMapping({ open: false, article: null });
  }

  return (
    <div className="space-y-4">
      <div className="section-title">M&A Radar · NewsAPI</div>
      {!data ? <Skeleton className="h-48" /> : (
        <>
          {!data.newsapi_configured ? (
            <div className="card p-3 text-sm text-amber-300">
              <span className="font-mono text-xs">NEWS_API_KEY not set</span> — add it to .env to enable M&A radar. Free tier at newsapi.org.
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.results?.flatMap((r) => (r.articles || []).map((a) => ({ ...a, q: r.query })))
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 30)
              .map((a, i) => (
                <div key={i} className="card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="pill bg-navy-700 text-slate-300">{a.q}</span>
                    <button onClick={() => setMapping({ open: true, article: a })} className="text-[11px] text-electric hover:underline">Map to Account</button>
                  </div>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-sm text-slate-100 hover:text-electric">{a.title}</a>
                  {a.description ? <div className="mt-1 line-clamp-2 text-xs text-slate-400">{a.description}</div> : null}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="source-pill">{a.source || 'NewsAPI'}</span>
                    <span>· {timeAgo(a.created_at)}</span>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {mapping.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setMapping({ open: false, article: null })}>
          <div onClick={(e) => e.stopPropagation()} className="card w-full max-w-md p-4">
            <div className="mb-2 text-sm font-semibold">Map to account</div>
            <div className="mb-3 text-xs text-slate-400 line-clamp-2">{mapping.article?.title}</div>
            <select className="input" onChange={(e) => mapToAccount(mapping.article, Number(e.target.value))}>
              <option value="">— select account —</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HiringSignals() {
  const [data, setData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [composerAccountId, setComposerAccountId] = useState(null);

  useEffect(() => {
    api.get('/news/hiring').then(setData).catch(() => setData({ boards: [] }));
    api.get('/accounts').then(setAccounts).catch(() => setAccounts([]));
  }, []);

  function resolveAccountId(company) {
    if (!company) return null;
    const needle = company.toLowerCase();
    const exact = accounts.find((a) => a.name.toLowerCase() === needle);
    if (exact) return exact.id;
    const loose = accounts.find((a) => a.name.toLowerCase().includes(needle) || needle.includes(a.name.toLowerCase()));
    return loose?.id || null;
  }

  async function openReachOut(company) {
    let id = resolveAccountId(company);
    if (!id) {
      try {
        const created = await api.post('/accounts', {
          name: company, industry: '—', territory: '—', eng_headcount: 0, icp_score: 5,
          pain_point: 'Surfaced via Greenhouse leadership hiring signal.',
          devin_use_case: 'Map pain to Devin use case during first conversation.',
          opening_line: `Saw the leadership hiring signal at ${company} — thought it was worth reaching out.`
        });
        id = created.id;
        const fresh = await api.get('/accounts');
        setAccounts(fresh);
      } catch {
        alert(`Could not find or create account for ${company}`);
        return;
      }
    }
    setComposerAccountId(id);
  }

  const composerAccount = accounts.find((a) => a.id === composerAccountId) || null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="section-title flex items-center gap-1.5"><Briefcase size={12} /> Greenhouse · leadership roles</div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-electric">
          LEADERSHIP & SENIOR ROLES ONLY · buying signal filter active
        </span>
      </div>
      {!data ? <Skeleton className="h-48" /> : !data.boards?.flatMap((b) => b.jobs || []).length ? <Empty title="No leadership hiring signals right now" hint="Filter: VP, CTO, Chief, Director, Head of, Principal, Staff, Engineering Manager, Platform Lead, Architecture." /> : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.boards.flatMap((b) => b.jobs.map((j) => ({ ...j, board: b.board, company: b.company }))).map((j, i) => (
            <div key={i} className="card flex flex-col p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-electric">{j.company || j.board}</div>
                <div className="font-mono text-[10px] text-slate-500">{timeAgo(j.updated_at)}</div>
              </div>
              <a href={j.url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-medium text-white hover:text-electric">{j.title}</a>
              <div className="mt-0.5 text-xs text-slate-400">{j.location || '—'}</div>
              <div className="mt-3 flex-1" />
              <button onClick={() => openReachOut(j.company || j.board)} className="btn-primary mt-2 w-full justify-center text-xs">
                <Send size={12} /> Reach out now →
              </button>
            </div>
          ))}
        </div>
      )}

      {composerAccount ? (
        <OutreachComposer account={composerAccount} contacts={[]} onClose={() => setComposerAccountId(null)} />
      ) : null}
    </div>
  );
}

function TerminalFeed({ results, loading, title }) {
  return (
    <div className="card">
      <div className="border-b border-navy-600 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">{title}</div>
      <div className="max-h-[65vh] overflow-y-auto">
        {loading ? <div className="p-4"><Skeleton className="h-48" /></div>
          : !results?.hits?.length ? <Empty icon={TrendingUp} title="No results" />
          : (
            <ul className="divide-y divide-navy-600">
              {results.hits.map((h) => (
                <li key={h.id} className="terminal flex items-start gap-3 px-4 py-2 text-[13px]">
                  <span className="mt-0.5 w-20 shrink-0 text-slate-500">{new Date(h.created_at).toISOString().slice(11, 19)}Z</span>
                  <div className="flex-1">
                    <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-slate-100 hover:text-electric">{h.title}</a>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="source-pill source-pill-accent">{h.source || 'HN'}</span>
                      <span>· {h.points || 0} pts · {h.num_comments || 0} comments · {timeAgo(h.created_at)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
