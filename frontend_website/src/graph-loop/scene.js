import {
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShadowMaterial,
  VSMShadowMap,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { createAgentOrb } from "./agent-orb.js";
import { PALETTE, createGraph } from "./graph.js";
import { MARK, NODES, SOURCES, T, markGroupOf, returnStart, sourceWindow } from "./layout.js";
import {
  LOOP,
  TAU,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  hump,
  seg,
  wave,
} from "./motion.js";
import { createParticles } from "./particles.js";
import { buildSource } from "./sources.js";

const FOV = 22;
const HALF_TAN = Math.tan((FOV / 2) * (Math.PI / 180));
const FRAME_HALF_WIDTH = 7.6;
// Narrow frames fit the graph, not the sources: they drift in from off-frame.
const NARROW_ASPECT = 1.8;
const NARROW_HALF_WIDTH = 4.3;
const FRAME_HALF_HEIGHT = 3.3;
const REFERENCE_WIDTH = 1400;

function cubic(p, u, out) {
  const v = 1 - u;
  return out
    .copy(p[0]).multiplyScalar(v * v * v)
    .addScaledVector(p[1], 3 * v * v * u)
    .addScaledVector(p[2], 3 * v * u * u)
    .addScaledVector(p[3], u * u * u);
}

function createMaterials() {
  return {
    ceramic: new MeshStandardMaterial({ color: 0xefebe3, roughness: 0.88, metalness: 0 }),
    inset: new MeshStandardMaterial({ color: 0xe3ded4, roughness: 0.92, metalness: 0 }),
    ink: new MeshBasicMaterial({ color: PALETTE.ink }),
    inkSoft: new MeshBasicMaterial({ color: PALETTE.ink, transparent: true, opacity: 0.5 }),
    cobalt: new MeshBasicMaterial({ color: PALETTE.cobalt, toneMapped: false }),
    edge: new LineMaterial({ color: 0x121418, linewidth: 1.1 }),
  };
}

function createSources(scene, mats) {
  return SOURCES.map((source, i) => {
    const object = buildSource(source.kind, mats);
    scene.add(object);
    const home = new Vector3(...source.home);
    const node = NODES.find((n) => n.id === source.node);
    const nodePos = new Vector3(...node.pos);
    // Sources sharing a mark vertex leave from spread-out points around it.
    const markPos = new Vector3(...MARK[markGroupOf(node)].pos).lerp(nodePos, 0.4);
    const side = Math.sign(home.x);
    const vertical = Math.sign(home.y) || 1;
    return {
      object,
      home,
      side,
      phase: i * 1.3,
      window: sourceWindow(i),
      returnAt: returnStart(i),
      outPath: [
        home,
        home.clone().add(new Vector3(-side * 1.9, -0.35 * vertical, 1.2)),
        nodePos.clone().add(new Vector3(side * 1.5, 0.7 * vertical, 0.6)),
        nodePos,
      ],
      backPath: [
        markPos,
        markPos.clone().add(new Vector3(side * 1.6, -0.9 * vertical, 1.2)),
        home.clone().add(new Vector3(-side * 1.7, -0.4 * vertical, 0.9)),
        home,
      ],
      at: new Vector3(),
    };
  });
}

function updateSources(sources, t) {
  for (const s of sources) {
    const { depart, arrive } = s.window;
    let scale;
    let spin;
    if (t < s.returnAt) {
      const travel = easeInOutCubic(seg(t, depart, arrive));
      cubic(s.outPath, travel, s.at);
      scale = 1 - easeInCubic(seg(travel, 0.45, 1));
      spin = travel;
    } else {
      const back = easeInOutCubic(seg(t, s.returnAt, T.sourceReturnEnd));
      cubic(s.backPath, back, s.at);
      scale = easeOutBack(seg(back, 0.15, 0.85), 1.1);
      spin = 1 - back;
    }
    const { object } = s;
    object.visible = scale > 0.002;
    object.position.copy(s.at);
    object.position.y += 0.07 * wave(t, 2, s.phase);
    object.scale.setScalar(Math.max(scale, 1e-4));
    object.rotation.set(
      -0.2 + 0.06 * wave(t, 1, s.phase),
      -s.home.x * 0.07 - s.side * spin * 0.8,
      0.03 * wave(t, 1, s.phase + 2),
    );
    for (const [j, bar] of (object.userData.bars ?? []).entries()) {
      bar.scale.y = bar.userData.base * (0.78 + 0.22 * wave(t, 6, j * 0.9));
    }
  }
}

// The agent flies the same path as before; agent-orb.js owns its look.
const AGENT_ENTER_PATH = [new Vector3(9.4, 1.3, 0.9), new Vector3(7.2, 1.7, 1.4), new Vector3(5.2, 0.4, 0.8), new Vector3(4.25, 0.3, 0.6)];
const AGENT_EXIT_PATH = [new Vector3(4.25, 0.3, 0.6), new Vector3(5.4, 0.2, 0.9), new Vector3(7.4, -0.5, 0.6), new Vector3(9.6, -0.7, 0.3)];

function updateAgent(agent, t) {
  const enter = seg(t, ...T.agentEnter);
  const exit = seg(t, ...T.agentExit);
  const { group } = agent;
  group.visible = enter > 0 && exit < 1;
  if (!group.visible) return;
  if (exit > 0) cubic(AGENT_EXIT_PATH, easeInCubic(exit), group.position);
  else cubic(AGENT_ENTER_PATH, easeOutCubic(enter), group.position);
  group.position.x += 0.1 * hump(seg(t, 6.1, 6.55));
  group.position.y += 0.035 * wave(t, 3, 0.5);
  const scale = easeOutBack(seg(t, T.agentEnter[0], T.agentEnter[0] + 0.6)) * (1 - easeInCubic(exit) * 0.6);
  group.scale.setScalar(Math.max(scale, 1e-4));
}

function createStage(scene) {
  scene.add(new HemisphereLight(0xfffaf1, 0xd9d2c4, 0.85));
  const key = new DirectionalLight(0xffffff, 1.7);
  key.position.set(-4, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 8, bottom: -8, near: 1, far: 30 });
  key.shadow.radius = 18;
  key.shadow.blurSamples = 24;
  key.shadow.bias = -0.0008;
  scene.add(key);
  const fill = new DirectionalLight(0xfff8ee, 0.75);
  fill.position.set(1.5, 2.5, 12);
  scene.add(fill);
  const ground = new Mesh(new PlaneGeometry(60, 60), new ShadowMaterial({ color: 0x3c3428, opacity: 0.06 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3.15;
  ground.receiveShadow = true;
  scene.add(ground);
}

function placeCamera(camera, t, baseDistance) {
  const dolly = 1 - 0.055 * (1 - Math.cos((TAU * t) / LOOP)) * 0.5;
  const distance = baseDistance * dolly;
  const orbit = 0.14 * wave(t, 1);
  const height = 2.1 + 0.3 * wave(t, 1, Math.PI / 2);
  camera.position.set(distance * Math.sin(orbit), height, distance * Math.cos(orbit));
  camera.lookAt(0, 0.05, 0);
  camera.updateMatrixWorld();
}

/**
 * Builds the loop into `canvas`. `renderAt(t)` is pure in t (seconds, any
 * value; wrapped to [0, LOOP)), so a live player and a frame exporter
 * produce identical frames.
 */
export function createGraphLoop(canvas, { preserveDrawingBuffer = false } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const camera = new PerspectiveCamera(FOV, 21 / 9, 0.1, 120);
  const mats = createMaterials();
  createStage(scene);
  const sources = createSources(scene, mats);
  const agent = createAgentOrb(scene);
  const graph = createGraph(scene);
  const particles = createParticles(scene);

  const fixedWidthLines = [mats.edge];
  const baseWidths = new Map(fixedWidthLines.map((m) => [m, m.linewidth]));
  let baseDistance = 17;
  let lineScale = 1;

  function resize(width, height, pixelRatio = 1) {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    baseDistance = Math.max(
      FRAME_HALF_HEIGHT / HALF_TAN,
      (camera.aspect < NARROW_ASPECT ? NARROW_HALF_WIDTH : FRAME_HALF_WIDTH) / (camera.aspect * HALF_TAN),
    );
    lineScale = Math.min(2, Math.max(0.75, width / REFERENCE_WIDTH));
    const materials = [...fixedWidthLines, ...graph.lines.map((l) => l.material)];
    for (const material of materials) material.resolution.set(width, height);
    for (const [material, base] of baseWidths) material.linewidth = base * lineScale;
  }

  function renderAt(time) {
    const t = ((time % LOOP) + LOOP) % LOOP;
    placeCamera(camera, t, baseDistance);
    updateSources(sources, t);
    updateAgent(agent, t);
    agent.update(t, camera);
    graph.update(t, camera, { position: agent.group.position, visible: agent.group.visible }, lineScale);
    particles.update(t);
    renderer.render(scene, camera);
  }

  return { renderAt, resize };
}
