---
# folio-assistant-77ex
title: AGENTS.md makes claims ABOUT CODE that nothing checks
status: todo
type: task
priority: normal
created_at: 2026-09-20T03:05:22Z
updated_at: 2026-09-20T03:05:35Z
parent: folio-assistant-1xhc
---

## The gap

Two checks already cover `AGENTS.md` and neither covers this:

- `check:agents-xref` — citations **into** it resolve (a skill naming a section).
- `check:declared-assets` — links **out** of it resolve (bean `v8gh`).

Neither looks at what the prose ASSERTS about code. Measured 2026-09-20, two
claims had gone false with nothing noticing:

1. *"`resolveSkillDirs` … has **no caller** — so today skill discovery is
   root-only in practice, and a dependency's skills are not yet reachable."*
   It has had a caller since 2026-09-19 (`src/tools/skill-fetch.ts`), and a
   dependency's packages are served.
2. *"This repo is pre-split and declares `schemas/` and `skills/` only."*
   Neither half was true; `harness.json` carries many more entries.

The first is the costly one. A **stale gap notice is worse than none**: an
agent that believes it either avoids the working feature or reimplements it.

## Why the obvious guard is the wrong one

String-matching the prose — "fail if AGENTS.md says `no caller` about a
function that has one" — is a proxy over language, and this session already
paid for one of those: three tests went red on a documentation comment because
they grepped source text rather than code, and the repair was
`codeWithoutComments`. A checker that greps English will cry wolf and be
switched off.

## What might actually work

The claims that went stale both **named a symbol or a path**. A check in the
shape of `check:declared-paths` — every `` `identifier` `` that AGENTS.md
attributes to a named module resolves to an export of that module — would have
caught the first and says nothing about prose it cannot parse. Unresolvable
mentions would need the same `declared-path-literal:`-style escape hatch, with
a stated reason.

That is a real design, not a small one, and it is why this is a bean rather
than part of the fix.

## Done when

- [ ] a claim naming `symbol` in `module` is checked to resolve, or carries a
      declared reason
- [ ] the check reports **could-not-parse** as its own state rather than as a
      pass — a sentence it did not understand is not a sentence it verified
- [ ] falsified against the two real claims above, restored from git history
