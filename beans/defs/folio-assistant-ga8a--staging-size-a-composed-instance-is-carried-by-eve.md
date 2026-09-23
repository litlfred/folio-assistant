---
# folio-assistant-ga8a
title: 'STAGING SIZE: a composed instance is carried by every preview — smart-trust is 776.6 MB across 13, larger than the reference/ lever already pulled'
status: in-progress
type: bug
priority: high
created_at: 2026-09-23T13:30:49Z
updated_at: 2026-09-23T13:31:14Z
parent: folio-assistant-1xhc
---

`bun run health` reports `staging-preview-size` **critical** again. Measured on
`origin/gh-pages` 2026-09-23, not taken from the report: **13 previews, 2.10 GB**;
the whole published tree is **2.36 GB** against GitHub's 1 GB Pages limit.

Issue #843 / bean `tebu` cut `reference/` and `api/` from a preview whose branch
does not touch their sources. **That cut is working** — 3 of the 13 previews carry
the one-file stub, and `api/` is present in only 6 of 13. It is no longer the
biggest lever.

## Where the bytes are now — summed across all 13 previews

| subtree | total | share of 2.10 GB | carried by |
|---|---|---|---|
| **`smart-trust/`** | **776.6 MB** | **37%** | 13 of 13 |
| `reference/` | 464.7 MB | 22% | 10 of 13 |
| `who-iris/` | 94.1 MB | 4.5% | 13 of 13 |
| `library/` | 94.1 MB | 4.5% | 13 of 13 |
| `api/` | 44.6 MB | 2.1% | 6 of 13 |

`smart-trust/docs/` is **3.2 MB of markdown** in the repository and **111.6 MB of
HTML** in a preview, across 681 pages at ~164 KiB each. That is the identical
inflation `tebu` measured one directory over: just-the-docs inlines the whole
navigation into every page, and this directory contributes the most pages
carrying the least content.

## Why it is composed at all, and why nothing conditions it

`smart-trust/smart-trust.json` declares `docs/` with `composed: true` — the only
directory in the checkout that does. `compose-docs.ts` therefore copies it into
the Jekyll source and Jekyll builds it with the full theme. `who-iris/docs/` and
`library/` are *mounted* instead (finished HTML, no Jekyll), which is why they
cost 7.3 MB per preview rather than 111.6.

Nothing conditions the compose on what the branch touches. A branch that never
mentions `smart-trust/` still publishes a full themed copy of the IG.

## It does not deduplicate either

The `smart-trust` tree hash is **distinct in all 13 previews** — the staging
banner injects the slug into every page, as `feature-staging.yml` notes at the
point where it does it. So this is 776.6 MB against the **repository** budget as
well as the published one, unlike the dedup argument `tebu` correctly rejected
for a Pages threshold.

## The tension any fix must respect

The same one `tebu` names: a reviewer on a branch that changes the IG needs the
IG. So the cut is conditional on the branch's own file list, it falls through to
carrying everything on any doubt (no PR number, an unreadable API response), and
what it leaves behind is a stub that links to the published copy rather than a
404 — `pb04`.

## Not a list

The trim reads `composed: true` off the declarations, never a hardcoded
`smart-trust`. A hardcoded list is the `check:declared-assets` defect, whose own
doc comment describes being "fixed" last time by writing down a list of two while
the repository had grown to eight.

## Done when

- [ ] A preview composes an instance's `composed: true` directory only when the branch's diff touches that instance, leaving a stub that links to the published copy
- [ ] The instance list comes from the declarations, not from a literal
- [ ] Any doubt carries everything — no PR number, an unreadable file list, a failed API call
- [ ] The saving is measured on a real preview, not projected
- [ ] A test covers the carry decision, including the fall-through

Owner authorised the approach 2026-09-23, alongside labelling the two orphaned
`zod-4.6.5` previews for cleanup (201.2 MB, neither branch still on the remote).

Parent `1xhc`. Follow-on from `tebu` / [#843](https://github.com/litlfred/folio-assistant/issues/843).
