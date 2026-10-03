---
# folio-assistant-k6tw
title: 'SKILL: render an IG through just-the-docs wearing the instance''s existing theme (u3cd only reads kind=webpage; smart-trust''s 7h3u theme is unused)'
status: completed
type: task
priority: normal
created_at: 2026-10-01T12:31:04Z
updated_at: 2026-10-01T15:22:48Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-01: *"make skill to use existing themes on IG in just the docs rendering"*.

Measured gap: staging smart-trust's IG site (bamf/u3cd) reports "colour scheme: NONE — the instance declares no webpage theme", although smart-trust declares a WHO theme (`themes/upstream/who.css`, bean 7h3u, issue #1682). `stage-ig-sites.ts` `webpagePalette` only reads themes of kind `webpage`.

## Done when
- [ ] existing theme mechanisms mapped (u3cd, 7h3u, theme-by-ref, ig-chrome) — no duplicate built
- [ ] a skill states how an instance's existing theme reaches its just-the-docs IG site, and what is refused
- [ ] smart-trust's IG site renders in its declared theme (or the gap is stated with the owner's decision)
- [ ] gates: skill:register for the new skill

## 2026-10-01: premise corrected; skill written

**The premise was wrong.** smart-trust's theme `who-smart-ig` **is** `kind: "webpage"`, and the `u3cd` path already applies it: the staged `/smart-trust/ig/` CSS carries `#00477d` 15 times and `#f6f7f9` 8 times. The "colour scheme: NONE" seen earlier came from an agent's local script that called `stageIgSite` without `palette`.

**What was missing was the skill.** No theming skill named the IG-site path, and `ig-render-jekyll` §3 only said "captured".

**Added:** `fhir-harness/skills/fhir-ig-base/ig-site-theme.md`. It covers:
- the declared → resolved → rendered path;
- the refusals table;
- the three theme paths, which must not be conflated (IG site palette, docs-page theme, IG chrome);
- how to verify on the built CSS, and the trap above.

**Registration is partial.** The skill is in the `fhir-ig-base` manifest, `check:skills` gives 0 errors, and the manifest, registry and skill-register tests pass (56). `skill:register` stops at `skills:docs`, because `gen-skill-docs` crashes on `main` (#1760: "no category in SKILLS_CATEGORIES"). The later steps would regenerate artefacts that `main` already leaves stale, so they wait for `main`'s fix.

- [x] existing theme mechanisms mapped (u3cd, 7h3u, theme-by-ref, ig-chrome) — no duplicate built
- [x] a skill states how an instance's existing theme reaches its IG site, and what is refused
- [x] smart-trust's IG site renders in its declared theme (it already did; verified on built CSS)
- [x] gates: skill:register — completed after merging main (#1774)

## 2026-10-01 (later): registration complete

After merging `main` (#1774, "S0: main-green", which labels the 3 skill packages), `skill:register` ran to completion: *"9 artefact(s) current, 285 skill(s) across 29 package(s)"*. `uml:overview` needed `PLANTUML_JAR`; the Maven jar is reachable from these sessions.
- [x] gates: skill:register

## Summary of Changes
- Premise corrected: the theme was already applied (`u3cd`).
- Added the skill `ig-site-theme` (`fhir-ig-base`): the declared → resolved → rendered path, the refusals, the three theme paths, and verification on the built CSS. Registered (9 artefacts current).
