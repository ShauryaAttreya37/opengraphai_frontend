# OpenGraph AI website plan

## 1. Navigation

- OpenGraph AI wordmark
- Product
  - How it works
  - Playground
- Use cases
- Developers
  - Documentation
  - GitHub
- Primary CTA: `Try playground`

Keep navigation short. Do not lead with Sign in until account-led product flow is real.

## 2. Hero: category + outcome

**Headline:** Give your agents context they can traverse.

**Supporting copy:** OpenGraph AI turns documents, tables, images, audio, and video into a queryable knowledge graph—with relationships and citations preserved.

**Actions:**

- Primary: `Try the playground`
- Secondary: `View on GitHub`

**Hero proof:** Animated data-flow model: sources ingest, entities link into a graph, a question traverses evidence, agent-ready outputs resolve.

## 3. Core problem

**Section label:** Ask questions search cannot answer.

Explain that chunk retrieval finds relevant passages; relationship-aware context answers multi-hop questions and preserves evidence.

Show three example questions:

- Which customer risks connect Q3 calls, support tickets, and renewal data?
- What changed before conversion dropped, and which source supports it?
- Which people, projects, and documents connect to this decision?

## 4. Product flow

**Section label:** From files to cited context.

1. Ingest multimodal sources: documents, tables, images, audio, video, web, APIs.
2. Extract entities, concepts, citations, and metadata.
3. Link relationships across sources into a graph.
4. Query ranked subgraphs from an agent, CLI, API, or MCP tool.

Show each stage with concrete output—not generic AI decoration.

## 5. Evidence path

**Section label:** Answers you can trace.

Show a single query result with:

- Answer summary
- Relationship path
- Source citations
- Direct source excerpt
- Confidence or retrieval context when available

This is primary trust moment. Orange marks active relationships; blue marks sources and citations.

## 6. Graph retrieval vs. vector-only retrieval

**Section label:** Retrieve relationships, not only passages.

Use an honest comparison:

- Vector retrieval: finds semantically similar chunks.
- OpenGraph AI: adds entities, relationships, paths, and evidence provenance.

Avoid claims that graphs replace vector search. State when graph traversal helps: multi-hop reasoning, auditable answers, cross-modal context, entity-centric retrieval.

## 7. Playground preview

**Section label:** Drop a file. Watch a graph appear.

Show usable product UI preview:

- File/source ingestion
- Extracted entities
- Interactive graph
- Natural-language query
- Cited response

CTA: `Open playground`

## 8. Developer integration

**Section label:** Use it where agents already work.

Present four interfaces:

- MCP server
- CLI
- REST API
- Agent skill

Default tab: MCP server. Include one short, accurate install/configuration snippet and a link to full documentation.

## 9. Use cases

**Section label:** Built for questions with dependencies.

Feature three focused cases:

1. Research agents with citations
2. Enterprise memory and operational reasoning
3. Multimodal RAG across documents, calls, images, and data

Each case needs a real question, the evidence path, and the product outcome. Do not use broad industry-card grids.

## 10. Open-source proof

**Section label:** Built in the open.

- GitHub repository
- Apache-2.0 license
- Current supported tools and extractors
- Contribution path
- Documentation link

Use real repository facts only. No borrowed enterprise logos or unsupported adoption claims.

## 11. Product trust

**Section label:** Technical details that matter.

Answer:

- Supported sources and modalities
- How agents call the graph
- Data handling and deployment model
- Schema requirements
- Current product maturity
- Relationship to vector databases and RAG

Use an FAQ only for questions not already answered by the product demonstration.

## 12. Final CTA

**Headline:** Build your first context graph.

**Supporting copy:** Start with a folder, repository, API, or agent workflow.

Actions:

- Primary: `Try the playground`
- Secondary: `Read the docs`

## Design rules

- Light-mode foundation: warm canvas `#F4F2ED`, ink `#111317`.
- Orange `#E55435` means action and relationships.
- Blue `#2457D6` means sources and citations.
- Black means primary action.
- Use compact monospace labels for technical metadata.
- Use graph structure, evidence paths, and actual product UI as visual identity.
- Avoid purple gradients, particle constellations, inflated metrics, fake terminal effects, and repeated rounded-card grids.
- Every claim should be demonstrable, cited, or clearly scoped as a product target.
