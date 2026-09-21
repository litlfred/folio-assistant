---
# folio-assistant-tdu3
title: The module-scope gate covers folioDir only, and walks only cat-harness
status: in-progress
type: task
created_at: 2026-09-21T15:35:46Z
updated_at: 2026-09-21T15:35:46Z
parent: folio-assistant-vke6
---

Carved out of `1hkj` (#719) after it merged, from three gaps found by running
its gate rather than by reading it.

## Three gaps, each measured

**1. Only `folioDir` was on the list.** Measured on main against a directory
holding `{ not json`:

| `folioDir` | THREW |
| `directoryForGraph` | THREW |
| `directoriesForGraph` | THREW |
| `findContentRepoRoot` | returned its declared fallback |

`findContentRepoRoot` stays off the list, which is #719's own decision and the
right one: it is a SEARCH, every probe inside it is wrapped, and it ends in a
declared fallback. A gate against a hazard that does not exist is where a
reader learns something false.

**2. The pattern was anchored to first position.** `=\s*folioDir\s*\(` sees
`const X = folioDir(R)` and nothing else — so **ten real sites** were reported
clean:

```ts
const LEDGER_PATH = join(folioDir(REPO_ROOT), "bib-qa-verifications.json");
const PAPER_ROOTS = PAPERS.map((p) => join(folioDir(REPO_ROOT), p));
const UPLOADS_DIR = directoryForGraph(REPO_ROOT, "uploads") ?? join(REPO_ROOT, "uploads");
```

Identical hazard, nested call. Twelve sites in all once the two extra
resolvers are counted.

**3. It walked one directory.** `walk(join(root, "cat-harness"))`, so every
other instance was invisible — and this repository grew a *contributing*
instance with pipeline code of its own the same day (`folio-assistant-sci`,
bean `rfev`). Now it reads the instance list, because naming a second
directory would leave the third invisible.

## What landed

`deferResolution(compute, {moduleUrl, what, under})` generalises
`folioDirDeferred`, which is now a thin call to it and keeps its name, its
message and its five tests. A wrapper around `folioDir` alone cannot reach a
nested call — what has to be deferred is the whole expression — and with three
throwing resolvers a second function-specific wrapper would already be a
third. Generic in the value because `q-usage-audit.ts` resolves `string[]`.

Same contract as #719: resolution stays at **load**, only the throw moves.

Twelve sites converted. Four more are on a self-policing `ALLOWED` list, with
their reasons: their constants are exported, so deferring one is a change at
every import site.

## The gate got its own remedy wrong — twice, in two different ways

Worth recording because it is the same mistake with two faces. The first
version of a gate like this flagged `const X = (): string => folioDir(root)`.
Widening the pattern to reach nested calls then flagged
`const X = deferResolution(() => join(folioDir(root), "y"), …)` — the very
shape its own failure message recommends. **A gate that reports its remedy is
worse than no gate**, because the only way to satisfy it is to stop using the
fix.

The rule is now stated rather than pattern-matched: the discriminator is the
**arrow**, not the helper's name. A call after `=>` runs when somebody calls
the function; a call before it runs while the module is evaluating. Keying on
`deferResolution(` would bless one spelling and flag an equivalent
hand-written one — and `module-scope-resolution-gate.test.ts` pins exactly
that case.

## A vacuous green, caught by an assertion rather than by luck

The first falsification run planted two offending lines into `bib-qa.ts` and
reported **0 findings**, which reads as a broken gate. It was a broken PLANT:
the anchor it replaced on (`const FOLIO_DIR`) no longer exists there — #719
renamed it. Re-planting against an anchor asserted present caught both forms.
The lesson is the cheap one: a falsification that does not assert its own
precondition proves nothing, and its failure looks exactly like the finding.

## Done when

- [x] The gate covers every resolver that throws, and no resolver that does not
- [x] It sees a nested call, not only one in first position
- [x] It reads every instance rather than one directory
- [x] It does not flag its own remedy, pinned by a test that would fail if it did
- [ ] The four exported sites migrate to accessors (`todos.ts`,
      `agent-memory.ts`, `mcp-server/paths.ts` ×2)
