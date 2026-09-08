import { marked } from "marked";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  Copy,
  ExternalLink,
  FileCode2,
  GitFork,
  Globe,
  Image as ImageIcon,
  Menu,
  Moon,
  Network,
  Plug,
  Rocket,
  Search,
  Send,
  Sparkles,
  SquareTerminal,
  Sun,
  Wrench,
  X,
  createIcons,
} from "lucide";
import "./docs.css";

import summaryMarkdown from "../docs/content/SUMMARY.md?raw";
import introductionMarkdown from "../docs/content/README.md?raw";
import quickstartMarkdown from "../docs/content/getting-started/quickstart.md?raw";
import claudeMcpMarkdown from "../docs/content/getting-started/claude-mcp.md?raw";
import contextGraphsMarkdown from "../docs/content/concepts/context-graphs.md?raw";
import imageOverviewMarkdown from "../docs/content/opengraph-image/README.md?raw";
import mcpToolsMarkdown from "../docs/content/reference/mcp-tools.md?raw";
import cliMarkdown from "../docs/content/reference/cli.md?raw";

const markdownBySource = {
  "README.md": introductionMarkdown,
  "getting-started/quickstart.md": quickstartMarkdown,
  "getting-started/claude-mcp.md": claudeMcpMarkdown,
  "concepts/context-graphs.md": contextGraphsMarkdown,
  "opengraph-image/README.md": imageOverviewMarkdown,
  "reference/mcp-tools.md": mcpToolsMarkdown,
  "reference/cli.md": cliMarkdown,
};

const pageIcons = {
  introduction: "book-open",
  "getting-started/quickstart": "rocket",
  "getting-started/claude-mcp": "plug",
  "concepts/context-graphs": "network",
  "opengraph-image/overview": "image",
  "reference/mcp-tools": "wrench",
  "reference/cli": "square-terminal",
};

const iconSet = {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  Copy,
  ExternalLink,
  FileCode2,
  GitFork,
  Globe,
  Image: ImageIcon,
  Menu,
  Moon,
  Network,
  Plug,
  Rocket,
  Search,
  Send,
  Sparkles,
  SquareTerminal,
  Sun,
  Wrench,
  X,
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
})[character]);

const slugFromSource = (source) => {
  if (source === "README.md") return "introduction";
  return source.replace(/\.md$/, "").replace(/\/README$/, "/overview");
};

function parseSummary(markdown) {
  const groups = [];
  let activeGroup = { title: "Overview", pages: [] };
  groups.push(activeGroup);

  markdown.split("\n").forEach((line) => {
    const groupMatch = line.match(/^##\s+(.+)$/);
    if (groupMatch) {
      activeGroup = { title: groupMatch[1].trim(), pages: [] };
      groups.push(activeGroup);
      return;
    }

    const pageMatch = line.match(/^\*\s+\[([^\]]+)]\(([^)]+)\)$/);
    if (!pageMatch) return;
    const source = pageMatch[2].replace(/^\.\//, "");
    activeGroup.pages.push({
      title: pageMatch[1],
      source,
      slug: slugFromSource(source),
      markdown: markdownBySource[source],
      group: activeGroup.title,
    });
  });

  return groups.filter((group) => group.pages.length);
}

const groups = parseSummary(summaryMarkdown);
const pages = groups.flatMap((group) => group.pages);
const pageBySlug = new Map(pages.map((page) => [page.slug, page]));
const pageBySource = new Map(pages.map((page) => [page.source, page]));

const nav = document.querySelector("[data-docs-nav]");
const article = document.querySelector("[data-docs-article]");
const toc = document.querySelector("[data-docs-toc]");
const breadcrumbs = document.querySelector("[data-docs-breadcrumbs]");
const pager = document.querySelector("[data-docs-pager]");
const search = document.querySelector("[data-docs-search]");
const searchResults = document.querySelector("[data-search-results]");
const menuButton = document.querySelector("[data-menu-button]");
const sidebar = document.querySelector("[data-docs-sidebar]");
const backdrop = document.querySelector("[data-docs-backdrop]");
const themeButton = document.querySelector("[data-theme-toggle]");
const markdownButton = document.querySelector("[data-markdown-toggle]");
const copyButton = document.querySelector("[data-copy-page]");
const copyLabel = document.querySelector("[data-copy-label]");
const pageTitle = document.querySelector("[data-page-title]");
const pageKicker = document.querySelector("[data-page-kicker]");
const toast = document.querySelector("[data-docs-toast]");
const assistantForm = document.querySelector("[data-assistant-form]");
const assistantInput = document.querySelector("[data-assistant-input]");
const assistantContext = document.querySelector("[data-assistant-context]");
const assistantContextLabel = document.querySelector("[data-assistant-context-label]");
const assistantClear = document.querySelector("[data-assistant-clear]");
const assistantSearchToggle = document.querySelector("[data-assistant-search-toggle]");
const assistantInputShell = document.querySelector("[data-assistant-input-shell]");
const assistantSend = document.querySelector("[data-assistant-send]");

let showingMarkdown = false;
let activeSlug = "";
let toastTimer;
let attachedCode = "";
let webSearchEnabled = true;

const assistantMinHeight = 52;
const assistantMaxHeight = 200;

marked.setOptions({ gfm: true, breaks: false });
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("text", plaintext);

function refreshIcons() {
  createIcons({ icons: iconSet });
}

function renderNavigation() {
  nav.innerHTML = groups.map((group) => `
    <section class="docs-nav-group">
      <h2>${escapeHtml(group.title)}</h2>
      ${group.pages.map((page) => `
        <a class="docs-nav-link" href="#/${page.slug}" data-page-slug="${page.slug}">
          <i data-lucide="${pageIcons[page.slug] || "book-open"}" aria-hidden="true"></i>
          <span>${escapeHtml(page.title)}</span>
        </a>
      `).join("")}
    </section>
  `).join("");
}

function normalizeSourcePath(source, href) {
  try {
    const url = new URL(href, `https://docs.local/${source}`);
    return url.pathname.replace(/^\//, "");
  } catch {
    return href;
  }
}

function headingSlug(text, used) {
  const base = text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "section";
  const count = used.get(base) || 0;
  used.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function scrollToHeading(heading) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  heading?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function decorateArticle(page) {
  article.querySelector(":scope > h1:first-child")?.remove();

  const usedHeadings = new Map();
  const headings = [...article.querySelectorAll("h2, h3")];

  headings.forEach((heading) => {
    const label = heading.textContent.trim();
    heading.id = headingSlug(label, usedHeadings);
    heading.dataset.tocLabel = label;
    const anchor = document.createElement("a");
    anchor.className = "heading-anchor";
    anchor.href = `#/${page.slug}`;
    anchor.setAttribute("aria-label", `Scroll to ${label}`);
    anchor.textContent = "#";
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToHeading(heading);
    });
    heading.append(anchor);
  });

  article.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    if (href.endsWith(".md")) {
      const target = pageBySource.get(normalizeSourcePath(page.source, href));
      if (target) link.href = `#/${target.slug}`;
      return;
    }

    if (/^https?:\/\//.test(href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });

  article.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code) return;
    hljs.highlightElement(code);

    const language = [...code.classList]
      .find((className) => className.startsWith("language-"))
      ?.replace("language-", "") || "text";
    const actions = document.createElement("div");
    actions.className = "code-actions";

    const copyAction = document.createElement("button");
    copyAction.className = "code-action copy-code";
    copyAction.type = "button";
    copyAction.innerHTML = '<i data-lucide="copy" aria-hidden="true"></i><span>Copy</span>';
    copyAction.addEventListener("click", async () => {
      const copied = await copyText(code.textContent);
      copyAction.innerHTML = copied
        ? '<i data-lucide="check" aria-hidden="true"></i><span>Copied</span>'
        : '<i data-lucide="copy" aria-hidden="true"></i><span>Select code</span>';
      refreshIcons();
      window.setTimeout(() => {
        copyAction.innerHTML = '<i data-lucide="copy" aria-hidden="true"></i><span>Copy</span>';
        refreshIcons();
      }, 1400);
    });

    const askAction = document.createElement("button");
    askAction.className = "code-action ask-code";
    askAction.type = "button";
    askAction.innerHTML = '<i data-lucide="sparkles" aria-hidden="true"></i><span>Ask</span>';
    askAction.setAttribute("aria-label", "Ask the assistant about this code block");
    askAction.addEventListener("click", () => attachCode(code.textContent, language));

    actions.append(copyAction, askAction);
    pre.append(actions);
  });

  toc.innerHTML = headings.length
    ? headings.map((heading) => `<a class="toc-${heading.tagName.toLowerCase()}" href="#/${page.slug}">${escapeHtml(heading.dataset.tocLabel)}</a>`).join("")
    : '<span class="docs-toc-empty">Overview</span>';

  toc.querySelectorAll("a").forEach((link, index) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToHeading(headings[index]);
    });
  });
}

function renderPager(activeIndex) {
  const previous = pages[activeIndex - 1];
  const next = pages[activeIndex + 1];
  pager.innerHTML = `
    ${previous ? `<a href="#/${previous.slug}" class="pager-previous"><span>Previous</span><b><i data-lucide="arrow-left" aria-hidden="true"></i>${escapeHtml(previous.title)}</b></a>` : "<span></span>"}
    ${next ? `<a href="#/${next.slug}" class="pager-next"><span>Next</span><b>${escapeHtml(next.title)}<i data-lucide="arrow-right" aria-hidden="true"></i></b></a>` : "<span></span>"}
  `;
}

function currentPage() {
  const slug = window.location.hash.replace(/^#\/?/, "").split("#")[0];
  return pageBySlug.get(slug) || pages[0];
}

function markdownHeading(page) {
  return page.markdown.match(/^#\s+(.+)$/m)?.[1].trim() || page.title;
}

function updatePageActions() {
  markdownButton.innerHTML = showingMarkdown
    ? '<i data-lucide="book-open" aria-hidden="true"></i><span data-markdown-label>View rendered page</span>'
    : '<i data-lucide="file-code-2" aria-hidden="true"></i><span data-markdown-label>View as Markdown</span>';
}

function renderPage() {
  const page = currentPage();
  const activeIndex = pages.indexOf(page);
  if (!page?.markdown) return;

  if (activeSlug && activeSlug !== page.slug) showingMarkdown = false;
  activeSlug = page.slug;

  pageTitle.textContent = markdownHeading(page);
  pageKicker.textContent = page.group;
  article.classList.toggle("is-markdown-source", showingMarkdown);

  if (showingMarkdown) {
    article.innerHTML = `<pre class="markdown-source"><code class="language-markdown">${escapeHtml(page.markdown)}</code></pre>`;
    hljs.highlightElement(article.querySelector("code"));
    toc.innerHTML = '<span class="docs-toc-empty">Markdown source</span>';
  } else {
    article.innerHTML = marked.parse(page.markdown);
    decorateArticle(page);
  }

  renderPager(activeIndex);
  updatePageActions();

  breadcrumbs.innerHTML = `
    <a href="#/introduction">Docs</a>
    <span>/</span>
    <span>${escapeHtml(page.group)}</span>
    <span>/</span>
    <b>${escapeHtml(page.title)}</b>
  `;

  document.querySelectorAll("[data-page-slug]").forEach((link) => {
    const active = link.dataset.pageSlug === page.slug;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  document.querySelectorAll("[data-top-slug]").forEach((link) => {
    const active = link.dataset.topSlug === page.slug;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  document.title = `${markdownHeading(page)} — OpenGraph AI Docs`;
  window.scrollTo({ top: 0, behavior: "auto" });
  closeMenu();
  closeSearch();
  refreshIcons();
}

function setMenu(open) {
  document.body.classList.toggle("docs-menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  sidebar.setAttribute("aria-hidden", String(!open && window.matchMedia("(max-width: 860px)").matches));
}

function closeMenu() {
  setMenu(false);
}

function closeSearch() {
  searchResults.classList.remove("is-open");
  search.setAttribute("aria-expanded", "false");
}

function renderSearch(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    closeSearch();
    searchResults.innerHTML = "";
    return;
  }

  const matches = pages.filter((page) => `${page.title} ${page.group} ${page.markdown}`.toLowerCase().includes(normalized)).slice(0, 6);
  searchResults.innerHTML = matches.length
    ? matches.map((page) => `
      <a href="#/${page.slug}" role="option" data-search-result>
        <i data-lucide="${pageIcons[page.slug] || "book-open"}" aria-hidden="true"></i>
        <span><b>${escapeHtml(page.title)}</b><small>${escapeHtml(page.group)}</small></span>
      </a>
    `).join("")
    : '<p>No documentation found.</p>';
  searchResults.classList.add("is-open");
  search.setAttribute("aria-expanded", "true");
  refreshIcons();
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function adjustAssistantHeight(reset = false) {
  if (reset) {
    assistantInput.style.height = `${assistantMinHeight}px`;
    assistantInput.style.overflowY = "hidden";
    return;
  }

  assistantInput.style.height = "auto";
  const height = Math.min(Math.max(assistantInput.scrollHeight, assistantMinHeight), assistantMaxHeight);
  assistantInput.style.height = `${height}px`;
  assistantInput.style.overflowY = assistantInput.scrollHeight > assistantMaxHeight ? "auto" : "hidden";
}

function updateAssistantSend() {
  assistantSend.classList.toggle("is-ready", Boolean(assistantInput.value.trim()));
}

function showAssistantContext(label, icon) {
  assistantContext.hidden = false;
  assistantContextLabel.textContent = label;
  assistantContext.querySelector("[data-assistant-context-icon]")?.remove();
  assistantContext.insertAdjacentHTML(
    "afterbegin",
    `<i data-lucide="${icon}" data-assistant-context-icon aria-hidden="true"></i>`,
  );
  refreshIcons();
}

function attachCode(code, language) {
  attachedCode = code;
  showAssistantContext(`${language.toUpperCase()} code attached`, "code-2");
  assistantInput.placeholder = "Ask about the attached code…";
  assistantInput.focus();
}

function clearAttachedCode() {
  attachedCode = "";
  assistantContext.hidden = true;
  assistantInput.placeholder = "Ask about this page…";
}

function updateThemeButton() {
  const dark = document.documentElement.dataset.docsTheme === "dark";
  themeButton.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
  themeButton.innerHTML = `<i data-lucide="${dark ? "sun" : "moon"}" aria-hidden="true"></i><span data-theme-label>${dark ? "Light" : "Dark"}</span>`;
  refreshIcons();
}

renderNavigation();
updateThemeButton();
renderPage();

window.addEventListener("hashchange", renderPage);
menuButton.addEventListener("click", () => setMenu(!document.body.classList.contains("docs-menu-open")));
backdrop.addEventListener("click", closeMenu);
assistantClear.addEventListener("click", clearAttachedCode);

assistantSearchToggle.addEventListener("click", () => {
  webSearchEnabled = !webSearchEnabled;
  assistantSearchToggle.classList.toggle("is-active", webSearchEnabled);
  assistantSearchToggle.setAttribute("aria-pressed", String(webSearchEnabled));
});

assistantInput.addEventListener("input", () => {
  adjustAssistantHeight();
  updateAssistantSend();
});

assistantInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    assistantForm.requestSubmit();
  }
});

assistantInputShell.addEventListener("click", (event) => {
  if (!event.target.closest("button, label, input, textarea")) assistantInput.focus();
});

assistantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!assistantInput.value.trim()) {
    assistantInput.focus();
    return;
  }
  const context = attachedCode ? "code attached" : "page context";
  const searchMode = webSearchEnabled ? "web search on" : "web search off";
  showToast(`Assistant API not connected — ${context}, ${searchMode}`);
  assistantInput.value = "";
  adjustAssistantHeight(true);
  updateAssistantSend();
});

themeButton.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.docsTheme === "dark" ? "light" : "dark";
  document.documentElement.dataset.docsTheme = nextTheme;
  try { localStorage.setItem("opengraph-docs-theme", nextTheme); } catch {}
  updateThemeButton();
});

markdownButton.addEventListener("click", () => {
  showingMarkdown = !showingMarkdown;
  renderPage();
});

copyButton.addEventListener("click", async () => {
  const copied = await copyText(currentPage().markdown);
  copyLabel.textContent = copied ? "Copied" : "Copy unavailable";
  copyButton.querySelector("svg")?.replaceWith();
  copyButton.insertAdjacentHTML("afterbegin", `<i data-lucide="${copied ? "check" : "copy"}" aria-hidden="true"></i>`);
  refreshIcons();
  showToast(copied ? "Page copied as Markdown" : "Could not copy this page");
  window.setTimeout(() => {
    copyLabel.textContent = "Copy page";
    copyButton.querySelector("svg")?.replaceWith();
    copyButton.insertAdjacentHTML("afterbegin", '<i data-lucide="copy" aria-hidden="true"></i>');
    refreshIcons();
  }, 1600);
});

search.addEventListener("input", () => renderSearch(search.value));
search.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const firstResult = searchResults.querySelector("[data-search-result]");
    if (firstResult) window.location.hash = firstResult.getAttribute("href");
  }
});
searchResults.addEventListener("click", closeSearch);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".docs-search-wrap")) closeSearch();
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key.toLowerCase() === "i") {
    event.preventDefault();
    assistantInput.focus();
    return;
  }
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === "Escape") {
    search.blur();
    closeSearch();
    closeMenu();
  }
});
