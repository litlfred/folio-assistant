---
# folio-assistant-fgvp
title: 'LATENT: the publication-base fallback has no repo-boundary check, so --instance on an outside checkout mints this site''s IRIs'
status: todo
type: task
created_at: 2026-09-21T16:23:29Z
updated_at: 2026-09-21T16:23:29Z
parent: folio-assistant-vke6
---

Observed while merging #718 into the `u1iu` branch, 2026-09-21. **Not a defect
today** — filed so it is not rediscovered as one.

## What was measured

`exportIdentity` (main, after #718):

    const ownCanonical = decl?.canonicalUrl ?? "";
    const publisherCanonical = ownCanonical ? "" : (readDeclaration(ROOT)?.canonicalUrl ?? "");

The fallback applies to ANY `instanceRoot`, with no check that it resolves
inside this repository.

## Why it is latent rather than live

The only in-tree caller is `skillHome`, which iterates
`instanceRootsIn(repoRootFor(ROOT))` — always inside. So no code path reaches
the case.

The CLI does: `kg-export.ts --instance ../some-other-checkout` would mint
`<this site>/<their-stub>.jsonld` for a document published somewhere this
repository cannot know about.

## Why that would matter

It is the hazard `makeIri` already refuses by name — an IRI that looks
dereferenceable and 404s is worse than an absent one, because a consumer reads
the first as a fact about the graph and the second as a fact about the export.
Before #718 that case produced a relative `@id` plus a reported problem, which
is the honest answer.

So this is a NARROWING of honesty that came free with a correct fix, on a path
nothing walks.

## Done when

- [ ] decide whether the CLI's `--instance` is a supported way to export a
      foreign checkout at all. If it is not, the fix may be to REFUSE an
      outside path rather than to fall back differently
- [ ] if it is supported: a path-boundary check (`relative()`, not
      `startsWith` — `/repo-other` is not a child of `/repo`), keeping the
      relative-IRI-plus-problem third state outside the repo
- [ ] a test that fails if an outside instance silently inherits this site

## Do not

Do not "fix" this by making cat-bootstrap declare a canonicalUrl. It has no
site; `40fl` settled that and its reasoning is right.
