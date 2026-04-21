import React, { useEffect, useState } from 'react';
import { Brain, Building2, ExternalLink, MessageSquare, NotebookPen, Radio, Sparkles, UserPlus, Users, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { icpColor, STAGES, STAGE_COLORS, STATUS_COLORS, formatMoney, timeAgo, ACTIVITY_COLORS } from '../lib/format.js';
import { Empty, ErrorBlock, Field, Modal, Skeleton, Tabs } from '../components/ui.jsx';
import OutreachComposer from '../components/OutreachComposer.jsx';

export default function AccountDetail({ id, onClose, navigate }) {
  const [account, setAccount] = useState(null);
  const [tab, setTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [outreach, setOutreach] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState([]);
  const [hn, setHn] = useState(null);
  const [research, setResearch] = useState(null);
  const [researchBusy, setResearchBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  async function load() {
    try {
      const [a, c, o, act, n] = await Promise.all([
        api.get(`/accounts/${id}`),
        api.get(`/accounts/${id}/contacts`),
        api.get(`/accounts/${id}/outreach`),
        api.get(`/accounts/${id}/activities`),
        api.get(`/accounts/${id}/notes`)
      ]);
      setAccount(a); setContacts(c); setOutreach(o); setActivities(act); setNotes(n);
    } catch (e) { setError(e); }
  }

  useEffect(() => { load(); }, [id]);

  async function updateStage(stage) {
    await api.patch(`/accounts/${id}`, { stage });
    load();
  }

  async function runResearch() {
    setResearchBusy(true);
    setResearch(null);
    try {
      const r = await api.post(`/ai/research/${id}`);
      setResearch(r);
    } catch (e) { setResearch({ error: String(e.message || e) }); }
    finally { setResearchBusy(false); }
  }

  async function addNote(body) {
    if (!body.trim()) return;
    await api.post('/notes', { account_id: id, body });
    load();
  }

  useEffect(() => {
    if (tab === 'intelligence' && account && !hn) {
      api.get(`/news/hn?q=${encodeURIComponent(account.name)}&limit=12`)
        .then(setHn)
        .catch((e) => setHn({ hits: [], error: e.message }));
    }
  }, [tab, account, hn]);

  const tabs = [
    { key: 'contacts', label: 'Contacts', count: contacts.length },
    { key: 'outreach', label: 'Outreach', count: outreach.length },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'notes', label: 'Notes', count: notes.length },
    { key: 'activity', label: 'Activity', count: activities.length }
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[1100px] flex-col border-l border-navy-600 bg-navy-800 shadow-2xl">
        <div className="flex items-start justify-between border-b border-navy-600 p-5">
          <div>
            {account ? (
              <>
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-electric" />
                  <h2 className="text-2xl font-semibold tracking-tight text-white">{account.name}</h2>
                  <span className={`badge ${icpColor(account.icp_score)}`}>ICP {account.icp_score}/10</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="pill bg-navy-700 text-slate-200">{account.industry}</span>
                  <span className="pill bg-navy-700 text-slate-200">{account.territory}</span>
                  <span className="pill bg-navy-700 text-slate-200 font-mono">{account.eng_headcount?.toLocaleString() || 0} eng</span>
                  <span className="pill bg-navy-700 text-slate-200 font-mono">{formatMoney(account.deal_value)}</span>
                </div>
              </>
            ) : <Skeleton className="h-6 w-48" />}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowComposer(true)} className="btn-primary text-sm"><Sparkles size={14} /> Quick Reach Out</button>
            <button onClick={onClose} className="btn-ghost"><X size={16} /></button>
          </div>
        </div>

        <ErrorBlock error={error} />

        {account ? (
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-[340px] shrink-0 overflow-y-auto border-r border-navy-600 p-5">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="section-title">Pipeline Stage</div>
                  <select className="input mt-1.5" value={account.stage} onChange={(e) => updateStage(e.target.value)}>
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <div className="mt-2"><span className={`pill ${STAGE_COLORS[account.stage]}`}>{account.stage}</span></div>
                </div>

                <div>
                  <div className="section-title">Primary Pain Point</div>
                  <p className="mt-1 leading-relaxed text-slate-200">{account.pain_point || '—'}</p>
                </div>

                <div>
                  <div className="section-title">Mapped Devin Use Case</div>
                  <p className="mt-1 leading-relaxed text-slate-200">{account.devin_use_case || '—'}</p>
                </div>

                <div>
                  <div className="section-title">Suggested Opening Line</div>
                  <blockquote className="mt-1 border-l-2 border-electric pl-3 text-slate-300 italic">
                    {account.opening_line || '—'}
                  </blockquote>
                </div>

                <div>
                  <div className="section-title">ICP Score</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Weighted: engineering headcount, migration backlog fit, Devin ROI lane, territory coverage.
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="px-5 pt-2">
                <Tabs tabs={tabs} current={tab} onChange={setTab} />
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {tab === 'contacts' && (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button onClick={() => setShowAddContact(true)} className="btn-outline text-xs"><UserPlus size={14} /> Add contact</button>
                    </div>
                    {!contacts.length ? <Empty icon={Users} title="No contacts" hint="Add the decision-makers you're targeting." />
                      : contacts.map((c) => <ContactCard key={c.id} contact={c} onChange={load} />)}
                  </div>
                )}
                {tab === 'outreach' && (
                  <div className="space-y-3">
                    {!outreach.length ? <Empty icon={MessageSquare} title="No outreach yet" hint='Click "Quick Reach Out" to log one.' />
                      : outreach.map((o) => <OutreachRow key={o.id} o={o} />)}
                  </div>
                )}
                {tab === 'intelligence' && (
                  <div className="space-y-4">
                    <div className="card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="section-title">AI Research Brief</div>
                          <div className="text-xs text-slate-400">Tailored Devin pain-point analysis for {account.name}.</div>
                        </div>
                        <button onClick={runResearch} disabled={researchBusy} className="btn-primary text-xs">
                          <Brain size={14} /> {researchBusy ? 'Researching…' : 'Research with AI'}
                        </button>
                      </div>
                      {research?.error ? (
                        <div className="mt-3 rounded-md border border-red-900/60 bg-red-900/20 p-3 font-mono text-xs text-red-300">
                          {research.error.includes('ANTHROPIC_API_KEY') ? 'Set ANTHROPIC_API_KEY in .env to enable AI research.' : research.error}
                        </div>
                      ) : research?.analysis ? (
                        <pre className="terminal mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-200">{research.analysis}</pre>
                      ) : null}
                    </div>

                    <div className="card p-4">
                      <div className="flex items-center justify-between">
                        <div className="section-title flex items-center gap-1.5"><Radio size={12} /> Hacker News · {account.name}</div>
                        <span className="font-mono text-[10px] text-slate-500">LIVE</span>
                      </div>
                      <div className="mt-3">
                        {!hn ? <Skeleton className="h-24" /> : !hn.hits?.length ? <Empty title={`No recent HN activity for ${account.name}`} /> : (
                          <ul className="divide-y divide-navy-600">
                            {hn.hits.map((h) => (
                              <li key={h.id} className="py-2">
                                <a href={h.url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-sm text-slate-200 hover:text-electric">{h.title}</a>
                                <div className="mt-0.5 font-mono text-[11px] text-slate-500">{timeAgo(h.created_at)} · {h.points || 0} pts · {h.num_comments || 0} comments</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {tab === 'notes' && <NotesTab notes={notes} onAdd={addNote} />}
                {tab === 'activity' && (
                  !activities.length ? <Empty icon={Radio} title="No activity yet" /> : (
                    <ul className="divide-y divide-navy-600">
                      {activities.map((a) => (
                        <li key={a.id} className="flex items-start gap-3 py-2.5">
                          <span className={`pill ${ACTIVITY_COLORS[a.type] || 'bg-slate-700 text-slate-200'}`}>{a.type}</span>
                          <div className="flex-1">
                            <div className="text-sm text-slate-200">{a.description}</div>
                            <div className="font-mono text-[11px] text-slate-500">{timeAgo(a.created_at)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6"><Skeleton className="h-64" /></div>
        )}
      </div>

      {showComposer ? (
        <OutreachComposer account={account} contacts={contacts} onClose={() => { setShowComposer(false); load(); }} />
      ) : null}

      {showAddContact ? (
        <AddContactModal accountId={id} onClose={() => { setShowAddContact(false); load(); }} />
      ) : null}
    </div>
  );
}

function ContactCard({ contact, onChange }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(contact);

  async function save() {
    await api.patch(`/contacts/${contact.id}`, form);
    setEditing(false);
    onChange();
  }
  async function remove() {
    if (!confirm(`Delete ${contact.name}?`)) return;
    await api.del(`/contacts/${contact.id}`);
    onChange();
  }

  if (!editing) {
    return (
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium text-white">{contact.name}</div>
            <div className="text-sm text-slate-400">{contact.title || '—'}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setForm(contact); setEditing(true); }} className="btn-ghost text-xs">Edit</button>
            <button onClick={remove} className="btn-ghost text-xs text-red-400">Delete</button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px] text-slate-400">
          {contact.email ? <span>{contact.email}</span> : null}
          {contact.phone ? <span>{contact.phone}</span> : null}
          {contact.linkedin_url ? <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-electric hover:underline flex items-center gap-1">LinkedIn <ExternalLink size={10} /></a> : null}
          {contact.last_contacted ? <span>Last contacted: {timeAgo(contact.last_contacted)}</span> : null}
        </div>
        {contact.notes ? <div className="mt-2 text-sm text-slate-300">{contact.notes}</div> : null}
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input" placeholder="Email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input col-span-2" placeholder="LinkedIn URL" value={form.linkedin_url || ''} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
      </div>
      <textarea className="input" rows={2} placeholder="Notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <div className="flex justify-end gap-2">
        <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancel</button>
        <button onClick={save} className="btn-primary text-xs">Save</button>
      </div>
    </div>
  );
}

function OutreachRow({ o }) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="pill bg-navy-700 text-slate-200 font-mono">{o.date_sent || '—'}</span>
          <span className="pill bg-navy-700 text-slate-200">{o.channel}</span>
          <span className="text-sm text-slate-200">{o.contact_name || '—'}</span>
        </div>
        <span className={`pill ${STATUS_COLORS[o.status] || 'bg-slate-700 text-slate-200'}`}>{o.status}</span>
      </div>
      {o.subject ? <div className="mt-2 text-sm font-medium text-white">{o.subject}</div> : null}
      {o.message ? <div className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{o.message}</div> : null}
      {o.response_notes ? <div className="mt-2 rounded bg-navy-700/60 p-2 text-xs text-slate-300"><span className="text-slate-500">Response:</span> {o.response_notes}</div> : null}
    </div>
  );
}

function NotesTab({ notes, onAdd }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="space-y-4">
      <div className="card p-3">
        <textarea rows={3} className="input" placeholder="Note — call summary, insight, next action…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <div className="mt-2 flex justify-end">
          <button onClick={() => { onAdd(draft); setDraft(''); }} className="btn-primary text-xs">Append</button>
        </div>
      </div>
      {!notes.length ? <Empty icon={NotebookPen} title="No notes yet" /> : (
        <ul className="divide-y divide-navy-600">
          {notes.map((n) => (
            <li key={n.id} className="py-3">
              <div className="whitespace-pre-wrap text-sm text-slate-200">{n.body}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-500">{timeAgo(n.created_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddContactModal({ accountId, onClose }) {
  const [form, setForm] = useState({ name: '', title: '', email: '', linkedin_url: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try { await api.post('/contacts', { account_id: accountId, ...form }); onClose(); }
    finally { setSaving(false); }
  }
  return (
    <Modal open onClose={onClose} title="Add Contact">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Title"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        </div>
        <Field label="LinkedIn URL"><input className="input" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></Field>
        <Field label="Notes"><textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Add contact'}</button>
        </div>
      </form>
    </Modal>
  );
}
