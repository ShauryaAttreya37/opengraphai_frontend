/**
 * Dropdowns, mobile menu, and outside-click / Escape closing for the shared site header.
 * @param {{ scrollToTarget?: (target: Element) => Promise<boolean> }} [options]
 *   Smooth-scroll helper for same-page "#section" links. Pages without one keep native jumps.
 */
export function initialiseMorphicNavbar({ scrollToTarget } = {}) {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;
  const dropdowns = [...header.querySelectorAll(".nav-dropdown")];
  const toggle = header.querySelector("[data-nav-toggle]");
  const mobile = header.querySelector("[data-nav-mobile]");
  const hoverNavigation = window.matchMedia("(hover: hover) and (pointer: fine)");

  const closeNavigation = () => {
    dropdowns.forEach((dropdown) => dropdown.removeAttribute("open"));
    if (toggle && mobile) {
      toggle.setAttribute("aria-expanded", "false");
      mobile.hidden = true;
    }
  };

  dropdowns.forEach((dropdown) => {
    let hoverCloseTimer = 0;
    const summary = dropdown.querySelector("summary");

    dropdown.addEventListener("toggle", () => {
      if (!dropdown.open) return;
      dropdowns.forEach((other) => {
        if (other !== dropdown) other.removeAttribute("open");
      });
    });

    dropdown.addEventListener("pointerenter", () => {
      if (!hoverNavigation.matches) return;
      window.clearTimeout(hoverCloseTimer);
      dropdown.setAttribute("open", "");
    });

    dropdown.addEventListener("pointerleave", () => {
      if (!hoverNavigation.matches) return;
      hoverCloseTimer = window.setTimeout(() => dropdown.removeAttribute("open"), 100);
    });

    summary?.addEventListener("click", (event) => {
      if (!hoverNavigation.matches || event.detail === 0) return;
      event.preventDefault();
      dropdown.setAttribute("open", "");
    });
  });

  toggle?.addEventListener("click", () => {
    const willOpen = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(willOpen));
    if (mobile) mobile.hidden = !willOpen;
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeNavigation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });

  header.querySelectorAll("[data-mock-link]").forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });

  if (!scrollToTarget) return;

  document.querySelectorAll('a[href^="#"]:not([data-mock-link])').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const target = targetId ? document.querySelector(targetId) : null;
      if (!target) return;
      event.preventDefault();
      closeNavigation();
      scrollToTarget(target).then((completed) => {
        if (completed) history.pushState(null, "", targetId);
      });
    });
  });
}
