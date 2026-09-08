# Context graphs

A context graph stores not only what a source mentions, but also **how those things relate** and **where the evidence came from**.

## The three core parts

| Part | What it represents | Example |
| --- | --- | --- |
| Node | An extracted thing or concept | `dog`, `lake`, `park scene` |
| Edge | A typed relationship between nodes | `dog` → `near` → `lake` |
| Source evidence | The file that supports the extraction | `park-03.jpg` |

That structure lets an agent traverse a relationship such as “dog near water” instead of relying only on whether a caption happens to contain the same words.

## Graph retrieval and vector retrieval

These approaches solve different parts of retrieval and can be used together.

| Vector retrieval | Graph retrieval |
| --- | --- |
| Finds semantically similar content | Follows explicit relationships |
| Returns passages or chunks | Returns connected entities and paths |
| Strong for fuzzy topical recall | Strong for multi-hop and entity-centric questions |
| Provenance depends on the chunk metadata | Evidence can remain attached to graph relationships |

OpenGraph AI does not require graphs to replace vector search. A useful agent can retrieve broadly with embeddings, then use graph structure to resolve relationships and preserve an auditable evidence path.

## Image extraction

For an image source, OpenGraph can represent:

- **Objects** visible in the scene
- **Scenes** that describe the setting
- **Attributes** attached to an object or scene
- **Relationships** between extracted entities
- **Source identity** tying every extraction back to its image

## Why this matters for agents

An agent often needs to answer a question whose evidence is spread across several facts. A graph makes those dependencies explicit, enabling the agent to:

1. Start from a relevant entity.
2. Follow relationships to nearby evidence.
3. Compare or combine multiple paths.
4. Return an answer with the supporting source attached.

---

**Next:** [See how OpenGraph Image applies this model →](../opengraph-image/README.md)
