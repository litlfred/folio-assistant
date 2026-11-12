---
# folio-assistant-rfi0
$schema: bean/1.0.0
title: 'Memory: who-iris replica stale live site (covers), item links to WHO IRIS (who-iris#205), Dublin Core link on library entry pages (tools#1752), 2026-11-10'
status: completed
type: task
priority: low
created_at: 2026-11-10T18:40:09Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-iris-item-links-dc-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: who-iris replica stale live site (covers), item links to WHO IRIS (who-iris#205), Dublin Core link on library entry pages (tools#1752), 2026-11-10

Thread "Fix who-iris library entry and search pages" (cmsg_017WNUkNK8kdDziPK58Pv6G98A1zg3Us9MZue1c2QKHqPR), user ask 2026-11-10 17:11Z.

- ROOT CAUSE "no cover": litlfred.github.io/who-iris is a MANUAL gh-pages publish of who-iris main 0e3e888 (2026-10-30 17:54Z, owner card). Covers rendered 10-30 + search page (#197) landed later; committed site/ is correct. Only a republish fixes it (needs owner OK, publish-standard rule folio-assistant-nbtb).
- who-iris#205 (draft, branch claude/iris-item-links): itemHref = library entry page, else Handle (resolvableIri), else catalogue page. No new UI strings (avoids .po + attestation gotcha, see folio-assistant-ia3p).
- tools#1752 (draft, branch claude/library-entry-dc-record): library-graph catalogueInfo reads metadataRef + handle; gen-library-viz draws "Catalogue record" line (DC on GitHub + hdl link) under the entry heading. Follow-up: link the DC schema page after tools#1751.
- Local testing: who-iris's package.json workspaces include ../cat-harness-tools, so a sibling clone at /home/user/cat-harness-tools breaks `bun install` (duplicate workspace). Clone tools elsewhere (/home/user/src/), patch the mount.
- gh issue create was denied by the auto-mode classifier; PR bodies carry the findings instead.
- 17:22Z both PRs green on the fast tier. 17:27Z owner card A: republish the who-iris site only AFTER both merge (one publish). tools#1752 reaches the site only after who-iris re-pins tools. Marking ready was denied by the classifier, so the owner (or Merge Manager) must mark ready/merge.
- 17:33Z both #205 and tools#1752 MERGED (owner). Re-pin who-iris#206 (draft, branch claude/repin-tools-97e844c, tools 961b4d9 -> 97e844c) opened; republish after it merges via `bun run cat-harness-tools/scripts/stage-local.ts --repo . --branch main` from a who-iris main checkout (plan checked: declared site.build, target main root).
- 17:52Z user "A" = go-ahead; I merged #206 myself (e4505d07). stage-local --dry-run REFUSED: lowerRoleIds (tools schemas/process/role-graph.ts) searched needs only beside the root, but a self-mounting checkout mounts them inside (who-iris/cat-harness/), so roles.json iris-cdn-owner -> programme-manager failed, auto-docs + processes visualisers failed. Fix tools#1756 (draft, branch claude/role-graph-self-mount). Next: merge -> re-pin who-iris -> publish (stage-local needs a clean mount; use --fresh).
- 18:12Z tools#1756 merged (owner). who-iris#209 re-pin tools -> 5d1cb07 merged by me 18:18Z. 18:23Z PUBLISHED who-iris site from main 7bf0eddd via stage-local (gh-pages f768621). Dry run first; build had covers, hdl links, Catalogue record line.
- 18:39Z verified LIVE (Pages CDN caches ~10 min; add ?v= to bust). Leftover offered, not done: banner/masthead strings still say covers are withheld though COVERS_SHOWN=true (new wording needs .po + attestation updates).
