# Hero: pixel tagline, relocated wordmark

**Date:** 2026-08-07
**Branch:** `codex/light-mode`
**Scope:** `frontend_website/index.html`, `src/main.js`, `src/styles.css`

## Goal

Replace the hero's giant `OPENGRAPH AI` pixel wordmark with the product statement
**"Context graphs for agents that need to reason."** The first two words keep the pixel
treatment; the rest is set in the normal sans. The company name moves to a top-left
corner lockup.

## Decisions

| Question | Decision |
|---|---|
| Tagline vs. wordmark | Tagline replaces the wordmark as the hero h1 |
| Pixel scope | `CONTEXT GRAPHS` only, drawn by the existing SVG dot engine |
| Company name | Top-left corner lockup, outside the nav pill |
| Scroll morph | Re-sourced from the tagline's dots; scroll range widened |

Rejected: setting the whole sentence in pixels. At 45 characters and hero size it costs
readability, and with nothing in a normal face the hierarchy flattens — no word is
emphasized because every word is.

Rejected: Pixelify Sans instead of the SVG engine for the pixel words. It ships faster
but produces no individual `<rect>` elements, which kills the dot morph.

## Design

### 1. Markup (`index.html`)

`.hero-title` becomes a two-part heading:

- `<span class="visually-hidden">` carries the full sentence for assistive tech.
- `<svg id="drawable-title">` renders `CONTEXT GRAPHS` as dots (unchanged mechanism).
- `<span class="title-fallback" aria-hidden="true">CONTEXT GRAPHS</span>` — the
  pre-draw / no-JS state, Pixelify Sans.
- New `<span class="tagline-tail">for agents that need to reason.</span>` in Instrument Sans.

The `.category` eyebrow (`MULTIMODAL CONTEXT INFRASTRUCTURE`), `.hero-description`,
and `.hero-actions` are unchanged. The hero stays center-aligned, consistent with the
rest of the page.

### 2. Glyphs (`src/main.js`)

`CONTEXT GRAPHS` needs C, O, N, T, E, X, G, R, A, P, H, S. Eight already exist. Four
are new, following the existing 5×7 convention — rounded corners like `O`/`G`, counters
left open so they don't fill in at display size:

```js
C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
S: ["01111", "10000", "10000", "01110", "00001", "10001", "01110"],
T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
```

### 3. Colour

The tagline's dots are accent-coloured. Add a `signalInk()` helper beside the existing
`groundInk()`, reading the `--signal` token (`#e55435` on paper, `#a2f649` on lime), so
a palette flip stays a one-attribute change.

The intro animation's `fill` target and `.title-pixel` styling switch to `signalInk()`.

The morph canvas currently paints with `groundInk()`. Since the dots now depart orange
and arrive at an ink-coloured heading, `render()` interpolates fill from signal to ground
ink across `progress`. Without this the dots snap colour at the end of the morph.

### 4. Morph re-source (`src/main.js`)

`buildPixelTitle("OPENGRAPH AI", target)` becomes `buildPixelTitle("CONTEXT GRAPHS", target)`.
`initialisePixelMorph` already reads `#title-pixels` and the viewBox width is computed
from the string, so no further wiring is needed.

**Range widening.** Measured on the current build, the morph runs from scrollY 83 to 524
— 442px, which completes before a normal scroll gesture ends.

The available travel is bounded: the title sits at document y=263 and the heading at
y=848, so only 585px of scroll separates the two anchors. Both offsets currently eat
into that. Widening means shrinking both, not enlarging either — the multiplier is
*subtracted*, so a larger value produces a **shorter** window, not a longer one.

In `measure()`:

```js
scrollStart = Math.max(0, titleTop - window.innerHeight * 0.6);
scrollEnd = headingTop - window.innerHeight * 0.1;
```

At a 720px viewport that gives 0 → 776, a 776px window against today's 442px. The morph
still completes while the heading is comfortably on screen. The existing 200px
minimum-span guard stays.

Going wider than this requires adding vertical space between the hero and the compiler
section, which is a layout change and out of scope here.

### 5. Corner lockup (`index.html`, `src/styles.css`)

New `.corner-label.corner-top` containing `OpenGraph AI`, positioned top-left inside
`.hero`, mirroring the existing `.corner-bottom` (`OPEN SOURCE · APACHE 2.0`). It uses
Pixelify Sans at 13px rather than the corner-label's 8px mono — 8px pixel type is
illegible, and the mark should still read as pixel. It is a real link to `/`.

The centered nav pill is not touched.

### 6. Responsive

`CONTEXT GRAPHS` is 14 characters against the wordmark's 12, so it renders wider.
`.title-fallback`'s `clamp(68px, 13.5vw, 220px)` drops to `clamp(44px, 11vw, 180px)`.
Check 375px width specifically — that is where overflow will appear first.

## Out of scope

- The `prefers-reduced-motion` gate stays as-is. It is correct behaviour, and it is why
  the morph appears dead on this machine (Windows animation effects are off). `?morph`
  bypasses it for development.
- The 147 deleted tracked files in the repo worktree.
- Any change to the nav pill, footer, or sections below the hero.

## Verification

1. `npm --prefix frontend_website run dev`, load `/`.
2. Dots draw in orange and spell `CONTEXT GRAPHS`; tail sentence reads correctly beneath.
3. Corner lockup present top-left; nav pill unchanged.
4. Load `/?morph`, scroll slowly: dots dissolve and rebuild the compiler heading, colour
   transitioning to ink, with no snap at the end.
5. No console errors.
6. Viewport at 375px: no horizontal overflow.
7. Screen reader / DOM check: full sentence exposed once, not duplicated by the SVG.
