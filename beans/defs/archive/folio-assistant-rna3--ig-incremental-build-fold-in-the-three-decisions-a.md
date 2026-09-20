---
# folio-assistant-rna3
title: IG incremental build — fold in the three decisions and list the upstream change requests to the IG Publisher
status: completed
type: task
priority: high
tags:
    - smart-guidelines
    - ig-publisher
created_at: 2026-09-16T16:51:39Z
updated_at: 2026-09-16T16:51:39Z
---

## Brief

**What, and why.** The author answered three of the overview's open decisions and asked
for the upstream list: (1) pin and record the publisher version so a change is detectable
and triggers a rerun; (2) the terminology cache leaves the DAK repository for an
orphan-branch cache in the Lean shape, partitioned so a cone-restricted run pulls only the
terminology its cone needs, with the size risk stated; (3) publisher output stays on
gh-pages, the root `index.html` becomes a rendered Just the Docs page, and eventually the
publisher emits structured `.ts` assets that the docs pipeline renders. And: the specific
change requests to the IG Publisher and validator — Rapido, an "AST output stream", the
warm context — so a discussion with Grahame can start.

**What I already know.** The publisher and validator sources sparse-checked-out earlier
this session (HL7/fhir-ig-publisher master, hapifhir/org.hl7.fhir.core master, 2026-09-16):
Rapido's tracker lives in the tx-cache dir; watch mode rebuilds PublisherFields per
iteration; skip lists exist; the validator has server mode, SessionCache, watch mode;
qa-time-report.json exists; no serialisation of the loaded engine.

**Plan and gate.** Re-read the spots each request touches (Jekyll skip, txCache path
parameter, loadDependencyList edges, TerminologyCache layout, snapshot reuse) so every
row is either "exists — use it" or "ask". Update both proposal documents; add §8 upstream
requests. Gate: gen-docs checks, bun test. Falsifier per row: if the source shows the
capability exists, it is not a request.

**Not doing.** No BPMN change (Task_Site is where the docs pipeline plugs in; the
direction is future), no code.

## Summary of Changes

- `docs/proposals/ig-incremental-build.md`: the three decisions folded in — publisher
  pinned and recorded (§1.2 row, header), the terminology cache as a branch cache of its
  own with per-code-system selective restore and the size risk stated (§5.6), the site
  direction (§5.7: gh-pages now, a Just the Docs landing page next, and longer term the
  publisher as a renderer of `.ts`-authored content whose render the Just the Docs
  pipeline incorporates; the block-to-IG-folder table for assembling the publisher's
  input from `content/<ig>/<ig>.ts`). New §8: the upstream asks, agnostic by rule — A the
  AST (per-resource records, dependency graph, toolchain, what was rendered where), B
  differential builds from an ephemeral runner, C a render-only mode with the Simplifier
  precedent, D the validator as a documented, addressable service — plus §8.1, what
  already exists and should be used rather than asked for.
- `docs/proposals/ig-incremental-build-overview.md`: R1, R2, R9, R11 and §6 (decisions 3
  and 7) updated to match.
- Grounded in source re-read this session: `path-tx-cache` IG parameter; per-system
  `.cache` files with nonce headers and `version.ctl`; snapshot reuse in
  `ContextUtilities.generateSnapshot`; `runTool()` skipping Jekyll in Simplifier mode;
  `loadDependencyList`'s element visitor; `ValidationTimeTracker` per category.
- Issue #192. Follow-ups: none opened — the register rows remain the candidates.
