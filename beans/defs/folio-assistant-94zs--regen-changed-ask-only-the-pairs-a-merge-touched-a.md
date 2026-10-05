---
# folio-assistant-94zs
title: 'REGEN --changed: ask only the pairs a merge touched, and narrow the fixpoint''s later passes'
status: in-progress
type: task
priority: high
created_at: 2026-10-05T05:12:20Z
updated_at: 2026-10-05T05:12:27Z
parent: folio-assistant-xpcu
---

Owner, 2026-10-05: "maximize efficiency, get regen time as minimal as possible".

## What
1. `bun run regen --changed <base>`: changed paths = `git diff --name-only <base>...HEAD` plus the working tree. Ask only pairs whose declared inputs/outputs (globs) or script import closure intersect them. Undeclared and `{tracked}` pairs always run. `--explain` names each skip. Default stays the full run.
2. Narrow fixpoint: pass N+1 re-asks only pairs whose inputs intersect what pass N actually changed (measured from git status before/after, not declared), plus undeclared pairs. Settled still means a pass that ran no writer.
3. Narrow glob declarations in `task-io.ts` for the slow pairs, each READ first, so (1) skips anything at all: today every declared pair is `{tracked}`.

## Falsifier
A pair whose declared input changed is skipped. Tests must show it never is.

## Done when
- [ ] `--changed` + narrowed fixpoint, with bun tests for each case above
- [ ] merge:main decision recorded with reasons
- [ ] measured full vs `--changed` on one realistic merge, load noted
- [ ] regen docblock + skill regen-mode description updated

Claimed by session https://claude.ai/code/session_01VfkKocGaQW7Msro2t5S66U on branch claude/zealous-gates-3o9ma2 (2026-10-05).
