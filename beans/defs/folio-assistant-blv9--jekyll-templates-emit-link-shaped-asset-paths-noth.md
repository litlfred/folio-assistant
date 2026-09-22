---
# folio-assistant-blv9
title: Jekyll templates emit link-shaped asset paths nothing checks resolve
status: completed
type: task
priority: normal
created_at: 2026-09-19T07:06:43Z
updated_at: 2026-09-22T06:30:00Z
parent: folio-assistant-o3xy
---


_2026-09-19T07:07:04Z_ — FOURTH instance of the same defect class in this repo: a link-shaped value
that does not dereference, found each time by a human or an agent asking
whether a self-URL resolves rather than by a test. The prior three: the
`/kg/` literal in `toolTypeIri` (would have 404'd 95 published refs), the
`instructions` field on a Skill node (repo-relative path, not in `@context`),
and the 41 terms under `https://litlfred.github.io/folio-assistant/ns#` that
nothing serves. This one is a fifth SHAPE of the same class (a Jekyll
template, not a KG document), found investigating owner reports of a 404 on
the landing page (`landing-laptop.webp`) and a wrong icon rendered instead of
the requested one.

MEASURED 2026-09-19: swept `docs/_includes/` (no local `docs/_layouts/`
exists) for raw `.src`/asset-path interpolations missing `| relative_url`.
Found **3**, all in `docs/_includes/landing.html` (`card.src`, `mobile.src`,
`backdrop.src`) — every other asset path in the tree (`head_custom.html`,
`title.html`) already carried the filter, which is what let the landing art
404 while the sidebar icon rendered fine on the same page. Root cause:
`docs/_config.yml` sets `baseurl: "/folio-assistant"` (a PROJECT Pages site),
`scripts/sync-docs-harness.ts`'s `siteRelative()` deliberately writes a
site-root-absolute path into `docs/_data/harness.json` (correct — the data
file has to stay baseurl-agnostic for a downstream instance at a different
baseurl), and three of the four places that read it forgot to convert that
back to a site-relative URL at render time. Fixed in PR #345 (commits
`a110cf786` and one adding a favicon).

FOLDED IN rather than a separate bean: while fixing this, found a second
instance of a DIFFERENT but related gap in the same file — `cat-harness.json`
declares `role: "browser-icon"` on an image (`mark-small`) and nothing in the
repo ever consumed that role: there was no favicon (`rel="icon"`) anywhere on
the site at all. Same shared root as the link-shaped-value problem: a
declaration exists, nothing reads it, and nothing notices. Also found that
`imagesForRole()` (`schemas/kg-node.ts:207`) requires an image's `layout`
field to match anything, which neither `mark` nor `mark-small` carries — so
calling it for a `browser-icon` lookup returns an empty map silently, a THIRD
flavor of the same defect (a resolver path that looks wired but is not).
Folded rather than split because all three are one finding under
inspection: "declared but unconsumed" and "declared but wrong-scoped" are the
same failure mode as "declared but unresolvable" — a reader (a template, a
JSON-LD processor, a resolver function) that assumes a declaration is honored
without a check that verifies it.

WHAT A CHECK WOULD LOOK LIKE: `readme_audit` / `content/pipeline/readme-links.ts`
checks README links against a real `git ls-tree` of the target ref, but
nothing analogous runs over the Jekyll templates under `docs/_includes/` (or
a future `docs/_layouts/`). A gate would: (1) parse each `.html` template
under `docs/_includes/` for Liquid interpolations feeding `src=`, `srcset=`,
or `href=` attributes; (2) flag any that resolve to a site-root-absolute
path (starts with `/`) without a `| relative_url` (or `| absolute_url`)
filter in the same interpolation; (3) separately, for every `role` declared
on an `images[]` entry in `cat-harness.json`, confirm at least one consumer
(a template `include`, a script) actually reads images filtered by that
role — a role with zero consumers is exactly the `dh4f` defect shape (a
declared-but-unread directory) applied to an image role instead of a
directory. Candidate home: `scripts/check-harness-dirs.ts` sibling, or a new
`scripts/check-docs-templates.ts` gated the same way
`docs:harness:check` is.

Verified this session by rendering (not just reading): `bundle install` +
local `jekyll build` (remote_theme swapped for the locally installed
just-the-docs gem — this sandbox's proxy 403s codeload.github.com — override
config kept in scratchpad only, never committed) confirmed the emitted
`src`/`srcset`/`<link rel="icon">` all carry `/folio-assistant/...` after the
fix.

_2026-09-19T07:19:54Z_ — SIXTH AND SEVENTH INSTANCES OF THIS BEAN'S OWN DEFECT CLASS, both found 2026-09-19 while fixing the sidebar mark the owner reported as wrong, and both fixed in the same branch. (6) imagesForRole() in schemas/kg-node.ts filters on `i.role === role && i.layout !== undefined`. That is correct for landing backdrops, which exist once per viewport and are keyed by layout, and structurally WRONG for a mark, which exists once and declares no layout. So asking it for role 'browser-icon' returned an EMPTY MAP and said nothing about why — which is exactly why cat-harness.json has declared mark-small with role 'browser-icon' since the marks were written and nothing has ever consumed it: the site emitted no favicon at all, and the one function that could have found the image could not. Fixed by adding imageForRole() as a SIBLING rather than by loosening imagesForRole, because the two answer genuinely different questions and merging them would hide the layout contract the landing path depends on. (7) docs/assets/css/docs-ui.css carried a comment asserting 'The mark uses currentColor for its ring and inner a, so it follows the sidebar's text colour in either scheme; only its ears carry a fixed sage.' Measured against EVERY commit that has ever touched docs/assets/img/icons/ — e5c171029, 2d1b22905, c8c58f28b — currentColor appears ZERO times in either mark in all three. It could not have been true anyway: title.html serves the mark as an <img>, and currentColor inside an externally-referenced SVG resolves against that SVG's own root, not the page. A comment is a declaration too, and this one described behaviour the asset never had. WHAT THESE TWO ADD TO THE CHECK THIS BEAN SKETCHES: the original sketch was 'every declared image role has at least one real consumer'. That would have caught (6) only by accident — the role HAD no consumer, but the reason was a lookup that could not reach it, not an absent caller. So the check wants two halves: every declared role is CONSUMED, and every lookup used to consume one can actually MATCH what is declared (a role whose images carry no layout, queried through a layout-keyed function, is unreachable by construction). (7) is a different shape again and probably not mechanically checkable — a prose claim about an asset — which is worth saying out loud rather than pretending the gate will cover it. SEPARATELY, THE ACTUAL BUG, recorded because the diagnosis is counter-intuitive and a later reader will otherwise re-derive it wrong: the sidebar mark rendered as a sage disc with a pale smudge. The ears CROSS the ring by design (cat-mark.svg's own description says so; an ear tip is 42.3 units from the ring centre, inside the 36.8-48.8 band), so nothing was accidentally overlapping and shrinking the cat would have been the wrong fix. The only separator is the white halo around the cat outline, at stroke-width 3 = 0.6 px at the sidebar's 24 px. Sub-pixel, so the two sage shapes fuse. cat-mark-small.svg now carries halo 8 (1.6 px) and ring 14 (2.8 px). 'Simplified for small sizes', which that file's title always claimed, meant THICKER, not smaller.

---

## 2026-09-22 — the three are long fixed; the GATE is what this bean was for

Re-measured on `main` before building anything. The three cited instances are
gone: `card.src` and `mobile.src` carry `| relative_url`, and `backdrop.src`
no longer exists as an interpolation. A sweep of every `_includes`/`_layouts`
in every instance found **no** unfiltered site-root asset path remaining.

So the remaining value was the gate this bean specified, and it is now
`bun run check:docs-templates` — **101 gates**, registered in
`code-quality-gates.yml` beside `check:declaration-claims`.

### The bean's rule is only half decidable, and finding that out was the work

It said: *flag any that resolve to a site-root-absolute path without a
filter*. **That is decidable for a LITERAL and not for a variable**, and the
corpus contains both:

| | |
|---|---|
| `'/assets/js/docs-ui.js'` | literal, site-root — the filter is REQUIRED |
| `st.art.card.src` | variable, site-root in practice — invisible to the template |
| `st.viewHref` | variable holding `https://…/blob/…` — the filter would BREAK it |

**My own first sweep produced the last row as a false positive**, which is the
evidence that a naive rule is wrong rather than merely imprecise:
`viewHref`/`editHref` come from `schemas/cat-harness.ts` as
`${repoUrl}/blob/${branch}/${path}`. A check demanding a filter everywhere
would report two working links as defects, and the obvious fix would 404 both.

So the gate has **three states**: a literal is judged, a variable is
**DECLINED** and listed, and declined never reaches the failing set. The same
third state `check:partition` names in its own output, for the same reason —
an unexaminable case and an examined-clean one must not look alike.

On this repository: 6 files, 21 interpolations, 0 unresolved, 3 declined.

### Falsified both ways

Planted a site-root literal with the filter removed, on an **asserted**
anchor: caught, exit 1, and the 3 declined stayed declined. Restored: exit 0,
template byte-identical. Ten tests, six of which pin the declined half.

### Caught by another gate, which is the system working

The new script fell through every `check:partition` rule on its first run —
an unassigned module is not a clean result. Assigned to **harness** with the
reason recorded: its subject is this repository's own templates and baseurl,
it reads no folio content, and it imports nothing but `fs` and `path`.

## NOT done — part (3), and it is a different subject

The bean also asks for a check that every `role` declared on an `images[]`
entry has at least one consumer. That is *declared but unread* — the `dh4f`
shape — not *a path that will not resolve*. Different question, different
corpus, and folding it in would have made one gate answer two things.

**Split out as `folio-assistant-5yrl`** rather than left open here, so this
bean can close with nothing unchecked and the remaining question keeps a home
of its own. That bean carries the finding that makes the naive version wrong:
the favicon role had no consumer, but the *reason* was a layout-keyed lookup
that could not match a layout-less image — so the check needs two halves, and
half one alone would have caught it only by accident.

## Summary of Changes

- `cat-harness/scripts/check-docs-templates.ts` — new gate, three states.
- `cat-harness/scripts/tests/docs-templates.test.ts` — 10 tests.
- `package.json`, `code-quality-gates.yml` — registered; 100 → 101 gates.
- `scripts/partition/instance-rules.ts` — the new module assigned to harness.
- No template changed: the three cited defects were already fixed.
- Part (3) split out as `folio-assistant-5yrl` — this bean closes with
  nothing unchecked, and the image-role question keeps its own home.
