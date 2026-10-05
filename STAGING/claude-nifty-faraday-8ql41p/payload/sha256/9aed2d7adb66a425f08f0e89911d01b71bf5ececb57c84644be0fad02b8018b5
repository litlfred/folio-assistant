---
# folio-assistant-pw9j
title: Bump bootstrap/bootstrap-tools pins to the fixed upstream (f75a216 / 3046412); re-extract translation templates
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T15:09:20Z
updated_at: 2026-10-01T15:57:57Z
parent: folio-assistant-7x5n
---

Upstream fixed 2026-10-01: bootstrap#1 (f75a2167d226) and bootstrap-tools#4 (30464126ed93) — READMEs reproducible via published-IRI term links, each repo checks its own README in CI. Main pins PR0's 7a91356 / c5e5e25. Bump both gitlinks, re-extract bootstrap translation templates (translate-bpmn --extract), regenerate bootstrap kg-qa sidecars and SVGs, gates green.
## Done when
- [ ] pins at f75a216 / 3046412 on main
- [x] translate-bpmn:bootstrap:check, kg:audit:all:check, render:bpmn:check, readme:sync:all:check green — all exit 0 locally on 30af5bd8215 (PR #1790), plus check:instance-graph

_2026-10-01T15:57:53Z_ — Claimed by claude/blissful-ride-c2f26u-pin-bump — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Blocker (2026-10-01, PR #1790 @ 30af5bd8215)
`readme:sync:bootstrap:check` (CI step "bootstrap's README generated sections are current", code-quality-gates.yml) goes RED at the new pins and cannot be regenerated here. bootstrap-tools 3046412 emits a generated-by notice inside each `kg:*` region of bootstrap/README.md; folio-assistant's own `readme-sections.ts --dir bootstrap` renders without it, so the two generators disagree. `regen` "repairs" it by writing bootstrap/README.md inside the submodule (strips 9 lines) — a change this repo cannot commit. `--all` already skips submodule roots (isSubmoduleRoot, bean kye5) but `--dir` does not. Needs a code change: retire the `readme:sync:bootstrap(:check)` scripts + CI step (consistent with owner D3 "each repo owns its README"), or apply the isSubmoduleRoot skip to `--dir`. Not guessed; reported to the lead.

**Resolved (lead, option 1):** `readme:sync:bootstrap(:check)` and its CI step are retired — the owner's ruling "each repo owns its README" (2026-10-01); bootstrap's own CI now checks its README (litlfred/bootstrap#1, check.yml), so the check moved to its owner rather than being dropped.
