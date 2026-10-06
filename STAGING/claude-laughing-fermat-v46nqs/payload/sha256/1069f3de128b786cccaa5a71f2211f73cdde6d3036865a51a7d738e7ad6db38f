---
# folio-assistant-48a6
title: 'IG FORK SITES DRIFT: smart-trust and smart-base GitHub Pages lack the current harness chrome that smart-immunizations has'
status: todo
type: bug
priority: high
created_at: 2026-10-06T06:17:40Z
updated_at: 2026-10-06T06:27:41Z
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
- [ ] measured: for each of the three sites, the platform commit or pin its last Pages build used, and when it last deployed
- [ ] the cause is named (stale build, older pin, or a missing workflow step), with evidence
- [ ] smart-trust and smart-base Pages show the same harness chrome as smart-immunizations, checked by screenshots of all three sites (`rendered-verification`) sent to the owner
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
