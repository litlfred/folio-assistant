---
# note on folio-assistant-gz47 from claude/lucid-shannon-o8zop1-foreign-paths
$schema: folio-bean-note/v1
bean: folio-assistant-gz47
branch: "claude/lucid-shannon-o8zop1-foreign-paths"
created: "2026-10-03"
---
## The ratchet: `check:foreign-paths`, agreeing with the hand audit to the site

Built 2026-10-03 by the Parcel B session, the step the earlier note proposed before the `docs` batch.

**What it is.** The cross-instance half of `check:declared-paths`. It reuses that gate's own scanner, imported rather than copied: comment stripping, path-call context, the first-literal rule, the template and sentence skips, and the `declared-path-literal:` marker. It asks a different question: does an instance's non-test source spell a path into a directory ANOTHER instance declares?

**The rule that keeps it from crying wolf** (measured, not guessed): a name is foreign only if the scanning instance does not declare a directory of the same name itself. That drops `docs/`, which the root and cat-harness both declare (145 of the first measurement's hits). Three more exclusions were each found on this corpus:
- a module specifier (`"../cat-harness/schemas/x.js"`) is code addressed by path;
- a literal nested in another call inside the path call (`resolve(opt("todos"))`) is an option name;
- a segment joined onto the INSTANCE's own root (`join(INSTANCE, "docs")`, fhir-harness) is that instance's directory.

**Result on main: exactly 8 sites in 4 files, and they are exactly the 8 that #2003 fixes** (bean-rollover, mvp-status ×5, beans-prime, sample-import-run). Once #2003 merges, the count is 0.

**A one-way ratchet,** like `check:standalone`. `scripts/foreign-path-baseline.json` holds per-file counts. A rise is red; a fall is reported with `bun run foreign-paths:baseline` and never red.

**Its known blind spot**, stated so it is not mistaken for coverage: only the FIRST literal of a path call is read. `resolve(opt("todos") ?? "todos")` hides its real default behind the option name. That one site (`review-comment-move.ts`) is fixed by hand in the same PR: it now defaults to the declared `todos` graph and refuses when none is declared.

**Tests:** 14 fixture tests, one per rule and exclusion, plus both directions of the ratchet.

## The `docs` batch: nothing for this bean to fix

The last of the five batches. Every `docs/...` literal outside its own instance is one of two things, and neither is a cross-instance read:
- **folio-relative** (`docs/audits/...` and similar): it addresses the FOLIO the tool runs against, not the platform's `docs/`. Those sites are already listed in `check:declared-paths`' baseline, which governs them;
- **a shared name**: the root and cat-harness both declare `docs`, so a `docs/` literal in either one is that instance's own. This is the rule the ratchet uses to drop 145 false hits.

So gz47's five batches come to: fsh-guts 4, todos 0, beans 4, uploads 3 composed paths, docs 0. The ratchet holds the 8 literal sites that remain on main until #2003 lands.
