import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Calendar, CalendarDays, ExternalLink, Filter, Globe2,
  LayoutGrid, MapPin, Mic2, Plus, Search, Sparkles, Trash2, Users
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty, ErrorBlock, Field, Modal, Skeleton } from '../components/ui.jsx';

// Approximate lat/lng for cities used in seed data — flat equirectangular projection
const CITY_COORDS = {
  'Mountain View': { lat: 37.39, lng: -122.08 },
  'Seattle': { lat: 47.61, lng: -122.33 },
  'Las Vegas': { lat: 36.17, lng: -115.14 },
  'Orlando': { lat: 28.54, lng: -81.38 },
  'San Francisco': { lat: 37.77, lng: -122.42 },
  'Amsterdam': { lat: 52.37, lng: 4.90 },
  'London': { lat: 51.51, lng: -0.13 },
  'Lisbon': { lat: 38.72, lng: -9.14 },
  'Paris': { lat: 48.86, lng: 2.35 },
  'Toronto': { lat: 43.65, lng: -79.38 }
};

function projectToMap(city, w, h) {
  const c = CITY_COORDS[city];
  if (!c) return null;
  const x = ((c.lng + 180) / 360) * w;
  const y = ((90 - c.lat) / 180) * h;
  return { x, y };
}

function parseDate(d) {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t;
}

function daysUntil(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function formatDateLong(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return dateStr || '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function speakerColor(s) {
  if (s.is_competitor) return 'bg-red-900/50 text-red-300 border border-red-800';
  if (s.is_target_account) return 'bg-emerald-900/50 text-emerald-300 border border-emerald-800';
  return 'bg-slate-700/60 text-slate-300 border border-slate-600';
}

function speakerDot(s) {
  if (s.is_competitor) return '🔴';
  if (s.is_target_account) return '🟢';
  return '⚪';
}

function relevancePill(score) {
  if (score >= 8) return 'bg-emerald-900/50 text-emerald-300 border border-emerald-800';
  if (score >= 6) return 'bg-amber-900/50 text-amber-300 border border-amber-800';
  return 'bg-slate-700 text-slate-300 border border-slate-600';
}

export default function Events({ param }) {
  const [conferences, setConferences] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid'); // grid | calendar | map
  const [filterVertical, setFilterVertical] = useState('');
  const [filterCompetitor, setFilterCompetitor] = useState(false);
  const [filterTarget, setFilterTarget] = useState(false);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      setConferences(await api.get('/conferences'));
      setError(null);
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => { load(); }, []);

  // Deep-link via #/events/<id>
  useEffect(() => {
    if (param && conferences) {
      const id = Number(param);
      if (id && conferences.some((c) => c.id === id)) setActiveId(id);
    }
  }, [param, conferences]);

  const verticals = useMemo(() => {
    if (!conferences) return [];
    return Array.from(new Set(conferences.map((c) => c.vertical).filter(Boolean))).sort();
  }, [conferences]);

  const filtered = useMemo(() => {
    if (!conferences) return [];
    const q = search.trim().toLowerCase();
    return conferences.filter((c) => {
      if (filterVertical && c.vertical !== filterVertical) return false;
      if (filterCompetitor && !c.speakers?.some((s) => s.is_competitor)) return false;
      if (filterTarget && !c.speakers?.some((s) => s.is_target_account)) return false;
      if (q) {
        const hay = [c.name, c.location, c.city, c.vertical, c.description, ...(c.speakers || []).map((s) => `${s.name} ${s.company}`)]
          .join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [conferences, filterVertical, filterCompetitor, filterTarget, search]);

  const competitorAlert = useMemo(() => {
    if (!conferences) return null;
    const upcoming = conferences
      .map((c) => ({ c, d: daysUntil(c.dates) }))
      .filter(({ d }) => d !== null && d >= 0 && d <= 60)
      .sort((a, b) => a.d - b.d);
    for (const { c, d } of upcoming) {
      const compSpeaker = c.speakers?.find((s) => s.is_competitor);
      if (compSpeaker) return { conference: c, days: d, speaker: compSpeaker };
    }
    return null;
  }, [conferences]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-title">Events</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Conference & Speaker Intelligence</h1>
          <p className="mt-1 text-sm text-slate-400">
            Turn conferences from things you hear about after the fact into proactive pipeline opportunities.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-outline">
          <Plus size={14} /> Add conference
        </button>
      </div>

      {competitorAlert ? (
        <CompetitorBanner alert={competitorAlert} onClick={() => setActiveId(competitorAlert.conference.id)} />
      ) : null}

      <ErrorBlock error={error} />

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="flex items-center gap-1 rounded-md border border-navy-600 bg-navy-800/60 p-0.5">
          <ViewToggle current={view} k="grid" onClick={setView} icon={LayoutGrid} label="Card Grid" />
          <ViewToggle current={view} k="calendar" onClick={setView} icon={CalendarDays} label="Calendar View" />
          <ViewToggle current={view} k="map" onClick={setView} icon={Globe2} label="Speaker Map" />
        </div>

        <div className="ml-2 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conferences, speakers…"
              className="input w-64 py-1.5 pl-7 text-sm"
            />
          </div>
          <select value={filterVertical} onChange={(e) => setFilterVertical(e.target.value)} className="input w-48 py-1.5 text-sm">
            <option value="">All verticals</option>
            {verticals.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <FilterToggle active={filterCompetitor} onClick={() => setFilterCompetitor((v) => !v)} colorClass="border-red-900/60 bg-red-900/20 text-red-300">
            🔴 Competitor speakers
          </FilterToggle>
          <FilterToggle active={filterTarget} onClick={() => setFilterTarget((v) => !v)} colorClass="border-emerald-900/60 bg-emerald-900/20 text-emerald-300">
            🟢 Target accounts
          </FilterToggle>
        </div>

        <div className="ml-auto font-mono text-xs text-slate-500">
          <Filter size={12} className="mr-1 inline" /> {filtered.length}/{conferences?.length ?? 0}
        </div>
      </div>

      {!conferences ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty icon={Mic2} title="No conferences match these filters" hint="Clear filters or add a conference manually." />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <ConferenceCard key={c.id} c={c} onOpen={() => setActiveId(c.id)} />
          ))}
        </div>
      ) : view === 'calendar' ? (
        <CalendarView conferences={filtered} onOpen={(id) => setActiveId(id)} />
      ) : (
        <SpeakerMap conferences={filtered} onOpen={(id) => setActiveId(id)} />
      )}

      <p className="text-center font-mono text-[11px] text-slate-600">
        Conference & Speaker Intelligence — turning every conference into a known pipeline lane.
      </p>

      {activeId ? (
        <ConferenceDetail
          id={activeId}
          onClose={() => setActiveId(null)}
          onChanged={load}
        />
      ) : null}

      {creating ? (
        <CreateConferenceModal
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(); }}
        />
      ) : null}
    </div>
  );
}

function ViewToggle({ current, k, onClick, icon: Icon, label }) {
  const active = current === k;
  return (
    <button
      onClick={() => onClick(k)}
      className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-electric/20 text-electric' : 'text-slate-300 hover:bg-navy-600 hover:text-white'
      }`}
    >
      <Icon size={13} /> {label}
    </button>
  );
}

function FilterToggle({ active, onClick, colorClass, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
        active ? colorClass : 'border-navy-600 bg-navy-800/60 text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function CompetitorBanner({ alert, onClick }) {
  const { conference, days, speaker } = alert;
  return (
    <button
      onClick={onClick}
      className="card group flex w-full items-start gap-3 border-red-900/60 bg-red-900/20 p-4 text-left transition-colors hover:border-red-700"
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
      <div className="flex-1">
        <div className="font-mono text-[10px] uppercase tracking-widest text-red-400">⚠ Competitor activity</div>
        <div className="mt-1 text-sm text-red-100">
          <span className="font-semibold">{conference.name}</span>
          <span className="text-red-300/80"> {days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`} · </span>
          <span className="font-semibold">{speaker.name}</span>
          <span className="text-red-300/80"> ({speaker.company})</span>
          <span className="text-red-200"> speaking on </span>
          <span className="italic">"{speaker.topic}"</span>
          <span className="text-red-300/80">. Prepare counter-narrative.</span>
        </div>
      </div>
      <span className="font-mono text-[11px] text-red-300/80 group-hover:text-red-200">Open →</span>
    </button>
  );
}

function ConferenceCard({ c, onOpen }) {
  const competitorCount = (c.speakers || []).filter((s) => s.is_competitor).length;
  const targetCount = (c.speakers || []).filter((s) => s.is_target_account).length;
  const days = daysUntil(c.dates);
  return (
    <div className="card card-hover flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="pill bg-electric/15 font-mono uppercase tracking-wider text-electric">{c.vertical || 'Tech'}</span>
        <span className={`pill font-mono ${relevancePill(c.relevance_score)}`}>★ {c.relevance_score}/10</span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-tight text-white">{c.name}</h3>

      <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar size={11} /> {formatDateLong(c.dates)}
          {days !== null && days >= 0 ? <span className="ml-1 text-slate-500">· in {days}d</span> : null}
        </div>
        <div className="flex items-center gap-1.5"><MapPin size={11} /> {c.location || c.city || '—'}</div>
        <div className="flex items-center gap-1.5"><Users size={11} /> {(c.attendees || 0).toLocaleString()} attendees</div>
      </div>

      {c.description ? (
        <p className="mt-3 line-clamp-3 text-sm text-slate-300">{c.description}</p>
      ) : null}

      <div className="mt-4">
        <div className="section-title mb-2">Speakers ({c.speakers?.length || 0})</div>
        {c.speakers?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {c.speakers.slice(0, 5).map((s) => (
              <span key={s.id} className={`pill ${speakerColor(s)}`}>
                {speakerDot(s)} {s.name.split(' ').slice(-1)[0]} · {s.company}
              </span>
            ))}
            {c.speakers.length > 5 ? (
              <span className="pill bg-navy-700 text-slate-400">+{c.speakers.length - 5} more</span>
            ) : null}
          </div>
        ) : (
          <div className="font-mono text-[11px] text-slate-500">No speakers tracked yet</div>
        )}
        {(competitorCount > 0 || targetCount > 0) ? (
          <div className="mt-2 flex gap-2 font-mono text-[10px] text-slate-500">
            {competitorCount > 0 ? <span className="text-red-400">{competitorCount} competitor</span> : null}
            {competitorCount > 0 && targetCount > 0 ? <span>·</span> : null}
            {targetCount > 0 ? <span className="text-emerald-400">{targetCount} target</span> : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-navy-600 pt-3">
        <button onClick={onOpen} className="btn-primary flex-1 justify-center text-xs">View details</button>
        {c.website ? (
          <a
            href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-xs"
          >
            <ExternalLink size={12} /> Site
          </a>
        ) : null}
      </div>
    </div>
  );
}

function CalendarView({ conferences, onOpen }) {
  const months = useMemo(() => {
    if (!conferences.length) return [];
    const sorted = [...conferences].sort((a, b) => (a.dates || '').localeCompare(b.dates || ''));
    const buckets = new Map();
    for (const c of sorted) {
      const d = parseDate(c.dates);
      if (!d) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          year: d.getUTCFullYear(),
          month: d.getUTCMonth(),
          label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
          items: []
        });
      }
      buckets.get(key).items.push(c);
    }
    return Array.from(buckets.values());
  }, [conferences]);

  if (!months.length) return <Empty icon={CalendarDays} title="No conferences in range" />;

  return (
    <div className="space-y-6">
      {months.map((m) => (
        <div key={m.key}>
          <div className="mb-3 flex items-baseline justify-between border-b border-navy-600 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300">{m.label}</h3>
            <span className="font-mono text-[11px] text-slate-500">{m.items.length} event{m.items.length === 1 ? '' : 's'}</span>
          </div>
          <MonthGrid year={m.year} month={m.month} items={m.items} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}

function MonthGrid({ year, month, items, onOpen }) {
  const first = new Date(Date.UTC(year, month, 1));
  const startDay = first.getUTCDay();
  const lastDate = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let d = 1; d <= lastDate; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay = new Map();
  for (const c of items) {
    const dt = parseDate(c.dates);
    if (!dt) continue;
    const day = dt.getUTCDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(c);
  }

  return (
    <div className="grid grid-cols-7 gap-1 rounded-lg border border-navy-600 bg-navy-800/40 p-2">
      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
        <div key={d} className="py-1 text-center font-mono text-[10px] uppercase tracking-widest text-slate-500">{d}</div>
      ))}
      {cells.map((d, idx) => (
        <div key={idx} className={`min-h-[88px] rounded border p-1 ${d ? 'border-navy-600 bg-navy-800/60' : 'border-transparent'}`}>
          {d ? (
            <>
              <div className="font-mono text-[10px] text-slate-500">{d}</div>
              <div className="mt-1 space-y-1">
                {(byDay.get(d) || []).map((c) => {
                  const hasComp = c.speakers?.some((s) => s.is_competitor);
                  return (
                    <button
                      key={c.id}
                      onClick={() => onOpen(c.id)}
                      title={c.name}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] ${
                        hasComp ? 'bg-red-900/40 text-red-200 hover:bg-red-900/60' : 'bg-purple-900/40 text-purple-200 hover:bg-purple-900/60'
                      }`}
                    >
                      {hasComp ? '⚠ ' : '🎤 '}{c.name}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SpeakerMap({ conferences, onOpen }) {
  const [hovered, setHovered] = useState(null);
  const W = 1000;
  const H = 500;

  const grouped = useMemo(() => {
    const m = new Map();
    for (const c of conferences) {
      if (!c.city || !CITY_COORDS[c.city]) continue;
      if (!m.has(c.city)) m.set(c.city, []);
      m.get(c.city).push(c);
    }
    return Array.from(m.entries()).map(([city, items]) => ({
      city,
      items,
      totalAttendees: items.reduce((s, c) => s + (c.attendees || 0), 0),
      hasComp: items.some((c) => c.speakers?.some((s) => s.is_competitor)),
      hasTarget: items.some((c) => c.speakers?.some((s) => s.is_target_account)),
      pos: projectToMap(city, W, H)
    }));
  }, [conferences]);

  const unmapped = conferences.filter((c) => !CITY_COORDS[c.city]);
  const selected = hovered ? grouped.find((g) => g.city === hovered) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
      <div className="card overflow-hidden p-3">
        <div className="relative w-full" style={{ aspectRatio: `${W}/${H}` }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
            <defs>
              <pattern id="evt-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.7" fill="#1c2340" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#evt-dots)" />
            <g fill="#141a2e" opacity="0.6">
              <path d="M120,90 L260,80 L300,140 L330,210 L290,300 L220,330 L160,300 L120,210 Z" />
              <path d="M260,330 L310,330 L320,420 L280,480 L260,470 L250,400 Z" />
              <path d="M470,110 L560,100 L590,150 L560,200 L490,200 L470,160 Z" />
              <path d="M490,210 L590,210 L610,310 L560,400 L520,400 L490,300 Z" />
              <path d="M600,90 L820,90 L880,170 L860,260 L760,280 L660,250 L600,180 Z" />
              <path d="M820,330 L900,330 L910,380 L840,400 L810,370 Z" />
            </g>
            {grouped.map(({ city, items, totalAttendees, hasComp, hasTarget, pos }) => {
              if (!pos) return null;
              const r = Math.min(28, 6 + Math.sqrt(totalAttendees) / 6);
              const fill = hasComp ? '#ef4444' : hasTarget ? '#10b981' : '#3b82f6';
              return (
                <g
                  key={city}
                  onMouseEnter={() => setHovered(city)}
                  onClick={() => (items.length === 1 ? onOpen(items[0].id) : setHovered(city))}
                  className="cursor-pointer"
                >
                  <circle cx={pos.x} cy={pos.y} r={r + 4} fill={fill} opacity="0.15" />
                  <circle cx={pos.x} cy={pos.y} r={r} fill={fill} opacity="0.45" stroke={fill} strokeWidth="1.5" />
                  <circle cx={pos.x} cy={pos.y} r={3} fill="#fff" />
                  <text x={pos.x + r + 4} y={pos.y + 3} fontSize="11" fill="#cbd5e1" fontFamily="ui-monospace">
                    {city}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 px-1 font-mono text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Competitor speaking</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Target account speaking</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-electric" /> Other</span>
          <span className="ml-auto">Pin size = total attendees</span>
        </div>
      </div>

      <div className="card max-h-[640px] overflow-auto p-4">
        <div className="section-title mb-3">{selected ? selected.city : 'Click a pin'}</div>
        {selected ? (
          <div className="space-y-3">
            {selected.items.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="card-hover block w-full rounded-lg border border-navy-600 bg-navy-800/60 p-3 text-left"
              >
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-slate-400">{formatDateLong(c.dates)}</div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">
                  {(c.attendees || 0).toLocaleString()} attendees · ★ {c.relevance_score}/10
                </div>
                {c.speakers?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.speakers.slice(0, 3).map((s) => (
                      <span key={s.id} className={`pill ${speakerColor(s)}`}>{speakerDot(s)} {s.name}</span>
                    ))}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="font-mono text-[11px] text-slate-500">Click a pin to see conferences in that city.</div>
        )}
        {unmapped.length ? (
          <div className="mt-5 border-t border-navy-600 pt-3">
            <div className="section-title mb-2">Unmapped ({unmapped.length})</div>
            <div className="space-y-1">
              {unmapped.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className="block w-full truncate rounded px-2 py-1 text-left text-[11px] text-slate-400 hover:bg-navy-700 hover:text-slate-200"
                >
                  {c.name} <span className="text-slate-600">— {c.city || c.location}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConferenceDetail({ id, onClose, onChanged }) {
  const [conf, setConf] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [discoveryBusy, setDiscoveryBusy] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [discoveryError, setDiscoveryError] = useState(null);
  const [notes, setNotes] = useState('');

  async function load() {
    try {
      const c = await api.get(`/conferences/${id}`);
      setConf(c);
      setNotes(c.notes || '');
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function setStatus(status) {
    setBusy(true);
    try {
      await api.put(`/conferences/${id}`, { attending_status: status });
      await load();
      onChanged?.();
    } catch (e) { setError(e); }
    setBusy(false);
  }

  async function saveNotes() {
    setBusy(true);
    try {
      await api.put(`/conferences/${id}`, { notes });
      onChanged?.();
    } catch (e) { setError(e); }
    setBusy(false);
  }

  async function discover() {
    setDiscoveryBusy(true);
    setDiscoveryError(null);
    try {
      const r = await api.post(`/conferences/${id}/discover-speakers`, {});
      setSuggestions(r.suggestions || []);
    } catch (e) {
      setDiscoveryError(e);
    }
    setDiscoveryBusy(false);
  }

  async function addSuggestion(s) {
    try {
      await api.post(`/conferences/${id}/speakers`, {
        name: s.name,
        title: s.title,
        company: s.company,
        topic: s.topic,
        is_competitor: s.is_competitor ? 1 : 0,
        is_target_account: 0,
        company_type: s.is_competitor ? 'competitor' : 'other'
      });
      setSuggestions((prev) => prev.filter((x) => x !== s));
      await load();
      onChanged?.();
    } catch (e) { setError(e); }
  }

  async function removeSpeaker(speakerId) {
    if (!window.confirm('Remove this speaker?')) return;
    try {
      await api.del(`/conferences/${id}/speakers/${speakerId}`);
      await load();
      onChanged?.();
    } catch (e) { setError(e); }
  }

  async function flagAsThreat(speaker) {
    try {
      await api.put(`/conferences/${id}/speakers/${speaker.id}`, {
        is_competitor: 1,
        company_type: speaker.company_type || 'competitor'
      });
      await load();
      onChanged?.();
    } catch (e) { setError(e); }
  }

  return (
    <Modal open onClose={onClose} title={conf?.name || 'Conference'} size="xl">
      {!conf ? <Skeleton className="h-64" /> : (
        <div className="space-y-5">
          <ErrorBlock error={error} />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill bg-electric/15 font-mono text-electric">{conf.vertical || 'Tech'}</span>
                <span className={`pill font-mono ${relevancePill(conf.relevance_score)}`}>★ {conf.relevance_score}/10</span>
                {(() => {
                  const d = daysUntil(conf.dates);
                  return d !== null && d >= 0 ? (
                    <span className="pill bg-navy-700 font-mono text-slate-300">in {d}d</span>
                  ) : null;
                })()}
              </div>
              <div className="mt-2 font-mono text-xs text-slate-400">
                {formatDateLong(conf.dates)} · {conf.location || conf.city || '—'} · {(conf.attendees || 0).toLocaleString()} attendees
              </div>
            </div>
            {conf.website ? (
              <a
                href={conf.website.startsWith('http') ? conf.website : `https://${conf.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs"
              >
                <ExternalLink size={12} /> {conf.website}
              </a>
            ) : null}
          </div>

          {conf.description ? <p className="text-sm text-slate-300">{conf.description}</p> : null}

          <div className="border-t border-navy-600 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-300">Speakers ({conf.speakers?.length || 0})</h4>
              <button onClick={discover} disabled={discoveryBusy} className="btn-outline text-xs">
                <Sparkles size={12} /> {discoveryBusy ? 'Searching…' : 'Search speakers (AI)'}
              </button>
            </div>

            <ErrorBlock error={discoveryError} />

            {suggestions?.length ? (
              <div className="mb-4 rounded-lg border border-violet-900/50 bg-violet-900/20 p-3">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-violet-300">AI suggestions · click to add</div>
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 rounded-md border border-navy-600 bg-navy-800/60 p-2">
                      <div className="text-sm">
                        <div className="text-white">
                          {s.is_competitor ? '🔴 ' : ''}{s.name}{' '}
                          <span className="text-slate-400">· {s.title}</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">{s.company} · {s.topic}</div>
                      </div>
                      <button onClick={() => addSuggestion(s)} className="btn-primary text-xs">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {suggestions && !suggestions.length ? (
              <div className="mb-4 font-mono text-[11px] text-slate-500">All AI-suggested speakers added.</div>
            ) : null}

            {conf.speakers?.length ? (
              <div className="space-y-3">
                {conf.speakers.map((s) => (
                  <SpeakerCard
                    key={s.id}
                    s={s}
                    onRemove={() => removeSpeaker(s.id)}
                    onFlagThreat={() => flagAsThreat(s)}
                  />
                ))}
              </div>
            ) : (
              <Empty icon={Mic2} title="No speakers tracked" hint="Use AI search or add a speaker manually." />
            )}

            <div className="mt-4">
              <AddSpeakerForm conferenceId={id} onAdded={async () => { await load(); onChanged?.(); }} />
            </div>
          </div>

          <div className="border-t border-navy-600 pt-4">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-300">Attend this event?</h4>
            <div className="flex flex-wrap items-center gap-2">
              {[
                ['interested', 'Interested'],
                ['not_attending', 'Not attending'],
                ['attending', 'Attending']
              ].map(([key, label]) => {
                const active = conf.attending_status === key;
                return (
                  <button
                    key={key}
                    onClick={() => setStatus(key)}
                    disabled={busy}
                    className={`${active ? 'btn-primary' : 'btn-outline'} text-xs`}
                  >
                    {label}
                  </button>
                );
              })}
              {conf.attending_status && conf.attending_status !== 'undecided' ? (
                <span className="ml-2 font-mono text-[11px] text-slate-500">Status: {conf.attending_status}</span>
              ) : null}
            </div>
            <div className="mt-3">
              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={saveNotes}
                  rows={3}
                  placeholder="Talking points, account targets, who's on the ground…"
                  className="input"
                />
              </Field>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function SpeakerCard({ s, onRemove, onFlagThreat }) {
  return (
    <div className="rounded-lg border border-navy-600 bg-navy-800/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">
            {s.is_competitor ? '🔴 ' : s.is_target_account ? '🟢 ' : ''}{s.name}
          </div>
          <div className="font-mono text-[11px] text-slate-400">{s.title || '—'} · {s.company || '—'}</div>
          {s.topic ? (
            <div className="mt-1 text-sm text-slate-300">Topic: <span className="italic">{s.topic}</span></div>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {s.is_competitor ? <span className="pill bg-red-900/50 text-red-300">Competitive threat</span> : null}
            {s.is_target_account ? <span className="pill bg-emerald-900/50 text-emerald-300">Target account</span> : null}
            {s.linkedin_url ? (
              <a href={s.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-electric hover:underline">
                LinkedIn ↗
              </a>
            ) : null}
            {!s.is_competitor ? (
              <button onClick={onFlagThreat} className="text-[11px] text-red-400 hover:underline">
                Flag as competitive threat
              </button>
            ) : null}
          </div>
          {s.is_competitor && s.notes ? (
            <div className="mt-2 rounded border border-red-900/40 bg-red-900/10 p-2 text-[12px] text-red-100">
              <div className="font-mono text-[10px] uppercase tracking-widest text-red-300">Why this matters</div>
              <div className="mt-1 whitespace-pre-line">{s.notes}</div>
            </div>
          ) : null}
        </div>
        <button onClick={onRemove} className="btn-ghost text-xs"><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

function AddSpeakerForm({ conferenceId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', title: '', company: '', topic: '', linkedin_url: '',
    is_competitor: 0, is_target_account: 0
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/conferences/${conferenceId}/speakers`, {
        ...form,
        company_type: form.is_competitor ? 'competitor' : form.is_target_account ? 'target_account' : 'other'
      });
      setForm({ name: '', title: '', company: '', topic: '', linkedin_url: '', is_competitor: 0, is_target_account: 0 });
      setOpen(false);
      onAdded?.();
    } catch (e2) {
      setErr(e2);
    }
    setBusy(false);
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-outline text-xs"><Plus size={12} /> Add speaker</button>;
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-navy-600 bg-navy-800/60 p-3">
      <ErrorBlock error={err} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name"><input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required /></Field>
        <Field label="Title"><input className="input" value={form.title} onChange={(e) => update('title', e.target.value)} /></Field>
        <Field label="Company"><input className="input" value={form.company} onChange={(e) => update('company', e.target.value)} /></Field>
        <Field label="Topic"><input className="input" value={form.topic} onChange={(e) => update('topic', e.target.value)} /></Field>
        <Field label="LinkedIn URL"><input className="input" value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} /></Field>
        <div className="flex items-end gap-3 text-xs text-slate-300">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={!!form.is_competitor} onChange={(e) => update('is_competitor', e.target.checked ? 1 : 0)} />
            Competitor
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={!!form.is_target_account} onChange={(e) => update('is_target_account', e.target.checked ? 1 : 0)} />
            Target account
          </label>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-xs">Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary text-xs">{busy ? 'Adding…' : 'Add speaker'}</button>
      </div>
    </form>
  );
}

function CreateConferenceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', dates: '', location: '', city: '', country: '', vertical: '',
    attendees: '', website: '', description: '', relevance_score: 5
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.dates.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await api.post('/conferences', {
        ...form,
        attendees: Number(form.attendees) || 0,
        relevance_score: Number(form.relevance_score) || 5
      });
      onCreated?.();
    } catch (e2) {
      setErr(e2);
    }
    setBusy(false);
  }

  return (
    <Modal open onClose={onClose} title="Add conference" size="lg">
      <form onSubmit={submit} className="space-y-3">
        <ErrorBlock error={err} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name *"><input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required /></Field>
          <Field label="Date * (YYYY-MM-DD)"><input className="input" value={form.dates} onChange={(e) => update('dates', e.target.value)} placeholder="2026-09-15" required /></Field>
          <Field label="City"><input className="input" value={form.city} onChange={(e) => update('city', e.target.value)} /></Field>
          <Field label="Country"><input className="input" value={form.country} onChange={(e) => update('country', e.target.value)} /></Field>
          <Field label="Location"><input className="input" value={form.location} onChange={(e) => update('location', e.target.value)} /></Field>
          <Field label="Vertical"><input className="input" value={form.vertical} onChange={(e) => update('vertical', e.target.value)} /></Field>
          <Field label="Attendees"><input className="input" type="number" value={form.attendees} onChange={(e) => update('attendees', e.target.value)} /></Field>
          <Field label="Website"><input className="input" value={form.website} onChange={(e) => update('website', e.target.value)} /></Field>
          <Field label="Relevance score (1-10)">
            <input className="input" type="number" min="1" max="10" value={form.relevance_score} onChange={(e) => update('relevance_score', e.target.value)} />
          </Field>
        </div>
        <Field label="Description">
          <textarea className="input" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost text-xs">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary text-xs">{busy ? 'Adding…' : 'Add conference'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Reusable Command-dashboard widget ----------

export function UpcomingEventsSection({ navigate }) {
  const [conferences, setConferences] = useState(null);
  useEffect(() => {
    api.get('/conferences')
      .then((rows) => setConferences(rows))
      .catch(() => setConferences([]));
  }, []);

  const upcoming = useMemo(() => {
    if (!conferences) return null;
    return conferences
      .map((c) => ({ ...c, days: daysUntil(c.dates) }))
      .filter((c) => c.days !== null && c.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);
  }, [conferences]);

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title">Upcoming Events</h2>
        <button
          onClick={() => navigate('events')}
          className="font-mono text-[11px] text-electric hover:underline"
        >
          View all →
        </button>
      </div>
      {!conferences ? (
        <Skeleton className="h-24" />
      ) : !upcoming.length ? (
        <Empty icon={Mic2} title="No upcoming conferences" />
      ) : (
        <ul className="divide-y divide-navy-600">
          {upcoming.map((c) => {
            const hasComp = c.speakers?.some((s) => s.is_competitor);
            return (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="flex w-14 shrink-0 flex-col items-center rounded-md border border-navy-600 bg-navy-800/60 px-1 py-1.5">
                  <div className="font-mono text-lg font-semibold text-white">{c.days}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500">days</div>
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => navigate('events', String(c.id))}
                    className="block truncate text-left text-sm font-medium text-white hover:text-electric"
                  >
                    {c.name}
                  </button>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                    {formatDateLong(c.dates)} · {c.city || c.location || '—'}
                  </div>
                </div>
                {hasComp ? (
                  <span className="pill bg-red-900/50 font-mono text-red-300">⚠ competitor</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
