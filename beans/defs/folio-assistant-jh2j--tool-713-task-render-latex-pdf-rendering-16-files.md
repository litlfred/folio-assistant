---
# folio-assistant-jh2j
title: 'TOOL 7/13: Task_Render — LaTeX / PDF rendering (16 files, 3 entry points)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T04:34:56Z
updated_at: 2026-09-26T03:34:29Z
parent: folio-assistant-d308
---

Group 7 of 13 in `d308`. **16 files, 3 entry points.**

`render-latex`, `generate-block-tex`, `generate-main-tex`, `latex-preflight`,
`latex-overfull-report`, `audit-tex-source`, `validate-tex`, `latexmk-compile`,
`render-changed-blocks`, `render-on-change`, `render-pre-commit`,
`render-discovery`, `render-value`, `headless-render-qc`, `refresh-authors-note`,
`scripts/render-tex/`.

**BPMN:** `authoring-a-paper · Task_Render`, `serviceTask`, refs
`latex-authoring`. Note `authoring-a-document · Task_Render` is a DIFFERENT
step — the document render path takes no TeX (see `content-profiles`), so a
single Tool must not claim both.

**Target repo (#223):** `folio-asst-sci`, together with `deploy/` and
`scripts/docker-latex-build/` (5 HOST files that render TeX in a container).

## Done when
- [ ] a Tool node for the TeX render path
- [ ] `satisfies` includes `latex-authoring`
- [ ] it does NOT claim `authoring-a-document · Task_Render`
- [ ] `requires` names the TeX distribution honestly, container arm included
- [ ] `tool-coverage` reflects it

---

## 2026-09-20: two nodes, and `latex-authoring` is the second unsatisfiable contract

`latex-preflight` and `latex-overfull` satisfy **`latex-validation`**, which matches
them exactly — *"validate LaTeX source files for syntactic correctness, structural
consistency, and adherence to project conventions"* — and has no contract to
contradict. Complementary rather than alternative: one stops a compile from
failing, the other reports a defect in a compile that succeeded.

### `latex-authoring` has a contract and no mechanism — the second instance

Its contract requires **`documentClass`** and **`mainFile`**: what you are
AUTHORING. Nothing in the corpus accepts either — `generate-main-tex` takes
`--preamble`, `--chapters-dir` and `--out`.

That is the same shape as `proof-verification` one group over, whose contract
requires `projectRoot` and finds no taker. Two instances make it a pattern worth
naming:

> **An authoring skill's contract names the artefact being created. The corpus has
> checking mechanisms.** A contract written from the authoring side does not become
> satisfiable by pointing a checker at it, and forcing the edge would make the node
> lie about its interface.

So this is a **corpus gap, not a graph gap**, in both cases. Closing either needs a
Tool that actually authors — one that takes a `documentClass` and a `mainFile`, or
a `projectRoot`. Neither exists, and inventing a `satisfies` edge would hide that.

### Running them caught a gap in my own node

Both refuse cleanly with exit **2** — could-not-determine, verified by reading the
message rather than inferring from the code:

- `latex-preflight`: *"main.tex not found … Generate it first"*
- `latex-overfull`: *"usage: latex-overfull-report.ts \<main.log\> [--min N] …"*

That second message revealed the log is a **required positional**, which my first
draft of the node did not declare — it listed only the flags, which would have told
a caller the log was optional and sent them to a usage error. Found by running the
command, not by reading it. Fixed before the node shipped.

`requires` distinguishes the two deliberately: preflight reads SOURCE and needs no
TeX distribution; overfull reads a LOG and so needs a build to have happened.
Stated so a caller does not assume both have the same prerequisites.

### Falsifier

`latex-validation` left `tools:coverage`'s uncovered tiers. Verified: typecheck,
`check:tools`, 3310 tests with 0 failures, 46 gates — the whole set.

### Still open on this bean

`latex-authoring` (the unsatisfiable contract above), and the remaining TeX
scripts — `validate-tex`, `audit-tex-source`, `latexmk-compile`, `render-latex`,
`generate-block-tex`, `generate-main-tex`, `headless-render-qc`.

_2026-09-26T03:34:29Z_ — Claimed by claude/fervent-mccarthy-nw4olk — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
