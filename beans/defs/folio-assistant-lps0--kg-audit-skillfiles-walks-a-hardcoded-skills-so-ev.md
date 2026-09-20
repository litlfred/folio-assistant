---
# folio-assistant-lps0
title: 'KG AUDIT: skillFiles() walks a hardcoded skills/, so every skill in a topical subgraph is unaudited'
status: todo
type: bug
created_at: 2026-09-20T18:59:22Z
updated_at: 2026-09-20T18:59:22Z
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

- [ ] `skillFiles()` walks every declared `cat-harness` directory, not `skills/`
- [ ] Falsified in both directions: a skill in a topical directory IS audited,
      and removing that directory's declaration makes it stop being
- [ ] The findings the widened walk surfaces are triaged, not blanket-suppressed
- [ ] A relocated skill's sidecar MOVES with it, rather than dying in place
- [ ] One answer to "what is this package called", or a stated reason for two
