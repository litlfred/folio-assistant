---
# folio-assistant-j2w4
title: gates reads ONE workflow; CI runs five
status: todo
type: task
priority: high
created_at: 2026-09-20T07:34:29Z
updated_at: 2026-09-20T07:34:33Z
parent: folio-assistant-1xhc
---

Measured 2026-09-20, by a CI failure the local gate runner had just passed.

`scripts/gates.ts` derives its list from `GATES_WORKFLOW = .github/workflows/code-quality-gates.yml` — one file. Four other workflows carry `bun run` steps that CI executes and no local command does:

| workflow | bun steps |
|---|---|
| code-quality-gates.yml | 19 (the gate set) |
| docs-site.yml | 7 |
| jsonld-gen-check.yml | 4 |
| feature-staging.yml | 3 |
| section-title-audit.yml | 1 |

## How it announced itself

`jsonld-gen-check.yml` runs FOUR generators in `--check` mode; the `gen:jsonld:check` npm script that the gate runner invokes ran THREE — `gen-site-jsonld` was missing. A change adding a node to a docs page passed `bun run gates --all` (46 gates) and failed CI. The one-line subset was fixed in the same commit as this bean; the general gap was not.

**"Green locally" and "green in CI" are two different claims while this holds**, and the difference is invisible: the gate runner reports a clean run over the steps it knows about, which is the `dh4f` shape applied to a checker rather than a directory.

## Not simply "add the other four"

Some steps are legitimately CI-only — a `gh-pages` push, a staging deploy, anything needing a token or a browser the fast set deliberately skips. The work is to separate *CI-only by nature* from *locally runnable and merely absent*, and to make the second set reachable. A list of exclusions with reasons, like `workflow-policy.json` relaxations, is the shape that has worked here before.

## Done when

- [ ] every `bun run` step in every workflow is either in the gate set or declared CI-only WITH A REASON
- [ ] `gates --list` says which workflows it covers, so the subset is visible rather than assumed
- [ ] a check that the two do not drift — a new workflow step lands in one list or the other
