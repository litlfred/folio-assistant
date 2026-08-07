# AGENTS.md — folio-assistant

Cross-repository agent skills framework (unified skill management, RBAC, capability
detection). This file is the **agent-generic** source of truth, read natively by
Claude Code, Gemini CLI, Antigravity, Cursor, Copilot, and others. Tool-specific
files (`CLAUDE.md`, `GEMINI.md`) should be thin stubs that point here.

> **folio-assistant is the platform, not the content.** It holds the skills,
> schemas, pipeline, and MCP server an agent uses to author a *folio* — a paper,
> a WHO SMART Guideline, an IG — which lives in a **separate** repository. If you
> are about to write subject matter here (a chapter, a constant, a vocabulary),
> you are either in the wrong repo or writing something that belongs in the
> folio as data.

## New here? Start with the onboarding guide

**[`docs/guides/agent-onboarding.md`](docs/guides/agent-onboarding.md)** — the
orientation this file is not. Which repo you are in and why it matters, what to
run in your first five minutes, how to find the right skill instead of
improvising one, the content-object triple, the two dependency relations, beans,
QA sidecars and axes, and where to look things up.
Published at
<https://litlfred.github.io/folio-assistant/guides/agent-onboarding.html>.

Read that first. **The rest of this file is a reference** — commands and
conventions to come back to, not a path through the project.

## Commands

```sh
bun install                 # install deps
bun run src/index.ts --http # run the assistant (HTTP);  --stdio for stdio MCP
bun test                    # unit tests
bunx playwright test        # e2e tests   (npm script: test:e2e)
eslint .                    # lint
bun run src/index.ts --check-deps   # probe environment capabilities
```

## Work-plan & todos — use `beans`

`beans` ([hmans/beans](https://github.com/hmans/beans)) is the **single todo
mechanism** for agent work — both session-local and cross-session/cross-agent
coordinated work. Do **not** stand up a separate todo store (no API route,
dashboard, or `todos/*.json` work-plan); beans is it.

```sh
scripts/install-beans.sh                 # install the CLI if missing
beans prime                              # emit work-plan priming for agents
beans list                               # current open items
beans create "<title>"                   # open a work-plan item
beans <id> --status in-progress          # claim an item (durable, visible to siblings)
```

- **Session todos:** track anything you want to persist as beans, not in your
  agent's ephemeral in-memory todo list — `.beans/` is committed, so the plan
  survives a resume in a fresh container.
- **Cross-session / cross-agent todos:** the same committed `.beans/` store is the
  shared work-plan. **Claim before you work** (set `in-progress` + note your
  branch) so two sessions don't pick the same item; never resolve or delete a
  sibling's bean.
- **`beans ≠ sidecars`:** never `beans create` bulk machine-generated queues (QA
  `*.qa.json`, witness `*.witness.json`, watcher queues) — keep those as bulk JSON.
- **Move wiring and script together:** when relocating a hook-backed script or a
  queue, repoint every reference (docs, hooks, readers) in the same change.

Full discipline: `.claude/skills/local/todo-manager.md` and
`.claude/skills/local/bean-coordination.md`.

> Not to be confused with the content-review **feedback** workflow (the
> `todo-review` skill over `feedback/<paper>/*.ts`) — that is a separate domain
> feature, not the agent work-plan.

## At session start

Surface the work-plan before starting: run `beans prime` (and `beans list`), or
`scripts/session-start-coord-sweep.sh` for the CLI-independent surface (current
bean list parsed from `.beans/`, plus how far the default branch has moved and
recent sibling `claude/*` branch activity). Heavy triage of new commits belongs in
a background subagent, not the foreground.

## More

- **`uses[]` is the EDITORIAL relation** — what a *reader* must have read to
  follow a block. Agent/human maintained, part of the authored content.
  It is **not** the formal dependency graph; that is machine-derived from
  `lean.ref`. The two diverge legitimately in both directions (a proof invokes
  `simp` lemmas nobody reads about; a theorem is motivated by an example it
  never cites). **Never populate `uses[]` from Lean** — it destroys the signal
  every ordering metric is computed from. For impact questions ("what breaks if
  this changes?") use the union via `content/pipeline/content-graph.ts`, whose
  accessors default to it. Auditing: the `uses` QA axis (mechanical) plus the
  `uses-editorial-review` skill (human/agent). Contract: `BlockBase.uses` in
  `schemas/types.ts`.
- Lean tooling roadmap (Lean Atlas / Compass, Nazrin, refactor cluster,
  LeanDojo) — where each earns a place and how it wires into existing skills:
  `docs/proposals/llm-authoring-tool-integration.md`.
- Migration plan + cross-repo coordination: `docs/folio-assistant-migration.md`.
- Skills live under `skills/` (packages) and `.claude/skills/` (local + capabilities).
- Shipping a branch — `/prepare-merge [base]` runs the generic recipe plus this
  folio's **content-type-specific** gates (paper → content_validate / qa_sweep /
  proof_status / latex_preflight / lean_build; WHO IG → fhir-validation / QC),
  then pushes. It does not merge. Command: `.claude/commands/prepare-merge.md`;
  full discipline: `.claude/skills/local/prepare-merge.md`.
- Watching a sibling PR — `/watch <pr|branch>` subscribes to a PR's CI / review /
  comment activity and follows through until it's merged or closed:
  `.claude/commands/watch.md`.
- User-facing docs site (README + install + guides + generated schema/API
  reference): `docs/` → published to <https://litlfred.github.io/folio-assistant/>
  by `.github/workflows/docs-site.yml`. Regenerate the generated references with
  `bun run scripts/gen-schema-docs.ts` (schema reference → `docs/reference/skills/*`)
  and `bun run scripts/gen-skill-docs.ts` (instruction bodies →
  `docs/reference/skill-instructions/*`). Never hand-edit either generated dir.
