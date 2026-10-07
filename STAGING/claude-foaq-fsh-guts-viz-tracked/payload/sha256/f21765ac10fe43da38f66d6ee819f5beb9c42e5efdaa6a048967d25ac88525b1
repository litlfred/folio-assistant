---
# folio-assistant-x78e
title: 'smart-immunizations landing: Summary heading has a wrong feedback link and no section edit link'
status: completed
type: bug
created_at: 2026-10-06T05:56:52Z
updated_at: 2026-10-06T18:30:00Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-06, on https://litlfred.github.io/smart-immunizations/ : "was bad feedback/shout link. there is no edit link" — and: "there is one at the very bottom of the page, but no context aware edit link". So the page-level edit link exists in the footer; what is missing is the per-heading ✎.

The "Summary" heading shows only 📣, and its link is:

    https://github.com/litlfred/smart-immunizations/issues/new?title=Feedback: Summary — About this implementation guide
      &body=**Page:** https://litlfred.github.io/smart-immunizations/#about-this-implementation-guide
            **Section:** About this implementation guide
            **Source:** https://github.com/litlfred/smart-immunizations/blob/main/input/pagecontent/index.md

Against mftp's spec (each heading gets ✎ = its source line, blob/<branch>/…#L<n>, and 📣 = a pre-filled issue with page, section and source line), there are four defects:
1. no context-aware ✎ on the heading (only the page-level edit link at the very bottom);
2. the title pairs "Summary" with a different section ("About this implementation guide"), so the heading-to-section mapping is wrong;
3. the Page anchor is #about-this-implementation-guide, not the Summary heading's own id;
4. the Source link has no #L<n> line number.

## Root cause

`input/pagecontent/index.md` in smart-immunizations is `{% include index-ig.md %}` (then `ip-statements.xhtml`) and nothing else. That is the HL7 IG template's landing page, so the same holds for every IG built from it. Every heading a reader sees is in `index-ig.md`. `sourceHeadings` (fhir-harness `build-ig-site.ts`) read only the page's own file, so the staged page carried `ig_source_lines: []`. With no line matched, the layout script drew no ✎ and gave the 📣 Source the bare `index.md` blob, with no `#L<n>`. This explains defects 1 and 4.

Defects 2 and 3 are not a mis-resolution in the script: each 📣 takes its text and its id from the heading it is attached to. A local build confirms this (Summary's 📣 → `#summary`). The issue title, however, put the PAGE title first: `Feedback: <page> — <section>`. This page is titled after its menu entry, "Summary" (`menu.json`: `Summary → index.html`), which is also the name of its first section. So the About section's 📣 read "Feedback: Summary — About this implementation guide" with `#about-this-implementation-guide`: one heading's name paired with another's link.

Fix (PR #2292): `sourceHeadings` follows `{% include %}` / `{% lang-fragment %}` to `.md` files, resolved as the build resolves them (`includeSource`: pagecontent over includes). Each heading records the file its line is in, and ✎ links that file's line. The 📣 title now names the section first and adds the page only when it differs. The body names the heading's own `#id`.

## Done when
- [x] on the built smart-immunizations landing page, every heading has ✎ to its own source line and 📣 naming its own section and anchor
  - Built locally from the smart-immunizations checkout at 361e469 with `stage-ig-sites --only smart-immunizations --compose-at-root`, then Jekyll and `--dedupe-ids`. Read in Chromium:
    - Summary → ✎ `blob/main/input/pagecontent/index-ig.md#L9`; 📣 `Feedback on “Summary” (page: WHO Immunization Implementation Guide)`, Page `…/#summary`, Source `…index-ig.md#L9`
    - About this implementation guide → ✎ `…#L16`; 📣 anchor `#about-this-implementation-guide`
    - Disclaimer → ✎ `…#L46`; 📣 anchor `#disclaimer`
  - The theme's own "Table of contents" h2 (just-the-docs child nav, not IG source) gets neither link.
- [x] root cause recorded (why ✎ is dropped and the section is mis-resolved on this page) — see "Root cause" above
- [x] a test covering a heading like this one (index.md, the IG's first page) fails on the old behaviour — `build-ig-site.test.ts` › "heading links on an IG's first page, whose headings live in an include (bean `x78e`)". On the old `build-ig-site.ts`: 2 fail (`ig_source_lines` received `[]`). With the fix: 2 pass.

Related: mftp, whose spec defines the ✎ / 📣 heading links.

_2026-10-06T15:44:01Z_ — Claimed by claude/x78e-heading-links — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Merged 2026-10-06 (session https://claude.ai/code/session_01EcBv3uwKYcnNbCC6BcPG92)
#2292 merged as c5714c8 after CI PASS on its head (`ci:watch`); every Done-when box above was ticked with evidence, re-checked before merging.
