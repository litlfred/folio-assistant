---
# folio-assistant-dups
title: Recover lost simulator-math-audit skill (qou stub points nowhere)
status: todo
type: task
created_at: 2026-08-07T10:07:17Z
updated_at: 2026-08-07T10:07:17Z
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
