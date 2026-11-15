---
# folio-assistant-8d8b
$schema: bean/1.0.0
title: 'Memory: Thread "Plan local web server for rendered harnesses": local server at 127.0.0.1:4007 shipped (Phases 1-3, 2026-10-31/11-01), decisions and PRs'
status: completed
type: task
priority: low
created_at: 2026-10-31T14:33:18Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `local-web-server.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Plan local web server for rendered harnesses": local server at 127.0.0.1:4007 shipped (Phases 1-3, 2026-10-31/11-01), decisions and PRs


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9Kj6DHzBjcHVa2MkNkzZ3So: second way (besides GitHub Pages) to view rendered folios on the owner's machine, with litlfred.github.io IRIs resolving locally.
Workplan: /mnt/project-files/local-server-2026-10-31/workplan.md
Found: cat-harness-tools already has scripts/serve-rendering.ts (Bun, binds 127.0.0.1, one site), preview-site.sh (Jekyll), stage-local.ts --artifact DIR, deploy/Caddyfile.template. IRIs = <iriBase>v<major>/..., iriBase per instance declaration.
Recommended origin http://127.0.0.1:4000 (not localhost: IPv6 ::1 trap, split storage).
Plan: owner picked A (extend Bun server + serve-time IRI rewrite) 14:38Z. Ask before opening any PR. Related: folio-assistant-xq9j.
Runtime: owner picked B (Bun now, web-standard core, Node launcher later) 2026-10-31 14:37Z.
Bun vs Node finding (2026-10-31): MCP server = 33 in-process tools / 19 modules; 16 port easily (import.meta.dir->dirname), 3 need one-line swaps (Bun.sleepSync in branch-store/qa-store, Bun.stdin in lsi.ts, Bun.serve HTTP mode in server.ts/gateway-trust.ts). Main blocker: TS shipped as src/index.ts with ./x.js->x.ts imports (needs tsc/bun build or tsx). Bun really needed by build scripts (~59 files, Bun.spawnSync 111 uses, Glob, YAML, bun:sqlite; 45 spawn `bun`) and bun test. Zod is not a Bun dependency.
Port: owner picked 4007 (17:17Z). Phase 1 started 17:16Z on branch claude/serve-local-multi in cat-harness-tools.
Phase 1: issue cat-harness-tools#1163, draft PR #1164 (head 4ae5869), subscribed. Next: Phase 2 IRI rewrite after merge.
Phase 1 merged fa601a1 (2026-10-31 17:28Z, owner card "A. Merge and start Phase 2"); #1163 closed. Phase 2 (IRI rewrite) started. Owner 17:28Z: "repin + merge on green (for non content!!) +3hrs" (to 20:28Z).
Phase 2: issue #1166, PR #1167 (head b35ecac), subscribed; merge on green under 17:28Z non-content window.
Phase 2 merged a47cec6 (17:34Z); #1166 closed. Next: Phase 3 (one command + skill doc in cat-harness: serving-renderings.md/turn-reporting.md still say port 4000) awaiting owner card.
Non-content merge window extended to 23:28Z (owner 'A' 19:59Z via coordinator). Phase 3 card (cmsg_017WNUkNK8kdDziPK58Pv6G9NQPXtQYKqJgxWgWsh8rjbU) still unanswered.
Phase 3: owner picked A 20:23Z (via coordinator, cited). Started.
Phase 3: issue tools#1179, PR tools#1182 (c29ea22), docs PR cat-harness#874 (4a4a713); both subscribed; merge on green under window to 23:28Z.
Phase 3 tools#1182 merged f284ab7 (20:35Z). Waiting cat-harness#874 CI.
DONE 2026-11-01 07:41Z: cat-harness#874 merged f824cad. All 3 phases + docs merged. Phase 4 (browser redirect extension, Caddy HTTPS, Node launcher) not started; optional.
