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

   **Know what the target covered.** Green is a claim about the files the build
   compiled, which is usually fewer than the files on disk — build targets
   default to a root plus its transitive imports. Confirm the files *you
   touched* were in it (artifact count vs. source count, or build the module by
   name), and scope any corpus-wide number you quote to what actually ran. In
   qou, `lake build` reaches 853 of 1618 Lean modules, so a touched file can be
   green purely by never having been compiled.

   For `contentType: paper` branches that touch content blocks, also run the
   **`block_pdf_render`** gate:
   ```
   bun run scripts/render-changed-blocks.ts [--upload-drive]
   ```
   This compiles a standalone PDF for every changed block and scrapes the
   LaTeX log; `--upload-drive` additionally pushes clean PDFs to Google Drive
   when it is configured. Exits 1 on LaTeX errors (fix required); exits 0 with warnings
   only (advisory); exits 2 on setup problems — including **no local
   `latexmk`**, which is the common case in a container. Exit 2 means the gate
   did **not run**; report it that way rather than folding it into a green,
   per the same honesty rule as the build above.
6. **Push** the feature branch (retry/backoff as in step 2):
   `git push -u origin <branch>`.
7. **Dispatch the repo's CI on the pushed branch, and fold the result into the
   PR.** Local green is not CI green — CI runs on a cold cache, its own
   toolchain, and without whatever build flags you set locally. So after the
   push, trigger the relevant workflow against your branch
   (`gh workflow run <wf>.yml --ref <branch>`, or the `actions_run_trigger`
   MCP tool), wait for it, and put the **run URL and conclusion** in the PR
   body. Red → fix and re-dispatch. Do not open a PR citing a workflow nobody
   ran.

   If you lack `actions: write` and dispatch returns 403, do **not** quietly
   skip it: state in the PR that CI was not run, and give the exact command a
   maintainer should run.

   **Find the workflow by reading `.github/workflows/`, not by name.** The
   example this step used to give — qou's `lean_ci.yml` — was deleted in that
   repo's workflows migration, and an agent following the old text went
   looking for it, found nothing, and guessed `build.yml`, which is a
   *publish* workflow. Guessing a workflow name is how this gate gets skipped
   while appearing to run.

   In qou today the Lean-adjacent gates are `lean-orphan-gate.yml`,
   `lean-content-siblings.yml` and `probe-float64-gate.yml`. **All of them,
   and every other workflow in that repo, are `workflow_dispatch`-only** — an
   owner directive of 2026-06-30 disabled auto-triggers over Actions billing.
   So nothing runs on push or PR, and "CI is green" is never true by default;
   it is only ever true because someone dispatched it.

   Several of those files document a **local equivalent in their own header**
   — e.g. `bun run content/pipeline/lean-orphan-audit.ts --diff <changed .lean>`
   and `python3 scripts/probe-float64-guard.py --diff <changed .py>`. Run
   those; they are the same check without the dispatch. Read the workflow
   before assuming there is no local path.

   *Why this is a step and not advice:* qou's Lean CI last ran 2026-04-25 and
   failed on `main`. Nothing dispatched it for four months, and 37 modules
   silently stopped compiling — several with plain parse errors, i.e. files
   that had never compiled at all. The regression was invisible precisely
   because a workflow existed and no one ran it. Check when CI last ran
   (`actions_list` → `list_workflow_runs`) as part of this step; "there is a
   workflow" is not evidence anything is being checked, and in a
   dispatch-only repo it is evidence of the opposite.
8. **Stop here** unless a PR / merge was explicitly requested. If a PR *was*
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
