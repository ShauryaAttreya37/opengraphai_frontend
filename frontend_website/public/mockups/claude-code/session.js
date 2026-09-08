/* =====================================================================
   Everything the mockup renders. This is the only file to edit.
   ===================================================================== */

window.APP = {
  user: 'OpenGraph team',
  repo: 'customer-intelligence',
  task: 'Trace renewal risk for Acme',
  busy: true,
};

/* --- sidebar ------------------------------------------------------- */
window.PINNED = [
  { icon: 'Mcp', label: 'OpenGraph workspace setup' },
  { icon: 'Bookmark', label: 'Atlas launch readiness' },
];

window.SCHEDULED = [
  { icon: 'Clock', label: 'Weekly account graph audit' },
];

/* state: 'idle' (hollow ring) | 'busy' (dots) | 'new' (blue dot) */
window.RECENTS = [
  { label: 'New session', state: 'idle' },
  { label: 'Trace renewal risk for Acme', state: 'busy', on: true },
  { label: 'Summarize Atlas launch blockers', state: 'busy' },
  { label: 'Find the current account owner', state: 'idle' },
  { label: 'Compare account graph snapshots', state: 'new' },
  { label: 'Draft the QBR briefing', state: 'idle' },
  { label: 'Audit missing source citations', state: 'idle' },
];

/* --- transcript ----------------------------------------------------
   said  { t:'said',  text }
   act   { t:'act',   label, body? }
   edit  { t:'edit',  file, add, del, body? }
   ran   { t:'ran',   count, body? }
   prose { t:'prose', html }
   burst { t:'burst' }                    working indicator
   ------------------------------------------------------------------- */
window.STREAM = [
  {
    t: 'said',
    text: 'Which renewals are at risk this quarter? Start with Acme, trace every claim back to the original source, and flag anything that still needs verification.',
  },

  {
    t: 'act', label: 'Connected OpenGraph to the account workspace',
    body: 'Account graph        synced 4m ago\nCustomer calls      synced 11m ago\nProduct signals     synced 7m ago\nRenewal calendar    synced 2m ago',
  },

  {
    t: 'prose',
    html: '<p>I’ll traverse the renewal entities across the connected graph, rank the strongest risk paths, and verify each one against its source before I summarize.</p>',
  },

  {
    t: 'act', label: 'Queried the OpenGraph account graph',
    body: 'Acme Corp → renews_in → Q4 2026\nAcme Corp → has_risk → Pricing approval (0.94)\nPricing approval → evidenced_by → q3_call.wav\nAcme Corp → owned_by → Priya Raman (0.86)',
  },
  {
    t: 'act', label: 'Opened 3 supporting sources',
    body: 'q3_call.wav      03:18–03:42  “Budget approval is the remaining blocker”\nsignals.csv       row 128      pricing_concern = true · trend = rising\naccount.json      owner.primary Priya Raman · Strategic Accounts',
  },

  {
    t: 'prose',
    html: '<p><strong>Acme Corp is the clearest renewal risk.</strong> Pricing approval is the active blocker, and it is corroborated by the Q3 call and the latest account-signal export. Priya Raman is the current owner.</p><p>The strongest evidence path is <code>Acme Corp → pricing concern → q3_call.wav</code>. I found three independent sources supporting the result; I have not found a competing owner relationship.</p>',
  },

  {
    t: 'act', label: 'Checking for stale or conflicting relationships',
    body: 'CRM owner history       no active conflict\nLatest product usage    healthy adoption signal\nRenewal calendar        date verified\nSource freshness        account.json needs final sync check',
  },

  {
    t: 'prose',
    html: '<p>I’m validating the account record against the newest CRM sync now. After that I’ll rank the remaining renewals and return a cited watchlist with owners and next actions.</p>',
  },

  {
    t: 'prose',
    html: '<p>Here is how the module actually hangs together, with the coverage gaps marked. Click a node to isolate it and its neighbours.</p>',
  },

  {
    t: 'graph',
    title: 'Payments module graph',
    subtitle: 'src/payments — 5 modules, 4 suites, 7 symbols · drag / scroll / click a node',
    legend: [
      { type: 'module',   label: 'Module' },
      { type: 'test',     label: 'Test suite' },
      { type: 'fn',       label: 'Function' },
      { type: 'external', label: 'Dependency' },
      { type: 'finding',  label: 'Gap' },
    ],
    nodes: [
      { id: 'm_gateway',  label: 'gateway.ts',        type: 'module' },
      { id: 'm_refunds',  label: 'refunds.ts',        type: 'module' },
      { id: 'm_captures', label: 'captures.ts',       type: 'module' },
      { id: 'm_webhooks', label: 'webhooks.ts',       type: 'module' },
      { id: 'm_index',    label: 'index.ts',          type: 'module' },

      { id: 't_refunds',  label: 'refunds.test.ts',   type: 'test' },
      { id: 't_captures', label: 'captures.test.ts',  type: 'test' },
      { id: 't_gateway',  label: 'gateway.test.ts',   type: 'test' },
      { id: 't_hooks',    label: 'webhooks.test.ts',  type: 'test' },

      { id: 'f_charge',   label: 'charge()',          type: 'fn' },
      { id: 'f_refund',   label: 'refund()',          type: 'fn' },
      { id: 'f_capture',  label: 'capture()',         type: 'fn' },
      { id: 'f_split',    label: 'splitCapture()',    type: 'fn' },
      { id: 'f_recon',    label: 'reconcile()',       type: 'fn' },
      { id: 'f_minor',    label: 'toMinorUnits()',    type: 'fn' },
      { id: 'f_assert',   label: 'assertCaptured()',  type: 'fn' },

      { id: 'x_stripe',   label: 'stripe-node',       type: 'external' },
      { id: 'x_currency', label: 'currency.js',       type: 'external' },
      { id: 'x_vitest',   label: 'vitest',            type: 'external' },
      { id: 'x_msw',      label: 'msw',               type: 'external' },

      { id: 'g_over',     label: 'over-refund guard untested',   type: 'finding' },
      { id: 'g_round',    label: 'rounding drift on split',      type: 'finding' },
      { id: 'g_replay',   label: 'webhook replay not idempotent',type: 'finding' },
      { id: 'g_3ds',      label: 'no 3DS decline case',          type: 'finding' },
    ],
    links: [
      { s: 'm_index', t: 'm_gateway' }, { s: 'm_index', t: 'm_refunds' },
      { s: 'm_index', t: 'm_captures' }, { s: 'm_index', t: 'm_webhooks' },
      { s: 'm_gateway', t: 'f_charge' }, { s: 'm_gateway', t: 'x_stripe' },
      { s: 'm_refunds', t: 'f_refund' }, { s: 'm_refunds', t: 'f_assert' },
      { s: 'm_refunds', t: 'm_gateway' },
      { s: 'm_captures', t: 'f_capture' }, { s: 'm_captures', t: 'f_split' },
      { s: 'm_captures', t: 'f_minor' }, { s: 'm_captures', t: 'x_currency' },
      { s: 'm_captures', t: 'm_gateway' },
      { s: 'm_webhooks', t: 'f_recon' }, { s: 'm_webhooks', t: 'm_gateway' },
      { s: 't_refunds', t: 'm_refunds' }, { s: 't_refunds', t: 'f_refund' },
      { s: 't_refunds', t: 'x_vitest' }, { s: 't_refunds', t: 'g_over' },
      { s: 't_captures', t: 'm_captures' }, { s: 't_captures', t: 'f_split' },
      { s: 't_captures', t: 'f_minor' }, { s: 't_captures', t: 'x_vitest' },
      { s: 't_captures', t: 'g_round' },
      { s: 't_gateway', t: 'm_gateway' }, { s: 't_gateway', t: 'x_msw' },
      { s: 't_gateway', t: 'x_vitest' }, { s: 't_gateway', t: 'g_3ds' },
      { s: 't_hooks', t: 'm_webhooks' }, { s: 't_hooks', t: 'f_recon' },
      { s: 't_hooks', t: 'x_msw' }, { s: 't_hooks', t: 'g_replay' },
      { s: 'f_refund', t: 'f_assert' }, { s: 'f_split', t: 'f_minor' },
      { s: 'f_capture', t: 'f_split' }, { s: 'f_charge', t: 'x_stripe' },
      { s: 'f_recon', t: 'f_charge' },
    ],
  },

  { t: 'burst' },
];

/* --- composer controls --------------------------------------------- */
window.MODELS = [
  { id: 'opus',   name: 'Opus',   shortcut: '1', effort: true, on: true },
  { id: 'sonnet', name: 'Sonnet', shortcut: '2', effort: true },
  { id: 'haiku',  name: 'Haiku',  shortcut: '3', effort: false },
  { id: 'fable',  name: 'Fable',  shortcut: '4', effort: true },
];

window.EFFORTS = [
  { id: 'low',    name: 'Low',        desc: 'Answers fast, thinks little' },
  { id: 'medium', name: 'Medium',     desc: 'Everyday work' },
  { id: 'high',   name: 'High',       desc: 'Harder problems' },
  { id: 'xhigh',  name: 'Extra high', desc: 'Longest thinking budget', on: true },
];

window.MODES = [
  { id: 'auto',   icon: 'Lightning',   name: 'Auto',            desc: 'Claude decides when to ask', on: true },
  { id: 'plan',   icon: 'Checklist',   name: 'Plan',            desc: 'Propose first, edit after approval' },
  { id: 'accept', icon: 'CheckCircle', name: 'Accept edits',    desc: 'Apply file edits without asking' },
  { id: 'ask',    icon: 'Trust',       name: 'Ask every time',  desc: 'Confirm every tool call' },
];

/* --- connectors ----------------------------------------------------
   Drop your own connector in here. `featured: true` pins it to the top
   and gives it the highlighted treatment. `art` can be an image URL
   instead of an Anthropicons `icon` name.
   ------------------------------------------------------------------- */
window.CONNECTORS = [
  {
    id: 'opengraph', name: 'OpenGraph AI', desc: 'Knowledge graph and cited sources',
    icon: 'Mcp', featured: true, linked: true,
  },
  { id: 'drive',      name: 'Google Drive', desc: 'Documents, tables and recordings', art: 'assets/connectors/google-drive.svg', linked: true },
  { id: 'salesforce', name: 'Salesforce',   desc: 'Accounts, renewals and owners',     art: 'assets/connectors/salesforce.svg',   linked: true },
  { id: 'slack',      name: 'Slack',        desc: 'Messages and decisions',             art: 'assets/connectors/slack.svg',        linked: true },
  { id: 'github',     name: 'GitHub',       desc: 'Repos, issues and pull requests',    art: 'assets/connectors/github.svg' },
  { id: 'linear',     name: 'Linear',       desc: 'Issues and cycles',                  art: 'assets/connectors/linear.svg' },
  { id: 'figma',      name: 'Figma',        desc: 'Frames and design specs',            art: 'assets/connectors/figma.svg' },
];

window.CONTEXT_ITEMS = [
  { id: 'files',  name: 'Add files',      desc: 'From this repository', icon: 'FileUpload' },
  { id: 'shot',   name: 'Screenshot',     desc: 'Capture a region',     icon: 'Camera' },
  { id: 'skills', name: 'Skills',         desc: 'Run a saved skill',    icon: 'Beaker' },
];
