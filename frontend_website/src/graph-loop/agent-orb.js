import { createTimeline, svg } from "animejs";
import {
  BackSide,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  SphereGeometry,
  Vector3,
} from "three";
import { AGENT_ICONS } from "./agent-icons.js";
import { T } from "./layout.js";
import { PALETTE } from "./graph.js";

// The querying agent: a coloured orb whose mark morphs through the coding
// agents OpenGraph AI works with. anime.js owns the morph (svg.morphTo on
// hidden SVG paths) and the colour change; its timeline is seeked to the
// loop time on every frame, so the scene stays a pure function of t.

export const AGENTS = [
  { id: "claude", orb: "#D97757", glyph: "#FFF8F1" },
  { id: "codex", orb: "#4F5BFF", glyph: "#FFFFFF" },
  { id: "cursor", orb: "#1C1D21", glyph: "#F4F2ED" },
  { id: "gemini", orb: "#3186FF", glyph: "#FFFFFF" },
  { id: "grok", orb: "#FBFAF6", glyph: "#0B0B0C" },
];

const ORB_RADIUS = 0.3;
const GLYPH_SIZE = ORB_RADIUS * 2 * 0.6;
const TEXTURE_SIZE = 512;
const MORPH_PRECISION = 0.6;
const SVG_NS = "http://www.w3.org/2000/svg";

function createHiddenSvg() {
  const host = document.createElementNS(SVG_NS, "svg");
  host.setAttribute("aria-hidden", "true");
  host.setAttribute("viewBox", "0 0 100 100");
  // visibility (not display) keeps path geometry measurable for morphTo.
  host.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none";
  document.body.appendChild(host);
  return host;
}

function addPath(host, d) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  host.appendChild(path);
  return path;
}

/** A tiny closed loop at a piece's centre: where missing pieces grow from. */
function dotAt(host, d) {
  const probe = addPath(host, d);
  const box = probe.getBBox();
  probe.remove();
  const [x, y, r] = [box.x + box.width / 2, box.y + box.height / 2, 0.4];
  return `M${x} ${y - r}a${r} ${r} 0 1 1 0 ${2 * r}a${r} ${r} 0 1 1 0 ${-2 * r}Z`;
}

/** Morph start times: one per hand-off between consecutive agents. */
const morphWindows = () =>
  AGENTS.slice(1).map((_, i) => {
    const start = T.agentMorph.first + i * T.agentMorph.every;
    return { start, end: start + T.agentMorph.duration };
  });

function buildTimeline(host, state) {
  const timeline = createTimeline({ autoplay: false });
  const icons = AGENTS.map((a) => AGENT_ICONS[a.id]);
  const transitions = morphWindows().map(({ start, end }, i) => {
    const [from, to] = [icons[i], icons[i + 1]];
    const slots = Math.max(from.length, to.length);
    const at = start * 1000;
    const duration = (end - start) * 1000;
    const pieces = Array.from({ length: slots }, (_, k) => {
      const piece = addPath(host, from[k] ?? dotAt(host, to[k]));
      const target = addPath(host, to[k] ?? dotAt(host, from[k]));
      timeline.add(piece, { d: svg.morphTo(target, MORPH_PRECISION), duration, ease: "inOutCubic" }, at);
      return piece;
    });
    const next = AGENTS[i + 1];
    // A steep colour ease keeps the muddy midpoint between brand colours brief.
    timeline.add(state, { orb: next.orb, glyph: next.glyph, duration, ease: "inOutQuart" }, at);
    timeline.add(state, {
      pop: [
        { to: 0.9, duration: duration * 0.4, ease: "outQuad" },
        { to: 1, duration: duration * 1.1, ease: "outElastic(1, .55)" },
      ],
    }, at);
    return { start, end, pieces };
  });
  return { timeline, transitions, icons };
}

/** anime.js reports colours as rgba() strings; three wants plain RGB. */
function setCssColor(color, css) {
  if (css.startsWith("#")) return color.set(css);
  const [r, g, b] = css.match(/[\d.]+/g).map(Number);
  return color.setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
}

function createGlyphCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  const ctx = canvas.getContext("2d");
  const scale = TEXTURE_SIZE / 100;
  return {
    texture,
    draw(pieces, fill) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.fillStyle = fill;
      ctx.fill(new Path2D(pieces.join(" ")), "evenodd");
      texture.needsUpdate = true;
    },
  };
}

export function createAgentOrb(scene) {
  const state = { orb: AGENTS[0].orb, glyph: AGENTS[0].glyph, pop: 1 };
  const host = createHiddenSvg();
  const { timeline, transitions, icons } = buildTimeline(host, state);

  const orbMaterial = new MeshStandardMaterial({ color: AGENTS[0].orb, roughness: 0.78, metalness: 0 });
  const orb = new Mesh(new SphereGeometry(ORB_RADIUS, 64, 40), orbMaterial);
  orb.castShadow = true;
  const hull = new Mesh(
    new SphereGeometry(ORB_RADIUS, 48, 32),
    new MeshBasicMaterial({ color: PALETTE.ink, side: BackSide }),
  );
  hull.scale.setScalar(1.045);
  const group = new Group();
  group.add(orb, hull);

  const glyphCanvas = createGlyphCanvas();
  const glyph = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({ map: glyphCanvas.texture, transparent: true, depthWrite: false, toneMapped: false }),
  );
  glyph.renderOrder = 4;
  scene.add(group, glyph);

  const toCamera = new Vector3();

  function currentPieces(t) {
    for (let i = transitions.length - 1; i >= 0; i -= 1) {
      const { start, end, pieces } = transitions[i];
      if (t < start) continue;
      return t < end ? pieces.map((p) => p.getAttribute("d")) : icons[i + 1];
    }
    return icons[0];
  }

  return {
    group,
    /** Call after the group is positioned/scaled and the camera is placed. */
    update(t, camera) {
      glyph.visible = group.visible;
      if (!group.visible) return;
      timeline.seek(t * 1000);
      setCssColor(orbMaterial.color, state.orb);
      const size = group.scale.x * state.pop;
      group.scale.setScalar(size);
      toCamera.subVectors(camera.position, group.position).normalize();
      glyph.position.copy(group.position).addScaledVector(toCamera, ORB_RADIUS * size + 0.004);
      // Face the camera position, not its view direction: off-axis, a plane
      // parallel to the image plane would tilt into the sphere and clip.
      glyph.lookAt(camera.position);
      glyph.scale.setScalar(GLYPH_SIZE * size);
      glyphCanvas.draw(currentPieces(t), state.glyph);
    },
  };
}
