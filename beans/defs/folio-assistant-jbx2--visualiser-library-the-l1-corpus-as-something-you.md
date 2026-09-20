---
# folio-assistant-jbx2
title: 'VISUALISER: library/ — the L1 corpus as something you can look at'
status: todo
type: task
created_at: 2026-09-20T14:01:05Z
updated_at: 2026-09-20T14:01:05Z
parent: folio-assistant-yj32
---


Owner, 2026-09-20: *"we also need library/ harness visualation"*, and
*"bean up to do: library/ visualaiont. the fsh-gts/ has visualion beaned up
already/in-progress."*

## Why this one first among the missing viewers

`library/` is L1 — every knowledge-graph reference to a source resolves THROUGH
it, never to a loose path or a bare URL. So it is the subgraph whose contents
most consumers depend on, and the one nobody can currently look at. Its sibling
`uploads/` is the queue feeding it, and the two are deliberately separate
declarations precisely because a source sitting in `uploads/` "reads as absent
to every consumer while the file is on disk" — a distinction a viewer should
make visible rather than leave to prose.

## What it has to show, from what is actually there

A `library/<bib-slug>/` holds `sections/*.md`, `structure.json`, and — where the
source was scanned — `ocr/page-NNN.txt`. So the honest view is per slug:

- what the source IS (title, the declaration that named it),
- how far ingestion got (sections? structure? OCR, or none because it was never
  scanned — which is a third state, not a failure),
- what REFERENCES it, since resolving through `library/` is the whole point,
- and what is in `uploads/` that has NOT become a slug yet, which is the queue
  the corpus checklist cannot see.

## Related, deliberately not merged into this

`fsh-guts/` already has a visualisation beaned and in progress — a different
subgraph with a different shape (the trashcan, where `movedFrom` is the field
that earns its keep). Sharing a renderer between them is a decision for whoever
builds the second one, not an assumption for the first.

## Done when

- [ ] `library/` renders per slug, with ingestion state as THREE states rather
      than a tick or a cross.
- [ ] `uploads/` entries that have not become slugs are visible as such.
- [ ] It resolves at least one real reference through a slug, so the "everything
      resolves through here" property is demonstrated rather than asserted.

## A quick upload+process action, on THIS visualiser — owner, 2026-09-20

> bean up also to add a quick upload+process icon/funciton in libary/
> visualtion to start doc ingest

So the `library/` visualiser is **not read-only**: it carries an affordance
that takes a file and starts document ingest in one action, from the place a
person is already looking at the corpus.

**Why it belongs here rather than only on `v1hw`.** `v1hw` is the `uploads/`
visualiser — the QUEUE, and its own upload path. This is the same capability
reached from the other end: somebody looking at the L1 corpus notices a gap
and wants the document in it, without first learning that `uploads/` exists as
a staging area. The queue is an implementation detail from this view.

**Two things that follow, and neither is cosmetic:**

1. **It must not become a second ingest path.** "Upload + process" starts the
   SAME pipeline `slw1` defines; if it grows its own shortcut, a document
   ingested from here and one ingested from the queue end up different, and
   the difference is invisible afterwards. It is a trigger, not a pipeline.
2. **It shares the write mechanism with `v1hw`**, so it inherits the same
   unanswered question from `yj32`: git is confirmed as the store, and which
   write path — forge API, local server, or a commit from a checkout — is the
   owner's call. Two visualisers must not answer it twice.

The ingest it starts is also what makes the uningested badge on `v1hw` tick
down, which is the other reason these two are one design: the action here
changes the number there.

## Coordination note, 2026-09-20 — NOT a claim

Left by the session that built `who-iris/docs/` (PR #584). This bean stays
`todo` and unclaimed: the owner said *"library is another agent"*, so the note
is here to save that agent a discovery, not to reserve the work.

**Two things already exist that this viewer should consume rather than rebuild.**

### 1. Where it mounts is already decided and already wired

Owner's addressing rule, same session: `<base-url>/<path-to-kind-or-node>`,
worked example `<base-url>/library/who-iris`. That is implemented in
`cat-harness/scripts/mount-instance-docs.ts` and runs in both `docs-site.yml`
and `feature-staging.yml`.

**So this viewer needs no deployment work.** Emit into a directory the instance
declares with the `library` graph, give it an `index.html` at that directory's
root, and it appears at `/library/<instance>/`. The `index.html` is the actual
trigger — the mount floor is "has a front door", which is what distinguishes a
built visualiser from a directory of source files served under a URL promising
one. An earlier floor of "any .html beneath" mounted `who-iris/uploads/`,
because the IRIS capture contains a saved DSpace page.

Collisions are resolved and will refuse loudly: walk from the root, outermost
handler wins, walk stops, losing claim reported with its owner and a non-zero
exit. `resolve_` in that file, 8 tests in
`cat-harness/scripts/tests/mount-instance-docs.test.ts`.

### 2. The themes exist — owner: *"libray/ vislaused needs to pick up themes"*

`who-iris/themes/themes.ts` (bean `j66n`) exports `WHO_THEMES` and
`whoThemeById`, resolved through the platform's `resolveTheme`. Two of them:

| id | kind | use |
|---|---|---|
| `iris-web` | `webpage` | the screen theme, read off the captured DSpace stylesheet |
| `who-wpro-publication` | `publication` | print geometry, read off the style guide's pages 6/7/12/14/18 |

`iris-web` is the one a library viewer wants. Palette roles are
`surface / ink / edge / accent`; geometry is `laptop / mobile / card`. Take the
values from the theme rather than the CSS — `gen-iris-pages.ts` shows the
pattern, emitting them as `--iris-*` custom properties named after the ROLES.

**Do not eyedropper the screenshots.** `accent` is `--primary: #008dc9` and NOT
the more brand-looking `--blue: #2B4E72`; that distinction is tested, and it is
the hardcoding `schemas/theme.ts` exists to end.

### 3. One thing to know before trusting `materialization`

Bean `yl5w`: every `localPath` in `who-iris/catalogue/nodes/` points at
`who-iris/uploads/<name>.pdf` and **all three are missing** — the bytes are in
`cat-harness/uploads/`. `check:catalogue` does not verify `localPath`, so it
reports a clean run over three `materialized` claims that resolve to nothing. A
library viewer that resolves bytes by `localPath` will render three broken
links and no error.
