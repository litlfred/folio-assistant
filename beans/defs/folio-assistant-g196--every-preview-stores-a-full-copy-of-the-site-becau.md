---
# folio-assistant-g196
title: Every preview stores a full copy of the site because per-preview facts are baked into every page
status: todo
type: feature
parent: folio-assistant-1xhc
created_at: 2026-09-19T12:53:43Z
updated_at: 2026-09-19T12:53:43Z
---


**In one sentence:** every staging preview stores a full ~37.5 MB copy of the
site because three per-preview facts are baked into all ~530 pages, so git's
content-hash deduplication has nothing to grip — and moving those facts into one
small data file read in the browser would turn 530 differing files into one.
[View this bean](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-g196--every-preview-stores-a-full-copy-of-the-site-becau.md)

**What I would do next:** emit `STAGING/<slug>/staging.json` carrying branch, sha,
built, PR and run URL, and render the banner and supply the baseurl from it at
load time — the same client-derived pattern `head_custom.html` already uses for
the sidebar QR.

Split out of `xxku`, which measured the problem and fixed only the fourth cause.

## The measurement — 2026-09-19, `origin/gh-pages`

9 previews, **346.1 MB**, against `STAGING_WARN_BYTES = 100 * MB`. Of each
37.5 MB preview, **27.5 MB is HTML** — and **zero HTML blobs are shared between
any two previews** (`git ls-tree` blob-hash intersection: 0 of ~390 HTML objects,
against 185 of ~780 overall; the shared ones are images, fonts and vendor JS).

Diffing `crdm-methodology.html`, a page neither branch touched, between two
previews: 86 of 1881 lines differ, **75 of them carrying the preview slug.**

## Three causes, and any one of them defeats deduplication alone

**1. The build timestamp and commit SHA in the staging banner.** This is the
fundamental one. `feature-staging.yml` injects into every page:

    🔀 FEATURE BRANCH — <slug> · commit ${SHA} · built ${BUILT} · PR #… · build log

`${BUILT}` is `date -u +%Y-%m-%dT%H:%M:%SZ`, so **every page is unique even
across two builds of one branch.** Each re-push therefore adds ~27.5 MB of
permanently new blobs to `gh-pages`, and the history grows even when the preview
count does not. Confirmed in the run 597 log: *"Injected staging banner into 530
HTML files"*.

**2. `baseurl`-prefixed hrefs, ~235 per page.** Jekyll's `relative_url`
**prepends `baseurl`**; it is not document-relative. `head_custom.html` uses it
throughout and its comments already anticipate the STAGING baseurl — which is
precisely why the slug is on every asset href. Byte-identical pages need a
post-build rewrite to document-relative paths, not a config change.

**3. The `fa-translation-index` island publishes `site.baseurl` to JavaScript.**
`docs-ui.js` is *told* the baseurl, deliberately, per its own comment: *"under a
`baseurl` this script is told rather than guesses"*. `navKey()` strips it from
each nav href and the language switcher **rebuilds** hrefs as `baseurl + t.url`.
So (2) cannot be done without (3): document-relative hrefs break the switcher,
and the island keeps every page distinct until the baseurl is derived at runtime.

A fourth cause — `canonical`, `og:url` and `jekyll-seo-tag`'s inline
`WebPage.url` — is **already fixed** by `scripts/strip-preview-seo.ts`
(`xxku`, PR #414), on correctness grounds rather than size. Verified on the
deployed preview against a control: 0 claims per page where an older preview has
2–3.

## The shape, and the precedent is in this repo already

**Derive the per-preview facts in the browser rather than baking them into 530
pages.** `STAGING/<slug>/staging.json` holds branch, sha, built, PR and run URL;
a script reads it at load time to render the banner and to supply the baseurl the
language switcher needs. **530 differing files become one.**

This is not a new idea here: `head_custom.html` records the sidebar QR as
*"generated in the browser from `window.location.href` rather than baked per page
at build time"*, for the neighbouring reason (so it is right for anchors and both
URL spellings). The banner and the baseurl want the same treatment.

## What it is worth, stated honestly

Projected: one HTML copy (~27.5 MB) + N x ~5 MB graph/search exports + ~5 MB
shared assets. At 9 previews that is **~77 MB — under the threshold with nothing
pruned and no live preview destroyed**, against 346 MB today.

**But the exports are a real floor, not duplication.** `search-data.json` must
index the branch's own pages and `folio-assistant.jsonld` is the graph *of that
branch*, so both legitimately differ per preview. At ~18 concurrent previews they
alone breach 100 MB. That is the point to reconsider the threshold's **value** —
and to do it by stating the floor in its basis, never by a prune policy.

## What must NOT change, and why

The **identity** references stay absolute, byte-for-byte. In
`folio-assistant.jsonld`: `@id` (1244), `partOf` (857), `to`/`from` (443 each),
`performedBy` (414), `schema` (104), `inputSchema`/`outputSchema` (22 each) —
5205 in total. A relative JSON-LD `@id` resolves against the document's
**retrieval** URL, so serving it from Pages, opening it from disk and embedding
it elsewhere give three different graphs; and `schema`/`inputSchema`/
`outputSchema` are JSON Schema references a validator handed the document out of
band cannot resolve at all.

**An address may be relativized; a name may not.** Deduplication is worth
having; it is not worth buying with identity. This was the owner's correction to
`xxku`'s first proposal and it is the constraint on this bean.

Also already safe: `@context` prefixes are absolute and slug-free
(`https://litlfred.github.io/folio-assistant/bootstrap/ns#`), so the vocabulary
namespace was never at risk.

## Not doing without the owner deciding

Whether a preview should mint its own `@id` for all 1244 nodes at all. It may
well be correct — a preview's graph genuinely differs in content, and an unstable
id for an unstable artefact is honest. The clearly *wrong* alternative is a
preview claiming the published `@id`s, since two documents would then assert
different facts about one node. Left alone.

## Done when

- [ ] `staging.json` emitted per preview, carrying branch, sha, built, PR, run URL.
- [ ] The banner rendered from it at load time, so its markup is constant across
      previews AND across rebuilds of one preview. **Verified on a rendered
      preview by a person** — `continual-progress` is explicit that a rendered
      artefact cannot be assessed from a description of it.
- [ ] `docs-ui.js` derives the baseurl at runtime; the language switcher still
      swaps nav items correctly, including the three-state fallback
      (index present / present-but-empty / absent) it already distinguishes.
- [ ] Presentational hrefs emitted document-relative; identity references
      untouched, checked rather than assumed.
- [ ] Re-measure STAGING and compare against the ~77 MB projection. A projection
      that was not checked is a guess.
- [ ] `STAGING_WARN_BYTES` revisited with its floor restated, once the real
      number is known.

## Risks

- Touches the docs build and the language switcher, with ~20 branches live in
  `docs/` on 2026-09-19 — coordinate rather than land blind.
- The banner exists so a reviewer **cannot** mistake staged content for the
  published site. A client-rendered banner must not be defeatable by a failed
  fetch: if `staging.json` cannot be read, the page must still say it is a
  preview. **"Could not determine" is never rendered as "this is the real
  site"** — the same third-state rule the rest of this repository runs on, and
  here the failure mode is a reviewer approving the wrong artefact.
