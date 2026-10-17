import { animate, createTimeline, stagger, svg } from "animejs";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./styles.css";
import { initialiseMorphicNavbar } from "./site-nav.js";

const lenis = new Lenis({
  autoRaf: true,
  lerp: 0.09,
  smoothWheel: true,
  wheelMultiplier: 0.95,
  touchMultiplier: 1.0,
});

// Colours live in theme.css so a palette flip is one data-theme attribute.
// Canvas and inline SVG fills can't read var(), so resolve the token once here.
function themeToken(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const groundInk = () => themeToken("--ground-ink", "#000000");
const groundInkRgb = () => themeToken("--ground-ink-rgb", "0 0 0").replace(/\s+/g, ", ");

const SCROLL_DRIFT_TOLERANCE_PX = 6;

function smoothScrollToElement(target, options = {}) {
  if (!target) return Promise.resolve(false);

  const navigation = document.querySelector(".morphic-navbar");
  const offset = options.offset ?? Math.max((navigation?.offsetHeight || 52) + 28, 76);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    lenis.scrollTo(target, { offset: -offset, immediate: true });
    return Promise.resolve(true);
  }

  const glide = () => new Promise((resolve) => {
    lenis.scrollTo(target, {
      offset: -offset,
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      onComplete: () => resolve(true),
    });
  });

  // Lazy demos above the target can grow or shrink while the page glides past
  // them, leaving Lenis aimed at a stale position. Snap to the settled spot.
  return glide().then(() => {
    const drift = target.getBoundingClientRect().top - offset;
    if (Math.abs(drift) > SCROLL_DRIFT_TOLERANCE_PX) lenis.scrollTo(target, { offset: -offset, immediate: true });
    return true;
  });
}

function initialiseScrollParallax() {
  if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;
  const layers = [];
  const register = (selector, speed, maxTravel = 30) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      layers.push({
        element,
        speed: Array.isArray(speed) ? speed[index % speed.length] : speed,
        maxTravel,
      });
      element.classList.add("is-parallax-layer");
    });
  };

  // Keep parallax exclusively on the depth canvas to avoid layout jitter on text/headers
  register(".graph-background", 0.08, 48);
  if (!layers.length) return;

  let cachedLayers = [];
  const measure = () => {
    const scrollY = lenis.scroll || window.scrollY;
    cachedLayers = layers.map((layer) => {
      const rect = layer.element.getBoundingClientRect();
      return {
        ...layer,
        top: rect.top + scrollY,
        height: rect.height,
      };
    });
  };

  const clamp = (value, max) => Math.min(Math.max(value, -max), max);
  const update = (scrollVal) => {
    const scroll = typeof scrollVal === "number" ? scrollVal : (lenis.scroll || window.scrollY);
    const viewportCenter = window.innerHeight / 2;

    cachedLayers.forEach((layer) => {
      const layerTopOnScreen = layer.top - scroll;
      if (layerTopOnScreen + layer.height < -120 || layerTopOnScreen > window.innerHeight + 120) return;
      const layerCenter = layerTopOnScreen + layer.height / 2;
      const offset = clamp(-(layerCenter - viewportCenter) * layer.speed, layer.maxTravel);
      layer.element.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  };

  measure();
  update();

  lenis.on("scroll", ({ scroll }) => {
    update(scroll);
  });

  window.addEventListener("resize", () => {
    measure();
    update();
  }, { passive: true });
}

function initialiseToTopButton() {
  const button = document.querySelector("[data-to-top]");
  const hero = document.querySelector("#home");
  if (!button || !hero) return;

  let threshold = 520;
  const updateThreshold = () => {
    threshold = Math.max(hero.offsetHeight * 0.72, 520);
  };
  updateThreshold();
  window.addEventListener("resize", updateThreshold, { passive: true });

  const updateVisibility = (scrollY) => {
    const scroll = typeof scrollY === "number" ? scrollY : (lenis.scroll || window.scrollY);
    button.classList.toggle("is-visible", scroll > threshold);
  };

  lenis.on("scroll", ({ scroll }) => {
    updateVisibility(scroll);
  });

  button.addEventListener("click", () => {
    smoothScrollToElement(hero, { offset: 0 }).then((completed) => {
      if (completed) history.pushState(null, "", "#home");
    });
  });

  updateVisibility();
}

function initialiseGraphBackground() {
  const canvas = document.querySelector("#graph-background");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;
  const staticCanvas = document.createElement("canvas");
  const staticContext = staticCanvas.getContext("2d");
  if (!staticContext) return;
  const hero = canvas.closest(".hero");
  if (!hero) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let staticParticles = [];
  let movingParticles = [];
  let frame = 0;
  let visible = true;
  let lastDraw = -Infinity;
  let ink = groundInkRgb();
  let signal = themeToken("--signal-rgb", "36 87 214").replace(/\s+/g, ", ");
  const frameInterval = 1000 / 24;
  const cursor = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    velocityX: 0,
    velocityY: 0,
    strength: 0,
    active: false,
  };

  function buildSheet() {
    staticParticles = [];
    movingParticles = [];
    const spacing = Math.max(18, Math.sqrt(width * height / 3400));
    const columns = Math.ceil(width / spacing) + 2;
    const rows = Math.ceil(height / spacing) + 2;

    for (let row = -1; row < rows; row += 1) {
      for (let column = -1; column < columns; column += 1) {
        const seed = ((column * 73856093) ^ (row * 19349663)) >>> 0;
        const random = (seed % 1000) / 1000;
        const particle = {
          x: column * spacing + (random - 0.5) * 4,
          y: row * spacing + (((seed >> 8) % 1000) / 1000 - 0.5) * 4,
          phase: random * Math.PI * 2,
          size: 1.05 + ((seed >> 5) % 9) * 0.11,
          accent: seed % 31 === 0,
          bright: seed % 97 === 0,
        };
        if (seed % 3 === 0 || particle.accent || particle.bright) movingParticles.push(particle);
        else staticParticles.push(particle);
      }
    }
  }

  const particleBuckets = Array.from({ length: 16 }, () => []);
  const bucketColors = Array.from({ length: 16 }, () => "");

  function updateBucketColors() {
    for (let index = 0; index < 16; index += 1) {
      bucketColors[index] = `rgba(${index < 8 ? ink : signal}, ${(index % 8 + 1) / 8})`;
    }
  }

  function paintParticles(target, collection, time, interact = false) {
    for (let index = 0; index < 16; index += 1) {
      particleBuckets[index].length = 0;
    }
    const influenceRadius = Math.min(240, Math.max(155, width * 0.16));
    const speed = Math.hypot(cursor.velocityX, cursor.velocityY);
    const swirl = Math.max(-34, Math.min(34, (cursor.velocityX - cursor.velocityY) * 1.4));

    for (let i = 0; i < collection.length; i += 1) {
      const particle = collection[i];
      const broadWave = Math.sin(particle.x * 0.011 + time * 1.7 + particle.phase * 0.16);
      const crossWave = Math.sin((particle.x + particle.y) * 0.007 - time * 1.25 + particle.phase);
      const ribbon = (1 - Math.abs(Math.sin(particle.x * 0.008 + particle.y * 0.004 - time))) ** 3;
      let x = particle.x + Math.sin(particle.y * 0.012 - time + particle.phase * 0.1) * 9 + crossWave * 3;
      let y = particle.y + broadWave * 21 + crossWave * 7;
      let energy = Math.min(1, (broadWave + 1) * 0.32 + ribbon * 0.7);

      if (interact) {
        const deltaX = x - cursor.x;
        const deltaY = y - cursor.y;
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;
        if (distanceSquared < influenceRadius * influenceRadius) {
          const distance = Math.sqrt(distanceSquared);
          const force = (1 - distance / influenceRadius) ** 1.55 * cursor.strength;
          const angle = Math.atan2(deltaY, deltaX);
          const ripple = Math.sin(distance * 0.082 - time * 11) * force;
          x += Math.cos(angle) * force * 62 - Math.sin(angle) * force * swirl + cursor.velocityX * force * 0.8;
          y += Math.sin(angle) * force * 62 + Math.cos(angle) * force * swirl + cursor.velocityY * force * 0.8 + ripple * 24;
          energy = Math.min(1, energy + force * (2.1 + speed * 0.035));
        }
      }

      const alpha = particle.accent ? 0.44 + energy * 0.52 : particle.bright ? 0.58 : 0.12 + energy * 0.27;
      const bucket = Math.max(0, Math.min(7, Math.round(alpha * 8) - 1));
      const radius = particle.accent
        ? particle.size * 0.95
        : particle.size * (0.45 + energy * 0.18);
      const bucketIndex = bucket + (particle.accent ? 8 : 0);
      particleBuckets[bucketIndex].push(x, y, radius);
    }

    for (let index = 0; index < 16; index += 1) {
      const bucketData = particleBuckets[index];
      if (bucketData.length === 0) continue;
      target.fillStyle = bucketColors[index];
      target.beginPath();
      for (let j = 0; j < bucketData.length; j += 3) {
        const px = bucketData[j];
        const py = bucketData[j + 1];
        const pr = bucketData[j + 2];
        target.moveTo(px + pr, py);
        target.arc(px, py, pr, 0, Math.PI * 2);
      }
      target.fill();
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    staticCanvas.width = canvas.width;
    staticCanvas.height = canvas.height;
    buildSheet();
    ink = groundInkRgb();
    signal = themeToken("--signal-rgb", "36 87 214").replace(/\s+/g, ", ");
    updateBucketColors();
    staticContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    staticContext.clearRect(0, 0, width, height);
    paintParticles(staticContext, staticParticles, 0);
    lastDraw = -Infinity;
    if (motion.matches) draw(0);
  }

  function draw(timestamp) {
    frame = 0;
    if (!motion.matches && visible && !document.hidden) frame = requestAnimationFrame(draw);
    if (lenis.isScrolling) return;
    if (timestamp - lastDraw < frameInterval - 1) return;
    lastDraw = timestamp;
    const time = timestamp * 0.00034;
    cursor.x += (cursor.targetX - cursor.x) * 0.22;
    cursor.y += (cursor.targetY - cursor.y) * 0.22;
    cursor.velocityX *= 0.88;
    cursor.velocityY *= 0.88;
    cursor.strength += ((cursor.active ? 0.68 : 0) - cursor.strength) * 0.1;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.drawImage(staticCanvas, 0, 0, width, height);

    if (cursor.active && cursor.strength > 0.02) {
      const glowRadius = Math.min(260, Math.max(170, width * 0.16));
      const glow = context.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, glowRadius);
      glow.addColorStop(0, `rgba(${signal}, ${0.075 * cursor.strength})`);
      glow.addColorStop(0.42, `rgba(${signal}, ${0.026 * cursor.strength})`);
      glow.addColorStop(1, `rgba(${signal}, 0)`);
      context.fillStyle = glow;
      context.fillRect(cursor.x - glowRadius, cursor.y - glowRadius, glowRadius * 2, glowRadius * 2);
    }

    const interact = !motion.matches && cursor.strength > 0.01;
    paintParticles(context, movingParticles, time, interact);
  }

  hero.addEventListener("pointermove", (event) => {
    const bounds = canvas.getBoundingClientRect();
    const nextX = event.clientX - bounds.left;
    const nextY = event.clientY - bounds.top;
    cursor.velocityX = cursor.active ? nextX - cursor.targetX : 0;
    cursor.velocityY = cursor.active ? nextY - cursor.targetY : 0;
    cursor.targetX = nextX;
    cursor.targetY = nextY;
    if (!cursor.active) {
      cursor.x = nextX;
      cursor.y = nextY;
    }
    cursor.active = true;
    cursor.strength = Math.min(1, 0.68 + Math.hypot(cursor.velocityX, cursor.velocityY) * 0.025);
  }, { passive: true });

  hero.addEventListener("pointerleave", () => {
    cursor.active = false;
    cursor.targetX = -1000;
    cursor.targetY = -1000;
  }, { passive: true });

  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastDraw = -Infinity;
    hero.classList.toggle("is-animation-paused", !visible || document.hidden || motion.matches);
    if (visible && !document.hidden) {
      if (motion.matches) draw(0);
      else frame = requestAnimationFrame(draw);
    }
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: 0.01 }).observe(hero);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);

  resize();
  new ResizeObserver(resize).observe(canvas);
  sync();
}

function initialiseOffscreenMotion() {
  const regions = document.querySelectorAll("main > section, footer");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("is-offscreen-motion", !entry.isIntersecting));
  }, { rootMargin: "180px 0px" });
  regions.forEach((region) => observer.observe(region));
}

function initialiseLazyDemos() {
  document.querySelectorAll("iframe[data-lazy-demo]").forEach((iframe) => {
    let visible = false;
    const sync = () => {
      if (!iframe.hasAttribute("src")) return;
      iframe.contentWindow?.postMessage({ type: "opengraph-demo-visibility", visible: visible && !document.hidden }, location.origin);
    };
    iframe.addEventListener("load", sync);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      if (visible && !iframe.hasAttribute("src")) iframe.src = iframe.dataset.src;
      sync();
    }, { threshold: [0, 0.25] }).observe(iframe);
    document.addEventListener("visibilitychange", sync);
  });
}

const graphEntities = [
  { id: "call", label: "q3_call.wav", x: 52, y: 62, radius: 7, kind: "source", labelAt: "above" },
  { id: "signals", label: "signals.csv", x: 42, y: 146, radius: 7, kind: "source", labelAt: "below" },
  { id: "renewal", label: "renewal.pdf", x: 118, y: 174, radius: 7, kind: "source", labelAt: "below" },
  { id: "account", label: "account.json", x: 238, y: 174, radius: 7, kind: "source", labelAt: "below" },
  { id: "acme", label: "ACME", x: 150, y: 42, radius: 8, kind: "entity", labelAt: "above" },
  { id: "pricing", label: "PRICING", x: 286, y: 58, radius: 9, kind: "cited", labelAt: "above" },
  { id: "risk", label: "RISK", x: 316, y: 130, radius: 9, kind: "cited", labelAt: "below" },
  { id: "churn", label: "CUSTOMER CHURN", x: 180, y: 112, radius: 14, kind: "core", labelAt: "above" },
];

const graphRelations = [
  { from: "churn", to: "call" },
  { from: "churn", to: "signals" },
  { from: "churn", to: "renewal" },
  { from: "churn", to: "account" },
  { from: "churn", to: "acme" },
  { from: "churn", to: "pricing", cited: true },
  { from: "churn", to: "risk", cited: true },
  { from: "acme", to: "pricing" },
  { from: "account", to: "risk" },
  { from: "call", to: "acme" },
];

// Trims an edge to each node's rim so relations visibly attach instead of
// running under the dots.
function trimBetween(from, to, gap = 3.5) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const unitX = deltaX / length;
  const unitY = deltaY / length;
  const startOffset = from.radius + gap;
  const endOffset = to.radius + gap;

  return {
    x1: from.x + unitX * startOffset,
    y1: from.y + unitY * startOffset,
    x2: to.x - unitX * endOffset,
    y2: to.y - unitY * endOffset,
  };
}

function buildEntityGraph(map) {
  const namespace = "http://www.w3.org/2000/svg";
  const byId = new Map(graphEntities.map((entity) => [entity.id, entity]));
  const linkLayer = document.createElementNS(namespace, "g");
  const nodeLayer = document.createElementNS(namespace, "g");
  linkLayer.setAttribute("class", "graph-links");
  nodeLayer.setAttribute("class", "graph-nodes");
  map.replaceChildren(linkLayer, nodeLayer);

  const links = graphRelations.map((relation) => {
    const { x1, y1, x2, y2 } = trimBetween(byId.get(relation.from), byId.get(relation.to));
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", `M${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}`);
    path.setAttribute("class", relation.cited ? "graph-link evidence-link" : "graph-link");
    linkLayer.append(path);
    return path;
  });

  const bodies = [];
  const labels = [];
  const dots = [];
  const rings = [];

  for (const entity of graphEntities) {
    // The anchor carries position only. anime writes a CSS transform, which
    // overrides an SVG transform attribute outright, so the animated group
    // must never be the one holding translate().
    const anchor = document.createElementNS(namespace, "g");
    anchor.setAttribute("transform", `translate(${entity.x} ${entity.y})`);
    anchor.setAttribute("class", `graph-node graph-node-${entity.kind}`);

    const body = document.createElementNS(namespace, "g");
    body.setAttribute("class", "node-body");

    const ring = document.createElementNS(namespace, "circle");
    ring.setAttribute("class", "node-ring");
    ring.setAttribute("r", String(entity.radius + 5));

    const dot = document.createElementNS(namespace, "circle");
    dot.setAttribute("class", "node-dot");
    dot.setAttribute("r", String(entity.radius));

    body.append(ring, dot);

    if (entity.kind === "core") {
      const innerDot = document.createElementNS(namespace, "circle");
      innerDot.setAttribute("class", "node-core-dot");
      innerDot.setAttribute("r", String(entity.radius - 8));
      body.append(innerDot);
    }

    const label = document.createElementNS(namespace, "text");
    label.setAttribute("class", "node-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("y", String(entity.labelAt === "above" ? -(entity.radius + 9) : entity.radius + 17));
    label.textContent = entity.label;

    anchor.append(body, label);
    nodeLayer.append(anchor);

    bodies.push(body);
    labels.push(label);
    dots.push(dot);
    rings.push(ring);
  }

  return { links, bodies, labels, dots, rings };
}

function initialiseCompilerRail() {
  const rail = document.querySelector(".compiler-rail");
  const stages = [...document.querySelectorAll(".compiler-stage")];
  if (!rail || rail.hidden || !stages.length) return;

  const graphMap = rail.querySelector("[data-graph-map]");
  if (!graphMap) return;

  const graph = buildEntityGraph(graphMap);
  const stageStates = stages.map((stage) => stage.querySelector(".stage-state"));
  const flowState = rail.querySelector("[data-flow-state]");
  const sourceCards = [...rail.querySelectorAll(".source-card")];
  const ingestVisual = rail.querySelector(".ingest-visual");
  const ingestConnectors = rail.querySelector(".ingest-connectors");
  const ingestPaths = [...rail.querySelectorAll(".ingest-connectors path")];
  const ingestPackets = [...rail.querySelectorAll(".ingest-packet")];
  const ingestCore = rail.querySelector(".ingest-core");
  const graphNodeDots = graph.dots;
  const graphNodeRings = graph.rings;
  const graphLinks = graph.links;
  const evidenceLinks = graph.links.filter((link) => link.classList.contains("evidence-link"));
  const sourceIndicators = [...rail.querySelectorAll(".source-card i")];
  const toolCall = rail.querySelector("[data-query-working]");
  const answerHead = rail.querySelector(".claude-mockup-result-heading");
  const resultRows = [...rail.querySelectorAll(".claude-mockup-result")];
  const resultMeters = [...rail.querySelectorAll(".claude-mockup-result > i b")];
  const evidenceSummary = [...rail.querySelectorAll(".claude-mockup-followup, .claude-mockup-timing")];
  const commandCaret = rail.querySelector(".claude-mockup-command-caret");
  const activePrompt = rail.querySelector(".claude-mockup-prompt");
  const pipelinePath = rail.querySelector(".pipeline-path");
  const pipelineTracer = rail.querySelector(".pipeline-tracer");
  const queryText = rail.querySelector("[data-query-prompt]");
  const queryValue = queryText?.textContent ?? "";

  const counters = {
    sources: rail.querySelector("[data-source-count]"),
    nodes: rail.querySelector("[data-node-count]"),
    edges: rail.querySelector("[data-edge-count]"),
  };

  const countUp = (element, total, duration) => {
    if (!element) return;
    const state = { value: 0 };
    animate(state, {
      value: [0, total],
      duration,
      ease: "outQuart",
      onUpdate: () => {
        element.textContent = String(Math.round(state.value)).padStart(2, "0");
      },
    });
  };

  if (queryText) {
    queryText.textContent = "";
    [...queryValue].forEach((character) => {
      const characterNode = document.createElement("span");
      characterNode.textContent = character === " " ? "\u00a0" : character;
      characterNode.className = "query-character claude-prompt-character";
      queryText.append(characterNode);
    });
  }

  const queryCharacters = [...rail.querySelectorAll(".query-character")];

  const layoutIngestConnectors = () => {
    if (!ingestVisual || !ingestConnectors || !ingestCore) return;

    const visualBounds = ingestVisual.getBoundingClientRect();
    const coreBounds = ingestCore.getBoundingClientRect();
    const endX = coreBounds.left + coreBounds.width / 2 - visualBounds.left;
    const endY = coreBounds.top + coreBounds.height / 2 - visualBounds.top;

    ingestConnectors.setAttribute("viewBox", `0 0 ${visualBounds.width} ${visualBounds.height}`);

    ingestPaths.forEach((path, index) => {
      const indicator = sourceCards[index]?.querySelector("i");
      if (!indicator) return;

      const indicatorBounds = indicator.getBoundingClientRect();
      const startX = indicatorBounds.left + indicatorBounds.width / 2 - visualBounds.left;
      const startY = indicatorBounds.top + indicatorBounds.height / 2 - visualBounds.top;
      const distance = Math.max(endX - startX, 24);
      const controlOneX = startX + distance * 0.46;
      const controlTwoX = endX - distance * 0.34;

      path.setAttribute(
        "d",
        `M ${startX} ${startY} C ${controlOneX} ${startY}, ${controlTwoX} ${endY}, ${endX} ${endY}`,
      );
    });
  };

  layoutIngestConnectors();

  const graphDrawables = svg.createDrawable(graphLinks);
  const ingestDrawables = svg.createDrawable(ingestPaths);
  const [pipelineDrawable] = pipelinePath ? svg.createDrawable(pipelinePath) : [];

  const activateStage = (activeIndex, label) => {
    rail.dataset.activeStage = String(activeIndex);
    stages.forEach((stage, index) => {
      stage.classList.toggle("is-active", index === activeIndex);
      stage.classList.toggle("is-complete", index < activeIndex);
      if (stageStates[index]) {
        stageStates[index].textContent = index < activeIndex ? "COMPLETE" : index === activeIndex ? "ACTIVE" : "QUEUED";
      }
    });

    if (flowState) flowState.textContent = label;

    animate(stages[activeIndex], {
      translateY: [5, 0],
      scale: [0.992, 1],
      duration: 620,
      ease: "outExpo",
    });
  };

  stages.forEach((stage) => {
    const inspectStage = () => {
      animate(stage, {
        translateY: [0, -3, 0],
        duration: 520,
        ease: "outExpo",
      });
    };

    stage.addEventListener("pointerenter", inspectStage);
    stage.addEventListener("focusin", inspectStage);
  });

  graphDrawables.forEach((drawable) => { drawable.draw = "0 0"; });
  ingestDrawables.forEach((drawable) => { drawable.draw = "0 0"; });
  if (pipelineDrawable) pipelineDrawable.draw = "0 0";

  let sequenceComplete = false;
  let sequenceStarted = false;
  const ambientAnimations = [];
  const compilerTimeline = createTimeline({
    autoplay: false,
    loop: false,
    onComplete: () => {
      sequenceComplete = true;
      ambientAnimations.forEach((animation) => animation.pause());

      animate(graphNodeDots, { scale: 1, opacity: 1, duration: 240, ease: "outQuad" });
      animate(graphNodeRings, { scale: 1, opacity: 0.2, duration: 240, ease: "outQuad" });
      animate(sourceIndicators, { scale: 1, opacity: 1, duration: 220, ease: "outQuad" });
      animate(evidenceLinks, { opacity: 1, duration: 220, ease: "outQuad" });
    },
  });

  compilerTimeline
    .call(() => {
      activateStage(0, "INGESTING");
      countUp(counters.sources, sourceCards.length, 1400);
      countUp(counters.nodes, 0, 1);
      countUp(counters.edges, 0, 1);
    }, 0)
    .add(sourceCards, {
      opacity: [0, 1],
      translateX: [-24, 0],
      translateY: [10, 0],
      scale: [0.88, 1],
      duration: 560,
      delay: stagger(110),
      ease: "outBack(1.45)",
    }, 120)
    .add(ingestDrawables, {
      draw: ["0 0", "0 1"],
      duration: 680,
      delay: stagger(95),
      ease: "inOutQuart",
    }, 380)
    .add(ingestCore, {
      scale: [0.72, 1.12, 1],
      rotate: [0, 90],
      opacity: [0, 1],
      duration: 860,
      ease: "outElastic(1, .55)",
    }, 720);

  ingestPackets.forEach((packet, index) => {
    const ingestPath = ingestPaths[index];
    if (!ingestPath) return;

    compilerTimeline.add(packet, {
      opacity: [0, 1, 1, 0],
      ...svg.createMotionPath(ingestPath),
      duration: 920,
      ease: "inOutCubic",
    }, 610 + index * 135);
  });

  if (pipelineDrawable) {
    compilerTimeline.add(pipelineDrawable, {
      draw: ["0 0", "0 1"],
      duration: 1200,
      ease: "inOutCubic",
    }, 300);
  }

  if (pipelinePath && pipelineTracer) {
    compilerTimeline
      .add(pipelineTracer, {
        opacity: [0, 1],
        duration: 180,
        ease: "outQuad",
      }, 1500)
      .add(pipelineTracer, {
        ...svg.createMotionPath(pipelinePath),
        duration: 5700,
        ease: "inOutSine",
      }, 1500)
      .add(pipelineTracer, {
        scale: [1, 1.45, 1],
        duration: 360,
        ease: "outBack(1.5)",
      }, 6840);
  }

  compilerTimeline
    .call(() => {
      activateStage(1, "RESOLVING");
      countUp(counters.nodes, graphEntities.length, 1500);
      countUp(counters.edges, graphRelations.length, 1700);
    }, 2200)
    .add(graphDrawables, {
      draw: ["0 0", "0 1"],
      duration: 860,
      delay: stagger(70),
      ease: "inOutQuart",
    }, 2200)
    .add(graph.bodies, {
      opacity: [0, 1],
      scale: [0.1, 1],
      duration: 520,
      delay: stagger(78, { from: "center" }),
      ease: "outBack(1.7)",
    }, 2440)
    .add(graph.labels, {
      opacity: [0, 1],
      translateY: [5, 0],
      duration: 420,
      delay: stagger(78, { from: "center" }),
      ease: "outQuad",
    }, 2620)
    .add(evidenceLinks, {
      strokeWidth: [1.3, 2.6],
      opacity: [0.45, 1],
      duration: 620,
      alternate: true,
      loop: 2,
      ease: "inOutSine",
    }, 3900)
    .call(() => activateStage(2, "QUERYING"), 4850)
    .add(commandCaret, {
      opacity: [0, 1],
      duration: 120,
      ease: "outQuad",
    }, 4870)
    .add(queryCharacters, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 220,
      delay: stagger(14),
      ease: "outQuad",
    }, 4930)
    .add(commandCaret, {
      opacity: [1, 0],
      duration: 140,
      ease: "outQuad",
    }, 5530)
    .add(toolCall, {
      opacity: [0, 1],
      translateX: [-8, 0],
      duration: 260,
      ease: "outExpo",
    }, 5570)
    .add(toolCall, {
      opacity: [1, 0],
      translateY: [0, -4],
      duration: 200,
      ease: "inQuad",
    }, 5980)
    .add(answerHead, {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 360,
      ease: "outExpo",
    }, 6000)
    .add(resultRows, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 480,
      delay: stagger(135),
      ease: "outExpo",
    }, 6150)
    .add(resultMeters, {
      scaleX: [0, 1],
      duration: 720,
      delay: stagger(135),
      ease: "outExpo",
    }, 6260)
    .add(evidenceSummary, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 380,
      delay: stagger(120),
      ease: "outExpo",
    }, 6800)
    .add(activePrompt, {
      opacity: [0, 1],
      duration: 260,
      ease: "outQuad",
    }, 7040)
    .call(() => {
      if (flowState) flowState.textContent = "CITED";
    }, 7200)
    .add({ duration: 500 }, 7200);

  if (graphNodeDots.length) {
    ambientAnimations.push(animate(graphNodeDots, {
      scale: [0.82, 1.16],
      opacity: [0.62, 1],
      duration: 1250,
      delay: stagger(145),
      alternate: true,
      loop: true,
      autoplay: false,
      ease: "inOutSine",
    }));
  }

  if (graphNodeRings.length) {
    ambientAnimations.push(animate(graphNodeRings, {
      scale: [0.72, 1.45],
      opacity: [0.38, 0],
      duration: 1650,
      delay: stagger(190),
      loop: true,
      autoplay: false,
      ease: "outExpo",
    }));
  }

  // No strokeDashoffset here: svg.createDrawable already owns dasharray and
  // dashoffset on these paths, so a second animation on the same properties
  // fights the draw-in and makes the cited links flicker.
  if (evidenceLinks.length) {
    ambientAnimations.push(animate(evidenceLinks, {
      opacity: [0.5, 1],
      duration: 1250,
      delay: stagger(180),
      alternate: true,
      loop: true,
      autoplay: false,
      ease: "inOutSine",
    }));
  }

  if (sourceIndicators.length) {
    ambientAnimations.push(animate(sourceIndicators, {
      scale: [0.6, 1.45],
      opacity: [0.35, 1],
      duration: 860,
      delay: stagger(170),
      alternate: true,
      loop: true,
      autoplay: false,
      ease: "inOutSine",
    }));
  }

  const ingestSpinner = ingestCore?.querySelector("i");
  if (ingestSpinner) {
    ambientAnimations.push(animate(ingestSpinner, {
      rotate: [0, 360],
      duration: 4200,
      loop: true,
      autoplay: false,
      ease: "linear",
    }));
  }

  const visibilityObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      if (!sequenceComplete) {
        sequenceStarted = true;
        compilerTimeline.play();
        ambientAnimations.forEach((animation) => animation.play());
      }
    } else if (sequenceStarted && !sequenceComplete) {
      compilerTimeline.pause();
      ambientAnimations.forEach((animation) => animation.pause());
    }
  }, { threshold: 0.18 });

  visibilityObserver.observe(rail);
}

function initialiseBenefitHighlights() {
  const section = document.querySelector(".benefit-section");
  if (!section) return;

  const counters = [...section.querySelectorAll("[data-benefit-count]")];
  const velocityBars = [...section.querySelectorAll(".velocity-bars i")];
  const tokenUnits = [...section.querySelectorAll(".token-field i")];
  const modalityParts = [...section.querySelectorAll(".modality-pills span, .modality-pills > i")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || (!counters.length && !velocityBars.length && !tokenUnits.length && !modalityParts.length)) return;

  counters.forEach((counter) => { counter.textContent = "00"; });

  const reveal = () => {
    counters.forEach((counter, index) => {
      const state = { value: 0 };
      const target = Number(counter.dataset.benefitCount || 0);
      animate(state, {
        value: [0, target],
        duration: 1450,
        delay: 420 + index * 170,
        ease: "outQuart",
        onUpdate: () => {
          counter.textContent = String(Math.round(state.value)).padStart(2, "0");
        },
      });
    });

    animate(velocityBars, {
      opacity: [0, 1],
      scaleY: [0, 1],
      duration: 720,
      delay: stagger(70),
      ease: "outBack(1.35)",
    });

    animate(tokenUnits, {
      opacity: [0, 1],
      scale: [0.35, 1],
      translateY: [9, 0],
      duration: 540,
      delay: stagger(55),
      ease: "outBack(1.5)",
    });

    animate(modalityParts, {
      opacity: [0, 1],
      translateX: [-10, 0],
      scale: [0.72, 1],
      duration: 620,
      delay: stagger(80),
      ease: "outBack(1.45)",
    });
  };

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0]?.isIntersecting) return;
    reveal();
    observer.disconnect();
  }, { threshold: 0.18 });

  observer.observe(section);
}

// A link such as /#faq-does-my-data-leave-my-machine opens that answer, not just the section.
function initialiseFaqDeepLinks() {
  const itemFromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const item = id ? document.getElementById(id) : null;
    return item instanceof HTMLDetailsElement && item.classList.contains("faq-item") ? item : null;
  };

  const openFromHash = () => {
    const item = itemFromHash();
    if (!item) return;
    item.open = true;
    smoothScrollToElement(item);
  };

  window.addEventListener("hashchange", openFromHash);

  // On first load, open right away but scroll only once fonts and media above
  // have settled; scrolling earlier lands short as the layout grows.
  const initial = itemFromHash();
  if (!initial) return;
  initial.open = true;
  const settled = document.readyState === "complete" ? Promise.resolve() : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  settled.then(() => document.fonts.ready).then(() => smoothScrollToElement(initial));
}

function initialiseMultimodalExpansion() {
  const card = document.querySelector("[data-expand-modalities]");
  const overlay = document.querySelector("[data-modalities-overlay]");
  const dialog = overlay?.querySelector(".modalities-dialog");
  const closeButton = overlay?.querySelector("[data-modalities-close]");
  if (!card || !overlay || !dialog || !closeButton) return;

  const detailParts = [...dialog.querySelectorAll(
    ".modalities-dialog-kicker, .modalities-dialog-copy > h2, .modalities-dialog-description",
  )];
  const modalityCards = [...dialog.querySelectorAll(".modality-detail-grid li")];
  const revealParts = [...detailParts, ...modalityCards];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const expansionDuration = reduceMotion ? 720 : 900;
  const collapseDuration = reduceMotion ? 560 : 700;
  const detailStart = reduceMotion ? 220 : 320;
  const cardsStart = reduceMotion ? 340 : 500;
  let isOpen = false;
  let isClosing = false;
  let originRect = null;
  let activeShellAnimation = null;

  const finishClose = () => {
    activeShellAnimation?.cancel();
    activeShellAnimation = null;
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.opacity = "";
    dialog.style.transform = "";
    dialog.style.borderRadius = "";
    document.body.classList.remove("modal-open");
    lenis.start();
    card.setAttribute("aria-expanded", "false");
    isOpen = false;
    isClosing = false;
    card.focus({ preventScroll: true });
  };

  const openDialog = () => {
    if (isOpen || isClosing) return;
    isOpen = true;
    originRect = card.getBoundingClientRect();
    overlay.style.opacity = "0";
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    lenis.stop();
    card.setAttribute("aria-expanded", "true");

    const destinationRect = dialog.getBoundingClientRect();
    const deltaX = originRect.left - destinationRect.left;
    const deltaY = originRect.top - destinationRect.top;
    const scaleX = originRect.width / destinationRect.width;
    const scaleY = originRect.height / destinationRect.height;
    const initialTransform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    const finalTransform = "translate3d(0, 0, 0) scale(1, 1)";

    revealParts.forEach((part) => { part.style.opacity = "0"; });
    const expandedRadius = window.innerWidth <= 700 ? "0px" : "30px";
    dialog.style.transform = initialTransform;
    dialog.style.borderRadius = "26px";

    // Give the browser a paint with the dialog sitting exactly over the source
    // card. Starting the transition on the next frame prevents the destination
    // layout from flashing before the FLIP transform is visible.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!isOpen || isClosing) return;

        animate(overlay, {
          opacity: [0, 1],
          duration: reduceMotion ? 480 : 580,
          ease: "inOutQuad",
        });

        const expandingAnimation = dialog.animate([
          { transform: initialTransform, borderRadius: "26px" },
          { transform: finalTransform, borderRadius: expandedRadius },
        ], {
          duration: expansionDuration,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "both",
        });
        activeShellAnimation = expandingAnimation;

        expandingAnimation.addEventListener("finish", () => {
          dialog.style.transform = finalTransform;
          dialog.style.borderRadius = expandedRadius;
          expandingAnimation.cancel();
          if (activeShellAnimation === expandingAnimation) activeShellAnimation = null;
        }, { once: true });

        animate(detailParts, {
          opacity: [0, 1],
          translateY: [18, 0],
          duration: 580,
          delay: stagger(45, { start: detailStart }),
          ease: "outExpo",
        });

        animate(modalityCards, {
          opacity: [0, 1],
          translateY: [22, 0],
          scale: [0.97, 1],
          duration: 540,
          delay: stagger(60, { start: cardsStart }),
          ease: "outExpo",
        });

        closeButton.focus({ preventScroll: true });
      });
    });
  };

  const closeDialog = () => {
    if (!isOpen || isClosing) return;
    isClosing = true;

    if (!originRect) {
      finishClose();
      return;
    }

    const currentCardRect = card.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    const deltaX = currentCardRect.left - dialogRect.left;
    const deltaY = currentCardRect.top - dialogRect.top;
    const scaleX = currentCardRect.width / dialogRect.width;
    const scaleY = currentCardRect.height / dialogRect.height;
    const collapsedTransform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    const currentTransform = getComputedStyle(dialog).transform;
    const expandedRadius = window.innerWidth <= 700 ? "0px" : "30px";

    activeShellAnimation?.cancel();
    activeShellAnimation = null;
    dialog.style.transform = currentTransform === "none"
      ? "translate3d(0, 0, 0) scale(1, 1)"
      : currentTransform;

    animate(revealParts, {
      opacity: [1, 0],
      translateY: [0, 10],
      duration: 170,
      ease: "inQuad",
    });

    animate(overlay, {
      opacity: [1, 0],
      duration: 500,
      ease: "inOutQuad",
    });

    activeShellAnimation = dialog.animate([
      { transform: dialog.style.transform, borderRadius: expandedRadius },
      { transform: collapsedTransform, borderRadius: "26px" },
    ], {
      duration: collapseDuration,
      delay: 45,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "both",
    });
    activeShellAnimation.addEventListener("finish", finishClose, { once: true });
  };

  card.addEventListener("click", openDialog);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openDialog();
  });

  closeButton.addEventListener("click", closeDialog);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeDialog();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) closeDialog();
  });
}

function initialiseTerminalDemo() {
  const terminal = document.querySelector("[data-terminal-demo]");
  const transcript = terminal?.querySelector("[data-terminal-transcript]");
  const title = terminal?.querySelector(".terminal-title");
  const heading = terminal?.querySelector("[data-terminal-heading]");
  const description = terminal?.querySelector("[data-terminal-description]");
  const code = terminal?.querySelector("[data-terminal-code]");
  const copyButton = terminal?.querySelector("[data-terminal-copy]");
  const copyLabel = copyButton?.querySelector("span");
  const modeButtons = [...(terminal?.querySelectorAll("[data-terminal-mode]") || [])];
  if (!terminal || !transcript || !code) return;

  // Approved interface copy and command blocks live in one map so updates do
  // not require changes to the terminal renderer.
  const sequences = {
    cli: {
      label: "CLI",
      title: "opengraph — CLI",
      language: "shell",
      description: "One binary. Pipe anything in, get a queryable graph out. Perfect for scripts, CI, and local exploration.",
      code: `# Add to Claude Code
claude mcp add opengraph -- npx -y @opengraph/mcp

# Now talk to your graph — from any IDE
extract_graph(path="./data")
query_graph("find all investors near Acme")
summarize_graph()
sync_graph_to_vector_db(target="pinecone")`,
    },
    mcp: {
      label: "MCP Server",
      title: "opengraph — MCP",
      language: "shell",
      description: "Connect directly inside Claude Code, Cursor, or any MCP-compatible IDE. Your editor becomes graph-aware.",
      code: `# Add to Claude Code
claude mcp add opengraph -- npx -y @opengraph/mcp

# Now talk to your graph — from any IDE
extract_graph(path="./data")
query_graph("find all investors near Acme")
summarize_graph()
sync_graph_to_vector_db(target="pinecone")`,
    },
    rest: {
      label: "REST API",
      title: "opengraph — REST API",
      language: "shell",
      description: "A simple HTTP surface for ingestion and querying. Works from any language, any runtime.",
      code: `curl https://api.opengraph.ai/v1/graphs \\
  -H "Authorization: Bearer $OG_KEY" \\
  -d '{ "sources": ["s3://acme/reports/*.pdf"] }'

curl https://api.opengraph.ai/v1/query \\
  -H "Authorization: Bearer $OG_KEY" \\
  -d '{ "q": "find all investors" }'`,
    },
    skill: {
      label: "Agent Skill",
      title: "opengraph — Agent Skill",
      language: "python",
      description: "Drop OpenGraph into your agent runtime as a first-class skill. Tool-calling, structured outputs, citations.",
      code: `from opengraph.skill import GraphSkill
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-5",
    skills=[GraphSkill(graph="./graph.json")],
)

agent.run("which customers mentioned pricing in Q3?")`,
    },
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeRun = 0;
  let activeCode = sequences.cli.code;
  let activeLabel = sequences.cli.label;
  let copyResetTimer = 0;
  let hasEntered = false;

  const tokenPattern = /(#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|https?:\/\/[^\s'"\\]+|--?[\w-]+|\b(?:from|import|as)\b|\b(?:curl|claude|extract_graph|query_graph|summarize_graph|sync_graph_to_vector_db|create_agent|GraphSkill|run)\b|\b(?:opengraph|mcp|add|npx)\b)/g;

  const syntaxClass = (token, language) => {
    if (token.startsWith("#")) return "syntax-comment";
    if (/^['"]/.test(token)) return "syntax-string";
    if (/^https?:/.test(token)) return "syntax-url";
    if (/^--?/.test(token)) return "syntax-option";
    if (language === "python" && /^(from|import|as)$/.test(token)) return "syntax-keyword";
    if (/^(curl|claude|extract_graph|query_graph|summarize_graph|sync_graph_to_vector_db|create_agent|GraphSkill|run)$/.test(token)) return "syntax-executable";
    return "syntax-command";
  };

  const buildCodeLine = (value, language) => {
    const line = document.createElement("span");
    line.className = "terminal-code-line";
    if (!value) {
      line.innerHTML = "&nbsp;";
      return line;
    }

    let cursor = 0;
    value.replace(tokenPattern, (token, _capture, offset) => {
      if (offset > cursor) line.append(document.createTextNode(value.slice(cursor, offset)));
      const part = document.createElement("span");
      part.className = syntaxClass(token, language);
      part.textContent = token;
      line.append(part);
      cursor = offset + token.length;
      return token;
    });
    if (cursor < value.length) line.append(document.createTextNode(value.slice(cursor)));
    return line;
  };

  const setActiveMode = (mode) => {
    modeButtons.forEach((button) => {
      const active = button.dataset.terminalMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
  };

  const setCopyState = (state = "idle") => {
    if (!copyButton || !copyLabel) return;
    const feedback = state === "copied" ? "Copied" : state === "error" ? "Copy unavailable" : "Copy";
    copyButton.dataset.state = state;
    copyLabel.textContent = feedback;
    copyButton.title = feedback;
    copyButton.setAttribute(
      "aria-label",
      state === "copied"
        ? `${activeLabel} code copied`
        : state === "error"
          ? `${activeLabel} code could not be copied`
          : `Copy ${activeLabel} code`,
    );
  };

  const copyToClipboard = async (value) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const fallback = document.createElement("textarea");
    fallback.value = value;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.append(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    if (!copied) throw new Error("Clipboard copy failed");
  };

  const run = (mode = "cli") => {
    const session = sequences[mode] || sequences.cli;
    const runId = ++activeRun;
    setActiveMode(mode);
    terminal.dataset.mode = mode;
    if (title) title.textContent = session.title;
    if (heading) heading.textContent = session.label;
    if (description) description.textContent = session.description;
    activeCode = session.code;
    activeLabel = session.label;
    window.clearTimeout(copyResetTimer);
    setCopyState();
    code.replaceChildren(...session.code.split("\n").map((line) => buildCodeLine(line, session.language)));
    transcript.scrollTop = 0;

    if (reducedMotion || runId !== activeRun) return;
    animate([heading, description].filter(Boolean), {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 360,
      delay: stagger(70),
      ease: "outQuad",
    });
    animate(code.querySelectorAll(".terminal-code-line"), {
      opacity: [0, 1],
      translateX: [-8, 0],
      duration: 300,
      delay: stagger(38),
      ease: "outQuad",
    });
  };

  modeButtons.forEach((button, index) => {
    button.addEventListener("click", () => run(button.dataset.terminalMode));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = modeButtons[(index + direction + modeButtons.length) % modeButtons.length];
      next.focus();
      run(next.dataset.terminalMode);
    });
  });

  copyButton?.addEventListener("click", async () => {
    window.clearTimeout(copyResetTimer);
    try {
      await copyToClipboard(activeCode);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    copyResetTimer = window.setTimeout(() => setCopyState(), 1800);
  });

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0]?.isIntersecting) return;
    if (!hasEntered) {
      hasEntered = true;
      run("cli");
    }
    observer.disconnect();
  }, { threshold: 0.28 });

  observer.observe(terminal);
}

function initialiseUseCaseCarousel() {
  const carousel = document.querySelector("[data-use-case-carousel]");
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll("[data-use-case-slide]")];
  const selectors = [...carousel.querySelectorAll("[data-use-case-select]")];
  const stage = carousel.querySelector("[data-use-case-stage]");
  const playback = carousel.querySelector("[data-use-case-playback]");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const duration = 7000;
  let activeIndex = 0;
  let elapsed = 0;
  let startedAt = 0;
  let timer = 0;
  let progress = null;
  let inView = false;
  let hovered = false;
  let stopped = motionPreference.matches;

  const canPlay = () => inView && !document.hidden && !hovered && !stopped;

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    elapsed = 0;
    progress?.cancel();
    progress = selectors[activeIndex].querySelector("i").animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration, fill: "both", easing: "linear" },
    );
    progress.pause();
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
      selectors[slideIndex].setAttribute("aria-pressed", String(active));
    });
  };

  const syncPlayback = () => {
    if (timer) elapsed = Math.min(duration, elapsed + performance.now() - startedAt);
    window.clearTimeout(timer);
    timer = 0;
    progress.pause();
    carousel.dataset.paused = String(!canPlay());
    playback.dataset.stopped = String(stopped);
    playback.setAttribute("aria-label", `${stopped ? "Play" : "Pause"} use-case slideshow`);
    stage.setAttribute("aria-live", stopped ? "polite" : "off");
    if (canPlay()) {
      startedAt = performance.now();
      progress.play();
      timer = window.setTimeout(() => {
        timer = 0;
        showSlide(activeIndex + 1);
        syncPlayback();
      }, duration - elapsed);
    }
  };

  selectors.forEach((button, index) => {
    button.addEventListener("click", () => {
      stopped = true;
      syncPlayback();
      showSlide(index);
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + slides.length) % slides.length;
      selectors[next].focus();
      selectors[next].click();
    });
  });

  playback.addEventListener("click", () => {
    stopped = !stopped;
    syncPlayback();
  });

  // Let readers finish the current card without losing their place in the timer.
  stage.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse") return;
    hovered = true;
    syncPlayback();
  });
  stage.addEventListener("pointerleave", () => {
    hovered = false;
    syncPlayback();
  });
  carousel.addEventListener("focusin", (event) => {
    if (!event.target.matches(":focus-visible")) return;
    stopped = true;
    syncPlayback();
  });
  document.addEventListener("visibilitychange", syncPlayback);
  motionPreference.addEventListener("change", () => {
    stopped = motionPreference.matches;
    syncPlayback();
  });

  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
    syncPlayback();
  }, { threshold: [0, 0.25] });
  observer.observe(carousel);
  showSlide(0);
  syncPlayback();
}

// PLACEHOLDER - confirm the real inbox before this ships.
const CONTACT_ADDRESS = "hello@opengraphai.io";

// There is no backend in this repo. The form's mailto action alone is
// unreliable across browsers, so build the draft ourselves and hand it to the
// user's mail client. The plain action stays as the no-JS fallback.
function initialiseContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-contact-status]");
  if (!form) return;

  const button = form.querySelector("[data-send-button]");
  let resetTimer = 0;

  const setState = (state) => {
    if (button) button.dataset.state = state;
  };

  form.addEventListener("submit", (event) => {
    if (!form.reportValidity()) return;
    event.preventDefault();
    if (button?.dataset.state === "loading") return;

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const building = String(data.get("building") ?? "").trim();

    const subject = `Design partner enquiry — ${name || "OpenGraph AI"}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "What we're building:",
      building || "(not provided)",
    ].join("\n");

    // The spinner covers the real handoff to the mail client, not invented
    // server latency - success means the draft genuinely opened.
    window.clearTimeout(resetTimer);
    setState("loading");
    if (status) status.textContent = "OPENING YOUR MAIL APP…";

    window.location.href =
      `mailto:${CONTACT_ADDRESS}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.setTimeout(() => {
      setState("success");
      if (status) status.textContent = "SEND IT FROM YOUR MAIL APP TO REACH US.";
      resetTimer = window.setTimeout(() => {
        setState("idle");
        if (status) status.textContent = "";
      }, 4000);
    }, 650);
  });
}

initialiseContactForm();
initialiseMorphicNavbar({ scrollToTarget: smoothScrollToElement });
initialiseOffscreenMotion();
initialiseScrollParallax();
initialiseToTopButton();
initialiseGraphBackground();
initialiseLazyDemos();
initialiseBenefitHighlights();
initialiseUseCaseCarousel();
initialiseTerminalDemo();
initialiseMultimodalExpansion();
initialiseFaqDeepLinks();
