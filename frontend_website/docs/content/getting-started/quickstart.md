# Quickstart

Build a knowledge graph from a folder of images, inspect the result, and ask your first question.

## 1. Get the repository

```bash
git clone https://github.com/OpenGraphAI/opengraph-ai.git
cd opengraph-ai/opengraph-image
```

## 2. Install the package

Create and activate your preferred Python environment, then install the package in editable mode:

```bash
pip install -e .
```

## 3. Configure a model provider

Copy the example environment file and add a supported model-provider key. For example:

```bash
cp ../.env.example .env
echo 'ANTHROPIC_API_KEY=your_anthropic_api_key_here' >> .env
```

> **Keep credentials local.** Never commit `.env` or paste a real provider key into an issue, log, or prompt.

## 4. Build the graph

Point the CLI at a folder of images:

```bash
opengraph-image build ./tests/sample_images/test_photos
```

The command writes the graph beside the source folder:

```text
tests/sample_images/test_photos/opengraph-out/graph.json
```

## 5. Inspect the result

```bash
opengraph-image summary ./tests/sample_images/test_photos
```

The summary gives you a quick view of what the extraction produced before you start asking questions.

## 6. Query the graph

```bash
opengraph-image query "What's happening in the park photos?" \
  --graph ./tests/sample_images/test_photos/opengraph-out/graph.json
```

The answer is generated from the graph built from your own source images.

## What next?

- [Connect the same graph to Claude](claude-mcp.md)
- [Learn how context graphs are structured](../concepts/context-graphs.md)
- [Review the CLI commands](../reference/cli.md)
