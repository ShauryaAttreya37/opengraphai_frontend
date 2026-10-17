import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { marked } from "marked";
import { contentPages, docsPages, docsSchema, sitePaths, siteUrl } from "../src/site-metadata.js";
import { applyPageMeta, contentDir, renderContentPage } from "./content-pages.mjs";
import { injectFaq } from "./faq.mjs";
import { escapeHtml as escape, injectSiteChrome } from "./site-chrome.mjs";

const contentTemplate = "page.html";
const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitePaths.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join("\n")}\n</urlset>\n`;
const matchesPath = (page, path) => [page.path, page.path.slice(0, -1)].includes(path);

function renderDoc(template, page, root) {
  const markdown = readFileSync(resolve(root, "docs/content", page.source), "utf8");
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1] || page.title;
  let content = marked.parse(markdown.replace(/^#\s+.+\n/, ""));
  content = content.replace(/href="([^"]+\.md)"/g, (match, href) => {
    const source = new URL(href, `https://docs.local/${page.source}`).pathname.slice(1);
    const target = docsPages.find((candidate) => candidate.source === source);
    return target ? `href="${target.path}"` : match;
  });
  const canonical = `${siteUrl}${page.path}`;
  const title = `${page.title} | OpenGraph AI`;
  const schema = docsSchema(page, heading);
  return applyPageMeta(template, { title, description: page.description, canonical })
    .replace(/(<h1 data-page-title>).*?(<\/h1>)/, `$1${escape(heading)}$2`)
    .replace(/(<article class="markdown-body" data-docs-article>).*?(<\/article>)/s, (_, open, close) => `${open}${content}${close}`)
    .replace(/(<nav class="docs-nav"[^>]*>).*?(<\/nav>)/s, `$1${docsPages.map((doc) => `<a class="docs-nav-link" href="${doc.path}">${escape(doc.title)}</a>`).join("\n")}$2`)
    .replace("</head>", `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>\n</head>`);
}

/** Real HTML pages keep docs readable and crawlable without JavaScript. */
export function seoPages() {
  let root;
  return {
    name: "opengraph-seo-pages",
    enforce: "post",
    configResolved(config) { root = config.root; },
    transformIndexHtml: { order: "pre", handler: (html) => injectFaq(injectSiteChrome(html), root) },
    configureServer(server) {
      // Markdown edits re-render on request; reload so the open tab picks them up.
      const contentRoot = resolve(root, contentDir);
      server.watcher.add(contentRoot);
      server.watcher.on("change", (file) => {
        if (file.startsWith(contentRoot)) server.ws.send({ type: "full-reload" });
      });

      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path === "/sitemap.xml") {
          res.setHeader("Content-Type", "application/xml");
          res.end(sitemap());
          return;
        }
        const contentPage = contentPages.find((page) => matchesPath(page, path));
        if (contentPage) {
          try {
            const template = await server.transformIndexHtml(contentPage.path, readFileSync(resolve(root, contentTemplate), "utf8"));
            res.setHeader("Content-Type", "text/html");
            res.end(renderContentPage(template, contentPage, root));
          } catch (error) {
            next(error);
          }
          return;
        }
        if (docsPages.some((page) => page.path !== "/docs/" && matchesPath(page, path))) req.url = "/docs/index.html";
        next();
      });
    },
    generateBundle(_, bundle) {
      const pageTemplate = bundle[contentTemplate];
      if (!pageTemplate || pageTemplate.type !== "asset") throw new Error("Content page template is missing from the build.");
      contentPages.forEach((page) => {
        this.emitFile({ type: "asset", fileName: `${page.path.slice(1)}index.html`, source: renderContentPage(String(pageTemplate.source), page, root) });
      });
      delete bundle[contentTemplate];

      const template = bundle["docs/index.html"];
      if (!template || template.type !== "asset") throw new Error("Documentation HTML is missing from the build.");
      const html = String(template.source);
      docsPages.forEach((page) => {
        const source = renderDoc(html, page, root);
        if (page.path === "/docs/") template.source = source;
        else this.emitFile({ type: "asset", fileName: `${page.path.slice(1)}index.html`, source });
      });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap() });
    },
  };
}
