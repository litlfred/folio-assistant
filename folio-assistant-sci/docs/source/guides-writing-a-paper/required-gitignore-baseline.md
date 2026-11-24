Every new folio repository starts with these entries. Agent sandboxes
accumulate scratch directories as untracked state, and a single `git add -A`
then commits all of it under a message describing something else.

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

**Keep the leading slashes.** A gitignore pattern with no internal slash
matches at *every* directory depth, not just the root: unanchored, `_deprecated/`
would also catch a nested archive such as `computations/_deprecated/`, and
`scratch/` every `content/**/scratch/`. An ignore rule never untracks a file, but
any *new* file under such a path is skipped by `git add` with no error and no
output. If your folio keeps a nested archive or scratch area under one of these
names, the anchored form keeps it committable.

Two deliberate exclusions:

- **`beans/` stays tracked.** It is the durable, cross-session work plan; a
  sibling agent has to be able to read it. Bean *duplication* is prevented by
  the create-guard of the `todo-manager` skill, not by ignoring the directory.
- **Any directory your folio documents as a real pipeline stays tracked** — in
  `qou`, `uploads/` is the document-intake stage and belongs in git. Check your
  own `AGENTS.md` §Project structure before adding a path to this list: if it is
  documented there, it is content, not scratch.
