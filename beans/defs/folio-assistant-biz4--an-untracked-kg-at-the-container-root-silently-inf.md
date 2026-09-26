---
# folio-assistant-biz4
title: An untracked _kg/ at the container root silently inflates local detangle counts — 229 becomes 1443, and the gate reads as a code defect
status: todo
type: task
priority: normal
created_at: 2026-09-26T11:26:16Z
updated_at: 2026-09-26T11:26:36Z
parent: folio-assistant-1xhc
---

Found 2026-09-26 while establishing whether `kg:detangle:check` was `hloc`'s
failure or `main`'s. It was neither — it was the container.

## The measurement

`bun run gates` in this checkout rewrote
`cat-harness/test/results/detangle/cat-harness/schemas.detangle.json`:

```
-  "size": 229,       +  "size": 1443,
-  "internal": 125,   +  "internal": 709,
-  "cohesion": 0.82,  +  "cohesion": 0.96,
```

Reverting it made `kg:detangle:check` fail (computed 1443 ≠ committed 229).
Committing it would have pushed a number CI contradicts. **Both options are
wrong**, which is the signal that the disagreement is not in the code.

The control settles it. Same branch, clean `git worktree`, `node_modules`
symlinked, one check at a time:

| tree | stale set |
|---|---|
| pristine `main` | `bootstrap/skills`, `folio-core`, `folio-paper-adapter`, `hypothesis-generation`, `scientific-critical-thinking` |
| this branch, clean worktree | **identical five** |
| this branch, working checkout | `cat-harness/schemas` — and **none of the five** |

`cat-harness/schemas` appears in NEITHER clean tree. The cause is an untracked,
gitignored **`_kg/` (4.8 MB)** at the repository root of this container, which
the detangler walks.

## Why it is worth a bean rather than a shrug

**It inverts the usual control.** The standard question is "is this failure
mine or main's", answered by comparing against the base branch. Here the answer
was "neither", and the comparison actively MISLEADS: the working checkout and
pristine main produced **disjoint** stale sets, so a count comparison says
"1 vs 5, different, therefore mine" and a naive set comparison says "no overlap,
therefore mine". Both conclude wrongly. Only a clean worktree of the SAME
branch separates container state from code.

**It is silent and it is sticky.** Nothing warns that `_kg/` is there; it is
gitignored, so `git status` is clean; and the inflated number is plausible
rather than absurd. Every local `bun run gates` in this container has been
rewriting that sidecar, and the only reason it surfaced is that a stop-hook
flagged the dirty file.

**A sibling already paid for the audit:coverage half.** The standing warning is
*"NEVER run audit:coverage in this container, INCLUDING to read its output —
untracked root `_kg/`/`schemas/` pollute it"*. This extends the same cause to
`kg:detangle`, which that warning does not name, and the extension is what cost
the time.

## Done when

[ ] It is established WHERE `_kg/` comes from — which script writes it, and
    whether it is a legitimate cache or a stray output. Deleting it without
    knowing that just moves the surprise.
[ ] The detanglers (and whatever else walks the repo root) either skip
    gitignored directories or state why they must not. `gitCorpus` already
    exists for exactly this and is used by four scanners; this one is not among
    them.
[ ] Verified by BREAKING it — recreate `_kg/`, confirm the count inflates, then
    confirm the fixed scanner ignores it. A number that happens to be right on
    a clean machine is not a fix.
[ ] The standing audit:coverage warning is widened, or replaced by the scanner
    fix that makes it unnecessary.

## Not claimed

That `_kg/` should be deleted — `deletion-requires-confirmation` applies, and
nobody has established what it is. Reported, not removed.
