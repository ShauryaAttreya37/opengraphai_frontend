import "./graph-loop.css";

// The landing page plays the rendered scene without downloading a 3D engine.
document.querySelectorAll("[data-graph-video]").forEach((video) => {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  let visible = false;
  let loaded = false;
  const loadVideo = () => {
    if (loaded) return;
    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
    });
    video.load();
    loaded = true;
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadVideo, { timeout: 2000 });
  } else {
    window.setTimeout(loadVideo, 1200);
  }

  // iOS Low Power Mode and some Android battery savers refuse muted autoplay
  // until the visitor interacts, so retry on the first tap or key press.
  const gestureEvents = ["touchend", "click", "keydown"];
  let waitingForGesture = false;
  const resumeOnGesture = () => {
    waitingForGesture = false;
    gestureEvents.forEach((type) => document.removeEventListener(type, resumeOnGesture, true));
    sync();
  };
  const retryOnGesture = () => {
    if (waitingForGesture) return;
    waitingForGesture = true;
    gestureEvents.forEach((type) => document.addEventListener(type, resumeOnGesture, { capture: true, passive: true }));
  };

  const sync = () => {
    if (!visible || document.hidden || motion.matches || connection?.saveData) {
      video.pause();
      return;
    }
    loadVideo();
    // Mobile browsers only autoplay inline video that is muted as a property, not just an attribute.
    video.muted = true;
    video.playsInline = true;
    // Until playback is allowed, the poster stays visible.
    video.play().catch((error) => {
      if (error?.name === "NotAllowedError") retryOnGesture();
    });
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: 0.01 }).observe(video);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  connection?.addEventListener("change", sync);
});
