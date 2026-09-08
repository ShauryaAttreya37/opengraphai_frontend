/* ============================================================
   Force-directed knowledge graph — a produced Claude output.
   No dependencies: the layout, zoom/pan and hit-testing are all
   in this file. Interaction is deliberately small:
     drag a node · scroll to zoom · drag background to pan
     click a node to focus it and its neighbours · search to filter
   ============================================================ */

/* Categorical slots, in fixed order. Both ramps pass the six checks
   (lightness band, chroma floor, CVD separation, normal-vision floor,
   contrast) against their own surface. Green↔amber sits in the 6–8 CVD
   floor band, which is legal here because every node is directly
   labelled and the legend is always on screen. */
const NODE_COLORS = {
  dark:  { module:'#6289df', test:'#bb7e23', fn:'#0da668', external:'#a86ae0', finding:'#e2565e' },
  light: { module:'#5176cb', test:'#a76c00', fn:'#009356', external:'#9557cb', finding:'#cd434d' },
};

function buildGraph(host, spec) {
  const nodes = spec.nodes.map(n => ({ ...n }));
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const links = spec.links
    .map(l => ({ source: byId[l.s], target: byId[l.t] }))
    .filter(l => l.source && l.target);

  nodes.forEach(n => (n.deg = 0));
  links.forEach(l => { l.source.deg++; l.target.deg++; });
  const radius = n => 5.5 + 2.4 * Math.sqrt(n.deg);

  const neighbours = new Map(nodes.map(n => [n.id, new Set([n.id])]));
  links.forEach(l => {
    neighbours.get(l.source.id).add(l.target.id);
    neighbours.get(l.target.id).add(l.source.id);
  });

  /* ---------- markup ---------- */
  host.innerHTML = `
    <div class="g-head">
      <b class="g-title">${spec.title}</b>
      <span class="g-sub">${spec.subtitle}</span>
    </div>
    <div class="g-stage">
      <svg class="g-svg">
        <g class="g-view">
          <g class="g-edges"></g>
          <g class="g-nodes"></g>
        </g>
      </svg>
      <div class="g-legend"></div>
      <div class="g-find"><input placeholder="Search nodes…" spellcheck="false"></div>
      <div class="g-note">Node size = connections</div>
    </div>`;

  const stage = host.querySelector('.g-stage');
  const svg = host.querySelector('.g-svg');
  const view = host.querySelector('.g-view');
  const gEdges = host.querySelector('.g-edges');
  const gNodes = host.querySelector('.g-nodes');
  const find = host.querySelector('.g-find input');

  host.querySelector('.g-legend').innerHTML = spec.legend
    .map(l => `<div class="g-key"><i data-type="${l.type}"></i>${l.label}</div>`).join('');

  const SVGNS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  const edgeEls = links.map(l => {
    const e = make('line', { class: 'g-edge' });
    gEdges.append(e);
    return e;
  });

  const nodeEls = nodes.map(n => {
    const g = make('g', { class: 'g-node', 'data-type': n.type });
    const c = make('circle', { r: radius(n) });
    const t = make('text', { x: radius(n) + 7, y: 4 });
    t.textContent = n.label;
    g.append(c, t);
    gNodes.append(g);
    g.__node = n;
    return g;
  });

  /* ---------- layout ---------- */
  let W = 800, H = 420;
  const measure = () => {
    const r = stage.getBoundingClientRect();
    if (r.width) { W = r.width; H = r.height; }
  };
  measure();

  nodes.forEach((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2;
    n.x = W / 2 + Math.cos(a) * (W / 5) + (Math.random() - .5) * 40;
    n.y = H / 2 + Math.sin(a) * (H / 5) + (Math.random() - .5) * 40;
    n.vx = n.vy = 0;
  });

  let alpha = 1;
  function tick() {
    // repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx * dx + dy * dy || 0.01;
        if (d2 > 90000) continue;
        const f = 2600 / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
      }
    }
    // springs
    for (const l of links) {
      const a = l.source, b = l.target;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (d - 92) * 0.035;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
    // gravity toward centre
    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * 0.0018;
      n.vy += (H / 2 - n.y) * 0.0018;
      if (n.fixed) { n.vx = n.vy = 0; continue; }
      n.vx *= 0.86; n.vy *= 0.86;
      n.x += n.vx * alpha; n.y += n.vy * alpha;
    }
    alpha = Math.max(alpha * 0.994, 0.06);
  }

  function paint() {
    edgeEls.forEach((e, i) => {
      const l = links[i];
      e.setAttribute('x1', l.source.x); e.setAttribute('y1', l.source.y);
      e.setAttribute('x2', l.target.x); e.setAttribute('y2', l.target.y);
    });
    nodeEls.forEach(g => g.setAttribute('transform', `translate(${g.__node.x},${g.__node.y})`));
  }

  let raf = null, settled = 0;
  function loop() {
    tick(); paint();
    settled = alpha <= 0.061 ? settled + 1 : 0;
    raf = settled > 60 ? null : requestAnimationFrame(loop);
  }
  const heat = (a = 0.6) => { alpha = Math.max(alpha, a); settled = 0; if (!raf) raf = requestAnimationFrame(loop); };
  for (let i = 0; i < 240; i++) tick();   // pre-settle so it opens calm
  paint();
  loop();

  /* ---------- zoom / pan ---------- */
  let k = 1, tx = 0, ty = 0;
  const applyView = () => view.setAttribute('transform', `translate(${tx},${ty}) scale(${k})`);
  applyView();

  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const next = Math.min(3, Math.max(0.4, k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    tx = px - ((px - tx) / k) * next;
    ty = py - ((py - ty) / k) * next;
    k = next;
    applyView();
  }, { passive: false });

  let drag = null;
  const toLocal = e => {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left - tx) / k, y: (e.clientY - r.top - ty) / k };
  };

  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest('.g-node');
    svg.setPointerCapture(e.pointerId);
    if (hit) {
      const p = toLocal(e);
      drag = { kind: 'node', n: hit.__node, dx: hit.__node.x - p.x, dy: hit.__node.y - p.y, moved: false };
      hit.__node.fixed = true;
      hit.classList.add('dragging');
    } else {
      drag = { kind: 'pan', x: e.clientX - tx, y: e.clientY - ty, moved: false };
    }
  });

  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.moved = true;
    if (drag.kind === 'node') {
      const p = toLocal(e);
      drag.n.x = p.x + drag.dx; drag.n.y = p.y + drag.dy;
      heat(0.5); paint();
    } else {
      tx = e.clientX - drag.x; ty = e.clientY - drag.y;
      applyView();
    }
  });

  svg.addEventListener('pointerup', e => {
    if (!drag) return;
    if (drag.kind === 'node') {
      drag.n.fixed = false;
      gNodes.querySelectorAll('.dragging').forEach(n => n.classList.remove('dragging'));
      if (!drag.moved) focusNode(drag.n);
      heat(0.4);
    } else if (!drag.moved) {
      focusNode(null);
    }
    drag = null;
  });

  /* ---------- focus + search ---------- */
  let focused = null;
  function focusNode(n) {
    focused = focused === n ? null : n;
    find.value = '';
    applyDim();
  }
  function applyDim() {
    const q = find.value.trim().toLowerCase();
    const keep = focused ? neighbours.get(focused.id) : null;
    const active = new Set();
    nodeEls.forEach(g => {
      const n = g.__node;
      const on = q ? n.label.toLowerCase().includes(q) : keep ? keep.has(n.id) : true;
      g.classList.toggle('dim', !on);
      g.classList.toggle('pick', !!focused && n.id === focused.id);
      if (on) active.add(n.id);
    });
    const filtering = !!q || !!focused;
    edgeEls.forEach((e, i) => {
      const l = links[i];
      e.classList.toggle('dim', filtering && !(active.has(l.source.id) && active.has(l.target.id)));
    });
    host.classList.toggle('filtering', filtering);
  }
  find.addEventListener('input', () => { focused = null; applyDim(); });

  /* ---------- theme + resize ---------- */
  function paintColors() {
    const mode = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const map = NODE_COLORS[mode];
    nodeEls.forEach(g => g.querySelector('circle').setAttribute('fill', map[g.__node.type] || map.module));
    host.querySelectorAll('.g-key i').forEach(i => (i.style.background = map[i.dataset.type] || map.module));
  }
  paintColors();
  new MutationObserver(paintColors)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  new ResizeObserver(() => { measure(); heat(0.5); }).observe(stage);

  return host;
}

window.buildGraph = buildGraph;
