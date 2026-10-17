import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  Mesh,
  Shape,
  ShapeGeometry,
  TorusGeometry,
} from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

// Matte ceramic source objects. Detail is carried by abstract ink strokes
// (never readable text) and one or two small cobalt accents per object.

const FACE_GAP = 0.004;

function outline(geometry, material) {
  const edges = new LineSegmentsGeometry().fromEdgesGeometry(new EdgesGeometry(geometry, 25));
  return new LineSegments2(edges, material);
}

function slab(group, mats, w, h, d) {
  const geometry = new BoxGeometry(w, h, d);
  const body = new Mesh(geometry, mats.ceramic);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body, outline(geometry, mats.edge));
  return d / 2 + FACE_GAP;
}

/** A flat stroke lying on a face; used for abstract "lines of content". */
function stroke(group, material, w, h, x, y, z) {
  const mesh = new Mesh(new BoxGeometry(w, h, 0.006), material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

function buildDocument(mats) {
  const g = new Group();
  const face = slab(g, mats, 1.0, 1.32, 0.045);
  stroke(g, mats.ink, 0.52, 0.05, -0.16, 0.48, face);
  const widths = [0.74, 0.68, 0.72, 0.44, 0.7, 0.58];
  widths.forEach((w, i) => {
    const material = i === 3 ? mats.cobalt : mats.inkSoft;
    stroke(g, material, w, 0.024, -0.37 + w / 2, 0.28 - i * 0.12, face);
  });
  stroke(g, mats.inkSoft, 0.3, 0.024, -0.22, -0.48, face);
  return g;
}

function buildTable(mats) {
  const g = new Group();
  const [w, h] = [1.42, 0.96];
  const face = slab(g, mats, w, h, 0.07);
  const rows = 5;
  const cols = 4;
  stroke(g, mats.ink, w - 0.12, 0.13, 0, h / 2 - 0.13, face);
  for (let r = 1; r < rows; r += 1) {
    stroke(g, mats.inkSoft, w - 0.12, 0.012, 0, h / 2 - 0.06 - r * 0.17, face);
  }
  for (let c = 1; c < cols; c += 1) {
    stroke(g, mats.inkSoft, 0.012, h - 0.2, -w / 2 + 0.06 + (c * (w - 0.12)) / cols, -0.06, face);
  }
  stroke(g, mats.cobalt, (w - 0.12) / cols - 0.05, 0.12, 0.04 + (w - 0.12) / cols / 2 - 0.02, -0.14, face);
  return g;
}

function buildWaveform(mats) {
  const g = new Group();
  const face = slab(g, mats, 1.24, 0.8, 0.08);
  const count = 15;
  g.userData.bars = [];
  for (let i = 0; i < count; i += 1) {
    const centre = Math.abs(i - (count - 1) / 2) < 1.6;
    const bar = stroke(g, centre ? mats.cobalt : mats.ink, 0.042, 1, -0.49 + i * 0.07, 0, face);
    bar.userData.base = 0.12 + 0.42 * Math.abs(Math.sin(i * 1.7 + 0.4)) * (1 - Math.abs(i - 7) / 11);
    bar.scale.y = bar.userData.base;
    g.userData.bars.push(bar);
  }
  return g;
}

function buildImage(mats) {
  const g = new Group();
  const face = slab(g, mats, 1.28, 0.92, 0.05);
  stroke(g, mats.inset, 1.1, 0.74, 0, 0, face - 0.002);
  const ridge = new Shape();
  ridge.moveTo(-0.55, -0.37);
  ridge.lineTo(-0.2, 0.08);
  ridge.lineTo(0.02, -0.12);
  ridge.lineTo(0.22, 0.12);
  ridge.lineTo(0.55, -0.37);
  ridge.closePath();
  const mountain = new Mesh(new ShapeGeometry(ridge), mats.inkSoft);
  mountain.position.z = face + 0.003;
  const sun = new Mesh(new CircleGeometry(0.075, 32), mats.cobalt);
  sun.position.set(0.3, 0.2, face + 0.003);
  g.add(mountain, sun);
  return g;
}

function buildCode(mats) {
  const g = new Group();
  const [w, h] = [1.22, 0.92];
  const face = slab(g, mats, w, h, 0.07);
  [0, 1, 2].forEach((i) => stroke(g, mats.ink, 0.045, 0.045, -0.5 + i * 0.075, h / 2 - 0.1, face));
  const lines = [
    [0, 0.42], [1, 0.5], [2, 0.36], [2, 0.46], [1, 0.22], [1, 0.4], [0, 0.18],
  ];
  lines.forEach(([indent, len], i) => {
    const material = i === 3 ? mats.cobalt : mats.inkSoft;
    const x = -0.5 + indent * 0.1 + len / 2;
    stroke(g, material, len, 0.026, x, h / 2 - 0.24 - i * 0.085, face);
  });
  return g;
}

function buildDatabase(mats) {
  const g = new Group();
  const tiers = 3;
  for (let i = 0; i < tiers; i += 1) {
    const geometry = new CylinderGeometry(0.42, 0.42, 0.22, 64, 1);
    const tier = new Mesh(geometry, mats.ceramic);
    tier.castShadow = true;
    tier.receiveShadow = true;
    tier.position.y = (i - 1) * 0.27;
    const rim = outline(geometry, mats.edge);
    rim.position.y = tier.position.y;
    g.add(tier, rim);
  }
  const ring = new Mesh(new TorusGeometry(0.425, 0.009, 8, 96), mats.cobalt);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.135;
  g.add(ring);
  g.rotation.x = 0.28;
  const wrapper = new Group();
  wrapper.add(g);
  return wrapper;
}

const BUILDERS = {
  document: buildDocument,
  table: buildTable,
  waveform: buildWaveform,
  image: buildImage,
  code: buildCode,
  database: buildDatabase,
};

export function buildSource(kind, mats) {
  const build = BUILDERS[kind];
  if (!build) throw new Error(`Unknown source kind: ${kind}`);
  return build(mats);
}
