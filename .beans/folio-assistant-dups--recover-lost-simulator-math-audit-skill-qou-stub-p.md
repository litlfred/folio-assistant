---
# folio-assistant-dups
title: Recover lost simulator-math-audit skill (qou stub points nowhere)
status: completed
type: task
priority: normal
created_at: 2026-08-07T10:07:17Z
updated_at: 2026-08-07T10:17:10Z
---


## Problem

`qou/.claude/skills/local/simulator-math-audit.md` is an 8-line stub:

> This skill has been refactored to the `folio-assistant` repository.
> Please refer to: `folio-assistant/.claude/skills/local/simulator-math-audit.md`

That target **does not exist**. The skill was removed from qou but never
landed in folio-assistant — a migration that dropped its payload.

`skills/folio-paper-adapter/simulator.md` does NOT cover it (zero
mentions of auditing; it is about authoring simulator content objects).

Not recoverable from this session: the qou clone is `--depth 1`, so
there is no history to restore from. Recovery needs either a full-history
fetch of qou (`git log --diff-filter=D -- '*simulator-math-audit*'`) or
the content re-authored.

Either way the dangling stub in qou should be removed or repointed.

## Fixed — recovered

`git fetch --unshallow` on qou, then hunted every rev touching the path.
The pre-stub content survived at
`69f8e470bc:folio-assistant/.claude/skills/local/simulator-math-audit.md`
(19 lines) — recovered and landed at
`skills/folio-paper-adapter/simulator-math-audit.md`.

Generalised while restoring: the original named one folio's compute
substrate (`qou-mass`) and its constants. Now it says to resolve the
substrate from the folio, and reframes the no-hardcoded-constants rule
with the reason it matters — a hardcoded constant is a silent divergence,
because the paper's value can be corrected while the simulator keeps
showing the old one and nothing fails.

Findings now go to the block's `.qa.json` sidecar rather than a
free-standing report, so they travel with the content and reach the
watchers.

Still open for the qou side: its stub should be deleted or repointed.
