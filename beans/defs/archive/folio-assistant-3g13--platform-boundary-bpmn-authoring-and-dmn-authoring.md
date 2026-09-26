---
# folio-assistant-3g13
title: 'PLATFORM BOUNDARY: bpmn-authoring and dmn-authoring sit in a CONTENT-TYPE package'
status: completed
type: task
priority: normal
created_at: 2026-09-20T06:33:44Z
updated_at: 2026-09-20T07:59:41Z
parent: folio-assistant-zzmr
---

## The blocker this bean recorded was WRONG, and that is the finding

When I opened this bean under `ugid` I wrote that the move was held back
because "no manifest declares a dependency on another package, and the WHO
package is synced as a bundle, so moving them would quietly change what a WHO
folio's sync carries."

**The second half is false.** Measured 2026-09-20:

- `init-folio` links the platform as a **submodule** or a **sibling
  checkout**. A folio gets the WHOLE platform and resolves skills through the
  declaration.
- A folio's `skills` config points at `.claude/skills/local` — its OWN local
  skills, not a copied bundle.
- **No script copies a skill package anywhere.** No `cpSync`, no `rsync`, over
  `skills/`.

"Synced into a content repo as a folio-core bundle" is a sentence in
`folio-core`'s manifest `description` with **no implementing code**. I read it
as a mechanism and recorded a blocker on it without checking — which is the
thing this repository keeps writing down about counts in prose, applied to a
capability claim instead.

The first half stands: manifests genuinely declare no dependencies. It just
does not bear on this, because nothing resolves per-package.

## The move

Measured first: **zero** inbound markdown links, **zero** outbound. The three
`folio:skill ref`s and the three `roles.json` entries resolve by NAME, and
`schemas/skills/<name>/` is keyed by name rather than by package — so the
whole cost was two `git mv`s and two manifest edits.

`## For a DAK` stayed with `bpmn-authoring` rather than being split out. A
generic skill naming a domain worked example is ordinary; two skills that must
be read together to author one diagram are not. The skill now says why a DAK
section sits in a platform package, so the next reader does not re-open the
question.

## Summary of Changes

- `bpmn-authoring` and `dmn-authoring` → `skills/workflow/`.
- Both headers name the new package; `bpmn-authoring` carries the reason.
- Manifests updated; `authoring-who-smart-guidelines` is down to the seven
  skills that are genuinely WHO-specific.
- Verified: both still resolve, `check:workflow-refs` reports no dangling ref,
  43 fast gates and **46 with `--all`**.

## Done when

- [x] the two generic skills live in the package built for them
- [x] the blocker that deferred them is measured rather than assumed
- [x] no dangling ref, no dead link, gates green both sets
