import React, { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';
import { formatUTC } from '../lib/format.js';

const LINKS = [
  ['command', 'Command'],
  ['accounts', 'Accounts'],
  ['outreach', 'Outreach'],
  ['intelligence', 'Intelligence'],
  ['competition', 'Competition'],
  ['salesKit', 'Sales Kit']
];

export function TopNav({ current, onNavigate }) {
  const [now, setNow] = useState(formatUTC());
  useEffect(() => {
    const t = setInterval(() => setNow(formatUTC()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-600 bg-navy-800/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-3">
        <button
          onClick={() => onNavigate('command')}
          className="flex items-center gap-2 text-white"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-electric/20 text-electric">
            <Terminal size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Cognition</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Revenue OS</div>
          </div>
        </button>

        <nav className="flex items-center gap-1">
          {LINKS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                current === key
                  ? 'bg-electric/15 text-electric'
                  : 'text-slate-300 hover:bg-navy-600 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
          <span>{now}</span>
          <span className="flex items-center gap-1.5">
            <span className="live-dot h-2 w-2 rounded-full bg-green-500" />
            <span className="text-green-400">LIVE</span>
          </span>
        </div>
      </div>
    </header>
  );
}
