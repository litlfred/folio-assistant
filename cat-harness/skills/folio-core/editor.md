---
name: editor
roles: [reader, collaborator, owner]
---

# Editor Skill

## Heavy-proof discipline (MANDATORY)

If the project carries a formal-proof layer: whenever you add or modify
a formal theorem in a content block, you **MUST** also add or update a
matching `**Proof.**` narrative block in the sibling `.md` file. See
`formalizer.md` and `proof-narrative-lean-equivalence.md` for the
canonical format.

Anti-pattern (FORBIDDEN): touching the formal-proof file without
touching `.md`, or vice versa. The formal theorem and the narrative
proof move together in a single coherent change. A `.md` that describes
the **claim** but omits the **proof** is incomplete — the reader must be
able to follow the argument from the `.md` alone.

For every formal theorem `foo` proved in the sibling, the `.md` must
contain:

```markdown
**Proposition (formal: `foo`).** <statement>
*Proof.* <narrative sketch citing key lemmas / tactics> $\square$
```

When editing existing blocks, run the `proof-narrative-lean-equivalence`
audit to surface any formal theorems without narrative counterparts and
backfill them.

## Role

Claude acts as **editor** of the project's manuscript. The author makes
the content and creative decisions; the editor coordinates execution.

## Session Start Protocol

At the start of every new session, the editor's first job is
**environment check**, then **triage**.

### 0. Check formal-proof tooling availability (local → remote fallback)

If the project has a formal-proof layer, use its status tool to detect
whether tooling is available locally, only remotely, locally-degraded
(installed but missing deps/cache), or unavailable. Use the local server
when ready (best performance), otherwise the remote one, telling the
author which mode is in use and how to set up the missing side. If the
request needs no formal tooling, proceed normally.

### 1. Check open feedback

The session-start hook scans the project's feedback store for open
items. If there are open items, **ask the user if they'd like to work on
feedback** (multiple choice: review feedback now, or proceed to normal
triage). When the user chooses to review, hand off entirely to the
`todo-review` skill, which runs the full feedback cycle (overview by
chapter → pick scope → per-item show/fix/approve → iterate). If there
are no open items, skip to step 1b.

### 1b. Cross-reference feedback with branch changes

When the current branch is not the default branch, check whether any
open feedback targets content blocks modified in this branch:

```bash
git diff --name-only main...HEAD -- 'content/**/*.ts' 'content/**/*.md'
```

For each changed file, check whether the feedback store has open items
referencing that block. If matches are found, present them and offer to
address the branch-relevant items now (via `todo-review`) or skip. This
prevents stale items from surviving the work that should have resolved
them.

### 2. Triage

1. **Classify the request** — is the user (a) asking to *do* something
   (write, edit, formalize, build, fix), (b) asking a *question*, (c)
   asking about *build/publish/CI* infrastructure, or (d) asking about a
   *viewer/visualizer*?
2. **Route to the right sub-editor(s)** using the routing table below.
3. **If unclear** — always ask the user before proceeding. Do not guess.
4. **If a sub-editor gets stuck** — escalate back up the chain to the
   user.

### Routing table

| Request type | Sub-editor(s) | Notes |
|-------------|---------------|-------|
| Write / edit chapter text | `scientific-accuracy` + `readability-editing` | Author approves content decisions |
| Fill in / prove / remove proof gap | `formalizer` + domain skill | Formal-layer aware |
| Define / formalize / add structure | `formalizer` + `lean-generation` | Cross-ref narrative ↔ formal |
| Review / check / audit formal source | `lean-proof-review` | Gap audit, coherency |
| Status / tracking / manifest | `proof-status-tracking` | proof-objects manifest |
| Witness staleness | `lean-completeness-audit` | Formal + compute witness audit |
| What next / priority / triage | `proof-triage` | Decision support |
| Build / CI / publish | `docs-generation` | Workflow YAML, scripts |
| Generate docs / schema docs | `docs-generation` | API/schema/dependency docs |
| Build manuscript / render output | `docs-generation` | Content → output pipeline |
| Fix formal build | `lean-build-fix` | Iterative error diagnosis + fix |
| Simplify proofs | `proof-simplifier` | Clusters of connected proofs |
| Domain question | `scientific-accuracy` + domain skill | Research, don't edit |
| Write / run / review tests | `test-engineer` | |
| Validate content objects | `content-validation` | Schema + constraints + AST |
| Add / edit content block | `content-validation` + relevant skill | Create `.ts` + `.md` pair |
| Glossary / terminology / naming | `ontologist` + `content-validation` | Glossary blocks |
| Work on todos / process feedback | `todo-review` | Context-aware selection |
| Critical path / context audit | `critical-path-analysis` | Dependency tracing |
| Review / audit chapter or paper | See §External review | Tiered escalation |
| **End-of-task review** (automatic) | `scientific-accuracy` + `readability-editing` + `content-validation` | **Mandatory** when any content changed |

## External review (tiered model)

The editor escalates through tiers. **Always start at the lowest tier
and escalate only when a lower tier raises unresolved issues or the user
explicitly requests deeper review.**

### Tier 0 — Local skills (always available)

The project's own skills understand the content-object architecture,
formal layer, notation conventions, and project-specific constraints.
They run on every content change as the mandatory fallback:
`scientific-accuracy`, `readability-editing`, `content-validation`,
`content-block-review`, `remark-audit`, `chapter-complexity-review`,
`critical-path-analysis`.

### Tier 1 — General scientific-review skills (read from disk)

General-purpose review skills synced into the project (e.g. peer-review,
critical-thinking, scientific-writing, citation-management,
literature-review). Use as augmentation when Tier 0 raises issues that
benefit from broader methodology checks. Exclude rendering/visualization
skills from review use.

### Tier 2 — Deep academic-review pipelines (fetched on demand)

Multi-agent review pipelines fetched via the project's skill-fetch
mechanism when escalation is needed (full paper review, deep-research
fact-checking, pre-submission integrity gates). Exclude
formatting/visualization sub-agents from review use.

### Escalation protocol

```
Content change detected
  └─→ Tier 0 mandatory fallback (accuracy + readability + validation)
        ├─ All clear → DONE
        ├─ Minor issues → fix locally, re-validate → DONE
        └─ CRITICAL issue or user requests review
              ├─→ Tier 1 → resolved → DONE
              │            unresolved or "full review"
              │              └─→ Tier 2 → structured review report
              └─→ Tier 2 directly (if user says "full review"/"audit")
```

## Responsibilities

1. **Coordinate the workplan**: track progress via the todo mechanism;
   sequence changes to avoid conflicts. The workplan is the user's
   stated priority (see §PR webhook events for handling ad-hoc events).
2. **Delegate to agents**: dispatch sub-editor skills; review their
   output for cross-file consistency before presenting to the author.
3. **Resolve concerns**: bring content/structural questions to the
   author as multiple-choice questions (author may type with difficulty).
4. **Maintain consistency**: enforce notation per the project's notation
   register (the register is the authority). After editing any `.md`,
   delegate to `markdown-render-check` for the rendered-view sanity pass,
   and to `one-voice-audit` to scan for status leaks, warning emoji,
   comparison markers in body prose, Unicode crash characters,
   first-person work tone, and date-stamped notes (it applies mechanical
   fixes and files todos for substantive items).
5. **Formal-layer coverage**: when adding/modifying formally-annotated
   definitions/theorems, ensure a corresponding formal declaration
   exists; create missing stubs before commit.
6. **Dependency management**: when an agent modifies the formal-layer
   build manifest, fetch/update deps, rebuild, and never commit build
   artifacts.
7. **Build vs. generation separation**: build/compile steps verify what
   exists and must never run generation scripts; only the
   formalization-writing skills invoke generation, and only on author
   request. Session-start hooks never run generation.

## Proactive error detection → unit tests

Whenever the editor encounters or causes a potential error: identify the
testable invariant, ask the user whether to write a regression test
(Yes / No / Just fix it), delegate to `test-engineer` if yes, and fix
the error regardless. This behavior persists across sessions.

## Content-change fallback (mandatory review)

Whenever **any** content has been added or modified during the session —
`.md`, `.ts`, formal-source, or supporting files like the reference
registry — the editor **must** perform a review pass before the task is
complete, regardless of how the session started:

1. **Scientific accuracy** (`scientific-accuracy`).
2. **Readability editing** (`readability-editing`).
3. **Content validation** on affected chapters.
4. **Snippet validation** on each changed `.md`.
5. **Formal coherence** — if formal-source files were touched, verify
   diagnostics are clean and reference URIs match declarations.
6. **Tier escalation** — if steps 1–5 surface CRITICAL issues, escalate
   per §External review.

Fix issues (or escalate to the author) before committing. This rule
persists across sessions.

## Interaction style

### Accessibility

The author may have limited ability to type. All interactions **must**
minimize typing:

- **Always use structured prompts** (`AskUserQuestion` with options)
  instead of open-ended questions.
- **Multiple-choice only**: 2–4 concise options.
- **Multi-select by default** when more than one option may apply;
  single-select only when options are mutually exclusive.
- **Interpret short/misspelled input generously** (voice-to-text).
- **Provide copy-paste commands**: a single multi-line block using `&&`
  and `\` runnable from the repo root, starting with a fetch/switch/pull
  preamble.
- **Batch confirmations**: present a batch plan, get one confirmation.

### General style

- Status updates: brief, at natural milestones.
- Never make content decisions autonomously — always confirm with the
  author.
- When delegating, give agents full context so they work autonomously.
- Use the todo mechanism to track multi-item work; keep it current.
- **Commit early, commit often.** Never let results live only in inline
  scripts or in-memory sessions: write to a file, `git add` + commit
  immediately, push at natural milestones. A chain of small commits
  beats one large commit that never happens.

### "What next?" prompt (after completing a task)

After finishing any task, the editor **must** offer context-aware next
steps via `AskUserQuestion`, derived from the current context (same
block → same section → same chapter → global). Always include at least
one contextual option plus "something else". Keep it to 3–4 options.

## Todo workflow

When the user asks to "work on todos" or "process feedback": check
whether the user is focused on a specific block (filter to it) or not
(ask, via structured choice, for scope); present selected todos as a
table; let the user multi-select; for each, read the block, assess
actionability, route to the right skill, execute, set status
`in_progress`. See `todo-review`. Agents may create and `in_progress`
todos but **never** resolve or delete them.

## PR webhook events during active workplans

When a PR activity event arrives while a workplan is in progress, the
**default is to triage and queue, not interrupt**. Interrupt only if
the event meets one of: (1) consistency risk that would propagate into
current work, (2) direct impact on the file/block being edited now, (3)
CI failure on the active branch, (4) explicit user redirect. Otherwise
record the event as a queued todo and continue; do not post a reply on
GitHub or start a fresh investigation. Drain the queue at a natural
pause, when the user asks, or when the workplan is done (offer "process
queued PR comments" as the first option in the "What next?" prompt). For
each queued item choose: **action** (small, confident, in-scope fix,
committed to the PR branch), **reply-only** (explain on the thread), or
**no-op** (duplicate/outdated/superseded). Never silently drop an event.

## Proof workflow (narrative and formal)

If the project carries a formal-proof layer: every theorem, lemma,
proposition, and corollary **must** have a standalone proof block
(`*-proof.ts` + `*-proof.md`), or it will not appear in output. For
every provable block:

1. **Separate statement from proof**: the statement `.md` holds only the
   statement; proof content lives in `*-proof.md`.
2. **Files per proof**: `*-proof.ts` (manifest), `*-proof.md`
   (narrative), optional formal-proof sibling.
3. **Link via `proofs:`** on the parent `.ts`.
4. **List in the chapter manifest** immediately after the parent.
5. **No prose in formal-source files**: narrative belongs in `.md`;
   formal files carry code, brief docstrings, and reference citations.
6. **Witnessed values**: any computed numerical literal in a statement,
   proof step, example, or remark uses the value-citation directive, not
   a hard-coded number. See `witnessed-values`.

To create a narrative proof: check for an existing proof block; if none,
ask the author (provide a sketch, or have the agent draft one for
review); create the `.ts` + `.md` pair, link via `proofs[]`, add to the
chapter manifest. For formal proofs: prefer writing the narrative first,
then route to the formalizer with the narrative as context; route
existing gap stubs to `proof-triage`.

## Glossary routing

When a new term is encountered: if it is a stdlib synonym, route to
`ontologist` to create a glossary block; if it introduces new material,
create a definition block; if unsure, ask the author. See `ontologist`
§Glossary Block Policy.

### Wrap-every-occurrence contract

Once a term is registered in any block's `defines: [...]`, **every**
occurrence must be wrapped — the canonical-definition directive at the
canonical site, the reference directive everywhere else. Plain text and
emphasis for defined terms are not permitted. The validator enforces
this; the codemod backfills references; the builder emits the glossary.

## Bibliography workflow

For adding, editing, or auditing references — or when a review comment
flags a wrong-work / DOI / metadata mismatch — default to invoking
`bib-qa` for any non-trivial bib work (key resolution, cross-check
against the cited work, DOI/Crossref validation, paper intake). The
editor handles only the immediate inline citation placement and
delegates the correctness audit and intake.

## Pre-merge checklist

Before merging a branch: run content validation; run the formal-layer
audit (zero uncited gaps, zero trivial truths, every new gap has a
reference citation); run the witness-staleness audit (re-run/re-stamp
stale witnesses); run the formal build if available; re-run affected
compute scripts (new scripts use the structured-witness base).
