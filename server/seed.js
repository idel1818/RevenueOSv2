import { db } from './db.js';

const ENTERTAINMENT = [
  ['Netflix', 'Entertainment', 'US', 2400, 9, 1200000,
    'Legacy encoding + microservices sprawl; velocity bottlenecks as eng headcount grows faster than output.',
    'Parallel Devin agents refactor microservices and auto-generate integration tests across the fleet.',
    'Noticed Netflix is doubling down on creator tooling — Devin runs parallel on multi-repo migrations (Linktree shipped a 6-month migration in 3 weeks).'],
  ['Warner Bros Discovery', 'Entertainment', 'US', 1800, 8, 950000,
    'Post-merger tech stack consolidation — 4 overlapping streaming platforms, massive legacy code debt.',
    'Devin as the migration engine for platform consolidation — batch refactors + test coverage in one pass.',
    'WBD is still unwinding HBO Max + Discovery+ infra. Goldman used Devin to hit 3-4x eng velocity on exactly this kind of consolidation.'],
  ['Disney', 'Entertainment', 'US', 2200, 9, 1100000,
    'Disney+ scale + ESPN streaming re-architecture; security remediation backlog in legacy Java services.',
    'Security remediation + test coverage lanes on legacy services without pulling eng off roadmap work.',
    'Saw the ESPN DTC push — curious if the Disney platform eng team is looking at autonomous agents for the legacy Java fleet.'],
  ['Spotify', 'Entertainment', 'UK', 1600, 9, 850000,
    'Backstage + microservices explosion — developer experience plateau despite huge platform investment.',
    'Devin plugs into Backstage as the remediation layer: auto-upgrades, dep bumps, and test backfill.',
    'Spotify wrote the book on platform eng — Devin is what the next chapter looks like (agents owning the backlog, not dashboards about it).'],
  ['Paramount+', 'Entertainment', 'US', 900, 7, 500000,
    'CBS/Viacom legacy merger debt + cost pressure from streaming losses.',
    'Cost-effective migration velocity: ship the consolidation roadmap with existing headcount.',
    'Paramount is under real cost pressure — Devin is how you ship a 2-year migration in 6 months without hiring.'],
  ['Peacock/NBCU', 'Entertainment', 'US', 1100, 7, 550000,
    'Peacock cost structure overhaul + Sky tech integration across regions.',
    'Cross-region refactor + test coverage without proportional headcount growth.',
    'Peacock + Sky integration is a migration problem — Devin does exactly this on a fraction of the timeline.'],
  ['DAZN', 'Entertainment', 'UK', 700, 8, 450000,
    'Live sports streaming scale + constant new rights onboarding requiring platform flexibility.',
    'Parallel agents ship new rights integrations while backfilling test coverage on core streaming path.',
    'DAZN ships a new rights integration every few weeks — Devin can own the pattern once and replicate it in parallel.'],
  ['Sky', 'Entertainment', 'UK', 1400, 8, 750000,
    'Comcast-era platform modernisation across Sky Q, Sky Glass, NOW TV.',
    'Devin owns the modernisation lane — refactor, migrate, test — so human eng stay on product.',
    'Sky has 3 streaming platforms converging — Devin is the cleanest way to actually finish that roadmap.'],
  ['BBC', 'Entertainment', 'UK', 1200, 7, 600000,
    'iPlayer + Sounds + News app stack modernisation under public-sector cost constraints.',
    'Security remediation + migration work done by agents — no net new heads, no FTE politics.',
    'The iPlayer modernisation programme is a perfect Devin fit — it\'s bounded, well-spec\'d, and the ROI is obvious.'],
  ['ITV', 'Entertainment', 'UK', 600, 6, 350000,
    'ITVX relaunch tech debt + advertiser integrations slowing ship speed.',
    'Devin parallel agents on advertiser integration patterns + streaming path test coverage.',
    'ITVX is still paying down relaunch debt — Devin can clear the backlog on advertiser integrations quietly in the background.'],
  ['Lionsgate', 'Entertainment', 'US', 400, 6, 280000,
    'Post-Starz spinoff platform split + content delivery infra in flux.',
    'Migration + test coverage on the decoupled infra while the org restructures.',
    'The Starz spin-off leaves a real migration task — Devin does that kind of work without needing 20 new hires.'],
  ['Sony Pictures', 'Entertainment', 'US', 800, 7, 450000,
    'Production + distribution tech sprawl across film, TV, streaming subs.',
    'Cross-division migration + security lanes — unified by Devin working across repos.',
    'Sony\'s tech footprint spans film, TV, games, music — Devin is the one thing that works across all of them.'],
  ['Universal Music Group', 'Entertainment', 'US', 500, 7, 380000,
    'Rights management + royalty platform modernisation.',
    'Legacy royalty systems modernisation without risking revenue processing.',
    'UMG royalty systems are the definition of "can\'t afford to break" — Devin does it with full test coverage by default.'],
  ['Live Nation', 'Entertainment', 'US', 700, 7, 420000,
    'Ticketmaster platform scale + fraud/security remediation under regulator spotlight.',
    'Security remediation at scale — Devin owns the CVE backlog on core ticketing services.',
    'Ticketmaster is under regulator pressure — Devin closes security remediation tickets faster than a dedicated team of 10.'],
  ['Electronic Arts', 'Entertainment', 'US', 1500, 8, 750000,
    'Live services + cross-studio platform consolidation; Frostbite engine services modernisation.',
    'Devin as the engine team multiplier: refactor, migrate, test across studios.',
    'EA\'s cross-studio tech consolidation is a textbook Devin job — pattern once, apply everywhere.'],
  ['Take-Two Interactive', 'Entertainment', 'US', 900, 7, 500000,
    'Rockstar + 2K cross-studio infra; live services backlog.',
    'Live services refactor + migration lanes across studios.',
    'Live services infra is where game studios drown — Devin is the only thing that scales the cleanup.']
];

const FINANCIAL_SERVICES = [
  ['Goldman Sachs', 'Financial Services', 'US', 11000, 10, 2500000,
    'Legacy COBOL + Java + C++ mainframe modernisation; 40-year codebase debt.',
    'Goldman is already seeing 3-4x eng velocity on legacy mainframe migration with Devin.',
    'I work closely with the Goldman platform team — they\'re running Devin at 3-4x velocity on the legacy Java modernisation. Want to compare notes?'],
  ['Barclays', 'Financial Services', 'UK', 6000, 9, 1600000,
    'Core banking modernisation + regulatory compliance code changes at scale.',
    'Devin owns the compliance-driven code change lane (Basel, FCA, etc) — specified, repeatable, perfect agent work.',
    'Basel IV + ring-fencing code changes are exactly the kind of work Devin dominates — bounded, regulated, and well-spec\'d.'],
  ['HSBC', 'Financial Services', 'UK', 8000, 9, 1900000,
    'Pan-regional platform split (ring-fencing) + legacy COBOL migration.',
    'Multi-region platform split + migration — Devin parallel agents across geos.',
    'HSBC ring-fencing is a multi-year migration — Devin compresses that timeline dramatically.'],
  ['Lloyds Banking Group', 'Financial Services', 'UK', 4500, 8, 1100000,
    'IBM mainframe + legacy Java; strategic move to cloud under cost pressure.',
    'Mainframe-to-cloud migration owned by Devin; humans approve, agents execute.',
    'Lloyds cloud migration is the perfect place for Devin — low-risk, well-bounded, and the savings pay for the deployment in the first quarter.'],
  ['Standard Chartered', 'Financial Services', 'UK', 3500, 8, 950000,
    'Pan-Asian legacy platform modernisation + trade finance code debt.',
    'Cross-region trade finance modernisation with agent-driven test coverage.',
    'Standard Chartered trade finance platform is textbook Devin territory — high complexity, high stakes, well-defined.'],
  ['NatWest', 'Financial Services', 'UK', 3000, 7, 750000,
    'Core banking transformation + open banking API surface expansion.',
    'Open banking API surface — Devin generates + tests endpoints with full coverage.',
    'NatWest open banking surface area keeps growing — Devin is how you ship it safely without doubling the team.'],
  ['Deutsche Bank', 'Financial Services', 'DACH', 5500, 9, 1400000,
    'Strategic tech overhaul + massive COBOL/Java migration; cost-out mandate.',
    'Cost-out via Devin — agents replace contractor-heavy migration teams.',
    'Deutsche Bank cost-out + tech overhaul = Devin. This is the exact profile where Goldman saw 3-4x.'],
  ['Allianz', 'Financial Services', 'DACH', 4000, 8, 1000000,
    'Insurance core system (MAI) modernisation across pan-EU entities.',
    'Pan-EU insurance core modernisation — parallel agents across entities.',
    'Allianz MAI rollout is the definition of a repeatable migration — Devin executes the pattern across every entity in parallel.'],
  ['Munich Re', 'Financial Services', 'DACH', 1500, 7, 600000,
    'Actuarial + claims platform modernisation under solvency II regime.',
    'Claims + actuarial system migration with regulatory test coverage.',
    'Solvency II test coverage is the biggest hidden cost in reinsurance tech — Devin generates it as a byproduct.']
];

const DACH = [
  ['SAP', 'Enterprise Software', 'DACH', 30000, 10, 2000000,
    'S/4HANA migration backlog at customers — need to ship tooling faster; internal ABAP->Java migration.',
    'Devin as internal migration engine + S/4HANA tooling accelerator.',
    'SAP has the biggest migration job in tech (every S/4HANA customer) — Devin is how that finishes in this decade.'],
  ['Siemens', 'Industrial', 'DACH', 6500, 8, 1400000,
    'Mindsphere + digital industries software stack modernisation.',
    'Industrial software modernisation with safety-critical test coverage.',
    'Siemens Mindsphere + DI software needs the same kind of test-driven migration Goldman is doing — Devin fits exactly.'],
  ['Deutsche Telekom', 'Telecommunications', 'DACH', 4000, 7, 900000,
    'BSS/OSS modernisation + 5G network function virtualisation.',
    'Telco BSS/OSS migration lane + NFV code generation.',
    'Telco BSS/OSS is the unsung migration monster — Devin eats this kind of work for breakfast.'],
  ['BMW Group', 'Automotive', 'DACH', 3500, 8, 950000,
    'Embedded + cloud vehicle software convergence; software-defined vehicle push.',
    'SDV code migration + test coverage at automotive safety standards.',
    'Software-defined vehicle is where BMW is betting — Devin is how you ship the code without hiring 2,000 engineers.'],
  ['Mercedes-Benz', 'Automotive', 'DACH', 3000, 8, 900000,
    'MB.OS build-out + legacy in-car platform migration.',
    'MB.OS migration + in-car platform test coverage.',
    'MB.OS is a platform bet — Devin is how you actually hit the 2025+ timelines without slipping.'],
  ['Bosch', 'Industrial', 'DACH', 4500, 7, 850000,
    'Mobility + industrial software convergence; massive embedded footprint.',
    'Embedded + cloud parallel lanes with safety-critical test coverage.',
    'Bosch has more embedded code than most of Silicon Valley combined — Devin is the first thing that scales to that size.'],
  ['Volkswagen', 'Automotive', 'DACH', 4500, 7, 900000,
    'CARIAD software turnaround — historically troubled, now critical path.',
    'Devin as the CARIAD turnaround multiplier — ship the roadmap VW promised investors.',
    'CARIAD is the most-watched software turnaround in Europe — Devin is what makes the timeline believable.']
];

const ISRAELI = [
  ['Check Point', 'Cybersecurity', 'Israel', 2500, 9, 850000,
    'Security remediation across customer-facing products + Infinity platform modernisation.',
    'Devin owns the CVE + remediation lane across the product suite.',
    'Check Point lives and dies on security remediation velocity — Devin closes CVEs at 10x the rate of a dedicated team.'],
  ['Wix', 'Internet', 'Israel', 2800, 8, 700000,
    'Massive monolith->microservices migration + editor platform modernisation.',
    'Monolith decomposition with test coverage generated by agents.',
    'Wix monolith decomposition is a multi-year project — Devin ships it in a fraction of the time with full tests.'],
  ['Monday.com', 'SaaS', 'Israel', 1500, 8, 550000,
    'Platform scale + new product line expansion (CRM, Dev, Work Management).',
    'Parallel agents shipping new product modules on shared platform.',
    'Monday is betting on multi-product platform — Devin is how you ship 3 products with the team of 1.'],
  ['Amdocs', 'Telecom Software', 'Israel', 8000, 7, 1200000,
    'Telco customer modernisation programmes (BSS/OSS) at massive scale.',
    'Devin as the Amdocs delivery multiplier — ship customer migrations faster at lower cost.',
    'Amdocs margins live and die on delivery velocity — Devin is a direct margin lever.'],
  ['CyberArk', 'Cybersecurity', 'Israel', 1800, 9, 650000,
    'Identity platform modernisation + security posture across product suite.',
    'Identity platform migration + CVE remediation with parallel agents.',
    'CyberArk is the identity backbone — any migration risk is existential. Devin ships it with test coverage built in.'],
  ['Mobileye', 'Automotive', 'Israel', 2800, 8, 750000,
    'EyeQ platform software + autonomous driving stack scaling.',
    'ADAS software test coverage + platform migration at safety-critical standard.',
    'Mobileye ships software that cars run on — Devin is built for exactly this level of test discipline.']
];

const US_ENTERPRISE = [
  ['Microsoft', 'Enterprise Software', 'US', 60000, 9, 1800000,
    'Windows + Azure + Office legacy code debt at unimaginable scale.',
    'Devin at MS scale — parallel agents on the world\'s largest monorepo set.',
    'MS has more legacy code than any company on Earth — Devin is the only thing that can even scope the job.'],
  ['Salesforce', 'Enterprise Software', 'US', 12000, 8, 1100000,
    'Apex + Lightning platform modernisation + acquisition integration backlog (Slack, MuleSoft, Tableau).',
    'Acquisition integration + Apex modernisation with agent-driven testing.',
    'Salesforce\'s acquisition integration backlog is massive — Devin closes it without heroics.'],
  ['Adobe', 'Enterprise Software', 'US', 8000, 8, 900000,
    'Creative Cloud + Experience Cloud platform convergence.',
    'Cross-cloud platform migration with test coverage lanes.',
    'Adobe\'s Creative/Experience convergence is a migration story — Devin is how you actually ship it.'],
  ['Uber', 'Mobility', 'US', 5000, 8, 800000,
    'Monolith -> microservices ongoing + Java/Go migration.',
    'Uber-scale migration with parallel agents on independent services.',
    'Uber already spends eng cycles on internal tooling for migration — Devin replaces that tooling with finished migrations.'],
  ['Airbnb', 'Marketplace', 'US', 3000, 8, 700000,
    'Ruby/Rails -> Java/Kotlin migration + platform modernisation.',
    'Rails-to-JVM migration pattern repeated by Devin across services.',
    'Airbnb\'s Rails-to-Java journey is exactly the pattern Devin executes best — bounded, repeatable, per-service.'],
  ['Stripe', 'Fintech', 'US', 5000, 9, 900000,
    'Ruby monolith scale + payments platform regulatory complexity.',
    'Regulatory-driven code changes across the payments platform, executed by Devin with test coverage.',
    'Stripe regulatory work is a perpetual engine — Devin turns it from a tax into a managed lane.'],
  ['Coinbase', 'Fintech', 'US', 2500, 8, 600000,
    'Security remediation + regulatory compliance across trading/custody platforms.',
    'Compliance + security lanes owned by Devin; humans stay on product.',
    'Coinbase compliance workload is a full-time tax — Devin owns that lane so humans can ship product.'],
  ['Palantir', 'Enterprise Software', 'US', 2000, 8, 650000,
    'Foundry + Apollo platform evolution at customer scale.',
    'Customer-specific Foundry integrations shipped by Devin in parallel.',
    'Palantir\'s FDE model is brilliant — Devin is what multiplies every FDE by 3x.']
];

const ALL = [
  ...ENTERTAINMENT, ...FINANCIAL_SERVICES, ...DACH, ...ISRAELI, ...US_ENTERPRISE
];

const COMPETITORS = [
  {
    name: 'Cursor',
    valuation: '$50B',
    arr: '$2B+',
    differentiator: 'IDE-layer incumbent — raised $2B at $50B valuation in April 2026.',
    vs_devin_status: 'losing',
    battlecard_json: JSON.stringify({
      badge: 'They win — IDE layer',
      recent: 'Raised $2B at $50B valuation (April 2026).',
      strength: 'Viral developer adoption — de facto IDE for AI-native engineers.',
      weakness: 'IDE agent scoped to the open project, human-in-the-loop at every step — no overnight migrations, no parallel ticket ownership, no VPC-grade deploy story.',
      one_liner: 'Cursor is the IDE, Devin is the autonomous teammate — they run on totally different surfaces. Keep Cursor for day-to-day editing; Devin owns the tickets no one wants.',
      strengths: ['Best-in-class IDE UX', 'Viral developer adoption', '$2B raised April 2026'],
      weaknesses: ['No true autonomous mode', 'No parallel agents on a single ticket fleet', 'No VPC-grade enterprise deploy', 'Still requires human in the loop for every step'],
      objections: [
        { objection: 'Our engineers love Cursor — why switch?', response: 'You don\'t switch. Cursor is the IDE, Devin is the autonomous agent. They\'re complementary. Devin owns the tickets engineers don\'t want to do — migrations, test coverage, CVEs.', proof: 'Nubank runs both — Cursor for day-to-day editing, Devin for the 12x velocity lanes.' },
        { objection: 'Cursor Agent does the same thing.', response: 'Cursor Agent is scoped to the file/project you\'re in and needs approval at every step. Devin runs parallel, owns tickets end-to-end, and produces PRs with tests.', proof: 'Linktree shipped a 6-month migration in 3 weeks running Devin in parallel.' },
        { objection: 'Cursor is cheaper per seat.', response: 'Devin isn\'t a per-seat tool. It\'s a ticket-completing agent — priced per outcome, not per developer. A single Devin deployment replaces the contractor budget you\'re already spending on migrations.', proof: 'Goldman Sachs sees 3-4x velocity at a fraction of contractor cost.' }
      ]
    })
  },
  {
    name: 'GitHub Copilot',
    valuation: 'Microsoft ($3T)',
    arr: '~$500M-1B est.',
    differentiator: 'Default bundled with enterprise GitHub; distribution at procurement layer.',
    vs_devin_status: 'losing',
    battlecard_json: JSON.stringify({
      badge: 'They win — distribution default',
      strength: 'Bundled with GitHub — shows up on every enterprise contract without a new procurement cycle.',
      weakness: 'Autocomplete-first surface. Copilot Workspace is a planner, not an executor — no autonomous ticket completion, locked to GitHub, no cross-repo parallel agents.',
      one_liner: 'Copilot writes lines, Devin ships PRs. Goldman has Copilot too — Devin is what moved the velocity needle 3-4x.',
      strengths: ['Distribution via GitHub', 'Brand + procurement trust', 'Bundled with existing GitHub seat'],
      weaknesses: ['Autocomplete-first, not agent-first', 'No autonomous task completion', 'Copilot Workspace still gated/slow', 'Locked to GitHub'],
      objections: [
        { objection: 'We already have Copilot.', response: 'Copilot writes lines. Devin ships PRs. They operate on totally different surfaces of your eng org.', proof: 'Goldman has Copilot too — Devin is what moved the velocity needle 3-4x.' },
        { objection: 'Copilot Workspace does agents.', response: 'Workspace is a planner that generates a plan for you to execute. Devin is a teammate that executes.', proof: 'Linktree parallel Devins each shipped a full migration concurrently — no human in the loop on the work itself.' },
        { objection: 'MSFT is safer.', response: 'Cognition is an enterprise VPC deploy with security review done at Goldman, Nubank, and other top 5 banks. Safety isn\'t the vendor — it\'s the architecture.', proof: 'Every Devin enterprise deploy ships in-VPC with audit logs and zero data egress.' }
      ]
    })
  },
  {
    name: 'Claude Code',
    valuation: 'Anthropic ($380B)',
    arr: '$2.5B',
    differentiator: 'Terminal-native CLI. Interactive not autonomous. Engineers direct it — Devin delegates.',
    vs_devin_status: 'winning',
    battlecard_json: JSON.stringify({
      badge: 'We win — not an autonomous agent',
      strength: 'Direct, low-friction CLI access to frontier Claude models — great developer ergonomics.',
      weakness: 'Interactive tool, not an autonomous agent. No ticket orchestration, no VPC enterprise deploy, no parallel agents with shared state, no overnight execution.',
      one_liner: 'Claude Code is a terminal CLI — you direct every step. Devin delegates: take a ticket, finish it, open the PR. Different product category entirely.',
      strengths: ['Direct access to Claude', 'Great terminal ergonomics', '$2.5B ARR on Anthropic balance sheet'],
      weaknesses: ['Interactive CLI not an autonomous agent', 'No ticket orchestration', 'No VPC enterprise deploy', 'No parallel agents with shared state'],
      objections: [
        { objection: 'We use Claude Code already.', response: 'Claude Code is a dev tool. Devin is a platform — it takes a ticket, runs to completion, opens a PR, handles review feedback. That\'s the difference between a command-line tool and a teammate.', proof: 'Nubank reports 12x velocity using Devin — not possible with CLI tooling alone.' },
        { objection: 'Isn\'t it just Claude under the hood?', response: 'Devin orchestrates multiple models + tools + sandboxes + review loops. The model is a fraction of the product.', proof: 'The SWE-Bench performance gap is the clearest evidence — orchestration matters more than raw model.' }
      ]
    })
  },
  {
    name: 'OpenAI Codex',
    valuation: 'OpenAI ($300B+)',
    arr: 'Part of OpenAI $24B',
    differentiator: 'Ephemeral sandboxes vs Devin persistent VM. No Goldman reference. No 2yr production track record.',
    vs_devin_status: 'losing',
    battlecard_json: JSON.stringify({
      badge: 'Losing — no enterprise VPC',
      strength: 'OpenAI brand and ChatGPT distribution put Codex in front of every dev team.',
      weakness: 'Ephemeral sandboxes reset between runs — no persistent VM, no VPC deploy, no production reference at Goldman/Nubank scale, no 2-year enterprise track record.',
      one_liner: 'Codex runs in ephemeral sandboxes — Devin runs on persistent VMs inside your VPC, with the production track record and references to prove it.',
      strengths: ['OpenAI brand + distribution', 'Close to frontier models', 'ChatGPT ecosystem'],
      weaknesses: ['Ephemeral sandboxes, no persistent VM', 'No enterprise VPC', 'No Goldman-tier reference', 'No 2-year production track record'],
      objections: [
        { objection: 'OpenAI is the safer bet.', response: 'For consumer, yes. For enterprise eng work, model quality is table stakes — orchestration + VPC deploy + audit trails are what ship. Devin is the only production-grade option here.', proof: 'Goldman, top-5 bank, runs Devin in-VPC with full audit — Codex isn\'t an option there.' }
      ]
    })
  },
  {
    name: 'Replit',
    valuation: '$9B',
    arr: '~$150-200M',
    differentiator: 'Consumer/SMB. Builds new apps. Devin maintains enterprise codebases. Different buyer entirely.',
    vs_devin_status: 'winning',
    battlecard_json: JSON.stringify({
      badge: 'We win — different market',
      strength: 'Best-in-class prototyping and SMB app builder — magical for net-new projects.',
      weakness: 'Consumer/SMB focus — no on-prem/VPC story, no enterprise legacy migration track record, brittle on large codebases.',
      one_liner: 'Replit builds new apps for SMBs and consumers. Devin maintains and modernises enterprise codebases. Different product, different buyer.',
      strengths: ['Beloved prototyping tool', 'Great free tier', 'Agent feels magical for new projects', '$9B valuation'],
      weaknesses: ['Consumer/SMB focus', 'No on-prem/VPC story', 'Brittle on large legacy repos', 'Not built for enterprise migration work'],
      objections: [
        { objection: 'We saw Replit agent do cool demos.', response: 'Demos on new projects ≠ shipping on a 20-year-old Java codebase. Devin is built for the latter.', proof: 'Goldman legacy Java migration is the stress test — Devin handles it, Replit agent doesn\'t scope.' }
      ]
    })
  },
  {
    name: 'Factory',
    valuation: '$1.5B',
    arr: 'Early / undisclosed',
    differentiator: 'Claimed differentiator is multi-model switching — TechCrunch noted Cursor already does this.',
    vs_devin_status: 'winning',
    battlecard_json: JSON.stringify({
      badge: 'We win — 1/7th our valuation',
      recent: 'Raised $150M at $1.5B valuation on April 16 2026.',
      strength: 'Fresh capital ($150M raised April 16 2026) and growing enterprise narrative around droids/teams.',
      weakness: 'Multi-model switching — their stated differentiator — is already shipped by Cursor (per TechCrunch). No Goldman-tier reference, much smaller deployed base.',
      one_liner: 'Factory raised $150M in April at 1/7th our valuation. Their differentiator — multi-model switching — is already table stakes. Ask them for their Goldman-scale reference.',
      strengths: ['$150M raised April 2026', '$1.5B valuation', 'Good narrative around droids/teams'],
      weaknesses: ['1/7th of Cognition\'s valuation', 'No Goldman-tier reference customer', 'Multi-model switching is already commoditised', 'Much smaller deployed base'],
      objections: [
        { objection: 'Factory claims similar results.', response: 'Ask for the reference customer name and the scale. Devin references include top 5 banks and top 5 fintechs running in production at scale.', proof: 'Goldman 3-4x, Nubank 12x — ask who Factory has at that scale.' }
      ]
    })
  },
  {
    name: 'Augment Code',
    valuation: '$1.5B est.',
    arr: 'Early',
    differentiator: 'Requires human approval at each agent step. Cannot run overnight migrations. Devin delegates end-to-end.',
    vs_devin_status: 'winning',
    battlecard_json: JSON.stringify({
      badge: 'We win — structured oversight slows them down',
      strength: 'Strong enterprise marketing + good context engine for large codebases.',
      weakness: 'Structured oversight requires human approval at every agent step — cannot run overnight migrations, cannot truly delegate, no parallel ticket fleet.',
      one_liner: 'Augment requires human approval at every step — great if you want oversight, wrong tool if you want to ship a 6-month migration in 3 weeks overnight.',
      strengths: ['Enterprise-focused marketing', 'Good context engine for large codebases', 'Competitive pricing'],
      weaknesses: ['Human-in-the-loop at every agent step', 'Cannot run overnight migrations', 'No end-to-end delegation', 'No parallel agents'],
      objections: [
        { objection: 'Augment indexes our codebase too.', response: 'Indexing ≠ execution. Augment helps devs write code. Devin finishes tickets.', proof: 'Indexing is table stakes for Devin too — the differentiator is autonomy.' }
      ]
    })
  },
  {
    name: 'JetBrains AI',
    valuation: 'Private',
    arr: 'Embedded in JetBrains subs',
    differentiator: 'Plugin-based assistant. No autonomous execution. European distribution strength only.',
    vs_devin_status: 'winning',
    battlecard_json: JSON.stringify({
      badge: 'We win — IDE assistant not autonomous agent',
      strength: 'Huge installed JetBrains IDE footprint — incumbent relationship across European enterprise Java and JVM shops.',
      weakness: 'Plugin-based IDE assistant only — no autonomous execution, no ticket orchestration, distribution strength largely limited to Europe.',
      one_liner: 'JetBrains AI is an IDE plugin — keep it for editor assist. Devin runs at the ticket layer with autonomous execution. Zero overlap.',
      strengths: ['Huge JetBrains IDE footprint', 'Incumbent enterprise relationship', 'Strong European distribution'],
      weaknesses: ['Plugin-based assistant, not an agent', 'No autonomous execution', 'IDE-scoped only', 'European distribution strength only'],
      objections: [
        { objection: 'Our JetBrains shop uses JetBrains AI.', response: 'Great — keep it for IDE assist. Devin runs at the ticket layer. They don\'t overlap.', proof: 'Most Devin customers also use an IDE assistant — zero conflict.' }
      ]
    })
  }
];

// Contacts pre-populated for the top-10 accounts by ICP score.
// Keyed by exact account name — inserted only if the account has no contacts yet.
const TOP_CONTACTS = [
  { account: 'Goldman Sachs',          name: 'Marco Argenti',       title: 'CTO',                                  linkedin: 'https://linkedin.com/in/marcoargenti',     notes: 'Oversees all engineering modernisation at Goldman — reports directly to the CEO. Already the Devin reference exec.' },
  { account: 'Netflix',                name: 'Elizabeth Stone',     title: 'CTO',                                  linkedin: 'https://linkedin.com/in/elizabethstone',   notes: 'Owns all of Netflix engineering — the decision-maker for any platform-wide agent deployment.' },
  { account: 'Disney',                 name: 'Jamie Voris',         title: 'CTO',                                  linkedin: 'https://linkedin.com/in/jamiedvoris',      notes: 'Runs Disney Streaming + studio technology — the buyer for any cross-division migration tooling.' },
  { account: 'Spotify',                name: 'Björn Petersen',      title: 'CTO Engineering',                      linkedin: 'https://linkedin.com/in/bjornpetersen',    notes: 'Owns the Backstage + microservices platform — the right seat for a platform-layer agent conversation.' },
  { account: 'SAP',                    name: 'Thomas Saueressig',   title: 'Head of SAP Product Engineering',      linkedin: 'https://linkedin.com/in/thomas-saueressig', notes: 'Runs SAP Product Engineering — directly owns modernisation of the core SAP codebase.' },
  { account: 'Barclays',               name: 'Mark Ashton-Rigby',   title: 'Group CTO',                            linkedin: 'https://linkedin.com/in/markashtonrigby',  notes: 'Group CTO for Barclays — sponsor for every group-wide engineering platform decision.' },
  { account: 'HSBC',                   name: 'Aman Kohli',          title: 'Group CTO',                            linkedin: 'https://linkedin.com/in/amankohli',        notes: 'Group CTO at HSBC — owns the multi-region legacy Java estate that maps 1:1 to Goldman\'s Devin deployment.' },
  { account: 'Warner Bros Discovery',  name: 'Avi Saxena',          title: 'CTO',                                  linkedin: 'https://linkedin.com/in/avisaxena',        notes: 'CTO for WBD — the exec unwinding the HBO Max + Discovery+ merger tech debt.' },
  { account: 'Siemens',                name: 'Hanna Hennig',        title: 'CIO',                                  linkedin: 'https://linkedin.com/in/hannahennig',      notes: 'Group CIO at Siemens — the economic buyer for any enterprise-wide engineering transformation.' },
  { account: 'Deutsche Telekom',       name: 'Abdu Mudesir',        title: 'Group CTO',                            linkedin: 'https://linkedin.com/in/abdumudesir',      notes: 'Group CTO at Deutsche Telekom — owns modernisation across DT + T-Mobile tech stacks.' }
];

function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM accounts').get().c;
  let insertedAccounts = 0;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO accounts (name, industry, territory, eng_headcount, icp_score, deal_value, pain_point, devin_use_case, opening_line)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction(() => {
      for (const row of ALL) insert.run(...row);
    });
    tx();
    insertedAccounts = ALL.length;
  } else {
    console.log(`[seed] ${count} accounts already present — keeping existing data.`);
  }

  // Competitors: upsert so the Competition card data stays in sync with the
  // latest valuation / ARR / battlecard content on every server restart.
  const compUpsert = db.prepare(`
    INSERT INTO competitors (name, valuation, arr, differentiator, vs_devin_status, battlecard_json)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      valuation = excluded.valuation,
      arr = excluded.arr,
      differentiator = excluded.differentiator,
      vs_devin_status = excluded.vs_devin_status,
      battlecard_json = excluded.battlecard_json
  `);
  const compTx = db.transaction(() => {
    for (const c of COMPETITORS) {
      compUpsert.run(c.name, c.valuation, c.arr, c.differentiator, c.vs_devin_status, c.battlecard_json);
    }
  });
  compTx();

  // Top-10 contacts: seed only when the account has zero contacts, so manually
  // added contacts are never overwritten.
  const findAccount = db.prepare('SELECT id FROM accounts WHERE name = ?');
  const countContacts = db.prepare('SELECT COUNT(*) as c FROM contacts WHERE account_id = ?');
  const insertContact = db.prepare(`
    INSERT INTO contacts (account_id, name, title, linkedin_url, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  let insertedContacts = 0;
  const contactTx = db.transaction(() => {
    for (const c of TOP_CONTACTS) {
      const acct = findAccount.get(c.account);
      if (!acct) continue;
      const existing = countContacts.get(acct.id).c;
      if (existing > 0) continue;
      insertContact.run(acct.id, c.name, c.title, c.linkedin, c.notes);
      insertedContacts += 1;
    }
  });
  contactTx();

  console.log(`[seed] accounts: +${insertedAccounts} (total ${db.prepare('SELECT COUNT(*) as c FROM accounts').get().c}) · competitors upserted: ${COMPETITORS.length} · contacts seeded: ${insertedContacts}`);
}

seed();

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(0);
}
