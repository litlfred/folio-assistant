---
# folio-assistant-mwfh
$schema: bean/1.0.0
title: 'Memory: Bean g196 / cone row 2 (2026-10-31, sibling S1): previews already share via staging-share normalising; real churn is the KG build stamp on main; tool...'
status: completed
type: task
priority: low
created_at: 2026-10-31T22:44:40Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `g196-preview-slim.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Bean g196 / cone row 2 (2026-10-31, sibling S1): previews already share via staging-share normalising; real churn is the KG build stamp on main; tools#1208


Thread "Slim preview pages to match main" (cmsg_017WNUkNK8kdDziPK58Pv6G9S8tFsJesctgzCegsSXJVcb), bean g196 (cat-harness-tools store).
Measured 2026-10-31 on gh-pages 6b6942b: cone row 2 (byte-equal preview pages) is already met by staging-share.ts (tools#1115): pages equal after setting aside banner/metas/SEO/TypeDoc title are served from main; 4 previews share 16.7k-18.5k files each. Footer already client-side ("deployed dev").
Bigger churn: KG `staging` stamp (sha, run) in every graph page/data file: 112 of 150 sampled files of main deploy ee02d1d..5bdefb2 (10,635 changed) differed only by it.
Fix: cat-harness-tools#1208 (issue #1207, branch claude/g196-no-main-stamp): no stamp when GITHUB_REF_NAME is main/master and no KG_BRANCH. Needs folio-assistant re-pin, then measure.
2026-11-01: owner picked Q-S1-1 A and Q-S1-2 A. Merged tools#1208 (acdae15, no stamp on main) and #1216 (25595e4, no stamp in preview subject HTML; .jsonld keeps it). S1 took over fa#2864 as the consolidated re-pin (head 6445b63, 09:00Z): tools a626573, cat-harness 8d112ae, bootstrap-tools c5b291b. Lock treeDigest/files must be recomputed on each re-pin: /home/claude/scripts/archdigest.sh (git archive + kg-parts treeDigest; reproduces recorded digests). e2e shard 1 red until smart-base SVG re-pin (Fix red checks thread). Then measure main deploy changed-file count vs 10,635.
Measuring: blob:none fetch of gh-pages in /home/claude/ghp; never `ls-tree -l` (lazy-fetches every blob). Tests need sibling clones ../bootstrap-tools and ../cat-harness plus bun install in each.
Related: folio-assistant-7w1o, folio-assistant-xq9j, folio-assistant-vuu4.
2026-11-01 ~11:00Z: merged tools#1238 (b7ab21c), bootstrap-tools#61 (dbc45a3), cat-harness#887 (ce074d8). Closed cat-harness#891 (heldEntries wrong: DMN thread does awaitingCitation, tools#1254/cat-harness#903/core#484). fa#2864 final re-pin waits for those + smart-base SVG; must carry tools main (>=2163090), cat-harness >=32fcb41, fhir-harness da547ab, smart-base#260 sha (dead-links thread). Window to 16:37Z (user '+3 hrs' 10:53Z, cmsg_017WNUkNK8kdDziPK58Pv6G99pCjvrScGuXFpN2BAT3zBX).
