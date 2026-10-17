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

- **Landing page**: animated hero, coding-agent section, a bento grid of interactive demos (provenance inspector, evidence trace, confidence threshold, use-case carousel), install commands, and an FAQ.
- **Product pages**: OpenGraph Image, OpenGraph Text, and OpenGraph Table.
- **Use-case pages**: Robotics, Image and video search, Multimodal agents, and Research.
- **Docs**: quickstart, Claude MCP setup, concepts, and CLI and MCP tool reference, with a built-in Ask assistant.
- **SEO**: every page ships as static HTML with canonical URLs, Open Graph tags, structured data, and a sitemap.
- **Themes and devices**: light and dark mode, tested down to phone-sized screens.

## Tech stack

- [Vite](https://vite.dev) with plain JavaScript and CSS (no UI framework)
- [Anime.js](https://animejs.com) and [Lenis](https://lenis.darkroom.engineering) for motion and smooth scrolling
- [Three.js](https://threejs.org) for the landing-page graph animation
- [marked](https://marked.js.org) and [highlight.js](https://highlightjs.org) for Markdown pages and code blocks
- [Lucide](https://lucide.dev) icons
- Hosted on [Vercel](https://vercel.com)

## Project structure

```text
.
├── frontend_website/       # The site
│   ├── index.html          # Landing page
│   ├── content/            # Product, use-case, and FAQ copy (Markdown)
│   ├── docs/content/       # Documentation (Markdown, also synced to GitBook)
│   ├── src/                # Page scripts, styles, and the graph animation
│   ├── scripts/            # Build-time page and sitemap generation
│   └── public/             # Logo, social card, hero video, and images
├── docs/superpowers/specs/ # Design notes for larger site changes
└── web/                    # Earlier React component sketches, kept for reference
```

## Branches

- `main`: the published site.
- `feature_test`: work in progress before it goes to `main`.
