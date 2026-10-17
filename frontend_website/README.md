# OpenGraph AI flow model

Standalone light-mode Anime.js prototype showing multimodal inputs becoming an agent-ready context graph.

```bash
npm install
npm run dev
```

Current deployable frontend lives in `dist/`.

`npm run build` also renders all seven documentation pages to static HTML and
generates `dist/sitemap.xml`. Deploy the entire `dist/` directory with directory
index support so `/docs/reference/cli/` serves its `index.html`. Existing `#/…`
documentation links still resolve in the client. Canonicals and the sitemap use
`https://opengraphai.io`, the site's existing public domain.

The landing-page graph uses `public/video/graph-loop-1440.mp4` (muted, lazy-loaded,
and paused outside the viewport). The Three.js scene remains available in
`graph-loop.html` for animation authoring and export. Hero dots are capped at 24
fps; reduced-motion preferences disable automatic motion. Embedded demo fonts
use Latin WOFF2 subsets, with the original font files retained for other uses.
