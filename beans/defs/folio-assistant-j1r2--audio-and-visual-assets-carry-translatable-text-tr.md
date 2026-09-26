---
# folio-assistant-j1r2
title: Audio and visual assets carry translatable text — transcripts, captions, alt text, embedded labels
status: todo
type: task
created_at: 2026-09-19T07:54:17Z
updated_at: 2026-09-19T07:54:17Z
parent: folio-assistant-bzyu
---


## What this is

Raised by the repo owner, 2026-09-19:

> "narrative/audio/visual content with text should be translatable. its not so
> much the node schema itself but its content (e.g. markdown, bpmn) should be
> translatable."

The first half of that is already built. The second half — **audio and visual**
— is not.

## What already exists, so nobody rebuilds it

`schemas/translation-tools.ts` declares translatable **formats per content
type**, each with an extract (source → POT) and inject (PO → source) module.
Measured on `main` at `ed3403322`, the registered extensions are:

`.md`, `.tex`, `.puml` / `.plantuml`, `.svg`, `.archimate`, `.xlsx`, `.bpmn`,
`.fsh`, `.json` (FHIR).

`content/pipeline/bpmn-translate.ts` handles the BPMN half and is the model to
copy: it extracts label text and deliberately never offers `calledElement` or
the `folio:` extension attributes, because those are references, not prose.
`isTranslatable(contentType, extension)` is the existing predicate.

So the architecture the owner describes is correct and in place. This bean is
about the formats missing from that registry, not about a new mechanism.

## What is missing

**Audio and video.** No format handles a transcript, a caption track (`.vtt`,
`.srt`) or an audio description. A folio that ships a recording ships
untranslatable narrative, and the translation sweep reports a clean run over it
— which is the `dh4f` defect shape: a consumer scans nothing and calls it green.

**Visual.** `.svg` IS registered, so text *inside* an SVG is reachable. What is
not:

- **`alt` text and long descriptions on raster images** (`.png`, `.webp`,
  `.jpg`). These are prose, they are what a screen-reader user hears, and they
  live in the referring markdown or in a manifest — so the question is whether
  they are already caught by the `.md` extractor or fall in the gap between it
  and the image. **Measure this before designing anything.**
- **`cat-harness.json`'s own `images[]`**, which carry `title` and
  `description` — the landing-page images each have several sentences of prose
  that no catalogue reaches.
- Figure captions, if they are carried anywhere other than markdown body text.

## Done when

Each of the above is either **registered as a translatable format** with an
extract/inject module, or **recorded here as deliberately out of scope with its
reason** — a scrapped line is a result, an unexamined one is not.

Three-states rule applies throughout: "this folio has no audio" and "the audio
could not be read" must not render the same way.

## Not this bean

- `INGEST: audio — transcription and translation` is a different subject: that
  is the *intake* pipeline turning a recording into text on the way in. This is
  about translating the text an asset already carries once it is in the folio.
- The navbar/locale work (`lgwe`, PR #351) and the viewer chrome (`udx8`,
  PR #352) are separate and in flight.
- `BPMN re-render for translated labels` covers re-rendering the SVG after
  injection; the extraction it depends on already exists.
