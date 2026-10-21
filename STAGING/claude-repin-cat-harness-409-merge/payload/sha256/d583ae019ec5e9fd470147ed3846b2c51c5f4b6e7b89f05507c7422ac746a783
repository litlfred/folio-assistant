---
# folio-assistant-3sbm
$schema: bean/1.0.0
title: 'TOOL RELEASES + PROFILES: named, versioned, hashed tool sets with per-tool runtimes; PROV-O log of what each run used; SPDX 3 as export'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-07T22:13:50Z
updated_at: 2026-10-21T21:32:00Z
parent: folio-assistant-zzmr
---

Issue #2481. Owner 2026-10-07: 'need named/versioned releases + sha of software. it's not a gate per se, but a logging of what version of the Tool was used for audit purpose'; 'different tools may need different instances of java, so cannot pin java globally'. Owner chose PROV log + SPDX export. Closes G4 of the SPDX proposal (bean sd5v); answers D1's missing consumer (bean ffv7).

## Done when
- [x] design doc (CRDM) signed off by the owner: tool-release record, per-tool runtime deps, profiles, provisioning cache, PROV-O run record, SPDX export mapping (signed off 2026-10-07: `T1 = (a)`, `T2-4 ok`, `C1 = (a)` by reference `runContext: { sha256 }`)
- [ ] built only after sign-off (Step 1 of 8 built: `schemas/tool-release.ts`, `schemas/tool-profile.ts`, `schemas/run-context.ts`, `cat-harness/tool-releases/`, and `cat-harness-tools/scripts/tool-releases.ts --check` in `code-quality-gates.yml`; Steps 2–8 resolver/cache `tools:use`, `prov:used`, `tools:sbom`, more tools, `upstream-pins`, `runContext` emission, `test:itb-export` pending)

Session: https://claude.ai/code/session_01FWGdsHong3XHiU7CMRWmfo


- [x] design doc drafted: cat-harness/docs/proposals/tool-releases-2026-10-07.md (decisions T1–T4 for the owner)
