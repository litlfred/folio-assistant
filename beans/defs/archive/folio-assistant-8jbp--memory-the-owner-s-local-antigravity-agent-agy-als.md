---
# folio-assistant-8jbp
$schema: bean/1.0.0
title: 'Memory: The owner''s local Antigravity agent ("agy") also drains beans; how to recognise its commits and avoid clashing'
status: completed
type: task
priority: low
created_at: 2026-10-24T08:14:07Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `agy-local-agent.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: The owner's local Antigravity agent ("agy") also drains beans; how to recognise its commits and avoid clashing


"agy" is litlfred's local Antigravity agent. It drains beans in parallel with the cloud Claude threads (user, 2026-10-24 08:12Z). Its bean-branch commits are authored `Carl Leitner <litlfred@fenugreek.home>`. Cloud threads commit as `Claude <noreply@anthropic.com>` or `litlfred <litlfred@users.noreply.github.com>`. agy also authors PRs (for example cat-harness-tools#639, smart-base#140, folio-assistant-sci#66) and runs the W7 connected-agent rounds on smart-immunizations.

**Why:** two agents claiming one bean duplicate work and conflict on the bean branch.

**How to apply:** before starting or refilling any bean, fetch `cat/cat-harness/beans` and skip the bean if agy touched it in the last 24 hours or its notes say it's claimed. Claim with a plain commit before any work. The live queue, with agy's claims marked, is `/mnt/project-files/drain-queue/open-beans-2026-10-24.md`. See folio-assistant-wmmg.

Check claims in a full clone (or `git fetch --deepen=300` first). In a shallow clone the boundary commit is agy's `beans(w7r4): claim bean (step 0)`, which looks as if it touched every bean.

2026-10-24: f1e1 clashed (cat-harness-tools#688 vs agy's #686). The owner chose to keep #688, and agy rebases its profiles/ambiguous-state parts onto it (comments are on #686 and cat-harness#502).
