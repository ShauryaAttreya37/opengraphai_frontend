# Map a research corpus

A literature review lives in many places at once: PDFs of papers, figures exported as images, and supplementary tables in spreadsheets. The structure that matters, such as who reported what, which groups work together, and where two papers disagree, is spread across all of them. Reading it back out means rereading everything.

OpenGraph builds that structure once and keeps it attached to the sources. Papers become entities, topics, and claims. Data tables become entities and metrics tied to their cells. Figures become objects and the text visible in them. Every node points back to the file it came from.

## Papers: entities, topics, and claims

Run [OpenGraph Text](/products/opengraph-text/) over a folder of papers and notes:

```bash
pip install opengraph-text
opengraph-text build ./papers
```

Each paper becomes a document node connected to:

- **Entities:** people, organizations, places, products, concepts, and events, merged across papers so a lab or author appears once with every paper that mentions it
- **Topics:** the themes each paper covers, also merged across the corpus
- **Claims:** short literal statements, each linked to the paper that makes it

Claims are the most useful handle for findings. They are never merged, so when two papers report different results, both statements stay in the graph with their sources.

Questions that work well:

- "Which papers make claims about sample size?"
- "Which organizations collaborate with each other, and in which papers?"
- "List every claim about dropout rates, with the paper each comes from."

## Figures and supplementary data

- **Figures** go through [OpenGraph Image](/products/opengraph-image/), which records visible objects and the text inside the image, such as axis labels, legends, and annotations. It describes what a figure shows, not the plotted values behind it.
- **Supplementary tables** go through [OpenGraph Table](/products/opengraph-table/) (preview), which keeps every entity and metric tied to its file, sheet, and cell, so a value in an answer can be checked against the original spreadsheet.

Register the servers together and a research agent can move between them. The [multimodal agents](/use-cases/multimodal-agents/) page shows how.

## Provenance by default

Every claim links to a document, every table value to a sheet and cell, and every visual entity to an image. A reviewer can trace any answer back to its source in one step instead of trusting a summary.

## Before you process sensitive data

Building a graph sends source content to the configured model provider, currently the Anthropic API. The resulting graph files are written locally.

Before you process unpublished results, participant data, or anything governed by an ethics approval, a data-use agreement, or privacy law, confirm that sending it to a hosted model is allowed. OpenGraph is a research tool. It is not validated for clinical or diagnostic use.

## Current limits

- **The relation set is general-purpose.** `collaborates_with`, `part_of`, and `mentions` exist; research-specific links such as `cites`, `replicates`, or `contradicts` do not yet. Use claims for findings.
- **PDFs need a text layer.** Scanned papers without embedded text need OCR first.
- **Separate graphs per format.** Papers, figures, and tables live in separate graphs, and the agent connects them at query time.

Working on a research corpus and want to try this with us? [Get in touch](/#about).
