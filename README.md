# OpenGraph AI website

The marketing site and documentation for [OpenGraph AI](https://opengraphai.io), the open-source context layer that turns images, text, and tables into knowledge graphs that AI agents can query over MCP or a CLI.

Live site: **https://opengraphai.io**

| Product | Status |
| --- | --- |
| [OpenGraph Image](https://pypi.org/project/opengraph-image/) | On PyPI |
| [OpenGraph Text](https://pypi.org/project/opengraph-text/) | On PyPI |
| OpenGraph Table | Preview |

Models and samples: [Hugging Face](https://huggingface.co/OpenGraph-AI) · Try it without installing: [Robot Scene Memory playground](https://opengraphai.github.io/opengraph-samples-robot-scene-memory/)

## What's in the site

- **Landing page** (`index.html`): animated hero, coding-agent section, a bento grid of interactive demos (provenance inspector, evidence trace, confidence threshold, use-case carousel), install commands, and an FAQ accordion.
- **Product pages**: `/products/opengraph-image/`, `/products/opengraph-text/`, `/products/opengraph-table/`.
- **Use-case pages**: `/use-cases/robotics/`, `/use-cases/image-video-search/`, `/use-cases/multimodal-agents/`, `/use-cases/research/`.
- **Docs** (`/docs/`): quickstart, Claude MCP setup, concepts, CLI and MCP tool reference, plus an "Ask" assistant backed by a serverless endpoint.
- **SEO**: every page is prerendered to static HTML at build time with canonical URLs, Open Graph tags, JSON-LD, and a generated `sitemap.xml`.

## Tech stack

- [Vite 7](https://vite.dev) with plain JavaScript and CSS (no UI framework)
- [Anime.js](https://animejs.com) and [Lenis](https://lenis.darkroom.engineering) for motion and smooth scrolling
- [Three.js](https://threejs.org) for authoring the landing-page graph animation
- [marked](https://marked.js.org) and [highlight.js](https://highlightjs.org) for Markdown pages and code blocks
- [Lucide](https://lucide.dev) icons
- A Vercel serverless function (`api/assistant.js`) that calls Gemini through `@google/genai` for the docs assistant

## Getting started

Requires Node.js 20.19+ or 22.12+ (needed by Vite 7).

```bash
cd frontend_website
npm install
npm run dev
```

Open http://localhost:5173.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Build to `dist/` and prerender every docs, product, and use-case page plus `sitemap.xml` |
| `npm run preview` | Serve the production build locally |

`npm run dev` does not run the `/api/assistant` function. To try the docs assistant locally, use the [Vercel CLI](https://vercel.com/docs/cli) from `frontend_website/`:

```bash
vercel dev
```

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Vercel project settings, or `frontend_website/.env.local` for `vercel dev` | Vertex AI key used by the docs assistant. Without it the endpoint returns `503` and the rest of the site still works. |

Never commit `.env*` files. They are already ignored by `frontend_website/.gitignore` and `.vercelignore`.

## Project structure

```text
.
├── frontend_website/          # The site (this is the Vercel root directory)
│   ├── index.html             # Landing page
│   ├── page.html              # Template for Markdown-backed product and use-case pages
│   ├── docs/
│   │   ├── index.html         # Docs shell
│   │   └── content/           # Docs Markdown (also synced to GitBook via .gitbook.yaml)
│   ├── content/
│   │   ├── products/          # Product page bodies
│   │   ├── use-cases/         # Use-case page bodies
│   │   └── faq.md             # Landing-page FAQ: each "## " heading is one question
│   ├── src/
│   │   ├── main.js            # Landing-page behaviour
│   │   ├── bento.js           # Interactive bento-grid demos
│   │   ├── docs.js            # Docs navigation, code blocks, and assistant panel
│   │   ├── page.js            # Product and use-case page behaviour
│   │   ├── site-metadata.js   # Page registry: titles, descriptions, nav, links, sitemap
│   │   ├── site-nav.js        # Shared header and theme toggle
│   │   ├── graph-loop/        # Three.js graph animation used to render the hero loop
│   │   └── *.css              # Styles and light/dark theme tokens
│   ├── scripts/
│   │   ├── seo-pages.mjs      # Vite plugin that prerenders pages and writes the sitemap
│   │   ├── content-pages.mjs  # Renders content/*.md into page.html
│   │   ├── faq.mjs            # Renders content/faq.md into the FAQ accordion and FAQPage schema
│   │   ├── site-chrome.mjs    # Shared header and footer markup
│   │   ├── export-graph-loop.mjs  # Exports graph-loop.html to video
│   │   └── build-agent-icons.mjs  # Converts agent SVG icons into morphable path data
│   ├── api/assistant.js       # Serverless docs assistant (rate limited, history bounded)
│   ├── public/                # Static assets: logo, social card, hero video, frames
│   └── graph-loop.html        # Standalone page for authoring the graph animation
├── docs/superpowers/specs/    # Design notes for larger site changes
├── web/                       # Earlier React component sketches, kept for reference
└── .gitbook.yaml              # Points GitBook at frontend_website/docs/content
```

## Editing content

**Add or edit a product or use-case page**

1. Write the body in `frontend_website/content/products/` or `frontend_website/content/use-cases/`.
2. Register the page in `frontend_website/src/site-metadata.js` (`productPages` or `useCasePages`) with its path, title, description, and nav label. This drives the header menu, footer, meta tags, and sitemap.
3. Run `npm run build` and check the generated page in `dist/`.

**Edit the FAQ**: change `frontend_website/content/faq.md`. Each `## ` heading becomes a question, and the text below it becomes the answer. The build also emits matching `FAQPage` structured data.

**Edit the docs**: change the Markdown in `frontend_website/docs/content/`. If you add a page, also add it to `docsPages` in `site-metadata.js` and to `docs/content/SUMMARY.md` for GitBook.

## Regenerating the hero animation

The landing page plays a pre-rendered loop (`public/video/graph-loop-1440.mp4`) instead of running Three.js on every visit. To change it, edit `src/graph-loop/`, preview it at `/graph-loop.html`, then export from `frontend_website/`:

```bash
npx playwright install chromium   # first time only
node scripts/export-graph-loop.mjs
```

The export needs `ffmpeg` on your `PATH`. After changing an icon in `assets/agents/`, run `node scripts/build-agent-icons.mjs`.

## Deployment

The site deploys on [Vercel](https://vercel.com):

- **Root directory**: `frontend_website`
- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Environment variable**: `GEMINI_API_KEY`

Files in `frontend_website/api/` are deployed as serverless functions automatically. The output uses directory indexes, so `/docs/reference/cli/` serves `docs/reference/cli/index.html`.

## Contributing

1. Branch from `main`.
2. Run `npm run build` and confirm it finishes without errors.
3. Check the pages you touched in both light and dark mode and at a phone-sized viewport.
4. Open a pull request against `main` with a short description and screenshots of visual changes.
