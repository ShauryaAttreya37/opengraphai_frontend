# MCP tools

The OpenGraph Image MCP server exposes five operations. Together they cover graph construction, discovery, inspection, and natural-language querying.

| Tool | Input | Use it when… |
| --- | --- | --- |
| `build_graph` | `folder_path` | A source folder does not have a graph yet, or needs to be rebuilt |
| `query_graph` | `question`, `graph_path` | You need a grounded answer from the graph |
| `get_image_entities` | `image_filename`, `graph_path` | You want every entity and edge connected to one image |
| `list_images` | `graph_path` | You need to see which source images are represented |
| `graph_summary` | `graph_path` | You want high-level graph statistics before querying |

## `build_graph`

Builds a graph from every supported image in a folder.

```text
build_graph(folder_path="./photos")
```

Use the returned graph path for later inspection and query calls.

## `query_graph`

Answers a natural-language question using an existing graph.

```text
query_graph(
  question="Which images show a dog near water?",
  graph_path="./photos/opengraph-out/graph.json"
)
```

## `get_image_entities`

Returns the nodes and edges associated with a specific source image.

```text
get_image_entities(
  image_filename="park-03.jpg",
  graph_path="./photos/opengraph-out/graph.json"
)
```

## `list_images`

Lists every image currently represented in a graph.

```text
list_images(graph_path="./photos/opengraph-out/graph.json")
```

## `graph_summary`

Returns a compact overview of the graph and is a useful first call when an agent inherits an unfamiliar workspace.

```text
graph_summary(graph_path="./photos/opengraph-out/graph.json")
```

> **Agent pattern:** Summarize first, query second, then inspect individual sources only when the answer needs deeper verification.
