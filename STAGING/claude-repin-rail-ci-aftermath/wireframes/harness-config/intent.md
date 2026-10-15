# Harness config panel, and associated harnesses: intent

Issue #1146. Owner, 2026-09-23:
> "we need a good mechanism for 'associated' harnessed KGs. it should be an optional list property of any harness inheriting cat-harness (including itself). should add to cat-harness harness visualize a config panel/popup which shows properties of cat-harness and other instances. add in to render appropriate edit skills as well."

Not wanted: publishing an associated harness at `/folio-assistant/<name>/`, and any materialized copy.

## Who, and what they need to do

**Who:** an owner or agent maintaining harnesses. They know the declarations exist but should not have to read `cat-harness.json`, which has 39 directories and long `_comment` fields, to see what a harness declares.

**What they need to do:**
1. See every harness in one place:
   - **instantiated here** (a `<name>.config.json`: Bootstrap, C@T Harness, Folio Assistant, SMART Base, WHO IRIS, smart-trust);
   - **in this checkout** but not instantiated (the other 11);
   - **associated** (declared by a harness, living elsewhere; first case: litlfred/ihris).
2. Open one harness and read its declared properties as a table: property, value (summarised: "39 directories", "needs bootstrap"), and where it is declared.
3. For each property, see **which skill edits it**, linked to its skill-instructions page, and the raw ✎ source.
   - A property with no edit skill is shown as a QA finding, not a blank.
4. Tell at a glance that an associated harness is **remote**:
   - it is referenced and never materialized;
   - its ✎ points at its own repository;
   - "Open ↗" goes to its site;
   - nothing is fetched to draw the panel.

## What it must show (real data, main @ 8c64c322)

C@T Harness (`cat-harness/cat-harness.json`):

| property | value | edit skill |
|---|---|---|
| name, title, description | cat-harness, C@T Harness, … | directory-conventions |
| icon, images | mark, 24 images | theme-declaration |
| navbarIcons | 6 | harness-tiles |
| stickies | 1 | create-sticky-note |
| directories | 39 | directory-conventions |
| needs | bootstrap | directory-conventions |
| stub, canonicalUrl, publication | cat-harness, litlfred.github.io/folio-assistant, github-pages | document-publishing |
| folioMount | 1 root | **none mapped: a QA finding** |
| associatedHarnesses | ihris (new) | associate-harness (new) |

The associated harness, as cat-harness would declare it:
- `name`: ihris
- `title`: iHRIS Knowledge Base
- `url`: https://litlfred.github.io/ihris/
- `repository`: https://github.com/litlfred/ihris
- `relation`: folio-of
- `note`: "A folio on this platform, in its own repository and site."

## Where

The cat-harness harness visualiser: the landing page's "What each harness holds" and the glass Settings. Both are covered by the `navbar` wireframe. This wireframe covers the new panel only.

## Both layouts

Web (1280) and mobile (390) are required for every candidate.

## Candidates

- **A: glass panel.** The Settings panel gains a "Harnesses" view: a grouped list on the left, the selected harness's property table on the right. On a phone the list drills in to the table, with ← back.
- **B: dialog per harness.** Each harness divider in the sidebar gets a ⚙ that opens a dialog with tabs (Properties, Graphs, Associated). Associated harnesses get their own sidebar group, "Associated ↗". On a phone the dialog is a full-screen sheet.
