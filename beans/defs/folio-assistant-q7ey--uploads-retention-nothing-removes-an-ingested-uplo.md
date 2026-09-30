---
# folio-assistant-q7ey
title: 'UPLOADS RETENTION: uploads is the archival copy until ingested, then it retires to fsh-guts — rule written, nine to sweep'
status: todo
type: task
priority: normal
created_at: 2026-09-29T23:26:27Z
updated_at: 2026-09-29T23:48:03Z
parent: folio-assistant-2upx
---

Owner, 2026-09-29, in two parts. First, answering *"why are ingested things
still sitting in uploads and not moived to library of appropraite harness?"*:

> no, uploads is archival copy.

then, refining where the archival copy belongs:

> archival (once ingested into KG and put into a proper `library/` under a
> harness repo) then it should be moved to `fsh-guts`.

**Both decisions this bean opened are answered.** The rule is written down in
[`library-ingestion`](../../cat-harness/skills/folio-core/library-ingestion.md)
§"What happens to the upload after it is ingested", with a pointer from
[`fsh-guts`](../../cat-harness/skills/folio-core/fsh-guts.md). What remains is
the sweep and one naming question.

## The rule, as recorded

Three places, and `uploads/` is the only temporary one:

| stage | where |
|---|---|
| queued | `uploads/FILE.pdf` — not yet ingested, what the queue viewer counts |
| derived | `library/<slug>/` |
| archived | `fsh-guts/uploads/FILE.pdf` + a same-basename `.md` sidecar |

A library entry may not hold the bytes and that is enforced, not conventional:
dropping the PDF into a promoted entry makes `check:l1-complete` report
`✗ contents  1 unexpected child(ren): source.pdf`. So the library was never
available as the destination, which is what made the second half of the ruling
necessary.

The sidecar convention needed no invention — `fsh-guts/` already pairs
`extract-lean-blocks.py`, `split-docs-page.py` and
`detangle-schema-viewer.html` each with a same-basename `.md` carrying
`$schema: folio-fsh-guts/v1`, `movedFrom` and `movedOn`.

## What is left

**28 uploads to retire, 47.4 MB, across five harnesses.** Corrected
2026-09-30: the first pass said "nine" and walked `cat-harness/library/` only,
which is 14 of the corpus's entries. Swept across every declared library —
`cat-harness`, `agent-skills`, `smart-base`, `folio-assistant-core`,
`who-iris` — it is 28. The error is worth keeping: a sweep that resolves one
declared directory reports a clean-looking number over four it never opened,
which is `dh4f` one level up. All reversible — a relocate, never an `rm`.

**Five already deleted**, and they are exactly the five whose upload had been
renamed to a descriptive filename (`feng-2023-designing-with-language`,
`neubauer-2025-ai-assisted-schema-creation`,
`dusengumuremyi-2026-ai-mediated-raci`, `gurel-tat-2017-swot-analysis`,
`sammut-bonnici-galea-2015-swot-analysis`). The sessions that renamed also
tidied away, under no rule, because there was none to read. Recoverable from
git history; not restored, because restoring 5 sources is the owner's call
under the same reasoning that makes the rule worth having.

**One naming question.** `fsh-guts/` currently holds `retired/` and
`scripts/`, named for what the thing is. An ingested source is neither, so the
skill proposes `fsh-guts/uploads/` and marks it as not yet ruled on.

**And one the sweep cannot proceed without.** Six of the 28 have a
`<name>.pdf.extraction.json` sitting beside them in `uploads/`
(`2602.12670v4`, `2607.25032v1`, `2608.08453v1`, the two Antigravity pages,
`Skill authoring best practices`, `Skills in OpenAI API`). Either they are
derived artefacts that simply go, or they are part of what is archived and
move with their PDF. Cheap to guess, expensive to undo across 28 files.

## Done when

- [x] Decision 1 — does a library entry carry its source? **No**, and it is
      enforced by `check:l1-complete`'s contents check
- [x] Decision 2 — the retention rule, written into `library-ingestion`
      rather than left to each session's habit
- [x] `deletion-requires-confirmation` restated for this case: never `rm` an
      ingested upload; relocate, which is reversible
- [ ] `fsh-guts/uploads/` confirmed as the sub-directory, or renamed
- [ ] the 28 surviving uploads retired, with a sidecar each
- [ ] what happens to the six `*.pdf.extraction.json` companions
- [ ] the five already-deleted sources restored from git history, or the
      owner rules that they stay gone
- [ ] whether `ingest --promote` should perform the retirement itself, or
      whether it stays a separate deliberate step (an ingest step that moves
      its own input is the shape `deletion-requires-confirmation` is most
      wary of, so this is a real question rather than an obvious yes)
