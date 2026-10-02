---
# folio-assistant-fuzm
title: The staging slug sanitiser can emit '..' — safety rests on git's ref rules, written down nowhere
status: completed
type: task
parent: folio-assistant-1xhc
created_at: 2026-09-20T06:53:04Z
updated_at: 2026-09-20T06:53:04Z
---


Found 2026-09-20 while siting bean `6pfo`'s retired-record store, by checking whether the slug could reach a path it should not.

## The finding

`feature-staging.yml`'s slug sanitiser, used by both the `stage` and `cleanup` jobs:

```sh
SLUG=$(echo "$BRANCH" | sed 's|[^a-zA-Z0-9._-]|-|g' | sed 's|--*|-|g' | sed 's|^-||;s|-$||')
```

`.` is in the permitted class, and the substitution **replaces** rather than deletes — so two adjacent input dots produce two adjacent output dots. Input `..` yields output `..`.

The cleanup job then runs:

```sh
rm -rf "STAGING/$SLUG"
```

With `SLUG` of `..` that is `rm -rf "STAGING/.."` — the checkout root of the `gh-pages` working copy, not a preview.

## Why it is not currently exploitable, and why that is the point

**Git rejects every ref name containing `..`.** Verified with `git check-ref-format` across eight candidates — `..`, `../..`, `a/../../x`, `./.`, `.git`, `...`, `a..b`, `feat/..%2f..` — every one rejected. Since the only source of an output dot is an input dot, and any adjacent pair requires an adjacent pair in the input, the sanitiser cannot emit `..` from a name git would accept as a branch.

So the guard is real. **It just is not in this file, or in any comment near it.** The safety of an `rm -rf` rests on an invariant of git's ref format that nothing here states and no test pins.

## What breaks it, none of which is far-fetched

- A slug taken from something that is not a ref — a dispatch input, an issue title, a directory listing of `STAGING/` read back from `gh-pages`. `cleanup-dispatch` already takes `cleanup_slug` as a **dispatch input**; it is guarded by a confirmation that must repeat the slug exactly, which is a guard on the CALLER rather than on the value.
- A change to the sanitiser that looks equivalent — adding `/` to the permitted class for nested previews, say.
- Reuse of the sanitiser somewhere with no `rm` today but one later.

The job's own comment already marks it **"THE SERIOUS ONE"** for a different reason: it runs on `pull_request_target`, so an interpolated fork branch name is arbitrary code execution with write access. The `..` case is the same class of hazard one layer down, and the existing comment's care is evidence this is the right file to state it in.

## Done when

- The invariant is written where the sanitiser is, naming git's ref rules as the reason rather than leaving the `sed` to look self-sufficient.
- A test pins it: a slug that is `..`, or contains a path separator, is refused by whatever consumes it — so the protection does not depend on the input happening to be a ref.
- Every `rm -rf` built from a slug refuses a slug that is not a single safe path segment, rather than trusting its provenance.

## Not in scope

Rewriting the sanitiser. It is correct for the input it actually gets; the defect is that nothing says why, and nothing would notice if that stopped being true.

_2026-09-20T10:45Z_ — Done, and **two of this bean's own claims were revised by
measuring them.**

## The severity was overstated, and the reason is worth keeping

This bean reads as though `rm -rf "STAGING/.."` would delete the checkout root.
It would not. **`rm` refuses `.` and `..` operands outright** — POSIX-mandated,
and GNU `rm` implements it:

```
$ rm -rf "STAGING/.."
rm: refusing to remove '.' or '..' directory: skipping 'STAGING/..'
exit=1
```

Nothing is deleted. So there were already TWO independent guards, not one: git
rejecting `..` in ref names, and `rm` refusing the operand.

## And the real residual is somewhere the bean did not look

**`git add -A "STAGING/.."` does NOT refuse.** It stages the whole tree above
the previews — measured in a scratch repository, `rootfile` staged from a
`STAGING/..` pathspec. So the reachable consequence is a job that deletes
nothing and then commits unrelated changes: a wrong commit, not data loss.

That is what justifies the guard being on the VALUE rather than on provenance,
which is what this bean asked for all along — just for a better reason than
the one it gave.

## Also narrower than stated

`/` is not in the permitted class, so the sanitiser's output is ALWAYS a single
path segment. Every escape that needs a separator is already impossible:
`../..` becomes `..-..`, `feat/../x` becomes `feat-..-x`. The entire hazard is
the two spellings `.` and `..`.

## What landed

- The invariant written where the sanitiser is, in BOTH slug steps, naming
  each guard and the one they do not cover.
- `case "$SLUG" in ""|.|..)` in `stage` and `cleanup`. `cleanup-dispatch`
  already had it — found while writing the test, which expected two guards and
  got three.
- `scripts/tests/staging-slug.test.ts`, 17 tests that RUN the real things
  rather than asserting about them: the sed pipeline lifted from the workflow,
  `git check-ref-format`, `rm`, `git add`. Including a positive control — git
  ACCEPTS `main` and `claude/...` — so the refusal tests would fail against a
  broken git rather than passing for the wrong reason.
- A test that fails if the workflow's sed pipeline stops matching the one
  under test, so this file cannot quietly start measuring something else.

## Done when — all three met

- [x] the invariant is written where the sanitiser is
- [x] a test pins it, independent of the input happening to be a ref
- [x] every `rm -rf` built from a slug is in a job that refused an unsafe one
