---
# folio-assistant-g43f
title: 'WORKTREE-CONTAMINATED SWEEPS: two more root-walking checks descend into .claude/worktrees and redden bun test for every concurrent session — vpek''s general question, answered yes'
status: in-progress
type: bug
priority: high
created_at: 2026-09-30T14:13:37Z
updated_at: 2026-10-03T14:06:30Z
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


## The denominator, supplied by the census — and `tqv4` has been fixed

`root-scan-census:check` went red on this branch, correctly: making two scripts
git-aware changes their classification. Regenerating it produced the number the
open box above asked for, so it no longer has to be guessed.

**On `main`, 2026-09-30:**

```
root-scan census — 69 enumerating script(s), 14 ask git.
  scope: bootstrap-tools 0, cat-harness 66, fhir-harness 0,
         folio-assistant-core 2, large-datasets 0, smart-trust 0, who-iris 1
         (the rest: no scripts/)
  seeded AT a root constant: 1; of those, not git-aware: 1
    · folio-assistant-core/scripts/check-artifact-index.ts
```

**55 of 69 do not ask git.** That is the class's denominator, and it is a
FLOOR by the census's own statement — both filters are syntactic, the loose one
over-counts and the tight one under-counts, and the gap between them is the
finding rather than either number.

Three are now known to have reached a worktree (eslint via `vpek`, and the two
fixed here). **Whether any of the other 52 do is still not determined**, and
`gitAware: false` is not the same question — a script that walks one declared
directory never reaches `.claude/` and is fine as it is. The question is
narrower: **which of them walk from a root that contains `.claude/`?**

### Two things this measurement settles that were open elsewhere

**`tqv4` has been fixed, by another session, while this was being written.**
That bean's whole subject was that `root-scan-census` was instance-scoped, so
scripts moved up into `folio-assistant-core/` were counted nowhere, and its
headline family read `0 of 0` while the repository's only instance of the shape
sat outside the scan. The output above reports **per-instance scope across all
17**, and the family now names
`folio-assistant-core/scripts/check-artifact-index.ts` — exactly the file
`tqv4` measured as invisible. The count also moved 65 → **69**, which is the
scope widening rather than four new scanners.

**The census is now the right instrument for the sweep**, which it was not when
this bean was opened: an instance-scoped census could not have answered a
question about the whole checkout.


## The class sweep — done, and the result is NEGATIVE

`generalise-the-fix` Move 1.2: three instances is a class, so sweep for
siblings rather than stop at the third. Done 2026-09-30, read-only.

**No fourth instance found.** A negative result is a real result, and this
records the method so the next reader can judge it rather than trust it.

### Two filters, and the gap between them is the point

Over the 205 enumerating scripts under `*/scripts/` and
`cat-harness/content/pipeline/`:

| filter | count | what it is worth |
|---|---|---|
| **loose** — does not ask git, and either has no `startsWith(".")` guard or names `.claude` explicitly | **142** | **useless as an upper bound.** Most walk a NAMED SUBDIRECTORY (`content/`, `translations/`, `folio/<paper>`) and never approach `.claude/` |
| **tight** — additionally SEEDED at a root constant (`REPO_ROOT` / `INSTANCE_ROOT` / `ROOT`) | **2** | both **false positives on inspection** — see below |
| **known actual** | **3** | eslint (`vpek`), and the two fixed in this bean |

142 is not "142 bugs", and reporting it as one would be the same over-claim
this bean's own `SKIP_DIRS` trap was about. The census documents exactly this
shape about its own two filters: *"the loose one over-counts … the tight one
under-counts … the gap between them is the finding, not either number."*

### The two candidates, and why both fell

```
cat-harness/content/pipeline/audit-status-sections.ts:130    const root = join("folio", paper);
cat-harness/content/pipeline/extract-status-sections.ts:98   let root = join("folio", paper);
```

Both walk `folio/<paper>` — a folio's content directory. Neither can reach
`.claude/`. They matched only because the regex saw `walkMd(root)` and read the
PARAMETER NAME `root` as a root constant.

### The blind spot, stated rather than implied

The tight filter is defeated by **a walk whose root arrives as a parameter from
a caller that passes the repository root**. That is not hypothetical — it is
the limitation `root-scan-census` already documents about its own
`seededAtRoot` filter, measured there as catching 4 of 62 and missing one of
`xd1g`'s twelve.

So this sweep establishes **no fourth instance among scripts whose walk root is
syntactically visible**, and says nothing about one whose root is passed in.
That residue is why the box below stays open rather than being ticked.

## Done when — updated

- [x] `check-stale-field-advice` asks git, non-silent fallback, source reportable.
- [x] `check-declaration-filename`'s markdown sweep asks git, same shape.
- [x] Neither rescopes — before/after counts recorded.
- [x] **The class is swept.** 205 enumerating scripts examined; loose filter 142,
      tight filter 2, both tight candidates false positives on inspection; **no
      fourth instance found.** Method and its blind spot above.
- [ ] Whether `root-scan-census` should FAIL on a root-walking sweep that is
      not git-aware, rather than only report. It reports and never fails by the
      owner's ruling of 2026-09-27. This bean is evidence for revisiting that —
      **55 of 69 enumerating scripts do not ask git** — and deliberately does
      not presume the answer, because most of those 55 are walking a directory
      they own, where a walk is fine.

_2026-10-03T14:06:30Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
