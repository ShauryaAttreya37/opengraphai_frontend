# OpenGraph Image

`opengraph-image` turns a folder of images into a knowledge graph that an agent can inspect and query conversationally.

## What the package extracts

The image pipeline looks beyond filename metadata and captions. It identifies:

- Objects
- Scenes
- Attributes
- Relationships between visible entities
- The source image supporting each extraction

## Package interfaces

| Interface | Best for |
| --- | --- |
| CLI | Local exploration, scripts, and repeatable terminal workflows |
| MCP server | Claude Code, Claude Desktop, Cursor, and other MCP-compatible agents |
| `graph.json` | Inspecting or integrating the serialized graph directly |

## Build lifecycle

```text
folder
  ├─ image-01.jpg
  ├─ image-02.png
  └─ image-03.webp
          ↓ build
opengraph-out/
  └─ graph.json
          ↓ query
entities + relationships + grounded answer
```

## A relationship-aware query

Keyword search can locate images tagged with “dog” or “water.” A graph query can ask for the relationship between them:

> Which images show a dog near a body of water?

The graph can follow the extracted `near` relationship and return the source images supporting the match.

## Current scope

The public v1 package is focused on images. The wider OpenGraph AI project is building toward a shared semantic graph layer for tables, text, audio, and video, but documentation in this section describes the image package that is available now.

## Continue building

- [Install and run the package](../getting-started/quickstart.md)
- [Connect it to Claude](../getting-started/claude-mcp.md)
- [Review every MCP operation](../reference/mcp-tools.md)
