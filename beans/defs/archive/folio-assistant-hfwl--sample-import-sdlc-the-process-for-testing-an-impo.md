---
# folio-assistant-hfwl
title: 'SAMPLE-IMPORT SDLC: the process for testing an import into a KG, with size, retention, source-loss and copyright as first-class gates'
status: completed
type: task
priority: high
created_at: 2026-09-20T08:02:10Z
updated_at: 2026-09-23T19:24:02Z
parent: folio-assistant-kupb
---

Owner: 'this is also a SDLC process to be developed for testing a sample import into a KG (or generally structued data store), issues of data size, retention - what happens if data srouce goes away, copyright. bpmn and skills strawperson please.'

GENERAL, NOT WHO-SPECIFIC. The subject is 'a sample import into a structured data store'; IRIS is the worked instance. So the BPMN and the skill are cat-harness nodes and `who-iris/` is what they are exercised on.

FOUR GATES THE CURRENT INGESTION HAS NONE OF, each of which is a real decision somebody makes and none of which is answerable from a file:
- SIZE. 361.55 GB is the measured reason this import is by reference. A gate asks what fraction is being taken and what the whole would cost, and REFUSES when it cannot tell — the `check-corpus-gate` shape.
- RETENTION. How long the materialised copy is kept and what expires it. A copy with no expiry cannot be told from an abandoned one, which is exactly the argument `bean-blocking` already makes about blocks.
- SOURCE LOSS. What survives if `iris.who.int` goes away. This is not hypothetical here: the legacy `iris.wpro.who.int` host in the measured record is ALREADY a merged-away instance, so one of the two URIs on the one item we have is evidence of the failure mode.
- COPYRIGHT. What the licence permits, per bitstream, and whether it permits the derived work. `LICENSE-CONTENT.md` exists in this repo and the import does not read it.

## Done when
- `processes/sample-import.bpmn` with a lane per actor and the four gates as real gateways, not documentation.
- A strawperson skill naming what each gate REFUSES on, since a gate that only warns is a gate nobody fails.
- Rendered via `render:bpmn`, and `render:bpmn:check` green.

---

## Summary of Changes — 2026-09-23

Built together with `hpax`, at the owner's pick ("hfwl + hpax").

- [x] **`processes/sample-import.bpmn`** — three lanes (contributor, ingestion engine, corpus). Two entries: a proposed sample, and an upstream change to a permanent one.
- [x] **The gates are real, and they are CALLED.** `hpax` requires one copy of the gates, which conflicted with this bean's "the four gates as real gateways" wording. The owner was asked. The answer ("if sample-import is not intended to be permanent, materialise to fsh-guts") kept the gates as a call to `materialize-remote`, whose own gateway refuses on any unanswered gate. This process's gateways act on its outcome (`Materialized?`), then on the owner's new question (`Meant to be permanent?`), then on its own test (`Every check passed?`, whose `no` branch includes *could not run*).
- [x] **Strawperson skill** `skills/content-lifecycle/sample-import.md`. What each gate REFUSES on stays in `materialize-remote`, one copy. This skill covers scope, destination (library vs the kept trashcan), the four import checks, and what is recorded on every path.
- [x] Rendered; `render:bpmn:check` green. The diagram is indexed on the publication-workflow page and has translation templates.

**Owner's destination rule, as built:** a permanent sample lands in `library/` and is refreshed; a trial lands in `fsh-guts/`, kept and unpublished, and is never refreshed. Its provenance is the bean or issue, never an invented `movedFrom`. Exported identifiers do not spell the trashcan's name, because `fsh-guts-unpublished.test.ts` forbids it anywhere in the published export.
