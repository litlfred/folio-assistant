---
# folio-assistant-sgz9
$schema: bean/1.0.0
title: 'Memory: Bean-drain S2 "Make builds read only pinned inputs" (2026-10-31): FHIR index pin status, AST cache staleness, preview blob 404 fix, open Q-S2-1/Q-S2-2'
status: completed
type: task
priority: low
created_at: 2026-10-31T22:40:18Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `pinned-inputs-s2.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Bean-drain S2 "Make builds read only pinned inputs" (2026-10-31): FHIR index pin status, AST cache staleness, preview blob 404 fix, open Q-S2-1/Q-S2-2


Thread "Make builds read only pinned inputs" (cmsg_017WNUkNK8kdDziPK58Pv6G9Qsmykp9sXWBkmkjNbXsVwZ), sibling S2 of folio-assistant-82df. Coordinates with folio-assistant-7w1o.

- "Shrinking the cone" step 1 is DONE: fhir-harness#249 (45e42a7, pinned in fa) clones each IG at its lock pin; live smart-base menu.json names the pin 633b11f.
- Still off-pin: the AST is restored from the TIP of smart-base branch cat/fhir-harness/fhir-ast/smart.who.int.base, compiled from adadd67 (2026-10-20), 210 commits behind the pin; index.json source.revision says adadd67. Releases come from the GitHub API.
- fhir-harness#253 (issue #252) MERGED 2026-11-01 07:3xZ as 0f3fd6c: menu/releases stamped with the pin's date, releases as of the pin, log warns when AST != pin. fa re-pin: folio-assistant#2863 (window 07:27Z to 10:27Z).
- cat-harness-tools#1206 (issue #1205): main deploy keeps a dropped payload/sha256 blob while an older borrowing preview exists (payload/retained.json); staging-share never shares a retained blob. Draft until Q-S2-2.
- Q-S2-1 (pin AST cache like a layer, A recommended) and Q-S2-2 (A recommended) posted 2026-10-31 ~22:55Z.
- Other "not recorded" writers on main build.json: slice:sqlite (kg-export readSourceProvenance: git status + HEAD, reruns per commit anyway), site:viz (reads gh-pages via BranchStore, by design), subgraph:jsonld (trace > 256 MB), smart:pages (reads then rewrites smart-base/docs/assets).
- Local test setup: sibling clones under /home/claude (fhir-harness, cat-harness-tools, folio-assistant-core) + node_modules symlinks, CAT_HARNESS_ROOT=<cat-harness clone>.
- Re-pin recipe that worked: shallow-clone fa, `bash .github/mount-from-lock.sh`, `bun install`, then `echo <evidence> | bun run cat mount:remote --seed <inst>=<repo>@<sha> --consent-by litlfred --whole --no-install`, then `bun run cat mount:remote --no-install --no-agent-surface`; revert bun.lock noise.
- 2026-11-01 07:35Z: owner "continue." read as A for Q-S2-1/Q-S2-2; #1206 marked ready. Q-S2-3 A (run smart-base AST refresh once at 633b11f) tapped 07:38Z but NOT run: the workflow seeds only when inputs equal main tip (ce2ee66 changed input/scripts). Q-S2-4 posted (A: build at ce2ee66 + re-pin fa smart-base). fhir-harness#254: ig-ast.lock.json pin + restore --commit.
- Owner rule 07:38Z: if agy needs to do something, file a bean and put ready-to-paste agy instructions on the main (project) chat via the drain thread.
- 2026-11-01 08:12Z: smart-base AST refresh run 41286053072 (ce2ee66) FAILED at the mount step, like every refresh since 2026-10-30: who-iris (mounted in smart-base) can't install when mounted (npm 404 @litlfred/folio-assistant-core). The step is in fhir-harness's reusable .github/workflows/ig-ast-refresh.yml (smart-base calls it @main), so the fix is fhir-harness#256 (issue #255, --no-install), no smart-base change. Q-S2-5 (smart-base PR) was withdrawn. Next: merge #256 + #254 in window, rerun refresh at ce2ee66, re-pin fa smart-base and add ig-ast.lock.json.
- 08:50Z: fa#2863 CLOSED, superseded by drain's fa#2869 (fhir-harness 93b93eb, contains #253). Q-S2-6 tapped A (08:47Z): wait for fhir-harness#254, fold it into the one re-pin (#2869), then merge despite the reds main also has. User asked for a sibling thread to fix main's reds (asked the coordinator).
- 09:25Z: #254 merged (6bc0b5f; asked drain re-pin thread to move fa#2869's fhir-harness pin there). #256 merged (992af5b). Rerun 41291110521 then failed: fhir-harness/schemas/ig-ast.ts imports @litlfred/cat-harness-tools by name and an IG repo has no root workspace. Fix fhir-harness#261 (issue #260): link mounted @litlfred/* into root node_modules. site-publish.yml template may need the same.
- 10:16Z: #261 merged (0cd0bb7). Rerun 41294911249 failed at the Publisher: build.fhir.org 404 for who.template.root#current; the seeder needs the caller input template-repos. Fix is one line in smart-base .github/workflows/ig-ast-refresh.yml (template-repos: who.template.root=WorldHealthOrganization/smart-ig-template), prepared locally on branch claude/s2-ast-template-repo, NOT pushed: Q-S2-7 asked (smart-* needs the user's yes).
- 11:47Z: Q-S2-7 A tapped 10:17Z; smart-base#267 (issue #266) merged 831497d after one green re-run (reference-direction NEW findings on first run were between mounted layers). Refresh rerun 41303384892 at ce2ee66. Window ended 10:27Z: the fa smart-base re-pin merge needs the user's word.
- 12:15Z: AST cache SEEDED: cat/fhir-harness/fhir-ast/smart.who.int.base = e9c9eb2 (src ce2ee66, 229 resources). Asked fa#2869 thread (cmsg_017WNUkNK8kdDziPK58Pv6G9CRuwUmiuwgA8KXd9EKj6WZ) to fold smart-base re-pin 633b11f->ce2ee66 (functional only) + ig-ast:pin --sha e9c9eb2 into #2869 (fhir-harness da547ab there has #254/#261). Merge rides Q-DRAIN-9.
- 16:22Z: fa#2869 carries smart-base ce2ee66 but NOT the AST pin: root ig-ast.lock.json fails check:undeclared-files. #2869 thread is adding it to cat-harness-tools ROOT_INFRASTRUCTURE (tools#1287, watched). S2 OWNS the follow-up: separate fa PR running ig-ast:pin --sha e9c9eb2 after #2869 merges and a tools re-pin carries that change.
- 17:35Z: fa#2869 merged (5a0c104; smart-base ce2ee66, fhir-harness 4a6e7af). tools#1287 merged 31e328f. Opened fa#2887 (issue #2886): ig-ast.lock.json pin e9c9eb2 + tools re-pin 329f553->31e328f; window "+3hrs" 17:27Z to 20:27Z (cmsg_017WNUkNK8kdDziPK58Pv6G9NvMGGKmpGA95ekCsPZLSdn). Merge on green, functional only.
- 19:20Z: fa#2887 DRAFT. Re-pinning tools+cat-harness without bootstrap-tools broke stage (review-log-watch.svg not rendered). Plan: after re-pin train (fa#2890/#2864) merges, reset branch claude/s2-pin-smart-base-ast onto main with ONLY ig-ast.lock.json (ig-ast:pin --sha e9c9eb2, evidence Q-S2-4 A 07:45:20Z), check undeclared-files + ig-ast:lock:check, mark ready, merge (window or user's word).

- 19:50Z 2026-11-01: fa main's fhir-harness pin (4a6e7af) already has ig-ast:pin, so fa#2887 was reset onto main (5c07dc8) with ONLY ig-ast.lock.json; no longer waits on the train fa#2890. Ready; merge on green (window to 01:36Z).
- 20:35Z: fa#2887's only new red = undeclared-files on ig-ast.lock.json; fixed upstream in tools 80323b0, carried by train fa#2893 (tools f92092e). Merge #2887 after #2893 merges (or with the user's word). Q-S2-8 closed as moot (A, already done).
- 2026-11-02 06:24Z: fa#2887 MERGED (41bbb14) on card Q-S2-9 A. smart-base AST pinned at e9c9eb2 in fa's ig-ast.lock.json. S2 done.
