---
# folio-assistant-anzn
title: Split the five genuinely over-length skills; personas for the two review roles
status: completed
type: task
priority: normal
created_at: 2026-09-19T00:08:37Z
updated_at: 2026-09-19T00:08:53Z
---


`kg:audit:strict` failed on `main` with 15 `major` findings, from two unrelated
criteria that the summary listing had run together.

## `role-has-persona` ×2 — a declaration to add

`narrative-reviewer` and `code-reviewer`, both added by #293, carried no
`persona`. Written from each role's own description. They also lacked `voice`
and `useCases`, which their sibling `reviewer` has — so the entries were
completed rather than minimally patched, which cleared 4 `minor` findings too.

## `skill-not-a-document` ×13 — and the trap in "fixing" it

Skills over 400 lines (p90). The criterion is a proxy for "an agent skims a
long skill and follows whichever part it happened to read", so it can be turned
green by DELETING content — worse skill, greener check. The honest fix is the
pattern `AGENTS.md` already prescribes for `MEMORY.md`: a short entry point that
routes, detail in siblings read on demand.

Author chose the five genuinely long ones; the eight at 415–450 sit barely over
a percentile line that moves as the corpus grows.

| skill | before | after | siblings |
|---|---|---|---|
| `integration-watcher` | 1281 | 240 | lifecycle, idle-backlog |
| `formalizer` | 842 | 231 | conventions, patterns, integration |
| `coordinate` | 732 | 271 | protocol |
| `lean-environment-setup` | 587 | 181 | mathlib-cache-fallback |
| `bib-qa` | 571 | 354 | qa-tags |

**Zero lines lost**, verified per skill by diffing the original's distinct
non-blank lines against the union of entry point and siblings.

**Section numbers are load-bearing and were preserved.** Children cite the
parent by number — `parent §4b`, `parent §5m`, `coordinate §0a`,
`coordinate.md §8a` — so renumbering would have broken ~12 cross-references in
other skills. Each entry point carries a table mapping every section to its
file, so those citations still resolve.

## The measurement that changed the fix

First pass took 13 findings to 12, not 8: `skillFiles()` walks `skills/`
recursively and called every `.md` a skill, so the four new siblings were
audited as skills and failed the same criterion. Splitting had traded five
findings for four.

Fixed at the discovery, not by moving files somewhere unscanned: a file that
declares `part-of:` is a part, not a skill. Declaration over location, because
"told apart by where it happens to sit" is the coincidence-not-contract problem
this repo keeps paying for. It cannot hide a real skill — the parent must exist
AND the file must sit inside that parent's directory. Falsified by adding
`part-of: integration-watcher` to `watch.md`: still audited as a skill.
