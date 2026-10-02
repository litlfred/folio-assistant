---
# folio-assistant-z7ev
title: 'CROSS-INSTANCE LIBRARY REFERENCE: a voice in who-style-guide citing a source in who-iris'
status: completed
type: task
priority: critical
created_at: 2026-09-20T08:02:10Z
updated_at: 2026-09-20T18:24:21Z
parent: folio-assistant-kupb
---

THE BLOCKER, and it is measured, not anticipated. `scripts/check-voices.ts:35` resolves `libraryId` as `library/<id>/sections/<sec>.md` against the VOICE'S OWN instance root. Move `voices/who-*.json` to `who-style-guide/` and every citation in all three stops resolving.

Bean `r1lz` predicted this on 2026-09-19 and named it in general: 'a skill derived from a source text in another repo would cite evidence its own instance cannot resolve.' This is that, arrived at.

THE SHAPE ALREADY EXISTS ONE GRAPH OVER. `resolveSkillDirs` in `schemas/harness-config.ts` computes a cross-instance overlay for the `kg` graph and `LOCAL_PACKAGES` is built from it, so `skill_fetch` already serves a dependency's packages. `library` needs the same treatment and does not have it.

DO NOT SOLVE IT WITH A RELATIVE PATH. `../who-iris/library/...` hardcodes a checkout layout into content, and the whole reason `folio_init` writes a builder shim is so the path to another instance is written down ONCE.

## Done when
- A source may cite `{ instance, libraryId, sectionId }`; the bare two-field form still validates and still means 'this instance'.
- `check:voices` resolves both forms and stays GREEN across the boundary — that is the falsifier for the whole split.
- An unresolvable instance FAILS; it is never silently treated as local.

## Closed 2026-09-20 — verified, not assumed

All three clauses checked against disk on `main` after #477 merged:

- **Both forms validate.** `library-ref.test.ts` "resolves a bare reference
  against the citing instance" and "resolves the SAME reference when the
  instance is named explicitly".
- **`check:voices` is GREEN across the boundary** — the falsifier for the whole
  split. Ran it: 4 voices, 37 rules, *"every rule cites a source that resolves,
  with a quote long enough to check"*, exit 0. The three `who-*` voices sit in
  `who-style-guide/voices/` and each carries `"instance": "who-iris"`.
- **An unresolvable instance FAILS.** `library-ref.ts` returns a typed
  `unknown-instance` failure, pinned by "an unknown instance is never silently
  treated as local".

Solved the way the bean asked for and not with a relative path:
`resolveLibraryRef` reads the target instance's own declaration.
