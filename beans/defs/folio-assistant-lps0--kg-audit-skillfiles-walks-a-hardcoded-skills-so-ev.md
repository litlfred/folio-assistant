---
# folio-assistant-lps0
title: 'KG AUDIT: skillFiles() walks a hardcoded skills/, so every skill in a topical subgraph is unaudited'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-20T18:59:22Z
updated_at: 2026-09-21T12:37:26Z
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
| `cat-bootstrap/skills/`, `cat-bootstrap/render/` | 6 | **0** (a different instance; see below) |

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
package by its DECLARED ID (`cat-harness-src`, `cat-bootstrap-render`) while
`skill-fetch` keys it by the instance name or the basename (`folio-assistant`,
`render`). Both are defensible; having both is the problem.

## Done when

- [x] `skillFiles()` walks every declared `cat-harness` directory, not `skills/`
- [x] Falsified in both directions: a skill in a topical directory IS audited,
      and removing that directory's declaration makes it stop being
- [x] The findings the widened walk surfaces are triaged, not blanket-suppressed
- [ ] A relocated skill's sidecar MOVES with it, rather than dying in place
- [ ] One answer to "what is this package called", or a stated reason for two

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

`kgRoots` resolves a DEPENDENCY's directories, so it returns `../cat-bootstrap/render`
and three more. Walking them is forbidden by `instance-graph-isolation.test.ts`,
guarding a live 2026-09-19 leak of 88 references, and `unreadNestedInstances`'
own finding text says *"do NOT declare its directories here"*.

It would also break this audit's output: `sidecarPath` mirrors
`dirname(join(root, subject.path))` under `test/results/kg-qa/`, so a `../`
subject normalises to `test/results/cat-bootstrap/render` — **outside the
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
