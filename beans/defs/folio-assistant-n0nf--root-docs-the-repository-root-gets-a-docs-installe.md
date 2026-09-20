---
# folio-assistant-n0nf
title: 'ROOT DOCS: the repository root gets a docs/ installed by cat-harness, the way a dependent gets uploads/ and library/'
status: todo
type: feature
priority: high
created_at: 2026-09-20T19:01:17Z
updated_at: 2026-09-20T19:01:17Z
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

## Done when

- [ ] Copy, link or compose is chosen
- [ ] `docs` is declared so a dependent instance materialises its own
- [ ] A newly initiated instance gets a `docs/` without being told to
- [ ] The site builds from the root's `docs/`
- [ ] A test asserts a dependent gets one, falsified by flipping the
      declaration back — `wwi6`'s tests are the model, and they were
      falsified before they were trusted

Related: `o7eq` (the URL space this completes), `wwi6` (the same mechanism for
uploads/ and library/), `x4a6` (declaring `docs/` as the renderable graph),
`ohx6` (cat-harness's own folio/), `qmjh` (a ContentDirectory saying whether
dependents reproduce it).
