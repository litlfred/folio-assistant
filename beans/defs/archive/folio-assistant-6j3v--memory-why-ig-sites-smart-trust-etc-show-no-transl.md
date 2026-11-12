---
# folio-assistant-6j3v
$schema: bean/1.0.0
title: 'Memory: Why IG sites (smart-trust etc.) show no translations: fhir-harness IG route never injects .po (fhir-harness#382); Q-TRP-1'
status: completed
type: task
priority: low
created_at: 2026-11-11T13:10:51Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ig-site-translations.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Why IG sites (smart-trust etc.) show no translations: fhir-harness IG route never injects .po (fhir-harness#382); Q-TRP-1

2026-11-11, thread cmsg_017WNUkNK8kdDziPK58Pv6G95t7cWfzxEoMPbkQnqw15f9. User: "smart-trust why not translations? and other repos too".

Cause: fhir-harness `scripts/ig-repo-site.ts` (compose + publisher-pages) only stamps the picker block via cat-harness-tools `scripts/lib/translation-meta.ts` with `availableLocales: []`, so every language is greyed. `translations/<lang>/pagecontent/<stem>.po` (smart-trust: 41/43 pages x 5 langs) are never read. The injector exists: cat-harness-tools `pipeline/po-inject.ts` (port of smart-base inject_translations.py). Only translated pages on smart-trust gh-pages: `/<lang>/folio-assistant-core/glossary/`.
Also: smart-trust gh-pages last published 2026-11-01 (by hand); smart-trust#189 = publish on merge (open).
Issue fhir-harness#382. Card Q-TRP-1: A publish now labelled unofficial (rec) / B wait native review.
Sandbox: github.io blocked by proxy; read gh-pages via `gh api repos/.../git/trees/gh-pages:<dir>`. gh issue/pr create use GraphQL (blocked): use REST `gh api repos/.../issues`.
Related: folio-assistant-4yjk, folio-assistant-eil7.
11-11 13:20Z: fix PR fhir-harness#383 (branch claude/ig-translated-pages; new scripts/ig-page-translations.ts, stageIgSite writes <locale>/<page>.md, thin layout emits fa-translation-meta from front matter, ig-content-qa pageItems covers translations/*/pagecontent/*.po). smart-trust issue #193, draft PR #195 (translations/ in contentTypes.ig.include). Handed to merge manager. Next: after #383 merges, re-pin fhir-harness in smart-trust #195, fresh ig-content-qa review, publish. Local run needs sibling clones cat-harness-tools, folio-assistant-core, bootstrap-tools (bun install each) + node_modules/@litlfred symlinks in fhir-harness.
11-11 16:45Z: user asked again (screenshot: AR ZH FR RU ES look normal). They are already inert spans (docs-ui `is-unavailable`, slotted bar colour --fa-barpanel-muted #6b7280) but too subtle. #383 full CI blocked by runner DNS failure to ubuntu mirrors (Playwright --with-deps), same on fhir-harness main; reported to merge manager. Re-posted Q-TRP-1 (card cmsg_…JFxK1fqR1znBYPhVKrLz34, old card withdrawn) and Q-TRP-2 (A keep six clearly faded rec / B hide; card cmsg_…RmfmrZzWbag9zhBp1gac82; fix would be cat-harness site-chrome docs-ui.css).
11-11 17:05Z: Q-TRP-1 = A (publish unverified), Q-TRP-2 = A (keep six, clearly faded) -> cat-harness#1252 (issue #1251: strike-through + not-allowed + aria-disabled on .is-unavailable). User: "i want translations done when possible". #383 now inlines translated includes (home page = includes only; 215 smart-trust pages). smart-trust#195 also carries 531a0e3: 36 changed strings/lang re-translated from old msgstr (pairs via difflib; bib link #ref-X -> smart-trust-catalogue/X/, `$name` -> {codeN}); po-status 3475/3475 all 5. Gotcha: decision_support "level." fragment spans a list-item line break; keep old split. Injection stats ~90% only because identical strings (XML, JSON) count as untranslated.
11-11 17:10Z: Q-CI-ROUTE = A -> cat-harness-tools#1920 (issue #1919): all runs-on ubuntu-latest -> ubuntu-24.04 + Chromium install before stage-local in folio-site-publish. Sandbox push of .github/workflows WORKED. Sent to merge manager for merge-despite-red card + re-pins. Revert pin when GitHub fixes 26.04 image.
11-11 17:36Z: fhir-harness#383 MERGED (full tier went green, mirrors back?). Asked merge manager to re-pin smart-trust#195 (no standing consent there; repin-standing moves nothing). Then: ig-content-qa review, merge #195, publish, send link.
11-11 18:45Z: #1920 + #383 merged; #195 re-pinned (6a47cc0). ig-content-qa scan: 3 pattern hits in smart-trust English pages (object tags in concepts_onboarding_process_full.md + sequence-diagrams.md; script tag in qr_code_generation.md hcert-demo) block ANY publish. Card Q-TRP-3 (cmsg_…GsvWPKrXYrVFYnWbPzPSm9): A img + demo own page (rec) / B trusted-script harness feature / C hold. smart-trust has no qa/ig-content-qa.json yet; must add qa/ig-content-qa.json to contentTypes.ig.include. AST restore: fhir-harness scripts/ig-repo-site.ts ast --ig <st>. hearthbot post_message rejects literal <script>/<object> text.
11-11 21:45Z: #195 re-pin (f3c6341) has 15 new gate failures (regen fallout, same as smart-ra#241/Q-RA-241). Merge manager: I regen ONCE after Q-TRP-3, after merging smart-trust#198 (non-content re-pin) from main into #195. fhir-harness trusted-scripts allow-list: demo-rail thread (…SxasfQF7Sm49rzpH7s62Bp, Q-RAIL-2) builds it if B wins anywhere.
11-12 06:15Z: Q-TRP-3 = B (user typed). Pushed 29b8211 to #195 (object->img; only hit left = qr_code_generation.md script). Trusted-scripts allow-list PR is built by the demo-rail thread (…SxasfQF7Sm49rzpH7s62Bp); I told it smart-trust needs input/images/hcert-demo/{hcert-demo.js,hcert.js,hcert.wasm,hcert-demo.css}. After it merges: declare in smart-trust index.config.json, merge main (#198), re-pin, regen, add qa/ig-content-qa.json to include + record review.
