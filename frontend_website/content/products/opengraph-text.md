# OpenGraph Text

Retrieval over documents usually means cutting text into chunks and hoping the right passage ranks first. OpenGraph Text reads each document in a folder and records what it says as a graph: who and what it mentions, which topics it covers, the specific claims it makes, and how the people, organizations, and places in it relate to each other.

Every node stays linked to the documents it came from. An agent can answer "which reports say Acme acquired Beta?" by following an `acquired` edge, then point to the files that support it.

## What goes in, what comes out

The input is a folder of `.txt`, `.md`, and `.pdf` files. The build writes `opengraph-out/graph.json` next to the folder.

```text
reports/
├─ board-notes-q3.pdf
├─ market-scan.md
└─ partner-call.txt
        ↓  opengraph-text build ./reports
reports/opengraph-out/
└─ graph.json
```

| Node | What it holds | Example |
| --- | --- | --- |
| Document | Source path, format, and word count | `board-notes-q3.pdf` |
| Entity | A person, organization, place, product, concept, or event | `Acme Robotics` |
| Topic | A theme the document is about | `supply chain` |
| Attribute | A role, industry, location, size, founding date, status, or description | `industry: logistics` |
| Claim | A literal assertion of up to 200 characters | "Acme opened a second plant in 2025." |

Documents connect to their entities, topics, and claims. Entities connect to each other through a fixed set of relations: `works_at`, `founded`, `invested_in`, `acquired`, `located_in`, `part_of`, `competitor_of`, `collaborates_with`, and `mentions`. Every node and edge carries a confidence score.

### One entity, many documents

After extraction, entities with the same normalized name and type are merged across documents. "Acme Robotics Inc" in one report and "Acme Robotics" in another become one node that records every document it was `seen_in`. Topics and attributes merge the same way.

### Claims are kept apart

Claims are never merged. If two documents disagree, both claims stay in the graph, each linked to the document that states it. An agent can report the disagreement and cite both sources instead of quietly picking one.

## Tools for your agent

| Tool | What it does |
| --- | --- |
| `build_graph(folder_path)` | Builds the graph for every supported document in a folder |
| `query_graph(question, graph_path)` | Answers a natural-language question from the graph |
| `get_document_entities(document_filename, graph_path)` | Returns every node and edge connected to one document |
| `list_documents(graph_path)` | Lists the documents represented in the graph |
| `graph_summary(graph_path)` | Returns node, edge, and type counts |

Like OpenGraph Image, graphs resolve by folder: name the folder and the server finds `opengraph-out/graph.json` inside it.

The main branch adds a sixth tool, `build_graph_html`, and a `visualize` command that render the graph to an interactive `graph.html`. Both arrive on PyPI with the next release; install from source if you want them today.

## Install and run

Install the package from [PyPI](https://pypi.org/project/opengraph-text/0.1.0/):

```bash
pip install opengraph-text
```

Set `ANTHROPIC_API_KEY` in your environment or a `.env` file, then build and ask:

```bash
opengraph-text build ./reports
opengraph-text summary ./reports
opengraph-text query "Which companies does Acme collaborate with?" \
  --graph ./reports/opengraph-out/graph.json
```

Register the MCP server to use it from Claude:

```bash
claude mcp add opengraph-text -- opengraph-text-mcp
```

## Limits worth knowing

- **Documents leave your machine during a build.** Extraction and querying call the Anthropic API. The graph files are written locally.
- **PDFs need a text layer.** PDFs are read with `pypdf`, so scanned pages without embedded text come through empty. Run OCR first.
- **The relation set is general-purpose.** It covers people, companies, and places well. Domain links such as `cites` or `contradicts` are not in the vocabulary yet; use claims for findings instead.
- **Merging is by name.** Two different people who share a name and type will merge. Review entity nodes when that matters.
- **Alpha software.** Expect the schema to change between releases. The project page on PyPI still shows a placeholder README; this page and the repository are the current reference.
