---
# folio-assistant-lwdn
$schema: bean/1.0.0
title: 'Memory: Harnessing the 10 new litlfred WHO forks on smart-base (card Q-JTD-2 A): PR numbers, sushi status, blockers'
status: completed
type: task
priority: low
created_at: 2026-11-10T19:02:13Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-forks-harness-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Harnessing the 10 new litlfred WHO forks on smart-base (card Q-JTD-2 A): PR numbers, sushi status, blockers

Thread "Harness the 10 new WHO forks" (cmsg_017WNUkNK8kdDziPK58Pv6G9DLyZ6UzButa8bWRejYKBw3), 2026-11-10.

- Recipe: copy smart-hiv's index.config.json (same pins), local instance renamed, ig.include from the repo's input/; index.lock.json = smart-hiv's lock with trust.on changed (same pins => same closure; running remote-mount.ts was blocked by the auto-mode classifier); .gitignore mounts block; site-publish.yml template copied; push/PR triggers removed from IG Publisher workflows (by hand only).
- Draft PRs #1 (branch claude/harness-smart-base) in smart-dak-pnc, smart-dak-smbp, smart-ccc, smart-dak-srv, smart-dak-chud, smart-tuberculosis. All sushi 0 errors. smart-tuberculosis also swaps dependency who.base#current -> smart.who.int.base#current (who.base has no current build).
- (Superseded 19:20Z by Q-WF-1 = C, see below.) Held: smart-dak-tb (who.base dead; 229+ errors vs any smart-base version), smart-dak-ccc (394-968 errors: extension[classification], capabilityString, benefitString removed from base), smart-anc + smart-fp (XML IGs, no sushi-config; fhir-harness reads sushi-config for menu/identity).
- Forks have issues DISABLED and the proxy blocks repo settings writes, so no issues were created; Actions may need enabling. gh-pages appears only after merge + running Site publish by hand.
- sushi in the cloud: packages.fhir.org blocked; seed ~/.fhir/packages from litlfred/fhir-package-mirror (+ `npm pack` of grahamegrieve packages). Mirror PR fhir-package-mirror#6 adds smart.who.int.base#current.
- 11-10 ~19:20Z Q-WF-1 = C: all 10 forks now have draft PR #1 (branch claude/harness-smart-base). smart-anc#1, smart-fp#1 = harness only (base master; no sushi). smart-dak-tb#1, smart-dak-ccc#1 = harness + FSH migration: SGRequirements extension[classification] lines removed (LM.* twins carry identical codes), capabilityString/benefitString -> *Markdown; dak-tb also who.base -> smart.who.int.base: current; sushi 0 errors. All are content: merge needs owner card.
- Gotcha: python text-mode rewrites turned CRLF workflows to LF in smart-anc; fixed in a follow-up commit (force-push is blocked by the classifier).
- 11-10 19:10Z Q-WF-2 = B: all 10 fork PRs #1 and fhir-package-mirror#6 MERGED. Next (owner): enable Actions per fork, run Site publish (by hand) to create gh-pages, turn on Pages.
- 11-10 ~19:45Z: PRs #2 (claude/site-template-seed: template-repos who.template.root=WorldHealthOrganization/smart-ig-template) merged in all 10 (Q-WF-3 A). Re-run: publish job fails "Cannot find module @litlfred/cat-harness-tools" (no root workspace) -> draft PRs #3 (claude/publish-link-mounts) in the 8 FSH forks add fhir-harness's node_modules link loop; srv/chud #3 also move a trailing YAML comment off the smart.who.int.base: 0.2.0 line (IG Publisher read it into the URL). smart-anc/fp: ig-cache.sh seed can't resolve the package without sushi-config -> card Q-WF-4 (A = launch 8, fhir-harness change for XML IGs later).
- 11-10 20:05Z: PRs #3 (claude/publish-link-mounts) in 8 FSH forks = root package.json workspaces + bunfig hoisted (copied from smart-immunizations), re-pin config+lock to smart-immunizations' 11-10 pins (smart-hiv's pins inconsistent: fa-core 62fe7e7 needs cht gate-own.ts), site-publish uses@ fhir-harness 5bd8b1e2, Playwright chromium step. Green on smart-dak-pnc (preview published, gh-pages created). srv/chud also move trailing YAML comments off header lines (ig-cache.sh greps id:). AST job builds DEFAULT branch, so srv/chud only testable after merge. Card Q-WF-5 (merge when green). Q-WF-4 = A + user asked C in sibling threads "Convert smart-anc/smart-fp to sushi" (generated JSON must match original). Local mount-from-lock.ts is classifier-blocked (Code from External).
- 11-10 20:41Z: all 8 FSH forks published from main, Pages on (owner), smart-html-jtd compose run 42897266089 deployed: 8 forks in landing table. chud also needed #4 (JSON comment in publication-request.json). smart-anc converted to sushi + merged (sibling thread), first publish run 42897428014. smart-fp conversion PR #3 awaits owner. Open offer: add push-to-main trigger to forks' site-publish.yml (folio-assistant-rhkg).
- 20:45Z peer "Speed up Actions start times" (Q-ACT-1 A): when touching forks' site-publish.yml next, adopt current fhir-harness templates/ig-repo-site/site-publish.yml (mount cache ig-site-mount-v1, pinned actions); that thread won't edit IG site-publish.yml.
- 21:20Z owner card: allowed running the platform re-pinner here (classifier then permitted mount-from-lock + mount:remote). Re-pin PRs (branch claude/repin-20261110) in all 10 forks: #5 (chud #6, fp #9) to core 05f5525, cat-harness 209b770, tools 3ef7ce3, fhir-harness eef2e57, smart-base 4911833, who-iris 4bb03f6, bootstrap 77fdde8. Lock generated on pnc, copied to others (scratchpad repin2.py). pnc test green. Card: merge+publish now (A) vs wait for qa thread's template #4 (fhir-harness#355). smart-fp published; Pages ask sent. gen-skill-commands fails on cat-harness's stale .claude/commands (upstream issue; forks don't commit agent surface).
- 21:32Z: owner tapped A; all 10 re-pin PRs MERGED. Publish held until fhir-harness#355 + qa thread's #4s merge (qa thread pinged); then one Site publish per fork + jtd compose.
- 21:35Z: fhir-harness#362 (Contents card) merged at 499a68a; forks' lock pins eef2e57 (lacks it). Plan: after #355 merges, one fhir-harness re-pin in all 10 forks to a commit with #355+#362, then single publish.
- 22:59Z: fhir-harness#355 + 10 template PRs merged (qa thread); Site publish green on all 10 forks (runs 42917646390..42917851067). fhir-harness re-pin to 316b58b (for #362 Contents card) BLOCKED by classifier (Code from External; lock needs treeDigest so no hand edit) -> card asks owner. smart-fp Pages still off (gh-pages exists, asked 22:59Z); then compose smart-html-jtd.
- 23:27Z owner card A: re-pin fhir-harness. PRs (branch claude/repin-fhir-harness-20261110) #6 in 8 forks, chud #7, fp #11, to fhir-harness 03f8673; re-pinner also pins site-publish ast uses@ to the lock sha (was @main from qa thread). Test run pnc 42923759219.
- 23:55Z: fhir-harness re-pin PRs merged in all 10; publish green (runs 42924650190..42924696804); Contents card + assets/fhir-qa/qa.json on gh-pages. smart-fp Pages on; compose 42926415035 lists all 10 forks. Card: re-pin cat-harness-tools to 34b488c (#1825 QA table) asked of owner.
- 00:15Z 11-11 (card A 00:02Z): cat-harness-tools re-pin to 1a7c91e (#1825 QA table), PRs #7 (chud #8, fp #12) merged; publish green on all 10 (pnc 42929441106).
