// Interactive cards in the landing-page bento grid. Each card works without
// JavaScript in its final state; these functions add the motion and controls.

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TRACE_FINAL_STEP = 3;
const TRACE_STEP_MS = 1000;
const TRACE_START_DELAY_MS = 450;
// Start the trace anyway if its photo is slow, rather than leave the card blank.
const TRACE_IMAGE_WAIT_MS = 2500;
// Slider steps are decimals, so compare scores with a little slack.
const SCORE_EPSILON = 1e-9;

/** Photo viewers: fade each photo in once it loads, and say so when it fails. */
export function initialiseShots() {
  document.querySelectorAll("[data-shot-img]").forEach((img) => {
    const shot = img.closest(".shot");
    if (!shot) return;

    const settle = () => {
      shot.dataset.state = img.naturalWidth > 0 ? "ready" : "error";
    };

    // Cached photos are already complete; broken ones are complete with no pixels.
    if (img.complete) {
      settle();
      return;
    }
    shot.dataset.state = "loading";
    img.addEventListener("load", settle, { once: true });
    img.addEventListener("error", settle, { once: true });
  });
}

/** Resolves once an image has loaded or failed, or after `timeout` ms. */
function whenImageSettles(img, timeout) {
  if (!img || img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener("load", resolve, { once: true });
    img.addEventListener("error", resolve, { once: true });
    window.setTimeout(resolve, timeout);
  });
}

/** Evidence trace: lights each hop of a query in order the first time the card is seen. */
export function initialiseEvidenceTrace() {
  const card = document.querySelector("[data-trace]");
  const stage = card?.querySelector("[data-trace-stage]");
  if (!card || !stage) return;

  const parts = [...stage.querySelectorAll("[data-hop]")];
  const replay = stage.querySelector("[data-trace-replay]");
  const photo = stage.querySelector("[data-shot-img]");
  let timers = [];

  const showStep = (step) => {
    stage.dataset.step = String(step);
    parts.forEach((part) => part.classList.toggle("is-lit", Number(part.dataset.hop) <= step));
  };

  const play = () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    if (prefersReducedMotion()) {
      showStep(TRACE_FINAL_STEP);
      return;
    }
    showStep(-1);
    timers = Array.from({ length: TRACE_FINAL_STEP + 1 }, (_, step) =>
      window.setTimeout(() => showStep(step), TRACE_START_DELAY_MS + step * TRACE_STEP_MS));
  };

  replay?.addEventListener("click", play);

  // Hidden until the first play so the drawing reads as the agent working.
  showStep(prefersReducedMotion() ? TRACE_FINAL_STEP : -1);

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    whenImageSettles(photo, TRACE_IMAGE_WAIT_MS).then(play);
  }, { threshold: 0.45 });
  observer.observe(stage);
}

/**
 * Confidence threshold: detections and relations below the slider value drop
 * out. A relation also drops when either object it connects has dropped.
 */
export function initialiseConfidenceThreshold() {
  const card = document.querySelector("[data-confidence]");
  const input = card?.querySelector("[data-confidence-input]");
  const graph = card?.querySelector("[data-confidence-graph]");
  if (!card || !input || !graph) return;

  const value = card.querySelector("[data-confidence-value]");
  const readout = card.querySelector("[data-confidence-readout]");
  const objects = [...graph.querySelectorAll("[data-object]")]
    .map((node) => ({ node, name: node.dataset.object, score: Number(node.dataset.score) }))
    .filter(({ score }) => Number.isFinite(score));
  const relations = [...graph.querySelectorAll("[data-relation]")]
    .map((line) => ({
      line,
      label: line.dataset.relation,
      from: line.dataset.from,
      to: line.dataset.to,
      score: Number(line.dataset.score),
    }))
    .filter(({ score }) => Number.isFinite(score));
  const nodeDots = [...graph.querySelectorAll("[data-node]")];
  if (!objects.length) return;

  // Stronger links draw heavier, so the score is visible before anyone drags.
  relations.forEach(({ line, score }) => line.style.setProperty("--weight", ((score - 0.4) / 0.6).toFixed(2)));

  const describe = (threshold, keptObjects, keptRelations) => {
    if (!keptObjects.size) return `No detection reaches ${threshold.toFixed(2)}. Lower the bar to bring them back.`;
    const counts = `${keptObjects.size} of ${objects.length} objects and ${keptRelations.length} of ${relations.length} relations kept.`;
    const weakest = keptRelations.reduce((low, relation) => (!low || relation.score < low.score ? relation : low), null);
    return weakest
      ? `${counts} Weakest relation kept: ${weakest.label}, ${weakest.score.toFixed(2)}.`
      : `${counts} No relation reaches ${threshold.toFixed(2)} with both of its objects kept.`;
  };

  const update = () => {
    const threshold = Number(input.value);
    const keptObjects = new Set(objects.filter(({ score }) => score >= threshold - SCORE_EPSILON).map(({ name }) => name));
    const keptRelations = relations.filter(({ score, from, to }) =>
      score >= threshold - SCORE_EPSILON && keptObjects.has(from) && keptObjects.has(to));

    objects.forEach(({ node, name }) => node.classList.toggle("is-dropped", !keptObjects.has(name)));
    nodeDots.forEach((dot) => dot.classList.toggle("is-dropped", !keptObjects.has(dot.dataset.node)));
    relations.forEach((relation) => relation.line.classList.toggle("is-dropped", !keptRelations.includes(relation)));

    const fill = ((threshold - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
    input.style.setProperty("--fill", `${fill}%`);
    if (value) value.textContent = threshold.toFixed(2);
    if (readout) readout.textContent = describe(threshold, keptObjects, keptRelations);
  };

  input.addEventListener("input", update);
  update();
}

/** Provenance inspector: tabs swap the source and briefly mark what was cited. */
export function initialiseProvenanceInspector() {
  const card = document.querySelector("[data-provenance]");
  if (!card) return;

  const tabs = [...card.querySelectorAll("[data-provenance-tab]")];
  const panels = [...card.querySelectorAll("[data-provenance-panel]")];
  if (!tabs.length || tabs.length !== panels.length) return;

  const select = (index, focus = false) => {
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[tabIndex].hidden = !active;
      panels[tabIndex].classList.toggle("is-entering", active);
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      select((moves[event.key] + tabs.length) % tabs.length, true);
    });
  });

  panels.forEach((panel) => panel.addEventListener("animationend", () => panel.classList.remove("is-entering")));
}
