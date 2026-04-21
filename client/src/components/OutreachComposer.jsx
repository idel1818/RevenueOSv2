import React, { useEffect, useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { api } from '../lib/api.js';
import { STATUSES } from '../lib/format.js';
import { ErrorBlock, Field, Modal } from './ui.jsx';

const CHANNELS = ['Email', 'LinkedIn', 'Phone', 'Event', 'Referral', 'Other'];

export default function OutreachComposer({ account: accountProp, contacts: contactsProp, onClose, initialAccountId }) {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(accountProp?.id || initialAccountId || '');
  const [contacts, setContacts] = useState(contactsProp || []);
  const [form, setForm] = useState({
    contact_id: '',
    channel: 'Email',
    date_sent: new Date().toISOString().slice(0, 10),
    subject: '',
    message: '',
    status: 'Sent',
    follow_up_date: '',
    response_notes: ''
  });
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accountProp) {
      api.get('/accounts').then(setAccounts).catch(() => setAccounts([]));
    }
  }, [accountProp]);

  useEffect(() => {
    if (!accountId || accountProp) return;
    api.get(`/accounts/${accountId}/contacts`).then(setContacts).catch(() => setContacts([]));
  }, [accountId, accountProp]);

  const activeAccount = accountProp || accounts.find((a) => a.id === Number(accountId));

  async function compose() {
    if (!accountId) { setAiErr(new Error('Select an account first')); return; }
    setAiBusy(true);
    setAiErr(null);
    try {
      const contact = contacts.find((c) => c.id === Number(form.contact_id));
      const r = await api.post('/ai/compose', {
        account_id: Number(accountId),
        contact_title: contact?.title
      });
      setForm((f) => ({ ...f, message: r.message }));
    } catch (e) {
      setAiErr(e.message.includes('ANTHROPIC_API_KEY')
        ? new Error('Set ANTHROPIC_API_KEY in .env to enable the AI composer. Copy the opening line field below as a starting point.')
        : e);
    } finally {
      setAiBusy(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/outreach', { account_id: Number(accountId), ...form, contact_id: form.contact_id ? Number(form.contact_id) : null });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Log Reach Out" size="lg">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {!accountProp ? (
            <Field label="Account">
              <select className="input" required value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Select account…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.territory}</option>)}
              </select>
            </Field>
          ) : <Field label="Account"><div className="input bg-navy-700 text-white">{accountProp.name}</div></Field>}

          <Field label="Contact">
            <select className="input" value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })}>
              <option value="">— select —</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.title ? ` · ${c.title}` : ''}</option>)}
            </select>
          </Field>

          <Field label="Channel">
            <select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              {CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Date sent"><input type="date" className="input" value={form.date_sent} onChange={(e) => setForm({ ...form, date_sent: e.target.value })} /></Field>

          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Follow-up date"><input type="date" className="input" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} /></Field>
        </div>

        <Field label="Subject / opening line"><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Message</div>
            <button type="button" onClick={compose} disabled={aiBusy || !accountId} className="btn-primary text-xs">
              <Sparkles size={14} /> {aiBusy ? 'Composing…' : 'AI Outreach Composer'}
            </button>
          </div>
          <textarea rows={10} className="input terminal text-[13px]" placeholder="Message body…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <ErrorBlock error={aiErr} />
          {activeAccount?.opening_line ? (
            <div className="rounded-md border border-navy-600 bg-navy-700/40 p-2 text-xs text-slate-400">
              <span className="font-mono uppercase">Suggested opening:</span>
              <div className="mt-1 italic text-slate-300">{activeAccount.opening_line}</div>
            </div>
          ) : null}
        </div>

        <Field label="Response notes (optional)"><textarea rows={2} className="input" value={form.response_notes} onChange={(e) => setForm({ ...form, response_notes: e.target.value })} /></Field>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving || !accountId} className="btn-primary"><Send size={14} /> {saving ? 'Saving…' : 'Log reach out'}</button>
        </div>
      </form>
    </Modal>
  );
}
