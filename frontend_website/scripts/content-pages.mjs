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
        return `<div class="code-block"><pre><code class="hljs language-${escapeHtml(language)}">${highlighted}</code></pre></div>\n`;
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

function renderPageContent(page, heading, body, headings) {
  const facts = page.facts?.length
    ? `<ul class="page-facts" aria-label="Release details">${page.facts.map((fact) => `<li>${renderFact(fact)}</li>`).join("")}</ul>`
    : "";
  return `<header class="page-hero">
      <div class="page-hero-inner">
        <p class="page-eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(heading)}</h1>
        <p class="page-lede">${escapeHtml(page.lede)}</p>
        ${facts}
        <div class="page-actions">
          ${button(page.primaryCta, "primary")}
          ${page.secondaryCta ? button(page.secondaryCta, "secondary") : ""}
        </div>
      </div>
    </header>

    <div class="page-layout">
      <article class="page-prose">
${body}
      </article>
      ${renderAside(page, headings)}
    </div>

    <section class="page-cta" aria-labelledby="page-cta-title">
      <div>
        <h2 id="page-cta-title">Build your first graph</h2>
        <p>Open source under Apache-2.0. Runs locally with your own model-provider key.</p>
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
