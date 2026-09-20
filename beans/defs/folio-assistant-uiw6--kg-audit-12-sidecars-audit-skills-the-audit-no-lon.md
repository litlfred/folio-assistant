---
# folio-assistant-uiw6
title: 'KG AUDIT: 12 sidecars audit skills the audit no longer reaches — nested files and skills/workflow/'
status: todo
type: task
priority: high
created_at: 2026-09-20T10:58:07Z
updated_at: 2026-09-20T10:58:34Z
---


Found 2026-09-20 on PR #494, after merging main. **Not caused by that PR** — four
arrived with main's rename of skills into `skills/workflow/`, eight pre-date it.
`kg:audit` prints the finding and **exits 0**, so `bun run gates --all` reports
53 gates passing with this on screen.

## What the check says, and which branch this is

`kg-audit.ts:1394` reports sidecars auditing a subject no report covers, and names
two possible causes:

> Either the subject moved and the sidecar should go, or it is no longer
> discovered from this root and the DECLARATION is what is wrong.

**It is the second.** All twelve subjects still exist on disk — checked one by
one, not inferred:

| sidecar's subject | file present? |
|---|---|
| `skills/workflow/bpmn-authoring.md` | yes |
| `skills/workflow/dmn-authoring.md` | yes |
| `skills/workflow/bpmn-processes.md` | yes |
| `skills/workflow/process-state.md` | yes |
| `skills/folio-core/bib-qa/qa-tags.md` | yes |
| `skills/folio-core/coordinate/protocol.md` | yes |
| `skills/folio-core/integration-watcher/idle-backlog.md` | yes |
| `skills/folio-core/integration-watcher/lifecycle.md` | yes |
| `skills/folio-paper-adapter/formalizer/{conventions,integration,patterns}.md` | yes (3) |
| `skills/folio-paper-adapter/lean-environment-setup/mathlib-cache-fallback.md` | yes |

Two shapes, and they may be one cause or two:

1. **Four moved**, by main's rename into `cat-harness/skills/workflow/`. Their
   sidecars still sit at the old paths (`authoring-who-smart-guidelines/`,
   `folio-core/`), so discovery misses them at the new location.
2. **Eight are NESTED** — a skill in a subdirectory of a package
   (`bib-qa/qa-tags.md`, `formalizer/patterns.md`). The audit reports 274
   subjects and reaches none of these, which suggests subject discovery walks one
   level rather than recursing.

## Why this is worse than an unaudited skill

An unaudited skill is a gap. **A skill with a stale sidecar and no audit is a gap
wearing a verdict.** The sidecar is committed, it is the artefact `kg:audit:check`
compares against, and `AGENTS.md` gives the reason sidecars exist at all: *"a
printed verdict is gone, which makes 'unbound since it was drawn' and 'broken in
the commit under review' indistinguishable."* A sidecar whose subject is no longer
audited inverts that — it preserves a verdict nothing is re-deriving.

So twelve skills are currently outside the audit while appearing to be inside it.

## NOT deleting the sidecars, and that is the whole point

`deletion-requires-confirmation`: an agent never removes a durable artefact on its
own initiative. Here the rule is not merely procedural — **deleting them would be
the wrong fix even if it were permitted.** The subjects exist, so the verdicts are
about live skills; removing them would take the only evidence that discovery has a
hole and turn a reported finding into a silent one. Exactly the `plj1` shape the
deletion skill uses as its worked example.

## What wants checking first

- Does subject discovery recurse into package subdirectories? If not, the eight
  nested ones are one fix and the four renamed ones are a second.
- Is `skills/workflow/` discovered at all? It is a directory main created by moving
  files; if the audit keys on a package list rather than a walk, a new directory
  would be invisible.
- Whether `kg:audit` should EXIT NON-ZERO on this. It prints `✗` and exits 0, so
  the gate set passes with twelve unaudited skills on screen — and a finding that
  cannot fail is the shape this repository keeps paying for (`xom7`, `d2kp`, the
  folded YAML `--check` that had never run).

## Done when

- [ ] subject discovery reaches nested skill files, or the layout is declared not to nest
- [ ] `skills/workflow/` is covered
- [ ] each of the twelve either has a current sidecar or a recorded reason it has none
- [ ] a decision on whether this finding should fail the gate rather than print
- [ ] no sidecar deleted without the owner saying so
