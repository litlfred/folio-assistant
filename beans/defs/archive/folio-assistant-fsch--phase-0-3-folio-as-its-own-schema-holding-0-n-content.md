---
# folio-assistant-fsch
title: Phase 0.3 — `folio` as its own schema holding 0..n Content instances (#223)
status: scrapped
type: task
priority: normal
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-19T01:06:27Z
---

From [issue #223 comment](https://github.com/litlfred/folio-assistant/issues/223#issuecomment-5726628913).

Today `folio.config.json` carries a single `contentType` and a single adapter,
so *a folio* and *a content instance* are the same object. Making a folio a
container of zero-or-more instances touches `adapterForKind`,
`content/pipeline/profile-check.ts`, the render path and the viewer.

**Do this before the `content/` → `folio/` rename** (bean `rnfl`): a rename
lands cleanly on a settled model; a settled model does not land cleanly on a
corpus mid-rename.

Gate: `content_validate` passes on a zero-instance folio **and** on a
two-instance folio.

_2026-09-19T00:41:16Z_ — Checked 2026-09-19 on main at 17dc1e6 — GENUINELY LIVE, not started. harness.config.example.json still carries a single 'contentType' key (line 3, value 'document') and describes it as selecting one adapter and one profile, so a folio is still one content instance. This bean's own gate — content_validate passing on a zero-instance and on a two-instance folio — cannot be met by the current model.

_2026-09-19T01:01:46Z_ — STOPPED WITHOUT IMPLEMENTING, 2026-09-19. Claimed this, investigated, and un-claimed it: Phase 0.3 is already built, and what shipped explicitly rejects this bean's framing.

Evidence on main at ecc6dab: cat-harness.json exists at the repository root; schemas/cat-harness.ts opens 'Issue #223, Phase 0.3'; schemas/cat-harness.test.ts carries a describe block named 'inheritance — the Phase 0.3 gate', 18 tests, all passing; skills/folio-core/directory-conventions.md documents it.

The rejection is explicit, in that module's own doc comment: 'The obvious reading of "a folio holds zero or more Content instances" is a list of instances under one contentType. That is the wrong shape, for a reason that only shows up once the five-repo split is real: the instances an agentic-harness holds are not folios at all.' The shipped model is an INSTANCE WITH DIRECTORIES, each holding a graph, with 'folio' one graph kind among several, distinguished only by being renderable.

So this bean's gate — content_validate passing on a zero-instance and a two-instance folio — is not reachable as written, because a folio-with-instances is not the object the codebase settled on. Building it would reintroduce the shape cat-harness.ts was written to avoid, and would make adapterForKind ambiguous across instances of different content types, which AGENTS.md names as the thing that makes QA criterion scoping unsound.

Set back to todo rather than left in-progress, since no work was done. NOT scrapped and NOT closed: whether this is fully superseded or has residual scope (the render path and the viewer are named in the body and were not checked) is the owner's call, and a scrapped bean needs its reasons from whoever owns it.

## Reasons for Scrapping

Scrapped 2026-09-19 on the owner's explicit instruction, after the
investigation recorded in the note above.

**Phase 0.3 shipped, and what shipped rejects this bean's premise.** The work
exists on `main`: `cat-harness.json` at the repository root,
`schemas/cat-harness.ts` opening "Issue #223, Phase 0.3",
`schemas/cat-harness.test.ts` with a describe block named "inheritance — the
Phase 0.3 gate" (18 tests, all passing), and
`skills/folio-core/directory-conventions.md` documenting it.

The premise here was that a folio should become a container of zero-or-more
Content instances. `schemas/cat-harness.ts` argues against that in its own doc
comment, and the argument is the reason to scrap rather than defer:

> The obvious reading of "a folio holds zero or more Content instances" is a
> list of instances under one `contentType`. That is the wrong shape, for a
> reason that only shows up once the five-repo split is real: the instances an
> `agentic-harness` holds are not folios at all.

The settled object is **an instance with directories, each holding a graph**,
with `folio` one renderable graph kind among several. An instance with no
`folio/` directory — `agentic-harness` — is then ordinary rather than a special
case, which the container model could not express.

**Two things this preserves, which is the point of scrapping rather than
deleting.** First, the gate written here — `content_validate` passing on a
zero-instance and on a two-instance folio — is not reachable under the shipped
model, because a folio-with-instances is not the object that model defines.
Anyone reading that gate later would otherwise try to satisfy it. Second,
building it would make `adapterForKind` ambiguous across instances of differing
content type, which `AGENTS.md` names as exactly what makes QA criterion
scoping unsound.

**Not carried forward.** The body named the render path and the viewer as
things a container model would touch. Neither was examined, because neither is
in question once the container model is off the table. If either turns out to
need work under the directory model, that is a new bean with its own
measurement, not a survival of this one.
