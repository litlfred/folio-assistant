---
# folio-assistant-4dbr
title: 'Forge portability: GitLab and sovereign-compute as additional Tool nodes, not a sixth repo'
status: todo
type: task
created_at: 2026-09-18T18:46:11Z
updated_at: 2026-09-18T18:46:11Z
parent: folio-assistant-vke6
---


Opened 2026-09-18 at the owner's direction: "github ok for now, bean for future
gitlab / sovereign-compute use".

## The decision this records

The five-repo split proposal (#223) considered a sixth repository,
`agent-harness-github`, holding the four PR-choreography skills
(`prepare-merge-auto`, `pickup`, `watch`, `coordinate`) so the harness could run
on another forge or none. **Rejected in favour of isolating the forge at the
Tool layer.**

Measured on `main` before deciding. The four skills total 1,404 lines.
`coordinate.md` alone is 731 lines with 94 matches for GitHub-ish terms, of
which only **12** are concrete invocations:

    grep -ciE 'github|gh pr|pull request|\bPR\b|mcp__github' skills/folio-core/coordinate.md   # 94
    grep -cE  'mcp__github|gh api|gh pr|gh issue'             skills/folio-core/coordinate.md   # 12

The other 82 are conceptual — "pull request", "PR", "GitHub" as a noun. So the
split would have moved 1,404 lines of already-portable prose to isolate a few
dozen lines of mechanism, cutting along a repository boundary to separate
things not separable at that grain.

## What is therefore outstanding

Adding GitLab is then a **second Tool node satisfying the same skills**, not a
fork. Three pieces, none started:

1. **Migrate the four skills to the SOP.** They currently carry invocations
   inline. `skills/folio-core/skills-and-tools.md` is the standard; the skills
   themselves have not been rewritten to it. This is the bulk of the work and
   it is mechanical: ~12 concrete call sites in `coordinate.md`, fewer in the
   other three.
2. **Author the `github` Tool node**, once `schemas/tool.ts` exists. Its
   `invoke.shell` arm (`gh`, or the REST call it wraps) is the one the harness
   relies on; `invoke.mcp` is the convenience a server-equipped instance may
   take instead.
3. **Then `gitlab`** — the actual portability test. Until a second forge node
   exists, "the skills are forge-neutral" is an assertion, not a demonstration.

## Vocabulary, which is the part that will be missed

GitHub says pull request, GitLab says merge request, Gerrit says change. A
skill whose only statement of what to do is `gh pr create` has picked a
vendor's noun in the one place an agent must act from. The rule in
`skills-and-tools` is the neutral term on first use and the local term
thereafter — not a scrub of every occurrence, which produces unreadable prose
and is worse.

## Sovereign compute

Distinct from the forge question and worth keeping distinct. Forge portability
is about which *service* hosts change proposals. Sovereign compute is about
running with no external service at all — which additionally needs the no-MCP
property (`agentic-harness` reads files, does not require a tool server) and
the `beans-manual` Tool node (the work plan is editable by hand when no CLI can
be installed). Both are already decided and recorded; neither is exercised.

**Not urgent.** Nothing is broken. This is a portability claim the repo now
makes in its architecture documentation and has not yet tested.
