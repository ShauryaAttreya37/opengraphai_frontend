import {
  BackSide,
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector3,
} from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import {
  LOOP,
  TAU,
  clamp01,
  createRandom,
  easeInBack,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutElastic,
  lerp,
  seg,
  wave,
} from "./motion.js";
import {
  EDGES,
  EVIDENCE,
  LABELLED_NODES,
  LOCK_TIMES,
  MARK,
  MARK_EDGES,
  NODES,
  SOURCES,
  T,
  markGroupOf,
  sourceWindow,
} from "./layout.js";

const ARC_POINTS = 28;
const MARK_SCALE = 1.55;
const DIMMED_OPACITY = 0.24;
const EDGE_OPACITY = 0.3;

export const PALETTE = {
  ground: new Color(0xf4f2ed),
  ceramic: new Color(0xeeeae2),
  ink: new Color(0x16181c),
  cobalt: new Color(0x2457d6),
};

const edgeKey = (a, b) => [a, b].sort().join("|");
const MARK_KEYS = new Set(MARK_EDGES.map(([a, b]) => edgeKey(a, b)));
const EVIDENCE_KEYS = new Set(EVIDENCE.map((hop) => edgeKey(hop.from, hop.to)));

function makeLine(color, width, opacity) {
  const geometry = new LineGeometry();
  geometry.setPositions(new Float32Array(ARC_POINTS * 3));
  const material = new LineMaterial({
    color,
    linewidth: width,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const line = new Line2(geometry, material);
  line.frustumCulled = false;
  line.renderOrder = 2;
  return line;
}

/** Point on the relationship arc a -> b; `bow` lifts it toward camera and up. */
function arcPoint(a, b, bow, u, out) {
  const len = a.distanceTo(b);
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2 + 0.16 * len * bow;
  const cz = (a.z + b.z) / 2 + 0.24 * len * bow;
  const w0 = (1 - u) * (1 - u);
  const w1 = 2 * u * (1 - u);
  const w2 = u * u;
  return out.set(
    w0 * a.x + w1 * cx + w2 * b.x,
    w0 * a.y + w1 * cy + w2 * b.y,
    w0 * a.z + w1 * cz + w2 * b.z,
  );
}

const scratch = new Vector3();
function writeArc(line, a, b, bow, reach) {
  const buffer = line.geometry.attributes.instanceStart.data;
  const arr = buffer.array;
  let prev = arcPoint(a, b, bow, 0, scratch).toArray();
  for (let i = 1; i < ARC_POINTS; i += 1) {
    const next = arcPoint(a, b, bow, (reach * i) / (ARC_POINTS - 1), scratch).toArray();
    arr.set(prev, (i - 1) * 6);
    arr.set(next, (i - 1) * 6 + 3);
    prev = next;
  }
  buffer.needsUpdate = true;
}

function haloTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

function nodeTiming(node) {
  const sourceIndex = SOURCES.findIndex((s) => s.node === node.id);
  if (sourceIndex >= 0) return sourceWindow(sourceIndex).nodeAt;
  return T.hubAppear + node.order * T.hubStagger;
}

function buildNodes(scene, rand) {
  const sphere = new SphereGeometry(1, 48, 32);
  const ringGeometry = new TorusGeometry(1, 0.03, 8, 72);
  const markerGeometry = new OctahedronGeometry(1, 0);
  return NODES.map((node) => {
    const core = new Mesh(
      sphere,
      new MeshStandardMaterial({ color: PALETTE.ceramic, roughness: 0.84, metalness: 0, transparent: true }),
    );
    core.castShadow = true;
    const hull = new Mesh(
      sphere,
      new MeshBasicMaterial({ color: PALETTE.ink, side: BackSide, transparent: true }),
    );
    const ring = new Mesh(
      ringGeometry,
      new MeshBasicMaterial({ color: PALETTE.cobalt, transparent: true, toneMapped: false }),
    );
    scene.add(core, hull, ring);
    const group = markGroupOf(node);
    const cited = node.id in LOCK_TIMES;
    const isSourceEvidence = cited && node.role === "source";
    const marker = isSourceEvidence
      ? new Mesh(markerGeometry, new MeshBasicMaterial({ color: PALETTE.cobalt, toneMapped: false }))
      : null;
    if (marker) scene.add(marker);
    return {
      ...node,
      base: new Vector3(...node.pos),
      markPos: new Vector3(...MARK[group].pos),
      isRep: MARK[group].rep === node.id,
      isApex: MARK.TOP.rep === node.id,
      cited,
      lockAt: LOCK_TIMES[node.id],
      appearAt: nodeTiming(node),
      phase: rand() * TAU,
      core,
      hull,
      ring,
      marker,
      pos: new Vector3(),
      size: 0,
      opacity: 1,
    };
  });
}

function buildLabels(scene) {
  const plane = new PlaneGeometry(1, 1);
  return LABELLED_NODES.map((id, i) => {
    const bars = [0.34 - (i % 3) * 0.04, 0.2].map((len, j) => {
      const bar = new Mesh(
        plane,
        new MeshBasicMaterial({ color: PALETTE.ink, transparent: true, depthWrite: false }),
      );
      bar.userData = { len, offsetY: 0.07 - j * 0.07, thick: j === 0 ? 0.024 : 0.018 };
      scene.add(bar);
      return bar;
    });
    return { id, bars };
  });
}

export function createGraph(scene) {
  const rand = createRandom(7);
  const nodes = buildNodes(scene, rand);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const labels = buildLabels(scene);

  const edges = EDGES.map(([a, b]) => {
    const line = makeLine(PALETTE.ink, 1.1, EDGE_OPACITY);
    scene.add(line);
    const key = edgeKey(a, b);
    return { a: byId[a], b: byId[b], line, isMark: MARK_KEYS.has(key), isEvidence: EVIDENCE_KEYS.has(key) };
  });

  const halo = haloTexture();
  const makePulse = () => {
    const dot = new Mesh(
      new SphereGeometry(0.055, 24, 16),
      new MeshBasicMaterial({ color: PALETTE.cobalt, toneMapped: false }),
    );
    const glow = new Sprite(
      new SpriteMaterial({ map: halo, color: PALETTE.cobalt, transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false }),
    );
    glow.scale.setScalar(0.5);
    scene.add(dot, glow);
    return { dot, glow };
  };

  const hops = EVIDENCE.map((hop) => {
    const line = makeLine(PALETTE.cobalt, 2.3, 0.95);
    line.renderOrder = 3;
    scene.add(line);
    return { ...hop, a: byId[hop.from], b: byId[hop.to], line, pulse: makePulse() };
  });

  const agentLink = { line: makeLine(PALETTE.cobalt, 1.5, 0.85), pulse: makePulse() };
  scene.add(agentLink.line);

  const lines = [...edges.map((e) => e.line), ...hops.map((h) => h.line), agentLink.line];

  function updateNodes(t, camera, lineScale) {
    const collapse = easeInOutCubic(seg(t, ...T.collapse));
    const dim = easeInOutCubic(seg(t, ...T.dim));
    const markFade = seg(t, ...T.markFade);
    const camDist = camera.position.length();

    for (const n of nodes) {
      const appear = t >= n.appearAt ? easeOutBack(seg(t, n.appearAt, n.appearAt + 0.55)) : 0;
      const lockE = n.cited ? seg(t, n.lockAt, n.lockAt + 0.75) : 0;
      const snap = easeOutElastic(lockE);
      const drift = 0.05 * (1 - snap);

      n.pos.set(
        n.base.x + drift * wave(t, 2, n.phase),
        n.base.y + drift * wave(t, 3, n.phase + 1),
        n.base.z + drift * wave(t, 2, n.phase + 2) + 0.22 * snap,
      );
      n.pos.lerp(n.markPos, collapse);

      const collapseScale = n.isRep ? lerp(1, MARK_SCALE, collapse) : 1 - easeInCubic(collapse);
      const endScale = n.isRep ? Math.max(0, 1 - easeInBack(markFade)) : 1;
      n.size = n.r * appear * (1 + 0.14 * snap) * collapseScale * endScale;
      n.opacity = n.cited ? 1 : lerp(1, DIMMED_OPACITY, dim);

      const visible = n.size > 0.001;
      n.core.visible = visible;
      n.hull.visible = visible;
      n.core.position.copy(n.pos);
      n.hull.position.copy(n.pos);
      n.core.scale.setScalar(n.size);
      n.hull.scale.setScalar(n.size * 1.065);

      const depth = clamp01((n.pos.distanceTo(camera.position) - camDist + 1.5) / 4);
      n.core.material.color.copy(PALETTE.ceramic).lerp(PALETTE.ground, depth * 0.45);
      n.core.material.opacity = n.opacity;
      const keepCobalt = n.isApex ? 1 : 1 - collapse;
      n.hull.material.color.copy(PALETTE.ink).lerp(PALETTE.cobalt, snap * keepCobalt);
      n.hull.material.opacity = n.opacity * (1 - depth * 0.35);

      const ringFade = n.isApex ? 1 : 1 - collapse;
      n.ring.visible = n.cited && snap > 0.001 && ringFade > 0.001 && visible;
      n.ring.position.copy(n.pos);
      n.ring.quaternion.copy(camera.quaternion);
      n.ring.scale.setScalar(n.size * 1.7 * Math.max(0, snap));
      n.ring.material.opacity = 0.9 * ringFade;

      if (n.marker) {
        const markerSize = 0.055 * snap * (1 - collapse);
        n.marker.visible = markerSize > 0.001;
        n.marker.position.copy(n.pos).add(scratch.set(0, n.size + 0.2, 0));
        n.marker.rotation.set(0.3, (TAU * 2 * t) / LOOP, 0);
        n.marker.scale.set(markerSize, markerSize * 1.5, markerSize);
      }
    }

    for (const edge of edges) {
      const start = Math.max(edge.a.appearAt, edge.b.appearAt) - 0.05;
      const reach = easeInOutCubic(seg(t, start, start + T.edgeDraw));
      const minSize = Math.min(edge.a.size, edge.b.size);
      const material = edge.line.material;
      let opacity = edge.isEvidence ? EDGE_OPACITY : lerp(EDGE_OPACITY, 0.1, dim);
      let width = 1.1;
      if (edge.isMark) {
        opacity = lerp(opacity, 1, collapse) * (1 - easeInCubic(markFade));
        width = lerp(1.1, 2.6, collapse);
      } else {
        opacity *= 1 - collapse;
      }
      edge.line.visible = reach > 0.001 && opacity > 0.003 && minSize > 0.001;
      if (!edge.line.visible) continue;
      material.opacity = opacity;
      material.linewidth = width * lineScale;
      writeArc(edge.line, edge.a.pos, edge.b.pos, edge.isMark ? 1 - collapse : 1, reach);
    }
  }

  function updateEvidence(t, agentPos, agentVisible, lineScale) {
    const collapse = easeInOutCubic(seg(t, ...T.collapse));
    for (const hop of hops) {
      const raw = seg(t, hop.at, hop.at + hop.dur);
      const reach = easeInOutCubic(raw);
      const opacity = 0.95 * (1 - collapse);
      hop.line.visible = reach > 0.001 && opacity > 0.003;
      if (hop.line.visible) {
        hop.line.material.opacity = opacity;
        hop.line.material.linewidth = 2.3 * lineScale;
        writeArc(hop.line, hop.a.pos, hop.b.pos, 1, reach);
      }
      const travelling = raw > 0 && raw < 1;
      hop.pulse.dot.visible = travelling;
      hop.pulse.glow.visible = travelling;
      if (travelling) {
        arcPoint(hop.a.pos, hop.b.pos, 1, reach, hop.pulse.dot.position);
        hop.pulse.glow.position.copy(hop.pulse.dot.position);
      }
    }

    const q = byId.Q;
    const raw = seg(t, 6.12, 6.45);
    const linkOpacity = 0.85 * (1 - seg(t, 8.6, 9.1));
    const line = agentLink.line;
    line.visible = agentVisible && raw > 0 && linkOpacity > 0.003;
    if (line.visible) {
      line.material.opacity = linkOpacity;
      line.material.linewidth = 1.5 * lineScale;
      writeArc(line, agentPos, q.pos, 0.35, easeInOutCubic(raw));
    }
    const travelling = raw > 0 && raw < 1 && agentVisible;
    agentLink.pulse.dot.visible = travelling;
    agentLink.pulse.glow.visible = travelling;
    if (travelling) {
      arcPoint(agentPos, q.pos, 0.35, easeInOutCubic(raw), agentLink.pulse.dot.position);
      agentLink.pulse.glow.position.copy(agentLink.pulse.dot.position);
    }
  }

  const right = new Vector3();
  const up = new Vector3();
  function updateLabels(t, camera) {
    const collapse = easeInOutCubic(seg(t, ...T.collapse));
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    for (const label of labels) {
      const n = byId[label.id];
      const reveal = seg(t, n.appearAt + 0.3, n.appearAt + 0.9);
      const opacity = 0.5 * reveal * n.opacity * (1 - collapse);
      for (const bar of label.bars) {
        const { len, offsetY, thick } = bar.userData;
        bar.visible = opacity > 0.003;
        if (!bar.visible) continue;
        const grown = len * easeInOutCubic(reveal);
        bar.material.opacity = opacity;
        bar.quaternion.copy(camera.quaternion);
        bar.scale.set(grown, thick, 1);
        bar.position
          .copy(n.pos)
          .addScaledVector(right, n.r + 0.14 + grown / 2)
          .addScaledVector(up, offsetY + 0.05);
      }
    }
  }

  return {
    nodes,
    byId,
    lines,
    update(t, camera, agent, lineScale) {
      updateNodes(t, camera, lineScale);
      updateEvidence(t, agent.position, agent.visible, lineScale);
      updateLabels(t, camera);
    },
  };
}
