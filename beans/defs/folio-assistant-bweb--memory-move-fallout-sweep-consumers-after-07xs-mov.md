---
# folio-assistant-bweb
title: 'MEMORY MOVE FALLOUT: sweep consumers after 07xs moved skills/memory/ to memory/'
status: completed
type: task
created_at: 2026-09-20T09:36:20Z
updated_at: 2026-09-20T09:36:20Z
parent: folio-assistant-8jt6
---

Owner queued this as item 3 on 2026-09-20: *"07xs fallout — sweep for other
consumers still expecting `skills/memory/`"*. Prompted by my own
`check-retired-front-matter` going blind on exactly that, hours after the
move, in PR #479.

## Result: one real finding, and that is the honest headline

`07xs` was done properly. Every consumer resolves the directory from the
DECLARATION — `agent-memory.ts` uses `directoryForGraph(ROOT, "memory")`
with a `repoRootFor` fallback, never a literal — so nothing in code broke.

24 textual matches for `skills/memory` remain and **23 are correct**:
historical prose of the form *"it sat in `skills/memory/` until
2026-09-20"*, in `directory-conventions.md`, `known-skills.ts`,
`agent-memory.ts`, `harness.json` and the tests. Those are provenance, not
stale paths, and rewriting them would destroy the record of why the
directory moved.

### The one that was wrong

`memory/placement-is-a-skill-run-it-before-you-create-a-node.md` told the
reader four archived entries were *"still nodes under `skills/memory/`"* —
present tense, a location that no longer exists.

It matters more than its size because of **where it lands**: that entry is
injected into `platform-boundary-guard`'s prompt via
`.claude/agent-memory/platform-boundary-guard/MEMORY.md`. A stale path in a
generated doc is a broken link; a stale path in an injected memory is an
agent told the wrong thing before it starts. Fixed at the source node and
regenerated, which is the discipline `agent-memory.md` states — entries are
authored as nodes, never edited in the generated file.

Now reads "still nodes in the declared `memory` graph": naming the GRAPH
rather than a path, so the next relocation cannot stale it.

## What the sweep confirms about the earlier failure

`check-retired-front-matter` broke not because `07xs` was careless but
because the check named graph kinds by hand. The lesson is the check's, not
the move's — recorded on `qif9` and in the code.

## Done when

- [x] every live consumer resolves `memory/` from the declaration
- [x] injected agent memory carries no stale path
- [x] historical prose left intact, deliberately
