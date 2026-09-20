---
# folio-assistant-hqku
title: 'SWEEP SCOPE: is library/ active content? The declaration and the owner''s model disagree'
status: completed
type: task
priority: normal
created_at: 2026-09-20T16:15:13Z
updated_at: 2026-09-20T19:24:36Z
parent: folio-assistant-zzmr
---

Raised while implementing *"qa-sweep skips fsh-guts"* / *"qasweep is only on
active/working content, unless explicit otherwise"* (owner, 2026-09-20).

That rule is now enforced from the declaration: a directory whose declared
graphs are all non-`content` is not walked. `fsh-guts` is `holds: "context"`,
so it is skipped with no directory name written down anywhere.

## The disagreement

`library/` declares **`holds: "content"`**, so the new rule WALKS it. But the
owner's own framing in `b5f0` names `library/` as the example of the *static*
KG, against the "Working / active / Dynamic" one:

> "this is a 'Working KG' or active or 'Dynamic'. otherwise it is static KG
> like in library/ (+/- if assets are materialized, KG regenerated from
> sources)"

So by the declaration `library/` is swept, and by the stated model it is the
canonical thing that should not be. One of the two is wrong and it is not
mine to pick.

## Why this is not just a naming quibble

`b5f0` §5 already argued the missing axis is **`derived`**, not `dynamic`, and
this is that argument arriving with a consequence attached:

| | rebuildable? | should a sweep judge it? |
|---|---|---|
| authored (`folio/`) | no | **yes** — it is the corpus |
| derived (`library/`, if regenerated from sources) | yes | probably not: a finding against it is a finding against its generator |
| retired (`fsh-guts/`) | n/a | no — settled, and now enforced |

`holds` cannot express the middle row: `library` and `folio` are both
`content`, and nothing distinguishes "somebody wrote this" from "a script
produced this from something else". The owner's parenthetical — *"+/- if
assets are materialized, KG regenerated from sources"* — is exactly that
distinction, and it has no home in the schema.

## Measured, so the stakes are known

On this instance, the new default changes **nothing**: `walkBlocks` yields
**123** blocks with the skip and **123** without, because `fsh-guts/` holds no
block manifests. The whole question is therefore about future corpora, and
about qou, where `library/` is large.

**Not acted on.** Changing `library`'s declared layer would move it out of the
rendered/derived content story in ways beyond a sweep, and adding a `derived`
layer is a schema change touching every graph kind.

## Done when

- [ ] **owner:** is `library/` active content a sweep should judge, or derived
      material it should skip?
- [ ] if skip: is that a new `derived` layer (`b5f0` §5), or a re-declaration
      of `library` as `context`?

## RULED, owner 2026-09-20: `library/` IS active content, and sweeps judge it

The question was put with the measurement attached — `library` is declared
`holds: "content"`, the same as `catalogue`; who-iris holds three ingested
documents; and `image-verdicts.json` already carries per-image QA verdicts for
two of them, so something was already judging part of it. The owner chose
**active content — sweeps judge it**.

So the declaration and the model no longer disagree, and it is the *model* that
moved: `library/` is not an inert corpus a sweep steps around.

### Why this is the right way for the disagreement to resolve

L1 is what every knowledge-graph citation resolves THROUGH. A sweep that skips
`library/` cannot see the errors that matter most — a missing section, an OCR
page that never landed, an image the manifest claims and the directory does not
have — while reporting a clean run over the corpus every other verdict depends
on. That is the `dh4f` shape aimed at the one graph with the most consumers.

### Two costs, recorded rather than discovered later

- **Sweep runtime grows with the corpus.** Three documents now; the catalogue
  models a repository of 1,057,223 files. Whatever runs over `library/` has to
  be bounded by what is MATERIALIZED, never by what is catalogued — which the
  three-state model already makes checkable.
- **`who-pub-tps-931` is the scanned entry** and will score badly on any
  text-quality axis, because its text is OCR. That is a fact about the
  ingestion, not about the document, and an axis that cannot tell those apart
  will report it as a defect forever. `image-verdicts.json` already judges
  neither half of it, correctly.

### What this does NOT license

Judging the SOURCE. These are other publishers' documents, faithfully
transcribed; an axis that scored WHO's prose would be measuring the wrong
thing and would never be actionable. The axes this ruling opens are about
FIDELITY — is the ingestion complete, are the pages present, does the manifest
match the directory — which is the shape `image-verdicts.json` already has.
