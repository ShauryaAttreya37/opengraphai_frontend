# OpenGraph AI documentation

## Build context your agents can traverse

OpenGraph AI converts heterogeneous source material into **queryable knowledge graphs**. It preserves entities, relationships, and source evidence so an agent can follow context across multiple steps instead of searching an unstructured collection of similar passages.

> **Current release**
>
> `opengraph-image` is the first public implementation. It builds a graph from a folder of images, then exposes that graph through a CLI and five MCP tools.

## Get started

| Goal | Documentation |
| --- | --- |
| Build and query your first graph | [Quickstart](getting-started/quickstart.md) |
| Connect Claude Code or Claude Desktop | [Connect Claude with MCP](getting-started/claude-mcp.md) |
| Understand entities and relationships | [Context graphs](concepts/context-graphs.md) |
| Review the complete tool surface | [MCP tools](reference/mcp-tools.md) |

## Core workflow

```text
source images → extraction → entities + relationships → graph.json
                                                        ↓
                                      CLI / MCP → grounded answer
```

1. **Build** a graph from source images.
2. **Inspect** the extracted entities, relationships, and evidence.
3. **Query** the graph from the CLI or an MCP-compatible agent.
4. **Trace** each result back to its source files.

OpenGraph AI is open source under the Apache-2.0 license. The current public release focuses on images; the graph contract is designed to support additional modalities as the project develops.

---

**Next:** [Build your first image graph →](getting-started/quickstart.md)
