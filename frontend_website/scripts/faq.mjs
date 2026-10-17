import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Marked } from "marked";
import { escapeHtml } from "./site-chrome.mjs";

export const faqSource = "content/faq.md";
const faqPlaceholder = "<!-- site-faq -->";

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Answers link out to docs and GitHub; external links open in a new tab like the rest of the site.
const answerMarked = new Marked({
  renderer: {
    link({ href, tokens }) {
      const external = /^https?:\/\//.test(href);
      const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeHtml(href)}"${target}>${this.parser.parseInline(tokens)}</a>`;
    },
  },
});

/**
 * Split content/faq.md into questions: every "## " heading starts one, and the
 * markdown below it, up to the next heading, is its answer.
 * @param {string} root
 * @returns {{ id: string, question: string, answerHtml: string }[]}
 */
export function loadFaq(root) {
  const markdown = readFileSync(resolve(root, faqSource), "utf8");
  return markdown
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [question, ...answer] = block.split("\n");
      const text = question.trim();
      return { id: `faq-${slugify(text)}`, question: text, answerHtml: answerMarked.parse(answer.join("\n").trim()) };
    });
}

function renderFaqItems(items) {
  return items
    .map(({ id, question, answerHtml }, index) => `<details class="faq-item" name="faq" id="${id}"${index === 0 ? " open" : ""}>
          <summary>
            <span class="faq-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
            <span class="faq-question">${escapeHtml(question)}</span>
            <span class="faq-toggle" aria-hidden="true"></span>
          </summary>
          <div class="faq-answer">
            ${answerHtml}
          </div>
        </details>`)
    .join("\n        ");
}

function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answerHtml }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answerHtml.trim() },
    })),
  };
}

/** Fill the landing page's FAQ placeholder and add matching FAQPage structured data. */
export function injectFaq(html, root) {
  if (!html.includes(faqPlaceholder)) return html;
  const items = loadFaq(root);
  const schema = JSON.stringify(faqSchema(items)).replace(/</g, "\\u003c");
  return html
    .replace(faqPlaceholder, () => renderFaqItems(items))
    .replace("</head>", () => `<script type="application/ld+json">${schema}</script>\n</head>`);
}
