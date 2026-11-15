---
# folio-assistant-h8jd
$schema: bean/1.0.0
title: 'Memory: Thread "Fix CI and gate issues" (11-09): state of cat-harness#1150, tools#1680, fa#937, fa#2881 and the PRs opened'
status: completed
type: task
priority: low
created_at: 2026-11-09T14:00:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ci-gate-issues-2026-11-09.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Fix CI and gate issues" (11-09): state of cat-harness#1150, tools#1680, fa#937, fa#2881 and the PRs opened


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9AMm9zRizL6ECQVYByXRNtU (started 2026-11-09 13:00Z from open-work inventory card A).

- tools#1680 (fold tiny CI jobs): queue time on 11-09 00-13Z was ~0.1 min/job in tools, cat-harness, fa (was 600-800 min/day on 11-08). Release-gated CI removed the runner waits; recommended closing.
- cat-harness#1150: items 1, 2, 5 done by #1163, #1146, tools#1697 (#1147 awaits owner review, content removal). Item 4 partial: tools#1740 (gen-docs-pages base layer links its declared repo, not the checkout's origin) then cat-harness#1171 (8 docs header links + sourceTree in ns/subgraph/v1.jsonld). Merge order: #1740, re-pin fa, then #1171. Undeclared write paths (docs/en/cat-harness-tools/..., fhir-harness/ig-ast, smart-base/l1-extraction, docs/cat-harness/state.jsonld) need a full derive:publish run to name writers. Item 3 (editor-checkers visualiser names a sci-only kind) asked on a card.
- fa#2881: tools#1741 makes merge-guard check 5 judge the preview/agent-build status (red refuses, pending not waited). Left: fa's own agent-built preview; feature-staging.bpmn defer/verify branch.
- fa#937: done-when box 2 is satisfied (platform-gates + merge-queue skills say it); box 1 (gates on the merge tree) not built.
- Marking a PR ready (ccr/ready_for_review + marker + label) was refused by the auto-mode classifier again: needs the owner's OK on a card.
- Local repro: mounting tools at main into fa's index breaks `bun run cat` (no script found); mount a tree WITHOUT .git (git archive | tar) or instanceRootsIn skips it.
- Cards posted 11-09 in this thread: Q-CGI-1 (editor-checkers: A move to sci rec) cmsg_017WNUkNK8kdDziPK58Pv6G9WE7PF4HtjSjcvzKLQEK58f; Q-CGI-2 (mark tools#1740/#1741 ready + hand to Merge Manager, A rec) cmsg_017WNUkNK8kdDziPK58Pv6G99YnC14VfXTEYWodLjYjX5S; Q-CGI-3 (close #1680 and #937, A rec) cmsg_017WNUkNK8kdDziPK58Pv6G9UNkgf58Q5QG44d8Tdg3Tp8.
- Card answers 13:32Z: Q-CGI-1 A, Q-CGI-2 A, Q-CGI-3 A. #1680 and #937 closed. tools#1740 and #1741 MERGED.
- #1150 item 3 (Editor checkers page -> sci): drafts tools#1743 (state-visualizer draws other layers' builtOnHostSite pages), sci#188 (declares page + docs/wireframes/), cat-harness#1172 (drops it). Order: tools#1743, re-pin tools in fa, then sci#188 / cat-harness#1172. cat-harness#1171 now only waits on a fa re-pin of tools past #1740. Marking these drafts ready needs a new owner OK. All 3 green 13:46Z; card Q-CGI-4 (mark ready + hand to MM, A=all three rec, B=tools only, C=keep drafts) cmsg_017WNUkNK8kdDziPK58Pv6G9A96dhsLkUmUvbDPoAK7cYN. Q-CGI-4 = A 13:51Z: all 3 marked ready + labelled, handed to Merge Manager.
- 15:25Z sci#188 + cat-harness#1172 MERGED (tools#1743 merged 13:52Z). Re-pin train fa#3056 carries tools past #1740/#1743. Card Q-CGI-5 (mark cat-harness#1171 ready, A rec, B wait for fa#3056, C keep draft) cmsg_017WNUkNK8kdDziPK58Pv6G98KCsJ4uuWHHBsNhc5wCniV.
- Q-CGI-5 = A 15:27Z: cat-harness#1171 marked ready + labelled, handed to MM (merge after fa#3056).
- 16:25Z fa train #3057 red on stage: derive:publish hostSiteArtefacts looked for renderedBy Tool only in the declaring layer (sci). Fix tools#1747 (rendererShell: own layer then any) at 06aaa00, draft; ready refused by classifier -> card Q-CGI-6 (A mark ready rec, B revert move, C keep draft) cmsg_017WNUkNK8kdDziPK58Pv6G92jkeZFadgJpJDowsPmgQjM. MM told. Lesson: run `bun run cat derive:publish --list` in the mount when adding a builtOnHostSite visualiser.
- 11-10 16:32Z: tools#1747 marked ready + ready comment by another session (litlfred account); card Q-CGI-6 withdrawn (untapped).
- 11-10 17:28Z tools#1747 MERGED; cat-harness#1171 MERGED. Left: #1150 item 4 undeclared writers (full publish run), #2881 fa preview + feature-staging.bpmn (diagram = content, needs card).
