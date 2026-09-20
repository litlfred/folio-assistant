---
# folio-assistant-wwi6
title: 'INITIATION: uploads/ and library/ are created at initiation, one as state and one not'
status: todo
type: feature
created_at: 2026-09-20T06:19:54Z
updated_at: 2026-09-20T06:19:54Z
parent: folio-assistant-o3xy
---

## The ask, owner 2026-09-20 (verbatim)

> also please add back uploads/ folder. it should be initiation skill of
> folio-asst-core/ and preseverd in the current folio-asst/ repo as state.
> library/ should also be added in at initation, but not as state by KG-Content.

## MEASURED FIRST, because "add back" turned out not to mean what it sounds like

Both directories are **present**, declared, and populated in this checkout,
measured 2026-09-20 on `claude/wonderful-gauss-7frcrw`:

| directory | declared in `cat-harness/harness.json` | on disk |
|---|---|---|
| `cat-harness/uploads/` | yes, `{id: "uploads", path: "uploads/", graphs: ["uploads"]}` | **present, 5 entries** |
| `cat-harness/library/` | yes, `{id: "library", path: "library/", graphs: ["library"]}` | **present, 5 entries** |

So nothing is missing here and nothing needs restoring. Recording that up front
so the next agent does not go looking for a deletion to revert, or "restore" a
directory over one that already has contents in it.

**The ask is therefore about INITIATION**, not about this checkout: what a
*newly initiated* instance gets. That makes it a direct sibling of `mggs`, which
just built the initiation step that creates and declares `folio/`
(`cat-harness/scripts/ensure-landing-sticky.ts`). The same script is the obvious
home, and `FOLIO_DIRECTORY_ENTRY` the obvious pattern to copy.

## Three distinctions in the ask that I cannot resolve from the repository

Flagged rather than guessed at, because each changes what gets built:

1. **"as state" vs "not as state."** `uploads/` is to be *"preserved in the
   current folio-asst repo as state"*; `library/` is to be added at initiation
   *"but not as state"*. Nothing in `schemas/cat-harness.ts` carries a notion of
   a directory being "state" — `ContentDirectory` has `id`, `path`, `graphs`,
   `scope`, `description` and the label shape, and `GraphKindDef` has `type`,
   `renderable` and `summary`. The nearest existing concept is
   `UNPUBLISHED_GRAPH_KINDS` (`["fsh-guts"]`) and `DeclarationScopeSchema`
   (`instance` | `repository`), and neither is obviously this. **Is "state" a
   new declared property, or an existing one under another name?**
2. **"initiation skill of folio-asst-core/."** `folio-assist-core` is a layer of
   the not-yet-done split (issue #223) and does not exist as a directory here —
   the roots today are `bootstrap/` and `cat-harness/`. `mggs` put the folio
   step in cat-harness initiation on the owner's ruling (*"cat-harness initaton
   craetes the folio/"*). **Does `uploads/` belong to a different layer's
   initiation than `folio/` does, and if so, where does that live before the
   split?**
3. **"by KG-Content."** A term that appears nowhere in the repository (`grep -ri
   "kg-content"` finds nothing). The `folio` graph kind's summary is *"Authored
   content, rendered to a website"*, and the sub-graph overview sticky calls
   this grouping **content**. **Is KG-Content the `folio` graph kind, the layer
   that owns it, or a third thing?**

## What is NOT in doubt

That initiation should create these alongside `folio/`, and that the mechanism
exists: `ensureLandingSticky` already creates a directory, declares it in
`harness.json` by a byte-preserving splice, and is idempotent with a `--check`
mode. Extending it to a list of directories is small. The three questions above
are about WHICH properties each entry carries, not about how to write it.

## Done when

- [ ] the three questions are answered
- [ ] initiation creates `uploads/` and `library/` when absent, declaring each in
      the same step (so `initialization.md` step 2's "create the directories the
      declaration names, and only those" stays true)
- [ ] whatever "state" turns out to be is a DECLARED property rather than a
      convention, since a convention is what `harness.json` exists to replace
- [ ] idempotent, and covered by the same `--check` gate as the folio step
- [ ] a test that the two are distinguishable, and that it can fail
