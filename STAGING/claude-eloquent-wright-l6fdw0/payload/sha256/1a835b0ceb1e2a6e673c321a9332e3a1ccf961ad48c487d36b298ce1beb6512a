---
# folio-assistant-rva2
title: 'STATE BRANCH P7: declare every special branch with the same field — gh-pages (within folio, keyed by commit, back-link = build.json) and lake-cache/*'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T10:58:10Z
updated_at: 2026-10-04T17:01:12Z
parent: folio-assistant-fs43
---

The general practice: every graph not on main is a declared sub-graph with a back-link {ref, sha} to the content commit it describes. build.json (bean r6es) is the first back-link.

## Done when
- [ ] gh-pages declared
- [ ] lake-cache/* declared
- [ ] audit:coverage sees all special branches

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md


## Owner's ruling, 2026-10-03: per-harness and per-instance, never one central table

The owner, on being shown that `cat-harness/scripts/special-branches.json` describes
itself as *"the ONE declaration of the names"*:

> *"that doesnt seem right. each harness declares it, (and each instance can also
> declare), why centralize?"*

That is this bean's target, and the file's own `$comment` already agrees — it calls
itself INTERIM and names this bean as where it folds in. The agent that quoted
"the ONE declaration" as if it were the design was reading a file's description of
its current role as architecture.

**Three arguments, in increasing force:**

1. **The same rule already governs directories.** An instance declares what it holds,
   inherits its dependencies' entries, and overrides match on the entry's `id`, not
   its path. A special branch is the *storage* of a declared graph, so it belongs on
   that same entry rather than in a parallel table.

2. **A central table drifts, and has.** Measured 2026-10-03: the file declares
   `cat-state` while the live branch is `cat/cat-harness/state`, and declares
   `cat-qa-reports` while the three branches that actually exist are
   `cat/cat-harness/{beans,state,todos}`. Nothing binds the table to the harness that
   writes the branch, so the rename happened and the declaration did not move. A
   declaration owned by the writer cannot drift that way: the name and the writer are
   one change.

3. **Cross-repository, it cannot even be verified where it lives — this is decisive.**
   Measured across all 705 refs of this repository: `fhir-ast/*` is **0 branches** here
   (they are in `litlfred/smart-trust`) and `lake-cache/*` is **0 branches** here (they
   are in folio repositories such as `litlfred/qou`). A table in folio-assistant
   declaring branch names that exist only in *other* repositories is unverifiable at
   its own location, which is why its `repos:` field has to say "none in this
   repository" in prose. The harness that owns the branch is the only place the
   declaration can be checked against reality.

**What stays shared, and it is not the names — it is the RESOLUTION RULE.** The file's
stated reason for being JSON is real: a folio may restore a Lean cache with no `bun` on
the path, so a shell or Python reader needs it. And readers and writers must resolve
identically, or a writer creates a branch a reader cannot find — which is the live
`cat-state` failure above. So: each harness declares its own, each instance may override
by `id`, and ONE resolver implements the rule for all of them.

### Why this is still blocked, measured rather than assumed

The `storage` field this bean needs **is not on `main`**: zero hits for a `storage`
field in `cat-harness/schemas/cat-harness.ts` at `origin/main`, against 7 hits for
`graphKinds` with the same grep shape — so the empty result is a fact and not a broken
pattern. It arrives with arc `3fva`, which exists only on PRs #1764 and #1801. So this
bean is blocked on those landing, and the interim table is unavoidable until then.

**Interim obligation, so the stopgap is at least correct:** bean `32f6`'s rename must
also fix the table's `name` fields to the slashed form in the same change. Leaving them
flat means a writer resolves `cat-state`, finds nothing, falls through to the legacy
`state` which no longer exists, and creates a THIRD name for a branch that already has
two.

_2026-10-04T17:01:12Z_ — Claimed by claude/gifted-fermi-t8k217 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
