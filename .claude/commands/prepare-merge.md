---
description: Get the current branch to a clean, conflict-free, green, pushed state — generic recipe + content-type-specific checks.
argument-hint: "[base branch]  (default: the repo's default branch)"
allowed-tools: Bash(git*), Bash(bun*), Bash(beans*)
---

# /prepare-merge — make this branch mergeable

A **generalized** branch-shipping recipe that ends with content-type-specific
verification. "Prepare-merge" ≠ "merge": it makes the branch *mergeable* and
stops — it does **not** push to the default branch and does **not** open or
merge a PR (those are explicit, separate asks). Full discipline:
`.claude/skills/local/prepare-merge.md`.

Base branch: `$ARGUMENTS` if given, else the repo default (auto-detect:
`git remote show origin | sed -n 's/.*HEAD branch: //p'`, fallback `main`).

## Generic recipe (always)

1. **Clean + committed** — `git status --short` empty (the container is
   ephemeral; commit first).
2. **Fetch** the base + branch (retry on network error): `git fetch origin <base>`.
3. **Integrate if base moved** — compare `git merge-base HEAD origin/<base>` to
   `git rev-parse origin/<base>`; if different, rebase (`git rebase origin/<base>`,
   force-push **with lease**) or merge it in. Resolve conflicts.
4. **Prove it merges cleanly** — `git merge-base --is-ancestor origin/<base> HEAD`
   (clean fast-forward) or `git merge-tree --write-tree origin/<base> HEAD` (trust
   the exit code).
5. **Green check** — run the gates below; do not declare green while sitting on
   pre-existing failures.
6. **Push** the feature branch: `git push -u origin <branch>` (with lease after a
   rebase). Stop here unless explicitly asked to open/merge a PR.

## Content-type-specific verification (the generalization point)

After the generic gates, run the checks for **this folio's content type** (read
`contentType` from `folio.config.json`; default to the platform's own checks).
Prefer the MCP tools (structured findings) when connected; otherwise the scripts.

**Always (platform):**
- `bun test` and `eslint .` green.
- `bun run scripts/gen-schema-docs.ts` and `bun run scripts/gen-skill-docs.ts`
  produce no uncommitted diff (generated docs in sync).

**`contentType: paper` (Lean + LaTeX):**
- `content_validate` — schema + constraints + AST clean.
- `qa_sweep` — no critical findings (dry-run).
- `proof_status` — no regression in sorry/coverage for changed blocks.
- `latex_preflight` — no new unknown macros / overfull boxes.
- `lean_build` / `lean_check` — build green (or unchanged) for touched packages.

**`contentType: who-smart-dak` (L2):**
- BPMN/DMN well-formedness; data-dictionary + value-set validation
  (`content_validate` + terminology checks).

**`contentType: who-smart-ig` (L3 FHIR):**
- `fhir-validation` (SUSHI compile + validator) and `quality-control` (IG QA)
  clean.

**Other / unknown content type:** run the generic gates only, and report which
content-specific checks were skipped (don't claim coverage you didn't run).

## On success

Report: base, integration action (none / rebased / merged), the gates run with
their results, and that the branch is pushed + mergeable. Update the work-plan
(`beans update <id> --status ...`). Do **not** merge.
