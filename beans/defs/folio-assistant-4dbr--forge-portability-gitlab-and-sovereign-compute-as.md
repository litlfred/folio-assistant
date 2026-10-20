---
# folio-assistant-4dbr
$schema: bean/1.0.0
title: 'Forge portability: GitLab and sovereign-compute as additional Tool nodes, not a sixth repo'
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T18:46:11Z
updated_at: 2026-10-20T18:55:00Z
parent: folio-assistant-5a3l
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

    grep -ciE 'github|gh pr|pull request|\bPR\b|mcp__github' skills/sdlc/sdlc-core/coordinate.md   # 94
    grep -cE  'mcp__github|gh api|gh pr|gh issue'             skills/sdlc/sdlc-core/coordinate.md   # 12

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


_2026-09-29_ — **Re-parented `vke6` → `5a3l`** by subject, per todo-manager §"WHICH parent" (owner choice '1 2 3' on the LSI epic-filing proposal, bean ansc). Forge portability (GitLab, sovereign compute) is a deployment topology; the bean itself rejects the sixth-repo reading that put it under SPLIT.

## 2026-10-20 — step 1 done, in review (drain coordinator, session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

litlfred/cat-harness#380: coordinate (+ `coordinate/protocol.md`), pickup, watch, prepare-merge-auto — concrete forge invocations 3/10/4/4/3 → 0; each names the `github` Tool and the operation in neutral words; "change proposal" on first use, PR thereafter. skills:docs:check, skill:commands:check, check:tools pass.

**Found — step 2 is bigger than "author the node":** `tools/github/github.ts` exists but declares no OPERATIONS (one `invoke.shell: "gh"`, wildcard `invoke.mcp: mcp__github__*`), and `schemas/tool.ts` has no notion of an operation. The skills need eight: list change proposals; read change proposal (with checks, comments, reviews); list changed files; comment; resolve review thread; request review; list branches (or `git ls-remote --heads`); subscribe/unsubscribe to activity — the last is the session platform's (`claude-code-remote`), not GitHub's, and probably a separate Tool. A `gitlab` node (step 3) can only demonstrate portability once operations are a declared contract.

_2026-10-20T18:55:00Z_ — **Claimed for step 2** by lane B2, session https://claude.ai/code/session_01Kymnx79TxWvxVoLzcAjBRr, recorded by the drain coordinator (https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6) because B2 cannot push to this state branch. Under the owner's ruling A of today (one Tool node per forge operation, existing Tool fields only), B2 plans github and gitlab nodes for list, read, changed files, comment, resolve thread, request review, create and merge. Each paired node gets a selection record and network remedies. Branch: cat-harness `feat/4dbr-forge-operation-tools`.
