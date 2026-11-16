---
# folio-assistant-t15r
$schema: bean/1.0.0
title: 'WHO move T15: smart-ra open issues and PRs copied to WorldHealthOrganization/smart-ra'
status: in-progress
type: task
priority: high
created_at: 2026-11-16T00:40:00Z
updated_at: 2026-11-16T00:46:00Z
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

## Still to do
- [ ] Fork side (dump DONE 00:17Z by a helper thread with the fork attached: `/mnt/project-files/who-migration-plan/issues/smart-ra-fork-comments.json`; closing originals in progress there) (needs a session with litlfred/smart-ra attached: one session cannot hold both repos named smart-ra): dump comments of the 24 issues and review state of the 8 PRs; comment `Moved to WorldHealthOrganization/smart-ra#M` on each original and close (issues as not planned). Do NOT delete the fork branches until the WHO PRs merge.
- [x] Append the original comments to the WHO copies (from the dump): done 00:45Z, 39 issue comments as a quoted block under "Comments on the original", @mentions escaped; PRs got a "Review state on the original" section (no reviews, 4 comments).
- [ ] Open beans/to-dos that link moved items: append the new link (plan step 4).

## Log
_2026-11-16T00:40Z_ — created; WHO side and sheet done, fork side pending.
_2026-11-16T00:46Z_ — original comments appended to the WHO copies.
