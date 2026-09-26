---
# folio-assistant-osbo
title: src/skills is an undeclared knowledge-graph directory, and declaring it surfaces three hardcoded-path sites
status: completed
type: task
priority: normal
created_at: 2026-09-19T12:40:01Z
updated_at: 2026-09-19T15:24:16Z
parent: folio-assistant-vke6
---

## The measurement

`src/skills/` holds exactly one skill — `corpus-grep.md`, beside the
`corpus-grep.ts` that implements it — and it is **not a declared knowledge-graph
directory**. So `resolveSkillDirs` cannot see it, and `LOCAL_PACKAGES` names it
as an explicit exception (`CO_LOCATED_PACKAGES`) rather than discovering it.

Declaring it was tried and measured on 2026-09-19, not guessed:

- With `{ id: "cat-harness-src", path: "src/skills/", graphs: ["cat-harness"] }`
  added to `harness.json`, discovery reproduces the old hand-written table
  **exactly** — no gain, no loss.
- And `scripts/tests/declared-paths.test.ts` goes red: three files exceed their
  recorded baseline of hardcoded path literals —
  `scripts/gen-skill-docs.ts` 3 → 4, `scripts/tool-coverage.ts` 2 → 3,
  `scripts/check-agents-xref.ts` 0 → 1.

## Why it was not done in that change

That ratchet is real debt the declaration **surfaces rather than creates**: once
`src/skills/` is declared, a bare `"skills"` literal in those files names a
declared path they should be resolving. Raising a ratchet baseline to absorb it
would be recording new debt as though it were progress — the same shape as
pinning a coverage count as a regression guard.

Fixing the three sites is the actual work, and it did not belong in a change
whose subject was the skill overlay.

## Done when

- [x] the three sites are settled — TWO resolve from the declaration, and
      the third is a MARKED literal with its reason, which the ratchet
      explicitly permits
- [x] `src/skills/` is declared as `cat-harness-src` — a separate id, since
      overrides match on id and reusing `cat-harness` would REPLACE the graph
      rather than add to it
- [x] `CO_LOCATED_PACKAGES` is gone; `discoverLocalPackages` alone yields all
      seven packages
- [x] `declared-paths` is green and IMPROVED — 34 unaccounted against a
      baseline of 37, three fewer than before, while declaring a new directory


_2026-09-19_ — DONE, and the ratchet went DOWN rather than up: 34 unaccounted against a baseline of 37, three FEWER than before, while adding a declaration that was supposed to cost three. That is the whole shape of this bean — the three sites were not casualties of declaring `src/skills/`, they were debt the declaration exposed, and fixing them was cheaper than absorbing it. THE THREE, and they did not all want the same answer, which was the thing worth measuring: (1) `gen-skill-docs.ts` — `discoverGroups()` hardcoded `join(REPO_ROOT, "skills")`, so the manual `{ category: "Agent skills", dir: src/skills }` entry in GROUPS was not a duplicate, it was COMPENSATING for the same root-hardcoding. Now it reads kgRoots() and the manual entry is deleted. (2) `tool-coverage.ts` — same, declared part from kgRoots(), `.claude/skills/local` kept as a marked literal. (3) `check-agents-xref.ts` — this one KEEPS its literal, and the reason is real rather than a concession: `SKILL_ROOTS` is applied to ARBITRARY repository roots — `auditXrefs(repo(...), SKILL_ROOTS)` runs against fixture repos throughout its test file, which have no harness.json at all. Reading THIS instance's declaration there would answer a question about a different tree, which is worse than a literal because it would be confidently wrong rather than obviously fixed. The ratchet's own `declared-path-literal: <reason>` mechanism is exactly for this, and I had not noticed it existed when I opened the bean — "exempt, but the reason is required, so silencing the check costs more than satisfying it". THE RECURRING DISTINCTION, met for the THIRD time today and finally put where it belongs: a kg directory may hold skills DIRECTLY as well as in package subdirectories. `skills/` holds none directly; `src/skills/` holds corpus-grep.md at its root beside the .ts implementing it, and has no subdirectory at all. It bit discoverGroups, skillDirs and discoverLocalPackages in turn. The last is where it matters most: after declaring, LOCAL_PACKAGES silently dropped to SIX packages, losing `folio-assistant` — the exact package the exception existed for — because discovery only walked subdirectories. A directly-held set is now the INSTANCE's own package, named from the declaration's `name`, because there is no subdirectory name to take and that is in fact whose skills they are. MY OWN TEST HAD TO BE INVERTED: skill-fetch.test.ts asserted `discoverLocalPackages(ROOT)["folio-assistant"]` is UNDEFINED, which was correct when I wrote it hours ago and is exactly what this bean removes. Kept inverted rather than deleted, with the old claim recorded — "discovery cannot see it" was a real limitation and the test is now the record of it ending. Verified: full suite 2803 pass 0 fail; tsc and eslint clean; check:declared-paths, kg:audit:check, check:declared-assets, check:bean-parents, check:agents-xref, check:tools, check:schema-nodes, ns:check all rc=0; gen-skill-docs regenerates byte-identical output (170 bodies, no docs/ diff).
