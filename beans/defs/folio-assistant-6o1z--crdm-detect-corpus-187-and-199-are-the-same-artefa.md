---
# folio-assistant-6o1z
title: 'crdm-detect corpus: #187 and #199 are the same artefact, labelled opposite'
status: completed
type: task
priority: high
created_at: 2026-09-21T16:40:00Z
updated_at: 2026-09-21T16:40:00Z
parent: folio-assistant-ahvw
blocking:
    - folio-assistant-vjbl
---

**A specific, checkable contradiction in the eval corpus — not a judgement call
about intent.** `vjbl` already names #187 as a hard case *"turning on intent
rather than wording"*. Measured while working `9gtc`, it is sharper than that:

| issue | label | what it is |
|---|---|---|
| [#187](https://github.com/litlfred/folio-assistant/issues/187) | `isFeature: false` — *"a documentation deliverable ABOUT features"* | the ASK: *"write up a document that outlines fully the requested changes, why, and where we use them in the review and publish pipeline"* |
| [#199](https://github.com/litlfred/folio-assistant/issues/199) | `isFeature: true` — *"the set of platform changes requested"* | **that document**, delivered: *"This page is the map: what changes, why, and at which stage of the review and publish pipeline each change runs."* |

**One artefact, two sides, opposite labels.** Either asking for the change
register and producing it are both feature work, or neither is. The corpus
currently says both.

## Why it matters mechanically, not just tidily

Every phrase signal that catches #199 catches #187, because they describe the
same content. `9gtc` measured it: `/\bproposal\b/i` unanchored catches #199
(and #205) and **costs #187**; `/^proposal:/im` catches the same two and costs
nothing. The anchor works only because one document *declares itself* a
proposal and the other *mentions* one — a structural distinction that survives
whichever way the labels are resolved.

So the current patterns do not depend on this being fixed. What depends on it
is whether **precision 86% is 86%**: if #187 is relabelled a feature, the
population changes under every number `xfoh` and `9gtc` reported.

## Done when

- [x] An annotator who has NOT read `xfoh`, `9gtc` or this bean decides both
      labels — together, since the contradiction is that they disagree.
- [x] If either flips, `bun run eval:crdm-detect` is re-run and the movement
      recorded. The committed test run's DATA hash changes, which is the
      mechanism that makes this visible rather than a silent re-baseline.
- [x] `vjbl`'s hard-case list updated: #187 is no longer "turns on intent", it
      is "contradicts #199".

## Who may do it

**Not `session_01AYHimvYMmf8h8e9fFN6dW5`**, which recorded its own
disqualification on `vjbl` and has since read both texts in full. Left
unclaimed on purpose. The owner, or a session that has read neither sibling.

*Found 2026-09-21 while working `9gtc` (PR #732, merged). Recorded rather than
acted on — and note that this bean is itself contaminating: reading it gives
away two labels. `vjbl` already carries that defect and this is one more
instance of it.*

## Summary of Changes

**Decided by the owner, 2026-09-24: keep the split.** The owner qualifies as the annotator this bean asked for. The session that carried the question had read this bean, so it put the options neutrally and recommended none.

Rule: label **the action asked of the agent, not the subject matter**. #187 asks for a document (`isFeature: false`); #199 *is* the eleven requested platform changes (`isFeature: true`). The two describe the same content but differ on exactly what the label measures, so there is no contradiction left to resolve.

- Corpus: both `why` lines now state the convention and cite this decision. **No label flipped.**
- `bun run eval:crdm-detect` re-run: precision 86%, recall 100%, F1 93% over 27, unchanged. The committed test run was refreshed. Its DATA hash moved for the `why` text, and its PROCESS basis had been stale since the skill moved from `methodologies/crdm/` to `skills/crdm/`.
- `vjbl`: dated note added — #187 is no longer "turns on intent" or "contradicts #199"; the convention is named for a second annotator to accept or dispute.
