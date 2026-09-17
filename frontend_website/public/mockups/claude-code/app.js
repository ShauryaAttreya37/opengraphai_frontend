/* ============================================================
   Claude Desktop — Code tab mockup
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const demoParams = new URLSearchParams(window.location.search);
const promptDemo = demoParams.get('demo') === 'prompt';

if (promptDemo) {
  document.documentElement.classList.add('embed-prompt-demo');
  window.APP = {
    user: 'OpenGraph team',
    repo: 'robot-observations',
    task: 'Map the workspace scene',
    busy: true,
  };
  window.PINNED = [
    { icon: 'Mcp', label: 'OpenGraph connected' },
  ];
  window.SCHEDULED = [];
  window.RECENTS = [
    { label: 'Map the workspace scene', state: 'busy', on: true },
    { label: 'Inspect graph relationships', state: 'idle' },
  ];
  window.STREAM = [];
}

/* --- Anthropicons ------------------------------------------------- */
const ICONS = window.ANTHROPICONS || {};
const glyph = n => (ICONS[n] != null ? String.fromCodePoint(ICONS[n]) : '');
const ic = (name, size, cls = '') =>
  `<i class="ic ${cls}"${size ? ` style="font-size:${size}px"` : ''}>${glyph(name)}</i>`;
const hydrate = (root = document) =>
  $$('[data-icon]', root).forEach(n => (n.textContent = glyph(n.dataset.icon)));
hydrate();

const logo = s => `<svg width="${s}" height="${s}" viewBox="0 0 248 248"><use href="#claude-logo"/></svg>`;

/* ============================================================
   Sidebar
   ============================================================ */
const APP = window.APP || {};
$('#userName').textContent = APP.user || 'You';
$('#repoName').textContent = APP.repo || 'repo';
$('#taskName').textContent = APP.task || 'Session';

const simpleRow = r => el('button', 'row',
  `${ic(r.icon || 'Placeholder', 16)}<span class="label">${esc(r.label)}</span>`);

(window.PINNED || []).forEach(r => $('#pinned').append(simpleRow(r)));
(window.SCHEDULED || []).forEach(r => $('#scheduled').append(simpleRow(r)));

const STATE_GLYPH = { idle: 'ring', busy: 'dots', new: 'dot' };
(window.RECENTS || []).forEach(r => {
  const kind = STATE_GLYPH[r.state] || 'ring';
  const mark = kind === 'dots'
    ? `<span class="state">${ic('DotsHorizontal', 15)}</span>`
    : `<span class="state ${kind}"></span>`;
  const b = el('button', 'row' + (r.on ? ' on' : ''), `${mark}<span class="label">${esc(r.label)}</span>`);
  b.onclick = () => {
    $$('#recents .row').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    $('#taskName').textContent = r.label;
  };
  $('#recents').append(b);
});

$$('.seg').forEach(s => (s.onclick = () => {
  $$('.seg').forEach(x => x.classList.toggle('on', x === s));
}));

const toggleSide = () => $('#win').classList.toggle('collapsed');
$('#toggleSidebar').onclick = toggleSide;
$('#expandSidebar').onclick = toggleSide;

const themeBtn = $('#themeBtn');
const setTheme = t => {
  document.documentElement.dataset.theme = t;
  themeBtn.innerHTML = ic(t === 'dark' ? 'Sun' : 'Moon', 16);
};
themeBtn.onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
setTheme(demoParams.get('theme') === 'light' ? 'light' : 'dark');

/* ============================================================
   Stream
   ============================================================ */
const stream = $('#stream');

function foldable(labelHtml, body) {
  const wrap = document.createDocumentFragment();
  const btn = el('button', 'act', `${labelHtml} ${ic('CaretRight', 14)}`);
  btn.setAttribute('aria-expanded', 'false');
  wrap.append(btn);
  if (body) {
    const pane = el('div', 'act-body hide', esc(body)
      .replace(/^\+.*$/gm, m => `<span class="plus">${m}</span>`)
      .replace(/^-(?!-).*$/gm, m => `<span class="minus">${m}</span>`));
    btn.onclick = () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      pane.classList.toggle('hide', open);
    };
    wrap.append(pane);
  }
  return wrap;
}

const BLOCK = {
  said: b => el('div', 'said', esc(b.text)),
  prose: b => el('div', 'prose', b.html),
  burst: () => el('div', 'burst', logo(22)),
  act: b => foldable(esc(b.label), b.body),
  edit: b => foldable(
    `Edited <b>${esc(b.file)}</b> <span class="add">+${b.add}</span> <span class="del">-${b.del}</span>`, b.body),
  ran: b => foldable(`Ran ${b.count} command${b.count === 1 ? '' : 's'}`, b.body),
  graph: b => {
    // built once and reused, so re-rendering the stream never resets
    // the layout, zoom or the node you have focused
    let host = graphCache.get(b);
    if (!host) {
      host = el('div', 'graph');
      graphCache.set(b, host);
      window.buildGraph(host, b);
    }
    return host;
  },
};
const graphCache = new WeakMap();

function render(extra = []) {
  const col = el('div', 'col');
  [...(window.STREAM || []), ...extra].forEach(b => {
    const fn = BLOCK[b.t];
    if (fn) col.append(fn(b));
  });
  stream.replaceChildren(col);
  stream.scrollTop = stream.scrollHeight;
}
render();

$('#busy').style.display = APP.busy ? '' : 'none';

/* ============================================================
   Popovers
   ============================================================ */
const scrim = $('#scrim');
let openPop = null;

function closePop() {
  if (openPop) {
    openPop.pop.classList.remove('show');
    openPop.btn.classList.remove('open');
    openPop = null;
  }
  scrim.classList.remove('show');
}
function togglePop(btn, pop) {
  const same = openPop && openPop.pop === pop;
  closePop();
  if (same) return;
  pop.classList.add('show');
  btn.classList.add('open');
  scrim.classList.add('show');
  openPop = { btn, pop };
}
scrim.onclick = closePop;
document.addEventListener('keydown', e => e.key === 'Escape' && closePop());

const optRow = (o, on, disabled) => {
  const b = el('button', 'opt' + (on ? ' on' : ''),
    `${ic('Check', 15, 'tick')}
     ${o.icon ? ic(o.icon, 16) : ''}
     <span class="name">${esc(o.name)}${o.desc ? `<small>${esc(o.desc)}</small>` : ''}</span>`);
  if (disabled) b.setAttribute('disabled', '');
  return b;
};

/* --- permission mode --- */
let mode = (window.MODES || []).find(m => m.on) || (window.MODES || [])[0];
function paintModes() {
  const box = $('#modeOpts');
  box.replaceChildren(...(window.MODES || []).map(m => {
    const b = optRow(m, m.id === mode.id);
    b.onclick = () => { mode = m; $('#btnMode').innerHTML = `${esc(m.name)} ${ic('CaretDown', 12, 'caret')}`; paintModes(); closePop(); };
    return b;
  }));
}
paintModes();
$('#btnMode').onclick = () => togglePop($('#btnMode'), $('#popMode'));

/* --- model + effort --- */
let model = (window.MODELS || []).find(m => m.on) || (window.MODELS || [])[0];
let effort = (window.EFFORTS || []).find(e => e.on) || (window.EFFORTS || [])[0];

function paintModel() {
  $('#modelOpts').replaceChildren(...(window.MODELS || []).map((m, i) => {
    const on = m.id === model.id;
    const b = el('button', 'model-opt' + (on ? ' on' : ''),
      `<span class="model-name">${esc(m.name)}</span>
       <span class="model-meta">${ic('Check', 15, 'model-check')}<span class="model-key">${esc(m.shortcut || i + 1)}</span></span>`);
    b.setAttribute('aria-pressed', String(on));
    b.onclick = () => { model = m; syncComposer(); paintModel(); };
    return b;
  }));
}
function syncComposer() {
  $('#btnModel').textContent = model.name;
  const eb = $('#btnEffort');
  eb.hidden = !model.effort;
  eb.textContent = effort.name;
}
paintModel(); syncComposer();

const openModel = () => togglePop($('#btnModel'), $('#popModel'));
$('#btnModel').onclick = openModel;
$('#btnEffort').onclick = openModel;

/* --- connectors --- */
const connList = $('#connList');
const linkedCount = () => (window.CONNECTORS || []).filter(c => c.linked).length;

function connRow(c) {
  const art = c.art
    ? `<span class="glyph brand"><img src="${c.art}" alt=""></span>`
    : `<span class="glyph">${ic(c.icon || 'Plugin', 15)}</span>`;
  const b = el('button', 'conn' + (c.featured ? ' featured' : '') + (c.linked ? ' linked' : ''),
    `${art}
     <span class="txt"><b>${esc(c.name)}</b><span>${esc(c.desc || '')}</span></span>
     <span class="tag">${c.linked ? 'Connected' : 'Connect'}</span>`);
  b.onclick = () => { c.linked = !c.linked; paintConn($('#connFilter').value); syncBadge(); };
  return b;
}

function paintConn(q = '') {
  const needle = q.trim().toLowerCase();
  const hit = x => !needle || (x.name + ' ' + (x.desc || '')).toLowerCase().includes(needle);
  const conns = (window.CONNECTORS || []).filter(hit);
  const ctx = (window.CONTEXT_ITEMS || []).filter(hit);
  const frag = document.createDocumentFragment();

  if (conns.length) {
    frag.append(el('div', 'pop-title', 'Connectors'));
    conns.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    conns.forEach(c => frag.append(connRow(c)));
  }
  if (ctx.length) {
    frag.append(el('div', 'pop-title', 'Add context'));
    ctx.forEach(c => frag.append(el('button', 'conn',
      `<span class="glyph">${ic(c.icon, 15)}</span>
       <span class="txt"><b>${esc(c.name)}</b><span>${esc(c.desc || '')}</span></span>`)));
  }
  if (!conns.length && !ctx.length) {
    frag.append(el('div', 'pop-title', 'Nothing matches'));
  }
  connList.replaceChildren(frag);
}

function syncBadge() {
  const n = linkedCount();
  const badge = $('#connCount');
  badge.hidden = n === 0;
  badge.textContent = n;
}

paintConn(); syncBadge();
$('#connFilter').addEventListener('input', e => paintConn(e.target.value));
$('#btnPlus').onclick = () => {
  togglePop($('#btnPlus'), $('#popPlus'));
  if (openPop) setTimeout(() => $('#connFilter').focus(), 0);
};

/* ============================================================
   Composer
   ============================================================ */
const input = $('#input');
const sync = () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 190) + 'px';
};
input.addEventListener('input', sync);

function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = ''; sync();
  const extra = [{ t: 'said', text }];
  render(extra);
  setTimeout(() => {
    extra.push({ t: 'act', label: 'Thinking about it', body: 'Static mockup — wire session.js to a real backend.' });
    render(extra);
  }, 700);
}
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
});
$('#send').onclick = send;

if (promptDemo) {
  const prompt = 'Build a graph from ./robot-observations. How is the gripper related to the yellow cloth?';
  const demoBlocks = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const showResult = () => {
    demoBlocks.length = 0;
    demoBlocks.push(
      { t: 'said', text: prompt },
      {
        t: 'act',
        label: 'Called OpenGraph build_graph',
        body: 'observation_03 → contains → robot_gripper\nrobot_gripper → holding → yellow_cloth',
      },
      {
        t: 'prose',
        html: '<p><strong>Found the connection.</strong> In <code>observation_03</code>, the <code>robot_gripper</code> is holding the <code>yellow_cloth</code>.</p>',
      },
    );
    input.value = '';
    sync();
    render(demoBlocks);
  };

  if (reducedMotion) {
    showResult();
  } else {
    const runDemo = (shouldFade = false) => {
      const begin = () => {
        demoBlocks.length = 0;
        input.value = '';
        sync();
        render(demoBlocks);
        document.documentElement.classList.remove('demo-resetting');

        let index = 0;
        const typeNext = () => {
          input.value = prompt.slice(0, index);
          sync();
          index += 1;

          if (index <= prompt.length) {
            window.setTimeout(typeNext, 24);
            return;
          }

          window.setTimeout(() => {
            demoBlocks.push({ t: 'said', text: prompt });
            input.value = '';
            sync();
            render(demoBlocks);

            window.setTimeout(() => {
              demoBlocks.push({
                t: 'act',
                label: 'Called OpenGraph build_graph',
                body: 'observation_03 → contains → robot_gripper\nrobot_gripper → holding → yellow_cloth',
              });
              render(demoBlocks);
            }, 650);

            window.setTimeout(() => {
              demoBlocks.push({
                t: 'prose',
                html: '<p><strong>Found the connection.</strong> In <code>observation_03</code>, the <code>robot_gripper</code> is holding the <code>yellow_cloth</code>.</p>',
              });
              render(demoBlocks);
            }, 1450);

            window.setTimeout(() => runDemo(true), 5400);
          }, 560);
        };

        window.setTimeout(typeNext, shouldFade ? 320 : 700);
      };

      if (shouldFade) {
        document.documentElement.classList.add('demo-resetting');
        window.setTimeout(begin, 300);
      } else {
        begin();
      }
    };

    runDemo(false);
  }
}
