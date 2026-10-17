# One agent, every source

Real questions rarely stay inside one format. A field-service lead asks which sites reported damage, what the maintenance manual says to do about it, and whether the site photos show the problem. The answer lives in a spreadsheet, a PDF, and a folder of images. Pasting all three into a context window loses the structure that connects them; a single vector index over everything returns similar-sounding passages, not the relationships between them.

OpenGraph gives each format its own graph and exposes each graph to the agent through MCP. The agent decides which source to ask, follows typed edges inside it, and cites the file behind every step.

## How it works today

Each package builds a graph for one modality and runs as its own MCP server. Install the packages you need into the environment your agent launches them from, then register them side by side:

```bash
claude mcp add opengraph-image -- opengraph-image-mcp
claude mcp add opengraph-text -- opengraph-text-mcp
claude mcp add opengraph-table -- opengraph-table-mcp
```

| Server | Builds a graph from | Evidence it returns |
| --- | --- | --- |
| [OpenGraph Image](/products/opengraph-image/) | Photos, screenshots, sampled video frames | Image filenames |
| [OpenGraph Text](/products/opengraph-text/) | `.txt`, `.md`, and `.pdf` documents | Document paths and claims |
| [OpenGraph Table](/products/opengraph-table/) (preview) | CSV, TSV, Excel, and table images | File, sheet, and cell |

## A worked example

> Which sites in site-reports.xlsx were marked as damaged, what does the maintenance manual say to do, and do the photos in ./site-photos show the damage?

An agent with all three servers can break that into steps:

1. **Table graph.** Query the site report for rows marked damaged. The answer carries the sheet and cells it came from.
2. **Text graph.** Query the manual for claims about damage procedures. Each claim links to the document that states it.
3. **Image graph.** For each damaged site, list the matching photos and call `get_image_entities` to see what the vision pass actually recorded.
4. **Answer with citations.** Combine the three, with a source for every statement, and flag any site where the photos do not support the report.

The pattern from the [MCP tools reference](/docs/reference/mcp-tools/) applies to every server: summarize first, query second, and inspect individual sources only when an answer needs verification.

## Why separate graphs help

- **Structure survives.** A cell stays tied to its row and column, a claim to its document, an object to its image. Nothing is flattened into undifferentiated chunks.
- **Typed edges.** `acquired`, `on_top_of`, and a metric's source cell mean different things, and the agent can treat them differently.
- **Auditable answers.** Every step points to a file a person can open and check.

## What is not there yet

- **No merged cross-modal graph.** Each server keeps its own graph. Matching "ACME Corp" in a PDF to "Acme" in a spreadsheet is left to the agent's reasoning.
- **Audio and video are not supported directly.** Video can be sampled into frames for OpenGraph Image; audio has no package yet.
- **Mixed maturity.** OpenGraph Image and OpenGraph Text are on PyPI; OpenGraph Table is a preview you install from source.

A shared semantic graph across tables, text, images, audio, and video is where the project is heading. If you are building agents that need it, [talk to us](/#about).
