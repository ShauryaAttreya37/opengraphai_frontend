export const siteUrl = "https://opengraphai.io";

export const docsPages = [
  { slug: "introduction", path: "/docs/", source: "README.md", title: "Knowledge Graph Documentation", description: "Learn how OpenGraph AI builds queryable knowledge graphs, preserves source evidence, and gives AI agents connected context through the CLI and MCP." },
  { slug: "getting-started/quickstart", path: "/docs/getting-started/quickstart/", source: "getting-started/quickstart.md", title: "Knowledge Graph Quickstart", description: "Install OpenGraph Image, build a knowledge graph from your images, inspect entities and relationships, and run your first evidence-backed query." },
  { slug: "getting-started/claude-mcp", path: "/docs/getting-started/claude-mcp/", source: "getting-started/claude-mcp.md", title: "Connect Claude with MCP", description: "Connect OpenGraph AI to Claude Code or Claude Desktop with MCP. Build image knowledge graphs and query relationships from your existing agent workflow." },
  { slug: "concepts/context-graphs", path: "/docs/concepts/context-graphs/", source: "concepts/context-graphs.md", title: "Context Graphs: Entities, Relationships & Evidence", description: "Understand OpenGraph AI context graphs: source nodes, entities, typed relationships, and evidence paths that agents can inspect and traverse." },
  { slug: "opengraph-image/overview", path: "/docs/opengraph-image/overview/", source: "opengraph-image/README.md", title: "OpenGraph Image Overview", description: "Explore OpenGraph Image, the image-to-knowledge-graph implementation. Extract connected entities from image collections and access them through CLI or MCP." },
  { slug: "reference/mcp-tools", path: "/docs/reference/mcp-tools/", source: "reference/mcp-tools.md", title: "MCP Tools Reference", description: "Reference for OpenGraph AI MCP tools. Build and inspect image knowledge graphs, query connected entities, and return source evidence to your AI agent." },
  { slug: "reference/cli", path: "/docs/reference/cli/", source: "reference/cli.md", title: "CLI Command Reference", description: "Use the OpenGraph Image CLI to build, inspect, and query knowledge graphs. Find command syntax, configuration options, and examples for your workflow." },
];

const repoUrl = "https://github.com/OpenGraphAI/opengraph-ai";

/* The live Robot Scene Memory gallery: an interactive graph that needs no install or API key. */
export const playgroundUrl = "https://opengraphai.github.io/opengraph-samples-robot-scene-memory/";

/* Markdown-backed marketing pages. Body copy lives in content/<source>; the
   fields here feed the page header, navigation, footer, sitemap, and meta tags. */
export const productPages = [
  {
    path: "/products/opengraph-image/",
    source: "products/opengraph-image.md",
    navLabel: "OpenGraph Image",
    navBlurb: "Image folders into scene graphs",
    title: "OpenGraph Image: Image Knowledge Graphs for AI Agents",
    description: "Turn a folder of images into a knowledge graph of objects, scenes, attributes, OCR text, and relationships that Claude and other MCP agents can query.",
    lede: "Point it at a folder of images. Get back a graph of what is in them, how those things relate, and which file says so.",
    facts: [{ label: "v0.1.2 on PyPI", href: "https://pypi.org/project/opengraph-image/0.1.2/" }, "Python 3.11+", "Apache-2.0", "6 MCP tools"],
    primaryCta: { label: "Read the quickstart", href: "/docs/getting-started/quickstart/" },
    secondaryCta: { label: "View on GitHub", href: `${repoUrl}/tree/main/opengraph-image` },
    specimen: {
      commands: ["opengraph-image build ./photos"],
      inputs: ["kitchen-01.jpg", "kitchen-02.jpg", "desk-03.png"],
      edges: [
        ["mug", "on_top_of", "table", "0.94"],
        ["mug", "has_attribute", "material: ceramic", "0.88"],
        ["kitchen-01.jpg", "in_scene", "indoor_residential", "0.97"],
        ["desk-03.png", "has_text", "\"Q3 PLAN\"", "0.81"],
      ],
      output: "photos/opengraph-out/graph.json",
    },
    related: ["/use-cases/image-video-search/", "/use-cases/robotics/"],
  },
  {
    path: "/products/opengraph-text/",
    source: "products/opengraph-text.md",
    navLabel: "OpenGraph Text",
    navBlurb: "Documents into entity and claim graphs",
    title: "OpenGraph Text: Document Knowledge Graphs for AI Agents",
    description: "Turn folders of .txt, .md, and PDF documents into a knowledge graph of entities, topics, claims, and typed relations that agents can query over MCP.",
    lede: "Turn a folder of notes, reports, and PDFs into entities, topics, and claims, each linked back to the document that states it.",
    facts: [{ label: "v0.1.0 on PyPI", href: "https://pypi.org/project/opengraph-text/0.1.0/" }, "Python 3.11+", "Apache-2.0", "5 MCP tools"],
    primaryCta: { label: "Install from PyPI", href: "https://pypi.org/project/opengraph-text/0.1.0/" },
    secondaryCta: { label: "View on GitHub", href: `${repoUrl}/tree/main/opengraph-text` },
    // Inputs are the package's own test documents (opengraph-text/tests/
    // sample_documents); each edge restates a sentence in them.
    specimen: {
      commands: ["opengraph-text build ./sample_documents"],
      inputs: ["doc_anthropic.md", "doc_openai.md", "doc_competition.md"],
      edges: [
        ["doc_anthropic.md", "states", "\"Anthropic was founded by Dario Amodei and Daniela Amodei in 2021.\""],
        ["Dario Amodei", "founded", "Anthropic"],
        ["Sam Altman", "works_at", "OpenAI"],
        ["Anthropic", "competitor_of", "OpenAI"],
      ],
      output: "sample_documents/opengraph-out/graph.json",
    },
    related: ["/use-cases/research/", "/use-cases/multimodal-agents/"],
  },
  {
    path: "/products/opengraph-table/",
    source: "products/opengraph-table.md",
    navLabel: "OpenGraph Table",
    navBlurb: "Tables into graphs with cell provenance",
    badge: "Preview",
    title: "OpenGraph Table: Spreadsheet and Table Knowledge Graphs",
    description: "Preview: turn CSV, Excel, and table images into a knowledge graph of entities, metrics, and notes, with every value traced back to its source cell.",
    lede: "Merge spreadsheets, CSVs, and photographed tables into one graph, and keep the sheet, row, and column behind every value.",
    facts: ["Preview · not yet on PyPI", "Python 3.11+", "5 MCP tools"],
    primaryCta: { label: "View on GitHub", href: `${repoUrl}/tree/main/opengraph-table` },
    secondaryCta: { label: "Talk to us", href: "/#about" },
    specimen: {
      commands: ["opengraph-table build ./tables"],
      inputs: ["suppliers.xlsx", "q3-costs.csv", "whiteboard-photo.jpg"],
      edges: [
        ["suppliers.xlsx", "contains_entity", "Acme Robotics"],
        ["suppliers.xlsx", "contains_column", "renewal_date"],
        ["q3-costs.csv", "contains_metric", "total_cost"],
        ["Acme Robotics", "supplies", "drive units", "0.89"],
      ],
      output: "tables/opengraph-out/graph.json",
    },
    related: ["/use-cases/research/", "/use-cases/multimodal-agents/"],
  },
];

export const useCasePages = [
  {
    path: "/use-cases/robotics/",
    source: "use-cases/robotics.md",
    navLabel: "Robotics",
    navBlurb: "Connect objects, locations, and tasks",
    title: "Robot Scene Memory with Knowledge Graphs",
    description: "Give robots and embodied agents a queryable scene memory: build a knowledge graph of objects and spatial relations from robot camera frames with OpenGraph AI.",
    lede: "Turn robot camera frames into a scene memory an agent can query: what was seen, where it sat, and which observation shows it.",
    primaryCta: { label: "Open the live sample", href: playgroundUrl },
    secondaryCta: { label: "OpenGraph Image", href: "/products/opengraph-image/" },
    specimen: {
      commands: ["opengraph-image build ./episode-07"],
      inputs: ["ep07_step-000.jpg", "ep07_step-015.jpg", "ep07_step-030.jpg"],
      edges: [
        ["sponge", "inside", "sink", "0.91"],
        ["gripper", "holding", "sponge", "0.87"],
        ["sponge", "next_to", "dish brush", "0.84"],
        ["ep07_step-015.jpg", "in_scene", "indoor_residential", "0.95"],
      ],
      output: "episode-07/opengraph-out/graph.json",
    },
    related: ["/products/opengraph-image/", "/use-cases/multimodal-agents/"],
  },
  {
    path: "/use-cases/image-video-search/",
    source: "use-cases/image-video-search.md",
    navLabel: "Image & video search",
    navBlurb: "Find visual relationships",
    title: "Relationship-Aware Image and Video Search",
    description: "Search images and video frames by relationship, not keyword. OpenGraph AI builds a knowledge graph of objects, scenes, and spatial relations for agents to query.",
    lede: "Search a photo library or video frames for how things relate, not just which tags they carry, and get the matching files back.",
    primaryCta: { label: "Read the quickstart", href: "/docs/getting-started/quickstart/" },
    secondaryCta: { label: "OpenGraph Image", href: "/products/opengraph-image/" },
    specimen: {
      commands: ["opengraph-image build ./frames"],
      inputs: ["t00041.jpg", "t00042.jpg", "street-14.jpg"],
      edges: [
        ["person", "holding", "umbrella", "0.93"],
        ["bicycle", "in_front_of", "building", "0.88"],
        ["street-14.jpg", "has_text", "\"EXIT\"", "0.86"],
        ["street-14.jpg", "in_scene", "outdoor", "0.98"],
      ],
      output: "frames/opengraph-out/graph.json",
    },
    related: ["/products/opengraph-image/", "/use-cases/robotics/"],
  },
  {
    path: "/use-cases/multimodal-agents/",
    source: "use-cases/multimodal-agents.md",
    navLabel: "Multimodal AI agents",
    navBlurb: "Reason across every source",
    title: "Knowledge Graphs for Multimodal AI Agents",
    description: "Give one AI agent graph access to images, documents, and tables at once. Run the OpenGraph MCP servers side by side and let the agent reason across them.",
    lede: "Give one agent structured access to your images, documents, and tables, and let it cite the source behind each step.",
    primaryCta: { label: "Connect Claude with MCP", href: "/docs/getting-started/claude-mcp/" },
    secondaryCta: { label: "View on GitHub", href: repoUrl },
    specimen: {
      commands: ["claude mcp add opengraph-table -- opengraph-table-mcp", "claude mcp add opengraph-text -- opengraph-text-mcp", "claude mcp add opengraph-image -- opengraph-image-mcp"],
      inputs: ["site-reports.xlsx", "maintenance-manual.pdf", "site-photos/"],
      edges: [
        ["site-reports.xlsx", "contains_entity", "Site 14"],
        ["maintenance-manual.pdf", "states", "\"Reseal roof cracks within 48 hours.\"", "0.90"],
        ["water stain", "next_to", "roof vent", "0.81"],
      ],
      output: "One graph per server, one agent across them",
    },
    related: ["/products/opengraph-image/", "/products/opengraph-text/", "/products/opengraph-table/"],
  },
  {
    path: "/use-cases/research/",
    source: "use-cases/research.md",
    navLabel: "Research",
    navBlurb: "Connect papers, figures, and data",
    title: "Knowledge Graphs for Research Literature and Data",
    description: "Map a research corpus into a knowledge graph: claims from papers, entities from figures, and values from data tables, each traced back to its source file.",
    lede: "Map papers, figures, and data tables into one place where every claim and value points back to the file it came from.",
    primaryCta: { label: "OpenGraph Text", href: "/products/opengraph-text/" },
    secondaryCta: { label: "Talk to us", href: "/#about" },
    specimen: {
      commands: ["opengraph-text build ./papers"],
      inputs: ["smith-2024.pdf", "lee-2025.pdf", "review-notes.md"],
      edges: [
        ["lee-2025.pdf", "states", "\"Dropout fell to 8% with weekly check-ins.\"", "0.87"],
        ["Vision Lab", "collaborates_with", "Robotics Group", "0.84"],
        ["Ana Lee", "works_at", "Vision Lab", "0.93"],
        ["smith-2024.pdf", "about_topic", "sample size", "0.89"],
      ],
      output: "papers/opengraph-out/graph.json",
    },
    related: ["/products/opengraph-text/", "/products/opengraph-table/"],
  },
];

export const contentPages = [
  ...productPages.map((page) => ({ ...page, section: "Products" })),
  ...useCasePages.map((page) => ({ ...page, section: "Use cases" })),
];

const toNavItem = ({ path, navLabel, navBlurb, badge }) => ({ href: path, label: navLabel, blurb: navBlurb, badge });

/* One definition renders the navbar and footer on the home page and every content page. */
export const siteNavigation = [
  { label: "Products", items: productPages.map(toNavItem) },
  { label: "Use Cases", items: useCasePages.map(toNavItem) },
  {
    label: "Resources",
    alignRight: true,
    items: [
      { href: "/docs/", label: "Documentation", blurb: "Guides and API reference", newTab: true },
      { href: repoUrl, label: "GitHub", blurb: "Source, issues, and releases", newTab: true },
      { href: "/#faq", label: "FAQ", blurb: "Data, pricing, and setup questions" },
      { href: "/#about", label: "About", blurb: "Why we're building OpenGraph" },
    ],
  },
];

export const sitePaths = ["/", ...contentPages.map((page) => page.path), ...docsPages.map((page) => page.path)];

export function contentSchema(page, heading) {
  const canonical = `${siteUrl}${page.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: heading, headline: heading, description: page.description, url: canonical, inLanguage: "en", publisher: { "@id": `${siteUrl}/#organization` } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: heading, item: canonical },
      ] },
    ],
  };
}

export function docsSchema(page, heading) {
  const canonical = `${siteUrl}${page.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: heading, description: page.description, url: canonical, inLanguage: "en", publisher: { "@id": `${siteUrl}/#organization` } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Documentation", item: `${siteUrl}/docs/` },
        ...(page.path === "/docs/" ? [] : [{ "@type": "ListItem", position: 3, name: heading, item: canonical }]),
      ] },
    ],
  };
}
