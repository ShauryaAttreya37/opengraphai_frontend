# Search images by relationship

Keyword search can find every photo tagged "person" and every photo tagged "umbrella". It cannot tell you which ones show a person *holding* the umbrella, rather than a person standing near a closed umbrella in a stand. Captions help only when someone happened to write the exact phrase you search for.

OpenGraph Image records the relationship itself. Each image becomes a graph of objects, attributes, scene, visible text, and the spatial relations between objects, so a query can match on structure instead of wording.

## From tags to relationships

| You want | Tags or captions return | A graph query matches |
| --- | --- | --- |
| A person holding an umbrella | Any image tagged with both, in any arrangement | A `holding` edge from the person to the umbrella |
| A laptop on a desk, indoors | Images that mention laptops or desks | An `on_top_of` edge plus an indoor scene label |
| Signs that read "EXIT" | Only images whose captions include the word | Text spans read from inside the image |
| A red ceramic mug | Depends on what the tagger chose to record | A mug with `color: red` and `material: ceramic` attributes |

Because relations and attribute keys come from fixed vocabularies, the same question matches the same way across the whole collection.

## Search from your agent

Build a graph once, then let any MCP-compatible agent search it:

```bash
pip install opengraph-image
opengraph-image build ./photos
claude mcp add opengraph-image -- opengraph-image-mcp
```

Prompts that work well:

- "Which images in ./photos show a person holding an umbrella?"
- "List the photos with a bicycle in front of a building."
- "Show everything extracted from `street-14.jpg`."

The last prompt calls `get_image_entities`, which is the quickest way to check why an image matched before you rely on it.

## Video: sample frames today

OpenGraph Image reads still images, not video files. To search footage, sample frames into a folder and build a graph from them. With one frame per second, the frame number tells you roughly where in the clip to look:

```bash
mkdir frames
ffmpeg -i site-walkthrough.mp4 -vf fps=1 frames/t%05d.jpg
opengraph-image build ./frames
```

Numbering starts at 1, so a match on `t00042.jpg` points to roughly the 41-second mark. Raise the frame rate for fast-moving scenes, or lower it to keep builds cheap on long recordings.

Native video support, including events that unfold across frames, is not part of the current release.

## Good fits

- Product and catalog photography, where buyers ask for arrangements ("a sofa next to a floor lamp")
- Field inspection and site photos, where the question is what sits on, inside, or behind what
- Recorded demos and walkthroughs, sampled into frames and searched by what appears on screen

## Limits worth knowing

- **Each image is a model call.** Build cost and time scale with the size of the collection, so sample video frames sparingly.
- **Images are sent to a hosted model** during the build. Do not process footage you are not permitted to share with your model provider.
- **Fixed vocabularies cut both ways.** Matching is consistent, but a relation outside the set, such as "leaning against", is not recorded.
- **No identity across frames.** Objects merge by label, so the graph knows a car appears in 40 frames, not whether it is the same car.
