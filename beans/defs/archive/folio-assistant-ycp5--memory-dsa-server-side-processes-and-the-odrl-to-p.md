---
# folio-assistant-ycp5
$schema: bean/1.0.0
title: 'Memory: DSA server-side processes and the ODRL-to-Permission renderer go in litlfred/smart-trust-phw (owner 2026-10-30 19:59Z), not a new smart-trust-server...'
status: completed
type: task
priority: low
created_at: 2026-10-30T20:00:06Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dsa-smart-trust-server.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: DSA server-side processes and the ODRL-to-Permission renderer go in litlfred/smart-trust-phw (owner 2026-10-30 19:59Z), not a new smart-trust-server repo


Owner, 2026-10-30 19:59Z (thread "Drain folio-assistant issues and P1 bugs", fa#2702): "put it in smart-trust-phw. when using the VHL, a sharer may have (C)DSA on receiver".

- The DSA server-to-server processes (P4, P5, P11–P13 in /mnt/project-files/dsa-analysis/dsa-processes.md) and bean folio-assistant-jfbm (a one-way ODRL to FHIR R5 Permission renderer, output only) go in **litlfred/smart-trust-phw**.
- phw also models a VHL sharer binding the receiver to a data sharing agreement, computable or not.
- Not smart-trust (owner 19:56Z "no, not smart-trust"), not smart-trust-tools, not fhir-harness. The earlier plan for a separate litlfred/smart-trust-server repo is dropped.

**Why:** the owner's placement choice, after rejecting smart-trust.
**How to apply:** put DSA server/VHL-DSA work in phw. Coordinate with the "Drain PCF beans" thread, which also edits phw.
