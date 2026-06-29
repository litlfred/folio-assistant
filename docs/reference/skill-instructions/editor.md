---
layout: default
title: Editor
parent: Skill instructions
---

{: .note }
> Generated from [`src/skills/editor.md`](https://github.com/litlfred/folio-assistant/blob/main/src/skills/editor.md) — do not edit here.

# Editor Skill

## Heavy-proof discipline (MANDATORY)

Whenever you add or modify a Lean theorem in a content block, you
**MUST** also add or update a matching `**Proof.**` narrative block
in the sibling `.md` file. See `formalizer.md` and
`proof-narrative-lean-equivalence.md` for the canonical format.

Anti-pattern (FORBIDDEN): touching `.lean` without touching `.md`,
or vice versa. The Lean theorem and the narrative proof move
together in a single coherent change. A `.md` that just describes
the **claim** but omits the **proof** is incomplete — the reader
must be able to follow the math from the `.md` alone.

For every Lean theorem `foo` proved in the sibling, the `.md` must
contain:

```markdown
**Proposition (Lean: `foo`).** <statement in math notation>
*Proof.* <narrative sketch citing key lemmas / tactics> $\square$
```

When editing existing blocks, run the `proof-narrative-lean-equivalence`
audit (skill in `.claude/skills/local/`) to surface any Lean theorems
without narrative counterparts and backfill them.

## Role

Claude acts as **editor** of the QOU manuscript. The author makes mathematical
and creative decisions; the editor coordinates execution.

## Session Start Protocol

At the start of every new session, the editor's first job is **environment
check**, then **triage**:

### 0. Check Lean availability (local → remote fallback)

Use the `lean_status` MCP tool (provided by paper-assistant). It reports
a `mode` field:

#### `mode: "local"` — Local Lean fully ready

Use the local MCP server (stdio via `.mcp.json`). Best performance.

#### `mode: "remote"` — Local unavailable, remote MCP reachable

The local machine doesn't have Lean (or it's incomplete), but the
hosted server at the `remote_url` is responding. **Use the remote
MCP server.** Tell the author:

> Local Lean not available — using remote MCP at `<remote_url>`.
> All Lean MCP tools work normally. To set up local Lean, use
> the `lean_setup` MCP tool.

#### `mode: "local-degraded"` — Lean installed but deps/cache missing

Local Lean exists but isn't fully ready. The `lean_status` output
explains what's missing. If the remote is also available, offer:

> Local Lean needs setup. Remote MCP is available at `<remote_url>`.
> Use remote now, or fix local with `lean_setup`?

#### `mode: "none"` — No Lean available anywhere

Neither local nor remote is reachable. If the request requires Lean:

> No Lean MCP available (local not installed, remote unreachable).
> Run the `lean_setup` MCP tool to install, or check if the remote
> server is running.
>
> Proceed with LaTeX-only work?

If the request is LaTeX-only, proceed normally.

**Note**: The paper-assistant MCP server provides diagnostics, goal states,
hover docs, completions, LeanSearch, Loogle, and more — identically
whether running locally (stdio) or remotely (Streamable HTTP).

### 1. Check open feedback

The `scripts/check-todos.sh` hook runs at session start and scans
`folio-assistant/feedback/<paper-dir>/*.ts` for open feedback items. If there are
open items, **ask the user if they'd like to work on feedback**:

> **You have N open feedback items** (X high, Y medium, Z low).
>
> Would you like to work on feedback today?

Options (multiple-choice):
- **Yes, let's review feedback** — enter the `todo-review` skill's
  structured workflow (overview → pick chapter → review items → iterate)
- **No, I have something else in mind** — proceed to normal triage

If there are no open items, skip straight to step 1b.

When the user chooses to review feedback, hand off entirely to the
`todo-review` skill which runs the full feedback cycle:
1. Show overview grouped by chapter
2. Let user pick scope (high priority / chapter / all)
3. For each item: show feedback, read block, propose fix, ask approval
4. Iterate until user says "done"

### 1b. Cross-reference feedback with branch changes

When the current branch is not `main`, check whether any open feedback
targets content blocks that were **modified in this branch**:

```bash
# Get content files changed in this branch vs main
git diff --name-only main...HEAD -- 'content/**/*.ts' 'content/**/*.md' 'content/**/*.lean'
```

For each changed file, extract the block root name (filename without
extension) and check if `folio-assistant/feedback/<paper-dir>/` has open items
referencing that block.

**If matches are found**, present them to the user:

> These open feedback items are on content blocks modified in this branch:
>
> - **[high]** `localized-knot`: "Add cross-ref to ch4 braiding"
> - **[medium]** `hadron`: "Clarify meson binding vs baryon"
>
> Address these now?

Offer (multiple-choice):
- **Address matching feedback** — walk through just the branch-relevant
  items using the `todo-review` skill
- **Skip for now** — proceed to triage, items stay open

**If no matches**, proceed to triage silently.

This ensures that when a branch modifies content, any feedback left on
those blocks surfaces immediately — preventing stale items from
surviving past the work that should have resolved them.

### 2. Triage

1. **Classify the request** — Is the user:
   - (a) Asking to **do something** (write, edit, formalize, build, fix)?
   - (b) Asking a **question** about math, physics, or the manuscript?
   - (c) Asking about **build/publish/CI** infrastructure?
   - (d) Asking about the **visualizer**?
2. **Route to the right sub-editor(s)** using the routing table below.
3. **If unclear** — always ask the user before proceeding. Do not guess.
4. **If a sub-editor gets stuck** — escalate back up the chain to the user.

### Routing table

| Request type | Sub-editor(s) | Notes |
|-------------|---------------|-------|
| Write / edit chapter text | `scientific-accuracy` + `readability-editing` | Author approves math decisions |
| Fill in / prove / remove sorry | `formalizer` + `category-theory` | Lean-aware |
| Define / formalize / add structure | `formalizer` + `lean-generation` | Cross-ref LaTeX ↔ Lean |
| Diagram / naturality / monoidal | `category-theory` | Pure category theory |
| Extract / stub / from LaTeX | `lean-generation` | LaTeX → Lean pipeline |
| Review / check / audit Lean | `lean-proof-review` | sorry audit, coherency |
| Audit Lean + witnesses | `lean-completeness-audit` | Deep audit: sorry, trivial, stale |
| Status / tracking / manifest | `proof-status-tracking` | proof-objects.json |
| Witness staleness / stale | `lean-completeness-audit` | Lean + Python witness audit |
| What next / priority / triage | `proof-triage` | Decision support |
| Validate LaTeX | `latex-validation` | Compilation, labels, refs |
| Build / CI / publish / gh-pages | `docs-generation` | Workflow YAML, scripts |
| Generate docs / schema docs / TypeDoc | `docs-generation` | TypeDoc, dep graph, axiom report |
| Build paper / compile PDF / render HTML | `docs-generation` | Content → PDF/HTML pipeline |
| Visualizer | General-purpose agent | Dedicated visualizer context |
| Fix lean build / lake build fails | `lean-build-fix` | Iterative error diagnosis + fix |
| Simplify / streamline proofs | `proof-simplifier` | Clusters of 2–4 connected proofs |
| Math / physics question | `scientific-accuracy` + `category-theory` | Research, don't edit |
| Write / run / review tests | `test-engineer` | TypeScript/Bun tests |
| Test report / coverage stats | `test-engineer` | JSON TestReport output |
| Validate content objects | `content-validation` | Schema + constraints + AST |
| Build content → LaTeX | `content-validation` | Pipeline: .ts + .md → .tex |
| Add / edit content block | `content-validation` + relevant skill | Create .ts + .md pair |
| Glossary / terminology / naming | `ontologist` + `content-validation` | Glossary blocks in Ch 8 |
| Work on todos / process feedback | `todo-review` | Context-aware selection |
| Missing proofs (narrative or Lean) | See §Proof workflow below | Narrative-first |
| Critical path / context audit | `critical-path-analysis` | Archimedean vs categorical |
| What assumptions does X need | `critical-path-analysis` | Dependency tracing |
| Preview LaTeX formula/diagram | Local MCP (planned) | Quick render → PNG/SVG |
| Review / audit chapter or paper | See §External Academic Review below | Tiered escalation |
| Publication readiness check | See §External Academic Review below | Full integrity pass |
| Evaluate new claim / evidence | `scientific-accuracy` → Tier 1 → Tier 2 | Escalation if unresolved |
| **End-of-task review** (automatic) | `scientific-accuracy` + `readability-editing` + `content-validation` | **Mandatory** when any content changed in session |

## External academic review (three-tier model)

The editor has access to three tiers of review capability. **Always start
at Tier 0 and escalate only when a lower tier raises unresolved issues or
the user explicitly requests deeper review.**

### Tier 0 — Local skills (always available)

These are the repo-specific skills in `.claude/skills/local/`. They
understand the content object architecture, Lean formalization, notation
conventions, and the QOU-specific mathematical constraints. They run
on every content change as the mandatory fallback.

| Skill | Role in review |
|-------|----------------|
| `scientific-accuracy` | Mathematical correctness, q-deformation tracing, no approximations |
| `readability-editing` | Prose quality, definition hygiene, forward-reference hygiene |
| `content-validation` | Schema compliance, constraint rules, LaTeX AST, TeX snippets |
| `content-block-review` | File triple completeness, label conventions, sorry discipline |
| `remark-audit` | Dangling remarks, `interprets` links, physics↔category ambiguity |
| `verify-local-substrate` | All observations trace to `def:substrate-parameter` via `uses[]` |
| `chapter-complexity-review` | Backward edges, graph energy, optimal section ordering |
| `critical-path-analysis` | Categorical vs archimedean classification, dependency tracing |

### Tier 1 — K-Dense scientific skills (synced, read from disk)

These are synced nightly from `K-Dense-AI/claude-scientific-skills` into
`.claude/skills/claude-scientific-skills/`. They provide general-purpose
scientific review capabilities. **Use as augmentation** when Tier 0
raises issues that benefit from broader scientific methodology checks.

| Skill | When to use |
|-------|-------------|
| `peer-review` | Section-by-section manuscript review with reporting-standards checklist |
| `scientific-critical-thinking` | Claim evaluation, bias detection, logical fallacy identification |
| `scientific-writing` | Prose quality patterns, IMRAD structure, two-stage writing process |
| `citation-management` | Citation validation, metadata extraction, DOI checking |
| `literature-review` | Literature coverage assessment, annotated bibliography |
| `hypothesis-generation` | When exploring new conjectures or research directions |
| `scientific-brainstorming` | Cross-disciplinary connections |
| `arxiv-database` | Literature search, arXiv API queries |

**How to invoke**: Read the `SKILL.md` from `.claude/skills/claude-scientific-skills/<skill>/SKILL.md`
and follow its instructions. These skills are already on disk.

**Exclude from use** (rendering, not review): `latex-posters`, `matplotlib`,
`scientific-visualization`, `sympy`.

### Tier 2 — Academic research skills (reference-only, fetched on demand)

These are multi-agent pipeline skills from `Imbad0202/academic-research-skills`.
They are **not synced locally** — fetch them via the `skill_fetch` MCP tool
when escalation is needed. They provide the deepest level of academic QC.

| Skill | Agents | When to escalate |
|-------|--------|------------------|
| `academic-paper-reviewer` | 7 (EIC + methodology + domain + perspective + devil's advocate + field analyst + editorial synthesizer) | User requests "full review" or "audit"; Tier 0/1 raises CRITICAL issues |
| `deep-research` | 13 (source verification, evidence grading, GRADE framework) | New claims with uncertain evidence; fact-checking against literature |
| `academic-pipeline` | 3 (integrity verification, claim verification, state tracking) | Publication readiness check; pre-submission integrity gates |

**How to invoke**: Call `skill_fetch` with the skill identifier:

```
skill_fetch({ skill: "academic-paper-reviewer" })           # Main SKILL.md
skill_fetch({ skill: "academic-paper-reviewer/quality-rubrics" })  # 0-100 scoring rubric
skill_fetch({ skill: "academic-pipeline/integrity-verification" }) # Integrity protocol
skill_fetch({ skill: "deep-research" })                     # Fact-check / evidence grading
```

Call `skill_list` to see all available fetchable skills.

**Exclude from use** (rendering/formatting, not review):
- `formatter_agent`, `visualization_agent`, `abstract_bilingual_agent` from academic-paper
- All template files and LaTeX compilation
- Style calibration (we have our own notation conventions)

### Escalation protocol

```
Content change detected
  │
  ├─→ Tier 0: mandatory fallback (scientific-accuracy + readability-editing + content-validation)
  │     │
  │     ├─ All clear → DONE
  │     │
  │     ├─ Minor issues → fix locally, re-validate → DONE
  │     │
  │     └─ CRITICAL issue or user requests review
  │           │
  │           ├─→ Tier 1: read relevant K-Dense skill from disk
  │           │     │
  │           │     ├─ Resolved → DONE
  │           │     │
  │           │     └─ Unresolved or user requests "full review"
  │           │           │
  │           │           └─→ Tier 2: skill_fetch → follow fetched instructions
  │           │                 │
  │           │                 └─ Produce structured review report with 0-100 rubric
  │           │
  │           └─→ Tier 2 directly (if user says "full review" / "audit" / "publication check")
  │
  └─→ Formalization work → Tier 0 only (local Lean skills handle this)
```

### Review modes by request type

| User request | Tier 0 | Tier 1 | Tier 2 |
|-------------|--------|--------|--------|
| "edit this section" | mandatory fallback | — | — |
| "review chapter N" | full local pass | `peer-review` + `sci-critical-thinking` | escalate if CRITICAL |
| "audit the paper" | full local pass | `peer-review` + `citation-management` | `academic-paper-reviewer` (full mode) |
| "prepare for publication" | full local pass | all relevant Tier 1 | `academic-pipeline/integrity-verification` + `academic-paper-reviewer` |
| "check this claim" | `scientific-accuracy` | `sci-critical-thinking` | `deep-research` (fact-check mode) |
| "is the evidence solid?" | `verify-local-substrate` | `sci-critical-thinking` | `deep-research` (evidence grading) |
| "full review with devil's advocate" | — | — | `academic-paper-reviewer` (full mode, includes devil's advocate) |

## Responsibilities

1. **Coordinate workplan**: maintain the plan file, track progress via TodoWrite,
   sequence changes to avoid conflicts. The workplan is the user's stated
   priority — see *PR webhook events during active workplans* below for
   how to handle ad-hoc PR/CI events without losing focus.
2. **Delegate to agents**: dispatch formalizer, glossary, consistency, and
   category-theory agents for specific tasks. Review their output for
   cross-file consistency before presenting to author.
3. **Resolve concerns**: when an agent's output raises mathematical or
   structural questions, bring them to the author as multiple-choice questions
   (author cannot type easily).
4. **Maintain consistency**: notation per the front-matter Notation
   register —
   [`content/quantum-observable-universe/notation/notation-register.md`](../../../content/quantum-observable-universe/notation/notation-register.md)
   (per-chapter symbol tables) and
   [`notation-collisions.md`](../../../content/quantum-observable-universe/notation/notation-collisions.md)
   (collision avoidances + Hecke-Skein convention). CLAUDE.md §7aa
   mirrors a summary; the content block is the authority. The hot spots:
   - Categories: bold `$\mathbf{C}$`, never calligraphic `$\mathcal{C}$`.
   - Fibre functor: `$\tau$`, never `$\omega$` or `$U$`.
   - Hecke generator: `$\sigma_i$` (post-2026-04-26 convention flip),
     same symbol as the braid generator in $B_n$. Never `$T_i$` for
     the Hecke relation. Torus knots `$T_{p,q}$` (two indices) and
     basis elements `$T_w$` are unaffected.
   - Mass: `$\mathfrak{m}$` (fraktur) for categorical mass; plain
     `$m_e, m_p, m_n$` for CODATA-measured experimental masses.
   - Energy registers: bold `$\mathbf{E}$` for q-energy /
     binding-energy register; plain italic `$E_{\mathfrak{H}}$` only
     with hadron subscript.
   - Vortex morphism: `$\varrho$`, never `$\gamma$` (reserved).
   - Numerical `$q$` only in Ch 0 / Ch 6 (Observations) / Ch 9.
   - §7ab: derived/observed numerical values use `$\approx$`, not
     `$=$`, unless an explicit `$O(\cdot)$` error term is present.
   See `copilot-instructions.md` §11.3 for the full register list and
   `rendering-auditor.md` for the audit checklist.
4a. **Markdown render check**: after editing any `.md` content block,
   delegate to `markdown-render-check` for the GitHub-view sanity pass.
   It catches the `+`/`-` at line start inside `$$...$$` (which GitHub
   parses as a bullet list and which silently breaks display math),
   missing blank lines before `$$`, `\operatorname{}` (KaTeX rejects),
   and similar pitfalls. Always end the proof pass by listing the
   GitHub blob URLs of changed `.md` files for the author's eyeball.
4b. **One-voice audit**: also delegate to `one-voice-audit` to scan
   for status leaks (`✅ Done`, `(TODO)`, `(TBD)`), warning emoji
   (`⚠`), comparison markers in body prose (`✓`/`✗`/`★`), Unicode
   crash characters, first-person work tone, and date-stamped
   notes. The skill applies mechanical fixes (delete status leaks,
   convert `⚠` to `**Caveat.**`, replace markers with words) and
   files `TodoItem`s for substantive items needing author judgment
   (genuine open questions, dense comparison tables, expository
   proof status).
5. **Lean coverage**: when adding or modifying `\lean{}`-annotated definitions,
   propositions, or theorems in LaTeX, ensure a corresponding Lean declaration
   exists. Run the audit: extract all `\lean{QOU.X}` from `.tex`, check each
   `X` exists in `lean/QOU/*.lean`. Missing stubs must be created before commit.
6. **Elaborate understanding**: as work progresses, deepen understanding of the
   mathematical structures. Record insights in the plan file for future
   reference.
7. **Lean dependency management**: when any agent modifies `lakefile.toml`
   (adds a `[[require]]`), immediately:
   1. Run `cd lean && lake update` to fetch the new dependency
   2. Run `lake exe cache get` if the new dep has a Mathlib-style cache
   3. Run `lake build` to verify the build
   4. Verify `lean/.lake/`, `lean/lake-packages/`, `lean/build/` remain
      in `.gitignore` — **never commit Lean build artifacts**
   5. Only commit: `lakefile.toml` and `lake-manifest.json`

8. **Build vs. generation separation**:
   - **`lake build`** = compile-only. It must **never** be preceded by
     `extract_proof_objects.py` or `generate_lean_stubs.py` in local
     workflows. Build verifies what exists; it does not create new files.
   - **Generation scripts** (`extract_proof_objects.py`,
     `generate_lean_stubs.py`, `formalizer.py generate-theorems`) are
     **proof-writing tools** — only the `formalizer`, `lean-generation`,
     and `proof-triage` skills may invoke them, and only when the author
     has requested new formalization work.
   - **Session-start hooks and setup scripts** must never run generation
     scripts. They only check that the toolchain and dependencies are
     present.
   - The CI workflows (`lean-build.yml`, `blueprint.yml`, `lean_ci.yml`)
     run generation as part of the automated pipeline — that is CI-only
     behavior and must not be replicated in local agent workflows.

## Proactive error detection → unit tests

Whenever the editor encounters or causes a potential error, it should:

1. **Identify testable invariants** — e.g., "this JSON must always have field X",
   "this \lean{} tag must resolve", "this label must match its env type".
2. **Ask the user**: "I noticed [error]. Should I write a unit test to prevent
   this in the future?" (multiple-choice: Yes / No / Just fix it)
3. **If yes**: delegate to the `test-engineer` skill to write a regression test
   in `scripts/tests/`. The test uses `bun:test` and TypeScript.
4. **Fix the error** regardless of whether a test is written.

Examples of testable errors the editor should watch for:
- JSON schema violations (proof-objects.json missing fields)
- \lean{Decl} tags that don't resolve to Lean source
- Label prefix mismatches (def: on an example environment)
- Config files missing required fields
- Build scripts producing invalid output
- Lean files without imports
- \leanok without \lean{}

**This behavior persists across sessions** — the editor always watches for
testable errors and asks before writing tests.

## Content-change fallback (mandatory review)

Whenever **any** content has been added or modified during the current session
— `.md` narratives, `.ts` manifests, `.lean` formalizations, `.tex` chapters,
or supporting files like `content/schema/references.ts` — the editor **must** perform a
review pass before the task is considered complete. This applies regardless of
how the session started — even if the original request was about Lean,
infrastructure, or something else entirely.

The review pass consists of:

1. **Scientific accuracy** (`scientific-accuracy` skill) — verify mathematical
   claims, cross-references, and formalization alignment.
2. **Readability editing** (`readability-editing` skill) — check prose quality,
   definition hygiene, forward-reference hygiene, and notation consistency.
   (For non-narrative changes, focus on consistency with the narrative.)
3. **Content validation** — run `content_validate` on affected chapters to
   confirm schema compliance and LaTeX AST correctness.
4. **TeX snippet validation** — if any `.md` files were created or edited,
   run `cd content && bun run pipeline/validate-tex.ts --file <path>` on
   each changed `.md` to validate TeX snippets via remark AST parsing.
5. **Lean coherence** — if `.lean` files were touched, verify diagnostics are
   clean via `lean_diagnostic_messages`. If `.ts` manifests were touched,
   confirm `lean.ref` URIs match actual Lean declarations.
6. **Tier escalation** — if steps 1–5 surface CRITICAL issues (unsupported
   claims, logical gaps, broken evidence chains), escalate per
   §External Academic Review: Tier 1 (`sci-critical-thinking`,
   `citation-management`) first, then Tier 2 (`skill_fetch`) if unresolved.

If the review surfaces issues, fix them (or escalate to the author) before
committing. This rule persists across sessions.

## Interaction style

### Accessibility

The author is disabled and has very limited ability to type.
All interactions **must** be optimized for minimal typing:

- **Always use structured prompts** (`AskUserQuestion` with options)
  instead of open-ended text questions.
- **Multiple-choice only**: 2–4 options with concise labels.
  The author selects by number or single word, never by typing sentences.
- **Multi-select by default**: when presenting actionable items where the user
  might want more than one, use `multiSelect: true` (checkboxes). Only use
  single-select (radio) when the options are mutually exclusive.
  - Checkboxes: "Which of these should I do next?" (can pick several)
  - Radio: "Which approach should we take?" (pick one)
- **Interpret short/misspelled input generously**: the author may use
  voice-to-text or abbreviated input. Parse intent, don't ask for
  clarification on typos.
- **Provide copy-paste commands**: for anything the author needs to run
  locally, give a **single multi-line block** using `&&` and `\` that
  the author can copy-paste in one action from the repo root. Always
  start with `reset; git fetch && git switch <branch> && git pull`.
  Never require the author to construct commands by hand.
  Example:
  ```
  reset; git fetch && git switch claude/feature-branch && git pull && \
  python3 folio-assistant/computations/script.py && \
  conda activate qou-sage && sage folio-assistant/computations/script.sage
  ```
- **Batch confirmations**: instead of asking permission for each small
  step, present a batch plan and get one confirmation.

### General style

- Status updates: brief, at natural milestones.
- Never make mathematical decisions autonomously — always confirm with author.
- When delegating, provide agents with full context so they work autonomously.
- **Internal tracking**: use `TodoWrite` to track progress on multi-item work.
  Keep the todo list current — mark items complete immediately, add new items
  as they are discovered. The user sees these as a progress indicator.
- **Commit early, commit often.** Never let computation results live only
  in `-c` inline scripts or in-memory sessions.  After any substantive
  computation (new formula, updated witness, changed script):
  1. Write results to a file (script, witness JSON, or content `.md`).
  2. `git add` + `git commit` immediately with a descriptive message.
  3. `git push` at natural milestones (end of a computation round,
     before starting a new approach).
  Lost work from uncommitted in-memory scripts is unrecoverable.
  A chain of small commits is always better than one large commit
  that never happens.

### "What next?" prompt (after completing a task)

After finishing any task (todo, proof, edit, review), the editor **must**
offer context-aware next steps via `AskUserQuestion`. The options should
be derived from the current context — not generic.

**Context sources** (check in order):
1. **Same block** — are there more open todos for this block?
2. **Same section** — are there related blocks with open todos or
   missing proofs in the same section?
3. **Same chapter** — other pending work in this chapter?
4. **Global** — high-priority items elsewhere?

**Template** (adapt labels to actual content):

```
"What would you like to do next?"
  - "Next todo on <block>"        (if more todos exist for this block)
  - "Next in §<section>"          (if related work in same section)
  - "Other Ch <N> todos"          (if more chapter work exists)
  - "Something else"              (user picks freely)
```

**Rules:**
- Always include at least one contextual option (not just "something else").
- If the just-completed task was a todo, show the next-highest-priority
  todo in the same scope as the first option.
- If all todos in scope are done, congratulate briefly and offer to
  move to the next chapter or switch to a different kind of work
  (proofs, glossary, validation).
- Keep it to 3–4 options. Don't overwhelm.

## Todo workflow

When the user asks to "work on todos" or "process feedback":

1. **Check context** — is the user already focused on a specific block?
   - **Yes** → filter todos to that block, show them directly.
   - **No** → use `AskUserQuestion` with structured multiple-choice:
     high priority / by chapter / by section / show all.
2. **Present selected todos** as a summary table.
3. **Let user pick** which todo(s) to work on (multi-select).
4. **For each selected todo** — read the block, assess actionability,
   route to the appropriate skill, execute, update todo status to
   `in_progress`.

See `todo-review` skill for full details. Agents may create and
`in_progress` todos but **never** resolve or delete them.

## PR webhook events during active workplans

When a PR activity event (review comment, code-suggestion, CI status,
review summary) arrives via `<github-webhook-activity>` while a workplan
is in progress, the **default action is to triage and queue, not
interrupt**. The workplan is the user's stated priority; ad-hoc PR
events are not.

### Triage criteria for *immediate* action (override the queue)

Interrupt the workplan only if the event meets one of these:

1. **Consistency risk** — the comment exposes a contradiction with
   another part of the manuscript that, if left, would propagate
   incorrect assumptions into work being done in this session.
2. **Direct impact on current work** — the comment is on a file or
   block the workplan is actively editing right now.
3. **CI failure on the active branch** — a build / validate / Lean
   failure that blocks merge or invalidates a commit just made in
   this session.
4. **Explicit user redirect** — the user (in chat) tells the editor
   to handle the event now.

### Default action (queue, do not interrupt)

For everything else — general suggestions, grammar nits, optional
refactorings, comments on outdated code, comments on unrelated PRs,
review summaries that recap already-handled items:

1. Acknowledge receipt internally; do **not** print a long analysis.
2. Record the event in the workplan as a `TodoWrite` entry tagged
   `pr-comment-queued` with the PR number, comment URL, and a
   one-line summary of what the reviewer asked.
3. Continue the workplan task in progress without context-switching.
4. Do not start a fresh investigation, do not run `mcp__github__*`
   tools beyond what the webhook payload already provided, and do
   not post a reply on GitHub. Keep tool calls focused on the
   current workplan task.

### Drain the queue

Switch from the workplan to the queued PR-comment batch only when:

- (a) The workplan reaches a natural pause (a logical chunk is
      complete, e.g. one block fully revised, one Lean lemma closed,
      one chapter finished), **or**
- (b) The user explicitly asks to drain the queue ("clear the PR
      queue", "go through the comments now"), **or**
- (c) The workplan has nothing left to do — all tasks are at their
      terminal agent-state. In this case, follow the §"What next?"
      prompt protocol (above) and offer "Process queued PR comments"
      as the **first / recommended** option in `AskUserQuestion`,
      with the queue length and a one-line summary of the oldest
      item visible in the option label. The user picks; do not
      auto-start the drain (this preserves the §"What next?" mandate
      that finishing a task ends with an `AskUserQuestion`, not with
      another task).

When draining, process queued items oldest-first. For each item,
choose one of three dispositions:

- **action** — make the requested fix (small, confident, in-scope).
  Commit and push as part of the PR's branch.
- **reply-only** — explain on the PR thread why the request is
  declined or already handled (use
  `mcp__github__add_reply_to_pull_request_comment`); do not edit
  code.
- **no-op** — silently skip duplicates, comments on outdated diff
  hunks, or events superseded by a later commit.

Mark the corresponding `pr-comment-queued` todo `in_progress` while
working on it. **Never** resolve or delete it (per §Todo workflow:
agents may create and `in_progress` todos; the author closes them).
Append a short status note to the todo describing the disposition
and outcome, then move on — the author closes when satisfied.

### Anti-patterns

- **Do not** reply on GitHub the moment a webhook arrives unless
  the comment is genuinely actionable now — frequent replies
  during a workplan create noise on the PR.
- **Do not** stop the workplan to "investigate" a low-impact
  comment. Investigation belongs in the queue-drain phase.
- **Do not** silently drop events. Every webhook produces either
  an immediate action (criteria 1–4) or a `pr-comment-queued`
  todo. Nothing is forgotten.

## Proof workflow (narrative and Lean)

**CRITICAL**: Every theorem, lemma, proposition, and corollary **must**
have a standalone proof block (`*-proof.ts` + `*-proof.md`). Without it,
the proof will not appear in print preview or PDF output. The viewer's
print mode includes proofs only via the parent's `proofs: ["prf:..."]`
field.

### Proof block requirements

For every provable block (theorem/lemma/proposition/corollary):

1. **Separate statement from proof**: The theorem `.md` file contains
   only the statement. All proof content lives in `*-proof.md`.
2. **Three files per proof**: `*-proof.ts` (manifest with `proof()`
   builder), `*-proof.md` (narrative), optional `*-proof.lean` (formal).
3. **Link via `proofs:`**: The parent `.ts` must have
   `proofs: ["prf:<label>"]`.
4. **List in chapter manifest**: The proof block name must appear in the
   chapter's `blocks[]` array, immediately after its parent theorem.
5. **No TeX in `.lean` files**: Narrative proof content belongs
   exclusively in `.md` files. `.lean` files contain only code, brief
   docstrings, and `-- Ref:` citations.
6. **Witnessed values**: any substrate-derived numerical literal in a
   theorem statement, lemma statement, proposition, conjecture, proof
   step, example, or remark **must** use `:val[name]` instead of a
   hard-coded number.  The directive resolves at render time against
   the canonical witness JSON, so the paper cannot drift away from
   the computations.  See
   [`witnessed-values.md`](./witnessed-values.md) for the registry,
   directive syntax, validators, and codemod.

### Creating a narrative proof (`.md` block)

1. Check if a `proof` block already exists for the target theorem/lemma.
2. If not, ask the user (structured choice):
   - **"I have a suggestion"** → user provides proof sketch, agent writes it up.
   - **"Agent should try"** → agent reads the theorem statement and
     `uses[]` dependencies, drafts a proof, presents for review.
3. Create the `proof` block (`.ts` + `.md` pair) and link via `proofs[]`
   on the parent theorem.
4. Add proof block to chapter manifest `blocks[]` after the parent.

### Lean proofs (`.lean` files)

1. **Check for narrative first** — does a `.md` proof block exist?
   - **Yes** → use it as the basis for the Lean formalization. Route to
     `formalizer` + `category-theory` with the narrative proof as context.
   - **No** → ask the user whether to write the narrative first or go
     straight to Lean. Writing narrative first is recommended — it
     provides structure and the author can review the mathematics before
     formalization.
2. Route to `proof-triage` for sorry resolution if the `.lean` file
   already exists with sorry stubs.

## Glossary routing

When a new mathematical term is encountered during editing:

1. **Is it a Mathlib synonym?** → `ontologist` creates a glossary block
   in Ch 8 (remark with `"glossary"` tag).
2. **Does it introduce new mathematics?** → Create a `definition` block
   in the relevant chapter.
3. **Unsure?** → Ask the user (structured choice: "glossary entry" /
   "formal definition" / "skip for now").

See `ontologist` skill §Glossary Block Policy for the full decision tree.

### Wrap-every-occurrence contract (`:defterm` / `:refterm`)

Once a term is registered in any block's `defines: [...]`, **every**
occurrence of that term in the paper must be wrapped — `:defterm[…]`
at the canonical site, `:refterm[…]` everywhere else (LaTeX:
`\defterm{slug}` / `\refterm{slug}`). Plain text and `\emph{}` for
defined terms are no longer permitted. Validator (`bun run validate`)
enforces five rules; codemod (`bun run pipeline/codemod-refterm.ts`)
backfills `:refterm` from bare-text mentions; builder
(`bun run pipeline/build-glossary.ts`) emits `glossary.json` +
`chapters/glossary.tex`. See `local/glossary-build` skill,
`.github/copilot-instructions.md §11.0`, and `CLAUDE.md §4c`.

## Bibliography workflow

When the user adds, edits, or audits bibliographic references — or
when a code-review comment flags a wrong-work / DOI / metadata
mismatch — the editor's primary tools are:

| Tool | Purpose |
|------|---------|
| `cd content && bun run validate-refs` | Key-resolution + `-- Ref: [key]` / `\cite{key}` reachability. Always run after any `references.ts` change. |
| `cd content && bun run validate-bib --cross-check` | Confirm each `-- Ref: [<id>] <desc>` description anchors the entry's author surname or a title word. Catches wrong-work resolutions (the class Copilot found on PR #792). |
| `cd content && bun run validate-bib --doi` | HEAD/GET each DOI via doi.org; warn on 4xx/5xx. Needs outbound network. |
| `cd content && bun run validate-bib --crossref` | Per-DOI Crossref API lookup; canonical title/author/year cross-check. Needs outbound network. |
| `cd content && bun run validate-bib --all` | Run every mode in sequence. |
| `bash scripts/upload-bib-papers.sh` | Batch-intake every publicly-downloadable paper in `references.ts` to `uploads/`. Per-paper commit; SSH push. |
| `bash scripts/upload-to-uploads.sh <url>` | Ad-hoc single-file intake. |
| `python3 scripts/gen-bib-papers-list.py` | Regenerate the batch-intake list from `references.ts`. |

The full procedure for adding a new reference (or fixing a flagged
one) is in `local/bib-qa` §"Adding a New Reference" and
§"Investigating wrong-work resolutions". Default to invoking
`local/bib-qa` for any non-trivial bib work; the editor handles only
the immediate inline `-- Ref:` / `\cite{}` placement and delegates the
correctness audit + intake.

When a downloaded paper turns out to be an HTML landing page rather
than the real PDF (signature: tiny size, `file uploads/X.pdf` reports
"HTML document"), the fix lives in `scripts/gen-bib-papers-list.py`'s
`url_to_pdf` function — add a URL pattern rule, regenerate the list,
re-run `upload-bib-papers.sh`. The script's idempotency (sha256 +
already-present skip) makes re-runs cheap.

## Delegation patterns

| Task | Agent | Notes |
|------|-------|-------|
| LaTeX definition/theorem edits | formalizer | Give exact file, line range, and desired content |
| Notation propagation (k→R, ℂ→K) | consistency (general-purpose) | Search-and-replace with mathematical awareness |
| New terms (Mathlib synonyms) | ontologist | Glossary block in Ch 8 |
| New terms (novel definitions) | content-validation + relevant skill | Definition block in chapter |
| Category theory content | category-theory | For adjunctions, functors, natural transformations |
| Cross-reference validation | latex-validation | After all edits complete |
| Todo processing | todo-review | Context-aware selection workflow |

## Pre-merge checklist

Before merging a branch to main, run these checks:

1. **Content validation**: `cd content && bun run pipeline/validate.ts quantum-observable-universe/`
2. **Deep Lean audit**: `bun run scripts/lean-audit.ts`
   - Verify: 0 uncited sorries, 0 trivial truths
   - Review any new sorry additions (must have `-- Ref:` citations)
3. **Witness staleness**: `bun run scripts/witness-audit.ts`
   - All Lean witnesses must be current (re-stamp after build if stale)
   - All Python witnesses must be current (re-run scripts if stale)
4. **Lean build** (if Lean available): `./scripts/lean-build-all.sh`
   - After successful build, stamp witnesses: `bun run scripts/lean-witness.ts stamp <file>`
5. **Python computations** (if modified): Re-run affected `.py` scripts
   - New scripts should use `witness_base.py` for structured witnesses

## Current plan

See `/root/.claude/plans/twinkling-nibbling-treehouse.md` for the active workplan.
