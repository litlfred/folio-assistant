---
# folio-assistant-7jge
$schema: bean/1.0.0
title: 'Memory: The Antigravity ("agy") agent on the user''s machine also drains beans; how to tell its work apart and avoid clashing'
status: completed
type: task
priority: low
created_at: 2026-10-24T08:15:21Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `agy-agent.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: The Antigravity ("agy") agent on the user's machine also drains beans; how to tell its work apart and avoid clashing


Since 2026-10-24 an Antigravity agent ("agy") on litlfred's own machine drains beans in parallel with this project's threads. It commits as "Carl Leitner <litlfred@fenugreek.home>" and opens PRs under the litlfred account. It has normal internet, so network-blocked beans (whisper/huggingface, packages.fhir.org, id.nlm.nih.gov, WHO IRIS, Cochrane) suit it better than cloud threads.

How to apply (coordinator rule, 2026-10-24 08:14Z): before each bean, `git fetch origin cat/cat-harness/beans` and `git log -3 --format='%an %cI %s' FETCH_HEAD -- 'beans/defs/*<id>--*'`. Skip the bean if agy committed to it in the past 24h; otherwise claim it with a plain commit before working.
2026-10-24: agy holds ckej, 4nfs (smart-base#140), b5f0, c4rz, vm6m, vljz. The "Drain content model and ingest beans" thread holds d5f1, x80s. See folio-assistant-9a0n.
