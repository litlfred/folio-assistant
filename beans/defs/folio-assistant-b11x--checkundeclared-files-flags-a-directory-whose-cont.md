---
# folio-assistant-b11x
title: check:undeclared-files flags a directory whose contents are ALL gitignored — red locally, green in CI
status: todo
type: bug
priority: normal
created_at: 2026-09-20T12:52:22Z
updated_at: 2026-09-20T12:52:22Z
parent: folio-assistant-1xhc
---

## Measured 2026-09-20, on the current main

`bun run check:undeclared-files:check` reports:

```
1 path(s) at the repository root that no declaration names:
  ·   170 KB  scripts/
```

Every file under that `scripts/` is `__pycache__` bytecode — **11 `.pyc`
files, untracked, and gitignored** by `.gitignore:31` (`__pycache__/`).

`git ls-files scripts/` is empty. The directory does not exist on `main`.

## Why this is a defect rather than a finding

The check's own docstring lists what it excludes:

> 4. **git's own business** — dotfiles, `node_modules/`, ignored paths.

`scripts/__pycache__/` IS an ignored path. The check matches on the
**top-level entry** and never asks whether everything beneath it is ignored,
so a directory that exists only to hold ignored files is reported as
undeclared.

## The shape that makes it worse

**It is red locally and green in CI.** CI checks out clean, so `scripts/` is
not there at all and the gate passes. Anyone who has run a Python script from
the repository root gets a red gate on their machine, for a directory git has
been told to ignore.

A gate that fails on every developer's machine and passes in CI is one people
learn to skip, which costs more than the check is worth. That is the same
economics as `6xaz` and the `translate-*:check` exclusion in `ot9a`: the
failure mode is not a wrong answer, it is a correct-looking one nobody trusts.

## Suggested fix, not applied here

Ask git. A top-level entry whose every descendant is ignored is git's
business, and `git check-ignore` already knows — which is the argument the
check itself makes for not keeping "a second list of ignored paths … free to
disagree" (its own comment, on `_kg/`).

Not fixed in the PR that found it (`eief`, #510) because it is someone else's
gate, landed on main while that branch was open, and widening a PR onto
another's change is how two fixes become one conflict.

## Done when

- [ ] a directory whose entire contents are gitignored is not reported
- [ ] the case is tested — plant an ignored-only directory and assert silence
- [ ] and the inverse is tested, so the check still catches a genuinely
      undeclared root path. A check that stops reporting is worse than one
      that over-reports

---

## NOTE from a sibling session, 2026-09-20 — this appears FIXED on main

Left as a note rather than a resolution: this is not my bean, and resolving
somebody else's is what `bean-coordination` forbids. The author decides.

**`0f3dec084a`** — *"check-undeclared-files: a directory holding only ignored
files is not a finding"* — landed on `main` and takes exactly the approach
this bean suggests: ask git. `holdsOnlyIgnored()` runs both `ls-files` and
`status --untracked-files=all`, because each covers the other's blind spot,
and returns **false** when git is unavailable so the sweep reports rather than
skips.

All three done-whens checked **against the code, not against its commit
message** — `scripts/tests/check-undeclared-files.test.ts`:

| done-when | test |
|---|---|
| an ignored-only directory is not reported | `is not reported — it is git's business, not a finding` |
| the case is tested | same, plus `a directory of TRACKED files is not mistaken for empty` |
| the inverse still catches a real undeclared path | `...and the skip is NARROW: one real file in it and it IS reported` |

Plus `git unavailable means REPORT, never skip`, which the bean did not ask
for and is the right call.

Measured on this checkout after merging main: `bun run check:undeclared-files`
→ *"nothing at the repository root is unaccounted for"*, with the
`scripts/__pycache__` still present on disk. So the fix is verified against
the actual condition, not just a clean tree.

**This bean has a duplicate, and it is mine.** `koth` describes the same
defect and was filed at 12:56:15 — **three minutes and fifty-three seconds
after this one**. My check-before-you-create grep ran against a checkout that
did not yet contain `55f542af23`, so it found nothing. That is
[`bean-coordination` §"A claim is branch-local"](../../cat-harness/skills/folio-core/bean-coordination.md)
exactly: a bean announces rather than reserves until the PR carrying it
exists, and two sessions four minutes apart is inside that window.

`koth` is marked completed and carries the correction that **my** diagnosis
there was wrong — I said the sweep "reports a gitignored directory", when
`gitIgnored()` already asks git. This bean got it right: the check *"matches
on the top-level entry and never asks whether everything beneath it is
ignored"*. Where the two disagree, this one is correct.
