// Hand-placed composition for a 21:9 frame. World units: the visible frame is
// roughly x in [-8, 8], y in [-3.4, 3.4] at z = 0. Graph nodes sit on three
// depth layers (z around -1.2, 0 and +1.2) so the camera dolly gives parallax.

/**
 * Source objects: where they float at rest and which graph node they become.
 * Only the inputs the released packages read: documents (opengraph-text),
 * tables (opengraph-table), and images (opengraph-image).
 */
export const SOURCES = [
  { kind: "document", home: [-6.1, 1.35, 0.0], node: "S0" },
  { kind: "table", home: [-5.6, -1.55, 0.8], node: "S1" },
  { kind: "image", home: [5.9, 1.45, -0.3], node: "S3" },
];

// role: source | hub | entry | leaf. `order` staggers the build.
export const NODES = [
  { id: "S0", pos: [-2.9, 0.9, 0.3], r: 0.19, role: "source" },
  { id: "S1", pos: [-2.6, -1.0, 0.9], r: 0.19, role: "source" },
  { id: "S3", pos: [2.7, 1.1, -0.5], r: 0.19, role: "source" },
  { id: "H0", pos: [-1.5, 0.1, 0.0], r: 0.17, role: "hub", order: 0 },
  { id: "H1", pos: [-0.2, 0.75, 0.6], r: 0.17, role: "hub", order: 2 },
  { id: "H2", pos: [0.3, -0.55, -0.4], r: 0.16, role: "hub", order: 4 },
  { id: "H3", pos: [1.5, 0.3, 0.2], r: 0.17, role: "hub", order: 1 },
  { id: "H4", pos: [-0.9, -0.95, 1.3], r: 0.14, role: "hub", order: 5 },
  { id: "H5", pos: [0.8, 1.45, 1.0], r: 0.14, role: "hub", order: 3 },
  { id: "Q", pos: [3.45, 0.15, 0.4], r: 0.14, role: "entry", order: 6 },
  { id: "L0", pos: [-2.0, 1.75, 1.4], r: 0.09, role: "leaf", order: 7 },
  { id: "L1", pos: [-3.5, -0.1, -1.1], r: 0.09, role: "leaf", order: 9 },
  { id: "L2", pos: [1.9, -1.85, -1.4], r: 0.09, role: "leaf", order: 8 },
  { id: "L3", pos: [3.3, 1.75, 0.9], r: 0.08, role: "leaf", order: 11 },
  { id: "L4", pos: [-0.4, -1.85, -0.2], r: 0.09, role: "leaf", order: 10 },
  { id: "L5", pos: [1.2, 1.95, -1.5], r: 0.08, role: "leaf", order: 12 },
  { id: "L6", pos: [-2.1, -1.75, -0.8], r: 0.08, role: "leaf", order: 13 },
];

export const EDGES = [
  ["S0", "H0"], ["S1", "H0"], ["S1", "H4"], ["S0", "H1"],
  ["H0", "H1"], ["H0", "H4"], ["H1", "H2"], ["H1", "H5"], ["H4", "H2"],
  ["H2", "H3"], ["H3", "S3"], ["H3", "Q"],
  ["Q", "S3"], ["H5", "S3"], ["H5", "H3"], ["H1", "H3"],
  ["L0", "S0"], ["L0", "H1"], ["L1", "S0"], ["L1", "S1"], ["L2", "H2"],
  ["L2", "H3"], ["L3", "S3"], ["L4", "H4"], ["L4", "H2"], ["L5", "H5"],
  ["L5", "H1"], ["L6", "S1"], ["L6", "H4"],
];

/**
 * The cited evidence path, traced backward from the agent's entry node to
 * the original sources. Each hop lights up over `dur` seconds from `at`.
 */
export const EVIDENCE = [
  { from: "Q", to: "H3", at: 6.45, dur: 0.38 },
  { from: "H3", to: "H1", at: 6.83, dur: 0.4 },
  { from: "H3", to: "S3", at: 6.83, dur: 0.44 },
  { from: "H1", to: "H0", at: 7.23, dur: 0.38 },
  { from: "H0", to: "S0", at: 7.61, dur: 0.4 },
  { from: "H0", to: "S1", at: 7.61, dur: 0.42 },
];

/** Which nodes are cited, and when the pulse reaches (locks) each of them. */
export const LOCK_TIMES = EVIDENCE.reduce(
  (acc, hop) => ({ ...acc, [hop.to]: hop.at + hop.dur }),
  { Q: 6.45 },
);

// The closing formation follows the nav mark: an open triangle whose apex
// sits slightly left of centre, drawn as two strokes (BL -> TOP -> BR).
export const MARK = {
  BL: { rep: "H0", pos: [-1.2, -0.66, 0.3] },
  TOP: { rep: "H1", pos: [-0.04, 1.2, 0.3] },
  BR: { rep: "H3", pos: [1.26, -0.86, 0.3] },
};
export const MARK_EDGES = [["H0", "H1"], ["H1", "H3"]];

/** Every node merges into the mark vertex on its side of the frame. */
export const markGroupOf = (node) => {
  if (node.pos[0] < -0.8) return "BL";
  if (node.pos[0] > 0.8) return "BR";
  return "TOP";
};

/** Master timeline, in seconds. */
export const T = {
  sourceDepart: 1.1,
  sourceTravel: 2.2,
  sourceStagger: 0.12,
  hubAppear: 3.0,
  hubStagger: 0.08,
  edgeDraw: 0.6,
  agentEnter: [5.2, 6.35],
  dim: [6.9, 7.7],
  collapse: [8.55, 9.7],
  // The agent orb morphs Claude -> Cursor (the clients the project README
  // names), holds the last mark, then leaves.
  agentMorph: { first: 7.6, every: 0.77, duration: 0.32 },
  agentExit: [9.55, 10.5],
  markFade: [10.35, 11.0],
  sourceReturn: 10.45,
  sourceReturnEnd: 11.85,
};

export const LABELLED_NODES = ["S0", "S1", "S3", "H1", "H3", "L1"];

/** Outbound flight window for source i; its node appears 70% of the way in. */
export const sourceWindow = (i) => {
  const depart = T.sourceDepart + i * T.sourceStagger;
  return { depart, arrive: depart + T.sourceTravel, nodeAt: depart + T.sourceTravel * 0.7 };
};

/** When source i starts flying home from its mark vertex. */
export const returnStart = (i) => T.sourceReturn + i * 0.07;
