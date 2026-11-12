---
# folio-assistant-7w1o
$schema: bean/1.0.0
title: 'Memory: Thread "Make the cone deploy safe to switch on" (bean fwtz): option B writer records, where verdicts live, pending preview-skip card'
status: completed
type: task
priority: low
created_at: 2026-10-31T17:15:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `cone-deploy-fwtz.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Make the cone deploy safe to switch on" (bean fwtz): option B writer records, where verdicts live, pending preview-skip card


Thread "Make the cone deploy safe to switch on" (cmsg_017WNUkNK8kdDziPK58Pv6G9FTTVvSSqoVgKV7nZkCWHDu) owns bean fwtz. Issue folio-assistant#2646. Analysis doc: https://claude.ai/artifact/JuXDLeTAi9XtNhabZd9jG7
Owner picked B "rerun and measure" (2026-10-31): strace each derive:publish writer, skip only when its recorded reads and git answers match.
State 2026-10-31 14:35Z: workflow writer-records.yml records after each main deploy (artifact writer-records). docs-site's dry-run step publishes verdicts in gh-pages build.json (writerVerdicts, writerVerifyLog). Read them with: gh api "repos/litlfred/folio-assistant/contents/build.json?ref=gh-pages". Coverage 27/43, fixes for 12 more in tools 8cad4dd. Skip-unsafe 0 so far. Nothing skips yet.
Card posted 14:30Z: A previews skip after 3 clean deploys / B wait 2 weeks / C A plus KG export (recommended). KG export cache belongs to the staging thread folio-assistant-xq9j.
Seed key for re-pins is the instance name: mount:remote --seed cat-harness-tools=litlfred/cat-harness-tools@SHA.
State 17:15Z: preview skip live (cache writer-cone-<sha> saved by writer-records.yml; 33/43 recorded at 26b2d43). Previews that re-pin cat-harness-tools rerun most writers (import fingerprints change). Each preview publishes STAGING/<slug>/writer-skip.txt with skip/run reasons (fa#2860). Job logs: get_job_logs returns only last 5000 lines.
KG step: rail-standalone-pages was 5.8 of 7 min; fixed by memo (tools#1156, fa#2858). kgStepTimes now merged in the stamp step. Not yet confirmed in CI (main red on node-kinds at 66c527d until fa#2855).
18:40Z: previews' derive step is 10-13 min vs ~4 on main, since before skipping existed (cause not yet found; tools#1172 adds per-writer seconds, fa#2861 publishes 'ran' lines in writer-skip.txt). First reasons seen on a preview (fa#2861): 13 writers rerun on cat-harness-tools/schemas/kg/graph-typology-registry.ts (tools re-pin), 5 on .git/branch-mounts/beans.json, 3 on build/qa-refresh.json (holds per-step seconds, so always differs), 3 on tools health-report.json. Tools re-pins are done by the "Fix publishing" thread after fa#2855.
22:00Z: tools#1193 merged (skip restores traced writes too). PR-check speed PRs (owner Q-CI1 A + "cache page build"/"only affected tests"): tools#1194 quick lane (inputs quick-paths/quick-test) + core#453 caller (pinned to branch sha 9eed850; re-pin to merge sha before merging); tools#1196 skill:register:check folded to declarations-only in run-gates.py; tools#1197 writer records in layer PR checks (push records, PR skips; old derive-cache reused 0/41). Merge window until 00:43Z.
