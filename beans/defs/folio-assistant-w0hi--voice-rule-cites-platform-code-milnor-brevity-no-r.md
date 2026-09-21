---
# folio-assistant-w0hi
title: 'VOICE RULE CITES PLATFORM CODE: milnor-brevity-no-repeats is derived from qa-criteria-registry.ts, not from the paper'
status: todo
type: task
priority: normal
created_at: 2026-09-21T16:55:33Z
updated_at: 2026-09-21T16:55:33Z
parent: folio-assistant-bzyu
---

Surfaced by moving milnor to folio-assistant-sci (bean btuv).

Every other rule in the milnor voice cites the Milnor paper — libraryId milnorlink, with a page. milnor-brevity-no-repeats instead cites kgRef content/pipeline/qa-criteria-registry.ts and quotes the criterion text out of the platform's registry.

So the rule is not derived from the publication the voice declares as its source. It is derived from the QA criterion that checks it, and the criterion is in turn a restatement of the voice — the two point at each other and neither is the source. That is btuv's defect arriving from the opposite direction.

The citation now carries instance: cat-harness and resolves, so nothing is red. That records where the file IS; it does not make the provenance right.

Depends on btuv: if the voice-overlay criteria are derived from the voices rather than hand-written, this kgRef points at a file that no longer contains the quoted text.

## Done when

- the rule cites the Milnor paper if that is where it came from, with a page;
- or it is marked as an asserted house rule rather than a derived one, and says so;
- either way no rule in a voice cites the platform code that checks it.
