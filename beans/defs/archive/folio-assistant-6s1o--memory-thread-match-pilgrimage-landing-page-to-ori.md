---
# folio-assistant-6s1o
$schema: bean/1.0.0
title: 'Memory: Thread "Match pilgrimage landing page to original" (11-10): workflow figure layout, ArchiMate harness off in smart-ips-pilgrimage, figure-rebuild ski...'
status: completed
type: task
priority: low
created_at: 2026-11-10T16:23:49Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `pilgrimage-figure-archimate-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Match pilgrimage landing page to original" (11-10): workflow figure layout, ArchiMate harness off in smart-ips-pilgrimage, figure-rebuild skill gap; card Q-PIL-1

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9MT3iozhosq8B91wftEBtBz, spawned 2026-11-10 16:20Z.
- Figure: smart-ips-pilgrimage input/images-source/workflow.plantuml (b79e386, 11-07, session_01VQDpPerdPBYNvFx1ptSX61) replaced hand-drawn input/images/workflow.png; PlantUML auto-layout does not match original (pilgrim top centre, wallet/HW top corners, HIE/EMR middle, GDHCN bottom centre, Y-shaped dashed dividers).
- ArchiMate harness off because pilgrimage has no archimate/ model, subgraph, visualiser or site:archimate/check:archimate steps (smart-trust-demo has them: tools/archimate/{build,overlay,layout}.py on smart-ra 0.3.0-draft.1). Pilgrimage site.landing = smart-base.
- Process failure: folio-assistant-core skills/library/ingestion/figure-rebuild.md says actors/systems figure -> ArchiMate view, but is scoped to L1 folios; layout coords only required for BPMN; no before/after compare. Docs fix: widen scope, PlantUML = rendering not source, keep layout + side-by-side; cat-harness skills/ui/ui-core/journey-maps.md: journeys + system actors => archimate model.
- Card Q-PIL-1 (cmsg_017WNUkNK8kdDziPK58Pv6G9EcpR1nqdbz36beJe7YqfbN): A ArchiMate overlay view in original layout + landing journey cards (rec), B data SVG, C B then A. Started on A. Ask before merge (content).
- 16:50Z: draft PRs up (all subscribed): smart-ips-pilgrimage#56 (issue #55; branch claude/pilgrimage-figure-archimate: archimate/build.py + 2.1.0 model, slugs per view, visualiser declared, input/includes/workflow-figure.html + journey-cards.html via input/scripts/journey-cards.ts, plantuml removed, pots refreshed); folio-assistant-core#698 (issue #697, figure-rebuild scope + keep layout); cat-harness#1177 (issue #1176, journey-maps ArchiMate rule). Unverified: published SVG path archimate/2.1.0/views/<id>.svg (fallback workflow.png). Side-by-side: /mnt/project-files/pilgrimage-figure-2026-11-10/. Local check needs mounts cat-harness-tools/cat-harness/bootstrap-tools + CAT_HARNESS_ROOT.
- 17:40Z: peer thread asked to ready+merge fac#698/cat-harness#1177; classifier denied update-branch/ready without user OK -> card Q-PIL-2 (cmsg_017WNUkNK8kdDziPK58Pv6G95i1XEq3SxfsKbGg8q27nHx): A both (rec), B #698 only, C hold.
- 17:55Z: owner asked to keep ArchiMate + add pretty view like original + toggle + match actors/roles. Done in #56 commit 9ee7a07: archimate/pretty.py -> input/includes/workflow-pretty.svg (from built model; pictogram per role, IG actor name + role id), CSS radio toggle in workflow-figure.html. build.py names roles from roles.json otherNames (igActor prop). Q-PIL-1 closed as A. fac#698 / cat-harness#1177 ready, handed to Merge Manager (Q-PIL-2 A).
- 18:30Z: owner review (18:11Z) fixes pushed in #56 ef18186: archimate/icons.json (potrace-traced pictograms from workflow.png, GDHCN logo composite, IPS logo base64), key/QR badges (flow prop carries="IPS QR code"), level arrows, larger text. Card Q-PIL-3 (cmsg_017WNUkNK8kdDziPK58Pv6G92yTBxVA1VcWsrUw7QibFpB): merge #56? A merge (rec) / B more changes / C hold.
- 18:31Z: folio-assistant-core#698 merged. cat-harness#1177 pending.
- 18:31Z: cat-harness#1177 merged too. Only #56 left (card Q-PIL-3).
- 18:45Z: 2nd review (18:33Z) done in #56 e8add31: HIE = traced original FHIR HIE illustration + IPS logo; WHO emblem traced from owner's WHO logo upload; pilgrim head on divider (icons.json pilgrim cx anchor); badge+narrative blocks; transaction codes linked not printed; 22 links. Q-PIL-3 closed as B. Skill: folio-assistant-core#709 (issue #708, subscribed). Card Q-PIL-4 (cmsg_017WNUkNK8kdDziPK58Pv6G9L2MiwsK5W7416rrHGsmZpH): merge #56? A (rec)/B/C.
- 19:30Z: 3rd review (mirrored layout, HIE label, no avatar subtitles, narrative bg) in 5f21c41; owner said "then merge" -> #56 MERGED 3105f36. Staging preview via stage-local (needs full mount: bun cat-harness-tools/scripts/mount-from-lock.ts in a fresh clone, then stage-local --fresh): https://litlfred.github.io/smart-ips-pilgrimage/branches/pilgrimage-figure-archimate/. Coordinator asked to post staging + SVG (v5) to main chat. Full CI red on new gates (wireframe, artefact-verification decl in cat-harness-tools, directory-declares-visualiser) -> issue #57. Live main site NOT republished yet (needs owner OK). fac#709 open, awaiting OK.
- Cards: Q-PIL-5 publish live site (cmsg_017WNUkNK8kdDziPK58Pv6G9KL7Wf2g4gBM8Yn5QEpiY6S), Q-PIL-6 merge fac#709 (cmsg_017WNUkNK8kdDziPK58Pv6G9HJkg4MGQxzaXBKd9udnBmf). Staging clone with full mounts at /home/user/stage.
- 19:23Z: Q-PIL-6 A -> fac#709 merged 3040ca5. Q-PIL-5 A -> publishing main site via stage-local (bg).
- 19:5xZ: live main site published (gh-pages e80324a) after ig-ast-refresh on 3105f36 succeeded. Thread done.
- 19:57Z: live deploy first FAILED (Pages deploy 10-min timeout; gh-pages 563 MB incl. 204 MB branches/ preview). Removed branches/pilgrimage-figure-archimate (gh-pages f7b102a) -> deploy success. Lesson: drop a merged PR's preview before/at main publish.
- 20:00Z owner: pilgrim-journey.html should look like smart-trust-demo vaxlink/#/overview; thought vaxlink slug was replaced by generic (= journeys viewer en/<ig>/journeys/<ig>/, smart-trust-demo keeps /vaxlink/ via site.build.keep). Card Q-PIL-7 (cmsg_017WNUkNK8kdDziPK58Pv6G9K2XuSZPz2QGq6JG5Ps4RJC): A generic viewer VaxLink overview (rec) / B pilgrimage-only / C both.
- 20:05Z: Generic VaxLink overview already exists (cat-harness-tools #1547/#1550/#1562/#1576) at journeys/<ig>/workshops/<id>/overview/. Pilgrimage gaps: no workshop presentation (fixed in PR #59, issue #58), not linked from pilgrim-journey (fixed #59), no trustLadder/scene/device screens (content, open), smart-trust-demo /vaxlink/ kept + vaxlink#14 redirect open. Avoid gh-pages previews (size) -> preview via --dry-run + local screenshots.
- 20:20Z: PR #59 (issue #58, branch claude/pilgrim-journey-overview, head b295cb11, CI green) adds workshop presentation, record-trust ladder, scenes, step records, journey hero on pilgrim-journey.html; ig.example/profile patterns point at artifact/ pages. Card Q-PJO-1 (merge+publish A rec) in thread …MT3iozhosq8B91wftEBtBz. Skill cat-harness#1205 (#1204) and tool cat-harness-tools#1789 (#1788) drafts, green, need user OK. Previews: /mnt/project-files/pilgrimage-figure-2026-11-10/pilgrim-*-preview.png. Build previews from /home/user/stage clone (full mounts).
- 20:20Z Q-PJO-1 = A: #59 merged (ee2ef6e1). Main published to gh-pages 149f437e (112 MB artifact) but Pages deploy stalls at syncing_files and times out (run 42895536623, failed 2x; the 19:57 deploy of the same size took 21s). Retry scheduled ~21:07Z.
- 21:07Z: 3rd deploy attempt cancelled in seconds (no reason). Card Q-PJO-2 (cmsg_017WNUkNK8kdDziPK58Pv6G9UvuXmMpHCbXypzAQpQsKGW): A retry ~22:10Z (rec) / B owner re-runs / C leave. Skill+tool PRs cat-harness#1205, cat-harness-tools#1789 still need owner OK to merge.
- 21:19Z: live site deployed (149f437e; owner confirmed). Card Q-PJO-3 (cmsg_017WNUkNK8kdDziPK58Pv6G9EfMiFt5RFoXvwnEUhEFVvM): merge cat-harness#1205 + cat-harness-tools#1789? A (rec)/B hold.
- 21:30Z: Q-PJO-3 = A: cat-harness#1205 + cat-harness-tools#1789 merged. Owner: "move archimate below journey" -> PR #61 (issue #60, branch claude/archimate-below-journeys) moves workflow-figure include below journey cards on index.md. Card Q-PJO-4 (cmsg_017WNUkNK8kdDziPK58Pv6G9EijeizY9mdgHowYxJShHKH): merge+publish on green A (rec)/B hold.
- 21:55Z: #61 merged (8c95b41; also journey cards 4 per row via minmax(max(200px,calc((100% - 42px)/4)))). Live published (gh-pages fe85b9a0, deploy success). Open: issue #57 (CI gates), vaxlink#14 redirect.
