---
# folio-assistant-9wb0
title: 'PUBLICATION IS A STATE, NOT A BOOLEAN: every asset carries id + version and sits in draft; formal publication is an undefined process'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-23T21:29:44Z
updated_at: 2026-09-23T21:30:16Z
parent: folio-assistant-vke6
---

Owner ruling, 2026-09-23: *"all assets get a version and are in 'draft' publication. formal publication process needs to be deinfed/neeeds tools/depends on instance"*.

Corrects §3.1 as `snjh` shipped it. Not a gap in that work — a different model.

## What §3.1 got wrong, precisely

It models `publishable?: boolean` with three states, and REFUSES id and version unless `publishable: true`:

    refused while `publishable` is undeclared — a declared `version` reads as
    a published identity, and nobody has said this instance is published

The owner's ruling inverts exactly that. Every asset HAS a version, so the refusal is wrong. And the axis is not publishable-yes-no: **draft is a state everything is already in**, not an absence of decision. That is why `check:publishable` reported all 17 instances `undecided` — the model had no way to say the true thing, so a fully-decided corpus rendered as a worklist of 17.

## The rulings, all owner's, 2026-09-23

| question | ruling |
|---|---|
| does every asset get a version | **yes** |
| does every asset get an id too | **yes — both universal** |
| how unreachable is `published` | **the schema refuses it outright** until the process exists |
| id namespace | **`io.github.litlfred.folio-assistant.<name>` for all 17** |

## Why `published` is refused rather than merely reported

*"needs to be deinfed/neeeds tools/depends on instance"*. A flag nothing can verify is precisely the ceremony §3.1 was written against; accepting `published` today would rebuild that defect one name over. The falsifier for this whole change: **if `published` ends up settable by hand before any tool exists, it is wrong.**

## Why OUR id rather than WHO's, for the smart-* instances

`smart-trust` here is not the WHO IG — it is our reconstructed index ABOUT that IG. The real ids exist upstream and are already held as DATA: `chrome.json` (ingested 2026-09-23 at commit 26635f7b) records `id: smart.who.int.trust`.

Giving our instance WHO's id would claim our mirror IS the thing it mirrors. The same reading applies to `smart-base`'s declared `canonicalUrl: http://smart.who.int/base`, whose own comment already says it is *"a fact about smart-base and not a decision about where this staging directory publishes"* — so canonicalUrl records the SUBJECT and must not drive our identity.

One mechanical rule covers all 17: reverse the host, append the path. It is the same rule that yields `smart.who.int.base` from `smart.who.int/base`, so it follows FHIR's convention rather than inventing one.

## Blast radius, measured not guessed

95 `publishable` references across 20 files: `schemas/cat-harness.ts` (field, docblock, superRefine), `check-publishable.ts", `version-bump.ts`, `depends-on.ts`, `check-published-refs.ts`, `kg-export.ts`, `vocabulary.ts`, `instance-versioning.test.ts`, and the proposal itself.

## Done when

- [ ] `publication` is a state, defaulting to draft, with `published` refused by the schema
- [ ] `id` and `version" are universal — required on every declaration, not gated
- [ ] all 17 instances carry an id under the ruled namespace and a version
- [ ] `check:publishable` reports the draft corpus rather than a 17-item worklist
- [ ] the proposal's §3.1 and §6 Q1 updated — Q1 is ANSWERED by this ruling
- [ ] gates green
