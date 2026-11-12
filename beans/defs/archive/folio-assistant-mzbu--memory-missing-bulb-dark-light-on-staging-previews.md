---
# folio-assistant-mzbu
$schema: bean/1.0.0
title: 'Memory: Missing bulb (dark/light) on STAGING previews = stale preview built before navbar-row.js got liteSchemeButton (~11-01); not a template bug'
status: completed
type: task
priority: low
created_at: 2026-11-08T18:24:11Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dark-toggle-stale-previews-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Missing bulb (dark/light) on STAGING previews = stale preview built before navbar-row.js got liteSchemeButton (~11-01); not a template bug

Thread "Restore dark/light toggle on DTH-HRH" (cmsg_017WNUkNK8kdDziPK58Pv6G9Ghy192r5KwCKLM728Fb46b), user 18:19Z 2026-11-08.
- The bulb lives in cat-harness site-chrome navbar-row.js (`liteSchemeButton`, shown when `link[data-fa-page-layout]` exists). Previews published before ~11-01/11-02 lack it. Check: `gh api repos/litlfred/<repo>/contents/<STAGING/x/>assets/js/navbar-row.js?ref=gh-pages -H "Accept: application/vnd.github.raw" | grep -c liteSchemeButton`.
- dth-hrh main site (published 11-05) HAS the bulb (Playwright-verified). dth-phc, smart-ra main sites have it. dth-sc main site lacks it: gh-pages last published 10-31 though main moved on 11-08.
- dth-hrh claude/open-at-chapter: 3 staging pin commits, 95 behind main; pins core claude/open-at-chapter (0e729aa, 635 behind, no PR). That core work (fold-above + lazy open) is superseded by core#577 (4673dd0e, 11-02 "Land hash links on their target"), already on dth-hrh main. Merging core main into it conflicts in build-document-site.ts.
- Card Q-DLT-1 asks: A retire preview+branches (rec), B refresh, C leave.
- Screenshot: /mnt/project-files/dark-toggle-2026-11-08/preview-vs-main.png
Related: folio-assistant-rnaj.
- 18:29Z Q-DLT-1 = A. Removed gh-pages STAGING/claude-open-at-chapter (dth-hrh 32e026b5a). Branch deletes are blocked by the session proxy (git push --delete gives 403); the user was given commands to run.
- Light/dark readability (user 18:24Z): (1) on the deployed 11-05 build, clicking the bulb did not swap the jtd sheet. This is already fixed by cat-harness#1140 and goes live after a re-pin and publish. Loading in light mode is fine. (2) Document tables had dark-theme th/td fill under ink, and jtd's min-width:100% made a white strip. Fix: folio-assistant-core#692 (issue #691, branch claude/doc-tables-dark-light). (3) smart-trust-demo home moment cards had theme text on #fff. Fix: smart-trust-demo#110 (issue #109). Q-DLT-2 = B. Both merged 2026-11-09 10:36Z (core#692, smart-trust-demo#110); live after core re-pin + publishes.
- Local test needs the site served under /dth-hrh/ (jtd.setTheme uses an absolute href): symlink root/dth-hrh -> site.
- 18:34Z: core branch claude/open-at-chapter is now in use by core#694 (DTH scroll jump thread). Do NOT delete it; only the dth-hrh branch delete stands.
