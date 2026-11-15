---
# folio-assistant-y7mt
$schema: bean/1.0.0
title: 'Memory: WHO smart-ig-template still on deprecated fhir.base.template; #67/#68/#69/#70 status, gap report 11-09, card Q-TPL-2'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-template-fhir2-migration.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: WHO smart-ig-template still on deprecated fhir.base.template; #67/#68/#69/#70 status, gap report 11-09, card Q-TPL-2


WHO/smart-ig-template (default branch `master`, tip 82603d0 2026-07-29, who.template.root 0.5.0 on fhir.base.template 1.0.0).
- HL7 notice 2026-03-npm-dependencies: fhir.base.template is deprecated; replacement is fhir2.base.template (HL7/ig-template-base2, branch main, v0.1.0, very active, last commit 10-31). Publisher still only warns.
- #67 draft (costateixeira, branch base2-migration, last commit 10-16) moves base to fhir2.base.template#current, adds translations. Blocked by #68: post-check scripts edit root redirect pages, not output/<lang>/, so DAK API hub empty + .jsonld links lost.
- #69 (litlfred, branch skip-post-check-when-ig-runs-own): WHO_IG_OWN_POST_CHECK skip; unreviewed since 10-22.
- #70 thread 10-23: WHO wants migration at a "quiet time"; Jose says just-the-docs rendering is a separate new template.
- No upstream activity 10-23 -> 11-09. Fork litlfred/smart-ig-template created by user 11-09 13:50Z.
- FHIR/ig-registry templates.json lists neither who.template.root nor fhir2.base.template (only who.fhir.template -> smart-ig). Likely cause of the who.template.root#current 404 (Publisher guesses branches/main; repo uses master). fhir-harness works around it with --template-repo seeding (ig-ast-refresh.yml).
- IGs on who.template.root#current: WHO + litlfred smart-base, smart-immunizations, litlfred smart-ra. smart-trust uses #local-template.
- fhir-harness renders sites from output-ast, and reads only root output files (qa.json, expansions.json, resource json), so language folders barely affect it. After #67 lands, the only harness work is re-ingesting chrome.json for the fhir2.base.template layer (schemas/ig-chrome.ts).
- 11-02 card Q-TPL-1 answered D (wait). 11-09 thread "Bring WHO FHIR IG template up to date" (cmsg_017WNUkNK8kdDziPK58Pv6G9Jm25MGmifeTXJkEQYJbqw7) posted gap report + card Q-TPL-2.
- Draft ask for #70: /mnt/project-files/who-template-2026-11-02/ask-for-smart-ig-template-70.md. Never post on WHO/HL7/FHIR repos without the user's OK.
- 11-09 Q-TPL-2 = A (fork work only, nothing posted upstream). #68 fix written + tested on synthetic layouts: patch /mnt/project-files/who-template-2026-11-02/0001-Fill-the-DAK-API-hub-in-every-language-folder-68.patch (on base2-migration 0fe1aba). Push needs a thread with litlfred/smart-ig-template attached (same-name clash with the WHO repo); asked the coordinator. This sandbox can't run the IG Publisher (packages.fhir.org and tx.fhir.org are blocked), so test builds must run in CI.
- 11-09 14:05Z thread "Test WHO template fix on litlfred fork" (cmsg_017WNUkNK8kdDziPK58Pv6G9QwtZC1S2MMrD1gWA6EHAv2): add_repo litlfred/smart-ig-template refused (Claude GitHub App not on the new fork). Patch applies clean on base2-migration (-> 42fa927 locally). Seeder (litlfred/fhir-ig-publisher ast-export/scripts/seed-fhir-cache-from-npm.py) clones the template repo's DEFAULT branch only, no branch arg. smart-base + smart-immunizations ig-ast-refresh.yml already pass template-repos who.template.root=WorldHealthOrganization/smart-ig-template. Q-TPL-3 = A (13:56Z): temporarily make the patched branch the fork default, test, then switch back. App installed 13:59Z. Pushed fork base2-migration (0fe1aba) + claude/dak-hub-every-language-68 (42fa927), draft PR litlfred/smart-ig-template#1 (fork has issues off; PR is tracker). Test PRs smart-base#333, smart-immunizations#122 (branch claude/test-template-fork-68, template-repos -> fork). Proxy blocks repo-settings writes, so the USER must switch the fork default branch; switch back to master after. Fork default is main (user 14:02Z) at 7444d1b, a 2021 commit whose package is who.fhir.template 0.0.2 (old fork); it is an ancestor of 42fa927. Q-TPL-4 = B (14:09Z): fork main fast-forwarded to 42fa927. Test runs dispatched 14:10Z: smart-base 42631975118, smart-immunizations 42631981846 (ig-ast-refresh, force, branch claude/test-template-fork-68).
- 11-09 14:35Z: user widened the test to all harnessed litlfred WHO forks. Test branch claude/test-template-fork-68 + draft PR in smart-base#333, smart-immunizations#122, smart-trust#172, smart-trust-phw#54, smart-ips-pilgrimage#54, smart-base-clinical#19, smart-hiv#27 (hiv adds its own push-triggered workflow). GOTCHA: ig-ast-refresh restores ~/.fhir/packages from the tooling cache, which already holds who.template.root#current, so template-repos seeding is SKIPPED; first runs were invalid. Fix: pre-export .github/test-template-fork.sh drops it, re-seeds from the fork, and adds a 99_ post-check report that writes to the step log (/proc/$PPID/fd/1), because CI artifacts can't be downloaded from the sandbox (blob storage 403). Fork main = 362e22a (fix + .pyc removal). No litlfred smart-anc fork exists.
- 11-09 15:10Z RESULT: all 7 test builds green on fork 362e22a + fhir2.base.template (HL7/ig-template-base2 ec94311). DAK API hub filled in every language folder: smart-base (ar,en,es,fr,ru,zh; 585 schema / 135 jsonld / 272 openapi links each, ../-prefixed), smart-trust (en). The other 5 have no dak-api page in the harness route (no DAK pre-export), not a template issue. Follow-up seen: OpenAPI per-page injection falls back to a generic point in ar/es/ru/zh because it looks for the English 'Expansion' heading. Test-harness gotcha #2: under a compound pre-export (a && b) the bash -c parent dies, so write to the grandparent's fd. Test PRs closed after the result.
- 11-09 15:45Z Q-TPL-5 = B: fork 575461b places per-page API sections by heading id (expansion/profile) instead of English text; smart-base re-test 0 fallbacks across 6 languages. Fork PR #1 is the tested reference; nothing posted upstream.
- 11-10 17:20Z CORRECTION: smart-immunizations main's ig-ast-refresh.yml had NO template-repos (only smart-base did); a cached package hid it until the #121 re-pin changed the cache. Fix si#124 (issue #123).
