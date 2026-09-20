---
# folio-assistant-g196
title: Every preview stores a full copy of the site because per-preview facts are baked into every page
status: in-progress
type: feature
priority: normal
created_at: 2026-09-19T12:53:43Z
updated_at: 2026-09-20T16:47:53Z
parent: folio-assistant-1xhc
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
(`https://litlfred.github.io/folio-assistant/cat-bootstrap/ns#`), so the vocabulary
namespace was never at risk.

## Not doing without the owner deciding

Whether a preview should mint its own `@id` for all 1244 nodes at all. It may
well be correct — a preview's graph genuinely differs in content, and an unstable
id for an unstable artefact is honest. The clearly *wrong* alternative is a
preview claiming the published `@id`s, since two documents would then assert
different facts about one node. Left alone.

## Done when

- [x] `staging.json` emitted per preview, carrying branch, sha, built, PR, run
      URL — and `newPages`, which the bean did not anticipate. See below.
- [x] The banner rendered from it at load time, so its markup is constant
      across previews AND across rebuilds of one preview. **Pinned by byte
      comparison** (`staging-banner-constant.test.ts`) rather than by
      inspection; the client half is pinned in a real browser
      (`staging-banner.e2e.ts`). **Still wants the person's look at a rendered
      preview** — continual-progress is explicit that a rendered artefact
      cannot be assessed from a description of it, and a byte-equality test is
      a description.
- [ ] `docs-ui.js` derives the baseurl at runtime. **Not done — deliberately.**
- [ ] Presentational hrefs emitted document-relative. **Not done — deliberately.**
- [ ] Re-measure STAGING and compare against the ~77 MB projection.
      **Cannot be done from a checkout**: it needs previews deployed from the
      new code. The projection is NOT claimed until then.
- [ ] `STAGING_WARN_BYTES` revisited with its floor restated, once the real
      number is known. Blocked on the row above.

## Risks

- Touches the docs build and the language switcher, with ~20 branches live in
  `docs/` on 2026-09-19 — coordinate rather than land blind.
- The banner exists so a reviewer **cannot** mistake staged content for the
  published site. A client-rendered banner must not be defeatable by a failed
  fetch: if `staging.json` cannot be read, the page must still say it is a
  preview. **"Could not determine" is never rendered as "this is the real
  site"** — the same third-state rule the rest of this repository runs on, and
  here the failure mode is a reviewer approving the wrong artefact.


---

*2026-09-20* — **Cause 1 landed. Causes 2 and 3 did not, on purpose.**

## What shipped

`cat-harness/scripts/staging-banner.ts` replaces the bash banner in
`feature-staging.yml`. It writes the build's facts once to `staging.json` at
the preview root and injects a fragment that **takes no argument**; the
browser derives its preview root from `location.pathname`, fetches the JSON
and fills the banner in — the client-derived pattern `head_custom.html`
already uses for the sidebar QR, as this bean proposed.

## The one thing that could have sunk it, checked first

The compare link was the risk: it is the single genuinely per-page fragment,
with three states (present on main → deep link; absent → site root and SAY the
page is new; publish ref unread → site root, neutral). It looked like
build-time per-page data, and if it were, the fragment could not be constant
and the saving would collapse.

It is not. The client knows its own path; the only thing it cannot compute is
**which pages main has** — so `staging.json` carries `newPages`, the pages
with NO counterpart, which is the **short** list rather than the long one.
Membership is a client-side check. That field is not in this bean's proposal
and is the one design decision the bean did not already contain.

## How it is verified, and why not by looking at it

`staging-banner-constant.test.ts` (16 tests) runs **two builds with different
SHA, timestamp and PR and compares the emitted HTML byte for byte**. That is
the bean's actual claim — a test asserting the markup contains some string
would pass just as happily with the SHA still in it. Beside it, a positive
control: `staging.json` must still DIFFER between those runs, or the facts
went nowhere and the banner is constant because it is empty.

`staging-banner.e2e.ts` (9 tests) runs the client half in Chromium, because a
unit test cannot: it only runs with a `location.pathname` under `STAGING/` and
a JSON to fetch. All three states are asserted first-class — fetched, 404, and
not-served-from-a-preview-path — along with the sidebar offset (filling the
banner in is a **third** moment its height changes, which the build-time
version never had) and a branch name carrying an `onerror` payload.

**Ratcheted both directions.** Reintroducing a build fact into the page fails
2 unit tests. Degrading the failed-fetch path to silence fails the e2e — and
initially did **not** fail the unit test, because `toContain` over the whole
fragment matched the *other* unavailability message. Found by ratcheting, not
by review; that test is now scoped to the `catch` body. A test that cannot
fail is this repository's recurring defect and it was one keystroke from
shipping again here.

## The two rules this bean set, and where they now live

*"A client-rendered banner must not be defeatable by a failed fetch."* The
static markup carries "FEATURE BRANCH" before any fetch happens and the fetch
only ever ADDS detail, so the degraded state announces the preview and says
the detail is gone.

New, and not in this bean: **values from the JSON go in as `textContent`,
never as markup.** Git ref names may contain `<`, `>` and `"` — they are not
in git's forbidden set, which stops at space, `~`, `^`, `:`, `?`, `*`, `[`,
`\` and the control characters. The bash banner interpolated `$BRANCH` into
an HTML string, so a branch name was markup; the client builds nodes.

## What is NOT fixed, and the honest accounting

Causes **2** and **3** are untouched: `relative_url` still prepends the
`baseurl` to ~235 hrefs per page, and the `fa-translation-index` island still
publishes `site.baseurl` to JavaScript. This bean already establishes they are
**one** change — document-relative hrefs break the language switcher, which
rebuilds them from the baseurl — and its own Risks section says ~20 branches
were live in `docs/`. Splitting them off was the cut with the best
risk-to-value ratio, not a stopping point reached by running out of road.

So: pages still differ **between** previews by slug. They no longer differ
**across rebuilds of one preview**, which is the *unbounded* half — the reason
"the history grows even when the preview count does not".

**The ~77 MB projection is not claimed.** It needs previews deployed from this
code, which a checkout cannot produce. This bean's own words: *"A projection
that was not checked is a guess."* Two Done-when rows stay open on it.

## Two drift hazards found in passing, one fixed

`skills/folio-core/feature-staging.md` described a **"yellow staging
banner"** — stale since the contrast fix that replaced `#d946ef` (3.46:1
against its own white text, failing AA) with `#4F6F52` (5.63:1). Fixed, with
the measurement, so the next editor does not restore a colour for looking
right.

Not fixed: `cat-harness/test/sidebar-panels.e2e.ts:62-63` carries its **own
hand-copied** banner and offset script. It is a theme-structure harness rather
than a banner test, so it is not wrong today — but it is the shape `bqrg`
measured, where six copies of one function had three broken and nothing said
so. Left alone rather than changed blind, and recorded here so it is a known
copy rather than a forgotten one.
