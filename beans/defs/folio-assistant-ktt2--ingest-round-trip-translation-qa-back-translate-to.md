---
# folio-assistant-ktt2
title: 'INGEST: round-trip translation QA — back-translate to catch semantic drift and bad terminology'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T17:12:55Z
parent: folio-assistant-slw1
---

## What

Back-translate each localized narrative into its source language and compare
meaning with the original. Flag semantic mismatch and bad terminology.

## Why a round trip rather than a forward check

A forward-only check asks "is this fluent target-language text?" — which a
confident mistranslation passes. The round trip asks whether the MEANING
survived, which is the property actually wanted, and it needs no reference
translation to work.

## What it cannot do

It can establish that two readings differ. **Which one is right is a human
call** — the diagram routes a flagged passage to a reviewer rather than
auto-correcting it.

## Done when

The round trip runs over every localized narrative in the completeness gate,
mismatches become reviewer-adjudicated findings, and a terminology miss is
distinguishable in the output from a general semantic drift.

Diagram: `processes/ingest-l1-completeness-gate.bpmn`, `Task_RoundTrip`.

## 2026-09-19T17:15Z — already answered, and better than this bean asked for

**No code written, deliberately.** Checked before building, and the substance of
this bean is already implemented in `content/pipeline/translation-block-qa.ts`
— in the one form that is honest.

### The round trip is DECLARED and deliberately has no entry

Verified in the output, not taken from the docstring: the criterion
`translation-semantic-roundtrip` exists in the sidecar shape with an **empty
entry list**, and `translation-block-qa.test.ts` proves an agent-supplied
verdict merges into it when one exists. So the slot is real, visibly empty, and
ready — rather than absent, which would read as "nobody thought of it".

The reasoning, already recorded there and better than this bean's framing:

> The only back-translation available offline is reversing the PO's own
> msgid→msgstr map, which returns the source **exactly, always** — a similarity
> of 1.0 that measures the lookup table, not the translation. A score computed
> that way would be a verdict with a script's name on it and no content, which
> is worse than the gap: a reader who sees a green round-trip stops asking.

That is this bean's "Why a round trip rather than a forward check" carried one
step further: a round trip with a *dependent* translator is not a round trip.

### "A terminology miss distinguishable from semantic drift" — already true

`translation-terms-preserved` is a **separate criterion** from the semantic one,
covering acronyms, numbers and URLs that must survive. So the distinction this
bean asks for exists structurally, not as a note in a report.

### Why "Done when" cannot be satisfied today, with numbers

1. **Zero narratives exist.** Every `narrative` record in `library/` is
   `not-authored` (`ju0u`), so there are no localized narratives to round-trip.
2. **Zero translated blocks.** `bun run translation:block-qa` reports
   **`Wrote 0 sidecar(s); 609 (block, locale) pair(s) have no translation`** —
   even the three deterministic criteria have nothing to run over.
3. **No independent translator.** Point 3 is the one that does not go away when
   content arrives, and it is the same class of blocker as `68dt`: a capability
   this environment lacks, for a service rather than a package.

### Blocked

- **waits on**: an independent back-translator — a model or MT service that has
  not seen the source. Plus content to run it over (`d5f1` / `1r0p` produce the
  localized narratives; both carried a block against `68dt`, and as of
  2026-09-22 each is **not blocked on `68dt`** because it completed).
- **since**: 2026-09-19.
- **expires**: 2026-10-19. Re-measure rather than trusting this.
- **handoff**: **do not build a PO-reversal round trip to close this.** It
  returns 1.0 always and would make the gap invisible, which is the one outcome
  worse than the gap. If a translator becomes available, the slot is already
  there — supply agent entries for `translation-semantic-roundtrip`; no schema
  change is needed.
