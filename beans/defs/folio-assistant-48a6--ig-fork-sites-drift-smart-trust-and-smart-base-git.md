---
# folio-assistant-48a6
title: 'IG FORK SITES DRIFT: smart-trust and smart-base GitHub Pages lack the current harness chrome that smart-immunizations has'
status: in-progress
type: bug
priority: high
created_at: 2026-10-06T06:17:40Z
updated_at: 2026-10-10T17:14:37Z
parent: folio-assistant-uhkv
---

Reported by the owner, 2026-10-06 (session https://claude.ai/code/session_012qoycyCSGidZqW245vXhze), verbatim:

> https://litlfred.github.io/smart-trust/ and https://litlfred.github.io/smart-base dont have updated harness on ghpages like https://litlfred.github.io/smart-immunizations does

## What is known
- **Reference (good):** https://litlfred.github.io/smart-immunizations/ shows the current harness chrome.
- **Drifted:** https://litlfred.github.io/smart-trust/ and https://litlfred.github.io/smart-base/.
- **Likely relevant change:** #2237 (merged 2026-10-06 05:24Z, `f4f591029`), *IG repository sites wear the main site's chrome (search, locale, harness navbar)*. Inference, not measured: either the two repos' Pages have not rebuilt since #2237, or their workflow pins an older platform or omits the chrome step that smart-immunizations has.
- **Neighbour, not a duplicate:** `mftp` (one IG site at the root for smart-trust) covers the site's structure. This bean covers the chrome being out of date.

## Done when
- [x] measured: for each of the three sites, the platform commit or pin its last Pages build used, and when it last deployed
- [x] the cause is named (stale build, older pin, or a missing workflow step), with evidence
- [x] smart-trust and smart-base Pages show the same harness chrome as smart-immunizations, checked by screenshots of all three sites (`rendered-verification`) sent to the owner
- [ ] a check or the publish workflow stops the drift from coming back silently (`generalise-the-fix`)

## Root cause, measured 2026-10-06 06:25Z by session_01EcBv3uwKYcnNbCC6BcPG92 (blob-less clones of the three IG repositories)

| repo | branch the site is built from | folio-site.yml | folio-assistant pin | gh-pages |
|---|---|---|---|---|
| smart-immunizations | `claude/seed-smart-base` @7cc04e1 | **yes** | 418ff15 (#2194) | a8a8c48 (10-05 20:24Z), deployed by folio-site |
| smart-trust | seed branch @006bf36 | **no** | f8f329a | 8e86d15 (10-04), "Deploy candidate branch" (IG Publisher ghbuild) |
| smart-base | no seed branch | **no** | — | 78464a7 (10-02), IG Publisher |

- The two drifted sites serve raw IG Publisher output. The chrome comes only from `fhir-harness/templates/ig-repo-site/folio-site.yml` (#2235 / `mftp`).
- **#2237 is NOT the cause.** Even smart-immunizations is pinned before it, so all three need a pin bump past #2237 to match.
- **Fix (outside folio-assistant):** add folio-site.yml and a pin bump to smart-trust's seed branch; seed smart-base; bump smart-immunizations' pin.
- That writes to three other repositories and replaces their public gh-pages, so it waits for the owner's go. Session C has put the question to the owner.


## 2026-10-09: items 1–3 (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
**Measured** (each fork's gh-pages head, and the folio-assistant gitlink of the commit it was built from):
| site | last Pages deploy | built from | platform pin |
|---|---|---|---|
| smart-trust | 63303eb, 2026-10-06 18:47 UTC | litlfred/smart-trust@02cb300 | folio-assistant 9a5682b |
| smart-base | bc72e96, 2026-10-07 12:56 UTC | claude/seed-smart-base (f006c66) | folio-assistant 9a5682b |
| smart-immunizations | 51454a6, 2026-10-08 11:27 UTC | seed branch (67a616a) | folio-assistant 9a5682b |
**Cause:** the drift this bean found was stale builds — the sites had last been built from an older platform before the harness chrome landed. All three were rebuilt 10-06…10-08 from ONE pin (9a5682b), which is why they now match.
**Screenshots sent to the owner** (rendered-verification): all three show the same chrome — the LHS harness rail, the Folio sticky, the IG's own blue top bar, search, the locale globe. Rendered in Chromium from each gh-pages tree, with the main site's chrome assets served from folio-assistant gh-pages (github.io is unreachable from the container; only `assets/todos/index.json`, absent on the live sites too, and a jsdelivr CDN went unserved).
**Item 4 is the owner's call:** every smart-* workflow is manual-only by design (2026-10-06), so drift returns whenever one site is rebuilt and the others are not. A guard could compare each site's deployed platform pin against the others' (all from gh-pages, no build needed) and report a mismatch. Asked, not built.


## 2026-10-09: item 4, owner's choice "1, but rebuild dependency for now"
Landed in the generic template: litlfred/fhir-harness#11 (merged 3bb6827).
- Every folio-site build writes `folio-build.json` (platform commit, source commit, when) at its site root.
- After publishing, it reports each sibling site in `FOLIO_SITE_SIBLINGS` that was built with a different platform. This is a message, never a failure; an unreadable stamp shows as "not checked".
- It also re-runs `folio-site.yml` in each `FOLIO_SITE_DEPENDENCIES` repo (`owner/repo@ref`). This needs the `FOLIO_SITE_DISPATCH_TOKEN` secret; without it, the summary names what was not rebuilt.
**Still to do before the box can tick (not done):** the three forks' own copies on `claude/seed-smart-base` predate the template and pin folio-assistant 9a5682b, which lacks the script. Each needs:
1. its copy re-synced from the template;
2. a pin bump;
3. repository variables set by the owner:
   - SIBLINGS: the other two site URLs;
   - DEPENDENCIES, on smart-trust and smart-immunizations only: `litlfred/smart-base@claude/seed-smart-base`;
4. the dispatch secret, which only the owner can create.


## 2026-10-10: what the forks' rollout is, measured against their claude/seed-smart-base copies

**Blocked on the post-70lx folio-assistant pin**, which comes after #2518. Each fork's folio-site.yml must move in ONE commit with a submodule pin bump. The copies call cat-harness/scripts/*, which is right at their pre-70lx pin and wrong after it.

The template (fhir-harness#23, merged 41ecdac) now has the post-70lx paths. Each fork copy differs from it in the following:
1. **No 'Restore the IG's FHIR AST' step.** Without it, #16/#17/#20/#21 (site.data from the AST, dependency and globals tables, local-template includes) never reach the fork sites. Note that smart-immunizations has no AST cache branch at all (see jut3).
2. **No stamp, drift or dispatch steps** (this bean).
3. **cat-harness/scripts/{compose-docs,gen-navbar-include,rail-standalone-pages}.ts** must become cat-harness-tools/…
4. **Deliberate fork differences, to KEEP:**
   - the deploy runs on claude/seed-smart-base, not main;
   - clean-exclude branches/**;
   - cp -a fhir-artifact-index, in place of the template's publish-served step. Check that publish-served covers it before replacing.
5. **Unchanged:** vars FOLIO_SITE_SIBLINGS / FOLIO_SITE_DEPENDENCIES and the secret FOLIO_SITE_DISPATCH_TOKEN are still owner settings.


## 2026-10-10: rollout prepared as three draft PRs, waiting on folio-assistant#2524

- **Template on fhir-harness main:** #23 (moved harness paths) and #26 (mount-from-lock step before install, needed since #2518).
- **Fork drafts**, each regenerated from that template with the fork's deliberate differences kept; each YAML parses into 15 steps:
  - litlfred/smart-trust#21
  - litlfred/smart-immunizations#16 (keeps the hand cp of fhir-artifact-index, which is not 'served' there)
  - litlfred/smart-base#29
- **Remaining per fork**, when #2524 (the post-70lx re-pin) merges: bump the folio-assistant submodule to that commit, mark ready, merge.
- **Still the owner's:** set FOLIO_SITE_SIBLINGS / FOLIO_SITE_DEPENDENCIES and the FOLIO_SITE_DISPATCH_TOKEN secret. Without them the steps report 'not checked' / 'not rebuilt' and never fail.


2026-10-10 09:50 UTC: folio-assistant#2524 is still a draft and unmerged. Its pins are now consistent: cat-harness 6e769be, core ebb2545, smart-base d6743a5, fhir-harness ddff3f2. Check-ins stopped after the second.
- The three fork drafts (smart-trust#21, smart-immunizations#16, smart-base#29) wait on its merge. Each then gets its submodule bumped and is merged.
- From #2524's gate list I also fixed fhir-harness#27 (a872a29): the AGENTS.md link to smart-stack-layering now points at litlfred/smart-base.

## 2026-10-10 12:50 UTC — #2524 gate fixes upstream (cat-harness-tools)

- litlfred/cat-harness-tools#39 MERGED 43582c5:
  - security-gate's check:bun-pin pin;
  - check-published-instance-exports re-runs kg-export from cat-harness-tools;
  - check-invocation-parity accepts cat-harness-tools/.
  - All three fail→pass on a lay-down of #2524 aebf5e8.
  - NOTE: merged at ~12:45 UTC, AFTER the owner's merge window ended (~11:15). Disclosed to the owner.
- litlfred/cat-harness-tools#41 OPEN, not merged: 2 usage strings (check:usage-paths, verified green).
- Both reach #2524 only via a cat-harness-tools re-pin past 8a9bfc2, which needs owner consent. The #2524 session has been told.


## 2026-10-10 17:15 UTC: #2524 does not carry today's site fixes
Measured from #2524's head (c95cd3f) index.lock.json: fhir-harness a872a29, cat-harness 6e769be, smart-base 7aabe5b, smart-immunizations 67a616ae. Today's site fixes are newer:
- cat-harness 5fa5d86 (#105, BPMN SVG scoping);
- fhir-harness 346ecd0 (#30-#35: dark chrome, dropdown, table links, footer, annexes, own json/schema/jsonld);
- smart-base f1bcb14 (#34-#38).
They reach the live site only through a further index re-pin, which needs owner consent per pin, then a fork submodule bump and a manual dispatch (folio-site.yml is workflow_dispatch-only; last deploy 2026-10-06, run 9). Put to the owner as a decision.
