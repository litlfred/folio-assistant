---
# folio-assistant-lps0
title: 'KG AUDIT: skillFiles() walks a hardcoded skills/, so every skill in a topical subgraph is unaudited'
status: completed
type: bug
priority: normal
created_at: 2026-09-20T18:59:22Z
updated_at: 2026-09-21T20:17:11Z
parent: folio-assistant-zzmr
---

`kg-audit.ts` walks a hardcoded `KG_ROOT = join(root, "skills")` when it
collects skill subjects (`skillFiles()`, line ~578). **Every skill outside
`skills/` is therefore unaudited** — not reported as unknown, not reported at
all. It is the `dh4f` shape in the tool whose job is finding that shape.

## Measured, 2026-09-20

The instance declares several `cat-harness` directories that hold skills
DIRECTLY, and none of their skills is audited:

| directory | skills | sidecars |
|---|---|---|
| `skills/**` | the bulk | **295** |
| `methodologies/crdm/` | `crdm-detect`, `crdm-data-model`, `crdm-requirements-workflow` | **0** |
| `methodologies/raci/` | its own | **0** |
| `src/skills/` | `corpus-grep` and siblings | **0** |
| `theming/` (new, bean `1hvo`) | 6 | **0** |
| `bootstrap/skills/`, `bootstrap/render/` | 6 | **0** (a different instance; see below) |

`methodologies/crdm/workflows/` DOES have sidecars, so the gap is specific to
the SKILL walk rather than to the directory being unreachable — the process
audit already resolves declared directories correctly.

## Why it surfaced now

`1hvo` moves `theme-art-intake` from `skills/folio-core/` into `theming/`. The
skill is unchanged and still servable, and it silently left skill QA on the
way. Its old sidecar
(`test/results/kg-qa/skills/folio-core/theme-art-intake.kg-qa.json`) became
**dead** — `kg:audit:check` reports *"1 sidecar(s) audit a subject no report
covers"* — and no new one was written at the new path, because the walk never
reaches it.

**That is the part that makes this worth fixing rather than noting.** A
relocation that drops a subject out of QA and leaves a dead verdict behind
looks, in the diff, exactly like a relocation that did not.

## The fix, and why it was not done in `1hvo`

`skillFiles()` should walk the instance's declared `cat-harness` directories —
`kgDirectories(root)` — rather than the literal `skills/`. `sidecarPath`
already derives a subject's directory from the subject's own PATH rather than
from a table keyed on kind, so the sidecars would land in the correctly
mirrored tree with no further change. The comment on `sidecarPath` makes
exactly this argument for processes.

It was kept out of `1hvo` because **it will surface findings on roughly twenty
skills nobody has ever audited** — `skill-is-brief`, `skill-no-repeated-heading`
and friends — and a change that flips `kg:audit:check` red belongs in a commit
about that, not riding on a directory move. The right order is: widen the walk,
read what it finds, then decide which findings are real.

## Related: `KG_ROOT` is the same literal in two places

`kg-audit.ts` line ~907 already records that `KG_ROOT` here and
`SKILLS_CATEGORIES` in `gen-skill-docs.ts` are two copies of one fact that
drifted apart in two days. This is a third reader of the same literal.

And the naming mismatch is a fourth: `gen-skill-docs` keys a directly-held
package by its DECLARED ID (`cat-harness-src`, `bootstrap-render`) while
`skill-fetch` keys it by the instance name or the basename (`folio-assistant`,
`render`). Both are defensible; having both is the problem.

## Done when

- [x] `skillFiles()` walks every declared `cat-harness` directory, not `skills/`
- [x] Falsified in both directions: a skill in a topical directory IS audited,
      and removing that directory's declaration makes it stop being
- [x] The findings the widened walk surfaces are triaged, not blanket-suppressed
- [x] A relocated skill's sidecar MOVES with it, rather than dying in place
- [x] One answer to "what is this package called", or a stated reason for two

---

## FIXED 2026-09-21

`ownKgRoots(root)` in `scripts/known-skills.ts` — exported and pure, so it is
testable without importing `kg-audit.ts`, which runs the whole audit at module
scope. `skillFiles()` walks those roots instead of `KG_ROOT`.

**Placed in `known-skills.ts` rather than in the audit**, because that is the
module whose doctrine is already *"declaration over location"* and which
already exports `kgRoots`, `skillMdDirs` and `isSkillMd`. The helpers this bean
asks for existed; the audit simply did not use them.

### Three of this bean's own numbers were wrong, and so was one of mine

| claim | measured |
|---|---|
| bean: *"roughly twenty"* skills newly audited | **10**, of which **5** are in this instance |
| bean: *"295 sidecars"* under `skills/**` | 219 skills under the literal, 229 under the declaration |
| bean: *"a change that flips `kg:audit:check` red"* | **`kg:audit:check` exits 0.** One finding across 5 skills, and `skill-is-brief` is `minor` |
| MY first count: 25 newly audited | wrong — I fed `isSkillMd` every file. It only excludes READMEs and `$schema`-tagged nodes; callers filter `.md` first, as `skill-fetch` and `stakeholder-map` both do |

`kg:audit:strict` exits 1 — **and did so before this change too**, checked by
stashing. Pre-existing, not caused here.

### The triage this bean asks for, in full

19 of 20 criteria pass across the five. The single finding:

```
crdm-requirements-workflow   skill-is-brief   293 lines; p75 of the corpus is 279
```

`minor`, 14 lines over p75, and the skill is the six-phase process description —
**not suppressed and not "fixed" by cutting it**, because the threshold says
*"longer than three quarters of its peers"* rather than *too long*.

### Another instance's roots are excluded, and that was not my call to make

`kgRoots` resolves a DEPENDENCY's directories, so it returns `../bootstrap/render`
and three more. Walking them is forbidden by `instance-graph-isolation.test.ts`,
guarding a live 2026-09-19 leak of 88 references, and `unreadNestedInstances`'
own finding text says *"do NOT declare its directories here"*.

It would also break this audit's output: `sidecarPath` mirrors
`dirname(join(root, subject.path))` under `test/results/kg-qa/`, so a `../`
subject normalises to `test/results/bootstrap/render` — **outside the
results tree**, the escaping-path defect `chq5` fixed one store over. Simulated
both cases before writing anything.

**A first draft added `foreignKgRoots()` to report them. It was removed**: the
`nested-instance-audited` criterion (bean `sa8y`) already names every unread
nested instance and counts what it holds. A second report would be a second
answer to one question, free to disagree with the first.

### A duplicate found on the way

`resolveDirectories` supplies the conventional defaults ALONGSIDE the
declaration, so an instance that also declares `skills/` got it **twice**.
`ownKgRoots` deduplicates. Two of my tests were written to the intuition
*"declare none, get none"* and failed against correct behaviour — `skills/` is
a default and survives being undeclared. They assert the measured behaviour
now, and say why.

### Falsified

Reverting `ownKgRoots` to `[join(root, "skills")]`: **2 of the 7 tests fail** —
the two about topical directories. The other five stay green, correctly: they
assert behaviour the widening does not provide.

### Verified

```
bun run gates                         85 pass
own-kg-roots.test.ts                   7 pass, 0 fail
instance-graph-isolation.test.ts       5 pass, 0 fail
kg:audit:check                         exit 0
```

The qa dashboard picked the five up with no change to it: `assets/qa/index.json`
went 604 → **609** documents, `kg-qa/v1` 328 → **333**.

### The checklist stays in ONE place

This section ended with a second `## Done when` restating the list with the
finished items ticked. `check:bean-bodies` failed it as a **shadow checklist** —
the same mistake made on `chq5` an hour earlier, so the habit is appending a
list rather than editing the one above. Caught locally this time, because the
check ran AFTER the last edit rather than before it. Canonical list ticked;
no second copy.

---

## 2026-09-21 — a SECOND session built this in parallel, and withdrew

session_01AYHimvYMmf8h8e9fFN6dW5 built the same widening and opened PR #715 and
issue #714. `fdb5097f4e` landed first. The duplicate is **withdrawn wholesale**:
main's `skillFiles()` is kept and mine deleted.

**Theirs is better on one point**, which is why this is not a coin toss: it
try/catches a declared-but-absent directory and defers that question to
`check:harness-dirs`, the check that owns it. Mine relied on `kgDirectories`
filtering by `existsSync`, which is the same outcome by a weaker route — the
absent case is handled where somebody looking for it would look.

### The sibling check was RUN this time, and did not prevent it

This is the second duplication in one session for the same account, and the
first (`yl5w`) prompted a rule: before claiming, check for an open PR, a remote
branch naming the bean, and the bean's status on main. **All three were checked
and all three were clear** — `lps0` read `todo`, no branch carried code for it,
no open PR named it. The other session had not pushed yet.

So the procedure is not the gap. `bean-coordination` already states the limit
exactly — *"a claim is branch-local: it ANNOUNCES rather than reserves until
your PR exists"* — and what this adds is that **running the check faithfully
does not close it.** Two sessions can both pass the check and both be right.

### The 6-vs-5 difference RESOLVED, and it is the substantive design point

Main's record says 5 new sidecars; the withdrawn branch measured 6. Resolved on
merging, and the answer is why `ownKgRoots` is the right function:

**`kgDirectories` reaches OUTSIDE the instance.** The withdrawn walk used it and
wrote five sidecars under an `_external/` mirror — `bootstrap/render/`,
`kg-navigation/`, `large-datasets/`, `who-iris/` — auditing **other instances'
skills into this instance's tree**. `ownKgRoots` stays inside, which is what
"own" is for: a nested instance's skills belong to that instance's own audit,
and the `nested-instance-audited` criterion already reports the boundary.

Main's own `kg:audit:check` said so immediately on the merged tree — *"5
sidecar(s) audit a subject no report covers … SUBJECT PRESENT, NOT AUDITED"*,
naming all five `_external/` paths. They were deleted; the sidecar tree is now
byte-identical to main.

So the withdrawn implementation was not merely second, it was **wrong at the
instance boundary**, and the check caught it in one run.

### One lesson worth keeping from the withdrawn work

Its first falsification attempt edited `cat-harness/harness.json` — **a file
that no longer exists**, since the REPLACE rename has landed and the
declaration is `cat-harness.config.json`. The test reported *"rule failed"*
against a file it never opened.

**A test that cannot find its subject must say so, not report a verdict.** That
is the `dh4f` shape inside a falsification: a check that examined nothing,
announcing a result. Re-run against the real declaration, the rule held in both
directions.


---

## The package-naming box, measured 2026-09-21 (issue #736)

`## Done when` asks for *"one answer to 'what is this package called', or a
stated reason for two"*. Here is the measurement that box needs. **Not ticked**
— see the collision at the end, which no stated reason covers.

Two systems name the same objects:

- `discoverLocalPackages` in `src/tools/skill-fetch.ts` — three rules, stated
  on `nameDirectlyHeld`: a directory basenamed `skills` takes the INSTANCE's
  name; a sole directly-held directory takes the instance's name; otherwise it
  takes its own BASENAME.
- `kgDirectories` in `scripts/known-skills.ts` — the DECLARATION's id, which
  `gen-skill-docs.ts` then keys on ("ids are stable across a relocation, paths
  are not").

Over the 8 declared kg directories, matched on each record's authoritative
`absPath` (every one exists):

| directory | `skill-fetch` | `kgDirectories` | |
|---|---|---|---|
| `bootstrap/render` | `bootstrap` | `bootstrap-render` | diverge |
| `cat-harness/methodologies/raci` | `raci` | `methodology-raci` | diverge |
| `cat-harness/methodologies/crdm` | `crdm` | `methodology-crdm` | diverge |
| `cat-harness/src/skills` | `cat-harness` | `cat-harness-src` | diverge |
| `large-datasets/skills` | `large-datasets` | `large-datasets-skills` | diverge |
| `who-iris/skills` | `who-iris` | `who-iris-skills` | diverge |
| `kg-navigation/skills` | `kg-navigation` | `kg-navigation` | **agree** |
| `cat-harness/skills` | (expanded) | `cat-harness` | unmatched |

**6 diverge, 1 agrees, 1 unmatched.**

### The reason for two IS stateable

They answer different questions at different granularities. `kgDirectories`
asks *"which directories are declared, and what is each one's stable id"*;
`discoverLocalPackages` asks *"which skill packages can be SERVED, and what
does a caller ask for"* — which is why `skills/` appears once in the first and
as eleven sub-packages in the second. That difference is legitimate and should
not be collapsed.

### But one thing no reason covers

**The name `cat-harness` denotes two different real directories:**

```
  "cat-harness"  skill-fetch    -> cat-harness/src/skills
                 kgDirectories  -> cat-harness/skills
```

Both exist, both hold skills, and they are not the same place. That is not two
names for one thing — it is **one name for two things**, which no granularity
argument defends, and it is the same shape as the `1hvo` collision that
silently dropped three packages: there, four directories resolved to one name
and the last assignment won.

Not repaired here: this bean's owner decides whether `skill-fetch` adopts
declaration ids, `kgDirectories` adopts the three rules, or the two stay
separate with the collision renamed. The measurement is what was missing.


---

## Summary of Changes — closed 2026-09-21 via #760 / PR #762

Both remaining boxes are answered. Each by merged evidence, not by assertion.

### "A relocated skill's sidecar MOVES with it, rather than dying in place"

`relocateSidecars` in `scripts/kg-audit.ts`, merged in `7dc7e9148`. It runs
BEFORE the write loop -- once a fresh sidecar exists at the new path there is
nothing left to move -- and matches on `kind` + `id`, now carried on
`OrphanSidecar`, because the PATH is what changes in a move.

It is not the deletion the orphan sweep refuses. That rule exists because an
orphan can mean a subject is temporarily UNDISCOVERED rather than gone (bean
`pve3`), and "deleting on that evidence would destroy a verdict to hide a
declaration gap". Nothing here deletes; an orphan matching no moved subject is
left exactly where it is, to be reported.

Three conditions stop it, and FIVE of its eight tests are those refusals:
confirmed-gone only (never the `undefined` third state), identity rather than
basename (two packages can hold a same-named skill), and no ambiguity. A
verdict misfiled against a subject it never audited reads as healthy, while an
orphan announces itself.

Verified end to end by reproducing the failure on the real corpus and watching
the move happen.

### "One answer to 'what is this package called', or a stated reason for two"

**The reason for two is stated, and the one thing no reason covered is gone.**

The measurement recorded above stands: over the 8 declared kg directories,
6 diverge, 1 agrees, 1 is unmatched -- and that is legitimate, because the two
systems answer different questions at different granularities.
`kgDirectories` asks which directories are declared and what each one's stable
id is; `discoverLocalPackages` asks which packages can be SERVED and what a
caller asks for, which is why `skills/` is one entry in the first and sixteen
sub-packages in the second. Collapsing that would lose information.

What no granularity argument defended was the COLLISION: `cat-harness`
denoting two different real directories. #762 dissolved it by folding
`src/skills/` into `skills/folio-core/`, and a test now pins it shut --
`discoverLocalPackages(ROOT)["cat-harness"]` must be `undefined`.

So: two names for one thing, with the reason written down; never again one
name for two things, with a test to keep it that way.

### Left for somebody else, deliberately

A finding that fell out of the fold and is recorded on #760 rather than acted
on: removing `src/skills/` removed the LAST manifest-less package in this
corpus, so `kg-export`'s basename-fallback rule now has no subject. Its test
reports that it is unexercised rather than passing silently over an empty set.
The rule is still correct; nothing here exercises it.
