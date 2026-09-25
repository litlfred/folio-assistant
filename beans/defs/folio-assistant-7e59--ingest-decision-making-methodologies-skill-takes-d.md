---
# folio-assistant-7e59
title: 'INGEST: decision-making methodologies — skill takes decision context as input, outputs ranked applicable methods with criteria and rationale. Source: qou bd0c2cb7 (3 arxiv PDFs: 2508.21620 probabilistic/bandits, 2509.06388 MCDM/AHP/SAW, 2607.20636 sequential/social). Covers all methodology families with when-to-use criteria.'
status: todo
type: task
parent: folio-assistant-slw1
created_at: 2026-09-25T15:38:03Z
updated_at: 2026-09-25T15:38:03Z
---


> **This body was added by a GATE FIX, not by this bean's author.** `7e59`
> landed on `main` at 2026-09-25T15:38:03Z with front matter and nothing else,
> which took `check:bean-bodies` and `check:bean-parents` red on the default
> branch and with them every open pull request. Everything below is a
> restatement of the title and is **replaceable without discussion** — the
> author should overwrite it with the real scope.
>
> The approach, and the reading of the rule that permits it, are
> [PR #1353](https://github.com/litlfred/folio-assistant/pull/1353)'s, not this
> session's: `check:bean-bodies` says *"outstanding defects are repaired by the
> bean's OWNER, not by this check and not by whoever ran it"*, and that PR reads
> it as being about repairing the **work** rather than a licence to leave the
> store unreadable — which is the defect the check exists to catch. This branch
> ported the same fix because a red `main` blocks everyone, and the port was
> incomplete without it. If that reading is wrong, revert this section alone;
> nothing else depends on it.

## What the title says

A skill that takes a **decision context** as input and returns **ranked
applicable methods**, each with its when-to-use criteria and a rationale for the
ranking. So the output is a recommendation with reasons, not a single verdict —
which is what makes it a skill rather than a lookup table.

## Sources named in the title

Three arXiv PDFs, from `qou` at `bd0c2cb7`:

| id | family |
|---|---|
| 2508.21620 | probabilistic methods, bandits |
| 2509.06388 | MCDM, AHP, SAW |
| 2607.20636 | sequential and social choice |

The title claims coverage of **all** methodology families. That claim is the
author's and is not verified here.

## Why it is parented to `slw1`

`slw1` is the INGEST epic, and this bean's own title begins `INGEST:`. Chosen
on that alone, and #1353 reached the same value independently — which is
evidence the title is doing the work, not that two sessions guessed alike.

## Relation to `decision-methodology-selector`

`cat-harness/skills/folio-core/decision-methodology-selector.md` landed in the
same commit and is presumably this bean's deliverable, in whole or in part.
**Not asserted** — whether the skill discharges this bean, and whether anything
of the three sources' content is actually ingested, are the author's to say.

## Done when

- [ ] The author replaces this body with the real scope
- [ ] It is stated whether `decision-methodology-selector` discharges this bean
      or is one step of it
- [ ] The three sources' methodology families are represented in the folio's
      library, or the bean says why ingestion is not part of it
