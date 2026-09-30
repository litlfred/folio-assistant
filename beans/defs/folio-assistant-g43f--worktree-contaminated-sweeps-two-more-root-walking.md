---
# folio-assistant-g43f
title: 'WORKTREE-CONTAMINATED SWEEPS: two more root-walking checks descend into .claude/worktrees and redden bun test for every concurrent session — vpek''s general question, answered yes'
status: todo
type: bug
priority: high
created_at: 2026-09-30T14:13:37Z
updated_at: 2026-09-30T14:13:37Z
parent: folio-assistant-1xhc
---

Bean `vpek` fixed one instance of this — `eslint.config.mjs` not ignoring
`.claude/worktrees/**` — and left the general question open on purpose:

> - [ ] The **general** question is answered rather than only this instance:
>       are there other tools that walk the tree from the repository root and
>       would find a worktree there? … Whether any of them has this problem is
>       **not determined** by this bean and must not be read as no.

**Answered, within the hour: yes, and it is a class.** Two more, both found by
their own output naming the paths.

## The two, measured

| sweep | how it reaches a worktree | measured damage |
|---|---|---|
| `cat-harness/scripts/check-stale-field-advice.ts` | its walk descends into `.claude` **on purpose** — agent instructions live there and carry advice strings — and so into `.claude/worktrees/<id>/` | **6 findings, all 6** with paths beginning `.claude/worktrees/agent-` |
| `cat-harness/scripts/check-declaration-filename.ts` | `scanMarkdown`'s `walkMd` skips only `.git` and `node_modules` — **no dot-directory guard at all** | **528** stale-path findings |

Both turn `bun test` red on a branch whose diff touches none of them, and both
do it for every concurrent session sharing the checkout, including ones that
dispatched no agent.

## Why asking git is the fix rather than another ignore entry

`.claude/worktrees/` is **gitignored** (`.gitignore:31`) and untracked, so

```
git ls-files --cached --others --exclude-standard
```

never lists it. `schemas/git-corpus.ts` already wraps exactly that, and this
repository already states the rule — `xd1g`, `ramz`, and `root-scan-census`,
whose whole subject is scripts that enumerate the filesystem instead of asking
git. **A walk is a guess at what the corpus is; git knows.**

`vpek` needed an ignore entry only because eslint cannot ask git. These two
can, so they should, and the fix is the rule rather than an exception to it.

## The fallback is NOT silent — `dh4f`

`gitCorpus` returns **`undefined`** when git cannot answer, not an empty list.
An empty corpus would make either check pass vacuously, which is the `dh4f`
shape: a consumer scanning nothing and reporting a clean run. So the walk
survives as an explicit fallback in both, and `check-stale-field-advice`
exports `adviceCorpusSource()` so a caller can tell **"clean"** from
**"could not look"**.

## The trap this fix walked into, and what it cost to notice

Switching enumeration **widened the corpus**, because the walk's exclusions
lived in the walk. `SKIP_DIRS` holds `beans`, which the walk never entered and
git lists — so the first conversion turned **21 archived beans into new
findings** and the check still exited 1, now for an entirely different reason.

Measured, before and after re-applying the walk's own exclusions to git's list:

```
first conversion   6203 file(s), 24 qualified, 21 bare   exit 1
scope preserved    5089 file(s), 13 qualified,  0 bare   exit 0
```

**A fix that silently rescopes a check is a second defect wearing the first
one's clothes.** Asking git is a change of *enumeration*, not of *scope*, and
the two have to be separated by hand because nothing in the type system does
it for you.

## Verification

```
check:stale-field-advice     exit 0   (was 1, all findings under .claude/worktrees/)
check:declaration-filename   exit 0   (was 1, 528 findings)
bun test (both test files)   41 pass, 0 fail
```

## Done when

- [x] `check-stale-field-advice` asks git, with a non-silent fallback and its
      source reportable.
- [x] `check-declaration-filename`'s markdown sweep asks git, same shape.
- [x] Neither rescopes: the walk's exclusions re-applied to git's list, with
      the before/after counts recorded above.
- [ ] **The class is swept, not just these two.** `root-scan-census` counts 65
      enumerating scripts in `cat-harness/scripts` alone. Three are now known
      (eslint via `vpek`, and these two). **How many of the remaining 62 walk
      from a root that contains `.claude/` is NOT determined here** and must
      not be read as none. The census already classifies `seededAtRoot` and
      `gitAware` per script — that is the instrument, and it has not been
      pointed at this question.
- [ ] Whether the census itself should FAIL on a root-walking sweep that is
      not git-aware, rather than only report. It reports and never fails by
      the owner's ruling of 2026-09-27; this bean is evidence for revisiting
      that, and does not presume the answer.

## Not in scope

Converting any of the other 62. That is the sweep above, and doing it
piecemeal while the class is unmeasured is how a count reads as improvement
while the subject moves — which is `tqv4`, one corpus over.
