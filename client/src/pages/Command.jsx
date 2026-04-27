import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Briefcase, Building2, DollarSign, ExternalLink, Globe2, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { api } from '../lib/api.js';
import { ACTIVITY_COLORS, formatMoney, formatNum, formatPct, STAGES, timeAgo } from '../lib/format.js';
import { Empty, ErrorBlock, Section, Skeleton } from '../components/ui.jsx';
import { UpcomingEventsSection } from './Events.jsx';

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</div>
        <Icon size={16} className="text-electric" />
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-slate-400">{sub}</div> : null}
    </div>
  );
}

export default function Command({ navigate }) {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [triggers, setTriggers] = useState(null);
  const [error, setError] = useState(null);

  async function loadStats() {
    try { setStats(await api.get('/stats/overview')); } catch (e) { setError(e); }
  }
  async function loadActivities() {
    try { setActivities(await api.get('/activities?limit=20')); } catch { /* noop */ }
  }
  async function loadTriggers() {
    try { setTriggers(await api.get('/news/triggers')); } catch { setTriggers({ hits: [] }); }
  }

  useEffect(() => {
    loadStats();
    loadActivities();
    loadTriggers();
    const a = setInterval(loadActivities, 60 * 1000);
    const t = setInterval(loadTriggers, 5 * 60 * 1000);
    return () => { clearInterval(a); clearInterval(t); };
  }, []);

  const territory = stats?.byTerritory
    ? Object.entries(stats.byTerritory).map(([k, v]) => ({ name: k, count: v }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <div className="section-title">Command</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Operational Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">How the GTM operation is running — in 10 seconds.</p>
      </div>

      <ErrorBlock error={error} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        {!stats ? (
          [...Array(6)].map((_, i) => <div key={i} className="card p-4"><Skeleton className="h-5 w-24" /><Skeleton className="mt-3 h-7 w-16" /></div>)
        ) : (
          <>
            <MetricCard icon={Building2} label="Total Accounts" value={formatNum(stats.totalAccounts)} sub={`Ent ${stats.enterprise} · Mid ${stats.midMarket} · SMB ${stats.smb}`} />
            <MetricCard icon={DollarSign} label="Pipeline Value" value={formatMoney(stats.pipelineValue)} sub="Est. across active accounts" />
            <MetricCard icon={MessageSquare} label="Reach Outs · Week" value={formatNum(stats.reachWeek)} sub={`Total: ${stats.totalReachOuts}`} />
            <MetricCard icon={TrendingUp} label="Response Rate" value={formatPct(stats.responseRate)} sub={stats.totalReachOuts ? `${Math.round(stats.responseRate * stats.totalReachOuts)} / ${stats.totalReachOuts}` : '—'} />
            <MetricCard icon={Briefcase} label="Meetings · Month" value={formatNum(stats.meetingsMonth)} sub="Booked this month" />
            <div className="card p-4">
              <div className="flex items-start justify-between">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Territories</div>
                <Globe2 size={16} className="text-electric" />
              </div>
              <div className="mt-2 h-16">
                <ResponsiveContainer>
                  <BarChart data={territory} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#1c2340' }} contentStyle={{ background: '#0f1424', border: '1px solid #26304f', borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      <Section title="Pipeline Funnel">
        {!stats ? <Skeleton className="h-20" /> : (
          <div className="grid grid-cols-6 gap-2">
            {stats.funnel.map((s, i) => {
              const max = Math.max(...stats.funnel.map((x) => x.count), 1);
              const pct = Math.max(10, Math.round((s.count / max) * 100));
              return (
                <button
                  key={s.stage}
                  onClick={() => navigate('accounts', `stage=${encodeURIComponent(s.stage)}`)}
                  className="group relative flex h-24 flex-col items-center justify-end overflow-hidden rounded-lg border border-navy-600 bg-navy-800/60 p-3 text-left transition-colors hover:border-electric"
                >
                  <div
                    className="absolute inset-x-0 bottom-0 bg-electric/15 transition-all group-hover:bg-electric/25"
                    style={{ height: `${pct}%` }}
                  />
                  <div className="relative z-10 text-[10px] uppercase tracking-wider text-slate-400">{String(i + 1).padStart(2, '0')}</div>
                  <div className="relative z-10 mt-1 text-sm font-semibold text-white">{s.count}</div>
                  <div className="relative z-10 mt-0.5 text-[11px] text-slate-300">{s.stage}</div>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <UpcomingEventsSection navigate={navigate} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Live Activity Feed" right={<span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500"><span className="live-dot h-1.5 w-1.5 rounded-full bg-green-500" /> AUTO-REFRESH 60s</span>}>
          {!activities.length ? (
            <Empty icon={Activity} title="No activity yet" hint="Add an account or log a reach out to get started." />
          ) : (
            <ul className="divide-y divide-navy-600">
              {activities.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-2.5">
                  <span className={`pill ${ACTIVITY_COLORS[a.type] || 'bg-slate-700 text-slate-200'}`}>{a.type}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-200">
                      {a.account_name ? <span className="text-white">{a.account_name}</span> : null}
                      {a.account_name && a.description ? <span className="text-slate-500"> · </span> : null}
                      <span>{a.description}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">{timeAgo(a.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Live Triggers · target accounts in the news"
          right={<span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500"><span className="live-dot h-1.5 w-1.5 rounded-full bg-green-500" /> HACKER NEWS · 5m</span>}
        >
          {!triggers ? (
            <Skeleton className="h-32" />
          ) : !triggers.hits?.length ? (
            <Empty title="No new triggers" hint="Top-20 accounts are clean. Refreshing every 5 minutes." />
          ) : (
            <ul className="divide-y divide-navy-600">
              {triggers.hits.slice(0, 10).map((h) => (
                <li key={h.id} className="py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="pill bg-electric/15 text-electric">{h.account_name}</span>
                    <div className="min-w-0 flex-1">
                      <a href={h.url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-sm text-slate-100 hover:text-electric">
                        {h.title}
                      </a>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-slate-500">
                        <span>{h.source}</span>
                        <span>·</span>
                        <span>{timeAgo(h.created_at)}</span>
                        <button onClick={() => navigate('accounts', String(h.account_id))} className="ml-auto flex items-center gap-1 text-electric hover:underline">
                          View Account <ExternalLink size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
