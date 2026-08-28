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

## Content types — `document` is the base, `paper` extends it

A **document** folio is structured prose: policy guidance, a standard, a report.
A **paper** is that plus the seven block kinds whose assertion is a formal
mathematical claim, backed by `.lean` siblings and typeset through LaTeX.

That relation is encoded, not just described. `PaperContentAdapter` extends
`DocumentContentAdapter`; `MATH_BLOCK_KINDS` is written out in
`schemas/block-kinds.ts` and `DOCUMENT_BLOCK_KINDS` is its **derived**
complement, so a kind added to `BLOCK_KINDS` cannot go unclassified.

**Profiles are a different axis from adapters, and conflating them is costly.**
Adapters (`paper`, `dak`) partition kinds into disjoint namespaces;
`adapterForKind` is what QA criterion scoping reads, and it must stay total and
unambiguous. Profiles (`document`, `paper`) *nest*: every document kind is also
a paper kind. Making `document` a third adapter would have made
`adapterForKind` ambiguous on all eight shared kinds. When you add a content
type, ask whether it needs different **code** or only different **rules** — if
only rules, it is a profile plus a subclass, not an adapter.

Enforcement is `content/pipeline/profile-check.ts`, run on every
`content_validate`. It catches what schema validation structurally cannot: a
`theorem` is a valid `theorem` whatever folio it sits in, and `constraints.ts`
cannot read `folio.config.json`. Two rules — kind within profile, and (document
only) no `lean` field and no `.lean` sibling, because `remark`, `example`,
`algorithm` and `simulator` all *declare* an optional `lean` that the type
permits and the profile forbids.

**The document render path takes no TeX.** `content/pipeline/render-markdown.ts`
assembles the folio to one Markdown file; `document_render_{md,html,pdf}` take
it through pandoc, the PDF via weasyprint/prince/wkhtmltopdf. It never falls
back to `latexmk`, deliberately — a PDF that silently came out of LaTeX would
misreport what the folio needs to build, and the next person on a clean machine
pays for that. It is registered for **both** content types, because it is the
render that works while drafting on a machine with no TeX.

**There is no `recommendation` block kind.** A normative statement is carried
by a labelled, titled `prose` block; `skills/folio-document-adapter/normative-statements.md`
states the convention and its limits. Adding a real kind means a builder, a Zod
schema, a label prefix, viewer registration, constraint rows and QA criteria —
about thirty files — and it is tracked separately rather than half-done. Note
that `document-intake.md` still maps guideline recommendations onto
`definition`; that predates the document profile and is wrong for a document
folio, where `definition`'s `lean` field is required.

## Starting a new folio

`bun run init-folio --help`, or the `folio_init` MCP tool. It writes `content/`,
`uploads/`, `library/`, the document + chapter + first block manifests,
`folio.config.json`, the `content/schema/` builder shim, `AGENTS.md` with
`CLAUDE.md`/`GEMINI.md` stubs, `.mcp.json`, the session-start hook and the beans
store — and links the platform as a submodule or a sibling checkout.

Two things about it worth knowing before you edit it. The builder shim exists so
the path to folio-assistant is written down **once**: block manifests import
`../schema/builders`, never the platform directly, so re-linking is a two-file
edit rather than a corpus sweep. And `folio_init` is registered among the
**generic** tools, not in an adapter, because it runs before the folio has a
content type — a bare repo falls back to the paper adapter, so an
adapter-scoped tool would be unreachable in exactly the case it exists for.

## Commands

```sh
bun install                 # install deps
bun run src/index.ts --http # run the assistant (HTTP);  --stdio for stdio MCP
bun test                    # unit tests
bunx playwright test        # e2e tests   (npm script: test:e2e)
eslint .                    # lint
bun run src/index.ts --check-deps   # probe environment capabilities
bun run init-folio --help           # scaffold a new folio repository
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

> **Check before you create (STRICT).** `beans create` is **not** idempotent —
> it mints a fresh ID on every call and dedupes on nothing, so re-entering a
> work-plan step duplicates the plan instead of no-op'ing. Before **every**
> `beans create`, including the session milestone, run the exact-title
> existence check in [`skills/folio-core/todo-manager.md` §Check before you
> create](skills/folio-core/todo-manager.md); on a match, claim the existing
> bean with `beans update <id> --status in-progress` instead. History: in the
> `qou` folio an unguarded re-run of that step ~980 times on 2026-08-04
> produced **14,688** duplicate beans — 92 % of every open bean in the repo —
> which starved the idle-backlog policy of signal, collided with the IDs of 15
> real beans, and corrupted a later agent's own corpus-grep.

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

### Say which bean you are on — every turn

Claiming a bean records the work; **reporting** it is what lets a human steer and
a sibling session avoid you. Both are required.

**When you begin work on a bean**, open that turn by naming it and what you are
attempting — before the first tool call, not after the work lands:

> **Starting `fwr7`** — retargeting the seven edges the forward-ref arc left
> alone, because the edge is wrong rather than the block's position.

**End every turn** with the beans you touched and what is next. One line each,
**up to 50 words** — enough that a reader can act without opening the file:

> **Beans**
> - **worked** `fwr8` — Re-baselined both endpoints with the fixed parser: the
>   arc is 274 → 195, not 274 → 192. Corrected my own claim that the start was
>   understated; only post-mid-arc figures are short by 3.
> - **next** `fwr7` — Retarget seven mis-aimed edges. Two are now confirmed
>   detangler findings rather than reader reports, which raises their priority.

Rules that make the report worth reading:

- **A name and five words is not a synopsis.** Say what changed, or why the next
  item is next. "Retarget seven edges" is a title; "two are now confirmed
  findings, which raises their priority" is a reason.
- **"Next" is your judgement, not a fact.** Beans carry no priority order beyond
  what an agent asserts — so say why, and expect to be overruled.
- **Prefix across repos** (`qou/fwr7`, `fa/fsl7`) when a turn spans both.
- **Report unclaimed work as unclaimed.** If you did durable work without a bean,
  say so and open one; that omission is the failure this exists to catch.

Full discipline: `.claude/skills/local/todo-manager.md` and
`.claude/skills/local/bean-coordination.md`.

> Not to be confused with the content-review **feedback** workflow (the
> `todo-review` skill over `feedback/<paper>/*.ts`) — that is a separate domain
> feature, not the agent work-plan.

## CI health — a red workflow looks exactly like a green one from in here

`docs-site.yml` fired on every push to `main` and **failed all 30 times** over
two months. The trigger was fine; the *outcome* was invisible, so the published
site sat stale and nothing in the repo said so. Bean `xom7`.

`bun run check:ci-health` reports each workflow's state on the default branch —
consecutive failures, days since the last green, and whether it has run at all
recently. The session-start sweep prints it, so it lands where you already look.
Three rules it follows, and you should too when reading it: **"could not check"
is never rendered as green**; a red that has not re-run in a week is flagged as
possibly stale rather than as an active fire; and a red whose **workflow file
changed after the failing run** is reported as `superseded` — the version that
failed is gone, so the verdict is stale. `superseded` is never rendered as green
and never counted as a live failure, because a later edit is evidence the
failing version is gone, not evidence the new one works.

That third rule exists because two of this repo's workflows would otherwise be
red forever. `witness-refresh.yml` and `qa-sweep.yml` failed to *parse* on
2026-08-07 — which is why GitHub ran them on `push` despite both being
`workflow_dispatch`-only, and why their runs are named by path rather than by
`name:`. They were fixed the next day. They only run on dispatch and the report
only reads the default branch, so nothing will ever run them here again. Bean
`lq7e`. **Do not "fix" them by dispatching**: both fail by design in this repo —
`qa-sweep` preflights on `content/package.json` and `witness-refresh` needs
`folio-assistant/computations/`, and the platform carries no folio.

**A report is only read by someone in the room.** The session-start sweep covers
every day somebody is working; the failure being guarded against is a quiet
stretch with nobody looking, which is exactly the stretch in which no session
starts either. So `.github/workflows/ci-health.yml` runs the same check weekly
and maintains **one** tracking issue labelled `ci-health` — opened when the
default branch has a live failure, edited in place while it persists (an edit
does not notify, so a long outage stays one unread item), and closed
automatically when `main` is clean. It deliberately does not send another
email: GitHub sent 30 and the premise of `xom7` is that nobody reads them. The
three live badges at the top of `README.md` are the same state at the front
door. Bean `ynu8`.

Two things about that workflow are load-bearing rather than incidental. It
checks out with `fetch-depth: 0`, because the `superseded` rule asks `git log`
when a workflow file last changed and a shallow clone cannot answer — which
would resurrect the false fires it exists to retire. And on "could not check"
(exit 2) it leaves the tracking issue **untouched** and fails the job, rather
than closing it: the watchdog going blind must not read as good news, and a red
`ci-health.yml` is itself reported by next week's run.

Complements `5rfy`, which fixed workflows that never *fire*. This is the
opposite defect — one that fires constantly and fails every time.

## At session start

Surface the work-plan before starting: run `beans prime` (and `beans list`), or
`scripts/session-start-coord-sweep.sh` for the CLI-independent surface (current
bean list parsed from `.beans/`, plus how far the default branch has moved and
recent sibling `claude/*` branch activity). Heavy triage of new commits belongs in
a background subagent, not the foreground.

## More

- **`uses[]` and `interprets` are the EDITORIAL relation** — what a *reader*
  must have read to follow a block. Agent/human maintained, part of the authored
  content. `uses[]` is the curated list; `interprets` states the same
  reader-facing fact for a remark or example about one specific block, and since
  2026-08-15 (bean `i8ad`) `content-graph.ts` counts both. Each editorial edge
  carries `editorialField` so a tool proposing an *edit* can still tell which
  field an author wrote — they are interchangeable to a reader, not to a writer.
  **Two caveats worth knowing before you quote a number:**
  `detangler-no-forward-ref` builds its own `uses`-only adjacency in
  `loadChapterGraph` and does **not** consume `content-graph`, so it is
  unaffected and ten forward-pointing `interprets` edges are outside what it
  counts; and the graph is no longer acyclic — genuine editorial cycles are
  revealed rather than introduced (see `i8ad`). **Do not quote a count from
  here**: it was 1 when `i8ad` was measured and 4 a few hours later on merged
  content, none of it caused by the change. Run the check against the corpus
  in front of you.
  It is **not** the formal dependency graph; that is machine-derived from
  `lean.ref`. The two diverge legitimately in both directions (a proof invokes
  `simp` lemmas nobody reads about; a theorem is motivated by an example it
  never cites). **Never populate `uses[]` from Lean** — it destroys the signal
  every ordering metric is computed from. For impact questions ("what breaks if
  this changes?") use the union via `content/pipeline/content-graph.ts`, whose
  accessors default to it. Auditing: the `uses` QA axis (mechanical) plus the
  `uses-editorial-review` skill (human/agent). Contract: `BlockBase.uses` and
  `RemarkBlock.interprets` in `schemas/types.ts`.
- Lean tooling roadmap (Lean Atlas / Compass, Nazrin, refactor cluster,
  LeanDojo) — where each earns a place and how it wires into existing skills:
  `docs/proposals/llm-authoring-tool-integration.md`.
- **Every process in this repo is BPMN** — six `.bpmn` files under
  `docs/workflows/`, indexed by `docs/publication-workflow.md`. Read that page
  before changing how a proposed edit is validated, who approves what, or where
  beans are claimed: it is the normative picture of the HCI validation gate
  (mechanical + non-mechanical), the draft-review-publish path, and the work-plan
  lane. Three are content-agnostic (`editing-hci-validation`,
  `draft-to-publication`, `content-lifecycle`); three are per content type
  (`authoring-a-paper`, `l2-dak-authoring`, `l3-fhir-pipeline`).
  **The `.bpmn` is the source of truth**; `docs/assets/img/workflows/*.svg` is
  generated — run `bun run render:bpmn` after editing one, and
  `bun run render:bpmn:check` fails if an SVG is stale. Each activity carries a
  `<folio:skill ref="…"/>` extension naming the skill that implements it, and
  `<folio:bean store=".beans/"/>` where it touches the work plan — add both when
  you add an activity.
  **Adding a diagram:** if it has actors, activities and a control flow, it is a
  process — author it as BPMN under `docs/workflows/`, not as a Mermaid fence.
  Mermaid stays for the things that are *not* processes (component maps, the
  role-inheritance lattice, the docs navigation graph); the audit of which is
  which is in `docs/publication-workflow.md`.
- **The diagrams are executable** — `workflow_list` / `workflow_start` /
  `workflow_next` / `workflow_complete` (MCP) run a process from
  `docs/workflows/*.bpmn`. `workflow_next` tells you what is enabled **now**,
  which lane owns it and which skill implements it; `workflow_complete` refuses
  a step that is not enabled, so work cannot be claimed out of order. State is
  committed under `.folio/workflow/`, like beans, so a sibling session sees it.
  **The base processes are STRICT.** `editing-hci-validation`,
  `draft-to-publication` and `content-lifecycle` carry
  `<folio:policy enforcement="strict"/>`: `workflow_gate` refuses a step that is
  not enabled. The per-content-type processes are `advisory` — their package
  owns what adequate means in that domain. Absent policy means strict.
  **To relax a base step**, declare it in `skills/<package>/workflow-policy.json`
  with a **reason** — no reason, no load — and never a step marked
  `relaxable="false"` (`Task_ReviewFindings`, `Gateway_EditorDecision`,
  `Task_Commit`, `Task_AuthorizeRelease`, `Task_PublishRelease`: the editor
  seeing the findings, the decision, the write, and release authorisation).
  `bun run check:workflow-policy` validates every relaxation and runs in CI.
  Rationale: `docs/proposals/workflow-orchestration.md` §4.
  **The commit boundary enforces it.** `scripts/check-corpus-gate.ts`, run in a
  folio repo from a pre-commit hook or CI, refuses a changed block that no
  instance records the editor having authorised — no instance, not past the
  decision, or discarded. It refuses when it cannot tell, too: a file that reads
  as a manifest but will not import is refused rather than waved through.
  `.qa.json` is excluded (the sweep writes it). Use `--warn` to adopt gradually.
  **Some gateways are computed, not chosen.** One carrying `<folio:decision/>`
  is backed by a DMN table in `docs/workflows/decisions/`: pass `facts` (e.g.
  `{ failCritical: 0, failMajor: 2 }` from `qa_sweep` totals) and the table
  returns the branch. `workflow_complete` refuses a hand-supplied `outcome`
  there — asserting the answer would defeat the point. Adding one means adding
  the `.dmn`, the `folio:decision` ref, and nothing else: the loader checks
  every outcome the table can return names a real branch.
  **Bean-marked steps are the bean operation, not a note about it.** An activity
  with `<folio:bean op="claim|note|resolve"/>` performs it on the instance's bean
  when you complete the step: `claim` sets `in-progress` (idempotent), `note`
  appends what you pass as `note`, and `resolve` completes the bean **only once
  the instance itself has completed** — a still-running process gets a note,
  because whether work is done is a judgement and `AGENTS.md` says a bean is not
  closed on someone else's say-so. `work_plan_prime` reports every instance's
  position next to its bean, so the plan and the process are one answer.
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
