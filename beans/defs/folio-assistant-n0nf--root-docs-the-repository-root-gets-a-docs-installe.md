---
# folio-assistant-n0nf
title: 'ROOT DOCS: the repository root gets a docs/ installed by cat-harness, the way a dependent gets uploads/ and library/'
status: in-progress
type: feature
priority: high
created_at: 2026-09-20T19:01:17Z
updated_at: 2026-09-21T05:18:07Z
parent: folio-assistant-yj32
---

Owner, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus):

> root should have docs/ installed by cat-harness.

This settles the last open question on `o7eq` — whether the ROOT instance
gets its own segment. It does not need one, because its `docs/` is not its
own: cat-harness installs it, the same way a dependent folio gets its
`uploads/` and `library/`.

## Measured, 2026-09-20 on main at `e7f0b4d6a1`

| | |
|---|---|
| root `docs/` | **does not exist** |
| the site's Jekyll source | `./cat-harness/docs` (`docs-site.yml:136`) |
| what declares it | `cat-harness/harness.json`, entry `docs` → `docs/`, `graphs: ["docs"]` |
| and how dependents see it | **`dependents: "skip"`** |

`dependents: "skip"` is exactly what prevents this today: it says a dependent
instance does NOT reproduce this directory. `wwi6` pins the opposite
behaviour for `uploads/` and `library/` — a dependent materialises its own,
inheriting an id and a relative path from what the harness declares — and
that is the machinery this wants, pointed at `docs`.

## The shape of the change

1. `docs` becomes a directory a dependent **reproduces** rather than skips,
   so `materialiseDeclaredDirectories` creates one in every instance root,
   the repository root included.
2. The site builds from the ROOT's `docs/` rather than from
   `cat-harness/docs`. That is the load-bearing half and the risky one:
   `docs-site.yml` names the source in one place, but `siteDirFor` and the
   241 files under `cat-harness/docs/` are what actually move.
3. What "installed by" means has to be decided: copied at initiation,
   symlinked, or composed at build time. They differ in what a reader of the
   repository sees and in whether an instance can EDIT its own docs.

## Open, and worth settling before building

- **Copy, link, or compose?** A copy is editable and drifts; a link is not
  editable and cannot; a build-time composition is neither until it is built.
  `wwi6`'s answer for `uploads/` and `library/` is materialisation at
  initiation, and the same answer here means an instance may edit its docs
  and diverge from the harness's.
- **What happens to `cat-harness/docs/`?** It is either the SOURCE that is
  installed from, and stays, or it moves to the root and cat-harness stops
  having its own — and `ohx6` wants `cat-harness/folio/` to exist beside it,
  so the layer does keep renderable content of its own.
- **Does this change the published URL?** Under `o7eq` the root's docs are at
  `<baseurl>/` and cat-harness's at `<baseurl>/cat-harness/docs/…`. If the
  root's `docs/` is installed BY cat-harness, both exist and the same page
  may be reachable at two URLs. Which is canonical?

## RULED, 2026-09-21 — COMPOSE, and it makes the risky half cheap

Owner, asked with the three options and their costs: **compose — overlay.**

> The site build merges the platform's `docs/` with the instance's own
> overlay, deepest-dependency-first. An instance overrides one page without
> forking the rest.

**It is not a new mechanism, which is why it was recommended.**
`resolveSkillDirs` in `schemas/harness-config.ts` already computes exactly
this overlay for skills — deepest-dependency-first, an instance's package
shadowing its dependency's. The rule an agent learns once then applies twice
instead of twice differently.

### It answers the second question too, and reverses this bean's estimate

This bean called step 2 *"the load-bearing half and the risky one"* because
**241 files under `cat-harness/docs/`** would move. **Under compose they do
not move at all.** `cat-harness/docs/` STAYS and becomes the base layer; the
root's `docs/` starts effectively empty and holds only what the root adds or
overrides. So the answer to *"what happens to `cat-harness/docs/`?"* is
**it is the source that is composed from**, and the expensive half of this
bean evaporates rather than being paid for.

That also keeps `ohx6` unaffected: cat-harness keeps renderable content of
its own, which is what that bean wants beside `cat-harness/folio/`.

### And it narrows the third

*"Does this change the published URL?"* — under compose the built site serves
each page **once**, at `<baseurl>/<path>`. `cat-harness/docs/<page>` is a
SOURCE location, not a published one, so the same page is not reachable at
two URLs by construction. What still needs deciding is whether the platform's
docs are ALSO published separately under `o7eq`'s per-layer segment; that is
`o7eq`'s question rather than this bean's, and it is no longer blocking here.

### What compose costs, stated rather than skipped

The site build gains a resolution step, and **"which file won" has to be
reportable** — an overlay that silently shadows a page is the `dh4f` shape
again: a consumer reads the composed tree, sees one file, and cannot tell an
override from the only copy. The build must be able to say, for any page,
which layer supplied it. That is a requirement of this work, not a nicety.

## SLICE 1, 2026-09-21 — a dependent materialises its own `docs/`

One JSON word: `cat-harness/harness.json`'s `docs` entry goes
`dependents: "skip"` → `"reproduce"`. Measured on a real dependent fixture
rather than reasoned about:

```
before:  qa, uploads, library, voices, translation-sources, folio          (6)
after:   qa, uploads, library, voices, translation-sources, folio, docs    (7)
```

`declaredBy=cat-harness`, `absPath` inside the dependent's own root.

**The old rationale is kept, not deleted, and it was not wrong.** It argued
`skip` on the grounds that a dependent should INHERIT THE PAGES rather than get
an empty directory to refill. Under compose it gets both — the pages still
reach it, and `reproduce` gives it the place to override one. This is the
second half of that argument arriving.

**The `dependents` doc's warning was checked, not waved past.** It says
defaulting to `reproduce` ships junk: twelve inherited directories, four of
them the platform's own, each empty with a committed keep marker. That warning
is about a DEFAULT, and the test it turns on is the one the schema states — is
this directory part of the SHAPE a folio has, or merely where THIS instance's
content lives? Before the ruling `docs/` was the second; after it a folio is
expected to author and override its own documentation, which makes it the
first, the same answer `uploads/` and `library/` get. They are `reproduce` and
also start empty.

**Falsified by flipping the word back**: 2 tests red, and the message names
what was there — `no "docs" among qa, uploads, library, voices,
translation-sources, folio`. The test also asserts the CONTRAST (`schemas` and
`tools` stay out), because asserting only that `docs` appears would pass just
as well against a build that inherited everything — which is the junk itself,
reading as success.

## OPEN FOR THE OWNER — the ROOT is not settled, and two statements disagree

Slice 1 deliberately does **not** give the repository root a `docs/`, because
two of the owner's own statements from 2026-09-20 pull opposite ways and it is
not this session's call which wins:

| where | what it says |
|---|---|
| this bean | *"root should have docs/ installed by cat-harness"* — and the bean adds that the root's docs *"is not its own: cat-harness installs it"* |
| root `harness.json` `_comment` | *"only uploads/ on this repo's root b/c acting as if it was intialized"* |

They are reconcilable — "installed by cat-harness" means INHERITED rather than
declared, so the root would still declare only `uploads/` — **but that reading
requires a dependency edge that does not exist.** Measured: the root's
declaration chain has **length 1**. It does not depend on `cat-harness`; there
is a `cat-harness.config.json` AT the root, which is the pre-split layout, so
the relation is "contains" rather than "depends on".

So the root gets `docs/` only if one of these happens, and each is a different
decision:

1. **The root declares a dependency on `cat-harness`** — then it inherits
   `docs/` like any other dependent, and "only uploads/ declared" stays literally
   true. This is what the bean's words describe. It also changes what else the
   root inherits, which is why it is not a one-line edit.
2. **The root declares `docs` itself** — one line, works today, and
   contradicts both "only uploads/" and "its docs/ is not its own".

Recommendation: **(1)**, because it is what "installed by cat-harness" means and
because (2) makes the root's declaration disagree with its own recorded reason.
But (1)'s blast radius is the rest of what a dependency edge pulls in, and that
wants measuring before it is proposed as a one-liner.

## Done when

- [x] Copy, link or compose is chosen — **COMPOSE (overlay)**, owner, 2026-09-21
- [x] `docs` is declared so a dependent instance materialises its own —
      **2026-09-21**, `dependents: "reproduce"`, measured 6 → 7 on a fixture
- [x] A newly initiated instance gets a `docs/` without being told to —
      same change; `init-folio` calls `materialiseDeclaredDirectories`
- [ ] The site builds from the COMPOSED tree — root overlay over
      `cat-harness/docs/`, which stays where it is
- [ ] The build can say WHICH LAYER supplied any given page, so an override
      is distinguishable from the only copy
- [x] A test asserts a dependent gets one, falsified by flipping the
      declaration back — **done**: flipping the word back turns 2 red, and
      the contrast (`schemas`/`tools` stay out) is asserted too
- [ ] **THE ROOT** — blocked on the two owner statements above, not on work

Related: `o7eq` (the URL space this completes), `wwi6` (the same mechanism for
uploads/ and library/), `x4a6` (declaring `docs/` as the renderable graph),
`ohx6` (cat-harness's own folio/), `qmjh` (a ContentDirectory saying whether
dependents reproduce it).
