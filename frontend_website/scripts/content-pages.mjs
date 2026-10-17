import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import { Marked } from "marked";
import { contentPages, contentSchema, siteUrl } from "../src/site-metadata.js";
import { escapeHtml } from "./site-chrome.mjs";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("python", python);
hljs.registerLanguage("text", plaintext);

export const contentDir = "content";

const codeLabels = { bash: "Terminal", shell: "Terminal", python: "Python", json: "JSON" };

const slugify = (text) => text.toLowerCase().replace(/<[^>]+>|[`*_]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Fill the title, description, canonical, Open Graph and Twitter tags of a page template. */
export function applyPageMeta(html, { title, description, canonical }) {
  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*/, `$1${escapeHtml(description)}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${canonical}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${canonical}`)
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*/g, `$1${escapeHtml(title)}`)
    .replace(/(<meta (?:property="og:description"|name="twitter:description") content=")[^"]*/g, `$1${escapeHtml(description)}`);
}

/** Markdown to HTML with build-time syntax highlighting, so pages ship no highlighter. */
function renderMarkdown(markdown) {
  const headings = [];
  const marked = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        if (depth !== 2) return `<h${depth}>${inner}</h${depth}>\n`;
        const id = slugify(text);
        headings.push({ id, label: inner.replace(/<[^>]+>/g, "") });
        return `<h2 id="${id}">${inner}</h2>\n`;
      },
      code({ text, lang }) {
        const language = (lang || "text").split(/\s+/)[0];
        const highlighted = hljs.getLanguage(language) ? hljs.highlight(text, { language }).value : escapeHtml(text);
        const label = codeLabels[language];
        const header = label ? `<p class="code-label">${label}</p>` : "";
        return `<div class="code-block${label ? " has-label" : ""}">${header}<pre><code class="hljs language-${escapeHtml(language)}">${highlighted}</code></pre></div>\n`;
      },
      // A quote that opens with bold text ("**Preview.**") is a notice; any other quote is a prompt to type into an agent.
      blockquote({ tokens }) {
        const inner = this.parser.parse(tokens);
        const isNotice = /^<p><strong>/.test(inner.trim());
        return isNotice
          ? `<aside class="page-notice">${inner}</aside>\n`
          : `<figure class="page-prompt"><figcaption>Ask your agent</figcaption><blockquote>${inner}</blockquote></figure>\n`;
      },
    },
  });
  const html = marked
    .parse(markdown)
    .replace(/<table>/g, '<div class="page-table"><table>')
    .replace(/<\/table>/g, "</table></div>");
  return { html, headings };
}

const isExternal = (href) => /^https?:\/\//.test(href);
const button = ({ label, href }, variant) =>
  `<a class="page-button page-button-${variant}" href="${escapeHtml(href)}"${isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(label)}</a>`;

function renderAside(page, headings) {
  const toc = headings.length
    ? `<nav class="page-aside-section page-toc" aria-label="On this page">
          <p class="page-aside-heading">On this page</p>
          ${headings.map(({ id, label }) => `<a href="#${id}">${escapeHtml(label)}</a>`).join("\n          ")}
        </nav>`
    : "";
  const related = (page.related || [])
    .map((path) => contentPages.find((candidate) => candidate.path === path))
    .filter(Boolean)
    .map((target) => `<a href="${target.path}"><b>${escapeHtml(target.navLabel)}</b><span>${escapeHtml(target.navBlurb)}</span></a>`);
  const relatedSection = related.length
    ? `<nav class="page-aside-section page-related" aria-label="Related pages">
          <p class="page-aside-heading">Related</p>
          ${related.join("\n          ")}
        </nav>`
    : "";
  return `<aside class="page-aside">
        ${toc}
        ${relatedSection}
      </aside>`;
}

// A fact is plain text, or { label, href } when it should link out (e.g. to PyPI).
const renderFact = (fact) =>
  typeof fact === "string"
    ? escapeHtml(fact)
    : `<a href="${escapeHtml(fact.href)}"${isExternal(fact.href) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(fact.label)}</a>`;

function renderBreadcrumb(page) {
  const badge = page.badge ? `<span class="page-badge">${escapeHtml(page.badge)}</span>` : "";
  return `<nav class="page-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li>${escapeHtml(page.section)}</li>
            <li aria-current="page">${escapeHtml(page.navLabel)}</li>
          </ol>
          ${badge}
        </nav>`;
}

/** A short excerpt of what the build produces, so each page shows output before prose. */
function renderSpecimen(specimen) {
  if (!specimen) return "";
  const commands = specimen.commands
    .map((command) => `<p><span aria-hidden="true">$</span> <code>${escapeHtml(command)}</code></p>`)
    .join("");
  const inputs = specimen.inputs.map((name) => `<li>${escapeHtml(name)}</li>`).join("");
  const edges = specimen.edges
    .map(([from, relation, to, score], index) => `<li style="--i: ${index}">
              <span class="specimen-node">${escapeHtml(from)}</span>
              <span class="specimen-relation"><span class="specimen-relation-label">${escapeHtml(relation)}</span></span>
              <span class="specimen-node">${escapeHtml(to)}</span>
              ${score ? `<span class="specimen-score" title="Confidence">${escapeHtml(score)}</span>` : ""}
            </li>`)
    .join("");
  return `<figure class="specimen">
        <div class="specimen-commands">${commands}</div>
        <div class="specimen-body">
          <p class="specimen-label">Reads</p>
          <ul class="specimen-inputs">${inputs}</ul>
          <p class="specimen-label">Writes edges like</p>
          <ul class="specimen-edges">
            ${edges}
          </ul>
        </div>
        <figcaption>${escapeHtml(specimen.output)}</figcaption>
      </figure>`;
}

/** Previous and next links walk products, then use cases, in navigation order. */
function renderPager(page) {
  const index = contentPages.findIndex((candidate) => candidate.path === page.path);
  const link = (target, direction) =>
    target
      ? `<a class="page-pager-${direction}" href="${target.path}" rel="${direction}">
          <span>${direction === "prev" ? "Previous" : "Next"}</span>
          <b>${escapeHtml(target.navLabel)}</b>
        </a>`
      : "<span></span>";
  return `<nav class="page-pager" aria-label="More pages">
      ${link(contentPages[index - 1], "prev")}
      ${link(contentPages[index + 1], "next")}
    </nav>`;
}

function renderMobileToc(headings) {
  if (!headings.length) return "";
  return `<details class="page-toc-mobile">
          <summary>On this page</summary>
          ${headings.map(({ id, label }) => `<a href="#${id}">${escapeHtml(label)}</a>`).join("\n          ")}
        </details>`;
}

function renderPageContent(page, heading, body, headings) {
  const facts = page.facts?.length
    ? `<ul class="page-facts" aria-label="Release details">${page.facts.map((fact) => `<li>${renderFact(fact)}</li>`).join("")}</ul>`
    : "";
  return `<header class="page-hero${page.specimen ? " has-specimen" : ""}">
      <div class="page-hero-inner">
        <div class="page-hero-copy">
          ${renderBreadcrumb(page)}
          <h1>${escapeHtml(heading)}</h1>
          <p class="page-lede">${escapeHtml(page.lede)}</p>
          ${facts}
          <div class="page-actions">
            ${button(page.primaryCta, "primary")}
            ${page.secondaryCta ? button(page.secondaryCta, "secondary") : ""}
          </div>
        </div>
        ${renderSpecimen(page.specimen)}
      </div>
    </header>

    <div class="page-layout">
      <article class="page-prose">
        ${renderMobileToc(headings)}
${body}
      </article>
      ${renderAside(page, headings)}
    </div>

    ${renderPager(page)}

    <section class="page-cta" aria-labelledby="page-cta-title">
      <div>
        <h2 id="page-cta-title">Build your first graph</h2>
        <p>Open source under Apache-2.0. Runs locally with your own Anthropic API key.</p>
      </div>
      <div class="page-actions">
        ${button({ label: "Read the docs", href: "/docs/" }, "primary")}
        ${button({ label: "Star on GitHub", href: "https://github.com/OpenGraphAI/opengraph-ai" }, "secondary")}
      </div>
    </section>`;
}

/**
 * Render one markdown-backed page into the shared template (header and footer already injected).
 * @param {string} template
 * @param {(typeof contentPages)[number]} page
 * @param {string} root
 */
export function renderContentPage(template, page, root) {
  const markdown = readFileSync(resolve(root, contentDir, page.source), "utf8");
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1] || page.navLabel;
  const { html: body, headings } = renderMarkdown(markdown.replace(/^#\s+.+\n/, ""));
  const canonical = `${siteUrl}${page.path}`;
  const schema = JSON.stringify(contentSchema(page, heading)).replace(/</g, "\\u003c");

  return applyPageMeta(template, { title: `${page.title} | OpenGraph AI`, description: page.description, canonical })
    .replace("<!-- page-content -->", () => renderPageContent(page, heading, body, headings))
    .replaceAll(`href="${page.path}"`, `href="${page.path}" aria-current="page"`)
    .replace("</head>", () => `<script type="application/ld+json">${schema}</script>\n</head>`);
}
