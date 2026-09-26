---
# folio-assistant-q6ud
title: 'DEGRADATION ENFORCED: join a skill''s declared strategy to the capability probes'
status: completed
type: task
created_at: 2026-09-20T10:32:42Z
updated_at: 2026-09-20T10:32:42Z
parent: folio-assistant-ahvw
---

Owner: *"4 options?"* → *"b1"* — **enforce it at runtime**, rather than
report it, surface it in docs, or retire it.

## What was inert

24 skill modules declared `requiredCapabilities` with a `degradation`
strategy each — 17 `fail`, 6 `fallback`, 1 `warn`. **Read by nothing.** The
only consumer was `scripts/generate-docs.ts`, never invoked in any commit
since the root commit, retired to `fsh-guts/` on 2026-09-20 (`3w0i`). So
the count of readers was zero.

`src/tools/capabilities.ts` already executed the PROBES. What was missing
was the join: a probe nobody consults tells you a tool is absent and not
what follows from that.

## `src/tools/degradation.ts`

Four verdicts, because "ran with less" and "did not run" are the
distinction the whole model exists to make:

| strategy | verdict when absent |
|---|---|
| `fail` | `blocked` |
| `fallback` | `degraded` if the capability's `fallbackTo` is present, or a human lane takes over; else `blocked` |
| `warn` | `degraded` — runs, absence named |
| `skip` | `partial` — that requirement is dropped, the skill still runs |

A skill's state is the **worst** of its requirements.

`skip` and `warn` differ in what happens to the WORK, not in noise level,
so they must not collapse: a caller choosing between *some of the work* and
*all of it, unverified* needs both. That is why the verdict carries reasons
rather than a boolean.

**Why not just run the skill and see.** The contract in
`docs/proposals/rag-document-ingestion.md` §5 rests on **absent tool ⇒
`n/a`, never a false pass**. Discovering absence by running is exactly how
that is lost: the run produces an empty result and an empty result looks
like a finding of nothing. Deciding first, from the declaration, is what
makes `n/a` expressible.

## Two findings on the first run

1. **`git-read` was declared by NO capability** and referenced by **17
   skills**. A reference-shaped value resolving to nothing — the `blv9`
   shape — which meant those skills could not be shown to run at all.
   Declared now (`git rev-parse --git-dir`, beside the existing
   `git-push`).
2. **`deploy-access`** is still undeclared, referenced by
   `deployment-auth`. Left as a named gap rather than invented: what
   *probes* deploy access is a judgement, unlike `git-read`. A test lists
   it explicitly so it cannot pass silently, with the instruction never to
   widen that list to make the suite green.

The join also reports `qa-report-signing` as **degraded —
`publication-manager` takes over**, which is the air-gapped route working
end to end: `85e8`'s derived human lane, `sym3`'s capability fallback and
this join, meeting.

## A defect the design caught in one run

Every import failed with "cannot find module": a relative specifier
resolves against the importing module, not the caller's cwd. It surfaced
immediately **because `unreadable` is reported rather than skipped** — had
broken modules been dropped silently, the output would have read
*"no skill declares requiredCapabilities"* and looked like a clean sweep
over an empty set. Pinned by a test.

## Where it shows

`bun run cat-harness/src/index.ts --check-deps`, under the existing
capability report. 16 of 23 ready in this container; the Lean skills block
because neither Lean nor the MCP is installed here, which is true.

The human-lane derivation is **injected**, not imported: it lives in
`scripts/check-fallback-roles.ts` and `src/` must not depend on `scripts/`.

## Done when

- [x] a runtime consumer acts on `degradation`
- [x] the four strategies produce four distinguishable verdicts
- [x] an undeclared capability BLOCKS rather than being ignored
- [x] vacuity guard — an empty corpus says it checked nothing
- [ ] `deploy-access` declared, or `deployment-auth` corrected
