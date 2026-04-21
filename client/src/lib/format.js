export function formatMoney(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '$0';
  const num = Number(n);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

export function formatNum(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '0';
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return `${num}`;
}

export function formatPct(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '0%';
  return `${(Number(n) * 100).toFixed(1)}%`;
}

export function timeAgo(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const secs = Math.round((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function formatUTC(date = new Date()) {
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss} UTC`;
}

export const STAGES = ['Uncontacted', 'Researched', 'Reached Out', 'Meeting Booked', 'Active', 'Closed Won'];

export const STAGE_COLORS = {
  'Uncontacted': 'bg-slate-700 text-slate-200',
  'Researched': 'bg-sky-900/60 text-sky-300 border border-sky-800',
  'Reached Out': 'bg-blue-900/60 text-blue-300 border border-blue-800',
  'Meeting Booked': 'bg-purple-900/60 text-purple-300 border border-purple-800',
  'Active': 'bg-amber-900/60 text-amber-300 border border-amber-800',
  'Closed Won': 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
};

export const STATUS_COLORS = {
  'Sent': 'bg-blue-900/60 text-blue-300 border border-blue-800',
  'Opened': 'bg-yellow-900/60 text-yellow-300 border border-yellow-800',
  'Responded': 'bg-emerald-900/60 text-emerald-300 border border-emerald-800',
  'Meeting Booked': 'bg-purple-900/60 text-purple-300 border border-purple-800',
  'No Response': 'bg-slate-700/70 text-slate-300 border border-slate-600',
  'Not Interested': 'bg-red-900/60 text-red-300 border border-red-800'
};

export const STATUSES = ['Sent', 'Opened', 'Responded', 'Meeting Booked', 'No Response', 'Not Interested'];

export function icpColor(score) {
  if (score >= 8) return 'bg-emerald-900/60 text-emerald-300 border border-emerald-800';
  if (score >= 5) return 'bg-amber-900/60 text-amber-300 border border-amber-800';
  return 'bg-red-900/60 text-red-300 border border-red-800';
}

export const ACTIVITY_COLORS = {
  'Account Added': 'bg-sky-900/60 text-sky-300',
  'Reach Out Sent': 'bg-blue-900/60 text-blue-300',
  'Meeting Booked': 'bg-purple-900/60 text-purple-300',
  'Stage Changed': 'bg-amber-900/60 text-amber-300',
  'Note Added': 'bg-slate-700 text-slate-200',
  'Response Received': 'bg-emerald-900/60 text-emerald-300',
  'Contact Added': 'bg-teal-900/60 text-teal-300',
  'AI Research': 'bg-violet-900/60 text-violet-300'
};
