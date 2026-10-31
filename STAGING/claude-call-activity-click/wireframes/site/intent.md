# Published site — as-is intent

## Covers

- Declared visualiser `cat-harness/site` (cat-harness `visualisers`, `renderedBy: site-viewer`, `coversKinds: ["basic-cdn-site"]`; bean `folio-assistant-6gme`, owner 2026-10-20: "Build route listing").
- Generator: `cat-harness-tools/scripts/gen-site-viz.ts` (`bun run cat site:viz`), one page at `<base>/en/cat-harness/site/`, built at publish (`builtAtPublish`, cause `state`, from `site`).
- Drawn from the generated page against the `gh-pages` tip of 2026-10-20; the route table is cut to six rows of the 58, and the two other states are drawn below it, although a real page shows exactly one state per site.

## Who it is for, and what they need to do

- **Reader:** the owner or an agent asking what is actually published: which top-level routes the CDN serves, how big each is, and which staging previews are still up.
- **Tasks:** read the tip the listing was taken at; scan routes and their page counts; spot stale staging previews; open a route.

## What it must show (read off the generator)

- an `h1` "Published site" and one sentence saying where the listing comes from and what counts as a page
- per declared `basic-cdn-site` directory: the instance and id, the branch and remote, then exactly one of three states
  - **present:** the tip, the totals, a Route / Pages / Files table of top-level routes, and a Preview table of `STAGING/<slug>/`
  - **empty:** git answered and the branch is absent or holds no files, said in words
  - **could not read:** git did not answer; the reason, and no table and no counts — never a zero standing in for "could not look"
- links relative to the site root, so the same bytes serve the canonical base and a staging slug

## Observed

Regions in reading order: strip; title; framing sentence; one section per site with its state line and tables.

Mobile (≤ 390): the two count columns do not wrap; long preview slugs break inside their code; the tables scroll sideways inside their wrapper if they must.

## Findings

1. **Pages are counted, not judged.** A route with many files and no pages (`assets/`) is expected; nothing marks which routes are content and which are support.
2. **Staging previews carry no age.** The tree says nothing about when a preview was pushed, so a stale preview is visible only by its slug.
