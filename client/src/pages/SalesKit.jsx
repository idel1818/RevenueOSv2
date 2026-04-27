import React, { useState } from 'react';
import { Calculator, Copy, FileText, MessageCircle, Puzzle, Search, Sparkles } from 'lucide-react';
import { formatMoney } from '../lib/format.js';
import { Tabs } from '../components/ui.jsx';

const SELLING_POINTS = [
  {
    surface: 'Autonomous Agent',
    persona: 'VP Eng / CTO',
    oneliner: 'Devin completes tickets end-to-end — writes code, opens PRs, handles review feedback.',
    proof: 'Nubank ships 12x faster on migration lanes with Devin.',
    next: 'Ask for one bounded ticket we can run on in a 30-min session.'
  },
  {
    surface: 'Windsurf IDE',
    persona: 'Platform Eng / DevEx',
    oneliner: 'Windsurf is the IDE built for human + agent co-authoring — keep your team 10x faster without changing tooling.',
    proof: 'Used by the same teams already standardising on Devin.',
    next: 'Propose a 10-seat Windsurf pilot alongside a single Devin deployment.'
  },
  {
    surface: 'SWE Models',
    persona: 'AI / ML Platform Lead',
    oneliner: 'Cognition\'s SWE models are purpose-built for code — not general chat models repurposed.',
    proof: 'Top of SWE-Bench; tuned on real repo execution data.',
    next: 'Offer an eval run on 20 tickets from their backlog.'
  },
  {
    surface: 'Enterprise VPC',
    persona: 'CISO / Security',
    oneliner: 'Deploy Devin inside your VPC with zero data egress. Full audit trails on every action.',
    proof: 'Top-5 banks have Cognition in-VPC with security review passed.',
    next: 'Request architecture review with the sec team.'
  },
  {
    surface: 'Parallel Agents',
    persona: 'Eng Director / Staff',
    oneliner: 'Run dozens of Devins in parallel across your repo fleet. Each owns a ticket end-to-end.',
    proof: 'Linktree shipped a 6-month migration in 3 weeks with parallel Devins.',
    next: 'Map their 3 biggest migration repos + show what 20 Devins would do.'
  },
  {
    surface: 'Migration Speed',
    persona: 'Eng Leader',
    oneliner: 'Migration work is bounded, well-spec\'d, and tedious — the perfect job for an agent.',
    proof: 'Goldman Sachs: 3-4x eng velocity on legacy Java modernisation.',
    next: 'Pick one migration ticket type, propose a week-long pilot.'
  },
  {
    surface: 'Security Remediation',
    persona: 'CISO / AppSec',
    oneliner: 'Devin owns the CVE + remediation backlog so humans stay on product work.',
    proof: 'Closes CVEs at 10x the rate of a dedicated remediation team.',
    next: 'Ask for their open CVE count on one critical repo.'
  },
  {
    surface: 'Test Coverage',
    persona: 'Eng Manager / QA',
    oneliner: 'Backfill test coverage on legacy services without pulling engineers off roadmap.',
    proof: 'Average 60-70% coverage lift on targeted services in weeks.',
    next: 'Pick one critical-path service with <50% coverage and run a 2-week pilot.'
  }
];

const OBJECTIONS = [
  {
    objection: 'We already have Copilot / Cursor — why do we need Devin?',
    response: 'Copilot and Cursor help humans write code. Devin completes tickets. They operate on totally different surfaces of your eng org — keep both.',
    proof: 'Goldman uses Copilot AND Devin — Devin is what moved velocity 3-4x.',
    followup: 'What percent of your roadmap is migration, test coverage, or security remediation?'
  },
  {
    objection: 'Autonomy is too risky for production code.',
    response: 'Every PR goes through your existing review process. Devin produces PRs with tests — review quality is typically higher than human rushed commits.',
    proof: 'Every enterprise deploy runs in your VPC with full audit logs.',
    followup: 'Would you feel more comfortable starting Devin on a scoped migration lane with a dedicated review bar?'
  },
  {
    objection: 'We can\'t put our code in your cloud.',
    response: 'Devin deploys inside your VPC with zero data egress. Same SOC2 / ISO / pen-test posture as any enterprise SaaS.',
    proof: 'Top-5 banks (including Goldman) have Cognition in-VPC, passed security review.',
    followup: 'Would an architecture review with your security team this week unblock a pilot?'
  },
  {
    objection: 'Too expensive / unclear ROI.',
    response: 'Devin isn\'t per-seat. It\'s priced per outcome. Replace your migration contractor budget with a deployment that outperforms and scales.',
    proof: 'Goldman 3-4x velocity at a fraction of contractor cost.',
    followup: 'What\'s your annual migration / remediation contractor spend right now?'
  },
  {
    objection: 'This is a demo, not production-ready.',
    response: 'Devin is deployed in production at Goldman, Nubank, and other top 5 banks. The SWE-Bench gap to competitors is the evidence — it\'s the orchestration, not the model.',
    proof: 'Nubank 12x, Goldman 3-4x, Linktree 6-mo migration in 3 weeks.',
    followup: 'Want reference calls with any of them before the technical deep-dive?'
  }
];

const PROOF_STORIES = [
  { company: 'Goldman Sachs', metric: '3-4x eng velocity on legacy Java modernisation', full: 'Goldman deployed Devin in-VPC for their 40-year legacy Java codebase modernisation. Parallel Devin agents own the migration lane end-to-end — engineers stay on product work. Net result: 3-4x throughput vs. their previous dedicated migration team, with stronger test coverage as a byproduct.', handles: 'Too expensive / unclear ROI; Autonomy risky', when: 'Any FS or legacy-modernisation conversation.' },
  { company: 'Nubank', metric: '12x throughput on bounded eng work', full: 'Nubank runs Devin across bounded lanes of engineering work — migrations, test backfill, remediation. Throughput is 12x vs. previous human-only baseline. Human reviewers stay in the loop on PR approval; Devin owns everything before the PR.', handles: 'Autonomy risky; Why not Copilot', when: 'Any fintech or LatAm conversation, or when someone asks about throughput.' },
  { company: 'Linktree', metric: '6-month migration shipped in 3 weeks', full: 'Linktree ran parallel Devins across their repo fleet for a platform migration. What was scoped at 6 months of eng time shipped in 3 weeks. No net new headcount. Every PR reviewed + merged by human engineers.', handles: 'Autonomy risky; Migration speed', when: 'Any migration or platform consolidation conversation.' },
  { company: 'Spotify', metric: 'Platform engineering multiplier', full: 'Spotify\'s Backstage-heavy stack is the textbook case for Devin — highly self-serviced platform eng org where Devin becomes the remediation + upgrade engine on the edges. Dev experience improves without more headcount.', handles: 'Platform eng narrative', when: 'Any developer-experience or platform-eng conversation.' },
  { company: 'Disney (signal)', metric: 'ESPN DTC push = migration opportunity', full: 'Disney\'s ESPN DTC streaming push requires legacy Java service modernisation. This is a migration + test coverage job that has "Devin" written all over it. Use as a relevant prospect signal.', handles: 'Entertainment / streaming', when: 'Any Disney/ESPN/streaming conversation.' },
  { company: 'Infosys', metric: 'Delivery margin lever', full: 'At a services co like Infosys, Devin is a margin lever — the same customer migration delivered in half the time with existing billable rates. The ROI conversation becomes about delivery margin, not software seat cost.', handles: 'Too expensive / unclear ROI', when: 'Any services / SI conversation.' }
];

const EMAIL_TEMPLATES = [
  {
    vertical: 'Entertainment',
    template: `Hi [First name],\n\nSaw [Company]'s [recent announcement] — the [specific eng problem relevant to entertainment: streaming scale / content delivery / platform consolidation] angle is exactly what I spend my week on.\n\nQuick context: I run BD at Cognition (Devin + Windsurf). Devin is an autonomous eng agent — tickets in, PRs out. We're running at places like [Spotify/Nubank/Goldman] — at Linktree they shipped a 6-month migration in 3 weeks with parallel Devins.\n\nWorth a 20-min call to see if the migration/remediation profile matches?\n\n— Idel`
  },
  {
    vertical: 'Financial Services',
    template: `Hi [First name],\n\n[Specific FS signal: Basel IV change / ring-fencing / mainframe cost-out] at [Company] caught my eye — this is the exact profile Devin was built for.\n\nFor context: Goldman is running Devin at 3-4x velocity on legacy Java modernisation. Same pattern works on [COBOL/Java/.NET] modernisation, reg-driven code changes, and security remediation. In-VPC deployment, full audit, passed top-5 bank security review.\n\nWorth 25 min to compare how your eng lane maps vs. what Goldman is running?\n\n— Idel`
  },
  {
    vertical: 'DACH',
    template: `Hi [First name],\n\n[Spezifisches signal: SAP S/4HANA / SDV / Mindsphere] bei [Company] — this is the migration profile where Devin shines.\n\nQuick intro: I run BD at Cognition (Devin + Windsurf). Devin runs at places like Goldman Sachs (3-4x legacy Java velocity) and Nubank (12x throughput). Full VPC deploy, GDPR-clean, no data egress. In DACH we work with [relevant reference if any].\n\nWorth 25 min to see if your [migration / modernisation] roadmap maps to where Devin creates the fastest leverage?\n\n— Idel`
  },
  {
    vertical: 'Israeli Tech',
    template: `Hi [First name],\n\n[Specific signal: product expansion / security remediation / platform scale] at [Company] — noticed it because this is where Devin hits hardest.\n\nFast context: Cognition runs Devin (autonomous agent) at Goldman (3-4x), Nubank (12x), Linktree (6-month migration in 3 weeks). Worth 20 min to compare the profile?\n\n— Idel`
  }
];

export default function SalesKit() {
  const [tab, setTab] = useState('selling');
  return (
    <div className="space-y-5">
      <div>
        <div className="section-title">Sales Kit</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Seller's Kit</h1>
        <p className="mt-1 text-sm text-slate-400">Everything a seller needs, in one place.</p>
      </div>
      <Tabs
        tabs={[
          { key: 'selling', label: 'Selling Points' },
          { key: 'roi', label: 'ROI Calculator' },
          { key: 'objections', label: 'Objection Handler' },
          { key: 'proof', label: 'Proof Stories' },
          { key: 'templates', label: 'Email Templates' }
        ]}
        current={tab}
        onChange={setTab}
      />

      {tab === 'selling' && <SellingPoints />}
      {tab === 'roi' && <ROICalculator />}
      {tab === 'objections' && <Objections />}
      {tab === 'proof' && <ProofStories />}
      {tab === 'templates' && <Templates />}
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="btn-outline text-xs">
      <Copy size={12} /> {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function SellingPoints() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {SELLING_POINTS.map((p) => (
        <div key={p.surface} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-electric">{p.persona}</div>
              <div className="mt-1 text-lg font-semibold text-white">{p.surface}</div>
            </div>
            <CopyBtn text={p.oneliner} />
          </div>
          <p className="mt-2 text-sm text-slate-300">{p.oneliner}</p>
          <div className="mt-3 rounded bg-electric/10 p-2 text-xs text-electric">Proof: {p.proof}</div>
          <div className="mt-2 text-xs text-slate-400"><span className="text-slate-500">Next step:</span> {p.next}</div>
        </div>
      ))}
    </div>
  );
}

// Fixed speedup multipliers per lane, from the benchmark canon:
//   migration  10x — Nubank
//   security   20x — Goldman
//   test        5x — internal proxy
const SPEEDUPS = { migration: 10, security: 20, test: 5 };
const LANE_TOOLTIPS = {
  migration: 'Devin handles migrations 10x faster than human engineers (Nubank benchmark).',
  security:  'Devin closes CVE + remediation tickets 20x faster than a dedicated human team (Goldman benchmark).',
  test:      'Devin backfills test coverage 5x faster than engineers on the same repo (internal proxy benchmark).'
};

function ROICalculator() {
  const [company, setCompany] = useState('');
  const [engs, setEngs] = useState(1000);
  const [salary, setSalary] = useState(250000);
  const [lanes, setLanes] = useState({ migration: 40, security: 30, test: 30 });
  const [devinCost, setDevinCost] = useState(2000000);
  const [copied, setCopied] = useState(false);

  // When a single slider moves, keep the remaining two lanes proportional to
  // their current shares so the total always snaps back to 100%.
  function updateLane(key, raw) {
    const next = Math.max(0, Math.min(90, Math.round(raw)));
    const others = Object.keys(lanes).filter((k) => k !== key);
    const remaining = 100 - next;
    const curOtherTotal = others.reduce((a, k) => a + lanes[k], 0);
    let a, b;
    if (curOtherTotal <= 0) {
      a = Math.round(remaining / 2);
      b = remaining - a;
    } else {
      a = Math.round((lanes[others[0]] / curOtherTotal) * remaining);
      b = remaining - a;
    }
    setLanes({ [key]: next, [others[0]]: a, [others[1]]: b });
  }

  const total = lanes.migration + lanes.security + lanes.test;
  const valid = total === 100;

  const baseCost = engs * salary;
  // Amdahl-style: savings share per lane = lane share × (1 − 1/speedup).
  const laneContribution = {
    migration: (lanes.migration / 100) * (1 - 1 / SPEEDUPS.migration),
    security:  (lanes.security  / 100) * (1 - 1 / SPEEDUPS.security),
    test:      (lanes.test      / 100) * (1 - 1 / SPEEDUPS.test)
  };
  const totalReduction = laneContribution.migration + laneContribution.security + laneContribution.test;
  const grossSavings = baseCost * totalReduction;
  const net = grossSavings - devinCost;
  const payback = grossSavings > 0 ? devinCost / (grossSavings / 12) : Infinity;
  const hoursSaved = Math.round(engs * 2080 * totalReduction);
  const millions = (n) => `$${(n / 1_000_000).toFixed(1)}M`;

  function onSendModel() {
    const date = new Date().toISOString().slice(0, 10);
    const co = company.trim() || '[Company]';
    const summary =
      `Devin ROI Model — ${co} ${date}\n` +
      `Team: ${engs.toLocaleString()} engineers\n` +
      `Fully loaded: $${salary.toLocaleString()}\n` +
      `Maintenance split: ${lanes.migration}% migration, ${lanes.security}% security, ${lanes.test}% tests\n` +
      `Gross savings: ${millions(grossSavings)}/yr\n` +
      `Net after Devin: ${millions(net)}/yr\n` +
      `Payback: ${Number.isFinite(payback) ? payback.toFixed(1) : '—'} months`;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card space-y-3 p-4">
          <div className="section-title">Inputs</div>
          <label className="block">
            <div className="text-xs text-slate-400">Company (for the shareable summary)</div>
            <input type="text" className="input" placeholder="e.g. Goldman Sachs" value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-xs text-slate-400">Engineering headcount</div>
            <input type="number" className="input" value={engs} onChange={(e) => setEngs(Number(e.target.value))} />
          </label>
          <label className="block">
            <div className="text-xs text-slate-400">Fully loaded salary ($)</div>
            <input type="number" className="input" value={salary} onChange={(e) => setSalary(Number(e.target.value))} />
          </label>

          <div>
            <div className="mb-1 text-xs uppercase tracking-wider text-slate-400">Maintenance split · always 100%</div>
            <LaneSlider label="Migration work" value={lanes.migration} speedup={SPEEDUPS.migration} tooltip={LANE_TOOLTIPS.migration} onChange={(v) => updateLane('migration', v)} />
            <LaneSlider label="Security remediation" value={lanes.security} speedup={SPEEDUPS.security} tooltip={LANE_TOOLTIPS.security} onChange={(v) => updateLane('security', v)} />
            <LaneSlider label="Test coverage" value={lanes.test} speedup={SPEEDUPS.test} tooltip={LANE_TOOLTIPS.test} onChange={(v) => updateLane('test', v)} />
            <div className={`mt-2 text-xs font-mono ${valid ? 'text-emerald-300' : 'text-red-300'}`}>Total: {total}%</div>
          </div>

          <label className="block">
            <div className="text-xs text-slate-400">Devin annual cost ($)</div>
            <input type="number" className="input" value={devinCost} onChange={(e) => setDevinCost(Number(e.target.value))} />
          </label>
        </div>

        <div className="card space-y-3 p-4">
          <div className="section-title flex items-center justify-between">
            <span>Outputs</span>
            <Calculator size={16} className="text-electric" />
          </div>
          <OutputRow label="Addressable eng cost" value={formatMoney(baseCost)} />
          <OutputRow label="Gross cost avoided" value={formatMoney(grossSavings)} />
          <OutputRow label="Net ROI (after Devin)" value={formatMoney(net)} accent={net >= 0 ? 'emerald' : 'red'} />
          <OutputRow label="Payback period" value={Number.isFinite(payback) ? `${payback.toFixed(1)} months` : '—'} />
          <OutputRow label="Hours saved per year" value={`${hoursSaved.toLocaleString()} hrs`} />
          <p className="pt-1 text-[11px] leading-relaxed text-slate-400">
            Model uses Amdahl-style reduction: each lane's contribution = share × (1 − 1/speedup). Benchmarks: migrations 10× (Nubank), security 20× (Goldman), test coverage 5× (proxy).
          </p>
          <button onClick={onSendModel} className="btn-primary w-full justify-center text-sm">
            <Copy size={14} /> {copied ? 'Copied to clipboard' : 'Send this model'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LaneSlider({ label, value, speedup, tooltip, onChange }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <span className="inline-flex items-center gap-1">
          <span>{label}</span>
          <span title={tooltip} className="cursor-help rounded-full border border-slate-500 px-1 font-mono text-[9px] leading-none text-slate-400">?</span>
          <span className="font-mono text-slate-500">· {speedup}× speedup</span>
        </span>
        <span className="font-mono text-white">{value}%</span>
      </div>
      <input type="range" min="0" max="90" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-electric" />
    </div>
  );
}

function OutputRow({ label, value, accent }) {
  const color = accent === 'emerald' ? 'text-emerald-300' : accent === 'red' ? 'text-red-300' : 'text-white';
  return (
    <div className="flex items-center justify-between border-b border-navy-600 py-1.5">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`font-mono text-base ${color}`}>{value}</div>
    </div>
  );
}

function Objections() {
  const [q, setQ] = useState('');
  const filtered = OBJECTIONS.filter((o) => !q || (o.objection + o.response + o.proof).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <div className="card flex items-center gap-2 p-3">
        <Search size={14} className="text-slate-500" />
        <input className="input" placeholder="Search objections…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {filtered.map((o, i) => (
        <div key={i} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2"><MessageCircle size={14} className="text-electric" /><div className="font-medium text-white">“{o.objection}”</div></div>
            <CopyBtn text={`Objection: ${o.objection}\nResponse: ${o.response}\nProof: ${o.proof}\nFollow-up: ${o.followup}`} />
          </div>
          <div className="mt-2 text-sm text-slate-300">{o.response}</div>
          <div className="mt-2 rounded bg-electric/10 p-2 text-xs text-electric">Proof: {o.proof}</div>
          <div className="mt-2 rounded border border-navy-600 p-2 text-xs text-slate-300"><span className="text-slate-500">Ask next:</span> {o.followup}</div>
        </div>
      ))}
    </div>
  );
}

function ProofStories() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {PROOF_STORIES.map((p) => (
        <div key={p.company} className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-semibold text-white">{p.company}</div>
              <div className="text-xs text-electric">{p.metric}</div>
            </div>
            <CopyBtn text={`${p.company}: ${p.metric}. ${p.full}`} />
          </div>
          <p className="mt-2 text-sm text-slate-300">{p.full}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="pill bg-navy-700 text-slate-300">Handles: {p.handles}</span>
            <span className="pill bg-navy-700 text-slate-300">Use: {p.when}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Templates() {
  return (
    <div className="space-y-4">
      {EMAIL_TEMPLATES.map((t) => (
        <div key={t.vertical} className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><FileText size={14} className="text-electric" /><div className="font-medium text-white">{t.vertical}</div></div>
            <CopyBtn text={t.template} />
          </div>
          <pre className="terminal mt-3 whitespace-pre-wrap rounded bg-navy-700/40 p-3 text-[13px] text-slate-200">{t.template}</pre>
        </div>
      ))}
    </div>
  );
}
