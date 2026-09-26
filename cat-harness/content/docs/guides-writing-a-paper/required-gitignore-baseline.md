Every new folio repository starts with these entries. They are not optional
polish — agent sandboxes accumulate scratch directories as untracked state, and
a single `git add -A` then commits all of it under a message describing
something else. In the `qou` folio that mechanism produced one commit adding
**46,155 files / 11.4 M insertions** under a one-file Lean subject line,
including 14,688 duplicate beans.

```gitignore
# Agent scratch state — transient tooling state, never repository content.
# Leading slash = root-level only. Keep it (see the warning below).
/.agents/
/amalgamated_done/
/amalgamated_input/
/_deprecated/
/scratch/
.claude/worktrees/

# Python bytecode
__pycache__/
*.py[cod]
```

**Keep the leading slashes.** A gitignore pattern containing no internal slash
matches at *every* directory depth, not just the root. Written unanchored, the
`_deprecated/` line above silently captured two documented archives in the `qou`
folio — `computations/_deprecated/` (1,449 tracked files, including
`script-qa/*.script-qa.json` QA sidecars) and `docs/audits/_deprecated/` (66) —
and `scratch/` reached every `content/**/scratch/`. Already-tracked files were
unaffected, because an ignore rule never untracks; the hazard is that any *new*
file under such a path is skipped by `git add` with no error and no output. If
your folio keeps a nested archive or scratch area under one of these names, the
anchored form is what keeps it committable.

Two deliberate exclusions:

- **`beans/` stays tracked.** It is the durable, cross-session work plan; a
  sibling agent has to be able to read it. Bean *duplication* is prevented by
  the create-guard in
  [`skills/folio-core/todo-manager.md`](../../skills/folio-core/todo-manager.md),
  not by ignoring the directory.
- **Any directory your folio documents as a real pipeline stays tracked** — in
  `qou`, `uploads/` is the document-intake stage and belongs in git. Check your
  own `AGENTS.md` §Project structure before adding a path to this list: if it is
  documented there, it is content, not scratch.

> **Assistant:** *(creates blocks, calls `content_list`)* Scaffolded 5 blocks
> under `content/harmonic-series/`. Current artifacts:
>
> ```
> content/harmonic-series/
> ├── 00-intro.prose.md
> ├── 10-def-partial-sum.definition.md
> ├── 20-thm-diverges.theorem.md
> ├── 21-prf-diverges.proof.md
> └── 30-ex-h4.example.md
> ```

Each block carries typed front-matter validated against the
[content-object model](../api/). A definition block, for example:

```markdown
---
kind: definition
id: def:harmonic-partial-sum
title: Harmonic partial sum
lean: HarmonicSeries.partialSum
---
For $n \ge 1$, the *$n$-th harmonic partial sum* is
$$ H_n = \sum_{k=1}^{n} \frac{1}{k}. $$
```
