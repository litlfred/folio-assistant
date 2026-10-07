---
# folio-assistant-w0at
title: 'S8 cut over: submodule if imported, subscription if read; in-tree copy removed only on owner OK'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:14:34Z
updated_at: 2026-10-06T19:00:43Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-mgxw
---

Absorbs syzb, fnx4 cutover path, 4475. G11 (slice-7 layout vs staged dirs) is a prerequisite.

## Done when
- [ ] import-consumed instances are submodules
- [ ] read-consumed instances are subscriptions
- [ ] in-tree copies removed per instance on owner OK


## Amended — owner 2026-10-06 (options 1+2)
Cutover mechanism replaced, following the remote-mount ruling (bean 0mpw):
- **code** an instance imports (builders shim, MCP server, scripts) -> a **pinned package** (e.g. `bun add github:litlfred/<repo>#<sha>`), not a submodule;
- **knowledge graph** it reads (skills, processes, nodes) -> a **declared remote mount** (a directory with a remote source pinned to a SHA; defaults in the harness's own declaration, overridable by the downstream folio);
- read-only consumers stay **subscriptions** (kg:subscribe / kg:materialize);
- in-tree copies still removed per instance only on the owner's OK.
**The smart-ra pilot (bean 0mpw) is S8's first live run and is NOT blocked by mgxw**: smart-ra already lives in its own repository, so it needs no staging repo. mgxw (S7 seeding) and G11 still gate the cutover of the instances that are still in this monorepo.


**Owner 2026-10-06: cutover directories go to fsh-guts.** When an instance's in-tree copy leaves this repository at cutover, it is MOVED into the fsh-guts graph (deprecated/throwaway structured content, mounted from branch cat/cat-harness/fsh-guts via state:mount and written with state:push) rather than deleted — still only on the owner's OK per instance, and with a fsh-guts node recording where the live copy now lives (repository + pinned SHA).
