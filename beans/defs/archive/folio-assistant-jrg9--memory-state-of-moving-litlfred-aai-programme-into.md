---
# folio-assistant-jrg9
$schema: bean/1.0.0
title: 'Memory: State of moving litlfred/aai-programme into WorldHealthOrganization/aai-programme and the PM''s objections (2026-10-26)'
status: completed
type: task
priority: low
created_at: 2026-10-26T05:07:10Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `aai-programme-who-move.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: State of moving litlfred/aai-programme into WorldHealthOrganization/aai-programme and the PM's objections (2026-10-26)


- WHO target: WorldHealthOrganization/aai-programme (the WHO aai-platform repo, renamed; public). On 2026-10-26 its main was 2e0c0d2: 5 bot "Pull beans" commits ahead of merge-base 3d61479, fork 45 ahead. Local branch claude/sync-to-who merges them (tree identical to fork main).
- Original issue: litlfred/folio-assistant#2605. PM @Chine-E (20-21 Oct): v0.5 is NOT the baseline, use her v0.4.2 PM review copy; she approves each version; programme repo/project should stay private and hold no real programme data pending a governance decision with Garrett. The review-copy attachment can't be downloaded from the session.
- Owner (2026-10-26): everything in AAI on GitHub is publicly visible; there is no private layer. This overrides the PM's request to keep it private.
- Thread "Resolve aai-programme issues and move to WHO" (2026-10-26) asked the owner A draft PR / B direct push / C hold. Draft reply: /mnt/project-files/aai-programme/2605-reply-draft.md.
- Owner 2026-10-26 09:57Z: "do not merge experiments": cat-harness-tools#739 and cat-harness#564 (simulated BPMN forced-vs-managed runner, bean 502c) stay unmerged; aai-programme#36 open.
- WHO PR #2 merged by owner 2026-10-26 (WHO main c42f914). Follow-ups on litlfred/aai-programme#57: beans branch, hard-coded litlfred refs.
- Related: folio-assistant-wrqs.
- 2026-11-01 (thread "Drain aai-programme beans and issues"): owner rule: work only on issues opened by litlfred (never Jose's or Ritika's). Closed #40 and #26 (beans done). #59/#60 switch beans-sources to the WHO store; litlfred beans branch now cebfd0f, #60 merged 09:55Z (66b6dcc). Q-AAI-1 A: owner OK to fast-forward WHO beans branch to cebfd0f, but this session cannot push to WHO (same-name repo limit); user given the command. #51 closed (Q-AAI-2 A). Remaining 21 aai beans wait on Chine-E/WHO owners.
- 2026-11-01 11:02Z Q-TOP-1 B: owner PARKED aai-programme: no agent work there until the WHO owners answer.
