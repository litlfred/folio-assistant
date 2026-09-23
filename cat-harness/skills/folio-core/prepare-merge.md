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

## `fsh-guts` must not reach publication

Before a branch that touches the knowledge graph ships, the published export
must contain no reference to `fsh-guts` — not the graph kind, not the
declared directory, not the skill that documents it, and not an edge naming
any of them. Owner's rule, 2026-09-19.

`scripts/tests/fsh-guts-unpublished.test.ts` asserts it against the built
artefact and runs in `bun test`, so this is checked rather than remembered.
The mechanism, and the three separate emitters that had to be filtered, are
in [`kg-export`](kg-export.md) §"`fsh-guts` NEVER reaches a published graph".

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
   **A conflict in a generated QA sidecar has a command** —
   `bun run qa:resolve-conflicts`. See §"Conflicts in `test/results/`" below
   before resolving one by hand.

   **And after EVERY base merge, conflicted or not, run `bun run regen`.**
   A clean merge is not evidence that the generated artefacts are right — see
   §"A clean merge can produce a wrong artefact" below.
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
   **For a branch that changes a folio's blocks, report review coverage.**
   `content-change-review.bpmn`'s coverage gate (`GW_Covered`, table
   `decisions/review-coverage-gate.dmn`) reads two counts. Report both in
   the PR body, in the gate's own terms:
   - **open defects**: review comments of kind `defect` still `open` or
     `addressed`, from the preview's `review-comments.json`;
   - **changed blocks with neither a verdict nor a waiver**: nothing records
     a per-block verdict yet (bean `px0t`), so write **"not measured"**.
     Never write 0, and never count resolved comments as coverage. A
     resolved comment is not a reviewer's verdict on the block.

   This REPORTS; it does not merge or refuse. The gate belongs to the review
   process, and the committee decides the outcome. A prepare-merge that
   passed a branch whose coverage it could not measure, without saying so,
   would read as "reviewed".
6. **Push** the feature branch (retry/backoff as in step 2):
   `git push -u origin <branch>`. Then **ask whether the push produced a run**:
   `bun run check:head-has-run`.

   This does not change what you do next — step 7 dispatches either way. It
   changes what you can honestly SAY. A push here can silently produce no run
   at all (bean `3pqn`, observed three times), and a pull request showing zero
   checks is indistinguishable from one whose checks have not started, so a
   reviewer cannot tell "CI is coming" from "CI is never coming". If the check
   reports **no run**, write that in the PR body alongside the dispatched run's
   URL — otherwise the PR looks like it is merely early.

   Three states, and the third is not a finding: `could not ask` (no remote, no
   network, 403, 404) means nothing was established, and it must not be
   reported as either answer.
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

## A clean merge can produce a wrong artefact (STRICT)

**`bun run regen` after every base merge.** Not only after a conflicted one —
after every one.

Measured on `main` at `3341108a`, 2026-09-22, bean `lxpq`. Two branches changed
one committed generated file in NON-OVERLAPPING places:

| side | change to `docs/assets/voices/index.json` |
|---|---|
| main | added `tile.voices.count` — a projection declares its own count |
| the branch | added a sixth voice |

One touched the header, the other the array. Git merged them with **no
conflict** and produced a projection declaring `count: 5` while listing 6
voices — an artefact **neither side would ever emit**. It reached `main`.

> **A conflict is a question. A clean merge is an assertion that the result is
> correct** — and for a generated file that assertion is worth nothing, because
> git is merging text it has no way to evaluate.

So the rule is not "resolve conflicts carefully". It is:

> **After a merge, RE-RUN THE GENERATORS. Never read the diff to decide whether
> you need to.** The merged file looks plausible from either side, which is
> exactly what let this one through.

`bun run regen` does it by asking each gate first, so its output is the set of
artefacts the merge actually broke rather than a wholesale rewrite:

```sh
bun run regen             # repair what is stale in the fast gate set
bun run regen --all       # ...including the browser workflows' gates
bun run regen --dry-run   # report what is stale, change nothing
```

It reports four states, and **`unrepaired` is the one to read**: a check that
still fails after its writer ran is a real defect, not staleness, and the
command exits non-zero rather than claiming a repair it did not make. So is a
check with **no writer**.

**Why it is not `qa:resolve-conflicts`, and not bean `520m`.** That command
only ever inspects UNMERGED paths, and here there were none; `520m` is about
generated artefacts that *conflict*, which is noisy but git stops you. This is
the inverse and worse, which is why it is a separate bean with a separate
repair.

**Why it asks the gates rather than regenerating everything.** A blanket
regeneration needs a list, and `gates.ts` already settled where the authority
lives — the workflow, not `package.json`, since 21 of this repository's
`:check` scripts appear in no workflow at all. It also cannot tell repair from
damage: rewriting artefacts that were already correct leaves a diff that says
nothing about what the merge broke.

## Conflicts in `test/results/` — the command, and the 13 files it refuses

**Measured, not impressionistic.** Across one working session on PR #773 and
its successor: **four base merges, four conflicts, every one in a committed
generated QA sidecar and none in authored code.** Bean `520m`.

```sh
bun run qa:resolve-conflicts             # resolve what is safe, report the rest
bun run qa:resolve-conflicts --dry-run   # say what it would do, change nothing
bun run qa:resolve-conflicts --explain   # ...and why, per file
```

**Why regenerating is a resolution and not a guess.** Both writers are
idempotent — `bun run translation:block-qa` and `bun run kg:audit` over an
unchanged tree write nothing, because `sameScriptVerdict` keeps a reproduced
entry verbatim and ignores `reviewed_at`, `reviewed_sha` and
`script_commit_sha`. So a sidecar is a pure function of the tree, and the
merged tree has exactly one correct answer; both sides are stale with respect
to it by definition, which is why *which* side you take does not matter.

That also corrects the first explanation anyone reaches for. These conflicts
are **not** a timestamp both sides restamped — the machinery preventing that
already exists and works. Both sides really had changed the inputs. The verdict
being unchanged does not make the conflict empty; it makes it trivially
resolvable.

> **The 13.** Across all 630 committed sidecars there are **5,883 `script`
> entries and 13 `agent` ones** (11 `block-qa/v1`, 2 `translation-qa/v1`).
> Regenerating blindly is right for 5,883 and would silently destroy 13 — two
> of them in the family that churns most.

The command refuses those files rather than resolving them, checks the same
predicate again *after* regenerating, and leaves every conflict outside the
declared `qa` graph untouched and unstaged. **Resolving one of these by hand is
still fine — but check for a non-script `reviewer.kind` on both sides first**,
which is the one thing a regeneration cannot recover.

And the habit this guards: a conflict an agent resolves without reading teaches
that conflicts in `test/results/` are safe to wave through, which is exactly
what would wave through the one that is not.

**The owner chose the script over a git merge driver**, 2026-09-21. A driver
needs a `git config` step in every clone and CI runner, and the people hitting
these conflicts are mostly agents in fresh containers — where a setup step
nobody ran is a driver that is not there, failing open and silently.

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

- **NO CHECKS IS NOT GREEN — verify against the run list, never the PR page.**
  This is the third state, and it is the one the PR page cannot show you: a PR
  with **zero** check runs renders *identically* to one whose checks have not
  started. Both are "nothing red". Bean `3pqn`.

  It is not rare and it is not theoretical. Six observations on this repository
  between 2026-09-19 and 2026-09-20: a push, a PR opened shortly after, and
  **no `pull_request`-event run ever fires for that head**. The newest run on
  the branch is for the *previous* head — usually the commit the branch's last
  PR had just merged. Three hypotheses have been tested and falsified (a paths
  filter, a ref-update/opened race, app-token suppression), and the elapsed-time
  series is flat: 52 s fail, 45 s pass, 30 s fail, 13 s pass, seconds fail,
  seconds fail. **Waiting longer is not the remedy, and neither is force-push
  avoidance** — two of the six were plain fast-forwards.

  So before calling a branch ready, and **before any merge**:

  0. **Read `mergeable_state` FIRST.** If it is `dirty`, the PR conflicts with
     its base and that is very likely why nothing ran: this workflow is
     `on: pull_request:` with `actions/checkout@v4` and no `ref:`, so it checks
     out `refs/pull/N/merge` — the merge commit GitHub computes between head
     and base — and **a conflicting PR has no such commit**. Measured on
     PR #715, 2026-09-21: the conflicting commit reached `main` 27 minutes
     BEFORE the PR was opened, zero runs fired for that head, and CI fired
     immediately once the base was merged in and the conflict resolved. Bean
     `yv4z`, observation seven; stated there as a refinement of the surviving
     hypothesis rather than as a settled cause.

     **When it is `dirty`, merge the base branch in — do NOT dispatch.** This
     part does not depend on the cause being right: a `workflow_dispatch` run
     resolves `refs/heads/<branch>`, so it tests **the branch, not the merge
     result**. On a conflicted PR that is a green signal for a tree that will
     never exist, which is worse than the absence it replaced. The workaround
     in step 3 is for a MERGEABLE PR whose run never fired.

  1. Read the PR's `head_sha`.
  2. `mcp__github__actions_list` → `list_workflow_runs`, filtered by branch, and
     find a run whose `head_sha` matches.
  3. **No run for that sha → the branch is NOT ready**, whatever the PR page
     shows. Say so in those words rather than "checks pending", and re-run them
     with `mcp__github__actions_run_trigger` → `run_workflow` against the branch.
     That is the workaround every one of the six needed; it is written here
     rather than left as folklore (`3pqn` Done-when 3).
  4. Re-check after **every** push. A new commit moves the head, and the head is
     what the absence attaches to — measured on PR #552, which hit this twice in
     eight minutes, on two different commits.

  **Why this sits under a guardrail rather than in the recipe.** An agent
  holding a standing merge authorisation will read zero checks as nothing-red
  and merge unverified. That is not a hypothetical either: the session that
  wrote this rule was operating under exactly such an authorisation when #552
  reproduced the bug, and was one step from merging a PR with no coverage at
  all. The same three-state discipline the rest of this repository applies to
  `check:l1-complete`, `ci-health` and `toc_source` — **could-not-determine is
  never rendered as clean** — has to reach the merge decision too, because that
  is where it costs the most.
- **One branch.** Develop on the assigned `claude/*` branch; moving work to a
  different branch needs explicit permission.
- **NEVER DELETE A FEATURE OR STAGING BRANCH** without explicit assent from the
  user or the repository owner. Not after a merge, not as cleanup, not to quiet a
  tool that complains about it, and never by passing `--delete-branch` or its API
  equivalent. A merged branch is still the record of how the work was done, the
  base a revert or a follow-up is cut from, and the ref a staging deploy is served
  under; deleting it is irreversible from the agent's side and buys nothing the
  owner asked for.

  **This is stated in [`prepare-merge-auto.md`](prepare-merge-auto.md) too** —
  Phase 4 step 4 and Phase 5 — and it was stated there *only*, which is how it got
  broken. `AGENTS.md` §More, "Shipping a branch", points at THIS file, so an agent that
  followed the pointer never met the rule: measured 2026-09-19, a session proposed
  "deleting the branch after each merge" as a way to stop a stop-hook false
  positive. If you change one copy, change the other.

  **When a tool or hook complains about a branch, fix the tool.** The false
  positive above was a stop hook counting a branch restarted from the default
  branch as having unpushed work; the answer was a reachability check in the hook,
  not a deletion.
