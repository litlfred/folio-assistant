---
# folio-assistant-6tkl
title: 'STALE LIST: check-declared-assets hardcodes two instances and there are four'
status: completed
type: task
priority: normal
created_at: 2026-09-20T13:35:24Z
updated_at: 2026-09-20T16:25:08Z
parent: folio-assistant-1xhc
---


Found 2026-09-20 while working `pb04`, not looked for.

## Measured

`cat-harness/scripts/check-declared-assets.ts`:

```ts
export const DECLARED_INSTANCES = ["cat-harness", "bootstrap"] as const;
```

Four directories in this repository now carry a `harness.json`:

| declaration | name | declares assets? |
|---|---|---|
| `cat-harness/harness.json` | `folio-assistant` | yes — checked |
| `bootstrap/harness.json` | `bootstrap` | yes — checked |
| `folio-assist-core/harness.json` | `folio-assist-core` | **yes — NOT checked** |
| `harness.json` (the root) | `folio-assistant-checkout` | no assets today |

So `folio-assist-core`'s `README.md`, declared with `role: "instance-readme"`,
is not verified to exist and its links are not audited. The gate reports
`N declared asset(s) across 2 instance(s)` — truthfully, and about the wrong
number of instances.

## Why this is the shape it is

**The comment directly above that line already records this failing once.** It
describes the constant naming the repository root after the `wggr` move, so
`declaredAssets` returned `[]` and the gate reported "1 declared asset across 2
instances, 0 findings" over a file it had never opened — "a clean run across an
empty set, which is `dh4f` in the one check whose whole subject is a file
nobody was looking at."

That is the same defect recurring for the same reason: **a hand-kept list of
instances drifts the moment somebody adds one.** `folio-assist-core` became a
real instance on 2026-09-20 and nothing updated the constant.

## The fix, and the thing to get right

Discover instances rather than list them. `check-undeclared-files.ts` already
does exactly this — `existsSync(join(repoRoot, name, "harness.json"))` plus the
root's own — and treats "it declares itself" as the contract, so a new instance
counts the moment it exists.

Two things a fix must keep:

- **The vacuity guard.** Discovery that finds zero instances must FAIL rather
  than report a clean run, which is the whole lesson of the incident above.
- **The root is an instance now.** It carries no assets today, so discovery
  must tolerate an instance with none without reading that as a finding.

## Done when

- [ ] `check:declared-assets` discovers instances instead of listing them.
- [ ] `folio-assist-core`'s README is verified and its links audited — the
      concrete thing currently unchecked.
- [ ] A test asserts the count of instances checked is at least 3, so the next
      instance is covered without anybody remembering.
- [ ] Zero discovered instances fails rather than passes.

## 2026-09-20 — two of four were ALREADY DONE by a sibling; the other two are now

Re-measured before working it, which changed what the work was.

**Already fixed:** `DECLARED_INSTANCES` is gone. `declaredInstances()` calls
`instanceRootsIn()`, and the gate reports *"6 declared asset(s) across 4
instance(s)"* — `cat-harness`, `bootstrap`, `folio-assist-core` and the root.
So the first two boxes were closed by someone else, including the concrete
one: folio-assist-core's README is verified and its links audited.

**Still open, and the more important half.** Discovery fixed the *list*; it did
not fix the *failure mode*. Measured in a directory with no declarations:

    0 declared asset(s) across 0 instance(s); 0 finding(s), 0 not checked
    EXIT=0

A clean run across an empty set — which is the exact incident this bean cites
as the reason the hand-kept list was dangerous. Swapping a list for a walk
moved where the zero comes from and left the zero passing.

Now:

    ✗ no instances discovered under <dir> — expected at least the root's own
      `harness.json`. Reporting a clean run here would be a pass over an empty
      set (bean `6tkl`), so this is a failure.
    EXIT=2

Verified without a pipe, because `cmd | tail` reports tail's status — a trap
hit three times in this session.

6 tests: the count floor (≥ 3, a floor not an equality, so adding an instance
does not fail a test whose whole subject is that adding one needs no edit),
folio-assist-core present, the root counted with no assets and that not being
a finding, a directory without `harness.json` not counted, a nested one
counted, and an empty repository discovering none.

## Done when

- [x] check:declared-assets discovers instances instead of listing them — by a sibling
- [x] folio-assist-core's README verified and links audited — by the same
- [x] a test asserts the count is at least 3
- [x] zero discovered instances fails rather than passes
