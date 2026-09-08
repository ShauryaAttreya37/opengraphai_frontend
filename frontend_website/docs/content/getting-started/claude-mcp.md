# Connect Claude with MCP

The OpenGraph Image MCP server lets Claude build, inspect, and query image graphs without requiring you to work with `graph.json` directly.

## Before you begin

Complete the [Quickstart](quickstart.md) first so `opengraph-image` and its model-provider environment are available locally.

## Register the server

From the repository environment, add the MCP server to Claude:

```bash
claude mcp add opengraph-image -- opengraph-image-mcp
```

Confirm the connection:

```bash
claude mcp list
```

You should see `opengraph-image` reported as connected.

## Try a graph task

Tell Claude which folder contains the source images and what you want to know:

> Build a knowledge graph from the images in `./photos` and tell me which ones contain deciduous trees.

Claude can choose the appropriate OpenGraph tools, build or resolve the graph for that folder, and answer from its extracted relationships.

## Useful prompts

- “Query the graph: which images show a dog near a body of water?”
- “List every image represented in this graph.”
- “Show the entities and relationships extracted from `park-03.jpg`.”
- “Summarize this graph before answering any questions.”

## How graph resolution works

OpenGraph Image resolves graphs by folder. A graph built from `./photos` lives under `./photos/opengraph-out/graph.json`, so later requests can reuse it when the source folder is clear.

> **Tip:** Include the folder path in your first prompt. This removes ambiguity when a workspace contains more than one image graph.

## Available tools

The server exposes five focused operations. See the [MCP tools reference](../reference/mcp-tools.md) for inputs and intended use.
