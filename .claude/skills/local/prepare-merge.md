# Prepare-merge — get a feature branch ready to land

Canonical, repo-agnostic skill for taking a `claude/*` (or any feature) branch
to a **clean, conflict-free, green, pushed** state so it can be merged with no
surprises. This is the **generic source of truth**; downstream repos (e.g. qou)
vendor or sync it rather than hand-maintaining their own copy.

**"Prepare-merge" ≠ "merge".** It makes the branch *mergeable* and stops. It
does **not** push to the default branch and does **not** merge a PR. Both are
outward-facing, hard-to-reverse actions — do them only on an explicit request.

## The problem this solves

"prepare-merge" / "make it mergeable" / "ship it" is a plain-English ask, not a
built-in command. Without a codified recipe each agent re-derives the steps and
may do them inconsistently or unsafely (force-push over a sibling, push straight
to `main`, declare green while sitting on pre-existing failures). This skill is
the one recipe.

## Recipe

1. **Clean + committed.** `git status --short` must be empty. Commit outstanding
   work first (the container is ephemeral — uncommitted work is lost on resume).
2. **Fetch the base + your branch** (retry on network error, backoff 2/4/8/16s):
   `git fetch origin <base> <branch>`.
3. **Integrate if the base moved.** Compare `git merge-base HEAD origin/<base>`
   to `git rev-parse origin/<base>`:
   - **Equal** → base hasn't moved; nothing to do (your branch is a clean
     fast-forward).
   - **Different** → rebase onto the base: `git rebase origin/<base>` (preferred
     for a linear history) or merge it in. Resolve conflicts, then re-run the
     green check. A rebase needs a force-push **with lease**:
     `git push --force-with-lease` — never a bare `--force` (it clobbers sibling
     pushes).
4. **Prove it merges cleanly** (no assumptions):
   - `git merge-base --is-ancestor origin/<base> HEAD` → success means a clean
     fast-forward: git fast-forwards without running a merge, so conflicts are
     impossible. This alone is sufficient.
   - Otherwise (base moved, not yet rebased) dry-run with the modern form and
     trust its **exit code**: `git merge-tree --write-tree origin/<base> HEAD`
     (exit 0 = clean; non-zero = conflicts; add `--name-only` to list the
     conflicted paths). Do **not** grep the old three-arg output for
     `<<<<<<<` / "changed in both" — that false-positives on files which
     legitimately contain those literals (docs about merge conflicts, test
     fixtures — this very skill tripped that check when it was first run).
5. **Green check.** Run the project's tests/build (here: `bun test`, plus
   `bun build <file> --target=bun` for type-checking touched files). Report
   **honestly**: distinguish failures you caused from pre-existing ones (diff the
   counts against a baseline run on the merge-base). Do not call a branch green
   by silently inheriting red.
6. **Push** the feature branch (retry/backoff as in step 2):
   `git push -u origin <branch>`.
7. **Stop here** unless a PR / merge was explicitly requested. If a PR *was*
   requested, see below.

## Opening the PR (only when asked)

GitHub access here is via the **GitHub MCP server**, whose tools are
**deferred** (lazy-loaded). At session start they appear as names only — you
cannot call them until you load the schema:

```
ToolSearch  "select:mcp__github__create_pull_request"
```

Then call `mcp__github__create_pull_request` with `owner`, `repo`, `head`
(the feature branch), `base`. This "load-then-call" round-trip is by design —
not a failure — and is needed once per deferred tool per session. The same
applies to every `mcp__github__*` tool (review, comment, merge, CI status).

PR body convention: end with the Claude Code footer + session link (see the
harness git instructions). Do not include the model identifier in the PR.

## Guardrails

- **Never push to the default branch** and **never merge a PR** without an
  explicit ask. Prepare-merge leaves the decision to the human.
- **`--force-with-lease`, never bare `--force`** when a rebase rewrote history.
- **Honest green.** Pre-existing red is reported as pre-existing, with evidence;
  your-change red blocks the "ready" claim.
- **One branch.** Develop on the assigned `claude/*` branch; moving work to a
  different branch needs explicit permission.
