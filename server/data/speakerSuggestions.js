// Curated speaker suggestions used when ANTHROPIC_API_KEY is not configured.
// Each entry returns 5 plausible speakers based on public history of the event.
// Names/titles are real industry figures who have keynoted comparable events.
// `is_competitor=1` for any role at: Cursor, GitHub, OpenAI, Google DeepMind,
// Anthropic, Factory, Augment Code, Replit.
const COMPETITOR_COMPANIES = new Set([
  'Cursor', 'GitHub', 'OpenAI', 'Google DeepMind', 'Anthropic',
  'Factory', 'Augment Code', 'Replit',
  'Google', 'Google Cloud', 'Google Labs',
  'Microsoft', 'Microsoft AI'
]);

const BY_NAME = {
  'Google I/O 2026': [
    { name: 'Sundar Pichai', title: 'CEO', company: 'Google', topic: 'AI and the future of search' },
    { name: 'Demis Hassabis', title: 'CEO', company: 'Google DeepMind', topic: 'Gemini and frontier reasoning' },
    { name: 'Jeff Dean', title: 'Chief Scientist', company: 'Google DeepMind', topic: 'Jules — proactive coding agent' },
    { name: 'Thomas Kurian', title: 'CEO', company: 'Google Cloud', topic: 'Vertex AI and enterprise' },
    { name: 'Josh Woodward', title: 'VP', company: 'Google Labs', topic: 'Gemini Code Assist' },
  ],
  'Microsoft Build 2026': [
    { name: 'Satya Nadella', title: 'CEO', company: 'Microsoft', topic: 'AI transformation' },
    { name: 'Thomas Dohmke', title: 'CEO', company: 'GitHub', topic: 'Copilot autonomous agents' },
    { name: 'Kevin Scott', title: 'CTO', company: 'Microsoft', topic: 'Foundation models at scale' },
    { name: 'Mustafa Suleyman', title: 'CEO', company: 'Microsoft AI', topic: 'Consumer AI roadmap' },
    { name: 'Scott Guthrie', title: 'EVP Cloud + AI', company: 'Microsoft', topic: 'Azure AI platform' },
  ],
  'AWS re:Invent 2026': [
    { name: 'Matt Garman', title: 'CEO', company: 'AWS', topic: 'Cloud and AI strategy' },
    { name: 'Werner Vogels', title: 'CTO', company: 'Amazon', topic: 'Architecting for AI workloads' },
    { name: 'Swami Sivasubramanian', title: 'VP AI & Data', company: 'AWS', topic: 'Bedrock and Q Developer' },
    { name: 'Peter DeSantis', title: 'SVP Utility Computing', company: 'AWS', topic: 'Trainium and infrastructure' },
    { name: 'Andy Jassy', title: 'CEO', company: 'Amazon', topic: 'Long-term AI investment' },
  ],
  'SAP Sapphire 2026': [
    { name: 'Christian Klein', title: 'CEO', company: 'SAP', topic: 'S/4HANA and AI transformation' },
    { name: 'Thomas Saueressig', title: 'Head of Product Engineering', company: 'SAP', topic: 'SAP engineering platform' },
    { name: 'Juergen Mueller', title: 'CTO', company: 'SAP', topic: 'Joule and generative AI' },
    { name: 'Scott Russell', title: 'Chief Revenue Officer', company: 'SAP', topic: 'Customer success at scale' },
    { name: 'Sabine Bendiek', title: 'Chief People & Operating Officer', company: 'SAP', topic: 'AI-augmented workforce' },
  ],
  'Gartner IT Symposium / Xpo 2026': [
    { name: 'Daryl Plummer', title: 'Distinguished VP Analyst', company: 'Gartner', topic: 'Top strategic technology trends' },
    { name: 'Mary Mesaglio', title: 'Distinguished VP Analyst', company: 'Gartner', topic: 'CIO leadership for AI' },
    { name: 'Don Scheibenreif', title: 'Distinguished VP Analyst', company: 'Gartner', topic: 'Customer experience and AI' },
    { name: 'Hung LeHong', title: 'Distinguished VP Analyst', company: 'Gartner', topic: 'Digital business technology platform' },
    { name: 'Tina Nunno', title: 'Distinguished VP Analyst', company: 'Gartner', topic: 'CIO power and politics' },
  ],
  'Stripe Sessions 2026': [
    { name: 'Patrick Collison', title: 'CEO', company: 'Stripe', topic: 'The future of payments infrastructure' },
    { name: 'John Collison', title: 'President', company: 'Stripe', topic: 'GDP of the internet' },
    { name: 'Will Gaybrick', title: 'President', company: 'Stripe', topic: 'Enterprise revenue platform' },
    { name: 'David Singleton', title: 'CTO', company: 'Stripe', topic: 'AI for payments engineering' },
    { name: 'Eileen O\u2019Mara', title: 'CRO', company: 'Stripe', topic: 'Scaling enterprise GTM' },
  ],
  'TNW Conference 2026': [
    { name: 'Boris Veldhuijzen van Zanten', title: 'CEO', company: 'TNW', topic: 'European tech ecosystem' },
    { name: 'Yoel Roth', title: 'Head of Trust & Safety', company: 'Match Group', topic: 'Platform safety in the AI era' },
    { name: 'Ana Andres', title: 'Co-founder', company: 'Tinybird', topic: 'Real-time data infrastructure' },
    { name: 'Klaas Kersting', title: 'Investor', company: 'Berlin', topic: 'European venture landscape' },
    { name: 'Suranga Chandratillake', title: 'General Partner', company: 'Balderton Capital', topic: 'European AI investment' },
  ],
  'Money20/20 Europe 2026': [
    { name: 'Sigga Sigurdardottir', title: 'Chief Customer Officer', company: 'Saxo Bank', topic: 'Digital banking transformation' },
    { name: 'Anne Boden', title: 'Founder', company: 'Starling Bank', topic: 'Building a digital bank' },
    { name: 'Daniel Schreiber', title: 'CEO', company: 'Lemonade', topic: 'AI-native insurance' },
    { name: 'Ralph Hamers', title: 'Former CEO', company: 'UBS', topic: 'Banking transformation' },
    { name: 'Maha El Dimachki', title: 'Head of Innovation', company: 'BIS', topic: 'Central bank innovation' },
  ],
  'KubeCon + CloudNativeCon Europe 2026': [
    { name: 'Priyanka Sharma', title: 'Executive Director', company: 'CNCF', topic: 'State of cloud native' },
    { name: 'Kelsey Hightower', title: 'Principal Engineer (former)', company: 'Independent', topic: 'Production-grade Kubernetes' },
    { name: 'Tim Hockin', title: 'Principal Engineer', company: 'Google Cloud', topic: 'Kubernetes core architecture' },
    { name: 'Solomon Hykes', title: 'Founder', company: 'Dagger', topic: 'Composable CI/CD' },
    { name: 'Liz Rice', title: 'Chief Open Source Officer', company: 'Isovalent / Cisco', topic: 'eBPF and platform security' },
  ],
  'Web Summit 2026': [
    { name: 'Paddy Cosgrave', title: 'CEO', company: 'Web Summit', topic: 'State of global tech' },
    { name: 'Tony Blair', title: 'Executive Chairman', company: 'Tony Blair Institute', topic: 'AI policy and governance' },
    { name: 'Brad Smith', title: 'Vice Chair & President', company: 'Microsoft', topic: 'AI and democracy' },
    { name: 'Helle Thorning-Schmidt', title: 'Former Co-Chair', company: 'Meta Oversight Board', topic: 'Platform accountability' },
    { name: 'Yann LeCun', title: 'Chief AI Scientist', company: 'Meta', topic: 'Open source frontier AI' },
  ],
  'VivaTech 2026': [
    { name: 'Maurice L\u00e9vy', title: 'Chairman Emeritus', company: 'Publicis Groupe', topic: 'AI and the future of marketing' },
    { name: 'Arthur Mensch', title: 'CEO', company: 'Mistral AI', topic: 'European frontier models' },
    { name: 'Cl\u00e9ment Delangue', title: 'CEO', company: 'Hugging Face', topic: 'Open source AI ecosystem' },
    { name: 'C\u00e9dric O', title: 'Co-founder', company: 'Mistral AI', topic: 'EU AI policy' },
    { name: 'Octave Klaba', title: 'Founder', company: 'OVHcloud', topic: 'European sovereign cloud' },
  ],
  'Collision Conference 2026': [
    { name: 'Paddy Cosgrave', title: 'CEO', company: 'Collision', topic: 'North American tech ecosystem' },
    { name: 'Tobi L\u00fctke', title: 'CEO', company: 'Shopify', topic: 'AI-first commerce' },
    { name: 'Stewart Butterfield', title: 'Co-founder', company: 'Slack (former)', topic: 'The future of work' },
    { name: 'Mike Krieger', title: 'CPO', company: 'Anthropic', topic: 'Designing safe AI products' },
    { name: 'Daniel Dines', title: 'CEO', company: 'UiPath', topic: 'Agentic automation in the enterprise' },
  ],
  'CES 2027': [
    { name: 'Gary Shapiro', title: 'CEO', company: 'Consumer Technology Association', topic: 'State of consumer tech' },
    { name: 'Lisa Su', title: 'CEO', company: 'AMD', topic: 'AI compute roadmap' },
    { name: 'Jensen Huang', title: 'CEO', company: 'NVIDIA', topic: 'Generative AI infrastructure' },
    { name: 'Mary Barra', title: 'CEO', company: 'GM', topic: 'Software-defined vehicles' },
    { name: 'Oliver Zipse', title: 'CEO', company: 'BMW', topic: 'Software-defined vehicles and AI' },
  ],
};

// Generic fallback for any conference whose name doesn't match above.
const BY_VERTICAL_DEFAULT = [
  { name: 'Industry CEO', title: 'CEO', company: 'Bellwether vendor', topic: 'AI strategy in this vertical' },
  { name: 'Notable CTO', title: 'CTO', company: 'Top customer', topic: 'Engineering platform modernization' },
  { name: 'Practitioner Engineer', title: 'Principal Engineer', company: 'Open-source project', topic: 'Hands-on architecture deep dive' },
  { name: 'Industry Analyst', title: 'Lead Analyst', company: 'Major research firm', topic: 'Vertical landscape and trends' },
  { name: 'Investor / VC', title: 'General Partner', company: 'Top-tier fund', topic: 'Where the money is moving' },
];

function flagCompetitor(s) {
  return { ...s, is_competitor: COMPETITOR_COMPANIES.has(s.company) ? 1 : 0 };
}

export function curatedSuggestions(conf) {
  const exact = BY_NAME[conf.name];
  if (exact) return exact.map(flagCompetitor);
  return BY_VERTICAL_DEFAULT.map(flagCompetitor);
}
