---
# folio-assistant-ymsu
title: kg:detangle:check CANNOT FAIL inside bun run gates — bun test repairs the sidecar 1140 lines earlier in the same run
status: in-progress
type: bug
priority: normal
created_at: 2026-09-25T18:38:34Z
updated_at: 2026-09-26T03:24:20Z
parent: folio-assistant-1xhc
---


Measured 2026-09-25, while establishing whether PR #1348 still had anything to
fix. It is the ROOT CAUSE of #1348's own subject: the detangle staleness that
broke `main` was invisible to `bun run gates` and surfaced only because a test
run left the working tree dirty.

## The mechanism

`bun run gates` runs 152 gates in order. Gate 1 is `bun test`. Somewhere in that
suite the detangle **writer** runs, not the checker:

    gates3.log:56    wrote 28 pinned measurement(s) to cat-harness/test/results/detangle/
    gates3.log:57    updated  cat-harness/skills/folio-core.detangle.json — internal

Gate 152 is `kg:detangle:check`, 1137 lines of output later:

    gates3.log:1194  ▸ bun run kg:detangle:check
    gates3.log:1233  ✓ 28 pinned measurement(s) current in cat-harness/test/results/detangle/

It reads the file gate 1 just repaired. It is comparing the writer's output to
the writer's output.

## Measured both ways, so this is not inference

Committed sidecar at `internal: 154`, working tree's true value `153`:

| invocation | result |
|---|---|
| `bun run kg:detangle:check` **alone** | **exit 1** — `STALE  …folio-core.detangle.json — internal` |
| `bun run gates` (same tree, same commit) | **exit 0** — `✓ 152 gate(s) pass` |

Same tree, same stale value, opposite verdicts. The checker is not broken —
run alone it catches the defect exactly as designed. What is broken is that
inside `gates` its subject no longer exists by the time it looks.

## Why this is worse than an absent gate

`1xhc`'s line is *"a gate that does not fire is indistinguishable from one that
passed."* This is a third state, and worse than either: the gate **does** fire,
reports specifically and by name, and the report is unfalsifiable. An absent
gate at least leaves `package.json` honest. This one is advertised, wired,
running, green, and load-bearing for nothing.

It also **destroys the evidence as it goes**: the repair is a working-tree write,
so an agent who runs `gates`, sees green and pushes has silently taken the
generated file's true value with them or left it behind depending on whether
they ran `git add -A`. That is how a wrong `internal` count reaches `main` at all.

## Scope — the 28 sidecars are the known instance, not the boundary

The writer emits **28** pinned measurements, so every one of them is inside the
blind spot, not just `folio-core`. The general question this raises for `1xhc`:
**which other `:check` gates run after a test that writes their subject?** That
is answerable mechanically — run each `:check` alone against a deliberately
staled input and compare with its verdict inside `gates` — and it has not been
asked.

## Not the same as two neighbours

- **`061n5`/intermittent-under-gates** is a test whose result varies with the run;
  this one is perfectly reproducible in both directions.
- **`v556`** is a generator with no `--check` at all, so nothing looks. Here
  something looks, at the wrong thing.

## Done when

- [ ] the writer does not run during `bun test` — a test needing detangle output
      computes it in a temp dir, as the profile-conformance tests already do
      (`/tmp/profile-axis-*`), rather than writing into
      `cat-harness/test/results/`
- [ ] `gates` fails when the tree is entered with a staled pinned measurement.
      MEASURED AFTER: stale one `internal` by hand, `bun run gates` exits
      non-zero
- [ ] `gates` refuses, or at minimum reports loudly, when a gate has MODIFIED
      tracked files — a gate run that changes the tree it is judging is the
      general form of this defect and would have caught it without knowing
      about detangle
- [ ] the other 27 sidecars are confirmed covered by the same fix, rather than
      assumed to be
- [ ] swept for siblings: which other `:check` gates have their subject written
      by an earlier gate in the same run

## Second instance, found by the same measurement — a `--check` that omits a field

Different mechanism, same consequence, so it is filed here rather than as its own
bean: above, the checker looks at a subject a predecessor already repaired; here
the checker looks at the subject but **not at the field that is wrong**.

`cat-harness/docs/assets/beans/index.json` carries a `tile.beans.count` badge for
the site. Measured on `origin/main`, 2026-09-25:

| | |
|---|---|
| committed `tile.beans.count` | **327** |
| non-archive beans actually in `beans/defs/` | **339** |
| `gen-docs-pages --check` on that tree | **"generated pages are up to date"** |

The badge is twelve beans behind and its own generator's `--check` calls it
current. `harness.json` then copies 327 out of it, so `docs:harness:check` is
green too — **two consistent gates over one wrong number**, because both compare
downstream-to-upstream and neither compares upstream-to-reality.

It surfaced only because I ran the writer (`gen-docs-pages` without `--check`)
for an unrelated reason; the tile count jumped 327 → 340 and `docs:harness:check`
went red on the *correct* value. A gate going red when you fix something is the
signature of this whole family.

Worth noting against the code: `scanTileCounts`' docblock already reasons
carefully about **absence** — *"Every failure is ABSENCE, never zero … `dh4f`"* —
and gets that right. A stale non-absent number is the case it does not consider,
and absence is the one this design made safe.

### Adds to "Done when"

- [ ] `gen-docs-pages --check` compares `tile.*.count` against what a fresh run
      computes, not only the page bodies. MEASURED AFTER: hand-edit the count,
      `--check` exits non-zero
- [ ] the sweep item above is widened: for each `:check`, ask both *"could a
      predecessor have repaired its subject?"* and *"does it compare every field
      it writes?"* — this instance answers the second question wrongly and the
      first one fine

## Clause 3 IMPLEMENTED and falsified, 2026-09-26

`gates` now fails when one of its own gates changes the repository.
`cat-harness/scripts/gate-tree-guard.ts` snapshots `git status --porcelain`
between gates and attributes each change to the gate that made it; the runner
refuses to print its clean line when any gate did.

### The falsification, end to end

`folio-core.detangle.json`'s `internal` set to `999` by hand, then:

| | |
|---|---|
| `kg:detangle:check` **alone** | exit non-zero — `STALE … — internal` |
| `kg:detangle:check` **inside `bun run gates`** (line 1215 of the run) | **passed**, over `internal: 999` |
| the new guard | `✗ 1 gate(s) CHANGED THE REPOSITORY` → `bun test`, naming the exact sidecar |

So the bean's central claim is now reproduced on demand rather than only
remembered, and the blind spot it describes is closed by the runner rather than
by any gate.

### The direction that mattered, and would have been missed

The change `bun test` made was a **revert**, not new dirt: the file was ` M`
before gate 1 and CLEAN after it, because the writer put the correct value back.
So the entry *disappeared* from porcelain.

A guard asking *"did anything get dirtier?"* — the obvious first design — would
have reported nothing here. It would have missed its own test case. `diffReadings`
counts appearances, status transitions and disappearances for that reason, and
the disappearing case has its own test.

### Why it is safe as a HARD failure

Measured before committing to it: a full `bun test` on a clean `main` left the
tree **byte-identical**. A generator rewriting identical bytes does not appear in
`git status`, so the guard is silent on a healthy tree and fires exactly when a
committed artefact was stale.

The predicate is a per-gate **delta**, never "the tree is dirty" — running
`gates` on your own uncommitted work is the normal case, and a guard that failed
on that would be switched off the same day.

### Cost, measured rather than guessed

`git status --porcelain` over this repository's 13,529 tracked files is **~29ms**
(five runs: 29, 27, 29, 27, 29). 152 snapshots is **~4.4s**. That is what bought
per-gate attribution instead of a single before/after pair — the difference
between "the tree changed" and "gate 1 changed what gate 152 reads".

### Not done here, and still open above

Clause 1 — `bun test` should not run the detangle writer at all; a test needing
that output should compute into a temp directory, as the profile-conformance
tests already do. This guard makes that defect *visible and fatal*; it does not
fix it. Clauses 2 and 4 and the `:check` sweep are likewise untouched.

One limitation is documented in the module rather than defended against: a git
operation performed WHILE the gates run moves what is being measured, so it
would attribute an author's own `git add` to whichever gate was running. Commit
before or after a run, not during.
