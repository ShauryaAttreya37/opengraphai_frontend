/* =====================================================================
   Everything the mockup renders. This is the only file to edit.
   ===================================================================== */

window.APP = {
  user: 'OpenGraph team',
  repo: 'robot-observations',
  task: 'Map the workspace scene',
  busy: true,
};

/* --- sidebar ------------------------------------------------------- */
window.PINNED = [
  { icon: 'Mcp', label: 'OpenGraph connected' },
];

window.SCHEDULED = [];

/* state: 'idle' (hollow ring) | 'busy' (dots) | 'new' (blue dot) */
window.RECENTS = [
  { label: 'Map the workspace scene', state: 'busy', on: true },
  { label: 'Inspect graph relationships', state: 'idle' },
];

/* --- transcript ----------------------------------------------------
   said  { t:'said',  text }
   act   { t:'act',   label, body? }
   edit  { t:'edit',  file, add, del, body? }
   ran   { t:'ran',   count, body? }
   prose { t:'prose', html }
   burst { t:'burst' }                    working indicator

   The same example session the landing page embeds (?demo=prompt): one
   build_graph call and the relation it finds. It is example output, not a
   recorded run.
   ------------------------------------------------------------------- */
window.STREAM = [
  { t: 'said', text: 'Build a graph from ./robot-observations. How is the gripper related to the yellow cloth?' },
  {
    t: 'act', label: 'Called OpenGraph build_graph',
    body: 'observation_03 → contains → robot_gripper\nrobot_gripper → holding → yellow_cloth',
  },
  {
    t: 'prose',
    html: '<p><strong>Found the connection.</strong> In <code>observation_03</code>, the <code>robot_gripper</code> is holding the <code>yellow_cloth</code>.</p>',
  },
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
];

window.CONTEXT_ITEMS = [
  { id: 'files',  name: 'Add files',      desc: 'From this repository', icon: 'FileUpload' },
  { id: 'shot',   name: 'Screenshot',     desc: 'Capture a region',     icon: 'Camera' },
  { id: 'skills', name: 'Skills',         desc: 'Run a saved skill',    icon: 'Beaker' },
];
