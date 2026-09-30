The owner's deck *KG / folio-asst* (2026-09-30), rebuilt as a page. The page
is generated from the content and assets it describes, so it moves when they
move. The original is kept, frozen and dated, as the L1 source
`cat-harness/library/kg-folio-asst-2026-09-30`: thirteen slides, their speaker notes and all 33 images with
descriptions.

**Two differences from the original, both deliberate:**

- **The words are text.** Most of the original's content was baked into
  pictures, which search, translation and screen readers cannot reach. Every
  word below was read off those images and written out. Pictures remain only
  where the repository **generates** them (the BPMN process, the UML model, the
  theme art), so a picture here cannot be older than its source.
- **Each slide is checked against the knowledge graph.** Under every slide,
  **Sources** names the KG nodes it depends on. A **Misaligned** note says where
  the snapshot and today's KG disagree, and which one is right. The last
  section lists them all.

**Format.** One slide is one `##` section of plain Markdown. That is Pandoc's
slide-level convention, so this same page can be converted to reveal.js,
Beamer or PPTX by Pandoc if a file is ever needed. No second source is kept.
Metadata follows schema.org `PresentationDigitalDocument`.
