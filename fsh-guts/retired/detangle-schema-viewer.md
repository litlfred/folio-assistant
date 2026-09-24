---
$schema: folio-fsh-guts/v1
title: "detangle's own schema viewer page — retired"
kind: retired
movedOn: 2026-09-23
movedFrom: "cat-harness/docs/cat-harness/schemas/detangle/index.html"
bean: folio-assistant-byql
summary: >-
  The schema viewer page for the detangle instance, generated while detangle was its own instance
  with its own declared schemas directory. When bean byql folded detangle into cat-harness
  (2026-09-23, #1123), its two schema modules moved into cat-harness/schemas/ and now render on the
  cat-harness schema page. The generator (schema:viz) then pruned this page as an orphan on every
  run, and a sibling session kept restoring it because deleting it was the owner's call. The owner
  ruled, 2026-09-23: move it here. Kept, not deleted, so it is still addressable.
---

# detangle's schema viewer page — retired 2026-09-23

The file beside this note, `detangle-schema-viewer.html`, is the page that used
to be published at `cat-harness/docs/cat-harness/schemas/detangle/index.html`.

**Why it stopped being generated.** It rendered the `schemas` graph of the
`detangle` instance. Bean `byql` folded that instance into cat-harness: its
`detangle.ts` and `detangle-sidecar.ts` now live in `cat-harness/schemas/`,
declared by cat-harness's own `schemas` directory, so they appear on the
cat-harness schema page. No declaration names a `detangle` schemas graph any
more, so `schema:viz` has nothing to render here and prunes the page as an
orphan.

**Why it is here and not deleted.** A generated page nobody asked to remove
was being pruned by one process and restored by another, each correctly
following its own rule. The owner settled it: move it to the kept, unpublished
trashcan, so it stays addressable and neither process fights over it.
