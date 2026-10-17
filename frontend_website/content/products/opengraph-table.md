# OpenGraph Table

> **Preview.** OpenGraph Table is not on PyPI yet and its interfaces may change before the first release. Install it from source to try it today.

A number in a spreadsheet only means something next to its row label, its column header, and the sheet it lives on. Pass a table to a language model as flat text and that context is easy to lose. OpenGraph Table reads CSV, TSV, and Excel files, plus photos and screenshots of tables, and turns them into a graph of entities, relationships, metrics, and notes. Every value keeps the file, sheet, and cell it came from.

## What goes in, what comes out

Point the build at a folder of tables. It writes three files to `opengraph-out/`: a `graph.json` for agents and code, a `graph.html` for browsing, and a `graph.md` report for people.

```text
tables/
├─ suppliers.xlsx
├─ q3-costs.csv
└─ whiteboard-photo.jpg
        ↓  opengraph-table build ./tables
tables/opengraph-out/
├─ graph.json
├─ graph.html
└─ graph.md
```

| Part | What it holds |
| --- | --- |
| Source | Filename, sheet name, page and table index, and when it was extracted |
| Column | Header name and inferred type: text, numeric, date, or boolean |
| Entity | A named thing in the table, such as a company, person, or product, with attributes and the cells it came from |
| Relationship | A typed link between two entities, with a confidence score |
| Metric | A sum, average, count, minimum, maximum, percentage, or custom figure |
| Note | An insight, anomaly, validation check, or piece of context |

## Many tables, one graph

Tables are rarely useful alone. OpenGraph Table loads the existing `graph.json` first, then merges new tables into it:

- **Entities deduplicate** by normalized name and type. The highest-confidence version stays canonical and edges are repointed to it, so "Acme" in the supplier sheet and "Acme" in the cost export become one node.
- **Node IDs are scoped by source.** Two sheets that both have an `id` column never collide.
- **New data appends.** Add next month's export without rebuilding everything:

```bash
opengraph-table ingest ./tables-october \
  --graph ./tables/opengraph-out/graph.json
```

## Tools for your agent

The MCP server exposes five tools:

| Tool | What it does |
| --- | --- |
| `build_graph(folder_path)` | Builds a merged graph from every table file in a folder |
| `build_graph_from_content(tables)` | Builds a graph from CSV or TSV text pasted into the chat |
| `query_graph(question, graph_path)` | Answers a natural-language question from the graph |
| `graph_summary(graph_path)` | Returns node, edge, and type counts |
| `list_sources(graph_path)` | Lists the files and sheets behind the graph |

`build_graph_from_content` is useful when a user drops a CSV into a conversation: the agent can build a graph from it without first saving the file to a folder.

## Install and run

```bash
git clone https://github.com/OpenGraphAI/opengraph-ai.git
cd opengraph-ai/opengraph-table
pip install -e .
```

With `ANTHROPIC_API_KEY` set, build and query. Note that `summary` and `query` take the path to `graph.json` directly:

```bash
opengraph-table build ./tables
opengraph-table summary ./tables/opengraph-out/graph.json
opengraph-table query ./tables/opengraph-out/graph.json \
  --question "Which suppliers appear in both the contract list and the cost export?"
```

For agents, register the MCP server:

```bash
claude mcp add opengraph-table -- opengraph-table-mcp
```

## Limits worth knowing

- **Table content leaves your machine during a build.** Extraction calls the Anthropic API, including for images of tables.
- **Deduplication is heuristic.** It works on names and types, so review merged entities before relying on them for financial or compliance work.
- **Large graphs are not tuned yet.** Graphs past roughly 10,000 nodes may be slow to build and query.
- **Preview interfaces.** Command and tool signatures still differ slightly from OpenGraph Image and OpenGraph Text. Expect changes before the first PyPI release.

If you have a table-heavy workload, we would like to hear about it. [Get in touch](/#about) and tell us what your data looks like.
