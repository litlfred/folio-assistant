---
# folio-assistant-dni0
title: Sweep the 13 unguarded --paper readers onto one shared guarded helper
status: completed
type: task
priority: normal
created_at: 2026-08-30T10:25:50Z
updated_at: 2026-08-30T10:31:44Z
---

Follow-up to the review-bot finding on PR #151, which was fixed in
`prune-transitive-deps.ts` only. Owner asked for the sweep.

THE DEFECT, uniformly: `--paper` readers take the token after the flag without
checking it is a value. `--paper --apply` hands `requirePaper` the string
`"--apply"`, which it returns unchanged (an explicit name is trusted, by
design), and the run fails much later looking for a paper directory called
`--apply`. A trailing `--paper` yields undefined and falls through to
"N papers found -- name one explicitly", hiding that the caller DID try to name
one.

SCOPE CORRECTION vs what I first reported: 13 readers, not 12, and they are not
all found by grepping `indexOf("--paper")` -- `extract-status-sections.ts` uses
a local `get(f)` helper with the flag as a variable. Enumerating by
`requirePaper(` call sites plus the filter-style users is the reliable way.

ALSO CORRECTED: I said `gen-block-jsonld.ts` was worse because
`argv[argv.indexOf("--paper") + 1]` yields `argv[0]` when the flag is absent.
It does, but the very next line guards it with `argv.includes("--paper") ?
paperArg : undefined`, so the exposure is neutralised. All 13 carry the same
single bug, not two.

PRIOR ART FOUND: a guarded `flagValue` already exists, duplicated VERBATIM in
`scripts/lean-coverage.ts` and `scripts/section-story-audit.ts`. It rejects a
missing or `--`-prefixed value -- but returns `null` silently, so the caller
still degrades to "N papers found" rather than being told what it typed wrong.

- [ ] One shared helper in `content/pipeline/cli-args.ts` that THROWS a targeted
      usage error, named so it cannot be confused with the lenient `flagValue`
      (which stays, since it also serves `--out`/`--severity`/`--ref` where
      returning null is the established contract and changing it would widen
      this beyond `--paper`).
- [ ] Convert all 13 readers.
- [ ] Tests, including a control: a well-formed `--paper` must get PAST argument
      parsing and fail elsewhere, or a test asserting "it failed" would pass
      whether or not the guard exists.


## Summary of Changes

`content/pipeline/cli-args.ts` — one shared `requireFlagValue(argv, flag)` that
THROWS a targeted usage error, plus `paperArg(argv?)`. All 13 unguarded readers
converted; `grep -rn 'indexOf("--paper")'` over content/ and scripts/ now
returns nothing outside the helper itself.

Named `requireFlagValue`, NOT `flagValue`, deliberately: the lenient
`flagValue` duplicated in lean-coverage.ts and section-story-audit.ts stays
where it is, because those also use it for `--out`/`--severity`/`--ref` where
returning null on a missing value is the established contract. Two same-named
helpers with opposite behaviour on the same input is the trap, so the names
differ.

VERIFIED BEHAVIOURALLY, not just by compiling: every one of the 14 scripts (13
swept + prune-transitive-deps from the original fix) was run twice —
`--paper --strict` and `--paper some-paper-name`. 14/14 refuse the flag-shaped
value naming what was found; 14/14 accept the well-formed one and fail further
on. The second half is the control: without it, "it failed" would prove nothing,
since these run above no content repo where every invocation fails anyway.

`scripts/tests/cli-args-paper-guard.test.ts` — 8 tests. Unit coverage of the
helper (absent / well-formed / `--`-shaped / `-`-shaped / trailing), plus a
corpus invariant that no file under content/pipeline or scripts re-introduces
the idiom. That invariant carries its own control (the detector must fire on a
planted snippet) AND was checked red-green: planting an unguarded reader in
audit-wiring.ts makes it fail and NAME the file; restoring makes it pass.

Bonus in scope: `extract-status-sections.ts` read its flags through a local
unguarded `get(f)`, so converting it fixes `--chapter` as well as `--paper` —
same defect, same helper.

## Corrections to what I first reported

- 13 readers, not 12. `extract-status-sections.ts` was missed because its flag
  is a variable, so `grep indexOf("--paper")` did not see it. Enumerating by
  `requirePaper(` call sites plus the filter-style users is the reliable way.
- `gen-block-jsonld.ts` is NOT worse than the others. I said its
  `argv[argv.indexOf("--paper") + 1]` yields `argv[0]` when the flag is absent;
  it does, but the next line guards it with `argv.includes("--paper") ? ... :
  undefined`, so the exposure is neutralised. All 13 carried one bug, not two.
- `generate-index.ts` needed a different conversion: it falls back to a
  positional `process.argv[2]`, which main added deliberately. Kept — that
  script takes no other flags, so argv[2] cannot be one.

## Gates

tsc --noEmit clean; bun test 1321 pass / 38 skip / 0 fail; eslint clean;
gen-schema-docs and gen-skill-docs produce no diff.
