import "./styles.css";
import "./page.css";
import { initialiseMorphicNavbar } from "./site-nav.js";

const COPY_RESET_MS = 1400;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Code is highlighted at build time; only the copy action needs the browser.
function initialiseCodeCopy() {
  document.querySelectorAll(".page-prose .code-block").forEach((block) => {
    const code = block.querySelector("code");
    if (!code) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code to clipboard");
    button.addEventListener("click", async () => {
      const copied = await copyText(code.textContent);
      button.textContent = copied ? "Copied" : "Select code";
      window.setTimeout(() => {
        button.textContent = "Copy";
      }, COPY_RESET_MS);
    });
    block.append(button);
  });
}

// Marks the table-of-contents link for the section being read.
function initialiseTocHighlight() {
  const links = [...document.querySelectorAll(".page-toc a[href^='#']")];
  const sections = links.map((link) => document.getElementById(link.hash.slice(1))).filter(Boolean);
  if (!sections.length) return;

  const setCurrent = (id) => {
    links.forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  // The current section is the last heading that has scrolled above the reading line.
  const update = () => {
    const readingLine = window.innerHeight * 0.3;
    const passed = sections.filter((section) => section.getBoundingClientRect().top <= readingLine);
    setCurrent((passed.at(-1) || sections[0]).id);
  };

  let frame = 0;
  window.addEventListener("scroll", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, { passive: true });
  update();
}

initialiseMorphicNavbar();
initialiseCodeCopy();
initialiseTocHighlight();
