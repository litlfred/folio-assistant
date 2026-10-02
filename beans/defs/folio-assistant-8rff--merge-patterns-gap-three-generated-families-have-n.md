---
# folio-assistant-8rff
title: 'MERGE PATTERNS GAP: three generated families have no declared merge-conflict pattern, so merge:main refuses them and merge:overlap counts them as authored'
status: todo
type: bug
created_at: 2026-10-02T17:46:34Z
updated_at: 2026-10-02T17:46:34Z
---

Found by merge:overlap's first live run (bean blgm, PR #1895, 2026-10-02): 32 open PRs; 109 pairs overlapped on authored paths, and 19 of those overlapped ONLY on these three generated families. None is named in cat-harness/scripts/merge-conflict-patterns.ts PATTERNS or in .gitattributes, so they classify as authored.

| family | writer | check in CI | overlap count (pair-path hits) |
|---|---|---|---|
| `cat-harness/docs/assets/glossary/*.skos.jsonld` | `glossary:export` (cat-harness/scripts/glossary-export.ts) | `glossary:check` | 54 |
| `folio-assistant-core/glossary/generated/**` | `glossary:export` (verify by reading its write paths) | `glossary:check` | 50 |
| `cat-harness/docs/reference/skill-instructions/**` | `skills:docs` (cat-harness/scripts/gen-skill-docs.ts, OUT_DIR) | `skills:docs:check` | 30 |

Coordinator chose option (a): declare them as `take-base` patterns, each with its reason, following §'Adding a pattern' in the merge-conflict-patterns skill (one skill section per entry, a classify test per pattern with its authored neighbour refused). Not in PR #1895, which only reads the declaration.

Caution: `cat-harness/docs/assets/**/*.json` is already `site-data`; `.skos.jsonld` does not match it. Confirm each writer by reading the script before declaring, per the skill.

## Done when
- [ ] three PATTERNS entries with reasons, and skill sections
- [ ] merge-base.test.ts classifies each, with an authored neighbour refused
- [ ] merge:overlap re-run shows them as generated
