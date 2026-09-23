---
# folio-assistant-g4dv
title: 'STAGING: ''compare with main'' must deep-link to the same page, not the site root (issue #248)'
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:04:31Z
updated_at: 2026-09-20T14:37:12Z
parent: folio-assistant-o3xy
---

## The ask

[#248](https://github.com/litlfred/folio-assistant/issues/248), owner, 2026-09-18T16:32:12Z.

On a staging page such as

    .../STAGING/claude-festive-galileo-s7ibx0/agentic-harness.html

the banner renders

    PR #246 · [compare with main ↗](https://litlfred.github.io/folio-assistant/) · [build log](…)

The compare link goes to the **site root**. It should go to the same page on
main:

    https://litlfred.github.io/folio-assistant/agentic-harness.html

## Why it matters more than a one-character fix suggests

The link's entire purpose is A/B comparison of a change. Landing the reader on
the home page means they have to re-navigate to the page they were already
looking at, from memory, to do the comparison the link exists to enable — and
the deeper the page, the less likely they do it at all. It is the same class of
defect as the README PDF cells that 404'd: a link composed by convention and
checked against nothing.

## The part that needs deciding, not just coding

**A staging page may have no counterpart on main** — it is a new page the
branch adds. That is the third state, and it must not render as a link to a
404. Options, in the order I would argue them:

1. Resolve the target against the publish ref (`git ls-tree` of `gh-pages`) at
   generation time, exactly as `readme-sections.ts` resolves PDF cells, and
   fall back to the root link with different text ("main ↗ (page is new)")
   when the counterpart does not exist.
2. Always deep-link and accept the occasional 404.
3. Resolve client-side with a HEAD request and rewrite.

(1) matches the house rule and is what I would recommend; it costs a lookup at
generation time. (2) is cheap and publishes a broken link. (3) moves the
failure into the browser and does not work offline.

## Where

The staging banner is emitted by the staging deploy path — bean `lx2s`
(feature-branch staging under gh-pages, issue #215) owns that machinery, so
this is a follow-on to it rather than an independent change. Locate the banner
template before estimating; the page's own path relative to the staging root is
what has to be carried into the link, and whether the generator knows it at
that point is unverified.

## Not verified

Nothing here has been measured — the banner source has not been located, and
the claim that the generator knows the page's own relative path is an
assumption, not a finding.

---

## 2026-09-18 — still open after #260; banner located, assumption resolved

PR #260 ("deep staging links in turn reports; banner links back to its
issue") merged to `main` at 17:44. It is **adjacent but not this**: it added
deep links to agent *turn reports* and an *issue* link to the banner. The
compare link is untouched.

Verified by reading the merged workflow rather than the PR description:

```
.github/workflows/feature-staging.yml:177
  MAIN_URL="https://${owner}.github.io/${repo}/"

.github/workflows/feature-staging.yml:196
  <a href="${MAIN_URL}">compare with main ↗</a>
```

Still a bare site root.

**A second site has the same defect, and it was not in the ask.** Line 237
is the comment the bot posts on every staging PR:

```
> Compare with [main site](https://${owner}.github.io/${repo}/)
```

Both need fixing, or the PR comment keeps sending reviewers to the root
after the banner stops doing so.

## The "Not verified" above is now resolved

The banner is injected per-page while walking the built site, so the page's
own relative path **is** in hand at injection time. Option (1) — resolve the
target against the publish ref, fall back to differently-worded text when
the page is new — is implementable rather than speculative.

Still unclaimed, still not started.

_2026-09-19T00:41:01Z_ — Verified RESOLVED, 2026-09-19 on main at 17dc1e6. feature-staging.yml:314 renders the compare link as ${MAIN_SITE}/${REL} — the same page on main, not the site root. The third state this bean said 'needs deciding, not just coding' is handled and was resolved as its own option 1: when the page has no counterpart on main, line 316 renders 'main ↗ (new page)' against the root instead of a link to a 404, and counts it into NEW_PAGES. NOT closing it — not my bean to resolve.


## 2026-09-20 — closed on re-measurement (`0pes`)

Re-derived. `feature-staging.yml:439` renders the compare link as
`${MAIN_SITE}/${REL}` — the same page on main, not the site root.

The third state this bean said *"needs deciding, not just coding"* is handled
and is the reason it closes: line 441 renders `main ↗ (new page)` against the
root when a page has no counterpart on main, rather than linking to a 404, and
line 442 counts it into `NEW_PAGES`, which line 451 reports. A page that does
not exist on main and a page that does are told apart, rather than both being
offered a link.
