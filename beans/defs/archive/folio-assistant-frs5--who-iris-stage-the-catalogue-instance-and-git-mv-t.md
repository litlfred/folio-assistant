---
# folio-assistant-frs5
title: who-iris/ — stage the catalogue instance, and git mv the three WHO library entries into it
status: completed
type: task
priority: high
created_at: 2026-09-20T08:02:32Z
updated_at: 2026-09-20T08:02:32Z
parent: folio-assistant-kupb
---

Owner, 2026-09-20: two staged top-level dirs, and 'git mv all three now, re-wire consumers in the same PR'.

THE THREE ARE ALL IRIS ITEMS, which is what makes the catalogue the right home rather than a style-guide repo: `wpr-rdo-2020-003-eng`, `who-pub-tps-931`, `9789241548960-eng`. `milnorlink` is NOT, and does not move here — bean `r1lz` sends it to `folio-asst-sci` as the source text for the derived milnor skill.

SIZE, measured in `r1lz` on 2026-09-19: the three WHO documents are 1,339 of 1,402 tracked library files; milnorlink is the remaining 62.

CONSUMERS THAT MOVE WITH THE FILES, the eight `r1lz` lists: `adapters/mcp-server/paths.ts`, `server.ts`, `tools/graph.ts`, `content/docs/document-ingestion`, `content/docs/evidence`, `content/pipeline/gen-block-jsonld.ts`, `gen-library-jsonld.ts`, `graph-index.ts` — plus `scripts/tests/qa-checkers-voice.test.ts`, which names a slug directly.

OCR STAYS. Owner, 2026-09-20: 'keep OCR as platform tool of cat-harness.' The PIPELINE is platform; only the CONTENT moves. `who-pub-tps-931` is the only scanned entry and the only one exercising the OCR path, so what the platform keeps as a fixture is a real question and is deliberately NOT answered by this bean — see the roast.

DO NOT leave `library/` declared and empty in cat-harness. That is the `dh4f` defect exactly: a consumer scans nothing and reports a clean run over it. The declaration moves with the content or it goes.


## Done 2026-09-20

Owner: *"milnor goes in f-a-sci library/, move all 4 and fix fallout"*.

**All four moved, and `cat-harness` now declares no `library` graph at all.**
1,431 files, every one a `git mv`, so history follows each file rather than
showing 1,431 additions and as many deletions.

| | |
|---|---|
| `who-iris/library/` | the three IRIS items — `wpr-rdo-2020-003-eng`, `who-pub-tps-931`, `9789241548960-eng` |
| `folio-assist-sci/library/` | `milnorlink`, in a NEW staged instance (bean `r1lz` named the destination; this made it) |
| `cat-harness/library/` | gone, keep-marker and all |

**The keep-marker had to go too, and finding out why was the useful part.**
`DEFAULT_DIRECTORIES` carries a conventional `library/` entry and is
existence-filtered — so while `cat-harness/library/.gitignore` sat there
holding the directory open, the platform went on resolving a `library` graph
over an emptied directory. That is `dh4f` precisely, and it was invisible until
the resolution was printed.

**`image-verdicts.json` was SPLIT, not moved.** It judged documents that now
live in two libraries. The split is a partition — verified by assertion against
the original: nothing lost, nothing duplicated, nothing invented, every verdict
and every header field byte-identical. `who-pub-tps-931` is judged by neither,
correctly: it is the scanned entry and carries no image verdicts at all. My
first assertion asked whether every DOCUMENT was judged, which is a different
question and not one a split has to answer; it caught that by failing.

**The fallout, which was the real work.**

- 23 tests broke, every one because it had COMPOSED the library path instead of
  reading the declaration. `scripts/tests/library-dirs.ts` now reads it once.
- `.github/workflows/jsonld-gen-check.yml` filtered on `cat-harness/library/**`
  in two places — a workflow that stops firing on the files it gates, reporting
  nothing while it does. Widened to `*/library/**` rather than naming the two
  instances, so a third does not silently fall outside.
- `check:declared-assets` iterated a HARDCODED list of two instances while the
  repository had grown to eight. Its own doc comment described this defect, in
  the past tense, about itself. Now enumerated — and the widening immediately
  found a dead link in `kg-navigation/README.md` that the list had been hiding.
- `ingest-document` is a WRITE target and now REFUSES rather than guessing:
  `--library <name>` is required when several are declared. Its argv parse also
  had to learn that a flag can take a value, or `--library who-iris` would have
  been ingested as a filename.
- `check:l1-complete` reports which library each entry is in, and refuses a
  slug present in two — the committed verdict is keyed on the slug alone.
- `folio-assistant-core/schemas/library-ref.test.ts` got BETTER: the
  cross-instance path it existed to prove was previously exercised only by a
  negative, because everything resolved locally. It is now the real case.

**Not done here, and recorded rather than swept:** the merge with `main` left
`Publication and information products style guide-info.pdf` in BOTH
`cat-harness/uploads/` and the who-iris capture, byte-identical. `main` moved
the root-level uploads (`eq01`) while this branch had already moved that file
into the capture. Reported rather than deleted, per
`deletion-requires-confirmation`.
