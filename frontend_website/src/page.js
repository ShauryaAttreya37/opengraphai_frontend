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

initialiseMorphicNavbar();
initialiseCodeCopy();
