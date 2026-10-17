# Scene memory for robots

A robot's camera sees thousands of frames during a single task, and most of what it saw is gone by the next step. Questions like "where was the sponge?" or "what was sitting on the tray?" need a memory that keeps objects, the places they were in, and how they related to each other, not a pile of raw frames or loose captions.

OpenGraph Image turns camera frames into that memory. Each frame becomes a set of objects, a scene label, visual attributes, and spatial relations, all linked back to the frame that showed them. A planning agent can then query the graph instead of re-reading video.

## Relations built for manipulation

The relation vocabulary maps directly onto the questions manipulation tasks ask:

| Relation | A question it answers |
| --- | --- |
| `on_top_of` | What is resting on the tray? |
| `inside` | Is anything still inside the drawer? |
| `next_to` | Which tool was next to the cutting board? |
| `behind`, `in_front_of` | Is the cup blocked by anything? |
| `holding` | What was the gripper holding in that frame? |

Objects also carry attributes such as color, material, and size, so a task can refer to "the blue cloth" or "the metal pot" rather than an opaque ID.

## See it on real robot data

The [Robot Scene Memory sample](https://opengraphai.github.io/opengraph-samples-robot-scene-memory/) builds a graph from 16 robot-camera observations taken from BridgeData V2, a public robot-manipulation dataset, and publishes the result as a read-only graph gallery you can click through. The [sample repository](https://github.com/OpenGraphAI/opengraph-samples-robot-scene-memory) includes the source data and the steps to reproduce it.

## A workflow you can run today

**1. Save frames with names that keep their order.** OpenGraph does not read timestamps from image metadata, so put the episode and step in the filename:

```text
episode-07/
├─ ep07_step-000.jpg
├─ ep07_step-015.jpg
└─ ep07_step-030.jpg
```

**2. Build the graph for the episode.**

```bash
pip install opengraph-image
opengraph-image build ./episode-07
```

**3. Give your agent the MCP server**, then ask in plain language:

```bash
claude mcp add opengraph-image -- opengraph-image-mcp
```

> Using the graph for ./episode-07, which frames show the sponge inside the sink, and what was next to it?

Objects with the same label are merged into one node that lists every frame it was `seen_in`, so the agent can find the sponge in one step, follow its `inside` and `next_to` edges, and return the frame filenames. The step numbers in those names tell the planner when each observation happened.

## What it does not do yet

Be clear about where this fits before you wire it into a robot:

- **Not a control loop.** Every frame is a call to a hosted vision model. Use the graph for episodic memory, task review, and planning between actions, not for reactive control.
- **No identity tracking.** Objects merge by label. Two identical cups become one `cup` node seen in both frames; the graph does not know whether they are the same cup.
- **2D only.** Bounding boxes are optional and normalized to the image. There are no depth estimates, poses, or map coordinates.
- **Shared multi-robot memory is a direction, not a feature.** Each build produces one graph for one folder today.

If you are working on robot memory and want to test this on your own episodes, [talk to us](/#about).
