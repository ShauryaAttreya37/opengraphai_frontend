import { Marked, marked } from "marked";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleAlert,
  Code2,
  Copy,
  ExternalLink,
  FileCode2,
  GitFork,
  Image as ImageIcon,
  Menu,
  Moon,
  Network,
  Plug,
  Rocket,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  SquarePen,
  SquareTerminal,
  Sun,
  Wrench,
  X,
  createIcons,
} from "lucide";
import "./docs.css";
import { docsPages, docsSchema, siteUrl } from "./site-metadata.js";

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
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleAlert,
  Code2,
  Copy,
  ExternalLink,
  FileCode2,
  GitFork,
  Image: ImageIcon,
  Menu,
  Moon,
  Network,
  Plug,
  Rocket,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  SquarePen,
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
const metadataBySlug = new Map(docsPages.map((page) => [page.slug, page]));
const pathFor = (slug) => metadataBySlug.get(slug)?.path || "/docs/";
const cleanSearchLine = (line) => line
  .replace(/```.*|<[^>]+>|[#>*_`|]/g, " ")
  .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
  .replace(/\s+/g, " ")
  .trim();
const searchIndex = pages.map((page) => {
  const lines = page.markdown.split("\n").map(cleanSearchLine).filter((line) => line.length > 2);
  return {
    page,
    lines,
    title: page.title.toLowerCase(),
    group: page.group.toLowerCase(),
    text: `${page.title} ${page.group} ${lines.join(" ")}`.toLowerCase(),
  };
});

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
const assistantInputShell = document.querySelector("[data-assistant-input-shell]");
const assistantSend = document.querySelector("[data-assistant-send]");
const chatDrawer = document.querySelector("[data-chat-drawer]");
const chatMessages = document.querySelector("[data-chat-messages]");
const chatForm = document.querySelector("[data-chat-form]");
const chatInput = document.querySelector("[data-chat-input]");
const chatClear = document.querySelector("[data-chat-clear]");
const chatClose = document.querySelector("[data-chat-close]");
const chatAttached = document.querySelector("[data-chat-attached]");
const chatAttachedLabel = document.querySelector("[data-chat-attached-label]");
const chatAttachedClear = document.querySelector("[data-chat-attached-clear]");
const chatSend = document.querySelector("[data-chat-send]");
const chatWelcomeMarkup = chatMessages?.innerHTML ?? "";

let showingMarkdown = false;
let activeSlug = "";
let toastTimer;
let attachedCode = "";
let attachedLang = "";
let chatStreaming = false;
// Completed turns sent with each question so follow-ups have context; reset by "New chat".
let chatHistory = [];
let chatSessionId = 0;
let chatAbortController = null;

const assistantMinHeight = 32;
const assistantMaxHeight = 120;
const chatInputMaxHeight = 168;
const chatInputPlaceholder = "Message OpenGraph AI…";
const chatScrollStickThreshold = 80;
const chatHistoryLimit = 20;

marked.setOptions({ gfm: true, breaks: false });

// Chat answers come from the model, so raw HTML in them is shown as text, never rendered.
const chatMarked = new Marked({
  gfm: true,
  breaks: false,
  renderer: { html: ({ text }) => escapeHtml(text) },
});
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
        <a class="docs-nav-link" href="${pathFor(page.slug)}" data-page-slug="${page.slug}">
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
    anchor.href = `${pathFor(page.slug)}#${heading.id}`;
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
      if (target) link.href = pathFor(target.slug);
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

    // Actions sit on a wrapper, not inside <pre>, so they stay pinned while the code scrolls sideways.
    const block = document.createElement("div");
    block.className = "code-block";
    pre.replaceWith(block);
    block.append(pre, actions);
  });

  toc.innerHTML = headings.length
    ? headings.map((heading) => `<a class="toc-${heading.tagName.toLowerCase()}" href="${pathFor(page.slug)}#${heading.id}">${escapeHtml(heading.dataset.tocLabel)}</a>`).join("")
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
    ${previous ? `<a href="${pathFor(previous.slug)}" class="pager-previous"><span>Previous</span><b><i data-lucide="arrow-left" aria-hidden="true"></i>${escapeHtml(previous.title)}</b></a>` : "<span></span>"}
    ${next ? `<a href="${pathFor(next.slug)}" class="pager-next"><span>Next</span><b>${escapeHtml(next.title)}<i data-lucide="arrow-right" aria-hidden="true"></i></b></a>` : "<span></span>"}
  `;
}

function currentPage() {
  // Keep old shared hash links working while canonical links use real pages.
  const legacySlug = window.location.hash.startsWith("#/") ? window.location.hash.slice(2).split("#")[0] : null;
  if (legacySlug && pageBySlug.has(legacySlug)) history.replaceState(null, "", pathFor(legacySlug));
  const path = window.location.pathname.replace(/\/index\.html$/, "/").replace(/\/?$/, "/");
  const metadata = docsPages.find((page) => page.path === path);
  return pageBySlug.get(metadata?.slug) || pages[0];
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
    <a href="/docs/">Docs</a>
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

  const metadata = metadataBySlug.get(page.slug);
  document.title = `${metadata.title} | OpenGraph AI`;
  document.querySelector('link[rel="canonical"]').href = `${siteUrl}${metadata.path}`;
  document.querySelector('meta[name="description"]').content = metadata.description;
  document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach((meta) => { meta.content = document.title; });
  document.querySelectorAll('meta[property="og:description"], meta[name="twitter:description"]').forEach((meta) => { meta.content = metadata.description; });
  document.querySelector('meta[property="og:url"]').content = `${siteUrl}${metadata.path}`;
  const schema = document.querySelector('script[type="application/ld+json"]');
  if (schema) {
    schema.textContent = JSON.stringify(docsSchema(metadata, markdownHeading(page)));
  }
  window.scrollTo({ top: 0, behavior: "auto" });
  closeMenu();
  closeSearch();
  refreshIcons();
  if (location.hash && !location.hash.startsWith("#/")) {
    try {
      scrollToHeading(document.getElementById(decodeURIComponent(location.hash.slice(1))));
    } catch { /* Ignore malformed fragments in shared links. */ }
  }
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
  const terms = [...new Set(normalized.split(/\s+/).filter(Boolean))];
  const matches = searchIndex
    .filter((entry) => terms.every((term) => entry.text.includes(term)))
    .map((entry) => ({
      ...entry,
      score: terms.reduce((score, term) => score
        + (entry.title === term ? 30 : 0)
        + (entry.title.includes(term) ? 12 : 0)
        + (entry.group.includes(term) ? 4 : 0), 0),
      snippet: entry.lines.find((line) => terms.some((term) => line.toLowerCase().includes(term)))
        || metadataBySlug.get(entry.page.slug)?.description
        || entry.lines[0],
    }))
    .sort((a, b) => b.score - a.score || pages.indexOf(a.page) - pages.indexOf(b.page));
  searchResults.innerHTML = matches.length
    ? `<p class="docs-search-summary">${normalized ? `${matches.length} matching page${matches.length === 1 ? "" : "s"}` : `All documentation · ${matches.length} pages`}</p>${matches.map(({ page, snippet }) => `
      <a href="${pathFor(page.slug)}" role="option" data-search-result>
        <i data-lucide="${pageIcons[page.slug] || "book-open"}" aria-hidden="true"></i>
        <span><b>${escapeHtml(page.title)}</b><small>${escapeHtml(page.group)}</small><em>${escapeHtml(snippet.slice(0, 128))}</em></span>
      </a>
    `).join("")}`
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
  attachedLang = language;

  // Show in bottom floating bar
  showAssistantContext(`${language.toUpperCase()} code attached`, "code-2");
  assistantInput.placeholder = `Ask about this ${language.toUpperCase()} code…`;

  // Show in right chat drawer
  if (chatAttached && chatAttachedLabel) {
    chatAttached.hidden = false;
    chatAttachedLabel.textContent = `${language.toUpperCase()} snippet attached`;
  }
  if (chatInput) {
    chatInput.placeholder = `Ask about this ${language.toUpperCase()} snippet…`;
  }

  // Smoothly open the chat drawer on the right and focus input
  openChatDrawer();
  chatInput?.focus();
}

function clearAttachedCode() {
  attachedCode = "";
  attachedLang = "";
  assistantContext.hidden = true;
  assistantInput.placeholder = "Ask the documentation…";
  if (chatAttached) chatAttached.hidden = true;
  if (chatInput) chatInput.placeholder = chatInputPlaceholder;
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

window.addEventListener("hashchange", () => {
  if (location.hash.startsWith("#/")) renderPage();
});
window.addEventListener("popstate", renderPage);
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a[href]");
  if (!link || link.target || link.hasAttribute("download")) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || !docsPages.some((page) => page.path === url.pathname)) return;
  event.preventDefault();
  history.pushState(null, "", url.pathname + url.hash);
  renderPage();
});
menuButton.addEventListener("click", () => setMenu(!document.body.classList.contains("docs-menu-open")));
backdrop.addEventListener("click", closeMenu);
assistantClear.addEventListener("click", clearAttachedCode);

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

function openChatDrawer() {
  if (!chatDrawer) return;
  chatDrawer.hidden = false;
  // Force a style flush so the slide-in transition runs after un-hiding.
  void chatDrawer.offsetWidth;
  chatDrawer.classList.add("is-open");
  chatDrawer.setAttribute("aria-hidden", "false");
  chatInput?.focus();
}

function closeChatDrawer() {
  if (!chatDrawer) return;
  chatDrawer.classList.remove("is-open");
  chatDrawer.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    if (!chatDrawer.classList.contains("is-open")) chatDrawer.hidden = true;
  }, 260);
}

function clearChatMessages() {
  if (!chatMessages) return;
  chatAbortController?.abort();
  chatHistory = [];
  chatSessionId += 1;
  chatMessages.innerHTML = chatWelcomeMarkup;
  refreshIcons();
  chatInput?.focus();
}

function scrollChatToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function isChatNearBottom() {
  return chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < chatScrollStickThreshold;
}

function adjustChatInputHeight() {
  if (!chatInput) return;
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, chatInputMaxHeight)}px`;
  chatInput.style.overflowY = chatInput.scrollHeight > chatInputMaxHeight ? "auto" : "hidden";
}

function updateChatSend() {
  if (!chatSend || !chatInput) return;
  chatSend.disabled = chatStreaming || !chatInput.value.trim();
}

function createUserMessage(prompt, snippet, lang) {
  const message = document.createElement("div");
  message.className = "docs-chat-msg user";
  if (snippet) {
    message.innerHTML = `
      <div class="docs-chat-snippet-preview">
        <span class="snippet-badge">${escapeHtml(lang || "code")}</span>
        <code>${escapeHtml(snippet.trim())}</code>
      </div>
    `;
  }
  const bubble = document.createElement("div");
  bubble.className = "docs-chat-bubble markdown-body";
  // Single newlines stay line breaks, as typed.
  bubble.innerHTML = chatMarked.parse(prompt, { breaks: true });
  bubble.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
  message.appendChild(bubble);
  return message;
}

function rememberChatTurn(prompt, snippet, lang, answer) {
  const question = snippet ? `\`\`\`${lang || ""}\n${snippet.trim()}\n\`\`\`\n\n${prompt}` : prompt;
  chatHistory = [
    ...chatHistory,
    { role: "user", text: question },
    { role: "model", text: answer },
  ].slice(-chatHistoryLimit);
}

function createAssistantMessage() {
  const message = document.createElement("div");
  message.className = "docs-chat-msg assistant";
  message.innerHTML = `
    <div class="docs-chat-loading" role="status">
      <span class="docs-chat-loading-dot" aria-hidden="true"></span>
      <span class="visually-hidden">Thinking…</span>
    </div>
    <div class="markdown-body" hidden></div>
  `;
  return message;
}

function showChatError(message, text) {
  message.innerHTML = `
    <div class="docs-chat-error" role="alert">
      <i data-lucide="circle-alert" aria-hidden="true"></i>
      <span>${escapeHtml(text)}</span>
    </div>
  `;
  refreshIcons();
  scrollChatToBottom();
}

function addCopyAction(message, text) {
  const actions = document.createElement("div");
  actions.className = "docs-chat-msg-actions";
  actions.innerHTML = `
    <button type="button" class="docs-chat-msg-copy" aria-label="Copy answer" title="Copy">
      <i data-lucide="copy" aria-hidden="true"></i>
    </button>
  `;
  const button = actions.querySelector("button");
  button.addEventListener("click", async () => {
    const copied = await copyText(text);
    button.innerHTML = `<i data-lucide="${copied ? "check" : "copy"}" aria-hidden="true"></i>`;
    button.title = copied ? "Copied" : "Copy unavailable";
    refreshIcons();
    window.setTimeout(() => {
      button.innerHTML = '<i data-lucide="copy" aria-hidden="true"></i>';
      button.title = "Copy";
      refreshIcons();
    }, 1500);
  });
  message.appendChild(actions);
  refreshIcons();
}

// Streams the answer into `message`; resolves to the full answer, or "" when it failed.
async function streamAssistantReply(message, { prompt, context, history, signal }) {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context, history }),
    signal,
  });

  if (!response.ok) {
    let errorText = "Failed to receive a response.";
    try {
      const errorJson = await response.json();
      errorText = errorJson.error || errorText;
    } catch {}
    showChatError(message, errorText);
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const markdownBody = message.querySelector(".markdown-body");
  let answer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    answer += decoder.decode(value, { stream: true });
    if (!answer.trim()) continue;

    const stickToBottom = isChatNearBottom();
    message.querySelector(".docs-chat-loading")?.remove();
    markdownBody.hidden = false;
    markdownBody.innerHTML = chatMarked.parse(answer);
    if (stickToBottom) scrollChatToBottom();
  }

  if (!answer.trim()) {
    showChatError(message, "The assistant returned an empty response. Try rephrasing your question.");
    return "";
  }

  markdownBody.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
  addCopyAction(message, answer);
  return answer;
}

async function sendChatMessage(prompt) {
  if (!prompt || !chatMessages || chatStreaming) return;

  openChatDrawer();

  // Snapshot and reset the attached snippet for this question.
  const snippet = attachedCode;
  const lang = attachedLang;
  clearAttachedCode();

  chatMessages.querySelector(".docs-chat-welcome")?.remove();
  chatMessages.appendChild(createUserMessage(prompt, snippet, lang));
  const assistantMsg = createAssistantMessage();
  chatMessages.appendChild(assistantMsg);
  scrollChatToBottom();

  const pageMarkdown = currentPage().markdown.slice(0, 4000);
  const contextData = snippet
    ? `Attached Code Snippet (${lang}):\n${snippet}\n\nPage Markdown:\n${pageMarkdown}`
    : `Page Markdown:\n${pageMarkdown}`;

  const sessionId = chatSessionId;
  const abortController = new AbortController();
  chatAbortController = abortController;
  chatStreaming = true;
  updateChatSend();
  try {
    const answer = await streamAssistantReply(assistantMsg, {
      prompt,
      context: contextData,
      history: chatHistory,
      signal: abortController.signal,
    });
    // Skip answers that finish after "New chat" so they do not leak into the fresh conversation.
    if (answer && sessionId === chatSessionId) rememberChatTurn(prompt, snippet, lang, answer);
  } catch {
    if (!abortController.signal.aborted) {
      showChatError(assistantMsg, "Could not reach the assistant. Check your connection and try again.");
    }
  } finally {
    if (chatAbortController === abortController) chatAbortController = null;
    chatStreaming = false;
    updateChatSend();
  }
}

assistantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const prompt = assistantInput.value.trim();
  if (!prompt || chatStreaming) {
    assistantInput.focus();
    return;
  }

  assistantInput.value = "";
  adjustAssistantHeight(true);
  updateAssistantSend();
  sendChatMessage(prompt);
});

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt || chatStreaming) return;
  chatInput.value = "";
  adjustChatInputHeight();
  updateChatSend();
  sendChatMessage(prompt);
});

chatInput?.addEventListener("input", () => {
  adjustChatInputHeight();
  updateChatSend();
});

chatInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatClose?.addEventListener("click", closeChatDrawer);
chatClear?.addEventListener("click", clearChatMessages);
chatAttachedClear?.addEventListener("click", clearAttachedCode);

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
search.addEventListener("focus", () => renderSearch(search.value));
search.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const firstResult = searchResults.querySelector("[data-search-result]");
    if (firstResult) firstResult.click();
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
    closeChatDrawer();
  }
});
