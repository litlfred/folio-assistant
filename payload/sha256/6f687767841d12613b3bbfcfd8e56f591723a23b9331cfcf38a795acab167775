---
# folio-assistant-3sbm
$schema: bean/1.0.0
title: 'TOOL RELEASES + PROFILES: named, versioned, hashed tool sets with per-tool runtimes; PROV-O log of what each run used; SPDX 3 as export'
status: completed
type: feature
priority: normal
created_at: 2026-10-07T22:13:50Z
updated_at: 2026-10-26T14:03:00Z
parent: folio-assistant-zzmr
---

Issue #2481. Owner 2026-10-07: 'need named/versioned releases + sha of software. it's not a gate per se, but a logging of what version of the Tool was used for audit purpose'; 'different tools may need different instances of java, so cannot pin java globally'. Owner chose PROV log + SPDX export. Closes G4 of the SPDX proposal (bean sd5v); answers D1's missing consumer (bean ffv7).

## Done when
- [x] design doc (CRDM) signed off by the owner: tool-release record, per-tool runtime deps, profiles, provisioning cache, PROV-O run record, SPDX export mapping (signed off 2026-10-07: `T1 = (a)`, `T2-4 ok`, `C1 = (a)` by reference `runContext: { sha256 }`)
- [x] built only after sign-off (Steps 1–8 built: `schemas/tool-release.ts`, `schemas/tool-profile.ts`, `schemas/run-context.ts`, `cat-harness/tool-releases/`, `tools:use`, `tools:which`, `prov:used`, `tools:sbom` SPDX 3.0.1 export, `upstream-pins.json`, `runContext: { sha256 }` emission across run/report schemas, and `test:itb-export` GITB TAR projection in `litlfred/cat-harness#516` @ `04d3f02`, merged `e311ea8d`, and `litlfred/cat-harness-tools#705` @ `4213165`, merged `f9020055`)

Session: https://claude.ai/code/session_01FWGdsHong3XHiU7CMRWmfo


- [x] design doc drafted: cat-harness/docs/proposals/tool-releases-2026-10-07.md (decisions T1–T4 for the owner)

## 2026-10-12: owner ruling "1c"
- The OCR `--dpi` setting is to be recorded on the **per-run record that cites the run context**: the tool-releases proposal's step 7, once that record is built. **Not now**: nothing records `--dpi` until step 7 exists.
