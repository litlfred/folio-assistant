---
# folio-assistant-ot9a
title: 'GATE RED ON MAIN: translate-kg-viewer:check cannot read the declaration, and no workflow runs it'
status: completed
type: bug
priority: high
created_at: 2026-09-20T08:47:02Z
updated_at: 2026-09-20T09:49:42Z
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

---

## Resolved 2026-09-20 — and three of the four Done-whens were already true

**1. The check passes on main, and nobody fixed it on purpose.**
`scripts/translate-kg-viewer.ts` is untouched since the `cat-harness/`
relocation — no `folio-graph-kind` import was added to it. It passes because
`schemas/harness-config.ts` picked that import up, and this script reaches it
transitively. That is exactly the fragility the bean described, now landing in
our favour instead of against us, and `scripts/tests/declared-directory-resolves.test.ts`
(#482) is what stops it drifting back: it imports all 20 modules that call
`directoryForGraph`, each in a FRESH subprocess, and fails if any cannot
resolve. That also settles Done-when #4 — the answer is the class, not this
script.

**2. No wrong-direction edge.** `check:partition:edges` reports **0**. The
repair the bean warned against as a drive-by was never needed, and the
architectural options on #465 are untouched.

**3. The gate is wired** — along with four others nobody was running.

## What the bean did not know: it was one of nine, and then one of five

Measured across `package.json`: **9 of 46** `check:` / `:check` scripts were in
no workflow at all. Six already had reasons — written as a COMMENT in
`code-quality-gates.yml`. The other three (`health:check`, `landing:data:check`,
`landing:sticky:check`) had no reason anywhere, and nothing said so.

**The comment was also wrong.** It excluded `translate-*:check` as needing
*"a translation toolchain not installed on this runner"*. Both run clean on a
bare checkout. That premise kept two working gates out of CI, and because a
comment cannot be compared against anything, nothing could tell a stale reason
from a true one.

Five were genuinely unwired and all five now run:
`translate-kg-viewer:check`, `translate-bpmn:check`, `landing:sticky:check`,
`landing:data:check`, `check:agents-xref` — the last found by the derived
reader, not by the hand count that preceded it.

## Why `unclassifiedSteps` could never have caught this

Its domain is steps found IN WORKFLOWS: *"Steps CI runs that are neither gated
nor exempted."* A check in no workflow is outside that domain by construction,
so the coverage audit was structurally unable to report the thing it exists to
report — the same shape as `04vl`, where the queue's own test was true of what
the queue could see and false of the corpus.

`unrunScripts()` asks the complementary question and `SCRIPT_EXEMPTIONS` holds
the five real exemptions with their reasons, where a test compares them against
the live script list. **The runner is still workflow-derived** and that argument
is not re-litigated: it answers *"what will CI run against my change"*, and only
the workflow knows that. This is a different question, so it gets a different
domain.

Gates: 47 → **52**. Six mutations, each caught by a named test.

## Done when

- [x] `bun run translate-kg-viewer:check` passes on main
- [x] the fix adds no wrong-direction edge — 0 measured
- [x] a workflow runs this gate — and the four others nobody was running
- [x] the class is enumerated rather than this one script
