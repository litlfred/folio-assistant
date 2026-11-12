---
# folio-assistant-q5sw
$schema: bean/1.0.0
title: 'Memory: Bibliography entries get slash pages + side panel, no #ref- anchors (owner A + "clean break", 2026-11-08); core#678, sci#185'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:55:35Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bib-entry-pages-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Bibliography entries get slash pages + side panel, no #ref- anchors (owner A + "clean break", 2026-11-08); core#678, sci#185

Owner 2026-11-08 (thread "Expand bibliography entries into detail panels", cmsg_017WNUkNK8kdDziPK58Pv6G9QdafUDKTE4bgmDJSkxD7Ro): option A = one page per entry at `<route>/<sub-graph>/<key>/` (library item: its asset page), click opens right-side panel (`.fa-block-panel fa-bib-panel`) loading `.fa-bib-detail`. "clean break old IRIs": no `#ref-` anchors, no forwarding.

- folio-assistant-core draft PR #678 (issue #677), branch claude/bib-entry-pages: `referenceSegment` replaces `referenceAnchor`; `sourcesOf` + optional node field `sources` (not CSL); library items read structure.json `source.upstream` (repo at ref + pinned commit) = the missing DSpace/c2pa links; catalogue adds all dc.identifier.uri handles + provenance.source; untitled entries show `printed`/`note`.
- folio-assistant-sci draft PR #185 (issue #184): LNCS org-author entries get titles (12 of 31 untitled).
- Q (08:23Z): owner chose A = rewrite IG citations + smart-base gate AFTER core#678 merges (dth-* stay drafts). Marking #678/#185 ready was blocked for this thread; needs merge manager/owner.
- 10:16Z core#678 MERGED (62fe7e7); sci#185 merged 09:26Z. IG follow-up drafts: smart-base#330 (gate: entry pages; #ref- = anchor-citation finding), smart-trust#170 (29 cites -> bibliography/smart-trust-catalogue/<key>/), smart-ips-pilgrimage#50, smart-hiv#26 (descriptions). Order: IG PRs with core re-pin >= 62fe7e7; smart-base#330 reaches IGs after. Handed to merge manager.
- Was: IG citations `bibliography/#ref-<key>` (smart-trust, -phw, smart-immunizations, smart-ips-pilgrimage, smart-hiv, dth-*) + smart-base check:ig-citations need rewrite to `bibliography/<sub-graph>/<key>/`. See folio-assistant-e3w5.
- 10:36Z card 3 A: core re-pinned to 62fe7e7 in the 3 IG PRs; all 3 MERGED ~12:21Z; smart-base#330 MERGED 13:25Z. Thread done. Remaining: dth-* drafts and other IGs (smart-trust-phw, smart-immunizations) still cite #ref- and will fail the gate once they re-pin smart-base.
