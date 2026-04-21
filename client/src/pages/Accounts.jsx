import React, { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, X } from 'lucide-react';
import { api, qs } from '../lib/api.js';
import { icpColor, STAGES, STAGE_COLORS, timeAgo } from '../lib/format.js';
import { Empty, ErrorBlock, Field, Modal, Skeleton } from '../components/ui.jsx';
import AccountDetail from './AccountDetail.jsx';

const TERRITORIES = ['US', 'UK', 'DACH', 'Israel', 'Eastern Europe'];
const INDUSTRIES = ['Entertainment', 'Financial Services', 'Enterprise Software', 'Industrial', 'Automotive', 'Telecommunications', 'Telecom Software', 'Cybersecurity', 'Internet', 'SaaS', 'Marketplace', 'Fintech', 'Mobility'];

function parseParam(param) {
  if (!param) return { id: null, filters: {} };
  if (/^\d+$/.test(param)) return { id: Number(param), filters: {} };
  const out = {};
  for (const pair of param.split('&')) {
    const [k, v] = pair.split('=');
    if (k && v) out[k] = decodeURIComponent(v);
  }
  return { id: null, filters: out };
}

export default function Accounts({ param, navigate }) {
  const parsed = useMemo(() => parseParam(param), [param]);
  const [filters, setFilters] = useState({ search: '', territory: '', industry: '', stage: '', minIcp: '', sort: 'icp_score' });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkStage, setBulkStage] = useState('Researched');

  useEffect(() => {
    if (parsed.id) setDetailId(parsed.id);
    if (Object.keys(parsed.filters).length) {
      setFilters((f) => ({ ...f, ...parsed.filters }));
    }
  }, [parsed]);

  async function load() {
    try {
      setRows(null);
      const data = await api.get(`/accounts${qs(filters)}`);
      setRows(data);
    } catch (e) { setError(e); setRows([]); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters.search, filters.territory, filters.industry, filters.stage, filters.minIcp, filters.sort]);

  function toggleRow(id) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkUpdate() {
    if (!selected.size) return;
    await api.post('/accounts/bulk/stage', { ids: [...selected], stage: bulkStage });
    setSelected(new Set());
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="section-title">Accounts</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Account Database</h1>
          <p className="mt-1 text-sm text-slate-400">{rows ? `${rows.length} accounts` : 'Loading…'} · filter, search, and drill into every target.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/accounts/export.csv" className="btn-outline text-sm"><Download size={14} /> Export CSV</a>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus size={14} /> Add Account</button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input pl-9"
              placeholder="Search company, pain point, use case…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select className="input w-36" value={filters.territory} onChange={(e) => setFilters({ ...filters, territory: e.target.value })}>
            <option value="">All territories</option>
            {TERRITORIES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input w-44" value={filters.industry} onChange={(e) => setFilters({ ...filters, industry: e.target.value })}>
            <option value="">All industries</option>
            {INDUSTRIES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input w-40" value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}>
            <option value="">All stages</option>
            {STAGES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input w-32" value={filters.minIcp} onChange={(e) => setFilters({ ...filters, minIcp: e.target.value })}>
            <option value="">Any ICP</option>
            <option value="8">ICP 8+</option>
            <option value="5">ICP 5+</option>
          </select>
          <select className="input w-40" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="icp_score">Sort: ICP Score</option>
            <option value="updated_at">Sort: Last Activity</option>
            <option value="name">Sort: Name</option>
            <option value="created_at">Sort: Date Added</option>
          </select>
          {(filters.search || filters.territory || filters.industry || filters.stage || filters.minIcp) ? (
            <button onClick={() => setFilters({ search: '', territory: '', industry: '', stage: '', minIcp: '', sort: filters.sort })} className="btn-ghost text-xs">
              <X size={12} /> Clear
            </button>
          ) : null}
        </div>

        {selected.size ? (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-electric/40 bg-electric/10 px-3 py-2 text-sm">
            <span className="text-white">{selected.size} selected</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">Move to stage:</span>
            <select className="input w-40 py-1" value={bulkStage} onChange={(e) => setBulkStage(e.target.value)}>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={bulkUpdate} className="btn-primary text-xs">Apply</button>
            <button onClick={() => setSelected(new Set())} className="btn-ghost text-xs">Clear</button>
          </div>
        ) : null}
      </div>

      <ErrorBlock error={error} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-navy-600 bg-navy-800 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="w-8 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">Company</th>
                <th className="px-3 py-2.5">Territory</th>
                <th className="px-3 py-2.5">Industry</th>
                <th className="px-3 py-2.5">Eng.</th>
                <th className="px-3 py-2.5">ICP</th>
                <th className="px-3 py-2.5">Stage</th>
                <th className="px-3 py-2.5">Primary Contact</th>
                <th className="px-3 py-2.5">Last Activity</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {!rows ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-navy-700">
                    <td colSpan={10} className="px-3 py-2.5"><Skeleton className="h-4 w-full" /></td>
                  </tr>
                ))
              ) : !rows.length ? (
                <tr><td colSpan={10}><Empty title="No accounts match those filters" hint="Try clearing filters or adding a new account." /></td></tr>
              ) : rows.map((a) => (
                <tr key={a.id} className="border-b border-navy-700 hover:bg-navy-700/40">
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleRow(a.id)} className="rounded border-navy-500 bg-navy-700 text-electric focus:ring-electric" />
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => setDetailId(a.id)} className="text-left font-medium text-white hover:text-electric">
                      {a.name}
                    </button>
                    <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{a.pain_point}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300">{a.territory || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-300">{a.industry || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">{a.eng_headcount?.toLocaleString() || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`badge ${icpColor(a.icp_score)}`}>{a.icp_score}/10</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`pill ${STAGE_COLORS[a.stage]}`}>{a.stage}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300">{a.primary_contact || <span className="text-slate-500">—</span>}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">{timeAgo(a.last_activity || a.updated_at)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => setDetailId(a.id)} className="text-xs text-electric hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailId ? (
        <AccountDetail id={detailId} onClose={() => { setDetailId(null); load(); }} navigate={navigate} />
      ) : null}

      {showAdd ? (
        <AddAccountModal onClose={() => { setShowAdd(false); load(); }} />
      ) : null}
    </div>
  );
}

function AddAccountModal({ onClose }) {
  const [form, setForm] = useState({ name: '', industry: 'Enterprise Software', territory: 'US', eng_headcount: 0, icp_score: 7, deal_value: 500000, pain_point: '', devin_use_case: '', opening_line: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await api.post('/accounts', form);
      onClose();
    } catch (e) { setErr(e); }
    finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Add Account" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Industry">
            <select className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Territory">
            <select className="input" value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })}>
              {TERRITORIES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Engineering headcount"><input type="number" className="input" value={form.eng_headcount} onChange={(e) => setForm({ ...form, eng_headcount: Number(e.target.value) })} /></Field>
          <Field label="ICP Score (1–10)"><input type="number" min="1" max="10" className="input" value={form.icp_score} onChange={(e) => setForm({ ...form, icp_score: Number(e.target.value) })} /></Field>
          <Field label="Est. deal value ($)"><input type="number" className="input" value={form.deal_value} onChange={(e) => setForm({ ...form, deal_value: Number(e.target.value) })} /></Field>
        </div>
        <Field label="Primary pain point"><textarea rows={2} className="input" value={form.pain_point} onChange={(e) => setForm({ ...form, pain_point: e.target.value })} /></Field>
        <Field label="Mapped Devin use case"><textarea rows={2} className="input" value={form.devin_use_case} onChange={(e) => setForm({ ...form, devin_use_case: e.target.value })} /></Field>
        <Field label="Suggested opening line"><textarea rows={3} className="input" value={form.opening_line} onChange={(e) => setForm({ ...form, opening_line: e.target.value })} /></Field>
        <ErrorBlock error={err} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Create account'}</button>
        </div>
      </form>
    </Modal>
  );
}
