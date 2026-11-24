---
# folio-assistant-t15r
$schema: bean/1.0.0
title: 'WHO move T15: smart-ra open issues and PRs copied to WorldHealthOrganization/smart-ra'
status: in-progress
type: task
priority: high
created_at: 2026-11-16T00:40:00Z
updated_at: 2026-11-24T09:00:00Z
parent: folio-assistant-wm26
tags:
    - who-migration
---

Plan step T15 (section 11 of `/mnt/project-files/who-migration-plan/who-migration-plan.md`) for smart-ra, after WorldHealthOrganization/smart-ra#46 merged (2026-11-15 22:52Z). Owner choices: Q-WP-7 = A (copy issues, link both ways, close originals, keep a map), Q-WP-8 = A (re-open parked PRs from the same fork branches). Thread: Move smart-ra issues and PRs to WHO (…JVESm8fE54oqPt32e4ZRJ5). Related: [[folio-assistant-wt3x]].

## Map litlfred/smart-ra → WorldHealthOrganization/smart-ra

Issues: 10→50, 17→51, 22→52, 88→53, 89→54, 133→55, 143→56, 145→57, 146→58, 157→59, 166→60, 171→61, 200→62, 202→63, 205→64, 206→65, 211→66, 212→67, 214→68, 219→69, 222→70, 246→71, 247→72, 258→73.

PRs (same fork branch, base WHO main): 172→74, 189→76, 193→77, 194→79, 196→80, 215→81, 224→82, 259→83. (WHO #75/#78 are another thread's iriBase issue/PR.)

Machine-readable copy: `/mnt/project-files/who-migration-plan/issues/smart-ra.json`.

## Done (2026-11-16 00:2xZ–00:40Z)
- Copies keep title, labels (5 labels created on WHO: change-set, content, release, hold: committee sign-off, needs-repin), draft state, assignee litlfred. First line `Migrated from litlfred/smart-ra#N` / `Re-opened from litlfred/smart-ra#N`.
- Bare `#N` in bodies rewritten: moved items → WHO number (so `Closes #N` closes the WHO copy), other fork items → `litlfred/smart-ra#N`, cat-harness-tools numbers qualified. Requirement row numbers in #77/#76 tables left as they were.
- WHO #82 (was #224) is stacked on #81 in the fork; on WHO its base is main, so its diff includes #81's commits until #81 merges.
- DPI-H review sheet (1TNr5VP…): Config CFG `REPO_URL` → WHO; Agent - Change Sets C204 → WHO pull/74, C209 → pull/81, E209 issue link → WHO issues/68; the Document/Repository line in B1 of both Agent tabs, both Review tabs and Public Comment Source → WHO. Merged/closed PR links (fork numbers) left on litlfred, they stay valid. Staging preview links left on litlfred.github.io (WHO has no branch previews yet).

## Still to do (refreshed 2026-11-24)
- [x] Fork side: comments of the 24 issues and 8 PRs dumped to `/mnt/project-files/who-migration-plan/issues/smart-ra-fork-comments.json`; each original commented `Moved to WorldHealthOrganization/smart-ra#M`; issues closed not planned, PRs closed (recorded done 2026-11-16T00:19Z in [[folio-assistant-wm26]]; closed state unverified here). Fork branches kept: verified 2026-11-24, the six litlfred/smart-ra branches behind WHO #74 #76 #77 #79 #80 #81 are still there at the same heads.
- [x] Append the original comments to the WHO copies (from the dump): done 00:45Z, 39 issue comments as a quoted block under "Comments on the original", @mentions escaped; PRs got a "Review state on the original" section (no reviews, 4 comments).
- [x] litlfred/smart-ra main on WHO main: WHO#86 and WHO#89 merged 2026-11-19 (a6435d8); litlfred main 0ce33a4 is an ancestor of WHO main 24d0049 (verified).
- [ ] Land or park the re-opened content PRs on WHO: #74, #76, #77, #79, #80, #81, #82 are not merged into WHO main (verified) and still open (inferred: GitHub still serves their refs/pull/N/merge); each carries 1–2 commits of its own. #82 is stacked on #81. #77: the ICD-11/WHO-FIC definitions must go into glossary/dpi-h-ra.glossary.json. Do NOT delete the fork branches until these merge.
- [ ] WHO #73 (the issue of closed #83) left open for T4 (state unverified).
- [ ] Open work items and to-dos that link moved items: append the new link (plan step 4). Not done as far as this work item records (unverified).

## Log
_2026-11-16T00:40Z_ — created; WHO side and sheet done, fork side pending.
_2026-11-16T00:46Z_ — original comments appended to the WHO copies.
_2026-11-16T00:30Z_ — fork thread merged WHO main (bff9597) into the six conflicting branches; WHO #74 #77 #79 #80 #81 #82 all mergeable, push comments posted. #77 flagged: ICD-11/WHO-FIC definitions must go into glossary/dpi-h-ra.glossary.json (table is regenerated). Owner card open: close #83 (litlfred re-pin) as superseded by T4.
_2026-11-16T06:33Z_ — owner chose A: WHO #83 closed as superseded by the T4 same-owner re-pin (branch kept). WHO #73 (its issue) left open for T4.
_2026-11-24T08:30:00Z_ — Filed from folio-assistant#3166 because beans/ on main is no longer the store (the work plan lives on the state branch). "Still to do" refreshed from git: WHO#89 merged (litlfred main fully on WHO main); fork side recorded done in wm26; WHO #74 #76 #77 #79 #80 #81 #82 not merged and apparently open; fork branches still present. Issue states (WHO #50–#73, originals) unverified. Stays in-progress.
