// Interactive cards in the landing-page bento grid. Each card works without
// JavaScript in its final state; these functions add the motion and controls.

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TRACE_FINAL_STEP = 3;
const TRACE_STEP_MS = 1000;
const TRACE_START_DELAY_MS = 450;

/** Evidence trace: lights each hop of a query in order the first time the card is seen. */
export function initialiseEvidenceTrace() {
  const card = document.querySelector("[data-trace]");
  const stage = card?.querySelector("[data-trace-stage]");
  if (!card || !stage) return;

  const parts = [...stage.querySelectorAll("[data-hop]")];
  const replay = stage.querySelector("[data-trace-replay]");
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

  // Hidden until the first play so the drawing reads as the agent working.
  showStep(prefersReducedMotion() ? TRACE_FINAL_STEP : -1);
  replay?.addEventListener("click", play);

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    play();
    observer.disconnect();
  }, { threshold: 0.45 });
  observer.observe(stage);
}

/** Confidence threshold: edges below the slider value drop out of the graph. */
export function initialiseConfidenceThreshold() {
  const card = document.querySelector("[data-confidence]");
  const input = card?.querySelector("[data-confidence-input]");
  const graph = card?.querySelector("[data-confidence-graph]");
  if (!card || !input || !graph) return;

  const value = card.querySelector("[data-confidence-value]");
  const readout = card.querySelector("[data-confidence-readout]");
  const edges = [...graph.querySelectorAll("line[data-edge]")].map((line) => ({
    line,
    score: Number(line.dataset.edge),
    label: line.dataset.label,
    ends: [`${line.getAttribute("x1")},${line.getAttribute("y1")}`, `${line.getAttribute("x2")},${line.getAttribute("y2")}`],
  }));
  const nodes = [...graph.querySelectorAll(".confidence-node")].map((node) => {
    const circle = node.querySelector("circle");
    return { node, key: `${circle.getAttribute("cx")},${circle.getAttribute("cy")}` };
  });

  // Stronger links draw heavier, so the score is visible before anyone drags.
  edges.forEach(({ line, score }) => line.style.setProperty("--weight", ((score - 0.4) / 0.6).toFixed(2)));

  const update = () => {
    const threshold = Number(input.value);
    const kept = edges.filter(({ score }) => score >= threshold - 1e-9);
    const keptEnds = new Set(kept.flatMap(({ ends }) => ends));

    edges.forEach((edge) => edge.line.classList.toggle("is-dropped", !kept.includes(edge)));
    nodes.forEach(({ node, key }) => node.classList.toggle("is-isolated", !keptEnds.has(key)));

    const fill = ((threshold - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
    input.style.setProperty("--fill", `${fill}%`);
    if (value) value.textContent = threshold.toFixed(2);
    if (!readout) return;
    const weakest = kept.reduce((low, edge) => (!low || edge.score < low.score ? edge : low), null);
    readout.textContent = weakest
      ? `${kept.length} of ${edges.length} links kept. Weakest kept: ${weakest.label}, ${weakest.score.toFixed(2)}.`
      : `No links meet ${threshold.toFixed(2)}. Lower the bar to bring them back.`;
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
