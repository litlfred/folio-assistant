---
# folio-assistant-t6s7
title: A bean whose FENCE is mangled is skipped by every check, and a declared-but-absent store reports clean
status: completed
type: bug
priority: high
created_at: 2026-09-21T20:41:44Z
updated_at: 2026-09-21T20:48:56Z
parent: folio-assistant-1xhc
---

`t7ao` closed the LOUD case: a bean whose YAML does not parse takes the whole
store down, and 92 gates passed over it. This is the QUIET case, and it
survived that fix because the new gate inherits the blind spot from the reader
it is built on.

`readBeanFiles` in `cat-harness/scripts/bean-store-read.ts` collapses two
different answers into "nothing here", and every one of its four consumers
inherits both: `check-bean-front-matter`, `check-bean-bodies`,
`check-stale-paths`, `check-ready-to-close`.

## 1. A mangled FENCE makes a bean invisible to every check — measured

`bean-store-read.ts:101` — `if (!m) continue;`, commented *"A file with no
front matter is not a bean; `beans check` owns that."* That is right for a
stray README and wrong for a bean whose fence was mangled.

Falsified 2026-09-21 by planting one file in `beans/defs/` whose closing fence
was `--` instead of `---`:

| | clean store | + mangled-fence bean |
|---|---|---|
| `check:bean-front-matter` count | 629 | **629**, and `✓ no NEW defect`, exit 0 |
| `beans list` | 626 | **627** |

The gate's count does not move, because the file is skipped before it is ever
examined. `beans` DOES load it — as a ghost row with the id taken from the
FILENAME, status `?` and no title at all.

So the two readers disagree about whether the bean exists, the work plan shows
a blank row, and the gate whose entire job is "every bean's front matter is
readable" reports clean. That is `1xhc` exactly, one level in from where
`t7ao` closed it.

**The fix is a continuation of #794's own reasoning, not a correction of it.**
Its `report.beans === 0` guard already names this mechanism — *"`readBeanFiles`
skips a file with no front matter, so an empty result over a non-empty
directory means every file failed to look like a bean"*. It guarded the
all-or-nothing extreme. One skipped file among 629 is the same defect at a
scale the guard cannot see.

## 2. DECLARED-BUT-ABSENT is reported as "no store", exit 0

`bean-store-read.ts:90` — `if (dir === null || !existsSync(dir)) return null;`.
One `null` for two questions, and the gate prints *"no store in this
repository, nothing to check"* and exits 0 for both.

Verified on a fixture root declaring `defs-that-does-not-exist`:

```
beanDefsDir   -> <root>/beans/defs-that-does-not-exist
readBeanFiles -> null
report.beans  -> null          # "no store in this repository" — exit 0
```

That is `dh4f`: a consumer scans nothing and reports a clean run over it. The
sharper form is that `beanDefsDir` FALLS BACK to `beans/defs` when nothing is
declared, so it returns `null` only for a graph that declares no `bean-defs`
node — meaning the case that actually arises in the wild is declared-or-
defaulted-but-absent, which is the defective one. A downstream folio whose
`beans/defs` is moved or deleted gets `✓ nothing to check`.

`check-bean-front-matter`'s own `process.cwd()` comment names `dh4f`. That
instance was closed; this one was inherited.

## Why not just widen `readBeanFiles`

Four consumers depend on its signature. A companion that returns the three
states, with `readBeanFiles` delegating to it, changes no caller and gives the
front-matter gate — the one whose job this actually is — something to report.

## Done when

- [x] A file in the bean directory that carries no parseable front matter is
      REPORTED by `check:bean-front-matter`, not skipped. `README.md` stays the
      one documented exception.
- [x] `declared-but-absent` is a distinct state from `no store declared`, and
      it is NOT exit 0.
- [x] Tests that plant each defect and assert the gate fails — fixtures, since
      the live store is clean and therefore proves neither.
- [x] The count the gate prints is reconciled against the directory, so "files
      seen" and "beans checked" cannot silently differ again.


---

## Summary of Changes

`readBeanStore` in `cat-harness/scripts/bean-store-read.ts` — three states and
the skipped files, with `readBeanFiles` delegating to it so
`check-bean-bodies`, `check-stale-paths` and `check-ready-to-close` see exactly
what they saw before. `resolveBeanDefs` in `beans.ts` carries the one fact
`beanDefsDir` discarded: whether a committed `beans/beans.json` named the
directory, or the default did. Without it the two absences cannot be told
apart, because the fallback hands back a plausible `beans/defs` for a
repository that never mentioned one.

Falsified in both directions on the real corpus:

```
clean store (630 beans)       -> exit 0
+ one mangled closing fence   -> exit 1, UNFENCED, names the file
+ a README.md                 -> exit 0, listed as NOT_BEANS, still counted
declared-but-absent fixture   -> exit 2, "NOT a pass"
no beans/ at all              -> exit 0
```

## The reconciliation was a tautology, and a mutation caught it

`beans + skipped === filesSeen` was the fourth box, and it was worthless as
first written: `filesSeen` was incremented inside the same loop that fills the
two lists, so the identity held by construction. Mutating it — computing
`filesSeen` from `beans.length + skipped.length` — left **every test green**.

That is this bean's own defect, committed while fixing this bean. A check that
cannot fail is indistinguishable from one that passes.

Repaired twice over. `filesSeen` is now a SEPARATE traversal of the directory,
so a future `continue` added to the read loop that forgets to record what it
dropped makes the two disagree instead of undercounting in silence. And
`reconcile()` is extracted as a function, because the read path cannot produce
a mismatch — every `.md` lands in one list or the other — so handing it the
numbers directly is the only way to execute its failing branch at all.

## Five mutations, each caught

| mutation | tests failing |
|---|---|
| the silent `continue` restored | 4 |
| the two absences collapsed | 1 |
| `NOT_BEANS` made to swallow everything | 2 |
| `filesSeen` derived from the lists | 4 |
| the archive not walked | 1 |

18 tests pass; 8 of them were already there for `t7ao` and are untouched.
