---
# folio-assistant-jwd9
title: uses[] parsed four different hand-rolled ways; two can target the wrong field
status: completed
type: bug
priority: normal
created_at: 2026-08-08T13:07:50Z
updated_at: 2026-08-08T13:11:52Z
---

The editorial relation every ordering metric is computed from is extracted from .ts source text by four independent hand-rolled parsers. Measured 3 of 5 plausible inputs wrong in the audits' version.

- conditional-class-banner-audit.ts (a CI gate in witness-pipeline.yml) and conjectural-propagation-audit.ts share a verbatim copy using text.indexOf("uses:") with NO word boundary, then indexOf("]") for the end. A field named causes: matches, and the parser then returns THAT array's strings as dependencies. A ] inside any entry silently yields [].
- prune-transitive-deps.ts uses /uses:\s*\[[\s\S]*?\]/ — also no word boundary — and this is the WRITE path (content.replace(usesPattern, newUses)), so it can rewrite the wrong field in a content file.
- qa-checkers-extended.ts strips with \buses\s*:\s*\[[\s\S]*?\] — has the boundary, still non-greedy to the first ].

Fix: one shared, tested parser (word-boundary-correct field match, bracket- and string-aware scan to the matching ]) plus a span helper for the write path; repoint all four. Same defect family as the topLevelCut fix in PR #74.


## Summary of Changes

One parser (`content/pipeline/uses-field.ts`), four call sites repointed:
`conditional-class-banner-audit`, `conjectural-propagation-audit` (which held
verbatim copies of the same code), `prune-transitive-deps` (read + write), and
the `uses`/`cites` strip in `qa-checkers-extended`. 21 tests.

Correct means two things the old copies did not do: match `uses` as a whole
field name rather than a substring, and scan to the *matching* `]` with bracket
depth and string awareness rather than stopping at the first one.

### How live is this? Latent, and worth saying so plainly

The failing inputs were measured, but checked against `schemas/types.ts`
afterwards: **no schema field name contains `uses`**, so the `causes:`-style
collision cannot fire on schema-conformant content today. What can fire, on
content that breaks nothing:

- a prose field (`caption`, `summary`, `authorNotes`, `title`) containing the
  literal text `uses:` *before* the real field — `indexOf("uses:")` lands in
  the prose and the following `indexOf("[")` walks to whatever array comes
  next, typically `tags:`. That yields a plausible-looking dependency list
  made of tag strings.
- an entry containing `]`, which truncates the array and yields `[]` — a block
  that reads as having no editorial dependencies.

Neither was observed on real content; there is no folio in this container to
check against. So this is a latent-correctness fix in a CI gate
(`witness-pipeline.yml`) and a content-rewriting tool, not a repair of observed
damage. The consolidation is the durable part: four hand-rolled parsers of the
relation AGENTS.md calls the signal every ordering metric is computed from, now
one with tests.

### The write path was the worst of the four

`prune-transitive-deps` matched `/uses:\s*\[[\s\S]*?\]/` — no word boundary —
and then `content.replace(...)`. Demonstrated on a block carrying a
`causes: ["keep-me"]` field before `uses`:

    OLD replace:  causes: ["a"]        <- wrong field rewritten, uses[] left unpruned
    OLD remove:   "  ca"               <- truncated mid-token, invalid TypeScript
    NEW:          both correct

### Deferred

These parse TypeScript source with a scanner when the blocks are modules that
could simply be imported — `prune-transitive-deps` already imports them for
*reading* (`loadAllBlocks`) and only scans for *writing*. Replacing the scan
with a real edit against the loaded module is the better end state and a larger
change than this bug warranted. Worth a follow-up bean if the scanner bites
again.
