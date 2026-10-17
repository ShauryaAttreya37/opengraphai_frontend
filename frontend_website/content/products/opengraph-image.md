# OpenGraph Image

Most image search stops at filenames, tags, and captions. OpenGraph Image reads every image in a folder with a vision model and records what it sees as a graph: the objects in the frame, the scene they sit in, their visual attributes, any text that appears in the picture, and the spatial relationships between objects.

The result is one `graph.json` file you can hand to an agent. Instead of guessing which caption best matches a question, the agent follows edges: from a `mug` to the `table` it sits `on_top_of`, and from there to the photos that show both.

## What goes in, what comes out

The input is a folder of images. The output is written next to it: a `graph.json` holding every node and edge, and a `graph.html` file you can open in a browser to explore the graph visually.

```text
photos/
├─ kitchen-01.jpg
├─ kitchen-02.jpg
└─ desk-03.png
        ↓  opengraph-image build ./photos
photos/opengraph-out/
├─ graph.json    nodes, edges, and source images
└─ graph.html    interactive view of the same graph
```

Each image contributes these kinds of nodes:

| Node | What it holds | Example |
| --- | --- | --- |
| Image | The source file, its dimensions, and format | `kitchen-01.jpg` |
| Object | A detected thing, with an optional normalized bounding box | `mug` |
| Scene | One scene label per image from a fixed set | `indoor_residential` |
| Attribute | A color, material, mood, lighting, style, or size value | `material: ceramic` |
| Text span | Text read from inside the image | `"EXIT"` |

Objects, scenes, attributes, text spans, and every edge carry a confidence score between 0 and 1.

### Relationships with a fixed vocabulary

Relationships between objects use a small controlled set: `next_to`, `on_top_of`, `inside`, `behind`, `in_front_of`, `holding`, and `wearing`. Because the words are fixed, "a mug on a table" matches the same way in every photo, not only in the ones whose captions happen to phrase it that way.

### Linked across images

After extraction, objects, scenes, and attributes with the same label are merged into one node that records every image it was `seen_in`. Asking "which photos show a bicycle?" becomes a single lookup rather than a search over captions.

## Tools for your agent

The MCP server exposes six tools. Any MCP-compatible client can call them, including Claude Code, Claude Desktop, and Cursor.

| Tool | What it does |
| --- | --- |
| `build_graph(folder_path)` | Builds the graph for every supported image in a folder |
| `query_graph(question, graph_path)` | Answers a natural-language question from the graph |
| `get_image_entities(image_filename, graph_path)` | Returns every entity and edge connected to one image |
| `list_images(graph_path)` | Lists the images represented in the graph |
| `graph_summary(graph_path)` | Returns node, edge, and type counts at a glance |
| `build_graph_html(graph_path)` | Renders the graph to an interactive `graph.html` |

Graphs resolve by folder. Once `./photos` has been built, later calls that name the same folder reuse `./photos/opengraph-out/graph.json`, so an agent can pick up where a previous session stopped.

## Install and run

Install the package from PyPI:

```bash
pip install opengraph-image
```

Extraction uses Claude vision through the Anthropic API, so set `ANTHROPIC_API_KEY` in your environment or in a `.env` file. Then build, inspect, and query:

```bash
opengraph-image build ./photos
opengraph-image summary ./photos
opengraph-image query "Which photos show a mug on a table?" \
  --graph ./photos/opengraph-out/graph.json
```

To let Claude drive the same workflow, register the MCP server:

```bash
claude mcp add opengraph-image -- opengraph-image-mcp
```

The [quickstart](/docs/getting-started/quickstart/) walks through a full run on the sample images in the repository, and the [MCP tools reference](/docs/reference/mcp-tools/) covers each tool's inputs.

## Limits worth knowing

- **Images leave your machine during a build.** Extraction calls a hosted vision model, so build time and cost grow with the number of images. The graph itself is stored locally.
- **Merging is by label, not identity.** Two different red mugs in two photos become one `mug` node seen in both. OpenGraph groups what looks the same; it does not track individual objects.
- **The vocabularies are deliberately small.** A relationship outside the set, such as "pouring into", is not recorded as an edge.
- **Still images only.** For video, sample frames into a folder first. The [image and video search](/use-cases/image-video-search/) page shows how.
- **Alpha software.** The graph format may change between releases.
