---
# folio-assistant-n0nf
title: 'ROOT DOCS: the repository root gets a docs/ installed by cat-harness, the way a dependent gets uploads/ and library/'
status: completed
type: feature
priority: high
created_at: 2026-09-20T19:01:17Z
updated_at: 2026-09-21T10:10:00Z
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

### CORRECTION, same session — the blast radius was measured, and it reverses this

**Option 1 was recommended before it was measured. Measured, it is the worse
one.** A stand-in for the root — its real `harness.json` plus the dependency
edge Option 1 would add — materialises:

```
root today (no edge) : beans, todos, uploads
root under Option 1  : qa, uploads, library, voices, translation-sources, folio, docs

WOULD GAIN: qa, library, voices, translation-sources, folio, docs
  wanted   : docs
  unwanted : qa, library, voices, translation-sources, folio
```

**Six gained, one wanted.** And two of the five unwanted are the ones
`AGENTS.md` opens by forbidding — *"folio-assistant is the platform, not the
content"* — so Option 1 would create `folio/` and `library/` at the platform
root. That is precisely the junk the `dependents` field exists to prevent,
arriving through the mechanism meant to be tidy.

**Fixture limit, stated rather than glossed:** the stand-in loses `beans` and
`todos` in that run, which is an artefact of a temp directory not being the
real repository — those are repository-scoped and resolve against the actual
root. It does not affect the six gained, which is what the comparison is about.

**And the two statements were never actually in conflict.** *"only uploads/ on
this repo's root b/c acting as if it was intialized"* describes what an
INITIALIZED INSTANCE gets — and at the time it was written, that set was
`uploads/`. The compose ruling adds `docs/` to that set, and slice 1 has now
made `docs` a `reproduce` directory, which is the schema's own words for *part
of the shape a folio has*. So the root should get `docs/` for exactly the
reason it already gets `uploads/`: it is an initialized instance, and that is
what one has.

**Revised recommendation: Option 2** — the root declares `docs` itself, one
line, alongside its `uploads` entry and for the same stated reason. Not a
contradiction of the root's comment but the same rule over a set the ruling
changed. Still the owner's to confirm, because it is their sentence being
re-read.

### CORRECTION — slice 2 is NOT independent of the root ruling

PR #643 said the site-build composition "is independent and I can take it
next". **Checked, and it is not.** Measured on the tree as it stands:

| instance | declares a `docs` graph | how it reaches the site |
|---|---|---|
| `cat-harness` | yes (`docs/`, `reproduce`) | it IS the site root — Jekyll's `source:` |
| `who-iris` | yes (`who-iris-docs`) | MOUNTED at a subpath by `mount-instance-docs` |
| **the root** | **no** | — |

The compose-vs-mount rule that looked missing turns out to be already answered:
`mount-instance-docs --built <instance>` names the one whose docs Jekyll built,
and skips it because *"it is the root of the site"*. Everything else mounts.
So composing at the site root means exactly **the root's `docs/` over the
built instance's**, and there is no third case to invent.

**But the root declares no `docs` graph**, so a composer built today would have
an EMPTY overlay input and stay that way until Option 2 is ruled. That is a
mechanism with no input — the orphan shape this repository has paid for before
(`resolveSkillDirs` "sat with no caller"), and building it would look like
progress while changing nothing that happens.

So slice 2 waits on the same one-line ruling. Nothing else does.

## RULED IN FULL, 2026-09-21 — three parts, and it is more than the question asked

Owner, answering "should the repository root declare its own `docs/`?":

> *"harness can have docs/ which then get listed under
> `cat-harness/docs/<harness>`, there is also docs/ dir in repo root managed by
> cat-harness. other harness augment or overlay ontop of that (content and
> behviors)"*

Three statements, and only the second answers the question that was asked:

| # | the ruling | state |
|---|---|---|
| 1 | a harness has its own `docs/`, **listed under `cat-harness/docs/<harness>`** | **already works** — `mount-instance-docs.ts`, and the layout exists (`cat-harness/docs/cat-harness/…`) |
| 2 | **there IS a `docs/` at the repo root, MANAGED BY cat-harness** | to build |
| 3 | other harnesses **augment or overlay on top of that** — *"content and behaviors"* | to build |

### "managed by cat-harness" is a mechanism this repository already has

It is not a loose phrase. `scope: "repository"` means a declared path resolves
against the REPOSITORY root rather than the declaring instance's
(`cat-harness.ts:2347`), and `bootstrap` already declares
`bootstrap/skills/` that way. So *"a `docs/` dir in repo root managed by
cat-harness"* reads directly as: **cat-harness declares it, repository-scoped.**

### But it CANNOT be the existing `docs` entry, and that is measured

A repository-scoped entry is filtered out for dependencies —
`cat-harness.ts:3261` and `:3507` both skip `dir.scope === "repository"` unless
`link.own`. So re-scoping the existing `docs` entry would **undo slice 1**: a
dependent would stop materialising its own. The two are different directories
answering different questions, so they want **two entries with different ids**,
which is already the convention here — `who-iris` declares its docs graph as
`who-iris-docs`, not `docs`.

### The sequencing hazard, named before it is walked into

Part 2 alone creates a **declared, empty directory that nothing reads** — the
`dh4f` shape, and the same trap `resolveSkillDirs` fell into. Part 3 is what
gives it a consumer. So they ship together or not at all, and part 3 touches
`docs-site.yml`, which is the live publish path.

**The safety property that makes that acceptable**: composing an EMPTY overlay
must produce byte-identical output to today's site. If that holds, the rewiring
is provably a no-op until somebody authors an override, and the risk is
bounded. That is the gate to build against, not a nicety.

### Still unstated, and NOT invented here

*"content and behaviors"* — a page overlay is clear. A **behaviour** overlay is
not: Jekyll layouts and includes, `_data`, client-side JS, and the just-the-docs
config are all candidates and they compose differently from pages. Recorded as
an open question rather than guessed, because picking one and shipping it would
make the answer look settled.

## Done when

- [x] Copy, link or compose is chosen — **COMPOSE (overlay)**, owner, 2026-09-21
- [x] `docs` is declared so a dependent instance materialises its own —
      **2026-09-21**, `dependents: "reproduce"`, measured 6 → 7 on a fixture
- [x] A newly initiated instance gets a `docs/` without being told to —
      same change; `init-folio` calls `materialiseDeclaredDirectories`
- [x] The site builds from the COMPOSED tree — root overlay over
      `cat-harness/docs/`, which stays where it is
      — **done: docs-site.yml runs compose-docs.ts and builds from `source: ./_docs`**
- [x] The build can say WHICH LAYER supplied any given page, so an override
      is distinguishable from the only copy
      — **done: `suppliedBy`, `overrides` (both layers named), `added` and `merged` (changed keys named)**
- [x] A test asserts a dependent gets one, falsified by flipping the
      declaration back — **done**: flipping the word back turns 2 red, and
      the contrast (`schemas`/`tools` stay out) is asserted too
- [x] **THE ROOT** — ruled 2026-09-21: it exists, managed by cat-harness
- [x] A repository-scoped `docs` entry, with its own id so slice 1's
      instance-scoped one is untouched
      — **done: `root-docs`, `scope: "repository"`, slice 1's `docs` untouched**
- [x] The site composes the root's `docs/` over the built instance's, with
      an EMPTY overlay proven byte-identical to today's site
      — **done: pinned against the REAL tree by compose-docs.test.ts; re-verified on main at ce71f60 — 439 files, no overrides, `_config.yml` byte-identical**
- [x] What a **behaviour** overlay is — layouts, includes, `_data`, JS,
      config — is stated rather than guessed

Related: `o7eq` (the URL space this completes), `wwi6` (the same mechanism for
uploads/ and library/), `x4a6` (declaring `docs/` as the renderable graph),
`ohx6` (cat-harness's own folio/), `qmjh` (a ContentDirectory saying whether
dependents reproduce it).

## Behaviours settled 2026-09-21 — `_config.yml` merges, overlay keys win

The compose ruling said instances overlay *"content and behaviors"*. Content
shipped first; behaviours were left as a refusal, because two Jekyll configs
want merging and the precedence had not been chosen. That refusal had a real
cost: a downstream harness could overlay pages but could not change ONE Jekyll
setting — no theme, no nav, no title.

Owner's ruling, asked as three options and answered "2":

> **Overlay keys win. Objects merge recursively. Lists REPLACE rather than
> concatenate.**

Lists replacing is the clause worth recording, because concatenation is the
more common default and is wrong here for the same reason the file overlay is
last-wins: an overlay that wanted three nav entries and inherited seven has no
way to remove the four it did not ask for. One direction everywhere.

**The allowlist that was NOT chosen** matters as much. Merging only declared
keys (`title`, `nav`, colour tokens) is safer per-key and is exactly the `6tkl`
shape — a hardcoded list that goes stale silently, which this repository has
paid for three times.

### The constraint that shaped the implementation

**A YAML round trip is not byte-preserving** — it strips comments and may
reorder keys. Merging unconditionally would therefore rewrite the published
`_config.yml` on a tree whose overlay carries none, breaking the byte-identity
property that licenses `docs-site.yml` pointing `source:` at the composed tree
at all. So the merge fires ONLY when an overlay supplies a config AND a lower
layer already did; every other case copies bytes untouched.

Verified on the real tree, not only on fixtures:

    composed 437 file(s) from 2 layer(s)
    no overrides — the composed tree is the base layer
    cat-harness/docs/_config.yml vs composed _config.yml   IDENTICAL

...and with a temporary overlay config in place, end to end:

    MERGED  _config.yml — docs <- root-docs (title, aux_links)
    title overlaid; description, remote_theme, baseurl and 25 further
    lines survived from the base

The report names the CHANGED KEYS rather than counting files, the same `dh4f`
discipline the override path already follows: "merged 1 file" leaves a reader
unable to tell which settings moved, which is the whole question a merged
configuration raises.


      — **done 2026-09-21: owner ruled MERGE for `_config.yml` — overlay keys win, objects recurse, lists REPLACE**

## Summary of Changes

Merged in #674 (`ce71f60`). Every box is now ticked.

The root `docs/` exists, is declared as a repository-scoped entry (`root-docs`)
distinct from the instance-scoped `docs`, and the site builds from the COMPOSED
tree — `docs-site.yml` runs `compose-docs.ts` and points `source:` at `./_docs`.
The composer names both layers on every override and the changed keys on every
merge, so an override is never indistinguishable from the only copy.

**The behaviours question, which was the last one open, is settled.** The owner
ruled MERGE for `_config.yml` — overlay keys win, objects merge recursively,
lists REPLACE rather than concatenate. Lists replacing is the clause worth
keeping in view: concatenation is the more common default and would leave an
overlay no way to remove an inherited entry.

**The safety property held throughout, and is what licensed touching the live
publish path at all**: an empty overlay composes byte-identically to the base.
Pinned against the REAL tree rather than a fixture, and re-verified on `main`
after the merge — 439 files, no overrides, `_config.yml` byte-identical.

The merge is deliberately CONDITIONAL on the overlay supplying a config,
because a YAML round trip strips comments and may reorder keys; merging
unconditionally would have rewritten the published config on a tree whose
overlay carries none, breaking exactly that property.
