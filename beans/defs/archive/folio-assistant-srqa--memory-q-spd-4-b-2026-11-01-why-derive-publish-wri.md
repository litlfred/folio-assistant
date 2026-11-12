---
# folio-assistant-srqa
$schema: bean/1.0.0
title: 'Memory: Q-SPD-4 B (2026-11-01): why derive:publish writers rerun on a tools re-pin; tools#1265 issue, draft tools#1267 (getdents traced), card Q-CONE-1'
status: completed
type: task
priority: low
created_at: 2026-11-01T11:22:31Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `writer-rerun-on-repin-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Q-SPD-4 B (2026-11-01): why derive:publish writers rerun on a tools re-pin; tools#1265 issue, draft tools#1267 (getdents traced), card Q-CONE-1


Thread "Rerun only affected writers on tools re-pin" (cmsg_017WNUkNK8kdDziPK58Pv6G977M4wm3Vj234pd5LBBYVYx), from owner pick Q-SPD-4 B in folio-assistant-7exb. Questions go back to the deep review thread.
Finding: B5's premise was wrong. Writer records (writer-cone.ts) already key on per-file strace reads. Re-pin reruns come from (1) directory states = full listing (bun's resolver LISTS the checkout root and every directory it loads a module from, verified with strace + getdents64, bun 1.4.4), (2) cat-harness-tools/package.json read by bun, (3) shared real imports (schemas/kg/built-at-publish.ts, bootstrap-tools/schemas/*.ts). Recorded writers total only ~120 s in the fa#2864 preview (STAGING/claude-repin-tools-declaration-claims/writer-skip.txt); uml:overview (QA working copy) 219 s is the big part.
Draft tools#1267 (branch claude/writer-cone-listed-dirs): trace getdents64; a directory that was opened but never listed is recorded as "dir"; TRACER_VERSION 3. It does NOT fix `.` or code directories (bun lists them).
Card Q-CONE-1 (11:20Z): A safe part only / B plus a resolver-listing heuristic / C A then QA working copy in previews (recommended) / D stop.
fa#2867: the classifier refused marking it ready or updating its branch from this thread; it was passed back to the deep review thread.
Local test layout: /home/claude/idx with sibling bootstrap-tools and cat-harness clones plus a root package.json with workspaces. Without it, cat-harness-tools tests fail on @litlfred/bootstrap-tools. Related: folio-assistant-7w1o.
Q-CONE-1 was answered C (11:24Z). Then the user said (11:24-11:25Z, flip-flopped): QA STAYS in previews but reruns only within the dependency cone, and the process diagrams must be updated. Measured on main job 124793773959: QA copy 468 s; skill:register 396 s (233 s verify, which fa#2867 skips in previews; kg:audit 86 s; ~65 s duplicate derive writers: subgraph:jsonld, glossary:page, auto:docs, skills:docs, lsi:viz). Card Q-CONE-2 (11:30Z): A per-QA-step cone records / B A plus no double builds (recommended) / C duplicates only.
Q-CONE-2 was answered B (11:31Z). Drafts at ~12:05Z: tools#1272 (branch claude/qa-step-cone, issue #1271: scripts/qa-cone.ts plus the skill:register builtAtPublish deferral when CAT_BUILD_TYPE=preview), fa#2875 (claude/qa-step-cone-records, writer-records.yml traced QA copy), cat-harness#919 (claude/qa-step-cone, BPMN documentation plus .pot files). Card Q-CONE-3: A ready and merge when green / B wait / C drafts. The classifier refuses marking PRs ready from this thread. Order: tools PRs, then the tools re-pin in fa, then fa#2875.
Trace check (12:55Z): later QA steps read auto:docs, subgraph:jsonld and glossary:page outputs (auto-docs.json is a declaration the graph walk reads), so tools#1272 (a6c5224) and cat-harness#919 (0ba4c1e) now defer only skills:docs and lsi:viz in a preview's QA copy. Tracing skill:register itself under strace gives a 1.6 GB log; grep the stream instead of parsing it.
15:40Z: user window "+3 hrs functional merges" (cmsg_017WNUkNK8kdDziPK58Pv6G92nTpZHyM4RZ6LQNsxyLjqt, to 18:23Z) covers Q-CONE-3. tools#1267/#1272 marked ready and merged with main; merge on green, then fa re-pin, then fa#2875. cat-harness#919 (process text) needs its own OK.
16:08Z: new window "merge +repin window open +3hrs for approved work areas" (cmsg_017WNUkNK8kdDziPK58Pv6G9LR1zeenF1AJ9hyV9GdA5TR) to 19:08Z. tools#1267 merged 0b1589c 16:01Z.
16:30Z Q-SPD-9b A (hub narrowing): issue tools#1291, PR tools#1292 (branch claude/writer-hub-projections): projected reads (schemas/sdlc/read-projections.ts); covers bean marker (tipPresence, stateMountedDirs), docs/todos.json and build/qa-refresh.json (findDeclarationFile). Verified on fa overlay (9 writers). Merge on green in 16:08Z window, then re-pin train.
