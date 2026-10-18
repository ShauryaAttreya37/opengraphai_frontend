import {
  BoxGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  TetrahedronGeometry,
  Vector3,
} from "three";
import { LOOP, TAU, createRandom, easeInOutCubic, hump, seg } from "./motion.js";
import { MARK, NODES, SOURCES, T, markGroupOf, returnStart, sourceWindow } from "./layout.js";

// Small geometric data particles. Each one peels off a source object, trails
// it toward the graph, and dissolves into a node; on the way back it bursts
// from a mark vertex and dissolves into the source again. Both flights use
// hump() scaling, so particles are invisible at t = 0 and t = LOOP.

const PER_SOURCE = 22;
const COBALT_EVERY = 5;

function cubic(p0, p1, p2, p3, u, out) {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const d = u * u * u;
  return out.set(
    a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    a * p0.z + b * p1.z + c * p2.z + d * p3.z,
  );
}

function jitter(rand, amount) {
  return new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(amount);
}

function buildParticle(rand, sourceIndex) {
  const source = SOURCES[sourceIndex];
  const home = new Vector3(...source.home);
  const side = Math.sign(home.x);
  const target = NODES[Math.floor(rand() * NODES.length)];
  const end = new Vector3(...target.pos).add(jitter(rand, 0.25));
  const mark = new Vector3(...MARK[markGroupOf(target)].pos);
  const start = home.clone().add(jitter(rand, 0.9));
  const lift = (rand() - 0.5) * 2.4;
  return {
    sourceIndex,
    lag: rand(),
    size: 0.028 + rand() * 0.034,
    spin: new Vector3(rand(), rand(), rand()).normalize(),
    spinCycles: 1 + Math.floor(rand() * 3),
    out: [
      start,
      start.clone().add(new Vector3(-side * (1.2 + rand() * 1.4), lift, 0.6 + rand())),
      end.clone().add(new Vector3(side * (0.8 + rand()), -lift * 0.5, 0.4)),
      end,
    ],
    back: [
      mark,
      mark.clone().add(new Vector3(side * (1 + rand() * 1.4), lift * 0.8, 0.8 + rand())),
      start.clone().add(new Vector3(-side * (1.4 + rand()), -lift * 0.4, 0.4)),
      start,
    ],
  };
}

export function createParticles(scene) {
  const rand = createRandom(31);
  const particles = SOURCES.flatMap((_, s) =>
    Array.from({ length: PER_SOURCE }, () => buildParticle(rand, s)),
  );
  const inkCount = particles.filter((_, i) => i % COBALT_EVERY !== 0).length;
  const ink = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.7, metalness: 0 }),
    inkCount,
  );
  const cobalt = new InstancedMesh(
    new TetrahedronGeometry(0.8, 0),
    new MeshBasicMaterial({ color: 0x2457d6, toneMapped: false }),
    particles.length - inkCount,
  );
  ink.frustumCulled = false;
  cobalt.frustumCulled = false;
  scene.add(ink, cobalt);

  const dummy = new Object3D();
  const pos = new Vector3();

  return {
    update(t) {
      let inkIndex = 0;
      let cobaltIndex = 0;
      particles.forEach((p, i) => {
        const win = sourceWindow(p.sourceIndex);
        const outU = seg(t, win.depart + p.lag * 0.7, win.arrive + p.lag * 0.5);
        const backStart = returnStart(p.sourceIndex) + p.lag * 0.35;
        const backU = seg(t, backStart, T.sourceReturnEnd - 0.1);
        let scale = 0;
        if (outU > 0 && outU < 1) {
          cubic(...p.out, easeInOutCubic(outU), pos);
          scale = hump(outU) ** 0.7;
        } else if (backU > 0 && backU < 1) {
          cubic(...p.back, easeInOutCubic(backU), pos);
          scale = hump(backU) ** 0.7;
        } else {
          pos.set(0, -50, 0);
        }
        dummy.position.copy(pos);
        dummy.quaternion.setFromAxisAngle(p.spin, (TAU * p.spinCycles * t) / LOOP);
        dummy.scale.setScalar(Math.max(1e-4, p.size * scale));
        dummy.updateMatrix();
        if (i % COBALT_EVERY === 0) {
          cobalt.setMatrixAt(cobaltIndex, dummy.matrix);
          cobaltIndex += 1;
        } else {
          ink.setMatrixAt(inkIndex, dummy.matrix);
          inkIndex += 1;
        }
      });
      ink.instanceMatrix.needsUpdate = true;
      cobalt.instanceMatrix.needsUpdate = true;
    },
  };
}
