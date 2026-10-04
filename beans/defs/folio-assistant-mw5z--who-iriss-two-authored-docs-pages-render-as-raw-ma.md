---
# folio-assistant-mw5z
title: who-iris's two AUTHORED docs pages render as raw markdown and nothing links them
status: todo
type: bug
created_at: 2026-10-04T06:25:33Z
updated_at: 2026-10-04T06:25:33Z
parent: folio-assistant-0lmb
---


Found by running bean `06e3`'s who-iris exercise end to end, 2026-10-04 (PR #2049).

## The declaration states the rule that is now broken

`who-iris.json`, on the `who-iris-catalogue` entry:

> *"HTML rather than markdown because who-iris declares no `composed` directory
> -- its docs are MOUNTED after Jekyll, so a .md here would be copied verbatim
> and never rendered."*

Bean `qsx4` (owner, 2026-09-30: *"who voices style guide is derivative KG
content from who-iris, merge content into subgraph. including docs."*) then
moved `who-style-guide/README.md` → `who-iris/docs/style-guide.md` and
`who-style-guide/AGENTS.md` → `who-iris/docs/style-guide-agents.md` by `git mv`.

**These are the only two pages in `who-iris/docs/` a person actually wrote** —
the other four are generator output (`gen-iris-pages.ts` ×3,
`subgraph-readmes.ts` ×1; see bean `7te5`).

## Measured in a LOCAL SITE BUILD, not inferred

- `/docs/who-iris/style-guide.md` → **200**, served as raw markdown. Screenshot
  shows `#` and `**` markers, unrendered pipe tables, and `â€"` where em-dashes
  were.
- `/docs/who-iris/style-guide.html` → **404**. No rendered page exists at any
  route.
- `docs/who-iris/index.html` — who-iris's generated docs LANDING page, with a
  section headed **"Pages"** — lists exactly two: `ingestion-notes` and
  `kg-to-portal`. Its `PAGES.docs.fixed` in `gen-iris-pages.ts:269` predates
  `qsx4` and knows nothing about the other two.
- Whole-site `grep -rho 'href="[^"]*style-guide[^"]*"'` over **4155** built
  pages returns **2 + 2 GitHub blob links and nothing else** — both from the
  docs-auto `index/docs` page, pointing at `github.com/…/blob/main/…`.

So the derived index is the **only** thing that reaches who-iris's authored
documentation, and it reaches it as SOURCE ON A FORGE rather than as a page.

That is the inverse of `06e3` §2's worry. §2 forbids shipping an index with no
authored prose around it; here the prose exists and only the index can find it.

## The three options, and none is obviously right

1. **Render them.** who-iris declares no `composed` directory, so this means
   either declaring one or pre-rendering the two pages the way the other three
   are. The second keeps the mount's one rule (*everything here is already
   HTML*) and costs a generator pass over authored prose.
2. **Move them** out of a mounted directory into one Jekyll builds.
3. **Leave them and say so** — but then `docs/who-iris/index.html`'s "Pages"
   section is wrong by two, which is the `dh4f` shape: a reader told a directory
   holds two pages when it holds five.

Option 3's second clause is required whichever is chosen: the landing page must
stop claiming a complete list it does not have.

## Done when

- [ ] who-iris's two authored pages are reachable as RENDERED pages, or the
      decision not to render them is recorded with its reason
- [ ] `docs/who-iris/index.html`'s "Pages" section no longer under-reports its
      own directory
- [ ] at least one page links them — measured by grepping the BUILT site, not
      the source
