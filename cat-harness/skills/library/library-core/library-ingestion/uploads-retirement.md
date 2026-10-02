---
part-of: library-ingestion
description: >
  Detail for `library-ingestion`, split out of it so the parent stays a short
  entry point (placement PR6, bean `apcg`). NOT a skill of its own — reached
  through the parent. What happens to an upload once it is ingested, the
  2026-09-30 sweep and the check that replaced it, and why a rename comes first.
---

# library-ingestion — retiring an ingested upload

## What happens to the upload after it is ingested — it is RETIRED, not left and not deleted

**Owner's ruling, 2026-09-29**, in two parts. First, answering *"why are
ingested things still sitting in uploads and not moived to library of
appropraite harness?"*:

> **no, uploads is archival copy.**

and then, refining where that archival copy belongs:

> **archival (once ingested into KG and put into a proper `library/` under a
> harness repo) then it should be moved to `fsh-guts`.**

So the lifecycle has **three** places, not two, and `uploads/` is the only one
that is temporary:

| stage | where | what it holds |
|---|---|---|
| queued | `uploads/FILE.pdf` | the source, **not yet ingested** — this is what the queue viewer counts |
| derived | `library/<slug>/` | `sections/`, `blocks/`, `images/`, `structure.json`, the manifest |
| archived | `fsh-guts/uploads/FILE.pdf` + its sidecar | the **source bytes**, kept and addressable, off the rendered site |

### Why the library cannot be the destination

A library entry may not hold the bytes, and that is enforced rather than
conventional. `ENTRY_DIRECTORIES` is `sections`, `blocks`, `images`, `ocr`;
`ENTRY_SIDECARS` is `images.json`, `vector-labels.json`, `manifest.jsonld`,
`summaries.json`, plus the one kind marker. Dropping the PDF into a promoted
entry makes `check:l1-complete` report it — measured 2026-09-29:

```
✗ contents   1 unexpected child(ren): source.pdf
```

The entry records `source_sha256` and the technical metadata, which is what
lets a re-derivation be checked against the original. It does not record the
original. So "move it to the library" is not available, and the source needs
somewhere else to live — which is what the second half of the ruling settles.

### `fsh-guts/` is that somewhere, and it already has the contract

[`fsh-guts`](../../../kg/kg-core/fsh-guts.md) is *"the trashcan that is kept"*: addressable,
exported, greppable, and deliberately absent from the canonical render.
**Delete means relocate**, and this is that rule applied to a source whose
derivation has landed.

A PDF cannot carry front matter, and the directory already answers that —
`extract-lean-blocks.py`, `split-docs-page.py`, `detangle-schema-viewer.html`
each keep their bytes beside a same-basename `.md` sidecar that declares them.
An archived upload follows the same convention:

```yaml
---
$schema: folio-fsh-guts/v1
title: "wang-rangaiah-2026-mcdm-aggregation.pdf"
kind: source
movedOn: 2026-09-29
movedFrom: "uploads/wang-rangaiah-2026-mcdm-aggregation.pdf"
summary: >-
  Ingested to `cat-harness/library/wang-rangaiah-2026-mcdm-aggregation/`;
  cited by `methodologies/mcdm-aggregation.md`. Archived here after promotion.
---
```

`movedFrom` and `movedOn` are the load-bearing pair, for the reason `fsh-guts`
gives: without them a node there is an orphan, and *"abandonment or accident"*
becomes indistinguishable.

**`fsh-guts/uploads/` is the sub-directory this proposes** — the existing two
are `retired/` and `scripts/`, named for what the thing is, and an ingested
source is neither. Not yet ruled on.

### What this makes true, and what it costs

`uploads/` becomes what its viewer already says it is. `gen-uploads-viz.ts`'s
`itemState` returns `waiting` or `ingested`, and the headline is the
UNINGESTED count because that is the one that means work is owed — under this
rule `ingested` becomes a **transient** state rather than a resting place, and
an upload sitting in it is a retirement nobody has done yet.

**Never `rm`.** An ingested upload is not cleanup: deleting it removes the only
copy of the source from the working tree, leaving git history, which is not the
same thing — every derived artefact in `library/` becomes unreproducible from a
checkout. `deletion-requires-confirmation` governs any exception, and an ingest
step that removed its own input would be the `plj1` shape exactly.

### Swept 2026-09-30 — and the sweep is now `check:uploads-retired`, not a habit

`fsh-guts/uploads/` is the sub-directory. An ingested source's
`*.pdf.extraction.json` companion moves with it, being a derived artefact of
the same ingest rather than a queue item.

**The hand sweep that first implemented this rule got four things wrong, in
one commit, and each was invisible from its own output.** They are recorded
here in full because they are one defect wearing four faces, and because the
third and fourth were found only after the first two had been "corrected":

| # | what it reported | what was true |
|---|---|---|
| 1 | **nine** sources to retire | **28**, across five harnesses — it had resolved `cat-harness/library/` alone, 14 of the corpus's entries |
| 2 | **five sources RESTORED** from `4b10661cdde` after an earlier session deleted them | **none had been deleted.** All five were at `cat-harness/uploads/` continuously and are in that commit at that path. The sweep `git show`-ed a second copy of each into the archive |
| 3 | 28 relocated | three of them were **copied, not moved** — the original stayed in `uploads/` |
| 4 | who-iris among the five harnesses swept | **three ingested sources still in its queue** — that queue keeps a DIRECTORY per source, and the sweep listed only the top level |

Eight files in two places, and a recovery claim with nothing recovered.

**The common cause is one sentence: an answer computed over less than the
corpus looks exactly like an answer over all of it.** (2) is the sharpest
case — the five were *absent from `uploads/`* because they had been RENAMED
into `cat-harness/uploads/`, and "absent from the one directory I looked in"
was read as "deleted from the repository".

**And correcting (1)'s number did not prevent (2), (3) or (4).** The count was
re-derived across five libraries; the deleted-or-not determination, the
move-or-copy, and the per-harness enumeration each kept the original method.
That is the argument for the check rather than for a more careful sweep:

```sh
bun run check:uploads-retired
```

It matches on **sha256 against every declared library's recorded
`source_sha256`**, never on filename — `2509.06388v1.pdf` is archived as
`wang-rangaiah-2026-mcdm-aggregation.pdf`, and a name comparison would have
called that unarchived and minted a ninth duplicate. Two families:

- **blocking** — an already-ingested **bare drop** in a queue. The remedy is a
  `git mv` plus a sidecar, or a `git rm` when identical bytes are already
  archived. Those two are distinguished, because conflating them is exactly
  how eight files ended up in two places.
- **advisory** — an already-ingested file inside a **per-source intake
  directory** (`who-iris/uploads/<slug>/` holds the PDF beside an
  `intake.json` and an `iris-capture/`). Moving the PDF alone would leave that
  record naming a file that is not there, so whether such a source retires as
  a file or as a directory is a who-iris layout decision. Reported on every
  run with its count; **not** exempted, because a family that goes quiet is a
  family nobody revisits.

It refuses rather than passing when no library records a `source_sha256` — the
first version of it resolved libraries from the repository root, got **zero**,
and printed a green line over 15 files. `dh4f`, inside the check written to
stop `dh4f`. The repository root is not an instance that declares a library;
`cat-harness` is, and the root declares the `uploads/` that `cat-harness` does
not — so both roots are asked and neither alone is the corpus.

It reports and never moves anything: `deletion-requires-confirmation`.

**State after the correction, 2026-09-30:**

| | |
|---|---:|
| sources archived in `fsh-guts/uploads/` | **41** |
| duplicates removed from queues (identical bytes already archived) | 8 |
| retired late, missed by the sweep | 1 (`milnorlink.pdf`, ingested to `folio-assistant-sci`) |
| still queued, none of them ingested | 32 |
| advisory, inside a who-iris intake directory | 3 |

`milnorlink.pdf` is the cleanest statement of the whole class: it was ingested
to `folio-assistant-sci/library/`, so a sweep matching against
`cat-harness/library/` found no match and read it as still queued. Nobody was
careless; the method could not see it.

### Renaming an upload is done BEFORE the first ingest

The slug is derived from the upload: `_pdf_doc_id.py` reads an arXiv id off
page one's text layer and falls back to the basename slug. A source with no
arXiv stamp is therefore named by hand first, to the author-year convention —
`gurel-tat-2017-swot-analysis`, `wang-rangaiah-2026-mcdm-aggregation` — and the
slug follows. Renaming afterwards means re-ingesting under the new name and
removing the old entry, which is why it is worth getting right on the way in.
