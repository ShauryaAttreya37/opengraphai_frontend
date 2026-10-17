# Frequently asked questions

<!-- Each "## " heading is one question; everything under it, up to the next "## ", is the answer.
     scripts/faq.mjs renders these into the landing page accordion and its FAQPage structured data. -->

## What is OpenGraph AI?

OpenGraph AI is an open-source context layer for AI agents. It turns your files into knowledge graphs of entities, the relationships between them, and the source each one came from, then gives agents tools to query those graphs over MCP or a CLI.

It ships as separate packages per data type. [OpenGraph Image](/products/opengraph-image/) and [OpenGraph Text](/products/opengraph-text/) are on PyPI; [OpenGraph Table](/products/opengraph-table/) is in preview.

## How is this different from vector search or RAG?

Vector search finds passages that *look* similar to a question. A graph stores explicit, typed relationships, so an agent can follow `on_top_of`, `acquired`, or `part_of` edges across several steps and keep the evidence attached at every hop.

They work well together: retrieve broadly with embeddings, then use the graph to resolve relationships and cite sources. [Read how context graphs work](/docs/concepts/context-graphs/).

## What kinds of data can it handle today?

- **Images** (photos, screenshots, video frames) with OpenGraph Image
- **Documents** (`.txt`, `.md`, `.pdf`) with OpenGraph Text
- **Tables** (CSV, TSV, Excel, and photos of tables) with OpenGraph Table, in preview

Audio and video files aren't read directly yet. For video, sample frames into a folder and build an image graph from them.

## Which agents and tools does it work with?

Any MCP-compatible client, including Claude Code, Claude Desktop, and Cursor. Register a server once and the agent picks the right tools on its own:

```bash
claude mcp add opengraph-image -- opengraph-image-mcp
```

There is also a CLI for scripts and CI, and every build writes a plain `graph.json` you can load in your own code.

## Does my data leave my machine?

Building and querying a graph call your model provider, currently Claude through the Anthropic API, so source content is sent there for extraction. The graph itself is written to a local `opengraph-out/` folder next to your data, and you decide where it goes from there.

Check your provider's data terms before processing anything sensitive.

## What does it cost? Do I need an API key?

The packages are free and open source under the Apache-2.0 license. Extraction and querying use Claude, so you need an Anthropic API key set as `ANTHROPIC_API_KEY`, and that usage is billed by Anthropic. Build cost grows with the number of files you process.

## How do I check where an answer came from?

Every node keeps a link to its source. Image objects list the images they were seen in, text claims link to the document that states them, and table values keep their file, sheet, and cell.

Ask the agent to show its evidence, or call `get_image_entities` or `get_document_entities` to inspect everything extracted from a single file.

## How do I get started?

Install the image package and build a graph from any folder of pictures:

```bash
pip install opengraph-image
opengraph-image build ./photos
```

The [quickstart](/docs/getting-started/quickstart/) walks through the rest. To see a finished graph first, open the [live robot-memory sample](https://opengraphai.github.io/opengraph-samples-robot-scene-memory/); it needs no install.

## Can I contribute or request a feature?

Yes. Issues and pull requests are welcome on [GitHub](https://github.com/OpenGraphAI/opengraph-ai). New test images, extraction edge cases, and documentation fixes all help. To talk an idea through first, join the [Discord](https://discord.gg/PGFqf5amy6) or email [team@opengraphai.io](mailto:team@opengraphai.io).
