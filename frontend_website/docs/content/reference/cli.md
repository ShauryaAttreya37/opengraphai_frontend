# CLI reference

Use the CLI to build and inspect image graphs directly from a terminal. Run `opengraph-image --help` in your installed version for the complete option list.

## Build

Create or rebuild a graph for a folder of images:

```bash
opengraph-image build ./photos
```

The default output is written inside the source folder:

```text
./photos/opengraph-out/graph.json
```

## Summary

Inspect the graph associated with a source folder:

```bash
opengraph-image summary ./photos
```

Use this after a build to confirm that the graph contains the sources and extracted structure you expect.

## Query

Ask a natural-language question against a graph file:

```bash
opengraph-image query "What's happening in the park photos?" \
  --graph ./photos/opengraph-out/graph.json
```

## A repeatable workflow

```bash
# 1. Build
opengraph-image build ./photos

# 2. Inspect
opengraph-image summary ./photos

# 3. Ask
opengraph-image query "Which photos show a person near water?" \
  --graph ./photos/opengraph-out/graph.json
```

## Move to an agent workflow

When you want Claude to select and run these operations conversationally, [connect the MCP server](../getting-started/claude-mcp.md).
