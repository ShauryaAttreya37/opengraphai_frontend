// Converts the agent icons in assets/agents/ into morph-ready path data at
// src/graph-loop/agent-icons.js. Run after changing an icon:
//
//   node scripts/build-agent-icons.mjs
//
// anime.js morphTo() samples a path by arc length, so each icon is prepared
// the same way: fitted into a 100 x 100 box, split into closed pieces
// (largest first), every piece wound the same direction and started at its
// topmost point. Matching pieces then morph without flipping or twisting.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import svgpath from "svgpath";

const ICONS = [
  // `pick` is the index of the <path> holding the mark (skips backgrounds).
  { id: "claude", file: "claude.svg", pick: 0 },
  { id: "codex", file: "codex.svg", pick: 1 },
  { id: "cursor", file: "cursor.svg", pick: 0 },
  { id: "gemini", file: "gemini.svg", pick: 0 },
  { id: "grok", file: "grok.svg", pick: 0 },
];
const BOX = 100;
const MIN_PIECE_AREA = 4; // drops stray dots such as Grok's "h.01" subpath
const round = (n) => Math.round(n * 1000) / 1000;

function readPathData(file, pick) {
  const svg = readFileSync(resolve("assets/agents", file), "utf8");
  const paths = [...svg.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((m) => m[1]);
  if (!paths[pick]) throw new Error(`${file}: no <path> at index ${pick}`);
  return paths[pick];
}

/** Absolute, arc-free segments split into closed pieces of L and C commands. */
function toPieces(d) {
  const pieces = [];
  let piece = null;
  let cur = [0, 0];
  svgpath(d).abs().unarc().unshort().iterate((seg) => {
    const [cmd, ...a] = seg;
    if (cmd === "M") {
      piece = { start: [a[0], a[1]], segs: [] };
      pieces.push(piece);
      cur = [a[0], a[1]];
      return;
    }
    if (cmd === "Z") {
      const [sx, sy] = piece.start;
      if (Math.hypot(cur[0] - sx, cur[1] - sy) > 1e-6) piece.segs.push({ c: null, to: [sx, sy] });
      cur = [sx, sy];
      return;
    }
    let to;
    let c = null;
    if (cmd === "L") to = [a[0], a[1]];
    else if (cmd === "H") to = [a[0], cur[1]];
    else if (cmd === "V") to = [cur[0], a[0]];
    else if (cmd === "C") {
      c = [[a[0], a[1]], [a[2], a[3]]];
      to = [a[4], a[5]];
    } else if (cmd === "Q") {
      const q = [a[0], a[1]];
      to = [a[2], a[3]];
      c = [
        [cur[0] + (2 / 3) * (q[0] - cur[0]), cur[1] + (2 / 3) * (q[1] - cur[1])],
        [to[0] + (2 / 3) * (q[0] - to[0]), to[1] + (2 / 3) * (q[1] - to[1])],
      ];
    } else throw new Error(`Unsupported command ${cmd}`);
    piece.segs.push({ c, to });
    cur = to;
  });
  return pieces.filter((p) => p.segs.length > 0);
}

function samplePoints(piece) {
  const pts = [];
  let from = piece.start;
  for (const { c, to } of piece.segs) {
    if (!c) pts.push(to);
    else {
      for (let i = 1; i <= 8; i += 1) {
        const t = i / 8;
        const v = 1 - t;
        pts.push([0, 1].map((k) =>
          v * v * v * from[k] + 3 * v * v * t * c[0][k] + 3 * v * t * t * c[1][k] + t * t * t * to[k]));
      }
    }
    from = to;
  }
  return pts;
}

const signedArea = (pts) =>
  pts.reduce((sum, p, i) => {
    const q = pts[(i + 1) % pts.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0) / 2;

function reversePiece(piece) {
  const nodes = [piece.start, ...piece.segs.map((s) => s.to)];
  const segs = piece.segs
    .map((s, i) => ({ c: s.c ? [s.c[1], s.c[0]] : null, to: nodes[i] }))
    .reverse();
  return { start: nodes[nodes.length - 1], segs };
}

/** Restart a closed piece at its topmost node so pieces align when sampled. */
function startAtTop(piece) {
  const nodes = [piece.start, ...piece.segs.map((s) => s.to)];
  let best = 0;
  nodes.forEach(([x, y], i) => {
    const [bx, by] = nodes[best];
    if (y < by - 1e-6 || (Math.abs(y - by) < 1e-6 && x < bx)) best = i;
  });
  if (best === 0 || best === nodes.length - 1) return piece;
  return { start: nodes[best], segs: [...piece.segs.slice(best), ...piece.segs.slice(0, best)] };
}

function serialise(piece) {
  const f = (p) => `${round(p[0])} ${round(p[1])}`;
  const body = piece.segs
    .map(({ c, to }) => (c ? `C${f(c[0])} ${f(c[1])} ${f(to)}` : `L${f(to)}`))
    .join("");
  return `M${f(piece.start)}${body}Z`;
}

function buildIcon({ id, file, pick }) {
  const raw = readPathData(file, pick);
  const nodes = toPieces(raw).flatMap((p) => [p.start, ...p.segs.flatMap((s) => [...(s.c ?? []), s.to])]);
  const xs = nodes.map((n) => n[0]);
  const ys = nodes.map((n) => n[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = BOX / Math.max(maxX - minX, maxY - minY);
  const offX = (BOX - (maxX - minX) * scale) / 2 - minX * scale;
  const offY = (BOX - (maxY - minY) * scale) / 2 - minY * scale;
  const fitted = svgpath(raw).abs().unarc().unshort().scale(scale).translate(offX, offY).toString();

  const pieces = toPieces(fitted)
    .map((p) => ({ p, area: signedArea(samplePoints(p)) }))
    .filter(({ area }) => Math.abs(area) >= MIN_PIECE_AREA)
    .map(({ p, area }) => ({ p: area < 0 ? reversePiece(p) : p, area: Math.abs(area) }))
    .sort((a, b) => b.area - a.area)
    .map(({ p }) => serialise(startAtTop(p)));
  return [id, pieces];
}

const icons = Object.fromEntries(ICONS.map(buildIcon));
const out = `// Generated by scripts/build-agent-icons.mjs from assets/agents/*.svg.
// Do not edit by hand. Each icon: closed pieces in a 100 x 100 box, largest
// first, same winding, starting at their topmost point. Fill with "evenodd".

export const AGENT_ICONS = ${JSON.stringify(icons, null, 2)};
`;
writeFileSync(resolve("src/graph-loop/agent-icons.js"), out);
for (const [id, pieces] of Object.entries(icons)) {
  process.stdout.write(`${id}: ${pieces.length} piece(s), ${pieces.map((d) => d.length).join("/")} chars\n`);
}
