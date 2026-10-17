import "./graph-loop.css";

// Frame shown when the visitor prefers reduced motion: the cited evidence
// path is fully lit and the rest of the graph is dimmed.
const STILL_FRAME = 8.5;
const MAX_PIXEL_RATIO = 2;
const LOOP = 12;

/** three.js is only fetched once a loop figure is about to scroll into view. */
const loadScene = () => import("./scene.js");

async function start(figure) {
  const canvas = figure.querySelector("canvas");
  const capture = figure.hasAttribute("data-capture");
  let loop;
  try {
    const { createGraphLoop } = await loadScene();
    loop = createGraphLoop(canvas, { preserveDrawingBuffer: capture });
  } catch (error) {
    figure.dataset.state = "unsupported";
    figure.dataset.error = String(error?.message ?? error);
    return null;
  }

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let elapsed = 0;
  let last = null;
  let frame = 0;
  let onScreen = true;

  const draw = () => loop.renderAt(motion.matches ? STILL_FRAME : elapsed);

  const resize = () => {
    const { width, height } = figure.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const ratio = capture ? 1 : Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    loop.resize(Math.round(width), Math.round(height), ratio);
    draw();
  };
  new ResizeObserver(resize).observe(figure);
  resize();
  figure.dataset.state = "ready";

  if (capture) {
    window.__graphLoop = { loop: LOOP, renderAt: (t) => loop.renderAt(t) };
    return null;
  }

  const tick = (now) => {
    elapsed = (elapsed + (last === null ? 0 : (now - last) / 1000)) % LOOP;
    last = now;
    draw();
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    last = null;
    if (onScreen && !motion.matches && !document.hidden) frame = requestAnimationFrame(tick);
    else draw();
  };
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();

  return (visible) => {
    onScreen = visible;
    sync();
  };
}

function mount(figure) {
  if (figure.hasAttribute("data-capture")) {
    start(figure);
    return;
  }
  let setVisible = null;
  let starting = null;
  let visibleNow = false;
  new IntersectionObserver(([entry]) => {
    visibleNow = entry.isIntersecting;
    if (setVisible) {
      setVisible(visibleNow);
      return;
    }
    if (visibleNow && !starting) {
      // The figure may scroll away while three.js loads; apply the latest state.
      starting = start(figure).then((setter) => {
        setVisible = setter;
        setter?.(visibleNow);
      });
    }
  }, { rootMargin: "240px" }).observe(figure);
}

document.querySelectorAll("[data-graph-loop]").forEach(mount);
