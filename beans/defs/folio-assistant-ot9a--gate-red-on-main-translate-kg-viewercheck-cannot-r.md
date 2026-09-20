---
# folio-assistant-ot9a
title: 'GATE RED ON MAIN: translate-kg-viewer:check cannot read the declaration, and no workflow runs it'
status: todo
type: bug
priority: high
created_at: 2026-09-20T08:47:02Z
updated_at: 2026-09-20T08:47:23Z
parent: folio-assistant-1xhc
---

## Measured 2026-09-20, on `main` at `204862c`

`bun run translate-kg-viewer:check` **fails**, and it fails on `main` rather
than on any branch:

```
error: cat-harness/harness.json: directory "folio" declares unknown graph kind
"folio". Known kinds: tools, cat-harness, schemas, qa, health, beans, ...
  at readDeclaration (schemas/cat-harness.ts:1627)
  at resolveDirectories (schemas/cat-harness.ts:1752)
  at directoryForGraph (schemas/cat-harness.ts:2124)
```

Two separate facts, and the second is why nobody noticed:

1. **It is the latent `folio` graph-kind class**, the one `mggs` recorded across
   52 modules. `folio` is registered by a load-time side effect in core
   (`schemas/folio-graph-kind.ts`), and this module does not import it, so
   `readDeclaration` throws on the very declaration the repository now carries.
   Nothing had ever DECLARED a folio graph before #465, so nothing had ever
   needed the registration to have happened.
2. **`translate-kg-viewer` is in NO workflow.** `grep -rn translate-kg-viewer
   .github/workflows/` returns nothing. So CI is green while a package gate is
   red — which is bean `xom7`'s shape exactly: *"a red workflow looks exactly
   like a green one from in here"*, one level down. A gate no workflow runs is
   not a safety net.

## Why the one-line fix is NOT available, which is the interesting part

The obvious repair is the import `ensure-landing-sticky.ts` already carries:

```ts
import "../schemas/folio-graph-kind.js";
```

`repo-partition.ts` classifies `scripts/translate-kg-viewer.ts` as
**agentic-harness** (line 642) and `schemas/folio-graph-kind.ts` as
**folio-assist-core**. So that import is a **wrong-direction edge** — the
harness reaching up into core — and `check:partition:edges` would report it.

That is not a reason to leave the gate red. It is evidence about the open
architectural decision, and better evidence than the latent count was:

> `gk55`, which re-sited the kind into core, wrote its own falsifier:
> *"if the harness still has to know the string `folio` anywhere for the
> declaration to validate, the re-siting is cosmetic."*

What is measured here is adjacent and worse. The harness does not merely need
to know the string — **a harness module cannot read the instance's own
declaration at all** without importing core. Every harness script that calls
`readDeclaration` on a repository containing a folio graph is in this position.
`gk55` is `completed`; this is the cost that showed up afterwards.

## Done when

- [ ] `bun run translate-kg-viewer:check` passes on `main`
- [ ] the fix does not add a wrong-direction edge — or the decision to accept
      one is taken deliberately, by the owner, rather than absorbed in a repair
- [ ] a workflow runs this gate, or it is deliberately dropped with a reason.
      A gate in `package.json` that no workflow invokes is the state this bean
      is about, and fixing the error without fixing that leaves the next
      regression equally invisible
- [ ] the other harness modules calling `readDeclaration` are enumerated, so
      the answer is the class rather than this one script

## NOT to be done as a drive-by

Adding the import and pushing. It turns one silent failure into one silent
wrong-direction edge, and the owner has an open decision on exactly this —
four options, on PR #465. Recording the measurement is the contribution; the
choice is not the agent's.
