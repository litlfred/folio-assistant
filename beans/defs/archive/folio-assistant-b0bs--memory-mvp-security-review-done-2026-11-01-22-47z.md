---
# folio-assistant-b0bs
$schema: bean/1.0.0
title: 'Memory: MVP security review DONE 2026-11-01 22:47Z: sr31, sb31, 33iz completed; only deferred owner bean nbp9 open'
status: completed
type: task
priority: low
created_at: 2026-11-01T20:56:24Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `security-review-mvp-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: MVP security review DONE 2026-11-01 22:47Z: sr31, sb31, 33iz completed; only deferred owner bean nbp9 open


Thread "Complete the MVP security review" (cmsg_017WNUkNK8kdDziPK58Pv6G96i19Qq73N98ai11WBfXv3m), opened 2026-11-01 20:49Z after owner set MVP = B + C.
- All 57 findings of the 2026-10-31 review are fixed and merged (tools #1083/#1087/#1088, cat-harness#840, core#336/338/339/354, sci#154/156/158, fhir-harness#244/#247, smart-base#251/#253/#255, smart-ra#175/#177/#181, smart-immunizations#104/#105, smart-trust#98/#99, who-iris#140/#143, dth-hrh#62, bootstrap#34). Only fa#2829 (wox6, vbhb, aso6 remainder) open; main merged in at 3f6f2e2 on 20:52Z, merging on green.
- fa#2829 MERGED 22:09Z (cbd4361); its reds matched main's. Beans 676d0df: wox6, vbhb, aso6, sb31 completed. tools#1332 merged 22:47Z (owner tap Q-SEC-2 A), sr31 completed. Review finished.
- bun audit 2026-11-01: 0 high/critical in fa (with #2829), core, tools.
- DONE 21:00Z (owner Q-SEC-1 A): held findings filed as completed beans (i15r, jb60 under sb31; 98uf, ytsf, jo5h, 10rg under 33iz), hf33 + 33iz completed, beans cd62b89. tools#1332 completes sr31. Stray branch cat-harness-tools claude/sr31-probe could not be deleted (proxy); safe to delete.
- (was) Held findings not yet filed publicly: Group B H1 (merge-main), B H4 sci viewer, Group C H1-H4. Card Q-SEC-1 (A file as completed beans, rec; B no detail; C keep private). Bean hf33 under 33iz (added by MVP thread, beans e16b84e) waits on it; the fa rollup gate fails if 33iz is in-progress with no open child, so close hf33 and 33iz in the same write.
- Owner DEFERRED 21:20Z ("Not doing now"): moving HETZNER/OAuth secrets into fa `production` env + required reviewer. Recorded as todo bean nbp9 under rwmf (post-MVP); does not block MVP or sb31. Do not re-ask.
Files: /mnt/project-files/security-review-2026-10-31/. See folio-assistant-2mfw.
- 2026-11-01 ~23:20Z NEW AUDIT (user asked comprehensive report): Claude Doc https://claude.ai/artifact/CYKYMKkQyCsQ2XFctfeTs6 . 19 repos, zizmor+audits. Highs: S1 shared @main reusable workflows (~55 uses), S2 WHO smart-html@main in smart-trust-phw release, S3 dth-phc/dth-sc 7 high advisories each, S4 curl elan|sh (fa lake-cache-refresh, copilot-setup, sci), P1 agents act on untrusted text. Card Q-SEC-3 (A quick fixes rec / B +S1 pin / C report only). Scan clones in /home/claude/audit (ephemeral).
- 23:01Z owner: Q-SEC-3 A + "also B"; Q-SEC-4 = B (pin all 59 litlfred/*@main reusable-workflow calls, 18 repos). Design: pin = caller's index.lock.json mount ref for that harness; reusable workflows' tools-ref default must follow the caller lock (else scripts still run at main); tools self-calls -> ./ local refs; re-pin train (remote-mount.ts) re-syncs pins; a gate checks them. Residual: index-ref (folio-assistant main) not pinned.
- 23:02Z owner asked to act on CodeQL, CODEOWNERS, SECURITY.md. Settings API blocked by proxy (secret scanning, private reporting, default CodeQL setup = owner toggles). Files go in as PRs; skip WHO-upstream forks (smart-*, dth-phc/dth-sc are forks) unless asked.
- Quick-fix PRs: smart-trust-phw#25, bootstrap-tools#69, fa#2897 (+emsdk 65cac1d), dth-phc#28, dth-sc#17. sci already clean.
- 23:20Z PRs open (owner "do all fixes you can, ask w/ cards"): CodeQL/CODEOWNERS/SECURITY.md fa#2898 cat-harness#941 tools#1352 core#573 sci#167 fhir-harness#270 who-iris#164 bootstrap-tools#70 (core+sci already had CodeQL default setup -> workflow dropped; same fix if others fail "default setup is enabled"); S1 tool tools#1353 (workflow-pins.ts + check:workflow-pins, tools-ref default 'lock'); V4/V5 tools#1354; S6 pip locks smart-trust#130 smart-base#277; V2 + emsdk on fa#2897; dependabot cooldown + ignore litlfred/* on fa#2898/tools#1352. S1 rollout per repo waits for #1353 merge + re-pin of tools in each lock. fa discoverability-docs pip refs tools/pyhecke which no longer exists on fa main (stale workflow).
- 23:17-23:28Z owner turned on CodeQL, secret scanning and private vulnerability reporting (all harness repos had CodeQL default setup already; codeql.yml dropped from all PRs). Do not re-ask.
- 2026-11-02: merged by owner: dth-phc#28, dth-sc#17, smart-base#277, smart-trust#130, bootstrap-tools#69, tools#1353 (30a5abd, workflow-pins). Green awaiting card Q-SEC-5 (A merge each when green): smart-trust-phw#25, bootstrap-tools#70, cat-harness#941, tools#1352, core#573, sci#167, fhir-harness#270, who-iris#164. Agent merge refused by safety check even with relayed window. Reds not ours: tools#1354 (adversarial-checklist test reads live main QA store), fa#2898 (stale core POTs, BPMN svgs). S1 rollout: re-pin train thread will notify as each lock reaches tools >=30a5abd (after fa#2900 + next train after fa#2903); then one agent PR per repo running `bun run cat workflow-pins`.
- 2026-11-02 06:15Z owner tap Q-SEC-5 A; merged smart-trust-phw#25, bootstrap-tools#70, cat-harness#941, tools#1352, core#573, sci#167, fhir-harness#270, who-iris#164. Open: tools#1354, fa#2898 (reds not theirs). cat-harness lock-without-tools fix = tools#1367 (CI thread, card Q-PSC-2); my dup #1371 closed.
- 2026-11-03 05:51Z fa#2898 merged (owner); tools#1354 merged 11-02 10:40Z; perms PRs smart-trust-phw#27 + smart-base#286 merged (Q-SEC-6 A). All audit PRs done; thread resolved 11-07. S1 per-repo pin rollout is done by the re-pin thread's PRs.
