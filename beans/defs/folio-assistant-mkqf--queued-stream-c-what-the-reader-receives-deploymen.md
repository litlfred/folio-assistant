---
# folio-assistant-mkqf
title: 'QUEUED STREAM C: what the reader receives — deployment topologies and translation (5a3l + bzyu, 20 open beans)'
status: todo
type: task
priority: normal
created_at: 2026-09-22T18:29:28Z
updated_at: 2026-09-22T18:29:28Z
parent: folio-assistant-bzyu
---

## What this is

A **queued** stream: not claimed, not started. One of three queue entries
covering the 49 beans the three-GOAL split parked, created 2026-09-22 when the
owner asked that a finishing stream be handed the next piece of work.

Status is `todo` deliberately — see the sibling entry under `slw1`.

## Scope

Two epics that are one question seen twice — **what the delivered artefact is,
and to whom** (20 open):

| epic | open | |
|---|---|---|
| `5a3l` | 11 | DEPLOYMENT: topologies and operating modes are two axes, not one list of modes |
| `bzyu` | 9 | TRANSLATION: the gettext pipeline, translated renders, and their QA |

`5a3l`: `0hi8` (a local HTTP server that serves a rendering with its declared
media types), `1lfx` (STAGING must report which host rendered it, not assume
gh-pages), `81vy` (the agent must know its UI surface), `2ngl` / `4y2i` / `61tg`
(developer, sovereign-cloud and self-sovereign topologies), `amom` (test/swarm
mode), `6qk5` (QA review mode), `vljz`, `vm6m`, `wp49`.

`bzyu`: `t8g3` (translation support foundation, issue #206), `lrbx` (the
kramdown `{:toc}` placeholder is extracted as translatable prose), `8xx6` (BPMN
re-render for translated labels), `xcyh` (the KG viewer must be translated),
`0hd6` (`translate-bpmn` has no `--check`, and 12 diagrams have no `.pot` at
all), `a98i`, `j1r2` (audio and visual assets carry translatable text), `x3h9`
(**gettext + accessibility are HARNESS CORE, not folio**).

## `5a3l` reads `completed` while carrying 12 open children — do not trust it

**This bean was first parented to `5a3l` and has been moved to `bzyu`.** `5a3l`
is `completed`, and stream 4's `check:bean-rollup` (#962) reports it as its one
live finding — `closed-container-open-subtree`: an epic marked finished with
twelve open children under it. Parenting a `todo` bean there made that finding
worse by one, which is a defect committed by the session that queued the work
the finding is about.

`bzyu` is `in-progress` and is one of this entry's two halves, so it is an
honest parent. It is not a perfect one: this entry's larger half is `5a3l`'s
eleven deployment beans, and they now hang from a translation epic.

**That mismatch is the symptom, not the fix.** The real question — are those
twelve unfinished deployment work, or do they belong under another epic? — is a
judgement about `5a3l`, and re-opening or re-parenting somebody's epic belongs
to its owner. Stream 4 baselined it rather than repairing it for the same
reason. **A session launched against this entry should put that question to the
owner before treating `5a3l` as either done or live**, because the roadmap
currently reads DEPLOYMENT as finished while eleven of its beans are open.

## Why these two belong together

Both answer *"what does a reader actually receive"*, and they collide in three
named places rather than abstractly:

- **`x3h9`** puts the gettext pipeline and accessibility in harness core — a
  deployment-layer claim made from inside the translation epic.
- **`6qk5`** puts translation QA into the audited review record under
  `test/results/` — which is `1swy`'s store, so coordinate with stream 4.
- **`1lfx` and `81vy`** both say the renderer must know *where it is running*;
  a translated render that assumes gh-pages is wrong in the same way an
  untranslated one is.

`0hd6` is the `1xhc` shape again: **12 diagrams have no `.pot` at all** and no
`--check` exists to say so, so the translation gate passes over them in silence.

## Before starting

- Re-measure; these counts are from 2026-09-22.
- PR #229 (staging translation preview) has been open and untouched since
  2026-09-18 and is on this surface. Check whether it is still wanted before
  reviving or closing it — that is the owner's call.
- The three topology beans (`2ngl`, `4y2i`, `61tg`) describe infrastructure the
  owner may or may not intend to build. Confirm scope before designing.

## Done when

- [ ] A session is launched against this entry and moves it to `in-progress`
- [ ] `x3h9` decided: is gettext + accessibility core, and what moves if so
- [ ] `0hd6`: `translate-bpmn --check` exists and the 12 `.pot`-less diagrams
      are each either generated or recorded as deliberately excluded
- [ ] #229 revived or closed on the owner's word
