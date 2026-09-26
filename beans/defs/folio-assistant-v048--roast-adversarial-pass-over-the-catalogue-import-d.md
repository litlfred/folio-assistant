---
# folio-assistant-v048
title: 'ROAST: adversarial pass over the catalogue-import design before any of it is believed'
status: completed
type: task
priority: normal
created_at: 2026-09-20T08:02:32Z
updated_at: 2026-09-24T17:54:11Z
parent: folio-assistant-kupb
---

Owner: 'bean up and roast.' The roast is a deliverable, not a mood. It belongs as a bean so the objections survive the chat, which is the same reason `kg:audit` writes sidecars rather than printing a verdict: a printed objection is gone, and 'nobody raised this' and 'somebody raised it and it was answered' become indistinguishable.

Findings recorded in the chat this session; to be written up here with each one's status (answered / open / accepted-as-cost).

## The roast, re-done 2026-09-24 against `main` as it stands

**The 2026-09-20 findings were never written here.** They lived in a chat that
is gone, which is the failure this bean was opened to prevent. So this is a
**fresh** adversarial pass over the design as built, not a reconstruction. What
the 09-20 roast said is unrecoverable, and that is recorded rather than guessed.

**Method.** An adversarial reading of `kupb` and its closed children (`hfwl`,
`hpax`, `j66n`), plus the code under `who-iris/`, `folio-assistant-core/schemas/`
and `cat-harness/processes/`. The checks were run, not read: `check:catalogue` (13
nodes: 10 referenced, 3 materialized), `iris:pages:check` (11 pages),
`iris:covers:check` (3; *"NOT re-rendered: no PDF backend here"*),
`check:materialized-fixity` (276 artefacts, 272 verified, 1 unverifiable) and
`check:voices`, all green. The four load-bearing findings (3, 4, 5, 7) were
re-verified by a second reader before being written here.

| # | claim attacked | evidence | status |
|---|---|---|---|
| 1 | "materialized" means the bytes are here and match their record | `check-catalogue.ts:118-146` only checks that `localPath` exists; the hash is `check:materialized-fixity` (CI, `code-quality-gates.yml`). `sha256sum` of all 3 PDFs matches `fixity.digest` | **answered**, by a different check than the instance names |
| 2 | the bytes match the SOURCE | every digest was computed locally from owner uploads; no upstream checksum was captured (DSpace publishes one per bitstream); `iris.who.int` returns 403 through the egress proxy | **accepted-as-cost**: egress blocked, stated in `large-datasets/sources/who-iris.json`. "Matches IRIS" is unproven, not verified |
| 3 | the copyright / restrictions gates guard publication | all held bitstreams carry `copyright: unknown` and `restrictions: unknown`, yet the PDFs are linked from the public pages via raw.githubusercontent and jsDelivr. `gen-iris-pages.ts` reads gates only to **count** them on a summary page (l.1062). `refusedGates` / `unansweredGates` are called from a test and nowhere else, so `copyright: refused` would pass every check | **OPEN** |
| 4 | "`unknown` on any single gate is enough to keep the node `referenced`" (`materialize-remote.bpmn:45`) | all 3 items are `materialized` with unknown gates; no schema refinement or check enforces the rule | **OPEN**: the catalogue breaks its own process |
| 5 | the sample-import SDLC is executable and has been run | `sample-import.bpmn` loads and renders, with skills bound, but `beans/workflows/` holds no instance of it or of `materialize-remote`; no `.ts` file names it; the 3 items arrived as owner uploads, not through it. `hfwl`'s Done-when asked only for diagram + skill + render | **OPEN**: a diagram plus a skill, never run end to end |
| 6 | "what happens if the source goes away" is handled | no step in either process checks the source is still there; nothing reads `provenance.upstream` for liveness; no snapshot or Wayback pointer anywhere; referenced nodes (10 of 13) may not carry gates (`materialization.ts:467`), so their `sourceLoss` is never asked | **OPEN**: answered only for the 3 held PDFs, by keeping them in git |
| 7 | resolve by Handle, the only id that survives the host (`iris-dspace.md` R1, l.131) | every node id is a DSpace UUID or a path; every upstream URL is `iris.who.int/…`; `hdl.handle.net` occurs 0 times in `who-iris/catalogue` | **OPEN**: contradicts the design's own R1 |
| 8 | the hierarchy is real, not invented (R11, R15) | 2 of 8 community UUIDs appear in a committed capture; the other 6, the 361.55 GB figure and the per-community counts cite captures not in the repo; both collections are path-keyed with the parent community's URL as `upstream`, the fallback R15 forbids | **OPEN** |
| 9 | the stubs will merge with a real import (R7) | the WPRO item's parents skip the sub-community level its own note describes; nothing in `catalogue.ts` (no alias, `sameAs` or superseded-by) lets a UUID-keyed real import merge with a path-keyed stub, so one collection would become two nodes | **OPEN** |
| 10 | the Dublin Core record is lossless | the TYPE is generic enough (`dublin-core.ts:101-106`); the INSTANCES are lossy by their authors' own note: the handbook's abstract is truncated, 1 of 8 bitstreams is recorded, and the MeSH "authority" is the bare namespace rather than a descriptor id | **OPEN** (instances, not type) |
| 11 | 361.55 GB / 1,057,223 files are measured | transcribed from uncommitted captures; known communities cover 992,467 files and 344.99 GiB, and the other 3 are marked "page 2 was NOT read". `who-iris.json` says IRIS "does not publish" an item count while `catalogue.json` records 273,559; `materialize-remote.bpmn:91` still cites "0.7 TB is the measured reason", which `catalogue.json` calls a never-measured chat figure | **OPEN** for the drift between three stores; partial coverage **answered**, since it is declared unknown |
| 12 | "mock up the FULL catalogue as having been in the KG" | 13 nodes plus aggregate counts; nothing represents the other ~273,546 items, not even a shard or enumeration manifest. The catalogue is 100 KB at ~2.3 KB/node; `check-catalogue.ts` and `gen-iris-pages.ts` `readdirSync` every node (inference: that shape won't scale to a full mock) | **accepted-as-cost**: `who-iris/AGENTS.md:7-11` ("the gap is the point, not a shortfall"). Whether that is what the owner meant by "as having been in the KG" is the owner's |
| 13 | retention is decided | ORIGINAL bitstreams say `retention: permitted`, "kept indefinitely", while `materialization.ts:62-64` says a copy with no expiry cannot be told from an abandoned one; `who-iris.json` prose says "TWELVE nodes, 9 referenced" against 13 and 10 measured | **OPEN** (minor) |

**Tally: 1 answered, 2 accepted-as-cost, 10 open.**

### The three that matter most

1. **3 + 4: publication ignores the gates.** Every held PDF has `copyright`
   and `restrictions` unknown and is still redistributed through the public site
   and a CDN. No code turns a gate verdict into a publish decision, and the
   catalogue contradicts `materialize-remote`'s own rule. A gate that only
   warns is, in `materialization.ts:53`'s own words, no gate.
2. **6 + 7: referenced content has no survival path.** Every pointer is bound to
   `iris.who.int`; no Handle-System URL, no liveness check, no snapshot. That
   contradicts R1, and "what happens if the source goes away" — the owner's
   question — is answered only for bytes already copied.
3. **5: the sample-import SDLC has never run.** No instance, no test, and the
   three worked items bypassed it.

### Not done here, on purpose

No fixes. A roast that also repairs is grading its own homework.

**Follow-ups filed under `kupb`, the owner's choice (2026-09-24), knowing it
keeps GOAL 3 open:** `cw35` (gates decide publication: 3 + 4), `08u4` (survival
path by Handle, with liveness: 6 + 7) and `xlg2` (run the sample import: 5).
The other open objections (8, 9, 10, 11, 13) stay recorded here only.
