import React, { useEffect, useState } from 'react';
import { Kanban, LayoutList, Plus } from 'lucide-react';
import { api, qs } from '../lib/api.js';
import { STATUSES, STATUS_COLORS, formatPct, timeAgo } from '../lib/format.js';
import { Empty, Skeleton } from '../components/ui.jsx';
import OutreachComposer from '../components/OutreachComposer.jsx';

export default function Outreach() {
  const [rows, setRows] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ status: '', channel: '', territory: '', industry: '', search: '' });
  const [view, setView] = useState('table');
  const [show, setShow] = useState(false);
  const [followups, setFollowups] = useState([]);
  const [tab, setTab] = useState('log');

  async function load() {
    const [r, s, f] = await Promise.all([
      api.get(`/outreach${qs(filter)}`),
      api.get('/stats/outreach'),
      api.get('/outreach/followups')
    ]);
    setRows(r); setStats(s); setFollowups(f);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter.status, filter.channel, filter.territory, filter.industry, filter.search]);

  async function updateStatus(id, status) {
    await api.patch(`/outreach/${id}`, { status });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-title">Outreach</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Outreach Management</h1>
          <p className="mt-1 text-sm text-slate-400">Every reach out, every response, every follow-up due today.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="card flex overflow-hidden">
            <button onClick={() => setView('table')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${view === 'table' ? 'bg-electric/15 text-electric' : 'text-slate-300'}`}><LayoutList size={14} /> Table</button>
            <button onClick={() => setView('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${view === 'kanban' ? 'bg-electric/15 text-electric' : 'text-slate-300'}`}><Kanban size={14} /> Kanban</button>
          </div>
          <button onClick={() => setShow(true)} className="btn-primary text-sm"><Plus size={14} /> Log reach out</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {!stats ? [...Array(5)].map((_, i) => <div key={i} className="card p-4"><Skeleton className="h-4 w-20" /><Skeleton className="mt-3 h-6 w-16" /></div>) : (
          <>
            <StatCell label="Total sent" value={stats.total} />
            <StatCell label="This week" value={stats.week} />
            <StatCell label="Response rate" value={formatPct(stats.responseRate)} />
            <StatCell label="Responded" value={stats.responded} />
            <StatCell label="Meeting conversion" value={formatPct(stats.meetingConversion)} />
          </>
        )}
      </div>

      <div className="flex border-b border-navy-600">
        <button onClick={() => setTab('log')} className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === 'log' ? 'border-electric text-white' : 'border-transparent text-slate-400'}`}>Outreach Log</button>
        <button onClick={() => setTab('followups')} className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === 'followups' ? 'border-electric text-white' : 'border-transparent text-slate-400'}`}>
          Follow-ups due <span className="ml-1 text-[11px] text-electric">({followups.length})</span>
        </button>
      </div>

      {tab === 'log' ? (
        <>
          <div className="card flex flex-wrap gap-2 p-3">
            <input placeholder="Search account, subject, body…" className="input max-w-sm" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
            <select className="input w-36" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="input w-36" value={filter.channel} onChange={(e) => setFilter({ ...filter, channel: e.target.value })}>
              <option value="">All channels</option>
              {['Email', 'LinkedIn', 'Phone', 'Event', 'Referral', 'Other'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="input w-36" value={filter.territory} onChange={(e) => setFilter({ ...filter, territory: e.target.value })}>
              <option value="">All territories</option>
              {['US', 'UK', 'DACH', 'Israel', 'Eastern Europe'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {view === 'table' ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-navy-600 bg-navy-800 text-left text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Company</th>
                      <th className="px-3 py-2.5">Contact</th>
                      <th className="px-3 py-2.5">Channel</th>
                      <th className="px-3 py-2.5">Subject / Opening</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Follow-up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!rows ? [...Array(6)].map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-3 py-2.5"><Skeleton className="h-4 w-full" /></td></tr>
                    )) : !rows.length ? (
                      <tr><td colSpan={7}><Empty title="No reach outs yet" hint="Log your first reach out to get the engine running." /></td></tr>
                    ) : rows.map((o) => (
                      <tr key={o.id} className="border-b border-navy-700 hover:bg-navy-700/40">
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">{o.date_sent || '—'}</td>
                        <td className="px-3 py-2.5 font-medium text-white">{o.account_name}</td>
                        <td className="px-3 py-2.5 text-slate-300">{o.contact_name || '—'}</td>
                        <td className="px-3 py-2.5 text-slate-300">{o.channel}</td>
                        <td className="px-3 py-2.5 text-slate-300"><div className="line-clamp-1 max-w-sm">{o.subject || o.message?.slice(0, 80) || '—'}</div></td>
                        <td className="px-3 py-2.5">
                          <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className={`pill cursor-pointer border-0 ${STATUS_COLORS[o.status]}`}>
                            {STATUSES.map((s) => <option key={s} value={s} className="bg-navy-800 text-white">{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">{o.follow_up_date || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Kanbanboard rows={rows} onUpdate={updateStatus} />
          )}
        </>
      ) : (
        <div className="card overflow-hidden">
          {!followups.length ? <Empty title="No follow-ups due" hint="Nice — you're caught up." /> : (
            <table className="min-w-full text-sm">
              <thead className="border-b border-navy-600 bg-navy-800 text-left text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2.5">Due</th>
                  <th className="px-3 py-2.5">Company</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {followups.map((o) => (
                  <tr key={o.id} className="border-b border-navy-700">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-amber-300">{o.follow_up_date}</td>
                    <td className="px-3 py-2.5 font-medium text-white">{o.account_name}</td>
                    <td className="px-3 py-2.5 text-slate-300">{o.contact_name || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-300"><div className="line-clamp-1 max-w-sm">{o.subject || '—'}</div></td>
                    <td className="px-3 py-2.5"><span className={`pill ${STATUS_COLORS[o.status]}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {show ? <OutreachComposer onClose={() => { setShow(false); load(); }} /> : null}
    </div>
  );
}

function StatCell({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1.5 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function Kanbanboard({ rows, onUpdate }) {
  if (!rows) return <Skeleton className="h-64" />;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {STATUSES.map((s) => {
        const cards = rows.filter((r) => r.status === s);
        return (
          <div key={s} className="card flex min-h-[300px] flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { const id = Number(e.dataTransfer.getData('text/plain')); if (id) onUpdate(id, s); }}
          >
            <div className={`border-b border-navy-600 px-3 py-2 text-xs font-semibold ${STATUS_COLORS[s]?.split(' ').filter((c) => c.startsWith('text')).join(' ') || ''}`}>{s} <span className="text-slate-500">({cards.length})</span></div>
            <div className="flex-1 space-y-2 p-2">
              {cards.map((c) => (
                <div key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)} className="cursor-grab rounded-md border border-navy-600 bg-navy-800 p-2 text-xs">
                  <div className="font-medium text-white">{c.account_name}</div>
                  <div className="mt-0.5 text-slate-400">{c.contact_name || '—'} · {c.channel}</div>
                  <div className="mt-1 line-clamp-2 text-slate-300">{c.subject || c.message?.slice(0, 120) || '—'}</div>
                  <div className="mt-1 font-mono text-[10px] text-slate-500">{timeAgo(c.date_sent || c.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
