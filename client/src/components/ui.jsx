import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton rounded ${className}`} />;
}

export function Empty({ icon: Icon = Inbox, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-slate-400">
      <Icon size={24} />
      <div className="text-sm text-slate-300">{title}</div>
      {hint ? <div className="max-w-xs text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function ErrorBlock({ error }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-900/60 bg-red-900/20 p-3 text-sm text-red-300">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <div className="font-mono text-xs">{String(error.message || error)}</div>
    </div>
  );
}

export function Section({ title, right, children, className = '' }) {
  return (
    <section className={`card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`card w-full ${sizes[size]} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        <div className="flex items-center justify-between border-b border-navy-600 p-4">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="btn-ghost text-xs">Close</button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">{label}</div>
      {children}
      {hint ? <div className="mt-1 text-[11px] text-slate-500">{hint}</div> : null}
    </label>
  );
}

export function Tabs({ tabs, current, onChange }) {
  return (
    <div className="flex border-b border-navy-600">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            current === t.key
              ? 'border-electric text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.label}
          {t.count !== undefined ? <span className="ml-1.5 text-[11px] text-slate-500">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
