---
# folio-assistant-blv9
title: 'Jekyll templates emit link-shaped asset paths nothing checks resolve'
status: todo
type: task
priority: normal
created_at: 2026-09-19T07:06:43Z
updated_at: 2026-09-19T07:07:04Z
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
