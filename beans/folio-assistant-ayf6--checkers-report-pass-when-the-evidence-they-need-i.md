---
# folio-assistant-ayf6
title: Checkers report pass when the evidence they need is missing or corrupt
status: completed
type: bug
priority: normal
created_at: 2026-08-08T15:51:47Z
updated_at: 2026-08-08T15:54:21Z
---

Continuing the sweep from PRs 74-79 for checks that report clean because they never looked.

Two checkers in qa-checkers-extended.ts answer 'pass' when the artefact they must inspect is absent or unreadable. That is not a vacuous truth about the block, it is an unanswered question reported as a satisfied one:

- checkCanonicalScriptNotDeprecated: the block declares script: '<path>'. If that path does not exist on disk the checker returns pass, asserting the script is not deprecated about a script that is not there. Also returns pass when the .ts manifest itself is unreadable.
- checkComputeLpDualPresent: returns pass when the witness JSON named by the block does not exist, and again inside catch when the witness exists but does not parse. A corrupt witness file currently makes the criterion assert success.

The discriminator used: is the missing thing the SUBJECT of the criterion (no script declared -> vacuously satisfied, pass is right) or the EVIDENCE needed to judge (declared script missing -> unknown, must be n/a). Only the evidence cases are being changed.

Verified safe: nothing in the tree gates on result === 'pass' except q-usage-audit.ts:380, which concerns a human reviewer's decisive verdict and is unrelated. Gates fail on fail/warn, not on n/a.


## Summary of Changes

Three `pass` results became `n/a`, all of them cases where the checker could
not read the artefact its answer depends on:

- `checkCanonicalScriptNotDeprecated` — declared script absent from disk, and
  no `.ts` manifest at all.
- `checkComputeLpDualPresent` — witness JSON missing, and (the sharpest one)
  witness present but unparseable, which used to return `pass` from inside the
  `catch`.

Each carries a note naming the file, so the sidecar says which artefact was
unreadable rather than just recording `n/a`.

### What was deliberately left alone

The vacuous cases still pass, and are now pinned by tests in both directions:

- a block declaring NO script cannot have a deprecated one;
- a block that is not an LP computation is genuinely outside the LP criterion.

Collapsing those into `n/a` would hollow the sweep out from the opposite side —
every ordinary block would report "not assessed". The distinction the whole fix
turns on is subject-absent (vacuously satisfied) versus evidence-absent
(unanswered).

### Verified

Nothing in the tree gates on `result === "pass"` except `q-usage-audit.ts:380`,
which concerns a human reviewer's decisive verdict — unrelated. Gates fail on
`fail`/`warn`, so `n/a` costs no build.

9 tests, and all four `n/a` cases were watched failing against the old code
while the five vacuous/positive controls held in both versions.

### One correction to the test, worth recording

The first draft used relative script/witness paths and a `process.chdir` into a
temp repo. That exercised nothing: `qa-checkers-extended` captures
`REPO_ROOT = findContentRepoRoot()` at MODULE LOAD, so the chdir changed
nothing and every relative fixture path resolved against the real repository —
where it did not exist, making every case look like "missing evidence"
regardless of setup. Two tests passed for the wrong reason and two failed
confusingly. Fixtures now use absolute paths, which `resolve()` returns
unchanged.
